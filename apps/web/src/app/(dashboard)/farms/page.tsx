'use client';

import type { GeoJSONGeometry, Parcel } from '@dalashift/shared/types';
import { geometrySchema } from '@dalashift/shared/schemas';
import { ArrowRight, FileText, Plus } from 'lucide-react';
import Link from 'next/link';
import * as React from 'react';
import { z } from 'zod';

import { DataStateBoundary } from '../../../components/dashboard/data-state-boundary';
import { ParcelVectorThumbnail } from '../../../components/farms/parcel-vector-thumbnail';
import { HonestyMapCanvas } from '../../../components/maps/honesty-map-canvas';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { PLANTING_TRIGGER_TITLES } from '../../../lib/utilities/format';

const numericValue = z.union([z.number(), z.string().transform(Number)]).nullable();

const farmListSchema = z.object({
  farms: z.array(
    z.object({
      id: z.string().uuid(),
      name: z.string(),
      area_ha: numericValue,
      farming_method: z.string().nullable().optional(),
    }),
  ),
});

const farmDetailSchema = z.object({
  parcels: z.array(
    z.object({
      id: z.string().uuid(),
      name: z.string(),
      area_ha: numericValue,
      geometry_geojson: geometrySchema.nullable(),
      centroid_geojson: geometrySchema.nullable(),
      geometry_method: z.string(),
      location_uncertainty_m: numericValue,
    }),
  ),
  priorities: z.object({ planting_trigger: z.string().nullable() }).nullable().optional(),
});

const errorSchema = z.object({ error: z.string() });

interface FarmParcelEntry {
  readonly farmId: string;
  readonly farmName: string;
  readonly plantingTrigger: string | null;
  readonly parcel: Parcel;
}

async function readJson<T>(response: Response, schema: z.ZodType<T>): Promise<T> {
  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new Error('The server returned an invalid response.');
  }
  if (!response.ok) {
    const parsed = errorSchema.safeParse(payload);
    throw new Error(parsed.success ? parsed.data.error : `Request failed (${response.status}).`);
  }
  const parsed = schema.safeParse(payload);
  if (!parsed.success) throw new Error('The server returned data in an unexpected format.');
  return parsed.data;
}

export default function FarmsOverviewPage(): React.JSX.Element {
  const [farms, setFarms] = React.useState<z.infer<typeof farmListSchema>['farms']>([]);
  const [entries, setEntries] = React.useState<FarmParcelEntry[]>([]);
  const [selectedParcelId, setSelectedParcelId] = React.useState<string | null>(null);
  const [state, setState] = React.useState<'loading' | 'ready' | 'error' | 'unauthenticated'>(
    'loading',
  );
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  React.useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const farmsResponse = await fetch('/api/farms', { cache: 'no-store' });
        if (farmsResponse.status === 401) {
          if (active) setState('unauthenticated');
          return;
        }
        const farmList = await readJson(farmsResponse, farmListSchema);

        const details = await Promise.all(
          farmList.farms.map(async (farm) => {
            try {
              const response = await fetch(`/api/farms/${farm.id}`, { cache: 'no-store' });
              if (!response.ok) return null;
              return { farm, detail: await readJson(response, farmDetailSchema) };
            } catch {
              return null;
            }
          }),
        );

        const collected: FarmParcelEntry[] = [];
        for (const item of details) {
          if (!item) continue;
          for (const parcel of item.detail.parcels) {
            const geometry: GeoJSONGeometry | null =
              parcel.geometry_geojson ?? parcel.centroid_geojson ?? null;
            if (!geometry) continue;
            collected.push({
              farmId: item.farm.id,
              farmName: item.farm.name,
              plantingTrigger: item.detail.priorities?.planting_trigger ?? null,
              parcel: {
                id: parcel.id,
                farmId: item.farm.id,
                name: parcel.name,
                geometry,
                areaHa: parcel.area_ha ?? 0,
                locationUncertaintyM: parcel.location_uncertainty_m,
                geometryMethod:
                  parcel.geometry_method === 'drawn_polygon' ? 'drawn_polygon' : 'gps_point',
              },
            });
          }
        }

        if (active) {
          setFarms(farmList.farms);
          setEntries(collected);
          setSelectedParcelId(collected[0]?.parcel.id ?? null);
          setState('ready');
        }
      } catch (error) {
        if (active) {
          setErrorMessage(error instanceof Error ? error.message : 'Unable to load your holdings.');
          setState('error');
        }
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const selectedEntry = entries.find((entry) => entry.parcel.id === selectedParcelId) ?? null;

  return (
    <div className="min-h-screen bg-[#f6f4ef] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col justify-between gap-4 rounded-[12px] border border-[#e5e7eb] bg-white p-5 shadow-xs sm:flex-row sm:items-center">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge variant="Strong">2026 Wet Season</Badge>
              <span className="text-xs font-medium text-[#6b7280]">
                Private holdings from your signed-in account
              </span>
            </div>
            <h1 className="font-display text-2xl font-bold tracking-tight text-[#111315]">
              Holdings &amp; Parcels Map Workspace
            </h1>
            <p className="text-xs text-[#4b5563] sm:text-sm">
              Select a real parcel on the map or in the list to open its holding workspace and
              reports.
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
                <span>Reports Hub</span>
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
                Loaded privately from your account. No demonstration holdings are shown.
              </p>
            </div>
            {state === 'unauthenticated' ? (
              <Link href="/login">
                <Button variant="secondary" size="sm">
                  Sign in to view your farms
                </Button>
              </Link>
            ) : null}
          </div>

          {state === 'error' ? (
            <p role="alert" className="mt-3 text-sm text-[#b42318]">
              {errorMessage}
            </p>
          ) : null}
          {state === 'ready' && farms.length === 0 ? (
            <p className="mt-3 text-sm text-[#6b7280]">
              You have not registered any farms yet. Add one to see it here.
            </p>
          ) : null}
          {farms.length > 0 ? (
            <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {farms.map((farm) => (
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

        <DataStateBoundary
          state={
            state === 'loading'
              ? 'loading'
              : state === 'error'
                ? 'error'
                : state === 'ready' && entries.length === 0
                  ? 'empty'
                  : 'ready'
          }
          emptyKind="no-parcels"
          sourceName="Farm and parcel service"
          errorMessage={errorMessage ?? undefined}
          onRetry={() => window.location.reload()}
          onPrimaryAction={() => {
            window.location.href = '/farms/new';
          }}
          primaryActionLabel="Add your first parcel"
        >
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            <div className="lg:col-span-8">
              <HonestyMapCanvas
                parcels={entries.map((entry) => entry.parcel)}
                selectedParcelId={selectedParcelId}
                onSelectParcel={setSelectedParcelId}
                heightClass="h-[460px]"
              />
            </div>

            <div className="lg:col-span-4">
              {selectedEntry ? (
                <div className="flex h-full flex-col justify-between rounded-[12px] border border-[#e5e7eb] bg-white p-5 shadow-xs">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between gap-2">
                      <Badge variant="Strong">Selected parcel</Badge>
                      <span className="text-[11px] text-[#6b7280]">{selectedEntry.farmName}</span>
                    </div>

                    <div className="space-y-2">
                      {entries.map((entry) => {
                        const active = entry.parcel.id === selectedParcelId;
                        return (
                          <button
                            key={entry.parcel.id}
                            type="button"
                            onClick={() => setSelectedParcelId(entry.parcel.id)}
                            className={`flex w-full items-center gap-3 rounded-[10px] border p-2.5 text-left transition-colors ${
                              active
                                ? 'border-[#00b159] bg-[#ebfaef]/70'
                                : 'border-[#e5e7eb] bg-[#fafafb] hover:bg-white'
                            }`}
                          >
                            <ParcelVectorThumbnail
                              geometry={entry.parcel.geometry}
                              size={36}
                              active={active}
                            />
                            <div className="min-w-0 flex-1">
                              <div className="truncate text-xs font-semibold text-[#111315]">
                                {entry.parcel.name}
                              </div>
                              <div className="tabular text-[11px] text-[#6b7280]">
                                {entry.parcel.geometryMethod === 'drawn_polygon'
                                  ? `${entry.parcel.areaHa.toFixed(2)} ha · drawn polygon`
                                  : `GPS point (±${entry.parcel.locationUncertaintyM ?? 500} m)`}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    <div className="rounded-[10px] bg-[#f4f5f6] p-3 text-xs">
                      <div className="font-semibold text-[#111315]">Planting trigger rule:</div>
                      <p className="mt-0.5 text-[#4b5563]">
                        {selectedEntry.plantingTrigger &&
                        PLANTING_TRIGGER_TITLES[
                          selectedEntry.plantingTrigger as keyof typeof PLANTING_TRIGGER_TITLES
                        ]
                          ? PLANTING_TRIGGER_TITLES[
                              selectedEntry.plantingTrigger as keyof typeof PLANTING_TRIGGER_TITLES
                            ].en
                          : 'Not recorded'}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 flex flex-col gap-2 border-t border-[#e5e7eb] pt-4">
                    <Link href={`/farms/${selectedEntry.farmId}`}>
                      <Button variant="primary" size="md" className="w-full">
                        <span>Open holding workspace</span>
                        <ArrowRight className="h-4 w-4" aria-hidden="true" />
                      </Button>
                    </Link>
                    <Link href={`/farms/${selectedEntry.farmId}/reports`}>
                      <Button variant="secondary" size="sm" className="w-full">
                        <FileText className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>Open field report</span>
                      </Button>
                    </Link>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </DataStateBoundary>
      </div>
    </div>
  );
}
