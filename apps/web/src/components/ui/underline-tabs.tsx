'use client';

import { useId, type ReactNode } from 'react';

import { cn } from '../../lib/utilities/cn';

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
 * Horizontal tab bar with a crisp 2px `#00b159` active bottom indicator and
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
            onClick={() => handleSelect(tabKey)}
            className={cn(
              'relative inline-flex h-[42px] shrink-0 items-center gap-2 border-b-2 text-sm transition-colors cursor-pointer',
              isActive
                ? 'border-[#00b159] font-semibold text-ink'
                : 'border-transparent font-normal text-ink-muted hover:text-ink',
            )}
          >
            {tab.icon}
            <span>{tab.label}</span>
            {count !== undefined ? (
              <span
                className={cn(
                  'inline-flex items-center rounded px-1.5 py-0.5 text-[11px] font-medium leading-none tabular',
                  tab.badgeTone === 'green'
                    ? 'border border-[#00b159] bg-[#e6f7ee] text-[#00994d]'
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
