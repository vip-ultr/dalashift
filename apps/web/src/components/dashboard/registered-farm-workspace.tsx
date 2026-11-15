'use client';

import type { GeoJSONGeometry } from '@dalashift/shared/types';
import { geometrySchema } from '@dalashift/shared/schemas';
import { AlertCircle, LoaderCircle, MapPin, Plus, Sprout } from 'lucide-react';
import Link from 'next/link';
import * as React from 'react';
import { z } from 'zod';

import { HonestyMapCanvas } from '../maps/honesty-map-canvas';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';

const numericValueSchema = z.union([z.number(), z.string().transform(Number)]).nullable();

const farmResponseSchema = z.object({
  farm: z.object({
    id: z.string().uuid(),
    name: z.string(),
    farming_method: z.string(),
    irrigation_method: z.string(),
    soil_notes: z.string().nullable(),
    area_ha: numericValueSchema,
  }),
  parcels: z.array(
    z.object({
      id: z.string().uuid(),
      name: z.string(),
      area_ha: numericValueSchema,
      geometry_geojson: geometrySchema.nullable(),
      centroid_geojson: geometrySchema.nullable(),
      geometry_method: z.string(),
      location_uncertainty_m: numericValueSchema,
    }),
  ),
  crops: z.array(
    z.object({
      id: z.string().uuid(),
      status: z.string(),
      season: z.string(),
      crop: z
        .union([
          z.object({ code: z.string(), name: z.string() }),
          z.array(z.object({ code: z.string(), name: z.string() })),
        ])
        .nullable()
        .optional(),
    }),
  ),
  priorities: z
    .object({
      goals: z.array(z.string()),
      planting_trigger: z.string().nullable(),
    })
    .nullable(),
});

const comparisonResponseSchema = z.object({
  comparison: z.object({
    strategies: z.array(
      z.object({
        kind: z.string(),
        label: z.string(),
        rationale: z.string(),
        rank: z.string().nullable(),
        rankingBasis: z.string(),
        evidenceStrength: z.string(),
        evidenceStrengthReason: z.string(),
        legs: z.array(z.object({ cropName: z.string(), season: z.string(), sequence: z.number() })),
        evidence: z.array(z.object({ statement: z.string() })),
        benefits: z.array(z.string()),
        informationGaps: z.array(z.string()),
        localReviewRisks: z.array(z.string()),
      }),
    ),
    rankingBasis: z.string(),
    limitations: z.array(z.object({ statement: z.string() })),
    rulesetVersion: z.string(),
  }),
  plantingTrigger: z.object({
    condition: z.string(),
    riskProfile: z.string(),
    recommendedTrigger: z.string(),
    limitations: z.array(z.object({ statement: z.string() })),
  }),
  seasonalOutlook: z.object({
    rainfallToDate: z.object({ valueMm: z.number(), normalMm: z.number() }),
    riskStatements: z.array(z.string()),
    framingNote: z.string(),
    limitations: z.array(z.object({ statement: z.string() })),
  }),
});

const errorResponseSchema = z.object({ error: z.string() });
type FarmResponse = z.infer<typeof farmResponseSchema>;
type ComparisonResponse = z.infer<typeof comparisonResponseSchema>;

async function readJson<T>(response: Response, schema: z.ZodType<T>): Promise<T> {
  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new Error('The server returned an invalid response.');
  }

  if (!response.ok) {
    const parsedError = errorResponseSchema.safeParse(payload);
    throw new Error(
      parsedError.success ? parsedError.data.error : `Request failed (${response.status}).`,
    );
  }

  const parsed = schema.safeParse(payload);
  if (!parsed.success) {
    throw new Error('The server returned farm data in an unexpected format.');
  }
  return parsed.data;
}

function getCropName(crop: FarmResponse['crops'][number]['crop']): string {
  if (!crop) return 'Crop name unavailable';
  return Array.isArray(crop) ? (crop[0]?.name ?? 'Crop name unavailable') : crop.name;
}

export function RegisteredFarmWorkspace({
  farmId,
}: {
  readonly farmId: string;
}): React.JSX.Element {
  const [farmData, setFarmData] = React.useState<FarmResponse | null>(null);
  const [selectedParcelId, setSelectedParcelId] = React.useState<string | null>(null);
  const [comparison, setComparison] = React.useState<ComparisonResponse | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [running, setRunning] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  React.useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const response = await fetch(`/api/farms/${farmId}`, { cache: 'no-store' });
        const data = await readJson(response, farmResponseSchema);
        if (active) {
          setFarmData(data);
          setSelectedParcelId(data.parcels[0]?.id ?? null);
        }
      } catch (error) {
        if (active) {
          setErrorMessage(
            error instanceof Error ? error.message : 'Unable to load this farm right now.',
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [farmId]);

  const runAssessment = async () => {
    if (!farmData) return;
    setRunning(true);
    setErrorMessage(null);
    setComparison(null);

    try {
      const response = await fetch(`/api/farms/${farmId}/compare`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ parcelId: selectedParcelId }),
      });
      setComparison(await readJson(response, comparisonResponseSchema));
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Unable to assess this farm right now.',
      );
    } finally {
      setRunning(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center gap-2 text-sm text-[#4b5563]">
        <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
        Loading your farm…
      </div>
    );
  }

  if (!farmData) {
    return (
      <main className="mx-auto max-w-3xl space-y-4 px-4 py-12">
        <div role="alert" className="rounded-xl border border-[#f5c2c0] bg-white p-5 text-sm">
          <p className="font-semibold text-[#b42318]">{errorMessage}</p>
          {errorMessage?.includes('Authentication') ? (
            <Link href="/login" className="mt-3 inline-block font-medium text-[#0a4232] underline">
              Sign in to view this farm
            </Link>
          ) : null}
        </div>
        <Link href="/farms" className="text-sm font-medium text-[#0a4232] underline">
          Return to farms
        </Link>
      </main>
    );
  }

  const parcels = farmData.parcels.flatMap((parcel) => {
    const geometry: GeoJSONGeometry | null =
      parcel.geometry_geojson ?? parcel.centroid_geojson ?? null;
    if (!geometry) return [];
    return [
      {
        id: parcel.id,
        farmId,
        name: parcel.name,
        geometry,
        areaHa: parcel.area_ha ?? 0,
        locationUncertaintyM: parcel.location_uncertainty_m,
        geometryMethod: parcel.geometry_method === 'drawn_polygon' ? 'drawn_polygon' : 'gps_point',
      } as const,
    ];
  });
  const selectedParcel = farmData.parcels.find((parcel) => parcel.id === selectedParcelId);

  return (
    <main className="min-h-screen bg-[#f6f4ef] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-col justify-between gap-4 rounded-xl border border-[#e5e7eb] bg-white p-5 sm:flex-row sm:items-center">
          <div>
            <Badge variant="Strong">Your Farm</Badge>
            <h1 className="mt-2 font-display text-2xl font-bold text-[#111315]">
              {farmData.farm.name}
            </h1>
            <p className="mt-1 text-sm text-[#4b5563]">
              {farmData.farm.area_ha === null
                ? 'Area unavailable'
                : `${farmData.farm.area_ha.toFixed(2)} ha holding`}{' '}
              · {farmData.parcels.length} {farmData.parcels.length === 1 ? 'parcel' : 'parcels'}
            </p>
          </div>
          <div className="flex gap-2">
            <Button type="button" onClick={runAssessment} disabled={running || !selectedParcelId}>
              {running ? (
                <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
              ) : (
                <Sprout className="size-4" aria-hidden="true" />
              )}
              {running ? 'Assessing parcel…' : 'Run parcel assessment'}
            </Button>
            <Link href={`/farms/${farmId}/reports`}>
              <Button type="button" variant="secondary">
                Reports
              </Button>
            </Link>
          </div>
        </header>

        {errorMessage ? (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-lg bg-[#fdeceb] p-3 text-sm text-[#b42318]"
          >
            <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            {errorMessage}
          </div>
        ) : null}

        <div className="grid gap-6 lg:grid-cols-12">
          <section className="space-y-3 lg:col-span-8">
            {parcels.length > 0 ? (
              <>
                <HonestyMapCanvas
                  parcels={parcels}
                  selectedParcelId={selectedParcelId}
                  onSelectParcel={(id) => {
                    setSelectedParcelId(id);
                    setComparison(null);
                  }}
                  heightClass="h-[460px]"
                />
                <div className="flex flex-wrap gap-2">
                  {farmData.parcels.map((parcel) => (
                    <button
                      key={parcel.id}
                      type="button"
                      onClick={() => {
                        setSelectedParcelId(parcel.id);
                        setComparison(null);
                      }}
                      className={`rounded-lg border px-3 py-2 text-left text-sm ${
                        parcel.id === selectedParcelId
                          ? 'border-[#00b159] bg-[#ebfaef]'
                          : 'border-[#e5e7eb] bg-white'
                      }`}
                    >
                      <span className="block font-semibold">{parcel.name}</span>
                      <span className="text-xs text-[#4b5563]">
                        {parcel.area_ha === null
                          ? `GPS point, ±${parcel.location_uncertainty_m ?? 500} m`
                          : `${parcel.area_ha.toFixed(2)} ha`}
                      </span>
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <div className="rounded-xl border border-dashed border-[#d1d5db] bg-white p-6 text-center">
                <MapPin className="mx-auto size-8 text-[#00b159]" />
                <h3 className="mt-2 text-sm font-semibold text-[#111315]">
                  No parcel geometry captured yet
                </h3>
                <p className="mt-1 text-xs text-[#6b7280]">
                  Add or capture this farm&apos;s parcel boundary or GPS point to start receiving
                  satellite intelligence.
                </p>
                <div className="mt-4 flex justify-center">
                  <Link href="/farms/new">
                    <Button variant="primary" size="sm">
                      <Plus className="mr-1 size-3.5" />
                      <span>Capture Parcel on Map</span>
                    </Button>
                  </Link>
                </div>
              </div>
            )}
          </section>

          <aside className="space-y-4 lg:col-span-4">
            <section className="rounded-xl border border-[#e5e7eb] bg-white p-5">
              <h2 className="font-semibold">Farmer-supplied crop records</h2>
              {farmData.crops.length > 0 ? (
                <ul className="mt-3 space-y-2">
                  {farmData.crops.map((crop) => (
                    <li key={crop.id} className="flex justify-between gap-2 text-sm">
                      <span>{getCropName(crop.crop)}</span>
                      <span className="text-xs text-[#6b7280]">
                        {crop.status} · {crop.season}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-sm text-[#6b7280]">No crop history has been recorded.</p>
              )}
            </section>
            <section className="rounded-xl border border-[#e5e7eb] bg-white p-5">
              <h2 className="font-semibold">Stated planting rule</h2>
              <p className="mt-2 text-sm text-[#4b5563]">
                {farmData.priorities?.planting_trigger?.replaceAll('_', ' ') ??
                  'No planting rule recorded'}
              </p>
              {farmData.priorities?.goals.length ? (
                <p className="mt-2 text-xs text-[#6b7280]">
                  Goals: {farmData.priorities.goals.join(', ').replaceAll('_', ' ')}
                </p>
              ) : null}
            </section>
          </aside>
        </div>

        {comparison ? (
          <section className="space-y-4">
            <header className="rounded-xl border border-[#e5e7eb] bg-white p-5">
              <Badge variant="Neutral">Ruleset {comparison.comparison.rulesetVersion}</Badge>
              <h2 className="mt-2 text-xl font-semibold">Parcel comparison</h2>
              <p className="mt-1 text-sm text-[#4b5563]">{comparison.comparison.rankingBasis}</p>
              <p className="mt-3 text-sm font-medium">
                Planting condition: {comparison.plantingTrigger.condition}
              </p>
              <p className="mt-1 text-sm text-[#4b5563]">
                {comparison.plantingTrigger.riskProfile}
              </p>
              <p className="mt-3 text-sm font-medium">
                Seasonal rainfall: {comparison.seasonalOutlook.rainfallToDate.valueMm} mm observed
                against {comparison.seasonalOutlook.rainfallToDate.normalMm} mm normal.
              </p>
              <p className="mt-1 text-xs text-[#6b7280]">
                {comparison.seasonalOutlook.framingNote}
              </p>
            </header>
            <div className="grid gap-4 lg:grid-cols-3">
              {comparison.comparison.strategies.map((strategy, index) => (
                <article
                  key={`${strategy.kind}-${strategy.label}`}
                  className="rounded-xl border border-[#e5e7eb] bg-white p-5"
                >
                  <Badge variant={strategy.kind === 'existing' ? 'farmer' : 'Neutral'}>
                    {strategy.kind === 'existing' ? 'Existing practice' : `Alternative ${index}`}
                  </Badge>
                  <h3 className="mt-3 font-semibold">{strategy.label}</h3>
                  <p className="mt-2 text-sm text-[#4b5563]">{strategy.rationale}</p>
                  <p className="mt-3 text-xs text-[#6b7280]">
                    Evidence strength: {strategy.evidenceStrength}.{' '}
                    {strategy.evidenceStrengthReason}
                  </p>
                  {strategy.legs.length ? (
                    <p className="mt-3 text-xs">
                      Crop sequence: {strategy.legs.map((leg) => leg.cropName).join(' → ')}
                    </p>
                  ) : null}
                </article>
              ))}
            </div>
            {[...comparison.comparison.limitations, ...comparison.seasonalOutlook.limitations]
              .length > 0 ? (
              <div className="rounded-xl border border-[#e5e7eb] bg-white p-5">
                <h3 className="font-semibold">What the data cannot tell us</h3>
                <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-[#4b5563]">
                  {[
                    ...comparison.comparison.limitations,
                    ...comparison.seasonalOutlook.limitations,
                  ].map((limitation, index) => (
                    <li key={`${limitation.statement}-${index}`}>{limitation.statement}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </section>
        ) : (
          <p className="rounded-xl border border-[#e5e7eb] bg-white p-5 text-sm text-[#4b5563]">
            {selectedParcel
              ? `Run an assessment for ${selectedParcel.name} to see its comparison and seasonal outlook.`
              : 'Add parcel geometry to run an assessment.'}
          </p>
        )}
      </div>
    </main>
  );
}
