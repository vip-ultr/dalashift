'use client';

import { ArrowRight, FileText, Plus } from 'lucide-react';
import Link from 'next/link';
import * as React from 'react';

import { ParcelVectorThumbnail } from '../../../components/farms/parcel-vector-thumbnail';
import { HonestyMapCanvas } from '../../../components/maps/honesty-map-canvas';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { CASE_STUDY_PROFILES } from '../../../features/cases/case-study-data';
import { formatCropWithHausa, PLANTING_TRIGGER_TITLES } from '../../../lib/utilities/format';
import { z } from 'zod';

const farmListResponseSchema = z.object({
  farms: z.array(
    z.object({
      id: z.string().uuid(),
      name: z.string(),
      area_ha: z.union([z.number(), z.string().transform(Number)]).nullable(),
    }),
  ),
});
const farmListErrorSchema = z.object({ error: z.string() });

export default function FarmsOverviewPage(): React.JSX.Element {
  const allParcels = React.useMemo(() => CASE_STUDY_PROFILES.flatMap((cs) => cs.parcels), []);

  const [selectedParcelId, setSelectedParcelId] = React.useState<string>(allParcels[0]?.id ?? '');
  const [myFarms, setMyFarms] = React.useState<z.infer<typeof farmListResponseSchema>['farms']>([]);
  const [farmListError, setFarmListError] = React.useState<string | null>(null);
  const [needsSignIn, setNeedsSignIn] = React.useState(false);

  React.useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const response = await fetch('/api/farms', { cache: 'no-store' });
        const payload: unknown = await response.json();
        if (response.status === 401) {
          if (active) setNeedsSignIn(true);
          return;
        }
        if (!response.ok) {
          const parsedError = farmListErrorSchema.safeParse(payload);
          throw new Error(
            parsedError.success ? parsedError.data.error : 'Unable to load your holdings.',
          );
        }

        const parsed = farmListResponseSchema.safeParse(payload);
        if (!parsed.success)
          throw new Error('The server returned farm data in an unexpected format.');
        if (active) setMyFarms(parsed.data.farms);
      } catch (error) {
        if (active) {
          setFarmListError(
            error instanceof Error ? error.message : 'Unable to load your holdings.',
          );
        }
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  const selectedHolding = React.useMemo(
    () =>
      CASE_STUDY_PROFILES.find((cs) => cs.parcels.some((p) => p.id === selectedParcelId)) ??
      CASE_STUDY_PROFILES[0],
    [selectedParcelId],
  );

  return (
    <div className="min-h-screen bg-[#f6f4ef] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Top Workspace Header */}
        <div className="flex flex-col justify-between gap-4 rounded-[12px] border border-[#e5e7eb] bg-white p-5 shadow-xs sm:flex-row sm:items-center">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge variant="Strong">2026 Wet Season</Badge>
              <span className="text-xs font-medium text-[#6b7280]">
                Northern Nigeria · Multi-Parcel Holdings
              </span>
            </div>
            <h1 className="font-display text-2xl font-bold tracking-tight text-[#111315]">
              Holdings &amp; Parcels Map Workspace
            </h1>
            <p className="text-xs text-[#4b5563] sm:text-sm">
              Select any parcel on the map or list below to inspect its planting trigger, 3-strategy
              rotation comparison, and satellite observation provenance.
            </p>
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-2.5">
            <Link href="/farms/new">
              <Button variant="primary" size="md">
                <Plus className="h-4 w-4" aria-hidden="true" />
                <span>Add Farm or Parcel</span>
              </Button>
            </Link>
            <Link href="/reports">
              <Button variant="secondary" size="md">
                <FileText className="h-4 w-4" aria-hidden="true" />
                <span>Printable Reports</span>
              </Button>
            </Link>
          </div>
        </div>

        <section className="rounded-[12px] border border-[#e5e7eb] bg-white p-5 shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-lg font-bold text-[#111315]">
                Your registered farms
              </h2>
              <p className="mt-1 text-xs text-[#4b5563]">
                Private holdings are loaded from your signed-in account.
              </p>
            </div>
            {needsSignIn ? (
              <Link href="/login">
                <Button variant="secondary" size="sm">
                  Sign in to view your farms
                </Button>
              </Link>
            ) : null}
          </div>
          {farmListError ? (
            <p role="alert" className="mt-3 text-sm text-[#b42318]">
              {farmListError}
            </p>
          ) : null}
          {!needsSignIn && !farmListError && myFarms.length === 0 ? (
            <p className="mt-3 text-sm text-[#6b7280]">
              No private farms have been registered yet.
            </p>
          ) : null}
          {myFarms.length > 0 ? (
            <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {myFarms.map((farm) => (
                <li key={farm.id} className="rounded-lg border border-[#e5e7eb] p-3">
                  <Link
                    href={`/farms/${farm.id}`}
                    className="font-semibold text-[#0a4232] hover:underline"
                  >
                    {farm.name}
                  </Link>
                  <p className="mt-1 text-xs text-[#6b7280]">
                    {farm.area_ha === null ? 'Area unavailable' : `${farm.area_ha.toFixed(2)} ha`}
                  </p>
                </li>
              ))}
            </ul>
          ) : null}
        </section>

        {/* Interactive Split View: Map Canvas + Selected Parcel Quick Inspector */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="lg:col-span-8">
            <HonestyMapCanvas
              parcels={allParcels}
              selectedParcelId={selectedParcelId}
              onSelectParcel={setSelectedParcelId}
              heightClass="h-[460px]"
            />
          </div>

          <div className="lg:col-span-4">
            {selectedHolding ? (
              <div className="flex h-full flex-col justify-between rounded-[12px] border border-[#e5e7eb] bg-white p-5 shadow-xs">
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-2">
                    <Badge variant="Strong">Active Selection</Badge>
                    <span className="font-mono text-[11px] text-[#6b7280]">
                      Ruleset {selectedHolding.rotationComparison.rulesetVersion}
                    </span>
                  </div>

                  <div>
                    <h2 className="font-display text-lg font-bold text-[#111315]">
                      {selectedHolding.farmerName}
                    </h2>
                    <p className="mt-0.5 text-xs text-[#4b5563]">
                      {selectedHolding.holdingSummary}
                    </p>
                  </div>

                  {/* Parcels in this holding */}
                  <div className="space-y-2">
                    <div className="text-[11px] font-semibold tracking-wider text-[#6b7280] uppercase">
                      Parcels in Holding ({selectedHolding.parcels.length}):
                    </div>
                    {selectedHolding.parcels.map((parcel) => {
                      const active = parcel.id === selectedParcelId;
                      return (
                        <button
                          key={parcel.id}
                          type="button"
                          onClick={() => setSelectedParcelId(parcel.id)}
                          className={`flex w-full items-center gap-3 rounded-[10px] border p-2.5 text-left transition-colors ${
                            active
                              ? 'border-[#00b159] bg-[#ebfaef]/70'
                              : 'border-[#e5e7eb] bg-[#fafafb] hover:bg-white'
                          }`}
                        >
                          <ParcelVectorThumbnail
                            geometry={parcel.geometry}
                            size={36}
                            active={active}
                          />
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-xs font-semibold text-[#111315]">
                              {parcel.name}
                            </div>
                            <div className="tabular text-[11px] text-[#6b7280]">
                              {parcel.areaHa !== null
                                ? `${parcel.areaHa.toFixed(2)} ha · Drawn polygon`
                                : `GPS point (±${parcel.locationUncertaintyM ?? 500} m)`}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Planting Trigger Summary */}
                  <div className="rounded-[10px] bg-[#f4f5f6] p-3 text-xs">
                    <div className="font-semibold text-[#111315]">Planting Trigger Rule:</div>
                    <p className="mt-0.5 text-[#4b5563]">
                      {PLANTING_TRIGGER_TITLES[
                        (selectedHolding.priorities.plantingTrigger ??
                          'wait_for_confirmed_moisture') as keyof typeof PLANTING_TRIGGER_TITLES
                      ]?.en ?? 'Wait for confirmed moisture'}
                    </p>
                  </div>
                </div>

                <div className="mt-5 flex flex-col gap-2 border-t border-[#e5e7eb] pt-4">
                  <Link href={`/farms/${selectedHolding.farm.id}`}>
                    <Button variant="primary" size="md" className="w-full">
                      <span>Open Full Parcel Intelligence</span>
                      <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </Button>
                  </Link>
                  <Link href={`/farms/${selectedHolding.farm.id}/reports`}>
                    <Button variant="secondary" size="sm" className="w-full">
                      <FileText className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>Open Printable Field Sheet</span>
                    </Button>
                  </Link>
                </div>
              </div>
            ) : null}
          </div>
        </div>

        {/* All Holdings & Parcels Grid */}
        <div className="space-y-3">
          <h2 className="font-display text-lg font-bold text-[#111315]">
            Verified Field Holdings ({CASE_STUDY_PROFILES.length})
          </h2>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            {CASE_STUDY_PROFILES.map((cs) => {
              const totalHa = cs.parcels.reduce((sum, p) => sum + (p.areaHa ?? 0), 0);

              return (
                <div
                  key={cs.farm.id}
                  className="flex flex-col justify-between rounded-[12px] border border-[#e5e7eb] bg-white p-5 shadow-xs"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[11px] font-semibold text-[#6b7280]">
                          {cs.village}, {cs.lga}
                        </span>
                        <h3 className="font-display text-base font-bold text-[#111315]">
                          {cs.farm.name}
                        </h3>
                      </div>
                      <span className="tabular rounded-md bg-[#f4f5f6] px-2 py-1 text-xs font-semibold text-[#111315]">
                        {totalHa.toFixed(1)} ha
                      </span>
                    </div>

                    <p className="text-xs text-[#4b5563]">{cs.holdingSummary}</p>

                    <div className="flex flex-wrap gap-1.5">
                      {cs.cropCodes.map((code) => (
                        <span
                          key={code}
                          className="rounded border border-[#e5e7eb] bg-[#fafafb] px-2 py-0.5 text-[11px] font-medium text-[#374151]"
                        >
                          {formatCropWithHausa(code, true)}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="mt-5 flex items-center justify-between border-t border-[#e5e7eb] pt-3">
                    <Link
                      href={`/farms/${cs.farm.id}`}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-[#00b159] hover:underline"
                    >
                      <span>Open Workspace</span>
                      <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                    </Link>
                    <Link
                      href={`/cases/${cs.slug}`}
                      className="text-xs text-[#6b7280] hover:text-[#111315]"
                    >
                      Field Interview →
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
