'use client';

import type { ComparisonResult, RotationStrategy } from '@dalashift/shared/types';
import { Check, Info, Scale, Sprout } from 'lucide-react';

import { cn } from '../../lib/utilities/cn';
import { HAUSA_CROP_NAMES } from '../../lib/utilities/format';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { DimensionThresholdRow } from './dimension-threshold-row';

export interface SuitabilityShortlistCardProps {
  readonly comparison: ComparisonResult;
  readonly fieldLang?: 'en' | 'ha';
  readonly selectedPlannedCropCode?: string | null;
  readonly onSelectPlannedCrop?: (cropCode: string, cropName: string) => void;
  readonly className?: string;
}

/**
 * Prospective farmer suitability shortlist (ADR-0011 Decision D-03 & D-05).
 * Displays an ordinal shortlist of candidate crops without composite scores,
 * and surfaces the explicit tie message when coarse regional data cannot
 * separate candidates (user-flows.md section 3).
 */
export function SuitabilityShortlistCard({
  comparison,
  fieldLang = 'en',
  selectedPlannedCropCode,
  onSelectPlannedCrop,
  className,
}: SuitabilityShortlistCardProps) {
  const hasTies = comparison.strategies.some((s) => s.rank === 'tied');

  const renderRankLabel = (strategy: RotationStrategy, idx: number) => {
    if (strategy.rank === 'first') {
      return <Badge variant="pass">Top candidate</Badge>;
    }
    if (strategy.rank === 'tied') {
      return <Badge variant="warning">Tied on available data</Badge>;
    }
    return <Badge variant="default">Option {idx + 1}</Badge>;
  };

  return (
    <section
      aria-label="Prospective crop suitability shortlist"
      className={cn('space-y-4', className)}
    >
      {/* Indistinguishable Spread / Tie Rule Callout */}
      {hasTies ? (
        <div className="rounded-2xl border border-[#b9770e]/35 bg-[#fdf6e5] p-4 text-sm text-ink">
          <div className="flex items-start gap-3">
            <Scale className="mt-0.5 size-5 shrink-0 text-[#8e5636]" />
            <div>
              <h3 className="font-semibold text-[#8e5636]">
                Multiple candidate crops are tied on the available regional data
              </h3>
              <p className="mt-1 text-xs leading-relaxed text-ink">
                The rainfall and temperature records for this parcel come from regional grid cells
                (5.5 km to 55 km), so they cannot separate these top crops on climate alone. Specify
                whether you have access to supplementary irrigation or select your primary
                household/market priority to sharpen the comparison.
              </p>
            </div>
          </div>
        </div>
      ) : null}

      <div className="rounded-xl border border-border bg-surface-raised p-4 text-xs text-ink-muted">
        <div className="flex items-center gap-2 font-semibold text-ink">
          <Info className="size-4 text-[#3d6382]" />
          <span>Shortlist ordering basis</span>
        </div>
        <p className="mt-1">{comparison.rankingBasis}</p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {comparison.strategies.map((strategy, idx) => {
          const leg = strategy.legs[0];
          const cropCode = leg?.cropCode ?? strategy.label.toLowerCase();
          const cropName = leg?.cropName ?? strategy.label;
          const hausaInfo = HAUSA_CROP_NAMES[cropCode];
          const isSelected = selectedPlannedCropCode === cropCode;

          return (
            <div
              key={`${cropCode}-${idx}`}
              className={cn(
                'flex flex-col justify-between rounded-2xl border bg-surface-raised p-5 transition-all',
                isSelected ? 'border-2 border-[#00b159] ring-2 ring-[#00b159]/15' : 'border-border',
              )}
            >
              <div>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  {renderRankLabel(strategy, idx)}
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

                <div className="mt-3 flex items-baseline gap-2">
                  <h4 className="text-lg font-semibold text-ink">{cropName}</h4>
                  {hausaInfo ? (
                    <span className="text-xs font-medium text-[#8e5636]">
                      ({fieldLang === 'ha' ? hausaInfo.hausa : `Hausa: ${hausaInfo.hausa}`})
                    </span>
                  ) : null}
                </div>

                <p className="mt-2 text-xs leading-relaxed text-ink-muted">{strategy.rationale}</p>

                {leg?.assessment.dimensions.length ? (
                  <div className="mt-3 space-y-2">
                    {leg.assessment.dimensions.slice(0, 3).map((dim) => (
                      <DimensionThresholdRow
                        key={dim.dimension}
                        dimension={dim}
                        showCitations={false}
                      />
                    ))}
                  </div>
                ) : null}

                {strategy.informationGaps.length > 0 ? (
                  <div className="mt-3 rounded-lg bg-[#f4f5f6] p-2.5 text-[11px] text-ink-muted">
                    <strong className="text-ink">Information gap: </strong>
                    {strategy.informationGaps[0]}
                  </div>
                ) : null}
              </div>

              {onSelectPlannedCrop ? (
                <div className="mt-4 border-t border-border pt-3">
                  <Button
                    variant={isSelected ? 'forest' : 'secondary'}
                    size="sm"
                    onClick={() => onSelectPlannedCrop(cropCode, cropName)}
                    className="w-full"
                  >
                    {isSelected ? (
                      <>
                        <Check className="size-4" />
                        Registered as planned crop
                      </>
                    ) : (
                      <>
                        <Sprout className="size-4 text-[#00b159]" />
                        Choose {cropName} as planned crop
                      </>
                    )}
                  </Button>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}
