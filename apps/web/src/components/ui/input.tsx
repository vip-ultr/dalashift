'use client';

import { Eye, EyeOff } from 'lucide-react';
import { useState, type InputHTMLAttributes } from 'react';

import { cn } from '../../lib/utilities/cn';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  readonly hasError?: boolean;
}

/**
 * Form input following the OneSoil 42px height, 16px text size, and crisp 2px
 * green focus border convention.
 */
export function Input({ className, hasError = false, type, ...props }: InputProps) {
  const [showPassword, setShowPassword] = useState(false);

  if (type === 'password') {
    return (
      <div className="relative w-full">
        <input
          type={showPassword ? 'text' : 'password'}
          className={cn(
            'h-[42px] w-full rounded-lg border-2 bg-surface-raised px-[13px] py-[9px] pr-10 text-[16px] leading-5 text-ink placeholder:text-[#a5b2bc] transition-colors outline-none',
            hasError
              ? 'border-[#c0392b] focus:border-[#c0392b]'
              : 'border-[#a5b2bc]/35 hover:border-[#a5b2bc]/55 focus:border-[#00b159]',
            'disabled:cursor-not-allowed disabled:bg-[#f5f7f9] disabled:text-[#8e959e]',
            className,
          )}
          {...props}
        />
        <button
          type="button"
          onClick={() => setShowPassword((prev) => !prev)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9ca3af] hover:text-[#111827] cursor-pointer transition-colors p-0.5 focus:outline-none"
          aria-label={showPassword ? 'Hide password' : 'Show password'}
          title={showPassword ? 'Hide password' : 'Show password'}
        >
          {showPassword ? <EyeOff className="size-4.5" /> : <Eye className="size-4.5" />}
        </button>
      </div>
    );
  }

  return (
    <input
      type={type}
      className={cn(
        'h-[42px] w-full rounded-lg border-2 bg-surface-raised px-[13px] py-[9px] text-[16px] leading-5 text-ink placeholder:text-[#a5b2bc] transition-colors outline-none',
        hasError
          ? 'border-[#c0392b] focus:border-[#c0392b]'
          : 'border-[#a5b2bc]/35 hover:border-[#a5b2bc]/55 focus:border-[#00b159]',
        'disabled:cursor-not-allowed disabled:bg-[#f5f7f9] disabled:text-[#8e959e]',
        className,
      )}
      {...props}
    />
  );
}
