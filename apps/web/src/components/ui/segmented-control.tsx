'use client';

import { useId, type ReactNode } from 'react';

import { cn } from '../../lib/utilities/cn';

const focusRing =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0a4232] focus-visible:ring-offset-2 focus-visible:ring-offset-white';

export interface SegmentedOption<T extends string> {
  readonly value: T;
  readonly label: string;
  readonly shortLabel?: string;
  readonly icon?: ReactNode;
}

export interface SegmentedControlProps<T extends string> {
  readonly options: readonly SegmentedOption<T>[];
  readonly value: T;
  readonly onChange?: (next: T) => void;
  readonly onValueChange?: (next: T) => void;
  readonly size?: 'sm' | 'md';
  readonly fullWidth?: boolean;
  readonly stackOnMobile?: boolean;
  readonly className?: string;
  readonly ariaLabel?: string;
  /** Prefix for generated tab and panel ids. Consumers should put matching
   * `id={`${panelIdPrefix}-panel-${value}`}` and `role="tabpanel"` on the
   * content each option controls. */
  readonly panelIdPrefix?: string;
}

/**
 * Brand-compliant segmented toggle bar: a subtle, hairline-bordered track with
 * a solid brand-primary active pill and quiet ink-muted inactive labels.
 */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  onValueChange,
  size = 'md',
  fullWidth = false,
  stackOnMobile = false,
  className,
  ariaLabel,
  panelIdPrefix,
}: SegmentedControlProps<T>) {
  const generatedPrefix = useId();
  const idPrefix = panelIdPrefix ?? generatedPrefix;
  const handleChange = (next: T) => {
    onChange?.(next);
    onValueChange?.(next);
  };

  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={cn(
        'rounded-lg border border-border bg-surface-subtle p-1',
        fullWidth && 'w-full',
        stackOnMobile
          ? 'flex min-w-0 flex-col gap-1 lg:h-[42px] lg:flex-row lg:items-center lg:gap-0'
          : cn('inline-flex items-center', size === 'md' ? 'h-[42px]' : 'h-[34px]'),
        className,
      )}
    >
      {options.map((opt) => {
        const isActive = opt.value === value;
        return (
          <button
            key={opt.value}
            id={`${idPrefix}-tab-${opt.value}`}
            type="button"
            role="tab"
            aria-selected={isActive}
            aria-controls={`${idPrefix}-panel-${opt.value}`}
            aria-label={opt.label}
            data-state={isActive ? 'active' : 'inactive'}
            onClick={() => handleChange(opt.value)}
            className={cn(
              'inline-flex flex-1 items-center justify-center gap-1.5 rounded-md px-2.5 sm:px-3 transition-colors duration-150 motion-reduce:transition-none cursor-pointer text-center',
              stackOnMobile
                ? 'w-full min-w-0 py-2 lg:w-auto lg:py-0 min-h-[38px] lg:min-h-0 lg:h-[34px] text-xs lg:text-sm whitespace-normal lg:whitespace-nowrap'
                : cn(
                    size === 'md' ? 'h-[34px] text-xs sm:text-sm' : 'h-[26px] text-xs',
                    'whitespace-nowrap',
                  ),
              'data-[state=active]:bg-brand-primary data-[state=active]:font-semibold data-[state=active]:text-white data-[state=active]:ring-1 data-[state=active]:ring-brand-primary/20',
              'data-[state=inactive]:font-normal data-[state=inactive]:text-ink-muted data-[state=inactive]:hover:text-brand-primary',
              focusRing,
            )}
          >
            {opt.icon}
            {opt.shortLabel ? (
              <>
                <span className="sm:hidden" aria-hidden="true">
                  {opt.shortLabel}
                </span>
                <span className="hidden sm:inline">{opt.label}</span>
              </>
            ) : (
              <span>{opt.label}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
