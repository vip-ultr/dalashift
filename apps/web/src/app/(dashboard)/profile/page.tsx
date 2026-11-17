'use client';

import { AlertCircle, CheckCircle2, Lock, LoaderCircle, UserCircle2 } from 'lucide-react';
import Link from 'next/link';
import * as React from 'react';
import { z } from 'zod';

import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { SegmentedControl } from '../../../components/ui/segmented-control';

const profileResponseSchema = z.object({
  profile: z.object({
    preferred_language: z.string().nullable().optional(),
    role: z.string().nullable().optional(),
  }),
});

const apiErrorSchema = z.object({ error: z.string() });

type Language = 'ha' | 'en';
type LanguageSelection = Language | 'unset';

function parseLanguage(value: string | null | undefined): Language | null {
  return value === 'ha' || value === 'en' ? value : null;
}

async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function getApiError(payload: unknown, fallback: string): string {
  const parsed = apiErrorSchema.safeParse(payload);
  return parsed.success ? parsed.data.error : fallback;
}

export default function ProfileSettingsPage(): React.JSX.Element {
  const [defaultLanguage, setDefaultLanguage] = React.useState<LanguageSelection>('unset');
  const [savedLanguage, setSavedLanguage] = React.useState<Language | null>(null);
  const [hasUnsupportedLanguage, setHasUnsupportedLanguage] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [profileLoaded, setProfileLoaded] = React.useState(false);
  const [authenticationRequired, setAuthenticationRequired] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [statusMessage, setStatusMessage] = React.useState<string | null>(null);

  React.useEffect(() => {
    let active = true;

    async function loadProfile(): Promise<void> {
      try {
        const response = await fetch('/api/profile', { cache: 'no-store' });
        const payload = await readJson(response);

        if (response.status === 401) {
          if (active) {
            setAuthenticationRequired(true);
            setErrorMessage(getApiError(payload, 'Sign in to load profile preferences.'));
          }
          return;
        }

        if (!response.ok) {
          throw new Error(getApiError(payload, 'Unable to load profile preferences.'));
        }

        const parsed = profileResponseSchema.safeParse(payload);
        if (!parsed.success) {
          throw new Error('The profile response was invalid.');
        }

        const storedLanguage = parsed.data.profile.preferred_language;
        const language = parseLanguage(storedLanguage);

        if (active) {
          setDefaultLanguage(language ?? 'unset');
          setSavedLanguage(language);
          setHasUnsupportedLanguage(Boolean(storedLanguage && !language));
          setProfileLoaded(true);
        }
      } catch (error) {
        if (active) {
          setErrorMessage(
            error instanceof Error ? error.message : 'Unable to load profile preferences.',
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadProfile();
    return () => {
      active = false;
    };
  }, []);

  async function saveLanguage(): Promise<void> {
    if (defaultLanguage === 'unset') return;

    setSaving(true);
    setErrorMessage(null);
    setStatusMessage(null);

    try {
      const response = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preferredLanguage: defaultLanguage }),
      });
      const payload = await readJson(response);

      if (response.status === 401) {
        setAuthenticationRequired(true);
        setErrorMessage(getApiError(payload, 'Sign in to save profile preferences.'));
        return;
      }

      if (!response.ok) {
        throw new Error(getApiError(payload, 'Unable to save the language preference.'));
      }

      const parsed = profileResponseSchema.safeParse(payload);
      if (!parsed.success || parsed.data.profile.preferred_language !== defaultLanguage) {
        throw new Error('The saved language preference could not be confirmed.');
      }

      setSavedLanguage(defaultLanguage);
      setHasUnsupportedLanguage(false);
      setStatusMessage('Language preference saved to your profile.');
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Unable to save the language preference.',
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleSignOut(): Promise<void> {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } finally {
      window.location.href = '/login?signout=true';
    }
  }

  const languageChanged = savedLanguage !== defaultLanguage || hasUnsupportedLanguage;

  return (
    <div className="min-h-screen bg-[#f6f4ef] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="rounded-[12px] border border-[#e5e7eb] bg-white p-6 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#ebfaef] text-[#00b159]">
              <UserCircle2 className="h-7 w-7" aria-hidden="true" />
            </div>
            <div>
              <h1 className="font-display text-xl font-bold text-[#111315]">Profile Preferences</h1>
              <p className="text-xs text-[#6b7280]">
                Save your preferred language and review coordinate privacy settings.
              </p>
            </div>
          </div>

          <div className="mt-6 space-y-5 border-t border-[#e5e7eb] pt-5">
            <section aria-labelledby="language-heading">
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                <div>
                  <h2 id="language-heading" className="text-sm font-semibold text-[#111315]">
                    Preferred Language
                  </h2>
                  <p className="text-xs text-[#6b7280]">
                    Saved to your profile for screens that support this language preference.
                  </p>
                </div>
                <fieldset
                  disabled={loading || saving || !profileLoaded || authenticationRequired}
                  className="m-0 border-0 p-0"
                >
                  <SegmentedControl
                    size="sm"
                    ariaLabel="Preferred language"
                    value={defaultLanguage}
                    onValueChange={(language) => {
                      setDefaultLanguage(language);
                      setErrorMessage(null);
                      setStatusMessage(null);
                    }}
                    options={
                      defaultLanguage === 'unset'
                        ? [
                            { value: 'unset', label: 'Not set' },
                            { value: 'ha', label: 'English + Hausa' },
                            { value: 'en', label: 'English Only' },
                          ]
                        : [
                            { value: 'ha', label: 'English + Hausa' },
                            { value: 'en', label: 'English Only' },
                          ]
                    }
                  />
                </fieldset>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-3">
                {loading ? (
                  <p
                    role="status"
                    className="inline-flex items-center gap-2 text-xs text-[#6b7280]"
                  >
                    <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
                    Loading profile preferences...
                  </p>
                ) : (
                  <>
                    <Button
                      type="button"
                      size="sm"
                      disabled={
                        !profileLoaded ||
                        saving ||
                        authenticationRequired ||
                        defaultLanguage === 'unset' ||
                        !languageChanged
                      }
                      onClick={() => void saveLanguage()}
                    >
                      {saving ? 'Saving...' : 'Save language preference'}
                    </Button>
                    {defaultLanguage !== 'unset' &&
                      savedLanguage === defaultLanguage &&
                      !hasUnsupportedLanguage && (
                        <p className="text-xs text-[#6b7280]">
                          This preference is saved to your profile.
                        </p>
                      )}
                    {defaultLanguage === 'unset' && !hasUnsupportedLanguage && profileLoaded && (
                      <p className="text-xs text-[#6b7280]">
                        No language preference is saved. Choose a language to save one.
                      </p>
                    )}
                    {defaultLanguage === 'unset' && hasUnsupportedLanguage && (
                      <p className="text-xs text-[#6b7280]">
                        The saved language is not supported here. Choose a language to replace it.
                      </p>
                    )}
                    {defaultLanguage !== 'unset' && !savedLanguage && (
                      <p className="text-xs text-[#6b7280]">
                        {hasUnsupportedLanguage
                          ? 'The saved language is not supported here. Save this choice to replace it.'
                          : 'No language preference is saved yet.'}
                      </p>
                    )}
                    {statusMessage && (
                      <p
                        role="status"
                        className="inline-flex items-center gap-1.5 text-xs text-[#0b4f2f]"
                      >
                        <CheckCircle2 className="h-4 w-4 text-[#00b159]" aria-hidden="true" />
                        {statusMessage}
                      </p>
                    )}
                  </>
                )}
              </div>
            </section>

            <section
              aria-labelledby="coordinate-privacy-heading"
              className="border-t border-[#f3f4f6] pt-4"
            >
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                <div>
                  <h2
                    id="coordinate-privacy-heading"
                    className="flex items-center gap-1.5 text-sm font-semibold text-[#111315]"
                  >
                    <Lock className="h-4 w-4 text-[#00b159]" aria-hidden="true" />
                    Coordinate Redaction in Printable Reports
                  </h2>
                  <p className="text-xs text-[#6b7280]">
                    Exact GPS coordinates are always omitted from printable and shareable field
                    sheets. This privacy protection is enforced and cannot be changed here.
                  </p>
                </div>
                <Badge variant="Strong">Always Redacted</Badge>
              </div>
            </section>

            {errorMessage && (
              <div
                role="alert"
                className="flex items-start gap-2 border-t border-[#f3f4f6] pt-4 text-sm text-red-700"
              >
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                <div>
                  <p>{errorMessage}</p>
                  {authenticationRequired && (
                    <Link href="/login" className="mt-1 inline-block underline">
                      Sign in to manage profile preferences
                    </Link>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-end gap-2 border-t border-[#e5e7eb] pt-4">
            <Link href="/cases">
              <Button variant="secondary" size="sm">
                <span>Open Case Studies</span>
              </Button>
            </Link>
            <Button type="button" variant="outline" size="sm" onClick={handleSignOut}>
              <span>Sign out</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
