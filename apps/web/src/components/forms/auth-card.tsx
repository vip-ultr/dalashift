'use client';

import Image from 'next/image';
import { ArrowRight, ShieldCheck } from 'lucide-react';
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
  const [fullName, setFullName] = React.useState('');
  const [identifier, setIdentifier] = React.useState('');
  const [password, setPassword] = React.useState('');
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
                consentAccepted: true,
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

      router.push(mode === 'register' ? '/farms/new' : '/dashboard');
    } catch {
      setErrorMessage('Unable to connect to the account service. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col justify-between bg-[#fafafb] text-[#111315]">
      {/* Minimal Top Bar */}
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-5 sm:px-6">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/brand/logo-horizontal.svg"
            alt="DalaShift"
            width={130}
            height={30}
            priority
            className="h-7 w-auto"
          />
        </Link>

        <Link
          href="/cases"
          className="inline-flex items-center gap-1.5 rounded-full border border-[#e5e7eb] bg-white px-3.5 py-1.5 text-xs font-medium text-[#4b5563] shadow-2xs transition-colors hover:border-[#0a4232] hover:text-[#0a4232]"
        >
          <span>View Tofa LGA Case Studies</span>
          <ArrowRight className="h-3.5 w-3.5 text-[#0a4232]" aria-hidden="true" />
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
                : 'Create an account to register your farm parcels and view environmental intelligence.'}
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
              <p className="text-[11px] text-[#6b7280]">
                Use an email or phone number (for example, 080... or +234...).
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="auth-password">Password</Label>
              <Input
                id="auth-password"
                type="password"
                placeholder="Enter at least 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              />
            </div>

            {mode === 'register' ? (
              <div className="rounded-[10px] border border-[#e5e7eb] bg-[#f4f5f6] p-3 text-xs text-[#374151]">
                <p className="leading-relaxed">
                  <strong>Farm data privacy:</strong> Your farm location is used only to
                  retrieve environmental data for your land and is never shared publicly
                  without your explicit consent.
                </p>
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
        Your session is private and time-limited. Database Row-Level Security protects each farmer's
        records.
      </footer>
    </div>
  );
}
