'use client';

import { AlertCircle, Lock, UserCircle2 } from 'lucide-react';
import Link from 'next/link';
import * as React from 'react';
import { z } from 'zod';

import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { LanguageSwitcher } from '../../../components/ui/language-switcher';
import { useLanguage } from '../../../i18n/language-provider';
import { signOut } from '../../../lib/auth/sign-out';

const profileResponseSchema = z.object({
  profile: z.object({
    preferred_language: z.string().nullable().optional(),
    role: z.string().nullable().optional(),
  }),
});

const apiErrorSchema = z.object({ error: z.string() });

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
  const { t } = useLanguage();
  const [authenticationRequired, setAuthenticationRequired] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

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
      } catch (error) {
        if (active) {
          setErrorMessage(
            error instanceof Error ? error.message : 'Unable to load profile preferences.',
          );
        }
      }
    }

    void loadProfile();
    return () => {
      active = false;
    };
  }, []);

  async function handleSignOut(): Promise<void> {
    setErrorMessage(null);
    const result = await signOut();
    if (!result.ok) {
      setErrorMessage(result.error);
      return;
    }
    window.location.assign('/login');
  }

  return (
    <div className="min-h-screen bg-[#f6f4ef] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="rounded-[12px] border border-[#e5e7eb] bg-white p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#eaf2ee] text-[#0a4232]">
              <UserCircle2 className="h-7 w-7" aria-hidden="true" />
            </div>
            <div>
              <h1 className="font-display text-xl font-bold text-[#111315]">{t('nav.settings')}</h1>
              <p className="text-sm text-[#6b7280]">
                Choose your language and review coordinate privacy settings.
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
                    Your choice is saved to your profile and applies across the app right away.
                  </p>
                </div>
                <LanguageSwitcher />
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
                    <Lock className="h-4 w-4 text-[#0a4232]" aria-hidden="true" />
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
                className="flex items-start gap-2 border-t border-[#f3f4f6] pt-4 text-sm text-[#b42318]"
              >
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                <div>
                  <p>{errorMessage}</p>
                  {authenticationRequired && (
                    <Link href="/login" className="mt-1 inline-block underline">
                      {t('nav.signIn')}
                    </Link>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-end gap-2 border-t border-[#e5e7eb] pt-4">
            <Button type="button" variant="outline" size="sm" onClick={handleSignOut}>
              <span>{t('nav.signOut')}</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
