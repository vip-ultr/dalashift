import { cva, type VariantProps } from 'class-variance-authority';
import type { ButtonHTMLAttributes, ReactNode } from 'react';

import { cn } from '../../lib/utilities/cn';

const focusRing =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0a4232] focus-visible:ring-offset-2 focus-visible:ring-offset-white';

const buttonVariants = cva(
  `inline-flex items-center justify-center gap-2 font-medium transition-colors duration-150 motion-reduce:transition-none cursor-pointer disabled:pointer-events-none disabled:opacity-50 select-none ${focusRing}`,
  {
    variants: {
      variant: {
        primary: 'bg-[#0a4232] text-white hover:bg-[#072f24]',
        forest: 'bg-[#0a4232] text-white hover:bg-[#072f24]',
        secondary: 'bg-white text-ink border border-border hover:bg-surface-subtle',
        accent: 'bg-[#c26e4a] text-white hover:bg-[#a95d3c]',
        outline:
          'border border-[#0a4232] bg-transparent text-[#0a4232] hover:bg-brand-primary-tint',
        ghost: 'bg-transparent text-ink-muted hover:bg-surface-subtle hover:text-ink',
        tonal: 'bg-brand-primary-tint text-[#0a4232] hover:bg-[#d8e8e0]',
        destructive: 'bg-[#fef2f2] text-[#b91c1c] border border-[#fecaca] hover:bg-[#fee2e2]',
      },
      size: {
        xs: 'h-7 px-2.5 text-xs rounded-[10px]',
        sm: 'h-8 px-3 text-xs rounded-[10px]',
        md: 'h-11 px-4 text-base rounded-[10px]',
        lg: 'h-11 px-5 text-base rounded-[10px]',
        icon: 'size-11 rounded-[10px]',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  },
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  readonly children?: ReactNode;
}

export function Button({
  className,
  variant,
  size,
  type = 'button',
  children,
  ...props
}: ButtonProps) {
  return (
    <button type={type} className={cn(buttonVariants({ variant, size }), className)} {...props}>
      {children}
    </button>
  );
}
