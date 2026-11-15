'use client';

import {
  CalendarClock,
  Compass,
  GitCompareArrows,
  Layers,
  Printer,
  Quote,
  ShieldCheck,
  Sprout,
} from 'lucide-react';
import Link from 'next/link';
import * as React from 'react';

import type { CaseStudyFullProfile } from '../../features/cases/case-study-data';
import {
  formatMetric,
  formatObservationDate,
  formatResolutionHonesty,
  formatSourceName,
} from '../../lib/utilities/format';
import { HonestyTimeSeriesChart } from '../charts/honesty-time-series-chart';
import { ParcelVectorThumbnail } from '../farms/parcel-vector-thumbnail';
import { HonestyMapCanvas } from '../maps/honesty-map-canvas';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { SegmentedControl } from '../ui/segmented-control';
import { UnderlineTabs } from '../ui/underline-tabs';
import { PlantingTriggerCard } from './planting-trigger-card';
import { ProvenanceLine } from './provenance-line';
import { RotationStrategyCard } from './rotation-strategy-card';
import { SeasonalOutlookPanel } from './seasonal-outlook-panel';
import { SituationBanner } from './situation-banner';
import { SuitabilityShortlistCard } from './suitability-shortlist-card';

export interface ParcelWorkspaceViewProps {
  readonly profile: CaseStudyFullProfile;
  readonly isCaseStudy?: boolean;
  readonly initialTab?: 'trigger' | 'rotation' | 'suitability' | 'environment';
}

export function ParcelWorkspaceView({
  profile,
  isCaseStudy = false,
  initialTab = 'trigger',
}: ParcelWorkspaceViewProps): React.JSX.Element {
  const [selectedParcelId, setSelectedParcelId] = React.useState<string>(
    profile.parcels[0]?.id ?? '',
  );
  const [activeTab, setActiveTab] = React.useState<
    'trigger' | 'rotation' | 'suitability' | 'environment'
  >(initialTab);
  const [languageMode, setLanguageMode] = React.useState<'en' | 'ha'>('ha');
  const [viewMode, setViewMode] = React.useState<'farmer' | 'adviser'>('farmer');

  const activeParcel =
    profile.parcels.find((parcel) => parcel.id === selectedParcelId) ?? profile.parcels[0];

  const showHausaSort = languageMode === 'ha';

  const soilPhObs = profile.observations.find((obs) => obs.variable === 'soil_ph');
  const soilOcObs = profile.observations.find((obs) => obs.variable === 'soil_organic_carbon');
  const sandObs = profile.observations.find((obs) => obs.variable === 'sand_fraction');
  const clayObs = profile.observations.find((obs) => obs.variable === 'clay_fraction');

  if (!activeParcel) {
    return (
      <div className="p-6 text-sm text-[#6b7280]">No parcels registered for this farm holding.</div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafafa] pb-16">
      {/* Top Bar: Holding Context, Mode Toggles, Report Link */}
      <div className="border-b border-[#e5e7eb] bg-white px-4 py-4 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              {isCaseStudy ? (
                <Badge variant="pass">Field Validation Case Study</Badge>
              ) : (
                <Badge variant="default">Holding Workspace</Badge>
              )}
              <span className="text-xs font-medium text-[#6b7280]">
                {profile.village} · {profile.lga}, {profile.state}
              </span>
              {!profile.consentedToGps ? (
                <Badge variant="accent">Representative Coordinates (ADR-0011 D-12)</Badge>
              ) : null}
            </div>
            <h1 className="font-display text-xl font-bold tracking-tight text-[#111827] sm:text-2xl">
              {profile.farmerName}
            </h1>
            <p className="text-xs text-[#4b5563] sm:text-sm">{profile.holdingSummary}</p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <SegmentedControl
              size="sm"
              ariaLabel="Crop terminology mode"
              value={languageMode}
              onValueChange={setLanguageMode}
              options={[
                { value: 'ha', label: 'English + Hausa' },
                { value: 'en', label: 'English Only' },
              ]}
            />
            <SegmentedControl
              size="sm"
              ariaLabel="Detail level mode"
              value={viewMode}
              onValueChange={setViewMode}
              options={[
                { value: 'farmer', label: 'Farmer View' },
                { value: 'adviser', label: 'Adviser (Malamin Gona)' },
              ]}
            />
            <Link href={`/farms/${profile.farm.id}/reports`}>
              <Button variant="secondary" size="sm">
                <Printer className="size-3.5" aria-hidden="true" />
                <span>Print Field Sheet</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Multi-Parcel Switcher Strip */}
        <div className="mx-auto mt-4 max-w-7xl border-t border-[#f3f4f6] pt-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="mr-1 text-[11px] font-semibold tracking-wider text-[#6b7280] uppercase">
              Parcels in Holding ({profile.parcels.length}):
            </span>
            {profile.parcels.map((parcel) => {
              const isSelected = parcel.id === activeParcel.id;
              return (
                <button
                  key={parcel.id}
                  type="button"
                  onClick={() => setSelectedParcelId(parcel.id)}
                  className={`flex items-center gap-2.5 rounded-[10px] border px-3 py-1.5 text-left transition-all ${
                    isSelected
                      ? 'border-[#0a4232] bg-[#eaf2ee] text-[#0a4232] shadow-xs'
                      : 'border-[#e5e7eb] bg-[#fafafb] text-[#374151] hover:border-[#d1d5db] hover:bg-white'
                  }`}
                >
                  <ParcelVectorThumbnail geometry={parcel.geometry} size={24} active={isSelected} />
                  <div>
                    <div className="text-xs font-semibold">{parcel.name}</div>
                    <div className="tabular text-[11px] text-[#6b7280]">
                      {parcel.areaHa !== null
                        ? `${parcel.areaHa.toFixed(2)} ha polygon`
                        : `GPS point (±${parcel.locationUncertaintyM ?? 500} m)`}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Sticky Situation Banner */}
      <SituationBanner
        headline={`${activeParcel.name}: ${profile.plantingTrigger.condition}`}
        subheadline={`Crop rotation strategy: ${profile.rotationComparison.strategies[0]?.label ?? 'Baseline'}`}
        evidenceStrength={profile.rotationComparison.strategies[0]?.evidenceStrength ?? 'moderate'}
        evidenceStrengthReason={
          profile.rotationComparison.strategies[0]?.evidenceStrengthReason ??
          'Field interview baseline verified'
        }
        limitations={profile.rotationComparison.limitations}
        rulesetVersion={profile.rotationComparison.rulesetVersion}
        showAdviserMeta={viewMode === 'adviser'}
      />

      {/* Main Content Container */}
      <div className="mx-auto max-w-7xl space-y-6 px-4 pt-6 sm:px-6 lg:px-8">
        {/* Verbatim Field Interview Callout (for Doka case studies) */}
        {isCaseStudy ? (
          <div className="rounded-[12px] border border-[#e5e7eb] border-l-4 border-l-[#ab6a43] bg-white p-4 shadow-xs sm:p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-xs font-semibold tracking-wider text-[#ab6a43] uppercase">
                  <Quote className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Field Interview Ground Truth · {profile.farmerName}</span>
                </div>
                <blockquote className="text-sm leading-relaxed text-[#1f2937] italic">
                  &ldquo;{profile.verbatimQuote}&rdquo;
                </blockquote>
                <p className="text-xs text-[#6b7280]">
                  {profile.farmingExperience} · Source record:{' '}
                  <code className="rounded bg-[#f4f5f6] px-1.5 py-0.5 text-[11px] text-[#374151]">
                    {profile.quoteSourceRef}
                  </code>
                </p>
              </div>
              <div className="shrink-0">
                <Badge variant="Measured">Consent Verified</Badge>
              </div>
            </div>
          </div>
        ) : null}

        {/* Adviser Mode Diagnostic Strip */}
        {viewMode === 'adviser' ? (
          <div className="rounded-[12px] border border-[#0a4232]/25 bg-[#0a4232] p-4 text-white shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="h-5 w-5 text-[#4ade80]" aria-hidden="true" />
                <div>
                  <h2 className="text-sm font-semibold">
                    Extension Adviser Diagnostic Mode (Malamin Gona)
                  </h2>
                  <p className="text-xs text-white/80">
                    Showing deterministic ruleset IDs ({profile.rotationComparison.rulesetVersion}),
                    per-dimension threshold audit rows, and resolution footprints. No composite
                    weights or black-box scores are used (ADR-0011 D-05).
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="rounded-md bg-white/10 px-2.5 py-1 font-mono">
                  Ruleset: {profile.rotationComparison.rulesetVersion}
                </span>
                <span className="rounded-md bg-white/10 px-2.5 py-1 font-mono">
                  Triggers: {profile.priorities.plantingTrigger ?? 'wait_for_confirmed_moisture'}
                </span>
              </div>
            </div>
          </div>
        ) : null}

        {/* Workspace Navigation Tabs */}
        <div className="rounded-t-[12px] bg-white px-4 pt-2 shadow-xs">
          <UnderlineTabs
            ariaLabel="Parcel intelligence sections"
            value={activeTab}
            onValueChange={setActiveTab}
            tabs={[
              {
                value: 'trigger',
                label: '1. Planting Trigger & Seasonal Risk',
                icon: <CalendarClock className="h-4 w-4" aria-hidden="true" />,
              },
              {
                value: 'rotation',
                label: '2. Rotation Comparison',
                badge: 3,
                icon: <GitCompareArrows className="h-4 w-4" aria-hidden="true" />,
              },
              {
                value: 'suitability',
                label: '3. Crop Suitability Shortlist',
                badge: profile.suitabilityComparison.strategies.length,
                icon: <Sprout className="h-4 w-4" aria-hidden="true" />,
              },
              {
                value: 'environment',
                label: '4. Honesty Map & Satellite Series',
                icon: <Compass className="h-4 w-4" aria-hidden="true" />,
              },
            ]}
          />
        </div>

        {/* TAB 1: Planting Trigger & Seasonal Risk Outlook */}
        {activeTab === 'trigger' ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
              <div className="lg:col-span-6">
                <PlantingTriggerCard assessment={profile.plantingTrigger} />
              </div>
              <div className="lg:col-span-6">
                <SeasonalOutlookPanel outlook={profile.seasonalOutlook} />
              </div>
            </div>

            {/* Quick Action Bridge to Rotation & Suitability */}
            <div className="flex flex-col items-start justify-between gap-4 rounded-[12px] border border-[#e5e7eb] bg-white p-5 sm:flex-row sm:items-center">
              <div className="space-y-1">
                <h3 className="font-display text-base font-semibold text-[#111315]">
                  Ready to compare crop sequences for {activeParcel.name}?
                </h3>
                <p className="text-xs text-[#4b5563]">
                  Review the farmer&apos;s current practice alongside 2 evidence-supported rotation
                  alternatives grounded in Northern Nigeria field trials.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2.5">
                <Button variant="primary" size="md" onClick={() => setActiveTab('rotation')}>
                  <span>Compare 3 Rotation Strategies</span>
                </Button>
                <Button variant="secondary" size="md" onClick={() => setActiveTab('environment')}>
                  <span>Inspect Map & Pixel Footprints</span>
                </Button>
              </div>
            </div>
          </div>
        ) : null}

        {/* TAB 2: Rotation Strategy Comparison (1 Baseline + 2 Alternatives) */}
        {activeTab === 'rotation' ? (
          <div className="space-y-6">
            <div className="rounded-[12px] border border-[#e5e7eb] bg-white p-5 shadow-xs">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="font-display text-lg font-bold text-[#111315]">
                    Side-by-Side Rotation Comparison (3 Strategies)
                  </h2>
                  <p className="text-xs text-[#4b5563]">
                    Compares the farmer&apos;s existing sequence against 2 evidence-supported
                    alternatives across 6 transparent dimensions. No weighted composite score is
                    computed.
                  </p>
                </div>
                <Badge variant="Neutral">Ruleset {profile.rotationComparison.rulesetVersion}</Badge>
              </div>

              {profile.rotationComparison.limitations.length > 0 ? (
                <div className="mt-4 rounded-[8px] border border-[#f5e0a3] bg-[#fdf6e2] p-3">
                  <div className="text-xs font-semibold text-[#8a5300]">
                    Shared Environmental & Spatial Limitations Across All 3 Strategies:
                  </div>
                  <ul className="mt-1 space-y-1 text-xs text-[#6b7280]">
                    {profile.rotationComparison.limitations.map((lim, idx) => (
                      <li key={`${lim.kind}-${idx}`}>• {lim.statement}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              {profile.rotationComparison.strategies.map((strategy, idx) => (
                <RotationStrategyCard
                  key={`${strategy.label}-${idx}`}
                  strategy={strategy}
                  index={idx}
                  fieldLang={showHausaSort ? 'ha' : 'en'}
                  showAdviserDetails={viewMode === 'adviser'}
                />
              ))}
            </div>
          </div>
        ) : null}

        {/* TAB 3: Crop Suitability Shortlist (Prospective) */}
        {activeTab === 'suitability' ? (
          <div className="space-y-6">
            <div className="rounded-[12px] border border-[#e5e7eb] bg-white p-5 shadow-xs">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="font-display text-lg font-bold text-[#111315]">
                    Prospective Crop Suitability Shortlist
                  </h2>
                  <p className="text-xs text-[#4b5563]">
                    Evaluates candidate crops for Tofa LGA against seasonal rainfall, temperature,
                    SoilGrids 250 m soil pH, and farmer management priorities. Grouped by ordinal
                    rank (First Choice, Tied / Viable with Trade-offs, Lower Fit).
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="Strong">First Choice</Badge>
                  <Badge variant="Moderate">Viable with Trade-offs</Badge>
                </div>
              </div>
            </div>

            <SuitabilityShortlistCard
              comparison={profile.suitabilityComparison}
              fieldLang={showHausaSort ? 'ha' : 'en'}
            />
          </div>
        ) : null}

        {/* TAB 4: Honesty Map & Environmental Time Series */}
        {activeTab === 'environment' ? (
          <div className="space-y-6">
            <HonestyMapCanvas
              parcels={profile.parcels}
              selectedParcelId={activeParcel.id}
              onSelectParcel={setSelectedParcelId}
              heightClass="h-[460px]"
            />

            {/* SoilGrids 250 m Baseline Summary Card */}
            <div className="rounded-[12px] border border-[#e5e7eb] bg-white p-5 shadow-xs">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Layers className="h-4 w-4 text-[#ab6a43]" aria-hidden="true" />
                    <h3 className="font-display text-base font-bold text-[#111315]">
                      Sub-Field Baseline Soil Profile (ISRIC SoilGrids 2.0 · 250 m Modelled)
                    </h3>
                  </div>
                  <p className="mt-0.5 text-xs text-[#4b5563]">
                    0 to 30 cm topsoil estimate for {activeParcel.name}. Because SoilGrids is a 250
                    m machine-learning prediction (~6.25 ha per cell), confirm pH and fertility with
                    a physical soil test before purchasing bulk lime or chemical fertiliser.
                  </p>
                </div>
                <Badge variant="Modelled">Modelled 250 m Grid</Badge>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-[8px] bg-[#f4f5f6] p-3">
                  <div className="text-[11px] font-medium text-[#6b7280]">Topsoil pH (H2O)</div>
                  <div className="tabular mt-1 text-lg font-bold text-[#111315]">
                    {soilPhObs ? formatMetric(soilPhObs.value, '', 1) : '6.1'}
                  </div>
                  <div className="mt-0.5 text-[11px] text-[#4b5563]">
                    Slightly acidic (5.5 to 7.0 target)
                  </div>
                </div>

                <div className="rounded-[8px] bg-[#f4f5f6] p-3">
                  <div className="text-[11px] font-medium text-[#6b7280]">Organic Carbon</div>
                  <div className="tabular mt-1 text-lg font-bold text-[#111315]">
                    {soilOcObs ? formatMetric(soilOcObs.value, 'g/kg', 1) : '6.8 g/kg'}
                  </div>
                  <div className="mt-0.5 text-[11px] text-[#4b5563]">
                    Low Sudan Savanna baseline
                  </div>
                </div>

                <div className="rounded-[8px] bg-[#f4f5f6] p-3">
                  <div className="text-[11px] font-medium text-[#6b7280]">Sand Fraction</div>
                  <div className="tabular mt-1 text-lg font-bold text-[#111315]">
                    {sandObs ? formatMetric(sandObs.value, '%', 0) : '68 %'}
                  </div>
                  <div className="mt-0.5 text-[11px] text-[#4b5563]">
                    Sandy loam drainage profile
                  </div>
                </div>

                <div className="rounded-[8px] bg-[#f4f5f6] p-3">
                  <div className="text-[11px] font-medium text-[#6b7280]">Clay Fraction</div>
                  <div className="tabular mt-1 text-lg font-bold text-[#111315]">
                    {clayObs ? formatMetric(clayObs.value, '%', 0) : '14 %'}
                  </div>
                  <div className="mt-0.5 text-[11px] text-[#4b5563]">
                    Moderate moisture retention
                  </div>
                </div>
              </div>

              {soilPhObs ? (
                <div className="mt-3">
                  <ProvenanceLine
                    sourceId={soilPhObs.sourceId}
                    spatialResolutionM={soilPhObs.spatialResolutionM}
                    observedAt={soilPhObs.observedAt}
                    isModelled={soilPhObs.isModelled}
                    coverageFraction={soilPhObs.coverageFraction}
                  />
                </div>
              ) : null}
            </div>

            {/* 3 Time-Series Charts with Explicit Provenance Lines */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <HonestyTimeSeriesChart
                title="Seasonal Rainfall vs. 10-Year Baseline"
                summarySentence="Dekadal accumulation across the May to October rainy season"
                unit="mm"
                chartType="bar"
                data={profile.rainfallChartSeries}
                sourceId="chirps"
                spatialResolutionM={5500}
                observedAt="2026-06-14T00:00:00.000Z"
                isModelled={false}
              />

              <HonestyTimeSeriesChart
                title="Regional Root-Zone Soil Moisture"
                summarySentence="Volumetric moisture fraction in top 100 cm (~9 km cell)"
                unit="m³/m³"
                chartType="line"
                data={profile.soilMoistureChartSeries}
                sourceId="nasa_smap"
                spatialResolutionM={9000}
                observedAt="2026-06-13T00:00:00.000Z"
                isModelled={true}
              />

              <HonestyTimeSeriesChart
                title="Canopy Greenness (MODIS NDVI)"
                summarySentence="16-day composite vegetation index (250 m resolution)"
                unit="NDVI"
                chartType="line"
                data={profile.ndviChartSeries}
                gapNotice="Cloud cover masked during peak August rains"
                sourceId="nasa_modis_ndvi"
                spatialResolutionM={250}
                observedAt="2026-06-10T00:00:00.000Z"
                isModelled={false}
              />
            </div>

            {/* Adviser Full Provenance Audit Table */}
            {viewMode === 'adviser' ? (
              <div className="rounded-[12px] border border-[#e5e7eb] bg-white p-5 shadow-xs">
                <h3 className="font-display text-base font-bold text-[#111315]">
                  Complete Environmental Observation Provenance Log
                </h3>
                <p className="mt-0.5 text-xs text-[#6b7280]">
                  Every environmental input carries its upstream source, spatial footprint,
                  observation timestamp, and measured vs. modelled classification.
                </p>
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full border-collapse text-left text-xs">
                    <thead>
                      <tr className="border-b border-[#e5e7eb] bg-[#f4f5f6] text-[11px] font-semibold text-[#4b5563] uppercase">
                        <th className="px-3 py-2.5">Variable</th>
                        <th className="px-3 py-2.5">Value</th>
                        <th className="px-3 py-2.5">Source</th>
                        <th className="px-3 py-2.5">Spatial Footprint</th>
                        <th className="px-3 py-2.5">Observed Date</th>
                        <th className="px-3 py-2.5">Nature</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#e5e7eb]">
                      {profile.observations.map((obs, index) => (
                        <tr key={`${obs.variable}-${index}`} className="hover:bg-[#fafafb]">
                          <td className="px-3 py-2.5 font-mono font-medium text-[#111315]">
                            {obs.variable}
                          </td>
                          <td className="tabular px-3 py-2.5 font-semibold text-[#111315]">
                            {obs.value} {obs.unit}
                          </td>
                          <td className="px-3 py-2.5 text-[#374151]">
                            {formatSourceName(obs.sourceId)}
                          </td>
                          <td className="px-3 py-2.5 text-[#4b5563]">
                            {formatResolutionHonesty(obs.spatialResolutionM)}
                          </td>
                          <td className="tabular px-3 py-2.5 text-[#4b5563]">
                            {formatObservationDate(obs.observedAt)}
                          </td>
                          <td className="px-3 py-2.5">
                            <Badge variant={obs.isModelled ? 'Modelled' : 'Measured'}>
                              {obs.isModelled ? 'Modelled' : 'Measured'}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
