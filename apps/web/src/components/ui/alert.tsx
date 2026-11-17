import { cva, type VariantProps } from 'class-variance-authority';
import { AlertCircle, AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import type { ComponentPropsWithoutRef, ReactNode } from 'react';

import { cn } from '../../lib/utilities/cn';

const alertVariants = cva(
  'relative flex w-full gap-3 rounded-[10px] border p-4 text-sm leading-6',
  {
    variants: {
      variant: {
        default: 'border-border bg-surface-subtle text-ink',
        info: 'border-brand-primary/20 bg-brand-primary-tint text-brand-primary',
        warning: 'border-[#b45309]/25 bg-[#fef9ee] text-[#7c4a03]',
        danger: 'border-[#b91c1c]/25 bg-[#fef2f2] text-[#991b1b]',
        success: 'border-[#00b159]/30 bg-[#e6f7ee] text-[#007a3d]',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

const variantIcons = {
  default: Info,
  info: Info,
  warning: AlertTriangle,
  danger: AlertCircle,
  success: CheckCircle2,
} as const;

export interface AlertProps
  extends Omit<ComponentPropsWithoutRef<'div'>, 'title'>, VariantProps<typeof alertVariants> {
  readonly title?: ReactNode;
  readonly children?: ReactNode;
  readonly icon?: ReactNode;
}

export function Alert({
  className,
  variant = 'default',
  title,
  children,
  icon,
  ...props
}: AlertProps) {
  const Icon = variantIcons[variant ?? 'default'];

  return (
    <div role="status" className={cn(alertVariants({ variant }), className)} {...props}>
      <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center" aria-hidden="true">
        {icon ?? <Icon className="size-5" />}
      </span>
      <div className="min-w-0 flex-1">
        {title ? <div className="font-semibold leading-5">{title}</div> : null}
        {children ? <div className="mt-0.5 leading-5 [&_a]:underline">{children}</div> : null}
      </div>
    </div>
  );
}

export function AlertTitle({ className, ...props }: ComponentPropsWithoutRef<'div'>) {
  return <div className={cn('font-semibold leading-5', className)} {...props} />;
}

export function AlertDescription({ className, ...props }: ComponentPropsWithoutRef<'div'>) {
  return <div className={cn('mt-0.5 leading-5', className)} {...props} />;
}
