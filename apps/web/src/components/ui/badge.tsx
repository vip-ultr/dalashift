import { cva, type VariantProps } from 'class-variance-authority';
import type { HTMLAttributes, ReactNode } from 'react';

import { cn } from '../../lib/utilities/cn';

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium leading-5 whitespace-nowrap',
  {
    variants: {
      variant: {
        default: 'bg-[#f4f5f6] text-[#4b5563] border border-[#e5e7eb]',
        primary: 'bg-[#eaf2ee] text-[#0a4232] border border-[#0a4232]/20',
        accent: 'bg-[#f9efea] text-[#c26e4a] border border-[#c26e4a]/25',
        pass: 'bg-[#eaf2ee] text-[#0a4232] border border-[#0a4232]/20',
        farmer: 'bg-[#f9efea] text-[#c26e4a] border border-[#c26e4a]/25',
        satellite: 'bg-[#f0f4f8] text-[#2c5282] border border-[#2c5282]/20',
        warning: 'bg-[#fef9ee] text-[#b45309] border border-[#b45309]/20',
        danger: 'bg-[#fef2f2] text-[#b91c1c] border border-[#b91c1c]/20',
        obsidian: 'bg-[#111827] text-white',
        Strong: 'bg-[#eaf2ee] text-[#0a4232] border border-[#0a4232]/20',
        Moderate: 'bg-[#fef9ee] text-[#b45309] border border-[#b45309]/20',
        Weak: 'bg-[#fef2f2] text-[#b91c1c] border border-[#b91c1c]/20',
        Measured: 'bg-[#f0f4f8] text-[#2c5282] border border-[#2c5282]/20',
        Modelled: 'bg-[#f9efea] text-[#c26e4a] border border-[#c26e4a]/25',
        Neutral: 'bg-[#f4f5f6] text-[#4b5563] border border-[#e5e7eb]',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

export interface BadgeProps
  extends HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  readonly children: ReactNode;
}

export function Badge({ className, variant, children, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props}>
      {children}
    </span>
  );
}
