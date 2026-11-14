'use client';

import type { ReactNode } from 'react';

import { cn } from '../../lib/utilities/cn';

export interface UnderlineTabItem<T extends string> {
  readonly id: T;
  readonly label: string;
  readonly badgeCount?: number | string;
  readonly badgeTone?: 'green' | 'neutral' | 'warning';
  readonly icon?: ReactNode;
}

export interface UnderlineTabsProps<T extends string> {
  readonly tabs: readonly UnderlineTabItem<T>[];
  readonly activeTab: T;
  readonly onSelect: (tabId: T) => void;
  readonly className?: string;
}

/**
 * Horizontal tab bar with a crisp 2px `#00b159` active bottom indicator and
 * optional pill count badge (`Data +13` style).
 */
export function UnderlineTabs<T extends string>({
  tabs,
  activeTab,
  onSelect,
  className,
}: UnderlineTabsProps<T>) {
  return (
    <div
      role="tablist"
      className={cn(
        'flex items-center gap-6 overflow-x-auto border-b border-border px-1',
        className,
      )}
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onSelect(tab.id)}
            className={cn(
              'relative inline-flex h-[42px] shrink-0 items-center gap-2 border-b-2 text-sm transition-colors cursor-pointer',
              isActive
                ? 'border-[#00b159] font-semibold text-ink'
                : 'border-transparent font-normal text-ink-muted hover:text-ink',
            )}
          >
            {tab.icon}
            <span>{tab.label}</span>
            {tab.badgeCount !== undefined ? (
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
                {tab.badgeCount}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
