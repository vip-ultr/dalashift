import { cva, type VariantProps } from 'class-variance-authority';
import type { ButtonHTMLAttributes, ReactNode } from 'react';

import { cn } from '../../lib/utilities/cn';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 font-medium transition-colors cursor-pointer disabled:pointer-events-none disabled:opacity-50 select-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00b159]',
  {
    variants: {
      variant: {
        primary: 'bg-[#00b159] text-white hover:bg-[#00994d] active:bg-[#008542]',
        forest: 'bg-[#0a4232] text-white hover:bg-[#0e5440]',
        secondary:
          'bg-surface-raised text-ink border border-[#d1d5db] hover:bg-[#f4f5f6] active:bg-[#e5e7eb]',
        tonal: 'bg-[#f4f5f6] text-ink hover:bg-[#e5e7eb]',
        obsidian:
          'bg-[#1f2022]/90 text-white backdrop-blur-md hover:bg-[#1f2022] border border-white/10',
        ghost: 'bg-transparent text-ink hover:bg-[#f4f5f6]',
        outline:
          'bg-transparent text-ink border border-[#d1d5db] hover:bg-[#f4f5f6] active:bg-[#e5e7eb]',
        destructive: 'bg-[#c0392b] text-white hover:bg-[#a93226]',
      },
      size: {
        xs: 'h-8 px-3 text-xs rounded-full',
        sm: 'h-9 px-4 text-sm rounded-full',
        md: 'h-11 px-5 text-sm rounded-full',
        lg: 'h-[50px] px-6 text-base rounded-[10px]',
        icon: 'size-10 rounded-lg',
        iconPill: 'size-10 rounded-full',
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
