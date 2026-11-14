'use client';

import { AlertTriangle, Clock, Inbox, RefreshCw } from 'lucide-react';
import type { ReactNode } from 'react';

import { cn } from '../../lib/utilities/cn';
import { formatObservationDate } from '../../lib/utilities/format';
import { Button } from '../ui/button';
import { Skeleton } from '../ui/skeleton';

export type DataViewState = 'ready' | 'loading' | 'empty' | 'error' | 'stale';

export interface DataStateBoundaryProps {
  readonly state: DataViewState;
  readonly emptyKind?: 'no-crops' | 'no-data' | 'no-parcels';
  readonly sourceName?: string;
  readonly lastObservedAt?: string | null;
  readonly errorMessage?: string;
  readonly onRetry?: () => void;
  readonly onPrimaryAction?: () => void;
  readonly primaryActionLabel?: string;
  readonly children?: ReactNode;
  readonly className?: string;
}

/**
 * Cross-cutting data state wrapper implementing the four required states from
 * docs/product/user-flows.md section 7: Loading (skeleton), Empty (distinguishing
 * no-crops vs no-data), Error (upstream unavailable), and Stale (observation age
 * + refresh button).
 */
export function DataStateBoundary({
  state,
  emptyKind = 'no-data',
  sourceName = 'Environmental data service',
  lastObservedAt,
  errorMessage,
  onRetry,
  onPrimaryAction,
  primaryActionLabel,
  children,
  className,
}: DataStateBoundaryProps) {
  if (state === 'loading') {
    return (
      <div
        role="status"
        aria-live="polite"
        aria-label="Loading field analysis"
        className={cn(
          'space-y-4 rounded-xl border border-border bg-surface-raised p-5',
          className,
        )}
      >
        <div className="flex items-center justify-between gap-4">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-6 w-24 rounded-full" />
        </div>
        <Skeleton className="h-4 w-3/4" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Skeleton className="h-24 w-full rounded-xl" />
          <Skeleton className="h-24 w-full rounded-xl" />
          <Skeleton className="h-24 w-full rounded-xl" />
        </div>
        <Skeleton className="h-4 w-64" />
      </div>
    );
  }

  if (state === 'empty') {
    const copy =
      emptyKind === 'no-crops'
        ? {
            title: 'No crops recorded on this parcel yet',
            body: 'Add the crops you currently grow, grew last season, or plan to plant so DalaShift can compare rotation strategies against your baseline.',
            action: primaryActionLabel ?? 'Add parcel crops',
          }
        : emptyKind === 'no-parcels'
          ? {
              title: 'No parcels added to this farm yet',
              body: 'Capture a GPS point with accuracy radius or draw your field boundary on the map to begin parcel-level analysis.',
              action: primaryActionLabel ?? '+ Add parcel',
            }
          : {
              title: 'No environmental observations cached for this parcel yet',
              body: 'Open the parcel and refresh to retrieve NASA POWER climate records, CHIRPS rainfall, and SMAP soil moisture for this location.',
              action: primaryActionLabel ?? 'Fetch observations',
            };

    return (
      <div
        className={cn(
          'flex flex-col items-center justify-center rounded-xl border border-border bg-[#f4f5f6] px-6 py-10 text-center',
          className,
        )}
      >
        <div className="mb-3 flex size-11 items-center justify-center rounded-full bg-surface-raised text-ink-muted shadow-xs">
          <Inbox className="size-5" />
        </div>
        <h3 className="text-base font-semibold text-ink">{copy.title}</h3>
        <p className="mt-1.5 max-w-md text-sm text-ink-muted">{copy.body}</p>
        {onPrimaryAction ? (
          <Button
            variant="primary"
            size="sm"
            onClick={onPrimaryAction}
            className="mt-4"
          >
            {copy.action}
          </Button>
        ) : null}
      </div>
    );
  }

  if (state === 'error') {
    return (
      <div
        role="alert"
        className={cn(
          'rounded-xl border border-[#c0392b]/30 bg-[#fceeec] p-5 text-ink',
          className,
        )}
      >
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 size-5 shrink-0 text-[#c0392b]" />
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-[#c0392b]">
              {sourceName} is temporarily unavailable
            </h3>
            <p className="mt-1 text-sm text-ink">
              {errorMessage ??
                `${sourceName} could not be reached right now. Your farm, parcel geometry, and crop records are saved safely. Try again in a few minutes.`}
            </p>
            {onRetry ? (
              <Button
                variant="secondary"
                size="xs"
                onClick={onRetry}
                className="mt-3"
              >
                <RefreshCw className="size-3.5" />
                Try again
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('space-y-3', className)}>
      {state === 'stale' ? (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[#b9770e]/30 bg-[#fdf6e5] px-3.5 py-2 text-xs text-[#8e5636]">
          <span className="inline-flex items-center gap-1.5">
            <Clock className="size-3.5 shrink-0" />
            Cached observation from {formatObservationDate(lastObservedAt)}. Refresh when connected to check for newer satellite passes.
          </span>
          {onRetry ? (
            <button
              type="button"
              onClick={onRetry}
              className="inline-flex items-center gap-1 font-semibold text-ink underline-offset-2 hover:underline cursor-pointer"
            >
              <RefreshCw className="size-3" />
              Refresh now
            </button>
          ) : null}
        </div>
      ) : null}
      {children}
    </div>
  );
}
