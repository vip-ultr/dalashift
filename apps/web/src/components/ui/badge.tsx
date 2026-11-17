import { cva, type VariantProps } from 'class-variance-authority';
import type { HTMLAttributes, ReactNode } from 'react';

import { cn } from '../../lib/utilities/cn';

const neutral = 'bg-surface-subtle text-ink-muted border border-border';
const forest = 'bg-brand-primary-tint text-brand-primary border border-brand-primary/20';
const terracotta = 'bg-brand-accent-tint text-[#9a4f2f] border border-brand-accent/25';
const amber = 'bg-[#fef9ee] text-[#b45309] border border-[#b45309]/20';
const red = 'bg-[#fef2f2] text-[#b91c1c] border border-[#b91c1c]/20';
const inkNeutral = 'bg-[#f4f5f6] text-[#374151] border border-[#d1d5db]';

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium leading-5 whitespace-nowrap',
  {
    variants: {
      variant: {
        default: neutral,
        Neutral: neutral,
        primary: forest,
        pass: forest,
        literature: forest,
        Strong: forest,
        accent: terracotta,
        farmer: terracotta,
        Modelled: terracotta,
        warning: amber,
        Moderate: amber,
        danger: red,
        Weak: red,
        satellite: inkNeutral,
        Measured: inkNeutral,
        obsidian: 'bg-[#111827] text-white',
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
