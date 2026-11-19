'use client';

import {
  EVIDENCE_KIND_LABELS,
  PLANTING_TRIGGERS,
  PLANTING_TRIGGER_PROFILES,
  type PlantingTrigger,
} from '@dalashift/shared/constants';
import type { PlantingTriggerAssessment } from '@dalashift/shared/types';
import { CloudRain, Compass, Droplets, Sprout, UserCheck } from 'lucide-react';

import { useLanguage } from '../../i18n/language-provider';
import { cn } from '../../lib/utilities/cn';
import { formatMetricValue, PLANTING_TRIGGER_TITLES } from '../../lib/utilities/format';
import { Badge } from '../ui/badge';

export interface PlantingTriggerCardProps {
  readonly assessment: PlantingTriggerAssessment;
  readonly fieldLang?: 'en' | 'ha';
  readonly onSelectTrigger?: (trigger: PlantingTrigger) => void;
  readonly className?: string;
}

/**
 * Hero decision module (ADR-0011 Decision D-10).
 * Never recommends a calendar date. Presents the moisture-conditioned planting
 * trigger shaped by the farmer's own stated rule and current NASA SMAP / rainfall
 * observations.
 */
export function PlantingTriggerCard({
  assessment,
  fieldLang = 'en',
  onSelectTrigger,
  className,
}: PlantingTriggerCardProps) {
  const { t } = useLanguage();
  const activeRecommended = assessment.recommendedTrigger;
  const farmerStated = assessment.farmerRule;

  return (
    <section
      aria-label={t('trigger.cardAria')}
      className={cn('rounded-2xl border border-border bg-surface-raised p-5 sm:p-6', className)}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="satellite">
              <Droplets className="size-3.5" />
              {t('trigger.badge')}
            </Badge>
            {farmerStated ? (
              <Badge variant="farmer">
                <UserCheck className="size-3.5" />
                {t('trigger.shapedByFarmer')}
              </Badge>
            ) : null}
          </div>
          <h3 className="mt-2 text-lg font-semibold text-ink">{t('trigger.heading')}</h3>
          <p className="mt-1 text-sm text-ink-muted">{t('trigger.intro')}</p>
        </div>
      </div>

      {/* Recommended Condition Callout */}
      <div className="mt-4 rounded-xl border-l-4 border-l-brand-primary bg-[#f4f5f6] p-4">
        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold tracking-wide text-brand-primary uppercase">
          <Sprout className="size-4 text-brand-primary" />
          <span>{t('trigger.activeCondition')}</span>
          {farmerStated === activeRecommended ? (
            <span className="rounded bg-[#fdf6e5] px-2 py-0.5 text-xs font-medium normal-case text-[#8e5636]">
              {t('trigger.matchesFarmer')}
            </span>
          ) : null}
        </div>
        <p className="mt-1.5 text-base font-semibold text-ink">
          {t(`engine.trigger.${activeRecommended}`)}
        </p>
        {fieldLang === 'ha' ? (
          <p className="mt-0.5 text-xs text-ink-muted">
            {t('trigger.englishLine', { title: PLANTING_TRIGGER_TITLES[activeRecommended].en })}
          </p>
        ) : null}
        <p className="mt-2 text-sm text-ink">{assessment.condition}</p>
        <p className="mt-1.5 text-xs text-ink-muted">
          <span className="font-semibold text-ink">{t('trigger.riskTradeOff')} </span>
          {assessment.riskProfile}
        </p>
      </div>

      {/* Three coherent risk postures side by side */}
      <div className="mt-5">
        <p className="mb-2.5 text-xs font-semibold tracking-wider text-ink-muted uppercase">
          {t('trigger.compareStrategies')}
        </p>
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
          {PLANTING_TRIGGERS.map((triggerKey) => {
            const profile = PLANTING_TRIGGER_PROFILES[triggerKey];
            const isRecommended = triggerKey === activeRecommended;
            const isFarmerRule = triggerKey === farmerStated;

            return (
              <div
                key={triggerKey}
                onClick={onSelectTrigger ? () => onSelectTrigger(triggerKey) : undefined}
                role={onSelectTrigger ? 'button' : undefined}
                tabIndex={onSelectTrigger ? 0 : undefined}
                onKeyDown={
                  onSelectTrigger
                    ? (e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          onSelectTrigger(triggerKey);
                        }
                      }
                    : undefined
                }
                className={cn(
                  'flex flex-col justify-between rounded-xl border p-4 transition-all',
                  isRecommended
                    ? 'border-2 border-brand-primary bg-surface-raised shadow-xs'
                    : isFarmerRule
                      ? 'border-2 border-[#ab6a43] bg-[#fdf6e5]/40'
                      : 'border-border bg-[#f4f5f6]/70',
                  onSelectTrigger && 'cursor-pointer hover:border-brand-primary',
                )}
              >
                <div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {isRecommended ? (
                      <Badge variant="pass">{t('trigger.selectedCondition')}</Badge>
                    ) : null}
                    {isFarmerRule ? (
                      <Badge variant="farmer">{t('trigger.farmerRule')}</Badge>
                    ) : null}
                    {!isRecommended && !isFarmerRule ? (
                      <Badge variant="default">{t('trigger.alternativePosture')}</Badge>
                    ) : null}
                  </div>

                  <h4 className="mt-2.5 text-sm font-semibold text-ink">
                    {t(`engine.trigger.${triggerKey}`)}
                  </h4>
                  <p className="mt-1.5 text-xs leading-relaxed text-ink">{profile.condition}</p>
                </div>

                <div className="mt-3 border-t border-border/80 pt-2.5 text-xs text-ink-muted">
                  <p>
                    <strong className="text-ink">{t('trigger.tradeOff')}</strong>{' '}
                    {profile.riskProfile}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Supporting observations */}
      {assessment.evidence.length > 0 ? (
        <div className="mt-5 border-t border-border pt-4">
          <p className="mb-2 text-xs font-semibold tracking-wider text-ink-muted uppercase">
            {t('trigger.evidenceHeading')}
          </p>
          <ul className="space-y-2">
            {assessment.evidence.map((item, idx) => (
              <li
                key={`${item.kind}-${idx}`}
                className="flex flex-wrap items-start justify-between gap-2 rounded-lg bg-[#f4f5f6] px-3 py-2 text-xs"
              >
                <div className="flex items-start gap-2">
                  {item.kind === 'farmer_report' ? (
                    <Compass className="mt-0.5 size-3.5 shrink-0 text-[#8e5636]" />
                  ) : (
                    <CloudRain className="mt-0.5 size-3.5 shrink-0 text-info" />
                  )}
                  <span className="text-ink">{item.statement}</span>
                </div>
                <div className="flex items-center gap-2">
                  {item.value !== null ? (
                    <span className="rounded bg-surface-raised px-1.5 py-0.5 font-semibold text-ink tabular">
                      {formatMetricValue(item.value, 2)} {item.unit ?? ''}
                    </span>
                  ) : null}
                  <Badge
                    variant={
                      item.kind === 'farmer_report'
                        ? 'farmer'
                        : item.kind === 'environmental_observation'
                          ? 'satellite'
                          : 'literature'
                    }
                  >
                    {EVIDENCE_KIND_LABELS[item.kind]}
                  </Badge>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
