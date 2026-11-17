'use client';

import { FARMER_GOALS, PLANTING_TRIGGERS } from '@dalashift/shared/constants';
import type {
  ComparisonResult,
  GeoJSONGeometry,
  PlantingTrigger,
  PlantingTriggerAssessment,
} from '@dalashift/shared/types';
import { geometrySchema } from '@dalashift/shared/schemas';
import {
  AlertCircle,
  Clock,
  LoaderCircle,
  MapPin,
  Pencil,
  Plus,
  RefreshCw,
  Sprout,
  Trash2,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import * as React from 'react';
import { z } from 'zod';

import { usePreferredLanguage } from '../../hooks/use-preferred-language';
import {
  formatCropWithHausa,
  formatObservationDate,
  PLANTING_TRIGGER_TITLES,
} from '../../lib/utilities/format';
import { HonestyMapCanvas } from '../maps/honesty-map-canvas';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { SegmentedControl } from '../ui/segmented-control';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Skeleton } from '../ui/skeleton';
import { PlantingTriggerCard } from './planting-trigger-card';
import { SuitabilityShortlistCard } from './suitability-shortlist-card';

const numericValueSchema = z.union([z.number(), z.string().transform(Number)]).nullable();

const NO_SELECTION_VALUE = '__none__';

type WorkspaceSection = 'fields' | 'crops' | 'priorities' | 'advice';

const farmingMethodOptions = [
  { value: 'rainfed', label: 'Rainfed' },
  { value: 'mixed', label: 'Mixed season' },
  { value: 'irrigated', label: 'Irrigated' },
  { value: 'unknown', label: 'Not sure' },
] as const;

const irrigationMethodOptions = [
  { value: 'none', label: 'None' },
  { value: 'rainfed', label: 'Rainfed' },
  { value: 'hand_irrigation', label: 'Hand irrigation (buckets)' },
  { value: 'furrow', label: 'Canal or furrow' },
  { value: 'sprinkler', label: 'Sprinkler' },
  { value: 'drip', label: 'Drip irrigation' },
  { value: 'well', label: 'Borehole or tube well' },
  { value: 'river', label: 'River or stream' },
  { value: 'borehole', label: 'Borehole' },
  { value: 'canal', label: 'Canal' },
  { value: 'other', label: 'Other' },
  { value: 'unknown', label: 'Not sure' },
] as const;

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
        observedAt: z.string().nullable().optional(),
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
  lastObservedAt: z.string().nullable().optional(),
});

const errorResponseSchema = z.object({ error: z.string() });

type FarmResponse = z.infer<typeof farmResponseSchema>;
type ComparisonResponse = z.infer<typeof comparisonResponseSchema>;
type CatalogCrop = z.infer<typeof catalogResponseSchema>['crops'][number];

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

function isOlderThanSevenDays(isoDate: string): boolean {
  const parsed = Date.parse(isoDate);
  return Number.isFinite(parsed) && Date.now() - parsed > SEVEN_DAYS_MS;
}

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
  const router = useRouter();
  const [farmData, setFarmData] = React.useState<FarmResponse | null>(null);
  const [catalog, setCatalog] = React.useState<CatalogCrop[]>([]);
  const [selectedParcelId, setSelectedParcelId] = React.useState<string | null>(null);
  const [comparison, setComparison] = React.useState<ComparisonResponse | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [running, setRunning] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [catalogError, setCatalogError] = React.useState<string | null>(null);
  const [isOffline, setIsOffline] = React.useState(false);
  const [refreshing, setRefreshing] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [selectedPlannedCropCode, setSelectedPlannedCropCode] = React.useState<string | null>(null);
  const [activeSection, setActiveSection] = React.useState<WorkspaceSection>('fields');
  const [editingParcel, setEditingParcel] = React.useState<{
    id: string;
    name: string;
    uncertainty: string;
  } | null>(null);
  const [pendingDeleteParcelId, setPendingDeleteParcelId] = React.useState<string | null>(null);
  const [pendingDeleteCropId, setPendingDeleteCropId] = React.useState<string | null>(null);
  const [editFarmOpen, setEditFarmOpen] = React.useState(false);
  const [deleteFarmOpen, setDeleteFarmOpen] = React.useState(false);
  const [farmDraft, setFarmDraft] = React.useState({
    name: '',
    farmingMethod: 'unknown',
    irrigationMethod: 'unknown',
    soilNotes: '',
  });

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

  const loadFarmAndCatalog = React.useCallback(async () => {
    return Promise.allSettled([
      fetch(`/api/farms/${farmId}`, { cache: 'no-store' }).then((response) =>
        readJson(response, farmResponseSchema),
      ),
      fetch('/api/catalog/crops', { cache: 'no-store' }).then((response) =>
        readJson(response, catalogResponseSchema),
      ),
    ]);
  }, [farmId]);

  const applyFarmAndCatalog = React.useCallback(
    (results: Awaited<ReturnType<typeof loadFarmAndCatalog>>) => {
      const [farmResult, catalogResult] = results;
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
        setErrorMessage(null);
      } else {
        setErrorMessage(
          farmResult.reason instanceof Error
            ? farmResult.reason.message
            : 'Unable to load this farm right now.',
        );
      }
      if (catalogResult.status === 'fulfilled') {
        setCatalog(catalogResult.value.crops);
        setCatalogError(null);
      } else {
        setCatalogError(
          'The crop catalog could not be loaded. Your saved crops and parcels are still here, but adding a catalog crop may not work until it is available again.',
        );
      }
    },
    [],
  );

  const refreshWorkspace = React.useCallback(async () => {
    setRefreshing(true);
    try {
      applyFarmAndCatalog(await loadFarmAndCatalog());
    } finally {
      setRefreshing(false);
    }
  }, [loadFarmAndCatalog, applyFarmAndCatalog]);

  React.useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const results = await loadFarmAndCatalog();
        if (active) applyFarmAndCatalog(results);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [loadFarmAndCatalog, applyFarmAndCatalog]);

  React.useEffect(() => {
    const update = () => setIsOffline(typeof navigator !== 'undefined' && !navigator.onLine);
    update();
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    return () => {
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
    };
  }, []);

  React.useEffect(() => {
    if (comparison) setActiveSection('advice');
  }, [comparison]);

  const oldestObservationAt = React.useMemo(() => {
    const dates: string[] = [];
    const addDate = (value: string | null | undefined) => {
      if (value && Number.isFinite(Date.parse(value))) dates.push(value);
    };
    addDate(comparison?.lastObservedAt);
    comparison?.plantingTrigger.evidence.forEach((item) => addDate(item.observedAt));
    return dates.sort((a, b) => Date.parse(a) - Date.parse(b))[0] ?? null;
  }, [comparison]);

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

  const openEditFarm = () => {
    if (!farmData) return;
    setFarmDraft({
      name: farmData.farm.name,
      farmingMethod: farmData.farm.farming_method,
      irrigationMethod: farmData.farm.irrigation_method,
      soilNotes: farmData.farm.soil_notes ?? '',
    });
    setEditFarmOpen(true);
  };

  const handleSaveFarm = async () => {
    if (!farmDraft.name.trim()) {
      setErrorMessage('Enter a farm name.');
      return;
    }
    setBusy(true);
    setErrorMessage(null);
    try {
      await mutate(`/api/farms/${farmId}`, 'PATCH', {
        name: farmDraft.name.trim(),
        farmingMethod: farmDraft.farmingMethod,
        irrigationMethod: farmDraft.irrigationMethod,
        soilNotes: farmDraft.soilNotes.trim() || null,
      });
      setEditFarmOpen(false);
      await refreshFarm();
    } catch (error) {
      handleMutationError(error);
    } finally {
      setBusy(false);
    }
  };

  const handleDeleteFarm = async () => {
    setBusy(true);
    setErrorMessage(null);
    try {
      await mutate(`/api/farms/${farmId}`, 'DELETE');
      setDeleteFarmOpen(false);
      router.push('/farms');
    } catch (error) {
      handleMutationError(error);
    } finally {
      setBusy(false);
    }
  };

  const handleSaveParcelEdit = async () => {
    if (!editingParcel) return;
    const parcel = farmData?.parcels.find((item) => item.id === editingParcel.id);
    if (!parcel) return;
    const patch: { name?: string; locationUncertaintyM?: number | null } = {};
    const name = editingParcel.name.trim();
    if (name && name !== parcel.name) patch.name = name;
    if (parcel.geometry_method === 'gps_point') {
      const uncertainty = Number(editingParcel.uncertainty);
      if (
        Number.isFinite(uncertainty) &&
        uncertainty >= 0 &&
        uncertainty <= 5000 &&
        uncertainty !== parcel.location_uncertainty_m
      ) {
        patch.locationUncertaintyM = uncertainty;
      }
    }
    setEditingParcel(null);
    if (Object.keys(patch).length === 0) return;
    await handleUpdateParcel(editingParcel.id, patch);
  };

  if (loading) {
    return (
      <div
        aria-busy="true"
        aria-label="Loading your farm"
        className="min-h-screen bg-[#f6f4ef] px-4 py-6 sm:px-6 lg:px-8"
      >
        <div className="mx-auto max-w-7xl space-y-6">
          <div className="rounded-xl border border-[#e5e7eb] bg-white p-5">
            <Skeleton className="h-5 w-24 rounded-full" />
            <Skeleton className="mt-3 h-8 w-64" />
            <Skeleton className="mt-2 h-4 w-48" />
          </div>
          <div className="grid gap-6 lg:grid-cols-12">
            <div className="space-y-3 lg:col-span-8">
              <Skeleton className="h-[460px] w-full rounded-xl" />
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <Skeleton className="h-20 rounded-lg" />
                <Skeleton className="h-20 rounded-lg" />
                <Skeleton className="h-20 rounded-lg" />
                <Skeleton className="h-20 rounded-lg" />
              </div>
              <Skeleton className="h-40 w-full rounded-xl" />
            </div>
            <div className="space-y-4 lg:col-span-4">
              <Skeleton className="h-64 w-full rounded-xl" />
              <Skeleton className="h-64 w-full rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!farmData) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 px-4 py-12">
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
      </div>
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
  const sectionPrefix = 'farm-workspace-section';
  const triggerAssessment = comparison
    ? (comparison.plantingTrigger as unknown as PlantingTriggerAssessment)
    : null;
  const suitabilityComparison = comparison
    ? (comparison.comparison as unknown as ComparisonResult)
    : null;

  return (
    <div className="min-h-screen bg-[#f6f4ef] px-4 py-6 sm:px-6 lg:px-8">
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

        <section className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#e5e7eb] bg-white px-5 py-3">
          <div>
            <h2 className="text-sm font-semibold text-[#374151]">Farm settings</h2>
            <p className="text-xs text-[#6b7280]">Change farm details or remove this farm.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" variant="secondary" size="sm" onClick={openEditFarm}>
              <Pencil className="size-3.5" aria-hidden="true" />
              Edit farm
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={() => setDeleteFarmOpen(true)}
            >
              <Trash2 className="size-3.5" aria-hidden="true" />
              Delete farm
            </Button>
          </div>
        </section>

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

        {isOffline ? (
          <div
            role="status"
            className="flex items-start gap-2 rounded-lg border border-[#b9770e]/30 bg-[#fdf6e5] px-3.5 py-2 text-sm text-[#8e5636]"
          >
            <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <span>
              You are offline. These are the farm details saved on this device. Changes may not save
              until you are back online.
            </span>
          </div>
        ) : null}

        {oldestObservationAt && isOlderThanSevenDays(oldestObservationAt) ? (
          <div
            role="status"
            className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[#b9770e]/30 bg-[#fdf6e5] px-3.5 py-2 text-sm text-[#8e5636]"
          >
            <span className="inline-flex items-center gap-1.5">
              <Clock className="size-4 shrink-0" aria-hidden="true" />
              Some field information is from {formatObservationDate(oldestObservationAt)} and may be
              out of date. {refreshing ? 'Refreshing now…' : null}
            </span>
            <button
              type="button"
              onClick={() => void refreshWorkspace()}
              disabled={refreshing}
              className="inline-flex items-center gap-1 font-semibold underline-offset-2 hover:underline cursor-pointer disabled:opacity-60"
            >
              <RefreshCw className="size-3.5" aria-hidden="true" />
              Refresh
            </button>
          </div>
        ) : null}

        <div className="space-y-3">
          <SegmentedControl
            fullWidth
            ariaLabel="Farm workspace sections"
            panelIdPrefix={sectionPrefix}
            value={activeSection}
            onValueChange={setActiveSection}
            options={[
              { value: 'fields', label: 'Fields' },
              { value: 'crops', label: 'Crops' },
              { value: 'priorities', label: 'Priorities' },
              { value: 'advice', label: 'Advice' },
            ]}
          />
          <p className="text-sm text-[#4b5563]">
            Working on:{' '}
            <span className="font-semibold text-[#111315]">
              {selectedParcel?.name ?? 'no field selected'}
            </span>
          </p>
        </div>

        {activeSection === 'fields' ? (
          <section
            id={`${sectionPrefix}-panel-fields`}
            role="tabpanel"
            aria-labelledby={`${sectionPrefix}-tab-fields`}
            className="space-y-3"
          >
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
                  heightClass="h-[320px] sm:h-[420px] lg:h-[460px]"
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
                      {editingParcel && editingParcel.id === parcel.id ? (
                        <div className="flex flex-wrap items-end gap-2 border-t border-[#e5e7eb] pt-2">
                          <input
                            aria-label={`Field name for ${parcel.name}`}
                            value={editingParcel.name}
                            onChange={(event) =>
                              setEditingParcel({ ...editingParcel, name: event.target.value })
                            }
                            className="h-7 w-36 rounded border border-[#e5e7eb] bg-white px-2 text-xs"
                          />
                          {parcel.geometry_method === 'gps_point' ? (
                            <input
                              type="number"
                              min={1}
                              max={5000}
                              aria-label={`Uncertainty for ${parcel.name}`}
                              value={editingParcel.uncertainty}
                              onChange={(event) =>
                                setEditingParcel({
                                  ...editingParcel,
                                  uncertainty: event.target.value,
                                })
                              }
                              className="h-7 w-20 rounded border border-[#e5e7eb] bg-white px-2 text-xs"
                            />
                          ) : null}
                          <Button
                            type="button"
                            size="xs"
                            disabled={busy}
                            onClick={() => void handleSaveParcelEdit()}
                          >
                            Save
                          </Button>
                          <Button
                            type="button"
                            size="xs"
                            variant="secondary"
                            onClick={() => setEditingParcel(null)}
                          >
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        <div className="flex flex-wrap items-center gap-2 border-t border-[#e5e7eb] pt-2">
                          <button
                            type="button"
                            onClick={() =>
                              setEditingParcel({
                                id: parcel.id,
                                name: parcel.name,
                                uncertainty:
                                  parcel.location_uncertainty_m === null ||
                                  parcel.location_uncertainty_m === undefined
                                    ? ''
                                    : String(parcel.location_uncertainty_m),
                              })
                            }
                            className="inline-flex items-center gap-1 rounded p-1 text-xs text-[#374151] hover:bg-[#f4f5f6]"
                          >
                            <Pencil className="size-3.5" aria-hidden="true" />
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => setPendingDeleteParcelId(parcel.id)}
                            className="inline-flex items-center gap-1 rounded p-1 text-xs text-[#b42318] hover:bg-[#fdeceb]"
                          >
                            <Trash2 className="size-3.5" aria-hidden="true" />
                            Delete
                          </button>
                        </div>
                      )}
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
                  {isDrawing ? 'Drawing: tap corners, then press Done' : 'Draw a new field'}
                </Button>
                {drawnGeometry ? (
                  <span className="text-xs text-brand-primary">
                    Field boundary captured. Check its size above, then add it.
                  </span>
                ) : null}
                <Button type="button" size="sm" onClick={() => void handleAddParcel()}>
                  <Plus className="size-3.5" aria-hidden="true" />
                  Add parcel
                </Button>
              </div>
            </section>
          </section>
        ) : null}

        {activeSection === 'crops' ? (
          <section
            id={`${sectionPrefix}-panel-crops`}
            role="tabpanel"
            aria-labelledby={`${sectionPrefix}-tab-crops`}
            className="rounded-xl border border-[#e5e7eb] bg-white p-5"
          >
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
                        onClick={() => setPendingDeleteCropId(record.id)}
                        className="rounded p-1 text-[#b42318] hover:bg-[#fdeceb]"
                        aria-label={`Delete ${cropName(record.crop)} record`}
                      >
                        <Trash2 className="size-3.5" aria-hidden="true" />
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Select
                        value={record.status}
                        onValueChange={(value) =>
                          void handleUpdateCrop(record.id, { status: value })
                        }
                      >
                        <SelectTrigger aria-label={`Status for ${cropName(record.crop)}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="previous">Previous</SelectItem>
                          <SelectItem value="current">Current</SelectItem>
                          <SelectItem value="planned">Planned</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select
                        value={record.season}
                        onValueChange={(value) =>
                          void handleUpdateCrop(record.id, { season: value })
                        }
                      >
                        <SelectTrigger aria-label={`Season for ${cropName(record.crop)}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="rainy">Rainy</SelectItem>
                          <SelectItem value="dry">Dry</SelectItem>
                          <SelectItem value="harmattan">Harmattan</SelectItem>
                          <SelectItem value="year_round">Year round</SelectItem>
                          <SelectItem value="unknown">Unknown</SelectItem>
                        </SelectContent>
                      </Select>
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
              <p className="text-xs text-[#4b5563]">
                Adding a crop to:{' '}
                <span className="font-semibold text-[#111315]">
                  {selectedParcel?.name ?? 'no field selected'}
                </span>
              </p>
              {catalogError ? (
                <p role="status" className="text-xs text-[#8a5300]">
                  {catalogError}
                </p>
              ) : null}
              <Select
                value={newCrop.cropId}
                onValueChange={(value) =>
                  setNewCrop({ ...newCrop, cropId: value === NO_SELECTION_VALUE ? '' : value })
                }
              >
                <SelectTrigger aria-label="Crop to add">
                  <SelectValue placeholder="Choose a catalog crop" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_SELECTION_VALUE}>Choose a catalog crop</SelectItem>
                  {catalog.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {formatCropWithHausa(item.code, language === 'ha')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex gap-2">
                <Select
                  value={newCrop.status}
                  onValueChange={(value) => setNewCrop({ ...newCrop, status: value })}
                >
                  <SelectTrigger aria-label="Crop status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="previous">Previous</SelectItem>
                    <SelectItem value="current">Current</SelectItem>
                    <SelectItem value="planned">Planned</SelectItem>
                  </SelectContent>
                </Select>
                <Select
                  value={newCrop.season}
                  onValueChange={(value) => setNewCrop({ ...newCrop, season: value })}
                >
                  <SelectTrigger aria-label="Crop season">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rainy">Rainy</SelectItem>
                    <SelectItem value="dry">Dry</SelectItem>
                    <SelectItem value="unknown">Unknown</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="button" size="sm" onClick={() => void handleAddCrop()}>
                <Plus className="size-3.5" aria-hidden="true" />
                Add crop record
              </Button>
            </div>
          </section>
        ) : null}

        {activeSection === 'priorities' ? (
          <section
            id={`${sectionPrefix}-panel-priorities`}
            role="tabpanel"
            aria-labelledby={`${sectionPrefix}-tab-priorities`}
            className="rounded-xl border border-[#e5e7eb] bg-white p-5"
          >
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
                <Select
                  value={priorityDraft.plantingTrigger}
                  onValueChange={(value) =>
                    setPriorityDraft({
                      ...priorityDraft,
                      plantingTrigger: value === NO_SELECTION_VALUE ? '' : value,
                    })
                  }
                >
                  <SelectTrigger aria-label="Planting trigger">
                    <SelectValue placeholder="Not recorded" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NO_SELECTION_VALUE}>Not recorded</SelectItem>
                    {PLANTING_TRIGGERS.map((trigger) => (
                      <SelectItem key={trigger} value={trigger}>
                        {PLANTING_TRIGGER_TITLES[trigger].en}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
        ) : null}

        {activeSection === 'advice' ? (
          <div
            id={`${sectionPrefix}-panel-advice`}
            role="tabpanel"
            aria-labelledby={`${sectionPrefix}-tab-advice`}
          >
            {comparison && suitabilityComparison && triggerAssessment ? (
              <section className="space-y-4">
                <header className="rounded-xl border border-[#e5e7eb] bg-white p-5">
                  <Badge variant="Neutral">Ruleset {comparison.comparison.rulesetVersion}</Badge>
                  <h2 className="mt-2 text-xl font-semibold">Parcel comparison</h2>
                  <p className="mt-1 text-sm text-[#4b5563]">
                    {comparison.comparison.rankingBasis}
                  </p>
                  <p className="mt-3 text-sm font-medium">
                    Seasonal rainfall: {comparison.seasonalOutlook.rainfallToDate.valueMm} mm
                    observed against {comparison.seasonalOutlook.rainfallToDate.normalMm} mm normal.
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
        ) : null}

        <Dialog open={editFarmOpen} onOpenChange={setEditFarmOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit farm details</DialogTitle>
              <DialogDescription>Update the details you recorded for this farm.</DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="edit-farm-name">Farm name</Label>
                <Input
                  id="edit-farm-name"
                  value={farmDraft.name}
                  onChange={(event) => setFarmDraft({ ...farmDraft, name: event.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Water supply regime</Label>
                <Select
                  value={farmDraft.farmingMethod}
                  onValueChange={(value) => setFarmDraft({ ...farmDraft, farmingMethod: value })}
                >
                  <SelectTrigger aria-label="Water supply regime">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {farmingMethodOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Water source</Label>
                <Select
                  value={farmDraft.irrigationMethod}
                  onValueChange={(value) => setFarmDraft({ ...farmDraft, irrigationMethod: value })}
                >
                  <SelectTrigger aria-label="Water source">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {irrigationMethodOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="edit-farm-soil">Notes about your soil</Label>
                <textarea
                  id="edit-farm-soil"
                  value={farmDraft.soilNotes}
                  onChange={(event) =>
                    setFarmDraft({ ...farmDraft, soilNotes: event.target.value })
                  }
                  rows={3}
                  className="w-full rounded border border-[#e5e7eb] bg-[#fafafb] p-2 text-sm"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setEditFarmOpen(false)}
              >
                Cancel
              </Button>
              <Button type="button" size="sm" disabled={busy} onClick={() => void handleSaveFarm()}>
                Save changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={deleteFarmOpen} onOpenChange={setDeleteFarmOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete farm</DialogTitle>
              <DialogDescription>
                Delete this farm and all its fields? This cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setDeleteFarmOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                disabled={busy}
                onClick={() => void handleDeleteFarm()}
              >
                Delete farm
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog
          open={pendingDeleteParcelId !== null}
          onOpenChange={(open) => {
            if (!open) setPendingDeleteParcelId(null);
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete field</DialogTitle>
              <DialogDescription>
                Delete this field and its boundary? This cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setPendingDeleteParcelId(null)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                disabled={busy}
                onClick={() => {
                  const parcelId = pendingDeleteParcelId;
                  setPendingDeleteParcelId(null);
                  if (parcelId) void handleDeleteParcel(parcelId);
                }}
              >
                Delete field
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog
          open={pendingDeleteCropId !== null}
          onOpenChange={(open) => {
            if (!open) setPendingDeleteCropId(null);
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete crop record</DialogTitle>
              <DialogDescription>Delete this crop record? This cannot be undone.</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setPendingDeleteCropId(null)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                disabled={busy}
                onClick={() => {
                  const cropId = pendingDeleteCropId;
                  setPendingDeleteCropId(null);
                  if (cropId) void handleDeleteCrop(cropId);
                }}
              >
                Delete record
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
