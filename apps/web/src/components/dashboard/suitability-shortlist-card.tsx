'use client';

import type { ComparisonResult, RotationStrategy } from '@dalashift/shared/types';
import { Check, Info, List, ListOrdered, Scale, Sprout } from 'lucide-react';

import { useLanguage } from '../../i18n/language-provider';
import { cn } from '../../lib/utilities/cn';
import { HAUSA_CROP_NAMES } from '../../lib/utilities/format';
import { Button } from '../ui/button';
import { DimensionThresholdRow } from './dimension-threshold-row';

export interface SuitabilityShortlistCardProps {
  readonly comparison: ComparisonResult;
  readonly fieldLang?: 'en' | 'ha';
  readonly selectedPlannedCropCode?: string | null;
  readonly onSelectPlannedCrop?: (cropCode: string, cropName: string) => void;
  readonly className?: string;
}

const EVIDENCE_STRENGTH_IDS: Record<RotationStrategy['evidenceStrength'], string> = {
  strong: 'verdict.strongEvidence',
  moderate: 'verdict.moderateEvidence',
  weak: 'verdict.weakEvidence',
};

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
  const { t } = useLanguage();
  const hasTies = comparison.strategies.some((s) => s.rank === 'tied');

  // Rank is an ordinal position, not a grade. Keep it as plain, neutral text so
  // the interface never implies a score or breaks a tie for presentation.
  const renderRankLabel = (strategy: RotationStrategy) => {
    if (strategy.rank === 'first') {
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-ink-muted">
          <ListOrdered className="size-3.5 shrink-0 text-ink-muted" aria-hidden="true" />
          {t('shortlist.rankFirst')}
        </span>
      );
    }
    if (strategy.rank === 'tied') {
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-ink-muted">
          <Scale className="size-3.5 shrink-0 text-ink-muted" aria-hidden="true" />
          {t('shortlist.rankTied')}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-ink-muted">
        <List className="size-3.5 shrink-0 text-ink-muted" aria-hidden="true" />
        {t('shortlist.rankOther')}
      </span>
    );
  };

  return (
    <section aria-label={t('shortlist.cardAria')} className={cn('space-y-4', className)}>
      {/* Indistinguishable Spread / Tie Rule Callout */}
      {hasTies ? (
        <div className="rounded-2xl border border-[#b9770e]/35 bg-[#fdf6e5] p-4 text-sm text-ink">
          <div className="flex items-start gap-3">
            <Scale className="mt-0.5 size-5 shrink-0 text-[#8e5636]" />
            <div>
              <h3 className="font-semibold text-[#8e5636]">{t('shortlist.tieTitle')}</h3>
              <p className="mt-1 text-xs leading-relaxed text-ink">{t('shortlist.tieBody')}</p>
            </div>
          </div>
        </div>
      ) : null}

      <div className="rounded-xl border border-border bg-surface-raised p-4 text-xs text-ink-muted">
        <div className="flex items-center gap-2 font-semibold text-ink">
          <Info className="size-4 text-[#3d6382]" />
          <span>{t('shortlist.orderingBasis')}</span>
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

          // The engine's reason already leads with the strength word and a
          // connector (because / based on). Strip that lead so the translated
          // strength label and the reason do not repeat the strength word.
          const evidenceReason = strategy.evidenceStrengthReason;
          const evidencePrefix = `${strategy.evidenceStrength} evidence `;
          const evidenceDetail = evidenceReason
            .toLowerCase()
            .startsWith(evidencePrefix.toLowerCase())
            ? evidenceReason.slice(evidencePrefix.length)
            : evidenceReason.charAt(0).toLowerCase() + evidenceReason.slice(1);

          return (
            <div
              key={`${cropCode}-${idx}`}
              className={cn(
                'flex flex-col justify-between rounded-2xl border bg-surface-raised p-5 transition-all',
                isSelected ? 'border-2 border-[#0a4232] ring-2 ring-[#0a4232]/15' : 'border-border',
              )}
            >
              <div>
                {renderRankLabel(strategy)}

                <p className="mt-1.5 text-xs leading-relaxed text-ink-muted">
                  <span className="font-semibold text-ink">
                    {t(
                      EVIDENCE_STRENGTH_IDS[strategy.evidenceStrength] ?? 'verdict.strongEvidence',
                    )}
                  </span>
                  {evidenceDetail ? `, ${evidenceDetail}` : '.'}
                </p>

                <div className="mt-3 flex items-baseline gap-2">
                  <h4 className="text-lg font-semibold text-ink">{cropName}</h4>
                  {hausaInfo ? (
                    <span className="text-xs font-medium text-[#8e5636]">
                      (
                      {fieldLang === 'ha'
                        ? hausaInfo.hausa
                        : t('shortlist.hausaPrefix', { name: hausaInfo.hausa })}
                      )
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
                  <div className="mt-3 rounded-lg bg-[#f4f5f6] p-2.5 text-xs text-ink-muted">
                    <strong className="text-ink">{t('shortlist.informationGap')} </strong>
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
                        {t('shortlist.registered')}
                      </>
                    ) : (
                      <>
                        <Sprout className="size-4 text-[#0a4232]" />
                        {t('shortlist.chooseCrop', { cropName })}
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
