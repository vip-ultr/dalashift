import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Database,
  Layers,
  Scale,
  ShieldCheck,
  Sprout,
} from 'lucide-react';
import Link from 'next/link';
import type * as React from 'react';

import { PublicNavbar } from '../../../components/layout/public-navbar';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { CATALOG_CROPS } from '../../../features/cases/case-study-data';
import { formatCropWithHausa } from '../../../lib/utilities/format';

export default function MethodologyPage(): React.JSX.Element {
  return (
    <div className="min-h-screen bg-[#f6f4ef] text-[#111315]">
      <PublicNavbar />

      <main className="mx-auto max-w-6xl space-y-8 px-4 py-10 sm:px-6 lg:px-8">
        {/* Header Card */}
        <section className="rounded-[12px] border border-[#e5e7eb] bg-white p-6 shadow-xs sm:p-8">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="Strong">Deterministic Ruleset v1.0.0</Badge>
            <Badge variant="Neutral">ADR-0011 Compliant</Badge>
          </div>
          <h1 className="mt-3 font-display text-3xl font-bold tracking-tight text-[#111315]">
            Recommendation Methodology &amp; Data Sources
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-[#4b5563]">
            DalaShift does not use a large language model, arbitrary weights, or
            composite percentage scores to recommend crops. Every conclusion is
            a measured or modelled environmental value compared against a cited
            agronomic threshold, an ordinal rank position with a stated basis,
            and a qualitative evidence strength rating.
          </p>

          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-[10px] bg-[#f4f5f6] p-4">
              <div className="flex items-center gap-2 text-xs font-bold text-[#111315]">
                <Scale className="h-4 w-4 text-[#00b159]" aria-hidden="true" />
                <span>No Composite Scores (D-05)</span>
              </div>
              <p className="mt-1 text-xs leading-relaxed text-[#4b5563]">
                Soil pH, rainfall, temperature, and nitrogen balance cannot be
                averaged together. A failure on a hard biological constraint
                cannot be hidden by a high score elsewhere.
              </p>
            </div>

            <div className="rounded-[10px] bg-[#f4f5f6] p-4">
              <div className="flex items-center gap-2 text-xs font-bold text-[#111315]">
                <Layers className="h-4 w-4 text-[#ab6a43]" aria-hidden="true" />
                <span>Resolution Honesty (§ 9)</span>
              </div>
              <p className="mt-1 text-xs leading-relaxed text-[#4b5563]">
                Coarse grids (~9 km SMAP, ~55 km POWER) are labelled as regional
                climate indicators. Sub-field SoilGrids (250 m) is labelled as a
                modelled baseline requiring local verification.
              </p>
            </div>

            <div className="rounded-[10px] bg-[#f4f5f6] p-4">
              <div className="flex items-center gap-2 text-xs font-bold text-[#111315]">
                <ShieldCheck
                  className="h-4 w-4 text-[#0a4232]"
                  aria-hidden="true"
                />
                <span>Dual Rule Provenance (D-11)</span>
              </div>
              <p className="mt-1 text-xs leading-relaxed text-[#4b5563]">
                Published literature rules (e.g. Yusuf et al. 2009; Brouwer
                &amp; Heibloem 1986) are separated from farmer-reported Doka
                village practices so each source is cited honestly.
              </p>
            </div>
          </div>
        </section>

        {/* Earth Observation Datasets Table */}
        <section className="rounded-[12px] border border-[#e5e7eb] bg-white p-6 shadow-xs">
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5 text-[#00b159]" aria-hidden="true" />
            <h2 className="font-display text-xl font-bold text-[#111315]">
              Earth Observation &amp; Soil Datasets
            </h2>
          </div>
          <p className="mt-1 text-xs text-[#6b7280]">
            All external calls run server-side and cache with full provenance in
            Supabase PostGIS.
          </p>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-[#e5e7eb] bg-[#f4f5f6] text-[11px] font-bold text-[#374151] uppercase">
                  <th className="px-3 py-2.5">Dataset</th>
                  <th className="px-3 py-2.5">Variables</th>
                  <th className="px-3 py-2.5">Spatial Resolution</th>
                  <th className="px-3 py-2.5">Cadence</th>
                  <th className="px-3 py-2.5">Nature</th>
                  <th className="px-3 py-2.5">Role in Engine</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e5e7eb]">
                <tr>
                  <td className="px-3 py-3 font-semibold text-[#111315]">
                    NASA POWER Agroclimatology
                  </td>
                  <td className="px-3 py-3 text-[#374151]">
                    PRECTOTCORR, T2M, T2M_MAX, T2M_MIN, ALLSKY_SFC_SW_DWN
                  </td>
                  <td className="tabular px-3 py-3 text-[#374151]">
                    ~55 km (0.5° × 0.625°)
                  </td>
                  <td className="px-3 py-3 text-[#374151]">Daily (2-day lag)</td>
                  <td className="px-3 py-3">
                    <Badge variant="Modelled">Modelled</Badge>
                  </td>
                  <td className="px-3 py-3 text-[#4b5563]">
                    Regional temperature range &amp; 10-year seasonal rainfall
                    climatology
                  </td>
                </tr>
                <tr>
                  <td className="px-3 py-3 font-semibold text-[#111315]">
                    CHIRPS v2.0 Precipitation
                  </td>
                  <td className="px-3 py-3 text-[#374151]">
                    Daily &amp; dekadal rainfall accumulation (mm)
                  </td>
                  <td className="tabular px-3 py-3 text-[#374151]">
                    ~5.5 km (0.05°)
                  </td>
                  <td className="px-3 py-3 text-[#374151]">Daily / Dekadal</td>
                  <td className="px-3 py-3">
                    <Badge variant="Measured">Satellite + Gauge</Badge>
                  </td>
                  <td className="px-3 py-3 text-[#4b5563]">
                    14-day planting trigger rainfall &amp; seasonal anomaly check
                  </td>
                </tr>
                <tr>
                  <td className="px-3 py-3 font-semibold text-[#111315]">
                    NASA SMAP Enhanced L3 / L4
                  </td>
                  <td className="px-3 py-3 text-[#374151]">
                    Surface &amp; root-zone volumetric soil moisture (m³/m³)
                  </td>
                  <td className="tabular px-3 py-3 text-[#374151]">
                    ~9 km EASE-Grid
                  </td>
                  <td className="px-3 py-3 text-[#374151]">Daily to 3-day</td>
                  <td className="px-3 py-3">
                    <Badge variant="Measured">Radiometer / Assimilated</Badge>
                  </td>
                  <td className="px-3 py-3 text-[#4b5563]">
                    Regional moisture establishment check for sowing trigger
                  </td>
                </tr>
                <tr>
                  <td className="px-3 py-3 font-semibold text-[#111315]">
                    ISRIC SoilGrids 2.0
                  </td>
                  <td className="px-3 py-3 text-[#374151]">
                    phh2o, soc, nitrogen, sand, clay, silt, cec (0 to 30 cm)
                  </td>
                  <td className="tabular px-3 py-3 text-[#374151]">
                    250 m (~6.25 ha)
                  </td>
                  <td className="px-3 py-3 text-[#374151]">Static baseline</td>
                  <td className="px-3 py-3">
                    <Badge variant="Modelled">Modelled ML</Badge>
                  </td>
                  <td className="px-3 py-3 text-[#4b5563]">
                    Sub-field soil pH and texture screening (with soil test
                    advisory)
                  </td>
                </tr>
                <tr>
                  <td className="px-3 py-3 font-semibold text-[#111315]">
                    NASA MODIS MOD13Q1 v061
                  </td>
                  <td className="px-3 py-3 text-[#374151]">
                    NDVI, EVI, pixel reliability
                  </td>
                  <td className="tabular px-3 py-3 text-[#374151]">
                    250 m (~6.25 ha)
                  </td>
                  <td className="px-3 py-3 text-[#374151]">16-day composite</td>
                  <td className="px-3 py-3">
                    <Badge variant="Measured">Measured Optical</Badge>
                  </td>
                  <td className="px-3 py-3 text-[#4b5563]">
                    Canopy vigour curve with explicit cloud-cover gap masking
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Cited Crop Catalog Thresholds */}
        <section className="rounded-[12px] border border-[#e5e7eb] bg-white p-6 shadow-xs">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-[#0a4232]" aria-hidden="true" />
            <h2 className="font-display text-xl font-bold text-[#111315]">
              Crop Reference Catalog &amp; Cited Thresholds
            </h2>
          </div>
          <p className="mt-1 text-xs text-[#6b7280]">
            Indicative seasonal water need ranges from Brouwer &amp; Heibloem
            (1986) are rough reference bands, never hard pass/fail cutoffs.
          </p>

          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            {CATALOG_CROPS.map((crop) => (
              <div
                key={crop.code}
                className="rounded-[10px] border border-[#e5e7eb] bg-[#fafafb] p-4"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-display text-sm font-bold text-[#111315]">
                      {formatCropWithHausa(crop.code, true)}
                    </h3>
                    <p className="text-[11px] text-[#6b7280] italic">
                      {crop.scientificName}
                    </p>
                  </div>
                  <Badge
                    variant={
                      crop.rotationTraits.nitrogenContribution === 'fixes'
                        ? 'Strong'
                        : 'Neutral'
                    }
                  >
                    {crop.rotationTraits.nitrogenContribution === 'fixes'
                      ? 'Fixes Biological N'
                      : 'Consumes Soil N'}
                  </Badge>
                </div>

                <div className="tabular mt-3 grid grid-cols-3 gap-2 rounded bg-white p-2.5 text-[11px]">
                  <div>
                    <div className="text-[#6b7280]">Water Need</div>
                    <div className="font-semibold text-[#111315]">
                      {crop.agronomicRequirements.indicativeCropWaterNeedMmPerSeason
                        ? `${crop.agronomicRequirements.indicativeCropWaterNeedMmPerSeason.min} to ${crop.agronomicRequirements.indicativeCropWaterNeedMmPerSeason.max} mm`
                        : 'n/a'}
                    </div>
                  </div>
                  <div>
                    <div className="text-[#6b7280]">Temp Range</div>
                    <div className="font-semibold text-[#111315]">
                      {crop.agronomicRequirements.temperatureC
                        ? `${crop.agronomicRequirements.temperatureC.min} to ${crop.agronomicRequirements.temperatureC.max} °C`
                        : 'n/a'}
                    </div>
                  </div>
                  <div>
                    <div className="text-[#6b7280]">Soil pH</div>
                    <div className="font-semibold text-[#111315]">
                      {crop.agronomicRequirements.soilPh
                        ? `${crop.agronomicRequirements.soilPh.min} to ${crop.agronomicRequirements.soilPh.max}`
                        : 'n/a'}
                    </div>
                  </div>
                </div>

                <div className="mt-2.5 space-y-1 text-[11px] text-[#4b5563]">
                  {crop.sourceCitations.map((cit) => (
                    <div key={cit.citation}>• {cit.citation}</div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 flex justify-end border-t border-[#e5e7eb] pt-4">
            <Link href="/cases">
              <Button variant="primary" size="md">
                <span>Inspect Ruleset on Doka Case Studies</span>
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Button>
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
