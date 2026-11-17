'use client';

import { FARMER_GOALS, PLANTING_TRIGGERS } from '@dalashift/shared/constants';
import type {
  ComparisonResult,
  GeoJSONGeometry,
  PlantingTrigger,
  PlantingTriggerAssessment,
} from '@dalashift/shared/types';
import { geometrySchema } from '@dalashift/shared/schemas';
import { AlertCircle, LoaderCircle, MapPin, Pencil, Plus, Sprout, Trash2 } from 'lucide-react';
import Link from 'next/link';
import * as React from 'react';
import { z } from 'zod';

import { usePreferredLanguage } from '../../hooks/use-preferred-language';
import { formatCropWithHausa, PLANTING_TRIGGER_TITLES } from '../../lib/utilities/format';
import { HonestyMapCanvas } from '../maps/honesty-map-canvas';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { SegmentedControl } from '../ui/segmented-control';
import { PlantingTriggerCard } from './planting-trigger-card';
import { SuitabilityShortlistCard } from './suitability-shortlist-card';

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
      crop_id: z.string(),
      parcel_id: z.string().nullable(),
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
      risk_tolerance: numericValueSchema,
      open_to_change: z.boolean().nullable(),
      planting_trigger: z.string().nullable(),
      notes: z.string().nullable(),
    })
    .nullable(),
});

const catalogResponseSchema = z.object({
  crops: z.array(z.object({ id: z.string(), code: z.string(), name: z.string() })),
});

const comparisonResponseSchema = z.object({
  comparison: z.object({
    kind: z.string(),
    strategies: z.array(
      z.object({
        kind: z.string(),
        label: z.string(),
        rationale: z.string(),
        rank: z.string().nullable(),
        rankingBasis: z.string(),
        evidenceStrength: z.string(),
        evidenceStrengthReason: z.string(),
        legs: z.array(
          z.object({
            cropCode: z.string().optional(),
            cropName: z.string(),
            season: z.string(),
            sequence: z.number(),
          }),
        ),
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
    parcelId: z.string().nullable().optional(),
    farmerRule: z.string().nullable().optional(),
    recommendedTrigger: z.string(),
    condition: z.string(),
    riskProfile: z.string(),
    evidence: z.array(
      z.object({
        kind: z.string(),
        statement: z.string(),
        citation: z.string().nullable().optional(),
        value: z.number().nullable().optional(),
        unit: z.string().nullable().optional(),
      }),
    ),
    limitations: z.array(z.object({ statement: z.string() })),
    rulesetVersion: z.string().optional(),
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
type CatalogCrop = z.infer<typeof catalogResponseSchema>['crops'][number];

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

async function mutate(url: string, method: 'POST' | 'PUT' | 'PATCH' | 'DELETE', body?: unknown) {
  const response = await fetch(url, {
    method,
    headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!response.ok) {
    let payload: unknown;
    try {
      payload = await response.json();
    } catch {
      // Ignore unreadable error bodies.
    }
    const parsed = errorResponseSchema.safeParse(payload);
    throw new Error(parsed.success ? parsed.data.error : `Request failed (${response.status}).`);
  }
}

function cropName(crop: FarmResponse['crops'][number]['crop']): string {
  if (!crop) return 'Crop name unavailable';
  return Array.isArray(crop) ? (crop[0]?.name ?? 'Crop name unavailable') : crop.name;
}

export function RegisteredFarmWorkspace({
  farmId,
}: {
  readonly farmId: string;
}): React.JSX.Element {
  const { language } = usePreferredLanguage();
  const [farmData, setFarmData] = React.useState<FarmResponse | null>(null);
  const [catalog, setCatalog] = React.useState<CatalogCrop[]>([]);
  const [selectedParcelId, setSelectedParcelId] = React.useState<string | null>(null);
  const [comparison, setComparison] = React.useState<ComparisonResponse | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [running, setRunning] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [selectedPlannedCropCode, setSelectedPlannedCropCode] = React.useState<string | null>(null);

  const [newCrop, setNewCrop] = React.useState({ cropId: '', status: 'current', season: 'rainy' });
  const [newParcel, setNewParcel] = React.useState({
    name: '',
    longitude: '',
    latitude: '',
    uncertainty: '100',
  });
  const [drawnGeometry, setDrawnGeometry] = React.useState<GeoJSONGeometry | null>(null);
  const [isDrawing, setIsDrawing] = React.useState(false);
  const [priorityDraft, setPriorityDraft] = React.useState({
    goals: [] as string[],
    plantingTrigger: '' as string,
    riskTolerance: '',
    notes: '',
  });

  const refreshFarm = React.useCallback(async () => {
    const response = await fetch(`/api/farms/${farmId}`, { cache: 'no-store' });
    const data = await readJson(response, farmResponseSchema);
    setFarmData(data);
    setSelectedParcelId((current) =>
      data.parcels.some((p) => p.id === current) ? current : (data.parcels[0]?.id ?? null),
    );
    setPriorityDraft({
      goals: data.priorities?.goals ?? [],
      plantingTrigger: data.priorities?.planting_trigger ?? '',
      riskTolerance:
        data.priorities?.risk_tolerance !== null && data.priorities?.risk_tolerance !== undefined
          ? String(data.priorities.risk_tolerance)
          : '',
      notes: data.priorities?.notes ?? '',
    });
    return data;
  }, [farmId]);

  React.useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const [farmResult, catalogResult] = await Promise.allSettled([
          fetch(`/api/farms/${farmId}`, { cache: 'no-store' }).then((response) =>
            readJson(response, farmResponseSchema),
          ),
          fetch('/api/catalog/crops', { cache: 'no-store' }).then((response) =>
            readJson(response, catalogResponseSchema),
          ),
        ]);
        if (!active) return;
        if (farmResult.status === 'fulfilled') {
          setFarmData(farmResult.value);
          setSelectedParcelId(farmResult.value.parcels[0]?.id ?? null);
          setPriorityDraft({
            goals: farmResult.value.priorities?.goals ?? [],
            plantingTrigger: farmResult.value.priorities?.planting_trigger ?? '',
            riskTolerance:
              farmResult.value.priorities?.risk_tolerance !== null &&
              farmResult.value.priorities?.risk_tolerance !== undefined
                ? String(farmResult.value.priorities.risk_tolerance)
                : '',
            notes: farmResult.value.priorities?.notes ?? '',
          });
        } else {
          setErrorMessage(
            farmResult.reason instanceof Error
              ? farmResult.reason.message
              : 'Unable to load this farm right now.',
          );
        }
        if (catalogResult.status === 'fulfilled') setCatalog(catalogResult.value.crops);
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

  const handleMutationError = (error: unknown) => {
    setErrorMessage(error instanceof Error ? error.message : 'The change could not be saved.');
  };

  const handleSelectTrigger = async (trigger: PlantingTrigger) => {
    setBusy(true);
    setErrorMessage(null);
    try {
      await mutate(`/api/farms/${farmId}/priorities`, 'PUT', {
        goals: priorityDraft.goals,
        plantingTrigger: trigger,
        riskTolerance:
          priorityDraft.riskTolerance === '' ? null : Number(priorityDraft.riskTolerance),
        openToChange: farmData?.priorities?.open_to_change ?? null,
        notes: priorityDraft.notes,
      });
      setPriorityDraft((draft) => ({ ...draft, plantingTrigger: trigger }));
      await refreshFarm();
    } catch (error) {
      handleMutationError(error);
    } finally {
      setBusy(false);
    }
  };

  const handleChoosePlannedCrop = async (code: string, name: string) => {
    const catalogCrop = catalog.find((item) => item.code === code);
    if (!catalogCrop) {
      setErrorMessage(
        `The crop catalog does not contain ${name}. Add it as a custom record instead.`,
      );
      return;
    }
    setBusy(true);
    setErrorMessage(null);
    try {
      await mutate(`/api/farms/${farmId}/crops`, 'POST', {
        parcelId: selectedParcelId,
        cropId: catalogCrop.id,
        status: 'planned',
        season: 'rainy',
      });
      setSelectedPlannedCropCode(code);
      await refreshFarm();
    } catch (error) {
      handleMutationError(error);
    } finally {
      setBusy(false);
    }
  };

  const handleAddCrop = async () => {
    if (!newCrop.cropId) {
      setErrorMessage('Choose a crop from the catalog first.');
      return;
    }
    setBusy(true);
    setErrorMessage(null);
    try {
      await mutate(`/api/farms/${farmId}/crops`, 'POST', {
        parcelId: selectedParcelId,
        cropId: newCrop.cropId,
        status: newCrop.status,
        season: newCrop.season,
      });
      setNewCrop({ cropId: '', status: 'current', season: 'rainy' });
      await refreshFarm();
    } catch (error) {
      handleMutationError(error);
    } finally {
      setBusy(false);
    }
  };

  const handleUpdateCrop = async (
    recordId: string,
    patch: { status?: string; season?: string },
  ) => {
    const record = farmData?.crops.find((item) => item.id === recordId);
    if (!record) return;
    setBusy(true);
    setErrorMessage(null);
    try {
      await mutate(`/api/farms/${farmId}/crops/${recordId}`, 'PUT', {
        parcelId: record.parcel_id,
        cropId: record.crop_id,
        status: patch.status ?? record.status,
        season: patch.season ?? record.season,
      });
      await refreshFarm();
    } catch (error) {
      handleMutationError(error);
    } finally {
      setBusy(false);
    }
  };

  const handleDeleteCrop = async (recordId: string) => {
    setBusy(true);
    setErrorMessage(null);
    try {
      await mutate(`/api/farms/${farmId}/crops/${recordId}`, 'DELETE');
      await refreshFarm();
    } catch (error) {
      handleMutationError(error);
    } finally {
      setBusy(false);
    }
  };

  const handleAddParcel = async () => {
    const longitude = Number(newParcel.longitude);
    const latitude = Number(newParcel.latitude);
    const uncertainty = Number(newParcel.uncertainty);
    if (!newParcel.name.trim()) {
      setErrorMessage('Enter a parcel name.');
      return;
    }
    if (drawnGeometry?.type !== 'Polygon') {
      if (
        !Number.isFinite(longitude) ||
        !Number.isFinite(latitude) ||
        Math.abs(longitude) > 180 ||
        Math.abs(latitude) > 90
      ) {
        setErrorMessage('Enter valid longitude and latitude, or draw a polygon on the map.');
        return;
      }
    }
    setBusy(true);
    setErrorMessage(null);
    try {
      await mutate(`/api/farms/${farmId}/parcels`, 'POST', {
        name: newParcel.name.trim(),
        geometry:
          drawnGeometry?.type === 'Polygon'
            ? drawnGeometry
            : ({ type: 'Point', coordinates: [longitude, latitude] } as const),
        geometryMethod: drawnGeometry?.type === 'Polygon' ? 'drawn_polygon' : 'gps_point',
        locationUncertaintyM:
          drawnGeometry?.type === 'Polygon'
            ? null
            : Number.isFinite(uncertainty)
              ? uncertainty
              : null,
      });
      setNewParcel({ name: '', longitude: '', latitude: '', uncertainty: '100' });
      setDrawnGeometry(null);
      setIsDrawing(false);
      await refreshFarm();
    } catch (error) {
      handleMutationError(error);
    } finally {
      setBusy(false);
    }
  };

  const handleUpdateParcel = async (
    parcelId: string,
    patch: { name?: string; locationUncertaintyM?: number | null },
  ) => {
    setBusy(true);
    setErrorMessage(null);
    try {
      await mutate(`/api/farms/${farmId}/parcels/${parcelId}`, 'PATCH', patch);
      await refreshFarm();
    } catch (error) {
      handleMutationError(error);
    } finally {
      setBusy(false);
    }
  };

  const handleDeleteParcel = async (parcelId: string) => {
    setBusy(true);
    setErrorMessage(null);
    try {
      await mutate(`/api/farms/${farmId}/parcels/${parcelId}`, 'DELETE');
      if (selectedParcelId === parcelId) setSelectedParcelId(null);
      setComparison(null);
      await refreshFarm();
    } catch (error) {
      handleMutationError(error);
    } finally {
      setBusy(false);
    }
  };

  const handleSavePriorities = async () => {
    setBusy(true);
    setErrorMessage(null);
    try {
      await mutate(`/api/farms/${farmId}/priorities`, 'PUT', {
        goals: priorityDraft.goals,
        plantingTrigger: priorityDraft.plantingTrigger || null,
        riskTolerance:
          priorityDraft.riskTolerance === '' ? null : Number(priorityDraft.riskTolerance),
        openToChange: farmData?.priorities?.open_to_change ?? null,
        notes: priorityDraft.notes,
      });
      await refreshFarm();
    } catch (error) {
      handleMutationError(error);
    } finally {
      setBusy(false);
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
  const languagePrefix = 'registered-farm-language';
  const triggerAssessment = comparison
    ? (comparison.plantingTrigger as unknown as PlantingTriggerAssessment)
    : null;
  const suitabilityComparison = comparison
    ? (comparison.comparison as unknown as ComparisonResult)
    : null;

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
          <div className="flex flex-wrap items-center gap-2">
            <div>
              <p className="mb-1 text-[11px] font-semibold text-[#6b7280]">Crop terminology</p>
              <SegmentedControl
                size="sm"
                ariaLabel="Crop terminology mode"
                panelIdPrefix={languagePrefix}
                value={language}
                onValueChange={() => {
                  // The saved preference is read from /api/profile. This control
                  // reflects that value; changing it is done on the profile page.
                }}
                options={[
                  { value: 'en', label: 'English Only', shortLabel: 'English' },
                  { value: 'ha', label: 'English + Hausa', shortLabel: 'Hausa' },
                ]}
              />
            </div>
            <div className="self-end">
              <Button type="button" onClick={runAssessment} disabled={running || !selectedParcelId}>
                {running ? (
                  <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Sprout className="size-4" aria-hidden="true" />
                )}
                {running ? 'Assessing parcel…' : 'Run parcel assessment'}
              </Button>
            </div>
            <div className="self-end">
              <Link href={`/farms/${farmId}/reports`}>
                <Button type="button" variant="secondary">
                  Reports
                </Button>
              </Link>
            </div>
          </div>
        </header>

        <div
          id={`${languagePrefix}-panel-${language}`}
          role="tabpanel"
          aria-labelledby={`${languagePrefix}-tab-${language}`}
        >
          <span className="sr-only">
            Crop names are shown {language === 'ha' ? 'with Hausa terms' : 'in English only'}.
          </span>
        </div>

        {errorMessage ? (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-lg bg-[#fdeceb] p-3 text-sm text-[#b42318]"
          >
            <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            {errorMessage}
          </div>
        ) : null}

        {busy ? (
          <p role="status" className="text-xs text-[#6b7280]">
            Saving changes…
          </p>
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
                  interactiveDraw={isDrawing}
                  onGeometryChange={(geometry) => {
                    setDrawnGeometry(geometry);
                    setIsDrawing(false);
                  }}
                  heightClass="h-[460px]"
                />
                <div className="flex flex-wrap gap-2">
                  {farmData.parcels.map((parcel) => (
                    <div
                      key={parcel.id}
                      className={`flex flex-col gap-2 rounded-lg border p-3 text-sm ${
                        parcel.id === selectedParcelId
                          ? 'border-[#00b159] bg-[#ebfaef]'
                          : 'border-[#e5e7eb] bg-white'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedParcelId(parcel.id);
                          setComparison(null);
                        }}
                        className="text-left"
                      >
                        <span className="block font-semibold">{parcel.name}</span>
                        <span className="text-xs text-[#4b5563]">
                          {parcel.area_ha === null
                            ? `GPS point, ±${parcel.location_uncertainty_m ?? 500} m`
                            : `${parcel.area_ha.toFixed(2)} ha`}
                        </span>
                      </button>
                      <div className="flex flex-wrap items-center gap-2 border-t border-[#e5e7eb] pt-2">
                        <input
                          aria-label={`Rename ${parcel.name}`}
                          defaultValue={parcel.name}
                          onBlur={(event) => {
                            const value = event.target.value.trim();
                            if (value && value !== parcel.name) {
                              void handleUpdateParcel(parcel.id, { name: value });
                            }
                          }}
                          className="h-7 w-36 rounded border border-[#e5e7eb] bg-[#fafafb] px-2 text-xs"
                        />
                        {parcel.geometry_method === 'gps_point' ? (
                          <input
                            type="number"
                            min={1}
                            max={5000}
                            aria-label={`Uncertainty for ${parcel.name}`}
                            defaultValue={parcel.location_uncertainty_m ?? ''}
                            onBlur={(event) => {
                              const value = Number(event.target.value);
                              if (Number.isFinite(value) && value >= 0 && value <= 5000) {
                                void handleUpdateParcel(parcel.id, { locationUncertaintyM: value });
                              }
                            }}
                            className="h-7 w-20 rounded border border-[#e5e7eb] bg-[#fafafb] px-2 text-xs"
                          />
                        ) : null}
                        <button
                          type="button"
                          onClick={() => void handleDeleteParcel(parcel.id)}
                          className="inline-flex items-center gap-1 rounded p-1 text-xs text-[#b42318] hover:bg-[#fdeceb]"
                        >
                          <Trash2 className="size-3.5" aria-hidden="true" />
                          Delete
                        </button>
                      </div>
                    </div>
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
                  Add a GPS point or draw a boundary below to start receiving satellite
                  intelligence.
                </p>
              </div>
            )}

            <section className="rounded-xl border border-[#e5e7eb] bg-white p-5">
              <h2 className="font-semibold">Add a parcel</h2>
              <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <Label>Parcel name</Label>
                  <Input
                    value={newParcel.name}
                    onChange={(event) => setNewParcel({ ...newParcel, name: event.target.value })}
                    placeholder="e.g. North Field"
                  />
                </div>
                <div>
                  <Label>Longitude (°E)</Label>
                  <Input
                    type="number"
                    step="0.00001"
                    value={newParcel.longitude}
                    onChange={(event) =>
                      setNewParcel({ ...newParcel, longitude: event.target.value })
                    }
                    disabled={drawnGeometry !== null}
                  />
                </div>
                <div>
                  <Label>Latitude (°N)</Label>
                  <Input
                    type="number"
                    step="0.00001"
                    value={newParcel.latitude}
                    onChange={(event) =>
                      setNewParcel({ ...newParcel, latitude: event.target.value })
                    }
                    disabled={drawnGeometry !== null}
                  />
                </div>
                <div>
                  <Label>Uncertainty (m)</Label>
                  <Input
                    type="number"
                    min={1}
                    max={5000}
                    value={newParcel.uncertainty}
                    onChange={(event) =>
                      setNewParcel({ ...newParcel, uncertainty: event.target.value })
                    }
                    disabled={drawnGeometry !== null}
                  />
                </div>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setDrawnGeometry(null);
                    setIsDrawing((value) => !value);
                  }}
                >
                  <Pencil className="size-3.5" aria-hidden="true" />
                  {isDrawing ? 'Drawing: click vertices, then finish' : 'Draw boundary on map'}
                </Button>
                {drawnGeometry ? (
                  <span className="text-xs text-[#0b4f2f]">Polygon captured from the map.</span>
                ) : null}
                <Button type="button" size="sm" onClick={() => void handleAddParcel()}>
                  <Plus className="size-3.5" aria-hidden="true" />
                  Add parcel
                </Button>
              </div>
            </section>
          </section>

          <aside className="space-y-4 lg:col-span-4">
            <section className="rounded-xl border border-[#e5e7eb] bg-white p-5">
              <h2 className="font-semibold">Crops you recorded</h2>
              {farmData.crops.length > 0 ? (
                <ul className="mt-3 space-y-3">
                  {farmData.crops.map((record) => (
                    <li
                      key={record.id}
                      className="space-y-2 border-b border-[#e5e7eb] pb-2 last:border-0"
                    >
                      <div className="flex items-center justify-between gap-2 text-sm">
                        <span>{cropName(record.crop)}</span>
                        <button
                          type="button"
                          onClick={() => void handleDeleteCrop(record.id)}
                          className="rounded p-1 text-[#b42318] hover:bg-[#fdeceb]"
                          aria-label={`Delete ${cropName(record.crop)} record`}
                        >
                          <Trash2 className="size-3.5" aria-hidden="true" />
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <select
                          aria-label={`Status for ${cropName(record.crop)}`}
                          value={record.status}
                          onChange={(event) =>
                            void handleUpdateCrop(record.id, { status: event.target.value })
                          }
                          className="h-7 rounded border border-[#e5e7eb] bg-[#fafafb] px-2 text-xs"
                        >
                          <option value="previous">Previous</option>
                          <option value="current">Current</option>
                          <option value="planned">Planned</option>
                        </select>
                        <select
                          aria-label={`Season for ${cropName(record.crop)}`}
                          value={record.season}
                          onChange={(event) =>
                            void handleUpdateCrop(record.id, { season: event.target.value })
                          }
                          className="h-7 rounded border border-[#e5e7eb] bg-[#fafafb] px-2 text-xs"
                        >
                          <option value="rainy">Rainy</option>
                          <option value="dry">Dry</option>
                          <option value="harmattan">Harmattan</option>
                          <option value="year_round">Year round</option>
                          <option value="unknown">Unknown</option>
                        </select>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-sm text-[#6b7280]">No crop history has been recorded.</p>
              )}

              <div className="mt-4 space-y-2 border-t border-[#e5e7eb] pt-3">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-[#6b7280]">
                  Add a crop
                </h3>
                <select
                  aria-label="Crop to add"
                  value={newCrop.cropId}
                  onChange={(event) => setNewCrop({ ...newCrop, cropId: event.target.value })}
                  className="h-9 w-full rounded border border-[#e5e7eb] bg-[#fafafb] px-2 text-sm"
                >
                  <option value="">Choose a catalog crop</option>
                  {catalog.map((item) => (
                    <option key={item.id} value={item.id}>
                      {formatCropWithHausa(item.code, language === 'ha')}
                    </option>
                  ))}
                </select>
                <div className="flex gap-2">
                  <select
                    aria-label="Crop status"
                    value={newCrop.status}
                    onChange={(event) => setNewCrop({ ...newCrop, status: event.target.value })}
                    className="h-9 flex-1 rounded border border-[#e5e7eb] bg-[#fafafb] px-2 text-sm"
                  >
                    <option value="previous">Previous</option>
                    <option value="current">Current</option>
                    <option value="planned">Planned</option>
                  </select>
                  <select
                    aria-label="Crop season"
                    value={newCrop.season}
                    onChange={(event) => setNewCrop({ ...newCrop, season: event.target.value })}
                    className="h-9 flex-1 rounded border border-[#e5e7eb] bg-[#fafafb] px-2 text-sm"
                  >
                    <option value="rainy">Rainy</option>
                    <option value="dry">Dry</option>
                    <option value="unknown">Unknown</option>
                  </select>
                </div>
                <Button type="button" size="sm" onClick={() => void handleAddCrop()}>
                  <Plus className="size-3.5" aria-hidden="true" />
                  Add crop record
                </Button>
              </div>
            </section>

            <section className="rounded-xl border border-[#e5e7eb] bg-white p-5">
              <h2 className="font-semibold">Stated priorities</h2>
              <p className="mt-1 text-xs text-[#6b7280]">
                {farmData.priorities?.planting_trigger
                  ? (PLANTING_TRIGGER_TITLES[
                      farmData.priorities.planting_trigger as keyof typeof PLANTING_TRIGGER_TITLES
                    ]?.en ?? farmData.priorities.planting_trigger.replaceAll('_', ' '))
                  : 'No planting rule recorded'}
              </p>
              <div className="mt-3 space-y-2">
                <Label>Management goals</Label>
                <div className="flex flex-wrap gap-1.5">
                  {FARMER_GOALS.map((goal) => {
                    const checked = priorityDraft.goals.includes(goal);
                    return (
                      <button
                        key={goal}
                        type="button"
                        onClick={() =>
                          setPriorityDraft((draft) => ({
                            ...draft,
                            goals: checked
                              ? draft.goals.filter((item) => item !== goal)
                              : [...draft.goals, goal],
                          }))
                        }
                        className={`rounded-full border px-2.5 py-1 text-[11px] ${
                          checked
                            ? 'border-[#00b159] bg-[#00b159] text-white'
                            : 'border-[#e5e7eb] bg-[#f4f5f6] text-[#374151]'
                        }`}
                      >
                        {goal.replaceAll('_', ' ')}
                      </button>
                    );
                  })}
                </div>
                <div>
                  <Label>Planting trigger</Label>
                  <select
                    value={priorityDraft.plantingTrigger}
                    onChange={(event) =>
                      setPriorityDraft({ ...priorityDraft, plantingTrigger: event.target.value })
                    }
                    className="h-9 w-full rounded border border-[#e5e7eb] bg-[#fafafb] px-2 text-sm"
                  >
                    <option value="">Not recorded</option>
                    {PLANTING_TRIGGERS.map((trigger) => (
                      <option key={trigger} value={trigger}>
                        {PLANTING_TRIGGER_TITLES[trigger].en}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="risk-tolerance">Risk tolerance (0 to 1)</Label>
                  <Input
                    id="risk-tolerance"
                    type="number"
                    min={0}
                    max={1}
                    step="0.05"
                    value={priorityDraft.riskTolerance}
                    onChange={(event) =>
                      setPriorityDraft({ ...priorityDraft, riskTolerance: event.target.value })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="priority-notes">Notes</Label>
                  <textarea
                    id="priority-notes"
                    value={priorityDraft.notes}
                    onChange={(event) =>
                      setPriorityDraft({ ...priorityDraft, notes: event.target.value })
                    }
                    rows={2}
                    className="w-full rounded border border-[#e5e7eb] bg-[#fafafb] p-2 text-sm"
                  />
                </div>
                <Button type="button" size="sm" onClick={() => void handleSavePriorities()}>
                  Save priorities
                </Button>
              </div>
            </section>
          </aside>
        </div>

        {comparison && suitabilityComparison && triggerAssessment ? (
          <section className="space-y-4">
            <header className="rounded-xl border border-[#e5e7eb] bg-white p-5">
              <Badge variant="Neutral">Ruleset {comparison.comparison.rulesetVersion}</Badge>
              <h2 className="mt-2 text-xl font-semibold">Parcel comparison</h2>
              <p className="mt-1 text-sm text-[#4b5563]">{comparison.comparison.rankingBasis}</p>
              <p className="mt-3 text-sm font-medium">
                Seasonal rainfall: {comparison.seasonalOutlook.rainfallToDate.valueMm} mm observed
                against {comparison.seasonalOutlook.rainfallToDate.normalMm} mm normal.
              </p>
              <p className="mt-1 text-xs text-[#6b7280]">
                {comparison.seasonalOutlook.framingNote}
              </p>
            </header>

            <PlantingTriggerCard
              assessment={triggerAssessment}
              fieldLang={language}
              onSelectTrigger={(trigger) => void handleSelectTrigger(trigger)}
            />

            <SuitabilityShortlistCard
              comparison={suitabilityComparison}
              fieldLang={language}
              selectedPlannedCropCode={selectedPlannedCropCode}
              onSelectPlannedCrop={(code, name) => void handleChoosePlannedCrop(code, name)}
            />

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
              ? `Run an assessment for ${selectedParcel.name} to see the trigger, crop shortlist and seasonal outlook.`
              : 'Add parcel geometry to run an assessment.'}
          </p>
        )}
      </div>
    </main>
  );
}
