import { ArrowRight, Compass, Database, Droplets, Layers, ShieldCheck, Sprout } from 'lucide-react';
import Link from 'next/link';
import type * as React from 'react';

import { PublicNavbar } from '../components/layout/public-navbar';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';

export default function LandingPage(): React.JSX.Element {
  return (
    <div className="min-h-screen bg-[#fafafa] text-[#111827]">
      <PublicNavbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-[#e5e7eb] bg-white pt-12 pb-20 sm:pt-20 sm:pb-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12">
            {/* Left Content */}
            <div className="space-y-6 lg:col-span-7">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#0a4232]/15 bg-[#eaf2ee] px-3.5 py-1 text-xs font-semibold text-[#0a4232]">
                <Sprout className="size-3.5" />
                <span>Precision Agricultural Intelligence</span>
              </div>

              <h1 className="font-display text-4xl font-bold tracking-tight text-[#111827] sm:text-5xl lg:text-6xl leading-[1.12]">
                Earth observation intelligence for smallholder fields.
              </h1>

              <p className="max-w-2xl text-base leading-relaxed text-[#4b5563] sm:text-lg">
                DalaShift translates NASA satellite data, SoilGrids, and rainfall records into
                field-specific planting triggers and 3-way crop rotation plans for smallholder
                farmers.
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Link href="/farms">
                  <Button variant="primary" size="lg">
                    <span>Open Field Workspace</span>
                    <ArrowRight className="size-4" />
                  </Button>
                </Link>
                <Link href="/farms/new">
                  <Button variant="secondary" size="lg">
                    <span>Add Your Field</span>
                  </Button>
                </Link>
              </div>

              {/* 3 Core Value Props */}
              <div className="grid grid-cols-1 gap-4 pt-4 sm:grid-cols-3">
                <div className="rounded-xl border border-[#e5e7eb] bg-[#fafafa] p-4">
                  <div className="flex items-center gap-2 text-xs font-semibold text-[#111827]">
                    <Database className="size-4 text-[#0a4232]" />
                    <span>Resolution Honesty</span>
                  </div>
                  <p className="mt-1 text-xs text-[#6b7280]">
                    Clearly marks 250 m soil grids vs. 9 km regional climate data.
                  </p>
                </div>
                <div className="rounded-xl border border-[#e5e7eb] bg-[#fafafa] p-4">
                  <div className="flex items-center gap-2 text-xs font-semibold text-[#111827]">
                    <Droplets className="size-4 text-[#c26e4a]" />
                    <span>Moisture Triggers</span>
                  </div>
                  <p className="mt-1 text-xs text-[#6b7280]">
                    Evaluates confirmed soil wetness before planting, not guesswork dates.
                  </p>
                </div>
                <div className="rounded-xl border border-[#e5e7eb] bg-[#fafafa] p-4">
                  <div className="flex items-center gap-2 text-xs font-semibold text-[#111827]">
                    <ShieldCheck className="size-4 text-[#0a4232]" />
                    <span>Field Grounded</span>
                  </div>
                  <p className="mt-1 text-xs text-[#6b7280]">
                    Validated with smallholder farmers and local Hausa crop terminology.
                  </p>
                </div>
              </div>
            </div>

            {/* Right: static illustrative example, not live data */}
            <div className="lg:col-span-5">
              <div className="overflow-hidden rounded-2xl border border-[#e5e7eb] bg-white shadow-xl">
                {/* Header Strip */}
                <div className="flex items-center justify-between border-b border-[#e5e7eb] bg-[#fafafa] px-5 py-3.5">
                  <div className="flex items-center gap-2.5">
                    <span className="flex size-7 items-center justify-center rounded-lg bg-[#0a4232] text-white">
                      <Compass className="size-4" />
                    </span>
                    <div>
                      <div className="text-xs font-bold text-[#111827]">
                        Example field report layout
                      </div>
                      <div className="text-[11px] text-[#6b7280]">
                        Illustration only · not live monitoring data
                      </div>
                    </div>
                  </div>
                  <Badge variant="Neutral">Static example</Badge>
                </div>

                <p className="bg-[#f4f5f6] px-5 py-2 text-[11px] text-[#4b5563]">
                  The values below are sample figures used to illustrate the report layout. They are
                  not live observations from any real farm.
                </p>

                {/* Satellite Metrics Grid (illustrative sample values) */}
                <div className="grid grid-cols-2 divide-x divide-y divide-[#e5e7eb] border-b border-[#e5e7eb] bg-white text-xs">
                  <div className="p-4">
                    <span className="text-[#6b7280]">Rainfall (14-day)</span>
                    <div className="tabular mt-1 text-lg font-bold text-[#111827]">44.5 mm</div>
                    <span className="text-[11px] font-medium text-[#0a4232]">
                      CHIRPS 5.5 km satellite
                    </span>
                  </div>
                  <div className="p-4">
                    <span className="text-[#6b7280]">Root-zone Soil Wetness</span>
                    <div className="tabular mt-1 text-lg font-bold text-[#111827]">0.21 m³/m³</div>
                    <span className="text-[11px] font-medium text-[#0a4232]">
                      NASA SMAP 9 km grid
                    </span>
                  </div>
                  <div className="p-4">
                    <span className="text-[#6b7280]">Topsoil pH</span>
                    <div className="tabular mt-1 text-lg font-bold text-[#111827]">6.1 pH</div>
                    <span className="text-[11px] font-medium text-[#c26e4a]">
                      SoilGrids 250 m cell
                    </span>
                  </div>
                  <div className="p-4">
                    <span className="text-[#6b7280]">Canopy Greenness</span>
                    <div className="tabular mt-1 text-lg font-bold text-[#111827]">0.48 NDVI</div>
                    <span className="text-[11px] font-medium text-[#0a4232]">
                      MODIS 250 m composite
                    </span>
                  </div>
                </div>

                {/* Sowing Trigger & Rotation Preview */}
                <div className="p-5 space-y-3 bg-[#fafafa]">
                  <div className="rounded-xl border border-[#0a4232]/20 bg-[#eaf2ee]/60 p-3.5">
                    <div className="flex items-center justify-between text-xs font-semibold text-[#0a4232]">
                      <span>Moisture Planting Trigger</span>
                      <Badge variant="pass">Conditions Met</Badge>
                    </div>
                    <p className="mt-1 text-xs text-[#111827]">
                      Soil moisture reached 0.18 m³/m³ threshold across 3 rain events. Workable for
                      sowing.
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-2 text-xs">
                    <span className="text-[#6b7280]">Tested rotation sequence:</span>
                    <span className="font-semibold text-[#111827]">
                      Sorghum (Dawa) → Cowpea (Wake)
                    </span>
                  </div>
                </div>

                <div className="border-t border-[#e5e7eb] bg-white p-4 text-center">
                  <Link
                    href="/farms"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0a4232] hover:underline"
                  >
                    <span>View all registered holdings on map</span>
                    <ArrowRight className="size-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3 Pillars Section */}
      <section className="py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <span className="text-xs font-semibold tracking-wider text-[#0a4232] uppercase">
              How DalaShift Works
            </span>
            <h2 className="font-display text-3xl font-bold tracking-tight text-[#111827]">
              Engineered for smallholder agriculture.
            </h2>
            <p className="text-sm text-[#4b5563]">
              From farm boundary mapping to soil chemistry and crop rotation, DalaShift delivers
              explainable insights based on verified agricultural science.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-3">
            <div className="rounded-2xl border border-[#e5e7eb] bg-white p-6 shadow-xs">
              <div className="flex size-10 items-center justify-center rounded-xl bg-[#eaf2ee] text-[#0a4232]">
                <Layers className="size-5" />
              </div>
              <h3 className="mt-4 font-display text-lg font-bold text-[#111827]">
                1. Satellite Observation
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-[#4b5563]">
                Integrates NASA SMAP, MODIS, and CHIRPS data layers to provide historical rainfall,
                vegetation indices, and soil properties for every parcel.
              </p>
            </div>

            <div className="rounded-2xl border border-[#e5e7eb] bg-white p-6 shadow-xs">
              <div className="flex size-10 items-center justify-center rounded-xl bg-[#f9efea] text-[#c26e4a]">
                <Droplets className="size-5" />
              </div>
              <h3 className="mt-4 font-display text-lg font-bold text-[#111827]">
                2. Moisture Triggers
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-[#4b5563]">
                Replaces risky calendar date planting with moisture-conditioned triggers that reduce
                the chance of early crop failure from false rainy season onset.
              </p>
            </div>

            <div className="rounded-2xl border border-[#e5e7eb] bg-white p-6 shadow-xs">
              <div className="flex size-10 items-center justify-center rounded-xl bg-[#eaf2ee] text-[#0a4232]">
                <Sprout className="size-5" />
              </div>
              <h3 className="mt-4 font-display text-lg font-bold text-[#111827]">
                3. Rotation Comparison
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-[#4b5563]">
                Compares existing cereal-legume rotations against evidence-backed alternatives to
                restore soil nitrogen, optimize water demand, and stabilize yield.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
