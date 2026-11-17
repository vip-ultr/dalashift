'use client';

import { AlertTriangle, Clock, Inbox, RefreshCw, WifiOff } from 'lucide-react';
import type { ReactNode } from 'react';

import { cn } from '../../lib/utilities/cn';
import { formatObservationDate } from '../../lib/utilities/format';
import { Button } from '../ui/button';
import { Skeleton } from '../ui/skeleton';

export type DataViewState =
  'ready' | 'loading' | 'empty' | 'error' | 'stale' | 'partial' | 'offline';

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
  readonly missingSources?: readonly string[];
  readonly offlineMessage?: string;
}

/**
 * Cross-cutting data state wrapper for every data view in the dashboard.
 *
 * States:
 * - loading: skeleton while the first fetch is in flight
 * - empty: no stored data, split by no-crops / no-parcels / no-data
 * - error: the upstream service could not be reached
 * - stale: saved data shown because the latest refresh failed
 * - partial: saved data shown, but one or more named sources did not load
 * - offline: the device has no connection, saved data kept visible
 * - ready: current data, shown with no banner
 *
 * Retry callbacks are supplied by each page and perform a real refetch.
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
  missingSources,
  offlineMessage,
}: DataStateBoundaryProps) {
  if (state === 'loading') {
    return (
      <div
        role="status"
        aria-live="polite"
        aria-label="Loading field analysis"
        className={cn('space-y-4 rounded-xl border border-border bg-surface-raised p-5', className)}
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
            title: 'No crops added for this parcel yet',
            body: 'Add the crops you grow now or plan to grow next season. DalaShift will compare your rotation options against your current practice.',
            action: primaryActionLabel ?? 'Add parcel crops',
          }
        : emptyKind === 'no-parcels'
          ? {
              title: 'No parcels added for this farm yet',
              body: 'Add a field by dropping a pin with its accuracy radius or drawing its boundary on the map to start parcel analysis.',
              action: primaryActionLabel ?? '+ Add parcel',
            }
          : {
              title: 'No saved observations for this parcel yet',
              body: 'Open the parcel and refresh to load climate records, rainfall, and soil moisture for this location.',
              action: primaryActionLabel ?? 'Fetch observations',
            };

    return (
      <div
        role="status"
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
          <Button variant="primary" size="sm" onClick={onPrimaryAction} className="mt-4">
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
        className={cn('rounded-xl border border-[#c0392b]/30 bg-[#fceeec] p-5 text-ink', className)}
      >
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 size-5 shrink-0 text-[#c0392b]" />
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-[#c0392b]">
              We cannot reach {sourceName} right now
            </h3>
            <p className="mt-1 text-sm text-ink">
              {errorMessage ??
                'We could not reach the service just now. Your farm and parcel records are saved and safe. Try again in a few minutes.'}
            </p>
            {onRetry ? (
              <Button variant="secondary" size="xs" onClick={onRetry} className="mt-3">
                <RefreshCw className="size-3.5" />
                Try again
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    );
  }

  let banner: ReactNode = null;

  if (state === 'stale') {
    banner = (
      <div
        role="status"
        className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[#b9770e]/30 bg-[#fdf6e5] px-3.5 py-2 text-xs text-[#8e5636]"
      >
        <span className="inline-flex items-center gap-1.5">
          <Clock className="size-3.5 shrink-0" />
          Showing saved observations from {formatObservationDate(lastObservedAt)}. Connect to the
          internet and refresh to check for newer data.
        </span>
        {onRetry ? (
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex cursor-pointer items-center gap-1 font-semibold text-ink underline-offset-2 hover:underline"
          >
            <RefreshCw className="size-3" />
            Refresh now
          </button>
        ) : null}
      </div>
    );
  } else if (state === 'partial') {
    const missing = missingSources?.length ? missingSources.join(', ') : 'some sources';
    banner = (
      <div
        role="status"
        className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[#b9770e]/30 bg-[#fdf6e5] px-3.5 py-2 text-xs text-[#8e5636]"
      >
        <span className="inline-flex items-center gap-1.5">
          <AlertTriangle className="size-3.5 shrink-0" />
          We could not load details for: {missing}. Everything else is shown below.
        </span>
        {onRetry ? (
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex cursor-pointer items-center gap-1 font-semibold text-ink underline-offset-2 hover:underline"
          >
            <RefreshCw className="size-3" />
            Try again
          </button>
        ) : null}
      </div>
    );
  } else if (state === 'offline') {
    banner = (
      <div
        role="status"
        className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-surface-subtle px-3.5 py-2 text-xs text-ink-muted"
      >
        <span className="inline-flex items-center gap-1.5">
          <WifiOff className="size-3.5 shrink-0" />
          {offlineMessage ??
            'You are offline. We are showing the data saved on this device. Reconnect to load the latest information.'}
        </span>
        {onRetry ? (
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex cursor-pointer items-center gap-1 font-semibold text-ink underline-offset-2 hover:underline"
          >
            <RefreshCw className="size-3" />
            Try again
          </button>
        ) : null}
      </div>
    );
  }

  return (
    <div className={cn('space-y-3', className)}>
      {banner}
      {children}
    </div>
  );
}
