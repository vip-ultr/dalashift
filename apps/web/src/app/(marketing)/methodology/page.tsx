'use client';

import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import type * as React from 'react';

import { useLanguage } from '../../../i18n/language-provider';
import { PublicNavbar } from '../../../components/layout/public-navbar';
import { SiteFooter } from '../../../components/layout/site-footer';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { CATALOG_CROPS } from '../../../features/crops/catalog';
import { formatCropWithHausa } from '../../../lib/utilities/format';

type NatureVariant = 'Modelled' | 'Measured';

interface Dataset {
  readonly dataset: string;
  readonly variables: string;
  readonly resolution: string;
  readonly cadence: string;
  readonly nature: string;
  readonly natureVariant: NatureVariant;
  readonly role: string;
}

const DATASETS: readonly Dataset[] = [
  {
    dataset: 'NASA POWER Agroclimatology',
    variables: 'PRECTOTCORR, T2M, T2M_MAX, T2M_MIN, ALLSKY_SFC_SW_DWN',
    resolution: '~55 km (0.5° × 0.625°)',
    cadence: 'Daily (2-day lag)',
    nature: 'Modelled',
    natureVariant: 'Modelled',
    role: 'Regional temperature range and 10-year seasonal rainfall climatology',
  },
  {
    dataset: 'CHIRPS v2.0 Precipitation',
    variables: 'Daily and dekadal rainfall accumulation (mm)',
    resolution: '~5.5 km (0.05°)',
    cadence: 'Daily / Dekadal',
    nature: 'Satellite + Gauge',
    natureVariant: 'Measured',
    role: '14-day planting trigger rainfall and seasonal anomaly check',
  },
  {
    dataset: 'NASA SMAP Enhanced L3 / L4',
    variables: 'Surface and root-zone volumetric soil moisture (m³/m³)',
    resolution: '~9 km EASE-Grid',
    cadence: 'Daily to 3-day',
    nature: 'Radiometer / Assimilated',
    natureVariant: 'Measured',
    role: 'Regional moisture establishment check for sowing trigger',
  },
  {
    dataset: 'ISRIC SoilGrids 2.0',
    variables: 'phh2o, soc, nitrogen, sand, clay, silt, cec (0 to 30 cm)',
    resolution: '250 m (~6.25 ha)',
    cadence: 'Static baseline',
    nature: 'Modelled ML',
    natureVariant: 'Modelled',
    role: 'Sub-field soil pH and texture screening (with soil test advisory)',
  },
  {
    dataset: 'NASA MODIS MOD13Q1 v061',
    variables: 'NDVI, EVI, pixel reliability',
    resolution: '250 m (~6.25 ha)',
    cadence: '16-day composite',
    nature: 'Measured Optical',
    natureVariant: 'Measured',
    role: 'Canopy vigour curve with explicit cloud-cover gap masking',
  },
];

/**
 * Methodology page: the honest technical register, kept calm.
 * Design note: no eyebrow labels and no three-card icon grid. The dataset
 * table is stacked into labelled cards at 390px and shown as a table with a
 * visible scroll hint from the medium breakpoint. All data is kept in one
 * DATASETS source. Tokens: canvas #fafafa, surface #ffffff, ink #111827,
 * ink-muted #4b5563, border #e5e7eb, sunken #f4f5f6.
 * Widths checked in source: 390, 768, 1440.
 */
export default function MethodologyPage(): React.JSX.Element {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-[#fafafa] text-[#111827]">
      <PublicNavbar />

      <div className="mx-auto max-w-6xl space-y-8 px-4 py-10 sm:px-6 lg:px-8">
        {/* Header: a plain statement, no eyebrow pills, no icon squares */}
        <section className="rounded-xl border border-[#e5e7eb] bg-white p-6 sm:p-8">
          <h1 className="font-display text-2xl font-bold tracking-tight text-[#111827] sm:text-3xl">
            {t('method.title')}
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-[#4b5563]">
            {t('method.intro')}
          </p>

          {/* The three principles as a calm, content-led list */}
          <div className="mt-6 divide-y divide-[#e5e7eb] border-t border-[#e5e7eb]">
            <div className="py-4">
              <h2 className="text-sm font-semibold text-[#111827]">
                {t('method.noCompositeScores')}
              </h2>
              <p className="mt-1 text-sm leading-relaxed text-[#4b5563]">
                {t('method.noCompositeBody')}
              </p>
            </div>
            <div className="py-4">
              <h2 className="text-sm font-semibold text-[#111827]">
                {t('method.resolutionHonesty')}
              </h2>
              <p className="mt-1 text-sm leading-relaxed text-[#4b5563]">
                {t('method.resolutionBody')}
              </p>
            </div>
            <div className="py-4">
              <h2 className="text-sm font-semibold text-[#111827]">
                {t('method.distinctSources')}
              </h2>
              <p className="mt-1 text-sm leading-relaxed text-[#4b5563]">
                {t('method.distinctBody')}
              </p>
            </div>
          </div>
        </section>

        {/* Earth observation datasets. Stacked cards on mobile, table from md. */}
        <section className="rounded-xl border border-[#e5e7eb] bg-white p-6">
          <h2 className="font-display text-xl font-bold text-[#111827]">
            {t('method.datasetsTitle')}
          </h2>
          <p className="mt-1 text-xs text-[#4b5563]">{t('method.datasetsNote')}</p>

          <div className="mt-4 space-y-3 md:hidden">
            {DATASETS.map((item) => (
              <div
                key={item.dataset}
                className="rounded-lg border border-[#e5e7eb] bg-[#fafafa] p-4"
              >
                <div className="text-sm font-semibold text-[#111827]">{item.dataset}</div>
                <dl className="mt-3 space-y-2.5 text-xs">
                  <div>
                    <dt className="text-[#4b5563]">{t('method.colVariables')}</dt>
                    <dd className="mt-0.5 text-[#111827]">{item.variables}</dd>
                  </div>
                  <div>
                    <dt className="text-[#4b5563]">{t('method.colResolution')}</dt>
                    <dd className="tabular mt-0.5 text-[#111827]">{item.resolution}</dd>
                  </div>
                  <div>
                    <dt className="text-[#4b5563]">{t('method.colCadence')}</dt>
                    <dd className="mt-0.5 text-[#111827]">{item.cadence}</dd>
                  </div>
                  <div>
                    <dt className="text-[#4b5563]">{t('method.colNature')}</dt>
                    <dd className="mt-1">
                      <Badge variant={item.natureVariant}>{item.nature}</Badge>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[#4b5563]">{t('method.colRole')}</dt>
                    <dd className="mt-0.5 text-[#4b5563]">{item.role}</dd>
                  </div>
                </dl>
              </div>
            ))}
          </div>

          <p className="mt-4 hidden text-xs text-[#4b5563] md:block">{t('method.scrollHint')}</p>
          <div className="mt-2 hidden overflow-x-auto md:block">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-[#e5e7eb] bg-[#f4f5f6] text-xs font-semibold text-[#374151]">
                  <th className="px-3 py-2.5">{t('method.colDataset')}</th>
                  <th className="px-3 py-2.5">{t('method.colVariables')}</th>
                  <th className="px-3 py-2.5">{t('method.colResolution')}</th>
                  <th className="px-3 py-2.5">{t('method.colCadence')}</th>
                  <th className="px-3 py-2.5">{t('method.colNature')}</th>
                  <th className="px-3 py-2.5">{t('method.colRole')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e5e7eb]">
                {DATASETS.map((item) => (
                  <tr key={item.dataset}>
                    <td className="px-3 py-3 font-semibold text-[#111827]">{item.dataset}</td>
                    <td className="px-3 py-3 text-[#374151]">{item.variables}</td>
                    <td className="tabular px-3 py-3 text-[#374151]">{item.resolution}</td>
                    <td className="px-3 py-3 text-[#374151]">{item.cadence}</td>
                    <td className="px-3 py-3">
                      <Badge variant={item.natureVariant}>{item.nature}</Badge>
                    </td>
                    <td className="px-3 py-3 text-[#4b5563]">{item.role}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Cited crop catalog thresholds. Data cards, not decorative icons. */}
        <section className="rounded-xl border border-[#e5e7eb] bg-white p-6">
          <h2 className="font-display text-xl font-bold text-[#111827]">
            {t('method.catalogTitle')}
          </h2>
          <p className="mt-1 text-xs text-[#4b5563]">{t('method.catalogNote')}</p>

          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            {CATALOG_CROPS.map((crop) => (
              <div key={crop.code} className="rounded-lg border border-[#e5e7eb] bg-[#fafafa] p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-display text-sm font-bold text-[#111827]">
                      {formatCropWithHausa(crop.code, true)}
                    </h3>
                    <p className="text-xs italic text-[#4b5563]">{crop.scientificName}</p>
                  </div>
                  <Badge
                    variant={
                      crop.rotationTraits?.nitrogenContribution === 'fixes' ? 'Strong' : 'Neutral'
                    }
                  >
                    {crop.rotationTraits?.nitrogenContribution === 'fixes'
                      ? t('method.fixesNitrogen')
                      : t('method.consumesNitrogen')}
                  </Badge>
                </div>

                <div className="tabular mt-3 grid grid-cols-3 gap-2 rounded-lg bg-white p-2.5 text-xs">
                  <div>
                    <div className="text-[#4b5563]">{t('method.waterNeed')}</div>
                    <div className="font-semibold text-[#111827]">
                      {crop.agronomicRequirements.indicativeCropWaterNeedMmPerSeason
                        ? t('method.rangeMm', {
                            min:
                              crop.agronomicRequirements.indicativeCropWaterNeedMmPerSeason.min ??
                              'n/a',
                            max:
                              crop.agronomicRequirements.indicativeCropWaterNeedMmPerSeason.max ??
                              'n/a',
                          })
                        : 'n/a'}
                    </div>
                  </div>
                  <div>
                    <div className="text-[#4b5563]">{t('method.tempRange')}</div>
                    <div className="font-semibold text-[#111827]">
                      {crop.agronomicRequirements.temperatureC
                        ? t('method.rangeC', {
                            min: crop.agronomicRequirements.temperatureC.min ?? 'n/a',
                            max: crop.agronomicRequirements.temperatureC.max ?? 'n/a',
                          })
                        : 'n/a'}
                    </div>
                  </div>
                  <div>
                    <div className="text-[#4b5563]">{t('method.soilPh')}</div>
                    <div className="font-semibold text-[#111827]">
                      {crop.agronomicRequirements.soilPh
                        ? t('method.rangePlain', {
                            min: crop.agronomicRequirements.soilPh.min ?? 'n/a',
                            max: crop.agronomicRequirements.soilPh.max ?? 'n/a',
                          })
                        : 'n/a'}
                    </div>
                  </div>
                </div>

                <div className="mt-2.5 space-y-1 text-xs text-[#4b5563]">
                  {crop.sourceCitations.map((cit) => (
                    <div key={cit.citation}>{cit.citation}</div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 flex justify-end border-t border-[#e5e7eb] pt-4">
            <Link href="/farms/new">
              <Button variant="primary" size="md">
                <span>{t('method.applyCta')}</span>
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Button>
            </Link>
          </div>
        </section>
      </div>

      <SiteFooter />
    </div>
  );
}
