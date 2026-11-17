'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import * as React from 'react';

import { useLanguage } from '../../i18n/language-provider';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { LanguageSwitcher } from '../ui/language-switcher';
import { SegmentedControl } from '../ui/segmented-control';

export interface AuthCardProps {
  readonly initialMode: 'login' | 'register';
}

export function AuthCard({ initialMode }: AuthCardProps): React.JSX.Element {
  const router = useRouter();
  const { t } = useLanguage();
  const [mode, setMode] = React.useState<'login' | 'register'>(initialMode);
  const [fullName, setFullName] = React.useState('');
  const [identifier, setIdentifier] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [consentAccepted, setConsentAccepted] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  const handleModeSwitch = (nextMode: 'login' | 'register') => {
    setMode(nextMode);
    setErrorMessage(null);
    router.push(nextMode === 'login' ? '/login' : '/register');
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);

    const accountIdentifier = identifier.trim();
    if (!accountIdentifier || !password) {
      setErrorMessage('Please enter your phone number or email and password.');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('Your password must be at least 6 characters long.');
      return;
    }

    if (mode === 'register' && !fullName.trim()) {
      setErrorMessage('Please enter your full name.');
      return;
    }

    if (mode === 'register' && !consentAccepted) {
      setErrorMessage('Please accept the privacy notice to create an account.');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(mode === 'login' ? '/api/auth/login' : '/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          mode === 'login'
            ? { identifier: accountIdentifier, password }
            : {
                fullName: fullName.trim(),
                identifier: accountIdentifier,
                password,
                role: 'farmer',
                consentAccepted,
              },
        ),
      });
      const result: unknown = await response.json();

      if (!response.ok) {
        const message =
          typeof result === 'object' &&
          result !== null &&
          'error' in result &&
          typeof result.error === 'string'
            ? result.error
            : 'Unable to access your account. Please try again.';
        setErrorMessage(message);
        return;
      }

      const nextUrl =
        typeof window !== 'undefined'
          ? new URLSearchParams(window.location.search).get('next')
          : null;
      const destination =
        nextUrl && nextUrl.startsWith('/') && !nextUrl.startsWith('//')
          ? nextUrl
          : mode === 'register'
            ? '/farms/new'
            : '/dashboard';
      router.push(destination);
    } catch {
      setErrorMessage('Unable to connect to the account service. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col justify-center bg-[#fafafb] px-4 py-8 text-[#111315]">
      <div className="mx-auto w-full max-w-[392px]">
        {/* Brand header row: logo and language switcher, aligned right */}
        <div className="mb-6 flex items-center justify-between gap-3">
          <Link href="/">
            <Image
              src="/brand/logo-horizontal.svg"
              alt="DalaShift"
              width={140}
              height={32}
              priority
              className="h-8 w-auto"
            />
          </Link>
          <LanguageSwitcher />
        </div>

        {/* Card */}
        <div className="rounded-[16px] border border-[#e5e7eb] bg-white p-7 shadow-xs">
          <div className="text-center">
            <h1 className="font-display text-xl font-bold tracking-tight text-[#111315]">
              {mode === 'login' ? t('auth.signInTitle') : t('auth.createAccountTitle')}
            </h1>
          </div>

          <div className="mt-5">
            <SegmentedControl
              fullWidth
              ariaLabel="Authentication mode"
              value={mode}
              onValueChange={handleModeSwitch}
              options={[
                { value: 'login', label: t('auth.signInAction') },
                { value: 'register', label: t('auth.createAccountAction') },
              ]}
            />
          </div>

          <form onSubmit={handleSubmit} className="mt-5 space-y-4" noValidate>
            {mode === 'register' ? (
              <div className="space-y-1.5">
                <Label htmlFor="auth-fullname">{t('auth.fullName')}</Label>
                <Input
                  id="auth-fullname"
                  type="text"
                  placeholder={t('auth.fullName')}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  autoComplete="name"
                />
              </div>
            ) : null}

            <div className="space-y-1.5">
              <Label htmlFor="auth-identifier">{t('auth.emailOrPhone')}</Label>
              <Input
                id="auth-identifier"
                type="text"
                placeholder={t('auth.emailOrPhone')}
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                autoComplete="username"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="auth-password">{t('auth.password')}</Label>
              <Input
                id="auth-password"
                type="password"
                placeholder={t('auth.password')}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              />
            </div>

            {mode === 'register' ? (
              <div className="flex items-start gap-2.5 rounded-lg border border-[#e5e7eb] bg-[#fafafb] px-3 py-2.5">
                <input
                  id="auth-consent"
                  type="checkbox"
                  checked={consentAccepted}
                  onChange={(e) => setConsentAccepted(e.target.checked)}
                  className="mt-0.5 size-4 shrink-0 cursor-pointer accent-[#0a4232]"
                />
                <label htmlFor="auth-consent" className="text-xs leading-relaxed text-[#4b5563]">
                  {t('auth.consent')}
                </label>
              </div>
            ) : null}

            {errorMessage ? (
              <div
                role="alert"
                className="rounded-lg border border-[#f5c2c0] bg-[#fdeceb] px-3 py-2 text-xs font-medium text-[#b42318]"
              >
                <div>{errorMessage}</div>
                {mode === 'register' && errorMessage.toLowerCase().includes('already exists') ? (
                  <button
                    type="button"
                    onClick={() => handleModeSwitch('login')}
                    className="mt-1.5 block cursor-pointer font-bold text-[#0a4232] underline hover:text-[#072f24]"
                  >
                    {t('auth.switchToSignIn')}
                  </button>
                ) : null}
              </div>
            ) : null}

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full"
              disabled={submitting}
            >
              <span>
                {submitting
                  ? 'Please wait...'
                  : mode === 'login'
                    ? t('auth.signInAction')
                    : t('auth.createAccountAction')}
              </span>
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
