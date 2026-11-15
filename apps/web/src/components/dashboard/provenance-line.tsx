import { Clock, Database, Layers } from 'lucide-react';

import { cn } from '../../lib/utilities/cn';
import {
  formatObservationDate,
  formatSourceName,
  formatSpatialResolutionPhrase,
} from '../../lib/utilities/format';

export interface ProvenanceLineProps {
  readonly sourceId: string;
  readonly spatialResolutionM: number;
  readonly observedAt: string | null | undefined;
  readonly isModelled: boolean;
  readonly coverageFraction?: number | null;
  readonly className?: string;
}

/**
 * Mandatory provenance footer displayed on every environmental figure and card.
 * Enforces resolution honesty (AGENTS.md section 9 and design-system.md section 9.1).
 */
export function ProvenanceLine({
  sourceId,
  spatialResolutionM,
  observedAt,
  isModelled,
  coverageFraction,
  className,
}: ProvenanceLineProps) {
  const resolutionPhrase = formatSpatialResolutionPhrase(spatialResolutionM);
  const sourceLabel = formatSourceName(sourceId);
  const dateLabel = formatObservationDate(observedAt);

  return (
    <div
      className={cn(
        'flex flex-wrap items-center gap-x-2.5 gap-y-1 border-t border-border/80 pt-2.5 text-[12px] leading-4 text-ink-muted',
        className,
      )}
    >
      <span
        className={cn(
          'inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-medium',
          isModelled ? 'bg-[#fdf6e5] text-[#8e5636]' : 'bg-[#e4edf4] text-[#3d6382]',
        )}
      >
        <Database className="size-3 shrink-0" />
        {isModelled ? 'Modelled / interpolated' : 'Satellite observation'}
      </span>

      <span className="inline-flex items-center gap-1">
        <Layers className="size-3 shrink-0 text-ink-faint" />
        <span className="capitalize">{resolutionPhrase}</span>
      </span>

      <span aria-hidden="true" className="text-ink-faint">
        ·
      </span>

      <span className="font-medium text-ink">{sourceLabel}</span>

      <span aria-hidden="true" className="text-ink-faint">
        ·
      </span>

      <span className="inline-flex items-center gap-1 tabular">
        <Clock className="size-3 shrink-0 text-ink-faint" />
        Observed {dateLabel}
      </span>

      {coverageFraction !== undefined && coverageFraction !== null && coverageFraction < 1 ? (
        <>
          <span aria-hidden="true" className="text-ink-faint">
            ·
          </span>
          <span className="text-[#b9770e] tabular">
            {Math.round(coverageFraction * 100)}% parcel coverage
          </span>
        </>
      ) : null}
    </div>
  );
}
