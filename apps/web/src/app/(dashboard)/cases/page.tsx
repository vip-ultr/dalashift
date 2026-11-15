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
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="Strong">Field Validation · Tofa LGA</Badge>
                <span className="text-xs font-medium text-[#6b7280]">
                  Doka Village · Kano State, Nigeria · Public Access
                </span>
              </div>
              <h1 className="font-display text-2xl font-bold tracking-tight text-[#111315] sm:text-3xl">
                Doka Village Field Case Studies
              </h1>
              <p className="max-w-3xl text-sm leading-relaxed text-[#4b5563]">
                Three in-person interviews conducted in Hausa in Doka village, Tofa Local Government
                Area. Select any farmer below to inspect their multi-parcel holding,
                moisture-conditioned planting trigger, and 3-strategy rotation comparison without
                signing in.
              </p>
            </div>

            <div className="flex shrink-0 flex-wrap items-center gap-2.5">
              <Link href="/farms/new">
                <Button variant="primary" size="md">
                  <span>+ Register Your Own Farm</span>
                </Button>
              </Link>
              <Link href="/methodology">
                <Button variant="secondary" size="md">
                  <span>Methodology &amp; Citations</span>
                </Button>
              </Link>
            </div>
          </div>

          {/* Scope Honesty Strip */}
          <div className="mt-4 flex items-start gap-2.5 rounded-[8px] border border-[#cce0f5] bg-[#eef5fc] p-3 text-xs text-[#1d4ed8]">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#1d4ed8]" aria-hidden="true" />
            <div>
              <strong>Validation Scope &amp; Consent:</strong> Field validation
              covers Doka village in Tofa LGA, Kano State. It does not claim validation across all
              of Nigeria. Bello Yusuf Maitama and Amina Habibu consented to publication and GPS
              capture; Abubakar (Dan Hajiya) consented to publication while GPS capture was not
              raised, so his plots use representative Doka coordinates.
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
                      {cs.parcels.length} mapped parcels ({totalHa.toFixed(1)} ha represented) ·{' '}
                      {cs.farmingExperience}
                    </div>
                  </div>

                  {/* Verbatim Quote */}
                  <blockquote className="rounded-r-[8px] border-l-4 border-l-[#ab6a43] bg-[#f6f4ef] p-3 text-xs leading-relaxed text-[#1f2937] italic">
                    <div className="mb-1 flex items-center gap-1.5 not-italic font-semibold text-[#ab6a43]">
                      <Quote className="h-3 w-3" aria-hidden="true" />
                      <span>Translated from Hausa interview transcript</span>
                    </div>
                    &ldquo;{cs.verbatimQuote}&rdquo;
                  </blockquote>

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
