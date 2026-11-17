import type { LabelHTMLAttributes, ReactNode } from 'react';

import { cn } from '../../lib/utilities/cn';

export interface LabelProps extends LabelHTMLAttributes<HTMLLabelElement> {
  readonly children: ReactNode;
  readonly optional?: boolean;
}

export function Label({ className, children, optional = false, ...props }: LabelProps) {
  return (
    <label
      className={cn(
        'mb-1.5 flex items-center justify-between text-sm font-medium text-ink',
        className,
      )}
      {...props}
    >
      <span>{children}</span>
      {optional ? <span className="text-xs font-normal text-ink-muted">Optional</span> : null}
    </label>
  );
}
