'use client';

import { ArrowLeft, Lock, Printer, Sprout } from 'lucide-react';
import Link from 'next/link';
import * as React from 'react';

import type { CaseStudyFullProfile } from '../../features/cases/case-study-data';
import { buildFarmReportPayload } from '../../features/reports/build-farm-report';
import {
  formatCropWithHausa,
  formatResolutionHonesty,
  PLANTING_TRIGGER_TITLES,
} from '../../lib/utilities/format';
import { ParcelVectorThumbnail } from '../farms/parcel-vector-thumbnail';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { SegmentedControl } from '../ui/segmented-control';

export interface PrintableFieldSheetProps {
  readonly profile: CaseStudyFullProfile;
  readonly allProfiles?: readonly CaseStudyFullProfile[];
  readonly onSelectProfile?: (slug: string) => void;
}

export function PrintableFieldSheet({
  profile,
  allProfiles,
  onSelectProfile,
}: PrintableFieldSheetProps): React.JSX.Element {
  const [lang, setLang] = React.useState<'ha' | 'en'>('ha');
  const showHausa = lang === 'ha';

  const report = React.useMemo(
    () =>
      buildFarmReportPayload({
        kind: 'rotation_plan',
        periodStart: '2026-05-01',
        periodEnd: '2026-10-31',
        farm: profile.farm,
        parcels: profile.parcels,
        crops: profile.crops,
        priorities: profile.priorities,
        observations: profile.observations,
        comparison: profile.rotationComparison,
        plantingTrigger: profile.plantingTrigger,
        seasonalOutlook: profile.seasonalOutlook,
        generatedAt: '2026-06-15T08:00:00.000Z',
      }),
    [profile],
  );

  return (
    <div className="min-h-screen bg-[#f6f4ef] px-4 py-6 sm:px-6 lg:px-8 print:bg-white print:p-0">
      <div className="mx-auto max-w-5xl space-y-6">
        {/* Screen-Only Action Bar */}
        <div className="flex flex-col justify-between gap-4 rounded-[12px] border border-[#e5e7eb] bg-white p-4 shadow-xs sm:flex-row sm:items-center print:hidden">
          <div className="flex flex-wrap items-center gap-3">
            <Link href={`/cases/${profile.slug}`}>
              <Button variant="secondary" size="sm">
                <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Back to Workspace</span>
              </Button>
            </Link>

            {allProfiles && onSelectProfile ? (
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-[#6b7280]">Holding:</span>
                <select
                  value={profile.slug}
                  onChange={(e) => onSelectProfile(e.target.value)}
                  className="h-8 rounded-[8px] border border-[#e5e7eb] bg-[#f4f5f6] px-2.5 text-xs font-semibold text-[#111315]"
                >
                  {allProfiles.map((p) => (
                    <option key={p.slug} value={p.slug}>
                      {p.farmerName} ({p.village})
                    </option>
                  ))}
                </select>
              </div>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <SegmentedControl
              size="sm"
              ariaLabel="Report language mode"
              value={lang}
              onValueChange={setLang}
              options={[
                { value: 'ha', label: 'English + Hausa' },
                { value: 'en', label: 'English Only' },
              ]}
            />
            <Button variant="primary" size="md" onClick={() => window.print()}>
              <Printer className="h-4 w-4" aria-hidden="true" />
              <span>Print / Save A4 PDF</span>
            </Button>
          </div>
        </div>

        {/* Printable A4 Sheet Container */}
        <article className="space-y-6 rounded-[12px] border border-[#d1d5db] bg-white p-6 shadow-sm sm:p-10 print:rounded-none print:border-0 print:p-2 print:shadow-none">
          {/* Sheet Header */}
          <header className="flex flex-col justify-between gap-4 border-b-2 border-[#111315] pb-5 sm:flex-row sm:items-start">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs font-bold tracking-wider text-[#0a4232] uppercase">
                <Sprout className="h-4 w-4 text-[#00b159]" aria-hidden="true" />
                <span>DalaShift Field Advisory Sheet · Extension &amp; Farmer Copy</span>
              </div>
              <h1 className="font-display text-2xl font-bold text-[#111315]">
                {profile.farmerName} · {profile.village}, {profile.lga}
              </h1>
              <p className="text-xs text-[#4b5563]">{profile.holdingSummary}</p>
            </div>

            <div className="space-y-1 text-left text-xs text-[#4b5563] sm:text-right">
              <div className="font-mono font-semibold text-[#111315]">
                Ruleset: {profile.rotationComparison.rulesetVersion}
              </div>
              <div className="tabular">
                Season Window: {report.periodStart} to {report.periodEnd}
              </div>
              <div className="inline-flex items-center gap-1 rounded bg-[#f4f5f6] px-2 py-0.5 text-[11px] font-medium text-[#111315]">
                <Lock className="h-3 w-3 text-[#00b159]" aria-hidden="true" />
                <span>Exact GPS coordinates redacted for farmer privacy (ADR-0011 D-12)</span>
              </div>
            </div>
          </header>

          {/* Section 1: Parcels & Stated Crop Sequence */}
          <section className="space-y-3">
            <h2 className="font-display text-sm font-bold tracking-wider text-[#111315] uppercase">
              1. Registered Parcels &amp; Stated Crop History
            </h2>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {report.parcels.map((parcel, idx) => {
                const fullParcel = profile.parcels[idx];
                return (
                  <div
                    key={parcel.id}
                    className="flex items-center justify-between rounded-[8px] border border-[#e5e7eb] p-3"
                  >
                    <div className="flex items-center gap-3">
                      {fullParcel ? (
                        <ParcelVectorThumbnail geometry={fullParcel.geometry} size={36} active />
                      ) : null}
                      <div>
                        <div className="text-xs font-bold text-[#111315]">{parcel.name}</div>
                        <div className="tabular text-[11px] text-[#4b5563]">
                          {parcel.areaHa > 0
                            ? `${parcel.areaHa.toFixed(2)} ha (${parcel.geometryMethod})`
                            : `GPS point (±${parcel.locationUncertaintyM ?? 500} m uncertainty)`}
                        </div>
                      </div>
                    </div>
                    <span className="rounded bg-[#f4f5f6] px-2 py-0.5 font-mono text-[10px] text-[#4b5563]">
                      Coords Redacted
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="rounded-[8px] bg-[#f4f5f6] p-3 text-xs">
              <span className="font-semibold text-[#111315]">Stated Crops on Holding: </span>
              <span className="text-[#374151]">
                {profile.cropCodes.map((code) => formatCropWithHausa(code, showHausa)).join(' · ')}
              </span>
            </div>
          </section>

          {/* Section 2: Planting Trigger & Seasonal Rainfall Risk */}
          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-[8px] border border-[#e5e7eb] p-4">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-xs font-bold tracking-wider text-[#111315] uppercase">
                  2A. Moisture Planting Trigger (D-10)
                </h2>
                <Badge
                  variant={
                    profile.plantingTrigger.recommendedTrigger ===
                    profile.plantingTrigger.farmerRule
                      ? 'Strong'
                      : 'Moderate'
                  }
                >
                  {profile.plantingTrigger.recommendedTrigger === profile.plantingTrigger.farmerRule
                    ? 'Conditions Favourable'
                    : 'Watch Conditions'}
                </Badge>
              </div>
              <p className="mt-2 text-xs font-semibold text-[#111315]">
                Stated Rule:{' '}
                {profile.plantingTrigger.farmerRule
                  ? (PLANTING_TRIGGER_TITLES[profile.plantingTrigger.farmerRule]?.en ??
                    profile.plantingTrigger.farmerRule)
                  : 'Wait for confirmed moisture'}
              </p>
              <p className="mt-1 text-xs leading-relaxed text-[#374151]">
                {profile.plantingTrigger.condition}
              </p>
              <p className="mt-2 text-[11px] text-[#6b7280]">
                {profile.plantingTrigger.riskProfile}
              </p>
            </div>

            <div className="rounded-[8px] border border-[#e5e7eb] p-4">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-xs font-bold tracking-wider text-[#111315] uppercase">
                  2B. Seasonal Rainfall Risk Indicator (D-07)
                </h2>
                <Badge variant="Neutral">Not an Operational Weather Forecast</Badge>
              </div>
              <p className="tabular mt-2 text-xs font-semibold text-[#111315]">
                Season-to-date: {profile.seasonalOutlook.rainfallToDate.valueMm} mm vs.{' '}
                {profile.seasonalOutlook.rainfallToDate.normalMm} mm normal baseline
                {profile.seasonalOutlook.rainfallToDate.normalMm > 0
                  ? ` (${(((profile.seasonalOutlook.rainfallToDate.valueMm - profile.seasonalOutlook.rainfallToDate.normalMm) / profile.seasonalOutlook.rainfallToDate.normalMm) * 100).toFixed(1)}%)`
                  : ''}
              </p>
              <p className="mt-1 text-xs leading-relaxed text-[#374151]">
                {profile.seasonalOutlook.riskStatements.join('. ') ||
                  profile.seasonalOutlook.framingNote}
              </p>
            </div>
          </section>

          {/* Section 3: 3-Strategy Rotation Comparison Table */}
          <section className="space-y-3">
            <h2 className="font-display text-sm font-bold tracking-wider text-[#111315] uppercase">
              3. Side-by-Side Rotation Comparison (1 Baseline + 2 Alternatives)
            </h2>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-[#d1d5db] text-left text-xs">
                <thead>
                  <tr className="bg-[#f4f5f6] text-[11px] font-bold text-[#111315] uppercase">
                    <th className="border border-[#d1d5db] px-3 py-2">Strategy Option</th>
                    <th className="border border-[#d1d5db] px-3 py-2">
                      Ordinal Rank &amp; Evidence
                    </th>
                    <th className="border border-[#d1d5db] px-3 py-2">
                      Agronomic Rationale &amp; Citations
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {profile.rotationComparison.strategies.map((opt, idx) => (
                    <tr key={`${opt.label}-${idx}`} className="align-top">
                      <td className="border border-[#d1d5db] px-3 py-2.5 font-semibold text-[#111315]">
                        <div>
                          Strategy {idx + 1}: {idx === 0 ? 'Current Practice' : 'Alternative'}
                        </div>
                        <div className="mt-0.5 font-normal text-[#374151]">{opt.label}</div>
                      </td>
                      <td className="border border-[#d1d5db] px-3 py-2.5">
                        <div className="font-bold text-[#0b4f2f] uppercase">
                          {opt.rank === 'first'
                            ? 'First Choice'
                            : opt.rank === 'tied'
                              ? 'Tied / Viable'
                              : 'Lower Fit'}
                        </div>
                        <div className="mt-0.5 text-[11px] text-[#4b5563]">
                          Evidence: {opt.evidenceStrength} ({opt.evidenceStrengthReason})
                        </div>
                      </td>
                      <td className="border border-[#d1d5db] px-3 py-2.5 text-[#374151]">
                        <p className="mb-1 text-xs">{opt.rationale}</p>
                        {opt.benefits.length > 0 && (
                          <div className="text-[11px] text-[#0a4232]">
                            <strong>Benefits:</strong> {opt.benefits.join('; ')}
                          </div>
                        )}
                        {opt.localReviewRisks.length > 0 && (
                          <div className="mt-0.5 text-[11px] text-[#b9770e]">
                            <strong>Review notes:</strong> {opt.localReviewRisks.join('; ')}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Section 4: Mandatory Data Source Attributions & Disclaimer */}
          <footer className="space-y-3 border-t border-[#d1d5db] pt-4 text-[11px] text-[#4b5563]">
            <div className="font-bold text-[#111315] uppercase">
              4. Data Provenance, Resolution Honesty &amp; Mandatory Attribution
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {report.attributions.map((attr) => (
                <div
                  key={attr.sourceId}
                  className="rounded border border-[#e5e7eb] bg-[#fafafb] p-2"
                >
                  <div className="font-semibold text-[#111315]">
                    {attr.name} ({formatResolutionHonesty(attr.spatialResolutionM)})
                  </div>
                  <div className="text-[10px] text-[#6b7280]">{attr.attribution}</div>
                </div>
              ))}
            </div>
            <p className="leading-relaxed text-[#4b5563]">
              <strong>Disclaimer:</strong> {report.disclaimer}
            </p>
          </footer>
        </article>
      </div>
    </div>
  );
}
