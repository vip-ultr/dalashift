import type { HTMLAttributes } from 'react';

import { cn } from '../../lib/utilities/cn';

export function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden="true"
      className={cn('animate-pulse rounded-lg bg-[#e5e7eb]/80', className)}
      {...props}
    />
  );
}
