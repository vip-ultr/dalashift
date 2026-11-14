import type { InputHTMLAttributes } from 'react';

import { cn } from '../../lib/utilities/cn';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  readonly hasError?: boolean;
}

/**
 * Form input following the OneSoil 42px height, 16px text size, and crisp 2px
 * green focus border convention.
 */
export function Input({ className, hasError = false, ...props }: InputProps) {
  return (
    <input
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
