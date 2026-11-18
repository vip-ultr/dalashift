'use client';

import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import type * as React from 'react';

import { PublicNavbar } from '../components/layout/public-navbar';
import { SiteFooter } from '../components/layout/site-footer';
import { Button } from '../components/ui/button';
import { useLanguage } from '../i18n/language-provider';

/**
 * Landing page. One idea: the field instrument, calm and content-led.
 * Design note: no eyebrow labels, no icon-square card grids, one primary
 * action. The report panel is an illustration placed below the action, never
 * the hero. Tokens: canvas #fafafa, surface #ffffff, ink #111827,
 * ink-muted #4b5563, border #e5e7eb, primary #0a4232, sunken #f4f5f6.
 * Widths checked in source: 390, 768, 1440.
 */
export default function LandingPage(): React.JSX.Element {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-[#fafafa] text-[#111827]">
      <PublicNavbar />

      {/* Hero: one statement, one primary action */}
      <section className="border-b border-[#e5e7eb] bg-white pt-14 pb-16 sm:pt-20 sm:pb-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <h1 className="font-display text-3xl font-bold leading-tight text-[#111827] sm:text-4xl">
            {t('landing.heroTitle')}
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-[#4b5563]">
            {t('landing.heroSubtitle')}
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
            <Link href="/farms">
              <Button variant="primary" size="lg">
                <span>{t('landing.primaryAction')}</span>
                <ArrowRight className="size-4" aria-hidden="true" />
              </Button>
            </Link>
            <Link href="/farms/new" className="text-sm font-medium text-[#0a4232] hover:underline">
              {t('workspace.addField')}
            </Link>
          </div>
        </div>
      </section>

      {/* How it works: a numbered list with hairline dividers, no icon squares */}
      <section className="py-14 sm:py-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <h2 className="font-display text-2xl font-bold text-[#111827]">
            {t('landing.howItWorksTitle')}
          </h2>
          <ol className="mt-6 list-none divide-y divide-[#e5e7eb] border-y border-[#e5e7eb]">
            {[t('landing.howStep1'), t('landing.howStep2'), t('landing.howStep3')].map((step) => (
              <li key={step} className="py-4 text-base text-[#111827]">
                {step}
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Illustration only. Static example of a report layout, not the hero. */}
      <section className="pb-16 sm:pb-24">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="overflow-hidden rounded-xl border border-[#e5e7eb] bg-white">
            <div className="border-b border-[#e5e7eb] bg-[#fafafa] px-5 py-4">
              <div className="text-sm font-semibold text-[#111827]">
                Example field report layout
              </div>
              <div className="mt-0.5 text-xs text-[#4b5563]">Illustration only. Not live data.</div>
            </div>

            <p className="bg-[#f4f5f6] px-5 py-2.5 text-xs text-[#4b5563]">
              The values below are sample figures used to illustrate the report layout. They are not
              live observations from any real farm.
            </p>

            {/* Sample figures with a quiet provenance line beneath each */}
            <div className="grid grid-cols-2 divide-x divide-y divide-[#e5e7eb] text-xs">
              <div className="p-4">
                <span className="text-[#4b5563]">Rainfall (14-day)</span>
                <div className="tabular mt-1 text-lg font-bold text-[#111827]">44.5 mm</div>
                <span className="mt-1 block text-xs text-[#4b5563]">CHIRPS 5.5 km satellite</span>
              </div>
              <div className="p-4">
                <span className="text-[#4b5563]">Root-zone soil wetness</span>
                <div className="tabular mt-1 text-lg font-bold text-[#111827]">0.21 m³/m³</div>
                <span className="mt-1 block text-xs text-[#4b5563]">NASA SMAP 9 km grid</span>
              </div>
              <div className="p-4">
                <span className="text-[#4b5563]">Topsoil pH</span>
                <div className="tabular mt-1 text-lg font-bold text-[#111827]">6.1 pH</div>
                <span className="mt-1 block text-xs text-[#4b5563]">SoilGrids 250 m cell</span>
              </div>
              <div className="p-4">
                <span className="text-[#4b5563]">Canopy greenness</span>
                <div className="tabular mt-1 text-lg font-bold text-[#111827]">0.48 NDVI</div>
                <span className="mt-1 block text-xs text-[#4b5563]">MODIS 250 m composite</span>
              </div>
            </div>

            <div className="space-y-3 bg-[#fafafa] p-5">
              <div className="rounded-lg border border-[#e5e7eb] p-3.5">
                <div className="text-xs font-semibold text-[#0a4232]">
                  Moisture planting trigger: conditions met
                </div>
                <p className="mt-1 text-xs leading-relaxed text-[#111827]">
                  Soil moisture reached the 0.18 m³/m³ threshold across three rain events. Workable
                  for sowing.
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs">
                <span className="text-[#4b5563]">Tested rotation sequence:</span>
                <span className="font-semibold text-[#111827]">
                  Sorghum (Dawa) to Cowpea (Wake)
                </span>
              </div>
            </div>

            <div className="border-t border-[#e5e7eb] p-4 text-center">
              <Link
                href="/farms"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-[#0a4232] hover:underline"
              >
                <span>View all registered farms on the map</span>
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
