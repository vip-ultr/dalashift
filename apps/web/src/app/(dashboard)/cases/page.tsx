import {
  ArrowRight,
  CalendarClock,
  FileText,
  GitCompareArrows,
  Quote,
  ShieldCheck,
} from 'lucide-react';
import Link from 'next/link';
import type * as React from 'react';

import { ParcelVectorThumbnail } from '../../../components/farms/parcel-vector-thumbnail';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { CASE_STUDY_PROFILES } from '../../../features/cases/case-study-data';
import { formatCropWithHausa, PLANTING_TRIGGER_TITLES } from '../../../lib/utilities/format';

export default function CaseStudiesOverviewPage(): React.JSX.Element {
  return (
    <div className="min-h-screen bg-[#f6f4ef] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Page Header */}
        <div className="rounded-[12px] border border-[#e5e7eb] bg-white p-6 shadow-xs">
          <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
            <div className="space-y-1.5">
              <Badge variant="Strong">Field Benchmarks</Badge>
              <h1 className="font-display text-2xl font-bold tracking-tight text-[#111315]">
                Field Case Studies
              </h1>
              <p className="max-w-2xl text-xs text-[#4b5563] sm:text-sm">
                Explore real holding structures, crop rotation comparisons, and moisture triggers.
              </p>
            </div>

            <div className="flex shrink-0 flex-wrap items-center gap-2.5">
              <Link href="/farms/new">
                <Button variant="primary" size="md">
                  <span>+ Register Farm</span>
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* 3 Case Study Cards */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {CASE_STUDY_PROFILES.map((cs, index) => {
            const totalHa = cs.parcels.reduce((sum, parcel) => sum + (parcel.areaHa ?? 0), 0);
            const triggerRule = cs.priorities.plantingTrigger ?? 'wait_for_confirmed_moisture';

            return (
              <article
                key={cs.slug}
                className="flex flex-col justify-between rounded-[12px] border border-[#e5e7eb] bg-white p-6 shadow-xs transition-shadow hover:shadow-md"
              >
                <div className="space-y-4">
                  {/* Top Identity Row */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <ParcelVectorThumbnail
                        geometry={cs.parcels[0]!.geometry}
                        size={44}
                        active={index === 0}
                      />
                      <div>
                        <div className="text-[11px] font-semibold tracking-wider text-[#6b7280] uppercase">
                          Case Study 0{index + 1} · {cs.village}
                        </div>
                        <h2 className="font-display text-lg font-bold text-[#111315]">
                          {cs.farmerName}
                        </h2>
                      </div>
                    </div>
                    <Badge variant={cs.consentedToGps ? 'Measured' : 'Modelled'}>
                      {cs.consentedToGps ? 'GPS Consent' : 'Representative'}
                    </Badge>
                  </div>

                  {/* Holding & Experience */}
                  <div className="rounded-[8px] bg-[#f4f5f6] p-3 text-xs">
                    <div className="font-semibold text-[#111315]">{cs.holdingSummary}</div>
                    <div className="tabular mt-1 text-[#4b5563]">
                      {cs.parcels.length} mapped parcels ({totalHa.toFixed(1)} ha represented)
                    </div>
                  </div>

                  {/* Stated Planting Trigger Rule */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-[11px] font-semibold tracking-wider text-[#6b7280] uppercase">
                      <CalendarClock className="h-3.5 w-3.5 text-[#00b159]" />
                      <span>Stated Planting Trigger Rule:</span>
                    </div>
                    <p className="text-xs font-medium text-[#111315]">
                      {PLANTING_TRIGGER_TITLES[triggerRule as keyof typeof PLANTING_TRIGGER_TITLES]
                        ?.en ?? triggerRule}
                    </p>
                  </div>

                  {/* Crops Grown */}
                  <div className="space-y-1.5">
                    <div className="text-[11px] font-semibold tracking-wider text-[#6b7280] uppercase">
                      Crops in Rotation Sequence:
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {cs.cropCodes.map((code) => (
                        <span
                          key={code}
                          className="rounded-md border border-[#e5e7eb] bg-[#fafafb] px-2 py-0.5 text-[11px] font-medium text-[#374151]"
                        >
                          {formatCropWithHausa(code, true)}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* 3 Rotation Strategies Preview */}
                  <div className="space-y-1.5 border-t border-[#f3f4f6] pt-3">
                    <div className="flex items-center gap-1.5 text-[11px] font-semibold tracking-wider text-[#6b7280] uppercase">
                      <GitCompareArrows className="h-3.5 w-3.5 text-[#0a4232]" />
                      <span>3-Strategy Rotation Comparison:</span>
                    </div>
                    <ul className="space-y-1 text-xs text-[#374151]">
                      {cs.rotationComparison.strategies.map((opt, idx) => (
                        <li
                          key={`${opt.label}-${idx}`}
                          className="flex items-center justify-between gap-2"
                        >
                          <span className="truncate">
                            {idx + 1}. {opt.label}
                          </span>
                          <span className="shrink-0 font-mono text-[11px] font-semibold text-[#0b4f2f]">
                            {opt.rank === 'first'
                              ? '1st Choice'
                              : opt.rank === 'tied'
                                ? 'Tied'
                                : 'Baseline'}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Action Footer */}
                <div className="mt-6 flex items-center justify-between gap-2 border-t border-[#e5e7eb] pt-4">
                  <Link href={`/cases/${cs.slug}`} className="flex-1">
                    <Button variant="primary" size="md" className="w-full">
                      <span>Open Parcel Workspace</span>
                      <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </Button>
                  </Link>
                  <Link href={`/farms/${cs.farm.id}/reports`}>
                    <Button variant="secondary" size="md" title="Print field sheet">
                      <FileText className="h-4 w-4" aria-hidden="true" />
                    </Button>
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </div>
  );
}
