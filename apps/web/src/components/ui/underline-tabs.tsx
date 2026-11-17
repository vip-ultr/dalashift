'use client';

import { useId, type ReactNode } from 'react';

import { cn } from '../../lib/utilities/cn';

const focusRing =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0a4232] focus-visible:ring-offset-2 focus-visible:ring-offset-white';

export interface UnderlineTabItem<T extends string> {
  readonly id?: T;
  readonly value?: T;
  readonly label: string;
  readonly badge?: number | string;
  readonly badgeCount?: number | string;
  readonly badgeTone?: 'green' | 'neutral' | 'warning';
  readonly icon?: ReactNode;
}

export interface UnderlineTabsProps<T extends string> {
  readonly tabs: readonly UnderlineTabItem<T>[];
  readonly activeTab?: T;
  readonly value?: T;
  readonly onSelect?: (tabId: T) => void;
  readonly onValueChange?: (tabId: T) => void;
  readonly ariaLabel?: string;
  readonly className?: string;
  /** Prefix for generated tab and panel ids. Consumers should put matching
   * `id={`${panelIdPrefix}-panel-${id}`}` and `role="tabpanel"` on the panel. */
  readonly panelIdPrefix?: string;
}

/**
 * Horizontal tab bar with a crisp 2px brand green active bottom indicator and
 * optional pill count badge (`Data +13` style).
 */
export function UnderlineTabs<T extends string>({
  tabs,
  activeTab,
  value,
  onSelect,
  onValueChange,
  ariaLabel,
  className,
  panelIdPrefix,
}: UnderlineTabsProps<T>) {
  const generatedPrefix = useId();
  const idPrefix = panelIdPrefix ?? generatedPrefix;
  const current = value ?? activeTab;
  const handleSelect = (tabId: T) => {
    onSelect?.(tabId);
    onValueChange?.(tabId);
  };

  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={cn(
        'flex items-center gap-6 overflow-x-auto border-b border-border px-1',
        className,
      )}
    >
      {tabs.map((tab) => {
        const tabKey = (tab.id ?? tab.value) as T;
        const count = tab.badge ?? tab.badgeCount;
        const isActive = tabKey === current;
        return (
          <button
            key={tabKey}
            id={`${idPrefix}-tab-${tabKey}`}
            type="button"
            role="tab"
            aria-selected={isActive}
            aria-controls={`${idPrefix}-panel-${tabKey}`}
            data-state={isActive ? 'active' : 'inactive'}
            onClick={() => handleSelect(tabKey)}
            className={cn(
              'relative inline-flex h-[42px] shrink-0 items-center gap-2 border-b-2 text-sm transition-colors duration-150 motion-reduce:transition-none cursor-pointer',
              'data-[state=active]:border-brand-primary data-[state=active]:font-semibold data-[state=active]:text-ink',
              'data-[state=inactive]:border-transparent data-[state=inactive]:font-normal data-[state=inactive]:text-ink-muted data-[state=inactive]:hover:text-ink',
              focusRing,
            )}
          >
            {tab.icon}
            <span>{tab.label}</span>
            {count !== undefined ? (
              <span
                className={cn(
                  'inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium leading-none tabular',
                  tab.badgeTone === 'green'
                    ? 'border border-brand-primary/25 bg-brand-primary-tint text-brand-primary'
                    : tab.badgeTone === 'warning'
                      ? 'border border-[#b9770e]/40 bg-[#fdf6e5] text-[#b9770e]'
                      : 'bg-[#f4f5f6] text-ink-muted',
                )}
              >
                {count}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
