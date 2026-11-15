'use client';

import Image from 'next/image';
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
    <div className="flex min-h-screen flex-col justify-center bg-[#fafafb] px-4 py-8 text-[#111315]">
      <div className="mx-auto w-full max-w-[392px]">
        {/* Brand Header */}
        <div className="mb-6 flex justify-center">
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
        </div>

        {/* Card */}
        <div className="rounded-[16px] border border-[#e5e7eb] bg-white p-7 shadow-xs">
          <div className="text-center">
            <h1 className="font-display text-xl font-bold tracking-tight text-[#111315]">
              {mode === 'login' ? 'Sign in to DalaShift' : 'Create your account'}
            </h1>
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
                  placeholder="Your full name"
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
                placeholder="name@example.com or phone"
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
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              />
            </div>

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
                {submitting ? 'Please wait...' : mode === 'login' ? 'Sign in' : 'Create account'}
              </span>
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
