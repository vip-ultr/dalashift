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
 * Segmented toggle bar modeled on OneSoil's `.form-tooglebox` (`#e9ecef` track
 * with a flat `#ffffff` active pill).
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
        'rounded-lg bg-[#e9ecef] p-1',
        fullWidth && 'w-full',
        stackOnMobile
          ? 'flex flex-col sm:flex-row gap-1 sm:gap-0 sm:items-center sm:h-[42px]'
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
                ? 'w-full sm:w-auto py-2 sm:py-0 min-h-[38px] sm:min-h-0 sm:h-[34px] text-xs sm:text-sm whitespace-normal sm:whitespace-nowrap'
                : cn(
                    size === 'md'
                      ? 'h-[34px] text-xs sm:text-sm'
                      : 'h-[26px] text-[11px] sm:text-xs',
                    'whitespace-nowrap',
                  ),
              'data-[state=active]:bg-surface-raised data-[state=active]:font-medium data-[state=active]:text-brand-primary',
              'data-[state=inactive]:font-normal data-[state=inactive]:text-[#5c6066] data-[state=inactive]:hover:text-ink',
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
