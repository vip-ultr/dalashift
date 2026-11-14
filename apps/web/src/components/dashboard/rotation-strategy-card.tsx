'use client';

import { EVIDENCE_KIND_LABELS } from '@dalashift/shared/constants';
import type { RotationStrategy } from '@dalashift/shared/types';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { useState } from 'react';

import { cn } from '../../lib/utilities/cn';
import { HAUSA_CROP_NAMES } from '../../lib/utilities/format';
import { Badge } from '../ui/badge';
import { DimensionThresholdRow } from './dimension-threshold-row';

export interface RotationStrategyCardProps {
  readonly strategy: RotationStrategy;
  readonly index: number;
  readonly fieldLang?: 'en' | 'ha';
  readonly showAdviserDetails?: boolean;
  readonly className?: string;
}

/**
 * Renders one strategy inside the 3-strategy qualitative rotation comparison
 * (ADR-0011 Decisions D-05 & D-11, and PRD FR-8).
 *
 * The farmer's existing rotation is always rendered first as the neutral
 * baseline, never framed as the "bad" option.
 */
export function RotationStrategyCard({
  strategy,
  index,
  fieldLang = 'en',
  showAdviserDetails = false,
  className,
}: RotationStrategyCardProps) {
  const [showDimensions, setShowDimensions] = useState(showAdviserDetails);
  const isBaseline = strategy.kind === 'existing';

  const rankBadge = () => {
    if (isBaseline) {
      return <Badge variant="farmer">1. Existing Practice (Baseline)</Badge>;
    }
    if (strategy.rank === 'first') {
      return <Badge variant="pass">Ranked First on Evidence</Badge>;
    }
    if (strategy.rank === 'tied') {
      return <Badge variant="warning">Tied on Current Evidence</Badge>;
    }
    return <Badge variant="satellite">Alternative {index}</Badge>;
  };

  return (
    <article
      className={cn(
        'flex flex-col justify-between rounded-2xl border bg-surface-raised p-5 transition-shadow',
        isBaseline
          ? 'border-t-4 border-border border-t-[#ab6a43]'
          : strategy.rank === 'first'
            ? 'border-t-4 border-border border-t-[#00b159] shadow-xs'
            : 'border-t-4 border-border border-t-[#3d6382]',
        className,
      )}
    >
      <div>
        {/* Strategy Header */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          {rankBadge()}
          <Badge
            variant={
              strategy.evidenceStrength === 'strong'
                ? 'pass'
                : strategy.evidenceStrength === 'moderate'
                  ? 'warning'
                  : 'danger'
            }
          >
            Evidence: {strategy.evidenceStrength}
          </Badge>
        </div>

        <h3 className="mt-3 text-base font-semibold text-ink">{strategy.label}</h3>

        {/* Sequence of Crop Legs across seasons */}
        <div className="mt-3 flex flex-wrap items-center gap-1.5 rounded-xl bg-[#f4f5f6] p-3">
          {strategy.legs.map((leg, legIdx) => {
            const hausaInfo = HAUSA_CROP_NAMES[leg.cropCode];
            return (
              <div key={`${leg.cropId}-${leg.sequence}`} className="flex items-center gap-1.5">
                <div className="rounded-lg border border-border bg-surface-raised px-2.5 py-1.5">
                  <span className="block text-[10px] font-medium text-ink-muted uppercase">
                    Step {leg.sequence} · {leg.season}
                  </span>
                  <span className="text-xs font-semibold text-ink">
                    {leg.cropName}
                    {fieldLang === 'ha' && hausaInfo ? (
                      <span className="ml-1 font-normal text-[#8e5636]">
                        ({hausaInfo.hausa})
                      </span>
                    ) : null}
                  </span>
                </div>
                {legIdx < strategy.legs.length - 1 ? (
                  <ArrowRight className="size-3.5 shrink-0 text-ink-faint" />
                ) : null}
              </div>
            );
          })}
        </div>

        {/* Ordering basis */}
        <p className="mt-2.5 text-xs text-ink-muted">
          <strong className="text-ink">Ordering basis: </strong>
          {strategy.rankingBasis}
        </p>

        {/* 1. Why suggested */}
        <div className="mt-4">
          <h4 className="text-xs font-semibold tracking-wider text-ink-muted uppercase">
            Why this strategy is included
          </h4>
          <p className="mt-1 text-sm leading-relaxed text-ink">{strategy.rationale}</p>
        </div>

        {/* 2. Supporting Evidence */}
        <div className="mt-4">
          <h4 className="text-xs font-semibold tracking-wider text-ink-muted uppercase">
            Supporting evidence
          </h4>
          <ul className="mt-1.5 space-y-1.5">
            {strategy.evidence.map((ev, evIdx) => (
              <li
                key={`${ev.kind}-${evIdx}`}
                className="rounded-lg bg-[#f4f5f6] px-3 py-2 text-xs text-ink"
              >
                <div className="flex flex-wrap items-center justify-between gap-1">
                  <Badge
                    variant={
                      ev.kind === 'farmer_report'
                        ? 'farmer'
                        : ev.kind === 'documented_agronomic_evidence'
                          ? 'literature'
                          : 'satellite'
                    }
                  >
                    {EVIDENCE_KIND_LABELS[ev.kind]}
                  </Badge>
                  {ev.citation ? (
                    <span className="text-[11px] text-ink-muted">{ev.citation}</span>
                  ) : null}
                </div>
                <p className="mt-1 leading-relaxed">{ev.statement}</p>
              </li>
            ))}
          </ul>
        </div>

        {/* 3. Potential Benefits */}
        <div className="mt-4">
          <h4 className="flex items-center gap-1.5 text-xs font-semibold tracking-wider text-[#0a4232] uppercase">
            <Sparkles className="size-3.5 text-[#00b159]" />
            Potential agronomic benefits
          </h4>
          <ul className="mt-1.5 space-y-1 text-xs text-ink">
            {strategy.benefits.map((benefit, bIdx) => (
              <li key={bIdx} className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-[#00b159]" />
                <span>{benefit}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* 4. Information Gaps */}
        {strategy.informationGaps.length > 0 ? (
          <div className="mt-4">
            <h4 className="flex items-center gap-1.5 text-xs font-semibold tracking-wider text-[#b9770e] uppercase">
              <HelpCircle className="size-3.5" />
              Information gaps
            </h4>
            <ul className="mt-1.5 space-y-1 text-xs text-ink-muted">
              {strategy.informationGaps.map((gap, gIdx) => (
                <li key={gIdx} className="flex items-start gap-2">
                  <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-[#b9770e]" />
                  <span>{gap}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {/* 5. Risks Requiring Local Review */}
        {strategy.localReviewRisks.length > 0 ? (
          <div className="mt-4 rounded-xl border border-[#ab6a43]/30 bg-[#fdf6e5]/60 p-3">
            <h4 className="flex items-center gap-1.5 text-xs font-semibold text-[#8e5636]">
              <AlertTriangle className="size-3.5 shrink-0" />
              Risks requiring local review
            </h4>
            <ul className="mt-1.5 space-y-1 text-xs text-ink">
              {strategy.localReviewRisks.map((risk, rIdx) => (
                <li key={rIdx} className="leading-relaxed">
                  • {risk}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {/* Collapsible Per-Dimension Threshold Breakdown */}
        {strategy.legs[0]?.assessment.dimensions.length ? (
          <div className="mt-4 border-t border-border pt-3">
            <button
              type="button"
              onClick={() => setShowDimensions((prev) => !prev)}
              className="flex w-full items-center justify-between text-xs font-semibold text-ink hover:text-[#00b159] cursor-pointer"
            >
              <span>
                Threshold breakdown for {strategy.legs[0].cropName} (
                {strategy.legs[0].assessment.dimensions.length} dimensions)
              </span>
              {showDimensions ? (
                <ChevronUp className="size-4" />
              ) : (
                <ChevronDown className="size-4" />
              )}
            </button>

            {showDimensions ? (
              <div className="mt-3 space-y-2">
                {strategy.legs[0].assessment.dimensions.map((dim) => (
                  <DimensionThresholdRow
                    key={dim.dimension}
                    dimension={dim}
                    showCitations={showAdviserDetails}
                  />
                ))}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>

      {/* Mandatory Expert Review Footer */}
      <div className="mt-5 flex items-center gap-2 border-t border-border pt-3 text-[11px] text-ink-muted">
        <ShieldCheck className="size-4 shrink-0 text-[#0a4232]" />
        <span>
          Requires local review by the farmer or an agricultural extension officer (malamin gona).
        </span>
      </div>
    </article>
  );
}
