import type { EvidenceStrength, Limitation } from '@dalashift/shared/types';
import { AlertCircle, CheckCircle2, Info, ShieldAlert } from 'lucide-react';

import { cn } from '../../lib/utilities/cn';
import { Badge } from '../ui/badge';

export interface SituationBannerProps {
  readonly headline: string;
  readonly subheadline?: string;
  readonly evidenceStrength: EvidenceStrength;
  readonly evidenceStrengthReason: string;
  readonly limitations: readonly Limitation[];
  readonly rulesetVersion?: string;
  readonly showAdviserMeta?: boolean;
  readonly className?: string;
}

const STRENGTH_CONFIG: Record<
  EvidenceStrength,
  { readonly label: string; readonly variant: 'pass' | 'warning' | 'danger' }
> = {
  strong: { label: 'Evidence strength: Strong', variant: 'pass' },
  moderate: { label: 'Evidence strength: Moderate', variant: 'warning' },
  weak: { label: 'Evidence strength: Weak', variant: 'danger' },
};

/**
 * Primary situation summary at the top of the parcel page (design-system.md section 4).
 * Leads with the plain-language conclusion and immediately states the qualitative
 * evidence strength and its reason (ADR-0011 D-05).
 */
export function SituationBanner({
  headline,
  subheadline,
  evidenceStrength,
  evidenceStrengthReason,
  limitations,
  rulesetVersion,
  showAdviserMeta = false,
  className,
}: SituationBannerProps) {
  const strength = STRENGTH_CONFIG[evidenceStrength] ?? STRENGTH_CONFIG.moderate;

  return (
    <section
      aria-label="Current parcel situation"
      className={cn('rounded-2xl border border-border bg-surface-raised p-5 sm:p-6', className)}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold tracking-wider text-ink-muted uppercase">
            Field Situation Summary
          </span>
          <Badge variant={strength.variant}>
            {evidenceStrength === 'strong' ? (
              <CheckCircle2 className="size-3.5" />
            ) : (
              <AlertCircle className="size-3.5" />
            )}
            {strength.label}
          </Badge>
        </div>

        {showAdviserMeta && rulesetVersion ? (
          <span className="rounded bg-[#f4f5f6] px-2 py-0.5 font-mono text-[11px] text-ink-muted">
            Ruleset: {rulesetVersion}
          </span>
        ) : null}
      </div>

      <h2 className="mt-2.5 text-lg font-semibold leading-snug text-ink sm:text-xl">{headline}</h2>

      {subheadline ? (
        <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">{subheadline}</p>
      ) : null}

      <div className="mt-4 flex flex-col gap-2.5 rounded-xl bg-[#f4f5f6] p-3.5 text-xs text-ink sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-2">
          <Info className="mt-0.5 size-4 shrink-0 text-[#3d6382]" />
          <div>
            <span className="font-semibold">Why evidence strength is {evidenceStrength}: </span>
            <span className="text-ink-muted">{evidenceStrengthReason}</span>
          </div>
        </div>

        {limitations.length > 0 ? (
          <div className="flex shrink-0 items-center gap-1.5 font-medium text-[#8e5636]">
            <ShieldAlert className="size-3.5 shrink-0" />
            <span className="tabular">
              {limitations.length} documented{' '}
              {limitations.length === 1 ? 'limitation' : 'limitations'}
            </span>
          </div>
        ) : null}
      </div>
    </section>
  );
}
