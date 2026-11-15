import { cva, type VariantProps } from 'class-variance-authority';
import type { HTMLAttributes, ReactNode } from 'react';

import { cn } from '../../lib/utilities/cn';

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium leading-5 whitespace-nowrap',
  {
    variants: {
      variant: {
        default: 'bg-[#f4f5f6] text-ink border border-[#e5e7eb]',
        accent: 'bg-[#00b159] text-white',
        pass: 'bg-[#e6f7ee] text-[#0a4232] border border-[#00b159]/25',
        farmer: 'bg-[#fdf6e5] text-[#8e5636] border border-[#ab6a43]/30',
        satellite: 'bg-[#e4edf4] text-[#3d6382] border border-[#76a1c2]/35',
        literature: 'bg-[#e4ede8] text-[#0a4232] border border-[#0a4232]/20',
        warning: 'bg-[#fdf6e5] text-[#b9770e] border border-[#b9770e]/25',
        danger: 'bg-[#fceeec] text-[#c0392b] border border-[#c0392b]/25',
        obsidian: 'bg-[#1f2022] text-white',
        Strong: 'bg-[#e6f7ee] text-[#0a4232] border border-[#00b159]/25',
        Moderate: 'bg-[#fdf6e5] text-[#b9770e] border border-[#b9770e]/25',
        Neutral: 'bg-[#f4f5f6] text-ink border border-[#e5e7eb]',
        Measured: 'bg-[#fdf6e5] text-[#8e5636] border border-[#ab6a43]/30',
        Modelled: 'bg-[#e4edf4] text-[#3d6382] border border-[#76a1c2]/35',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

export interface BadgeProps
  extends HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {
  readonly children: ReactNode;
}

export function Badge({ className, variant, children, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props}>
      {children}
    </span>
  );
}
