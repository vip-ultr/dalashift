'use client';

import type { ReactNode } from 'react';

import { cn } from '../../lib/utilities/cn';

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
}: SegmentedControlProps<T>) {
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
            type="button"
            role="tab"
            aria-selected={isActive}
            aria-label={opt.label}
            onClick={() => handleChange(opt.value)}
            className={cn(
              'inline-flex flex-1 items-center justify-center gap-1.5 rounded-md px-2.5 sm:px-3 transition-all cursor-pointer text-center',
              stackOnMobile
                ? 'w-full sm:w-auto py-2 sm:py-0 min-h-[38px] sm:min-h-0 sm:h-[34px] text-xs sm:text-sm whitespace-normal sm:whitespace-nowrap'
                : cn(
                    size === 'md'
                      ? 'h-[34px] text-xs sm:text-sm'
                      : 'h-[26px] text-[11px] sm:text-xs',
                    'whitespace-nowrap',
                  ),
              isActive
                ? 'bg-surface-raised font-medium text-ink shadow-[0_1px_2px_rgba(0,0,0,0.06)]'
                : 'font-normal text-[#5c6066] hover:text-ink',
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
