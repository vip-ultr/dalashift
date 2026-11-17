'use client';

import { Eye, EyeOff } from 'lucide-react';
import { useState, type InputHTMLAttributes } from 'react';

import { cn } from '../../lib/utilities/cn';

const focusRing =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0a4232] focus-visible:ring-offset-2 focus-visible:ring-offset-white';

const inputBase =
  'min-h-11 w-full rounded-[10px] border bg-surface-raised px-3 text-[16px] leading-5 text-ink placeholder:text-ink-faint transition-colors duration-150 motion-reduce:transition-none disabled:cursor-not-allowed disabled:bg-surface-subtle disabled:text-ink-muted';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  readonly hasError?: boolean;
}

export function Input({ className, hasError = false, type, ...props }: InputProps) {
  const [showPassword, setShowPassword] = useState(false);

  const stateClasses = cn(
    hasError ? 'border-[#b91c1c] hover:border-[#991b1b]' : 'border-border hover:border-[#d1d5db]',
    focusRing,
  );

  if (type === 'password') {
    return (
      <div className="relative w-full">
        <input
          type={showPassword ? 'text' : 'password'}
          aria-invalid={hasError || undefined}
          className={cn(inputBase, 'h-11 pr-11', stateClasses, className)}
          {...props}
        />
        <button
          type="button"
          onClick={() => setShowPassword((prev) => !prev)}
          className={cn(
            'absolute right-1.5 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-md text-ink-muted transition-colors hover:text-ink motion-reduce:transition-none',
            focusRing,
          )}
          aria-label={showPassword ? 'Hide password' : 'Show password'}
        >
          {showPassword ? <EyeOff className="size-4.5" /> : <Eye className="size-4.5" />}
        </button>
      </div>
    );
  }

  return (
    <input
      type={type}
      aria-invalid={hasError || undefined}
      className={cn(inputBase, 'h-11', stateClasses, className)}
      {...props}
    />
  );
}
