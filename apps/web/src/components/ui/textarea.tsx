import type { TextareaHTMLAttributes } from 'react';

import { cn } from '../../lib/utilities/cn';

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  readonly hasError?: boolean;
}

export function Textarea({ className, hasError = false, ...props }: TextareaProps) {
  return (
    <textarea
      className={cn(
        'min-h-[96px] w-full rounded-lg border-2 bg-surface-raised px-[13px] py-[10px] text-[16px] leading-6 text-ink placeholder:text-[#a5b2bc] transition-colors outline-none',
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
