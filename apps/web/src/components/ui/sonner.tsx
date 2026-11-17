'use client';

import { Toaster as SonnerToaster, type ToasterProps } from 'sonner';

import { cn } from '../../lib/utilities/cn';

export { toast } from 'sonner';

export function Toaster({ className, toastOptions, ...props }: ToasterProps) {
  return (
    <SonnerToaster
      theme="light"
      position="bottom-right"
      closeButton
      className={cn('toaster', className)}
      toastOptions={{
        classNames: {
          toast: 'rounded-[10px] border border-border bg-surface-raised text-ink',
          title: 'text-sm font-semibold leading-5 text-ink',
          description: 'text-xs leading-5 text-ink-muted',
          actionButton: 'rounded-md bg-brand-primary text-white',
          cancelButton: 'rounded-md bg-surface-subtle text-ink',
          closeButton: 'rounded-md text-ink-muted',
        },
        ...toastOptions,
      }}
      {...props}
    />
  );
}
