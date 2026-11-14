'use client';

import type { ReactNode } from 'react';

import { cn } from '../../lib/utilities/cn';

export interface SegmentedOption<T extends string> {
  readonly value: T;
  readonly label: string;
  readonly icon?: ReactNode;
}

export interface SegmentedControlProps<T extends string> {
  readonly options: readonly SegmentedOption<T>[];
  readonly value: T;
  readonly onChange: (next: T) => void;
  readonly size?: 'sm' | 'md';
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
  size = 'md',
  className,
  ariaLabel,
}: SegmentedControlProps<T>) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={cn(
        'inline-flex items-center rounded-lg bg-[#e9ecef] p-1',
        size === 'md' ? 'h-[42px]' : 'h-[34px]',
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
            onClick={() => onChange(opt.value)}
            className={cn(
              'inline-flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 transition-all cursor-pointer whitespace-nowrap',
              size === 'md' ? 'h-[34px] text-sm' : 'h-[26px] text-xs',
              isActive
                ? 'bg-surface-raised font-medium text-ink shadow-[0_1px_2px_rgba(0,0,0,0.06)]'
                : 'font-normal text-[#5c6066] hover:text-ink',
            )}
          >
            {opt.icon}
            <span>{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}
