import { cva, type VariantProps } from 'class-variance-authority';
import type { ButtonHTMLAttributes, ReactNode } from 'react';

import { cn } from '../../lib/utilities/cn';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 font-medium transition-all duration-150 cursor-pointer disabled:pointer-events-none disabled:opacity-50 select-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0a4232]',
  {
    variants: {
      variant: {
        primary:
          'bg-[#0a4232] text-white shadow-xs hover:bg-[#072f24] active:scale-[0.99]',
        secondary:
          'bg-white text-[#111827] border border-[#e5e7eb] shadow-xs hover:bg-[#f9fafb] hover:border-[#d1d5db] active:bg-[#f3f4f6]',
        accent:
          'bg-[#c26e4a] text-white shadow-xs hover:bg-[#a95d3c] active:scale-[0.99]',
        outline:
          'border border-[#0a4232] bg-transparent text-[#0a4232] hover:bg-[#eaf2ee]',
        ghost:
          'bg-transparent text-[#4b5563] hover:bg-[#f3f4f6] hover:text-[#111827]',
        tonal:
          'bg-[#eaf2ee] text-[#0a4232] hover:bg-[#d8e8e0]',
        destructive:
          'bg-[#dc2626] text-white hover:bg-[#b91c1c]',
      },
      size: {
        xs: 'h-7 px-2.5 text-xs rounded-md',
        sm: 'h-8 px-3 text-xs rounded-lg',
        md: 'h-10 px-4 text-sm rounded-lg',
        lg: 'h-11 px-5 text-base rounded-lg',
        icon: 'size-9 rounded-lg',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  },
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
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
    <button
      type={type}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    >
      {children}
    </button>
  );
}
