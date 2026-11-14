'use client';

import { ArrowRight, CheckCircle2, Lock, ShieldCheck, Sprout } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import * as React from 'react';

import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { SegmentedControl } from '../ui/segmented-control';

export interface AuthCardProps {
  readonly initialMode: 'login' | 'register';
}

export function AuthCard({ initialMode }: AuthCardProps): React.JSX.Element {
  const router = useRouter();
  const [mode, setMode] = React.useState<'login' | 'register'>(initialMode);
  const [role, setRole] = React.useState<'farmer' | 'extension_officer'>('farmer');
  const [fullName, setFullName] = React.useState('');
  const [identifier, setIdentifier] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [consentChecked, setConsentChecked] = React.useState(true);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  const handleModeSwitch = (nextMode: 'login' | 'register') => {
    setMode(nextMode);
    setErrorMessage(null);
    router.push(nextMode === 'login' ? '/login' : '/register');
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);

    if (!identifier.trim() || !password.trim()) {
      setErrorMessage('Please enter your phone number or email and password.');
      return;
    }

    if (mode === 'register' && !consentChecked) {
      setErrorMessage(
        'Please confirm the farm data privacy disclosure before creating an account.',
      );
      return;
    }

    setSubmitting(true);
    window.setTimeout(() => {
      setSubmitting(false);
      router.push(mode === 'register' ? '/farms/new' : '/farms');
    }, 250);
  };

  return (
    <div className="flex min-h-screen flex-col justify-between bg-[#fafafb] text-[#111315]">
      {/* Minimal Top Bar */}
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-5 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-[#00b159] text-white shadow-xs">
            <Sprout className="h-5 w-5" aria-hidden="true" />
          </span>
          <span className="font-display text-lg font-bold tracking-tight text-[#111315]">
            DalaShift
          </span>
        </Link>

        <Link
          href="/cases"
          className="inline-flex items-center gap-1.5 rounded-full border border-[#e5e7eb] bg-white px-3.5 py-1.5 text-xs font-medium text-[#374151] shadow-2xs transition-colors hover:border-[#00b159] hover:text-[#111315]"
        >
          <span>View Tofa LGA Case Studies</span>
          <ArrowRight className="h-3.5 w-3.5 text-[#00b159]" aria-hidden="true" />
        </Link>
      </header>

      {/* Centered 380px Auth Container */}
      <main className="mx-auto flex w-full max-w-[392px] flex-1 flex-col justify-center px-4 py-8">
        <div className="rounded-[16px] border border-[#e5e7eb] bg-white p-6 shadow-sm sm:p-7">
          <div className="space-y-1.5 text-center">
            <h1 className="font-display text-2xl font-bold tracking-tight text-[#111315]">
              {mode === 'login' ? 'Welcome back' : 'Create your account'}
            </h1>
            <p className="text-xs text-[#6b7280]">
              {mode === 'login'
                ? 'Sign in to view your registered farm parcels and seasonal guidance.'
                : 'Register your farm parcels or advise farmers as an extension officer.'}
            </p>
          </div>

          <div className="mt-5">
            <SegmentedControl
              fullWidth
              ariaLabel="Authentication mode"
              value={mode}
              onValueChange={handleModeSwitch}
              options={[
                { value: 'login', label: 'Sign in' },
                { value: 'register', label: 'Create account' },
              ]}
            />
          </div>

          <form onSubmit={handleSubmit} className="mt-5 space-y-4" noValidate>
            {mode === 'register' ? (
              <>
                <div className="space-y-1.5">
                  <Label htmlFor="auth-fullname">Full name</Label>
                  <Input
                    id="auth-fullname"
                    type="text"
                    placeholder="e.g. Bello Yusuf Maitama"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    autoComplete="name"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label>Account role</Label>
                  <SegmentedControl
                    fullWidth
                    size="sm"
                    ariaLabel="Account role"
                    value={role}
                    onValueChange={setRole}
                    options={[
                      { value: 'farmer', label: 'Smallholder Farmer' },
                      {
                        value: 'extension_officer',
                        label: 'Extension Officer (Malamin Gona)',
                      },
                    ]}
                  />
                </div>
              </>
            ) : null}

            <div className="space-y-1.5">
              <Label htmlFor="auth-identifier">Email or phone number</Label>
              <Input
                id="auth-identifier"
                type="text"
                placeholder="farmer@example.org or +234..."
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                autoComplete="username"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="auth-password">Password</Label>
              <Input
                id="auth-password"
                type="password"
                placeholder="Enter at least 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              />
            </div>

            {mode === 'register' ? (
              <div className="rounded-[10px] border border-[#e5e7eb] bg-[#f4f5f6] p-3 text-xs text-[#374151]">
                <label className="flex cursor-pointer items-start gap-2.5">
                  <input
                    type="checkbox"
                    checked={consentChecked}
                    onChange={(e) => setConsentChecked(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-[#d1d5db] accent-[#00b159]"
                  />
                  <span className="leading-relaxed">
                    <strong>Farm data privacy (ADR-0006):</strong> Your farm
                    location is used only to retrieve environmental data for
                    your land and is never shared publicly without your explicit
                    consent.
                  </span>
                </label>
              </div>
            ) : null}

            {errorMessage ? (
              <div
                role="alert"
                className="rounded-[8px] border border-[#f5c2c0] bg-[#fdeceb] px-3 py-2 text-xs font-medium text-[#b42318]"
              >
                {errorMessage}
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
                  ? 'Opening workspace...'
                  : mode === 'login'
                    ? 'Sign in to workspace'
                    : 'Create account & add farm'}
              </span>
            </Button>
          </form>

          {/* Direct Demo / Guest Access Shortcut */}
          <div className="mt-5 border-t border-[#e5e7eb] pt-4 text-center">
            <p className="text-xs text-[#6b7280]">
              Reviewing for the hackathon or working offline in the field?
            </p>
            <Link
              href="/cases"
              className="mt-1.5 inline-flex items-center gap-1 text-xs font-semibold text-[#00b159] hover:underline"
            >
              <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Explore Doka Village Case Studies without signing in</span>
            </Link>
          </div>
        </div>
      </main>

      <footer className="py-4 text-center text-[11px] text-[#6b7280]">
        Protected by Supabase Row-Level Security (RLS) · Farmers only read their
        own farm records.
      </footer>
    </div>
  );
}
