import { SPATIAL_RESOLUTION_METRES } from '@dalashift/shared/constants';
import type { SeasonalOutlook } from '@dalashift/shared/types';
import { AlertTriangle, CalendarClock, CloudRain, ShieldAlert } from 'lucide-react';

import { cn } from '../../lib/utilities/cn';
import { formatMetricValue } from '../../lib/utilities/format';
import { Badge } from '../ui/badge';
import { ProvenanceLine } from './provenance-line';

export interface SeasonalOutlookPanelProps {
  readonly outlook: SeasonalOutlook;
  readonly observedAt?: string | null;
  readonly className?: string;
}

const ONSET_LABELS: Record<
  SeasonalOutlook['onset']['status'],
  { readonly label: string; readonly variant: 'pass' | 'warning' | 'default' }
> = {
  established: { label: 'Rains established', variant: 'pass' },
  started: { label: 'Early onset started', variant: 'warning' },
  not_started: { label: 'Not yet started', variant: 'default' },
};

/**
 * Seasonal Risk Outlook panel (ADR-0011 Decision D-07).
 * Built from NASA POWER climatology and the current season's rainfall record.
 * Explicitly framed as a risk indicator and never as a weather forecast.
 */
export function SeasonalOutlookPanel({
  outlook,
  observedAt,
  className,
}: SeasonalOutlookPanelProps) {
  const onsetMeta = ONSET_LABELS[outlook.onset.status];
  const diffMm = outlook.rainfallToDate.valueMm - outlook.rainfallToDate.normalMm;
  const pctOfNormal =
    outlook.rainfallToDate.normalMm > 0
      ? (outlook.rainfallToDate.valueMm / outlook.rainfallToDate.normalMm) * 100
      : null;

  return (
    <section
      aria-label="Seasonal risk outlook"
      className={cn('rounded-2xl border border-border bg-surface-raised p-5 sm:p-6', className)}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Badge variant="satellite">
            <CloudRain className="size-3.5" />
            Seasonal Climate Risk Indicator
          </Badge>
          <Badge variant={onsetMeta.variant}>{onsetMeta.label}</Badge>
        </div>
        <span className="text-xs font-medium text-ink-muted">Not a weather forecast</span>
      </div>

      <h3 className="mt-2.5 text-lg font-semibold text-ink">
        How this season compares against the 30-year climate record
      </h3>

      {/* Mandatory Framing Note (D-07) */}
      <div className="mt-3 flex items-start gap-2.5 rounded-xl border border-[#3d6382]/25 bg-[#e4edf4]/60 p-3.5 text-xs text-ink">
        <ShieldAlert className="mt-0.5 size-4 shrink-0 text-[#3d6382]" />
        <p>{outlook.framingNote}</p>
      </div>

      {/* Headline Metrics */}
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-xl bg-[#f4f5f6] p-4">
          <span className="text-xs font-medium text-ink-muted">Season rainfall to date</span>
          <div className="mt-1 flex items-baseline gap-1.5 tabular">
            <span className="text-2xl font-semibold text-ink">
              {formatMetricValue(outlook.rainfallToDate.valueMm, 0)}
            </span>
            <span className="text-xs text-ink-muted">{outlook.rainfallToDate.unit}</span>
          </div>
          <p className="mt-1 text-xs text-ink-muted tabular">
            Long-term normal: {formatMetricValue(outlook.rainfallToDate.normalMm, 0)}{' '}
            {outlook.rainfallToDate.unit}
          </p>
        </div>

        <div className="rounded-xl bg-[#f4f5f6] p-4">
          <span className="text-xs font-medium text-ink-muted">Comparison vs. normal</span>
          <div className="mt-1 flex items-baseline gap-1.5 tabular">
            <span
              className={cn(
                'text-2xl font-semibold',
                diffMm >= -25 ? 'text-[#0a4232]' : 'text-[#b9770e]',
              )}
            >
              {diffMm >= 0 ? '+' : ''}
              {formatMetricValue(diffMm, 0)} mm
            </span>
          </div>
          <p className="mt-1 text-xs text-ink-muted tabular">
            {pctOfNormal !== null
              ? `${formatMetricValue(pctOfNormal, 1)}% of long-term average`
              : 'Compared against regional baseline'}
          </p>
        </div>

        <div className="rounded-xl bg-[#f4f5f6] p-4">
          <span className="text-xs font-medium text-ink-muted">Onset timing vs. record</span>
          <div className="mt-1 flex items-baseline gap-1.5 tabular">
            <CalendarClock className="size-5 text-[#3d6382]" />
            <span className="text-xl font-semibold text-ink">
              {outlook.onset.daysAfterNormal === null
                ? onsetMeta.label
                : outlook.onset.daysAfterNormal === 0
                  ? 'On time'
                  : outlook.onset.daysAfterNormal > 0
                    ? `${outlook.onset.daysAfterNormal} days late`
                    : `${Math.abs(outlook.onset.daysAfterNormal)} days early`}
            </span>
          </div>
          <p className="mt-1 text-xs text-ink-muted">
            Shapes whether long-duration crops can finish before dry-down
          </p>
        </div>
      </div>

      {/* Risk Statements */}
      {outlook.riskStatements.length > 0 ? (
        <div className="mt-4 space-y-2">
          <h4 className="text-xs font-semibold tracking-wider text-ink-muted uppercase">
            Seasonal risk observations for this location
          </h4>
          <ul className="space-y-1.5">
            {outlook.riskStatements.map((stmt, idx) => (
              <li
                key={idx}
                className="flex items-start gap-2 rounded-lg bg-[#f4f5f6] px-3.5 py-2.5 text-xs text-ink"
              >
                <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-[#b9770e]" />
                <span>{stmt}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <ProvenanceLine
        sourceId={outlook.rainfallToDate.sourceId}
        spatialResolutionM={SPATIAL_RESOLUTION_METRES.powerLatitude}
        observedAt={observedAt ?? '2026-11-13'}
        isModelled={true}
        className="mt-4"
      />
    </section>
  );
}
