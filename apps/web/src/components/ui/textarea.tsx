import type { TextareaHTMLAttributes } from 'react';

import { cn } from '../../lib/utilities/cn';

const focusRing =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0a4232] focus-visible:ring-offset-2 focus-visible:ring-offset-white';

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  readonly hasError?: boolean;
}

export function Textarea({ className, hasError = false, ...props }: TextareaProps) {
  return (
    <textarea
      aria-invalid={hasError || undefined}
      className={cn(
        'min-h-24 w-full rounded-[10px] border bg-surface-raised px-3 py-2.5 text-[16px] leading-6 text-ink placeholder:text-ink-faint transition-colors duration-150 motion-reduce:transition-none',
        hasError
          ? 'border-[#b91c1c] hover:border-[#991b1b]'
          : 'border-border hover:border-[#d1d5db]',
        focusRing,
        'disabled:cursor-not-allowed disabled:bg-surface-subtle disabled:text-ink-muted',
        className,
      )}
      {...props}
    />
  );
}
