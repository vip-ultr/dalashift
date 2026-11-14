import {
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  Compass,
  FileText,
  GitCompareArrows,
  Layers,
  MapPin,
  Quote,
  ShieldCheck,
  Sprout,
} from 'lucide-react';
import Link from 'next/link';
import type * as React from 'react';

import { ParcelVectorThumbnail } from '../components/farms/parcel-vector-thumbnail';
import { PublicNavbar } from '../components/layout/public-navbar';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { CASE_STUDY_PROFILES } from '../features/cases/case-study-data';
import { formatCropWithHausa } from '../lib/utilities/format';

export default function LandingPage(): React.JSX.Element {
  const featuredCase = CASE_STUDY_PROFILES[0];

  return (
    <div className="min-h-screen bg-[#f6f4ef] text-[#111315]">
      <PublicNavbar />

      {/* HERO SECTION */}
      <section className="relative overflow-hidden border-b border-[#e5e7eb] pt-10 pb-16 sm:pt-16 sm:pb-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12">
            {/* Left Column: Editorial Copy & CTAs */}
            <div className="space-y-6 lg:col-span-7">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#b7ebc9] bg-[#ebfaef] px-3.5 py-1.5 text-xs font-semibold tracking-wider text-[#0b4f2f] uppercase">
                <Sprout className="h-3.5 w-3.5 text-[#00b159]" aria-hidden="true" />
                <span>
                  Field-Grounded Agricultural Intelligence · Tofa LGA, Kano State
                </span>
              </div>

              <h1 className="font-display text-3xl leading-[1.12] font-bold tracking-tight text-[#111315] sm:text-5xl">
                Farm-specific crop &amp; rotation guidance grounded in Earth
                observation.
              </h1>

              <p className="max-w-2xl text-base leading-relaxed text-[#4b5563] sm:text-lg">
                Register your parcels, state your crop history and planting
                trigger, and compare side-by-side rotation strategies backed by
                NASA satellite data, SoilGrids, and Northern Nigeria agronomic
                research.
              </p>

              <div className="flex flex-wrap items-center gap-3.5 pt-2">
                <Link href="/cases">
                  <Button variant="primary" size="lg">
                    <span>Explore Tofa LGA Case Studies</span>
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Button>
                </Link>
                <Link href="/farms/new">
                  <Button variant="outline" size="lg">
                    <span>Register Your Farm</span>
                  </Button>
                </Link>
              </div>

              {/* Key Trust Pills */}
              <div className="grid grid-cols-1 gap-3 pt-4 sm:grid-cols-3">
                <div className="rounded-[10px] border border-[#e5e7eb] bg-white p-3 shadow-2xs">
                  <div className="text-xs font-bold text-[#111315]">
                    Farmer Ground Truth
                  </div>
                  <p className="mt-0.5 text-[11px] leading-snug text-[#6b7280]">
                    Never guesses what you grow. Built on your stated crop
                    history and local Hausa crop names.
                  </p>
                </div>
                <div className="rounded-[10px] border border-[#e5e7eb] bg-white p-3 shadow-2xs">
                  <div className="text-xs font-bold text-[#111315]">
                    Resolution Honesty
                  </div>
                  <p className="mt-0.5 text-[11px] leading-snug text-[#6b7280]">
                    Every figure states whether it is 250 m modelled soil, ~5 km
                    rainfall, or ~9 km regional moisture.
                  </p>
                </div>
                <div className="rounded-[10px] border border-[#e5e7eb] bg-white p-3 shadow-2xs">
                  <div className="text-xs font-bold text-[#111315]">
                    Deterministic Ruleset
                  </div>
                  <p className="mt-0.5 text-[11px] leading-snug text-[#6b7280]">
                    No black-box composite scores. Every verdict traces to a
                    named threshold and cited trial.
                  </p>
                </div>
              </div>
            </div>

            {/* Right Column: Live Interactive Preview Card */}
            {featuredCase ? (
              <div className="lg:col-span-5">
                <div className="overflow-hidden rounded-[16px] border border-[#e5e7eb] bg-white shadow-lg">
                  {/* Dark Map HUD Top Bar */}
                  <div className="flex items-center justify-between bg-[#111315] px-4 py-3 text-white">
                    <div className="flex items-center gap-2.5">
                      <ParcelVectorThumbnail
                        geometry={featuredCase.parcels[0]!.geometry}
                        size={36}
                        active
                      />
                      <div>
                        <div className="text-xs font-semibold">
                          {featuredCase.farmerName} · Doka Village
                        </div>
                        <div className="tabular text-[11px] text-white/70">
                          {featuredCase.parcels.length} parcels · 4.00 ha total
                          holding
                        </div>
                      </div>
                    </div>
                    <Badge variant="Strong">Validated Case</Badge>
                  </div>

                  {/* Preview Body */}
                  <div className="space-y-4 p-5">
                    <div className="rounded-[10px] border border-[#b7ebc9] bg-[#ebfaef]/70 p-3.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] font-semibold tracking-wider text-[#0b4f2f] uppercase">
                          Moisture-Conditioned Planting Trigger
                        </span>
                        <Badge variant="Strong">Conditions Met</Badge>
                      </div>
                      <p className="mt-1 text-xs font-medium text-[#111315]">
                        Wait for confirmed soil moisture before sowing (Bello&apos;s
                        stated rule)
                      </p>
                      <p className="tabular mt-1 text-[11px] text-[#374151]">
                        14-day CHIRPS rainfall: <strong>44.5 mm</strong> · SMAP
                        root-zone: <strong>0.21 m³/m³</strong> (~9 km regional cell)
                      </p>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs font-semibold text-[#111315]">
                        <span>3-Strategy Rotation Comparison</span>
                        <span className="font-mono text-[11px] text-[#6b7280]">
                          Ruleset v1.0.0
                        </span>
                      </div>

                      {featuredCase.rotationComparison.options.map((opt, idx) => (
                        <div
                          key={opt.optionId}
                          className={`flex items-center justify-between rounded-[8px] border px-3 py-2 text-xs ${
                            idx === 1
                              ? 'border-[#00b159] bg-[#ebfaef]/40'
                              : 'border-[#e5e7eb] bg-[#fafafb]'
                          }`}
                        >
                          <div>
                            <div className="font-semibold text-[#111315]">
                              {idx === 0
                                ? '1. Existing Practice Baseline'
                                : `2.${idx} Recommended Alternative`}
                            </div>
                            <div className="text-[11px] text-[#4b5563]">
                              {opt.optionName}
                            </div>
                          </div>
                          <Badge
                            variant={
                              opt.rankPosition === 'first'
                                ? 'Strong'
                                : opt.rankPosition === 'tied'
                                  ? 'Moderate'
                                  : 'Weak'
                            }
                          >
                            {opt.rankPosition === 'first'
                              ? 'First Choice'
                              : opt.rankPosition === 'tied'
                                ? 'Tied Fit'
                                : 'Baseline Risk'}
                          </Badge>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center justify-between border-t border-[#e5e7eb] pt-3">
                      <span className="text-[11px] text-[#6b7280]">
                        No login required to inspect field interviews
                      </span>
                      <Link
                        href={`/cases/${featuredCase.slug}`}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-[#00b159] hover:underline"
                      >
                        <span>Open Bello&apos;s Workspace</span>
                        <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </section>

      {/* SECTION 2: WHAT DOKA FARMERS TOLD US (3 CASE STUDY BENTO CARDS) */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div className="max-w-2xl space-y-2">
              <div className="text-xs font-semibold tracking-wider text-[#ab6a43] uppercase">
                Field Validation · Doka Village, Tofa LGA, Kano State
              </div>
              <h2 className="font-display text-2xl font-bold tracking-tight text-[#111315] sm:text-3xl">
                Three real farming practices in one village, three distinct
                advisory needs.
              </h2>
              <p className="text-sm text-[#4b5563]">
                Conducted in Hausa in Doka village, Tofa LGA. Even within a
                single community, farmers manage multi-parcel holdings with
                different planting triggers and rotation strategies.
              </p>
            </div>
            <Link href="/cases">
              <Button variant="secondary" size="md">
                <span>Compare All 3 Case Studies</span>
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Button>
            </Link>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
            {CASE_STUDY_PROFILES.map((cs, index) => (
              <article
                key={cs.slug}
                className="flex flex-col justify-between rounded-[12px] border border-[#e5e7eb] bg-white p-6 shadow-xs transition-shadow hover:shadow-md"
              >
                <div className="space-y-4">
                  {/* Card Header with Vector Parcel Preview */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <ParcelVectorThumbnail
                        geometry={cs.parcels[0]!.geometry}
                        size={44}
                        active={index === 0}
                      />
                      <div>
                        <span className="text-[11px] font-semibold text-[#6b7280]">
                          Interview 0{index + 1} · {cs.village}
                        </span>
                        <h3 className="font-display text-base font-bold text-[#111315]">
                          {cs.farmerName}
                        </h3>
                      </div>
                    </div>
                    <Badge variant={cs.consentedToGps ? 'Measured' : 'Modelled'}>
                      {cs.parcels.length} Parcels
                    </Badge>
                  </div>

                  <p className="text-xs font-medium text-[#374151]">
                    {cs.holdingSummary}
                  </p>

                  {/* Verbatim Quote with Terracotta Left Border */}
                  <blockquote className="rounded-r-[8px] border-l-4 border-l-[#ab6a43] bg-[#f6f4ef] p-3 text-xs leading-relaxed text-[#1f2937] italic">
                    &ldquo;{cs.verbatimQuote}&rdquo;
                  </blockquote>

                  {/* Crops Grown with Hausa Field Terms */}
                  <div className="space-y-1.5">
                    <div className="text-[11px] font-semibold tracking-wider text-[#6b7280] uppercase">
                      Stated Crops (English + Hausa):
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {cs.cropCodes.map((code) => (
                        <span
                          key={code}
                          className="rounded-md border border-[#e5e7eb] bg-[#f4f5f6] px-2 py-0.5 text-[11px] font-medium text-[#374151]"
                        >
                          {formatCropWithHausa(code, true)}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex items-center justify-between border-t border-[#e5e7eb] pt-4">
                  <Link
                    href={`/cases/${cs.slug}`}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#00b159] hover:text-[#00994d]"
                  >
                    <span>Open Parcel Workspace</span>
                    <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </Link>
                  <Link
                    href={`/farms/${cs.farm.id}/reports`}
                    className="inline-flex items-center gap-1 text-xs font-medium text-[#4b5563] hover:text-[#111315]"
                  >
                    <FileText className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Print Sheet</span>
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 3: RESOLUTION HONESTY VISUAL (DARK FOREST GREEN SECTION) */}
      <section className="bg-[#0a4232] py-16 text-white sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12">
            <div className="space-y-4 lg:col-span-6">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-[#4ade80]">
                <Layers className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Architectural Principle · Resolution Honesty</span>
              </div>
              <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
                We never call a 9 km satellite pixel &ldquo;your farm&apos;s soil
                moisture&rdquo;.
              </h2>
              <p className="text-sm leading-relaxed text-white/85">
                Smallholder parcels in Tofa LGA typically measure 0.5 to 3
                hectares. Public satellite datasets vary from 250-metre grids to
                55-kilometre regional climate cells. DalaShift shows the true
                spatial footprint of every dataset on the map and degrades
                confidence honestly when a dataset is too coarse for field-scale
                claims.
              </p>

              <div className="space-y-2.5 pt-2">
                <div className="flex items-start gap-2.5 text-xs text-white/90">
                  <CheckCircle2
                    className="mt-0.5 h-4 w-4 shrink-0 text-[#4ade80]"
                    aria-hidden="true"
                  />
                  <span>
                    <strong>Sub-field baseline (250 m):</strong> ISRIC SoilGrids
                    2.0 and NASA MODIS NDVI resolve ~6.25 ha cells, suitable for
                    parcel-level context with a local soil test reminder.
                  </span>
                </div>
                <div className="flex items-start gap-2.5 text-xs text-white/90">
                  <CheckCircle2
                    className="mt-0.5 h-4 w-4 shrink-0 text-[#4ade80]"
                    aria-hidden="true"
                  />
                  <span>
                    <strong>District &amp; regional context (5.5 km to 55 km):</strong>{' '}
                    CHIRPS rainfall, NASA SMAP soil moisture, and NASA POWER
                    temperature are presented strictly as village or LGA climate
                    indicators.
                  </span>
                </div>
              </div>
            </div>

            {/* Scale Comparison Table Card */}
            <div className="lg:col-span-6">
              <div className="rounded-[12px] border border-white/15 bg-[#111315]/90 p-5 shadow-xl">
                <div className="text-xs font-semibold tracking-wider text-white/70 uppercase">
                  Spatial Footprint Comparison vs. a 1.5 ha Tofa Parcel
                </div>
                <div className="mt-4 space-y-3">
                  {[
                    {
                      label: 'Typical Tofa LGA Parcel Boundary',
                      res: '10 m to 30 m GPS / Polygon',
                      area: '1.5 ha (1x)',
                      color: 'bg-[#00b159]',
                      width: 'w-[12%]',
                    },
                    {
                      label: 'ISRIC SoilGrids 2.0 / MODIS NDVI',
                      res: '250 m cell (Modelled / Observed)',
                      area: '6.25 ha (~4x parcel)',
                      color: 'bg-[#ab6a43]',
                      width: 'w-[30%]',
                    },
                    {
                      label: 'CHIRPS v2.0 Rainfall',
                      res: '~5.5 km cell (0.05° grid)',
                      area: '3,025 ha (~2,000x parcel)',
                      color: 'bg-[#76a1c2]',
                      width: 'w-[62%]',
                    },
                    {
                      label: 'NASA SMAP L4 Root-Zone Moisture',
                      res: '~9 km EASE-Grid cell',
                      area: '8,100 ha (~5,400x parcel)',
                      color: 'bg-[#f59e0b]',
                      width: 'w-[80%]',
                    },
                    {
                      label: 'NASA POWER Agroclimatology',
                      res: '~55 km regional grid (0.5°)',
                      area: '302,500 ha (LGA / Regional)',
                      color: 'bg-[#9ca3af]',
                      width: 'w-full',
                    },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="rounded-[8px] bg-white/5 p-3"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-white">
                          {item.label}
                        </span>
                        <span className="tabular font-mono text-[11px] text-[#4ade80]">
                          {item.area}
                        </span>
                      </div>
                      <div className="mt-1 text-[11px] text-white/70">
                        {item.res}
                      </div>
                      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                        <div className={`h-full rounded-full ${item.color} ${item.width}`} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER WITH MANDATORY ATTRIBUTIONS & NON-ENDORSEMENT NOTICE */}
      <footer className="border-t border-[#e5e7eb] bg-white py-12 text-xs text-[#4b5563]">
        <div className="mx-auto max-w-7xl space-y-6 px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            <div className="space-y-2">
              <div className="flex items-center gap-2 font-display text-sm font-bold text-[#111315]">
                <Sprout className="h-4 w-4 text-[#00b159]" aria-hidden="true" />
                <span>DalaShift (Working Project Name)</span>
              </div>
              <p className="leading-relaxed text-[#6b7280]">
                Agricultural intelligence platform turning Earth observation data
                into farm-specific, explainable crop and rotation guidance.
                Field validation conducted in Doka village, Tofa LGA, Kano
                State, Nigeria.
              </p>
            </div>

            <div className="space-y-2">
              <div className="font-semibold text-[#111315]">
                Data Sources &amp; Mandatory Attribution
              </div>
              <ul className="space-y-1 text-[#6b7280]">
                <li>
                  • <strong>NASA POWER:</strong> NASA Langley Research Center
                  POWER Project (~0.5° agroclimatology).
                </li>
                <li>
                  • <strong>NASA SMAP &amp; MODIS:</strong> NASA Earthdata LP
                  DAAC / NSIDC DAAC (~9 km soil moisture, 250 m NDVI).
                </li>
                <li>
                  • <strong>CHIRPS v2.0:</strong> Climate Hazards Center, UC
                  Santa Barbara (~5.5 km precipitation).
                </li>
                <li>
                  • <strong>ISRIC SoilGrids 2.0:</strong> Poggio et al. (2021),
                  CC-BY-4.0 (250 m modelled soil properties).
                </li>
              </ul>
            </div>

            <div className="space-y-2">
              <div className="font-semibold text-[#111315]">
                Scientific Scope &amp; Non-Endorsement Notice
              </div>
              <p className="leading-relaxed text-[#6b7280]">
                DalaShift uses publicly available NASA Earth observation data.
                NASA does not endorse this application or its agronomic
                recommendations. Recommendations are produced by a deterministic
                rules engine (v1.0.0) and do not replace local extension
                officers (<em>malamin gona</em>) or NiMet operational weather
                forecasts.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
