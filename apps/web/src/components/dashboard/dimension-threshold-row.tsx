'use client';

import { ASSESSMENT_DIMENSION_LABELS, type AssessmentStatus } from '@dalashift/shared/constants';
import type { DimensionAssessment } from '@dalashift/shared/types';
import { BookOpen, CheckCircle2, HelpCircle, MinusCircle, XCircle } from 'lucide-react';

import { useLanguage } from '../../i18n/language-provider';
import { cn } from '../../lib/utilities/cn';
import {
  formatMetricValue,
  formatObservationDate,
  formatSourceName,
} from '../../lib/utilities/format';

export interface DimensionThresholdRowProps {
  readonly dimension: DimensionAssessment;
  readonly showCitations?: boolean;
  readonly className?: string;
}

// Status is a factual comparison of a value against a cited threshold, not a
// grade. Each status is carried by its icon shape and its text label; colour is
// never the only signal. Tokens are neutral so no status reads as "good/bad".
const STATUS_META: Record<
  AssessmentStatus,
  {
    readonly messageId: string;
    readonly Icon: typeof CheckCircle2;
  }
> = {
  pass: { messageId: 'verdict.pass', Icon: CheckCircle2 },
  fail: { messageId: 'verdict.fail', Icon: XCircle },
  uncertain: { messageId: 'verdict.uncertain', Icon: HelpCircle },
  not_assessed: { messageId: 'verdict.notAssessed', Icon: MinusCircle },
};

/**
 * Qualitative dimension assessment row (ADR-0011 Decision D-05).
 * Replaces numeric suitability scores with a transparent comparison of the
 * measured or modelled value against the cited agronomic threshold.
 */
export function DimensionThresholdRow({
  dimension,
  showCitations = true,
  className,
}: DimensionThresholdRowProps) {
  const { t } = useLanguage();
  const label = ASSESSMENT_DIMENSION_LABELS[dimension.dimension] ?? dimension.dimension;
  const meta = STATUS_META[dimension.status];
  const statusLabel = t(meta.messageId);
  const StatusIcon = meta.Icon;

  const hasRange = dimension.threshold.min !== null || dimension.threshold.max !== null;
  const rangeText = hasRange
    ? `${dimension.threshold.min !== null ? formatMetricValue(dimension.threshold.min, 1) : 'any'} to ${dimension.threshold.max !== null ? formatMetricValue(dimension.threshold.max, 1) : 'any'} ${dimension.unit ?? ''}`.trim()
    : 'Qualitative check';

  return (
    <div
      className={cn(
        'rounded-lg border border-border/80 bg-surface-subtle/75 p-3 text-xs',
        className,
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="font-semibold text-ink">{label}</span>
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-ink">
          <StatusIcon className="size-3.5 shrink-0 text-ink-muted" aria-hidden="true" />
          {statusLabel}
        </span>
      </div>

      <div className="mt-2 grid grid-cols-2 gap-2 rounded-md bg-surface-raised px-2.5 py-1.5 tabular">
        <div>
          <span className="block text-[10px] tracking-wide text-ink-muted uppercase">
            Observed / Modelled
          </span>
          <span className="font-semibold text-info">
            {dimension.value !== null
              ? `${formatMetricValue(dimension.value, 1)} ${dimension.unit ?? ''}`.trim()
              : 'n/a'}
          </span>
        </div>
        <div>
          <span className="block text-[10px] tracking-wide text-ink-muted uppercase">
            Cited Requirement
          </span>
          <span className="font-semibold text-ink">{rangeText}</span>
        </div>
      </div>

      <p className="mt-2 leading-relaxed text-ink-muted">{dimension.explanation}</p>

      {showCitations ? (
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2 border-t border-border/60 pt-1.5 text-[11px] text-ink-faint">
          <span className="inline-flex items-center gap-1">
            <BookOpen className="size-3 shrink-0" />
            {dimension.threshold.citation}
          </span>
          {dimension.sourceId ? (
            <span className="tabular">
              {formatSourceName(dimension.sourceId)}
              {dimension.observedAt ? ` · ${formatObservationDate(dimension.observedAt)}` : ''}
            </span>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
