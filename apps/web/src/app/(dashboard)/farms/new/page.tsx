'use client';

import { area, centroid } from '@turf/turf';
import type { GeoJSONGeometry } from '@dalashift/shared/types';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Crosshair,
  Plus,
  Trash2,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import * as React from 'react';
import { z } from 'zod';

import { ParcelVectorThumbnail } from '../../../../components/farms/parcel-vector-thumbnail';
import { HonestyMapCanvas } from '../../../../components/maps/honesty-map-canvas';
import { Badge } from '../../../../components/ui/badge';
import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';
import { Label } from '../../../../components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../../components/ui/select';
import { SegmentedControl } from '../../../../components/ui/segmented-control';
import { Textarea } from '../../../../components/ui/textarea';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../../../../components/ui/tooltip';
import { CATALOG_CROPS } from '../../../../features/crops/catalog';
import { formatCropWithHausa, PLANTING_TRIGGER_TITLES } from '../../../../lib/utilities/format';

const apiErrorSchema = z.object({ error: z.string() });
const createdFarmSchema = z.object({ farm: z.object({ id: z.string().uuid() }) });
const createdParcelSchema = z.object({ parcel: z.object({ id: z.string().uuid() }) });
const cropCatalogSchema = z.object({
  crops: z.array(z.object({ id: z.string().uuid(), code: z.string() })),
});
const compareResultSchema = z.object({
  analysisId: z.string().uuid().nullable(),
  comparison: z.unknown(),
});

// Radix Select items cannot use an empty string as a value, so the "no crop
// selected" option uses this sentinel and is translated back to '' in the
// onValueChange handlers. The rest of the wizard continues to work with ''.
const NO_CROP_VALUE = '__none__';

const WATER_SUPPLY_LABELS: Record<'rainfed' | 'irrigated' | 'mixed' | 'unknown', string> = {
  rainfed: 'Rainfed',
  irrigated: 'Irrigated',
  mixed: 'Mixed Season',
  unknown: 'Not sure',
};

interface WizardFieldErrors {
  farmName?: string;
  waterSupply?: string;
  cropSearch?: string;
  currentCrop?: string;
  plannedCrop?: string;
}

async function requestApi<T>(url: string, schema: z.ZodType<T>, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  let payload: unknown;

  try {
    payload = await response.json();
  } catch {
    throw new Error('The server returned an invalid response.');
  }

  if (!response.ok) {
    const parsedError = apiErrorSchema.safeParse(payload);
    throw new Error(
      parsedError.success ? parsedError.data.error : `Request failed (${response.status}).`,
    );
  }

  const parsed = schema.safeParse(payload);
  if (!parsed.success) {
    throw new Error('The server returned incomplete farm data.');
  }

  return parsed.data;
}

function jsonRequest(method: 'POST' | 'PUT', body: unknown): RequestInit {
  return {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  };
}

interface DraftParcel {
  readonly id: string;
  readonly name: string;
  readonly geometryMethod: 'drawn_polygon' | 'gps_point';
  readonly centerLon: number | null;
  readonly centerLat: number | null;
  /** A real drawn polygon, captured from the map. Null until the farmer draws one. */
  readonly geometry: GeoJSONGeometry | null;
  readonly locationUncertaintyM: number | null;
}

function hasValidCoordinates(draft: DraftParcel): boolean {
  return (
    draft.centerLon !== null &&
    draft.centerLat !== null &&
    Number.isFinite(draft.centerLon) &&
    Number.isFinite(draft.centerLat) &&
    draft.centerLon >= -180 &&
    draft.centerLon <= 180 &&
    draft.centerLat >= -90 &&
    draft.centerLat <= 90
  );
}

function hasValidGeometryDraft(draft: DraftParcel): boolean {
  if (draft.geometryMethod === 'drawn_polygon') {
    return draft.geometry?.type === 'Polygon' && draft.geometry.coordinates.length > 0;
  }
  return hasValidCoordinates(draft);
}

function buildParcelGeometry(draft: DraftParcel): GeoJSONGeometry {
  if (!hasValidGeometryDraft(draft)) {
    throw new Error('Parcel location or geometry is invalid.');
  }
  if (draft.geometryMethod === 'drawn_polygon') {
    return draft.geometry!;
  }
  return {
    type: 'Point',
    coordinates: [draft.centerLon!, draft.centerLat!],
  };
}

function computePolygonHa(draft: DraftParcel): number | null {
  if (!hasValidGeometryDraft(draft)) return null;
  const geom = buildParcelGeometry(draft);
  if (geom.type === 'Point') {
    return null;
  }
  const sqm = area({
    type: 'Feature',
    properties: {},
    geometry: {
      type: 'Polygon',
      coordinates: geom.coordinates.map((ring) => ring.map((pt) => [pt[0], pt[1]])),
    },
  });
  return Number((sqm / 10_000).toFixed(2));
}

export default function NewFarmWizardPage(): React.JSX.Element {
  const router = useRouter();
  const [step, setStep] = React.useState<1 | 2 | 3>(1);

  // Step 1 State
  const [farmerMode, setFarmerMode] = React.useState<'existing' | 'prospective'>('existing');
  const [farmName, setFarmName] = React.useState('');
  const [farmingMethod, setFarmingMethod] = React.useState<
    'rainfed' | 'irrigated' | 'mixed' | 'unknown'
  >('unknown');
  const [waterSupplyChosen, setWaterSupplyChosen] = React.useState(false);
  const [irrigationMethod, setIrrigationMethod] = React.useState<string>('unknown');
  const [soilNotes, setSoilNotes] = React.useState('');

  // Step 2 State
  const [cropSearch, setCropSearch] = React.useState('');
  const [previousCrop, setPreviousCrop] = React.useState('');
  const [currentCrop, setCurrentCrop] = React.useState('');
  const [plannedCrop, setPlannedCrop] = React.useState('');
  const [plantingTriggerRule, setPlantingTriggerRule] = React.useState<
    'wait_for_confirmed_moisture' | 'plant_on_first_rains' | 'prepare_and_plant_quickly' | null
  >(null);
  const [selectedGoals, setSelectedGoals] = React.useState<string[]>([]);

  // Step 3 State
  const [draftParcels, setDraftParcels] = React.useState<DraftParcel[]>([
    {
      id: 'draft-parcel-1',
      name: 'Field 1',
      geometryMethod: 'gps_point',
      centerLon: null,
      centerLat: null,
      geometry: null,
      locationUncertaintyM: null,
    },
  ]);
  const [activeDraftParcelId, setActiveDraftParcelId] = React.useState<string>('draft-parcel-1');
  const [submitting, setSubmitting] = React.useState(false);
  const [statusMessage, setStatusMessage] = React.useState<string | null>(null);
  const [createdFarmId, setCreatedFarmId] = React.useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = React.useState<WizardFieldErrors>({});
  const [saveFailed, setSaveFailed] = React.useState(false);
  const [confirming, setConfirming] = React.useState(false);

  const activeDraftParcel =
    draftParcels.find((p) => p.id === activeDraftParcelId) ?? draftParcels[0]!;

  const mappedDraftParcels = React.useMemo(() => {
    return draftParcels.flatMap((dp) => {
      if (!hasValidGeometryDraft(dp)) return [];
      const geom = buildParcelGeometry(dp);
      return [
        {
          id: dp.id,
          farmId: 'draft-farm',
          name: dp.name,
          geometry: geom,
          areaHa: computePolygonHa(dp) ?? 0,
          locationUncertaintyM: dp.locationUncertaintyM,
          geometryMethod: dp.geometryMethod,
        },
      ];
    });
  }, [draftParcels]);

  const handleMapCoordinateCapture = (lon: number, lat: number) => {
    const targetId = activeDraftParcelId || draftParcels[0]?.id;
    if (!targetId) return;
    const targetParcel = draftParcels.find((p) => p.id === targetId);

    // The map's Location tool is the single source of truth for the method.
    updateParcel(targetId, {
      geometryMethod: 'gps_point',
      geometry: null,
      centerLon: lon,
      centerLat: lat,
      locationUncertaintyM: targetParcel?.locationUncertaintyM ?? 250,
    });
  };

  const handleDrawnGeometry = (geometry: GeoJSONGeometry) => {
    const targetId = activeDraftParcelId || draftParcels[0]?.id;
    if (!targetId || geometry.type !== 'Polygon') return;
    const center = centroid({
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'Polygon',
        coordinates: geometry.coordinates.map((ring) => ring.map((pt) => [pt[0], pt[1]])),
      },
    });
    // The map's Draw tool is the single source of truth for the method.
    updateParcel(targetId, {
      geometryMethod: 'drawn_polygon',
      geometry,
      centerLon: Number(Number(center.geometry.coordinates[0]).toFixed(5)),
      centerLat: Number(Number(center.geometry.coordinates[1]).toFixed(5)),
      locationUncertaintyM: null,
    });
  };

  const isBeansAmbiguous =
    cropSearch.trim().toLowerCase() === 'beans' || cropSearch.trim().toLowerCase() === 'bean';

  const goToStep = (next: 1 | 2 | 3) => {
    setFieldErrors({});
    setStep(next);
  };

  const validateStep1 = (): boolean => {
    const errors: WizardFieldErrors = {};
    if (!farmName.trim()) {
      errors.farmName = 'Give your farm a name before you continue.';
    }
    if (!waterSupplyChosen) {
      errors.waterSupply = 'Choose how your farm gets water, or pick Not sure.';
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateStep2 = (): boolean => {
    const errors: WizardFieldErrors = {};
    if (isBeansAmbiguous) {
      errors.cropSearch = 'Pick the specific bean crop you mean from the choices above.';
    }
    if (farmerMode === 'existing' && !currentCrop) {
      errors.currentCrop = 'Choose the crop you grow on this farm right now.';
    }
    if (!plannedCrop) {
      errors.plannedCrop = 'Choose the crop you plan to plant next.';
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const toggleGoal = (goal: string) => {
    setSelectedGoals((prev) =>
      prev.includes(goal) ? prev.filter((g) => g !== goal) : [...prev, goal],
    );
  };

  const addDraftParcel = () => {
    const nextIndex = draftParcels.length + 1;
    setDraftParcels((prev) => [
      ...prev,
      {
        id: `draft-parcel-${Date.now()}`,
        name: `Field ${nextIndex}`,
        geometryMethod: 'gps_point',
        centerLon: null,
        centerLat: null,
        geometry: null,
        locationUncertaintyM: null,
      },
    ]);
  };

  const updateParcel = (id: string, patch: Partial<DraftParcel>) => {
    setDraftParcels((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  };

  const removeParcel = (id: string) => {
    if (draftParcels.length <= 1) return;
    setDraftParcels((prev) => prev.filter((p) => p.id !== id));
  };

  const handleFinish = async () => {
    setStatusMessage(null);
    setCreatedFarmId(null);
    setSaveFailed(false);
    if (!farmName.trim()) {
      setStatusMessage('Enter a farm name before saving.');
      return;
    }
    if (isBeansAmbiguous) {
      setStatusMessage('Choose a specific crop instead of the unresolved name “beans”.');
      return;
    }
    if (farmerMode === 'existing' ? !currentCrop || !plannedCrop : !plannedCrop) {
      setStatusMessage(
        farmerMode === 'existing'
          ? "Choose the crop you grow now and the one you plan next, or change to 'I am planning what to grow'."
          : 'Choose the crop you plan to grow before saving.',
      );
      return;
    }
    if (
      draftParcels.some(
        (draft) =>
          !draft.name.trim() ||
          !hasValidGeometryDraft(draft) ||
          (draft.geometryMethod === 'gps_point' &&
            (draft.locationUncertaintyM === null ||
              draft.locationUncertaintyM < 1 ||
              draft.locationUncertaintyM > 5000)),
      )
    ) {
      setStatusMessage(
        'Give each field a name and mark it on the map. Pinned fields also need an accuracy value between 1 and 5,000 metres.',
      );
      return;
    }

    setSubmitting(true);
    let farmId: string | null = null;
    let stage = 'the farm';
    try {
      const { farm } = await requestApi(
        '/api/farms',
        createdFarmSchema,
        jsonRequest('POST', {
          name: farmName,
          farmingMethod,
          irrigationMethod,
          soilNotes,
        }),
      );
      farmId = farm.id;
      setCreatedFarmId(farmId);

      stage = 'the crop catalog';
      const { crops } = await requestApi('/api/catalog/crops', cropCatalogSchema, {
        method: 'GET',
        cache: 'no-store',
      });
      const cropIds = new Map(crops.map((crop) => [crop.code, crop.id]));
      const parcelIds: string[] = [];

      stage = 'your fields';
      for (const draft of draftParcels) {
        const { parcel } = await requestApi(
          `/api/farms/${farmId}/parcels`,
          createdParcelSchema,
          jsonRequest('POST', {
            name: draft.name,
            geometry: buildParcelGeometry(draft),
            geometryMethod: draft.geometryMethod,
            locationUncertaintyM:
              draft.geometryMethod === 'gps_point' ? draft.locationUncertaintyM : null,
          }),
        );
        parcelIds.push(parcel.id);
      }

      const cropEntries =
        farmerMode === 'existing'
          ? [
              ...(previousCrop ? [{ code: previousCrop, status: 'previous' as const }] : []),
              { code: currentCrop, status: 'current' as const },
              { code: plannedCrop, status: 'planned' as const },
            ]
          : [{ code: plannedCrop, status: 'planned' as const }];

      stage = 'your crops';
      for (const crop of cropEntries) {
        const cropId = cropIds.get(crop.code);
        if (!cropId) {
          throw new Error(`The crop catalog does not contain ${crop.code}.`);
        }

        await requestApi(
          `/api/farms/${farmId}/crops`,
          z.object({ crop: z.object({ id: z.string().uuid() }) }),
          jsonRequest('POST', {
            parcelId: parcelIds[0] ?? null,
            cropId,
            status: crop.status,
            season: 'rainy',
          }),
        );
      }

      stage = 'your planting preferences';
      await requestApi(
        `/api/farms/${farmId}/priorities`,
        z.object({ priorities: z.unknown() }),
        jsonRequest('PUT', {
          goals: selectedGoals,
          plantingTrigger: plantingTriggerRule,
          riskTolerance: null,
          openToChange: null,
        }),
      );

      stage = 'your farm guidance';
      await requestApi(
        `/api/farms/${farmId}/compare`,
        compareResultSchema,
        jsonRequest('POST', {
          parcelId: parcelIds[0] ?? null,
          kind: farmerMode === 'existing' ? 'rotation' : 'suitability',
        }),
      );

      router.push(`/farms/${farmId}`);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unable to save the farm. Please try again.';
      setSaveFailed(true);
      setStatusMessage(
        farmId
          ? `${message} Your farm was saved, but ${stage} did not save. Nothing you typed was lost. Use Retry to save the rest.`
          : `${message} ${stage.charAt(0).toUpperCase()}${stage.slice(1)} did not save. Nothing you typed was lost. Use Retry to try again.`,
      );
    } finally {
      setSubmitting(false);
    }
  };

  const waterSupplyLabel = WATER_SUPPLY_LABELS[farmingMethod];
  const fieldSummary = draftParcels.map((draft) => draft.name.trim() || 'Unnamed field').join(', ');
  const cropSummary = [
    ...(farmerMode === 'existing' && previousCrop ? [previousCrop] : []),
    ...(farmerMode === 'existing' ? [currentCrop] : []),
    plannedCrop,
  ]
    .filter(Boolean)
    .map((code) => formatCropWithHausa(code, true))
    .join(', ');
  const triggerLabel = plantingTriggerRule
    ? (PLANTING_TRIGGER_TITLES[plantingTriggerRule]?.en ?? plantingTriggerRule)
    : 'Not sure yet';

  const statusAlert = statusMessage ? (
    <div
      role="alert"
      className="rounded-[8px] border border-[#f5c2c0] bg-[#fdeceb] p-3 text-xs font-medium text-[#b42318]"
    >
      <span>{statusMessage}</span>
      {statusMessage.toLowerCase().includes('auth') ||
      statusMessage.toLowerCase().includes('sign in') ? (
        <Link
          href="/login?next=/farms/new"
          className="ml-2 font-bold underline underline-offset-2 text-[#0a4232]"
        >
          Sign in to save
        </Link>
      ) : null}
      {createdFarmId ? (
        <Link href={`/farms/${createdFarmId}`} className="ml-1 underline underline-offset-2">
          Open your saved farm.
        </Link>
      ) : null}
      {saveFailed ? (
        <button
          type="button"
          onClick={() => void handleFinish()}
          disabled={submitting}
          className="ml-2 font-bold underline underline-offset-2 cursor-pointer disabled:opacity-60"
        >
          Retry saving
        </button>
      ) : null}
    </div>
  ) : null;

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-[#f6f4ef] px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl space-y-6">
          {/* Wizard Header & 3-Step Indicator */}
          <div className="rounded-[12px] border border-[#e5e7eb] bg-white p-4 shadow-xs sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <Badge variant="Strong">Add a farm</Badge>
                <h1 className="mt-1 font-display text-2xl font-bold tracking-tight text-[#111315]">
                  Add your farm
                </h1>
                <p className="mt-1 text-xs leading-snug text-[#4b5563] sm:text-sm">
                  First tell us about your farm. Next add your crops. Then mark your fields on the
                  map.
                </p>
              </div>
              <div className="text-xs font-semibold text-[#072f24]">Step {step} of 3</div>
            </div>

            {/* Stepper Bar: short labels and large tap targets on small screens. */}
            <div className="mt-5 grid grid-cols-3 gap-1.5 sm:gap-2">
              {[
                { num: 1 as const, title: '1. Your farm', short: 'Farm' },
                { num: 2 as const, title: '2. Your crops', short: 'Crops' },
                { num: 3 as const, title: '3. Your fields', short: 'Fields' },
              ].map((item) => (
                <button
                  key={item.num}
                  type="button"
                  onClick={() => goToStep(item.num)}
                  aria-current={step === item.num ? 'step' : undefined}
                  className={`flex min-h-11 items-center justify-center rounded-[8px] border px-1 py-2 text-center text-xs font-semibold leading-tight whitespace-normal transition-colors sm:px-3 sm:text-sm ${
                    step === item.num
                      ? 'border-[#0a4232] bg-[#eaf2ee] text-[#072f24]'
                      : step > item.num
                        ? 'border-[#eaf2ee] bg-white text-[#111315]'
                        : 'border-[#e5e7eb] bg-[#f4f5f6] text-[#6b7280]'
                  }`}
                >
                  <span className="sm:hidden">{item.short}</span>
                  <span className="hidden sm:inline">{item.title}</span>
                </button>
              ))}
            </div>
          </div>

          {/* STEP 1: FARMER MODE & HOLDING DETAILS */}
          {step === 1 ? (
            <div className="space-y-5 rounded-[12px] border border-[#e5e7eb] bg-white p-4 shadow-xs sm:p-6">
              <p className="rounded-lg bg-[#eaf2ee] px-3 py-2 text-xs leading-snug text-[#072f24]">
                Name your farm, add your crops, then mark your fields on the map.
              </p>
              <div className="space-y-2">
                <Label>Which describes you?</Label>
                <SegmentedControl
                  fullWidth
                  stackOnMobile
                  className="[&_button]:min-h-11"
                  ariaLabel="Which describes you?"
                  value={farmerMode}
                  onValueChange={setFarmerMode}
                  options={[
                    { value: 'existing', label: 'I already farm this land' },
                    { value: 'prospective', label: 'I am planning what to grow' },
                  ]}
                />
                <p className="text-xs leading-snug text-[#6b7280]">
                  {farmerMode === 'existing'
                    ? 'We will suggest crops that rotate well with what you already grow.'
                    : 'We will suggest crops that suit your land.'}
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="farm-name">Farm name</Label>
                  <Input
                    id="farm-name"
                    value={farmName}
                    onChange={(e) => {
                      setFarmName(e.target.value);
                      if (fieldErrors.farmName) {
                        setFieldErrors((errors) => ({ ...errors, farmName: undefined }));
                      }
                    }}
                    placeholder="e.g. my farm by the river"
                    aria-invalid={Boolean(fieldErrors.farmName)}
                    required
                  />
                  {fieldErrors.farmName ? (
                    <p className="text-xs text-[#b42318]">{fieldErrors.farmName}</p>
                  ) : null}
                </div>

                <div className="space-y-1.5">
                  <Label>Where does your water come from?</Label>
                  <SegmentedControl
                    fullWidth
                    stackOnMobile
                    className="[&_button]:min-h-11"
                    ariaLabel="Where does your water come from?"
                    value={farmingMethod}
                    onValueChange={(val) => {
                      setFarmingMethod(val);
                      setWaterSupplyChosen(true);
                      setFieldErrors((errors) => ({ ...errors, waterSupply: undefined }));
                      if (val === 'rainfed') setIrrigationMethod('rainfed');
                      else if (irrigationMethod === 'rainfed') setIrrigationMethod('unknown');
                    }}
                    options={[
                      { value: 'rainfed', label: 'Only rain' },
                      { value: 'mixed', label: 'Rain and irrigation', shortLabel: 'Both' },
                      { value: 'irrigated', label: 'Irrigation' },
                      { value: 'unknown', label: 'Not sure' },
                    ]}
                  />
                  {fieldErrors.waterSupply ? (
                    <p className="text-xs text-[#b42318]">{fieldErrors.waterSupply}</p>
                  ) : null}
                </div>
              </div>

              {farmingMethod === 'mixed' || farmingMethod === 'irrigated' ? (
                <div className="space-y-1.5">
                  <Label htmlFor="irrigation-method">Tell us more about your water source</Label>
                  <Select value={irrigationMethod} onValueChange={setIrrigationMethod}>
                    <SelectTrigger id="irrigation-method">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unknown">Not sure</SelectItem>
                      <SelectItem value="well">Borehole / Tube Well</SelectItem>
                      <SelectItem value="river">River / Stream</SelectItem>
                      <SelectItem value="furrow">Canal / Furrow</SelectItem>
                      <SelectItem value="drip">Drip Irrigation</SelectItem>
                      <SelectItem value="sprinkler">Sprinkler</SelectItem>
                      <SelectItem value="hand_irrigation">Hand Irrigation (Buckets)</SelectItem>
                      <SelectItem value="borehole">Borehole</SelectItem>
                      <SelectItem value="canal">Canal</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              ) : null}

              <div className="space-y-1.5">
                <Label htmlFor="soil-notes">Anything you know about your soil? (optional)</Label>
                <Textarea
                  id="soil-notes"
                  value={soilNotes}
                  onChange={(e) => setSoilNotes(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="flex border-t border-[#e5e7eb] pt-4">
                <Button
                  variant="primary"
                  size="md"
                  className="w-full min-h-11 sm:ml-auto sm:w-auto"
                  onClick={() => {
                    if (validateStep1()) goToStep(2);
                  }}
                >
                  <span>Next: your crops</span>
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Button>
              </div>
            </div>
          ) : null}

          {/* STEP 2: CROPS (WITH HAUSA ALIASES + BEANS GUARDRAIL) & PLANTING TRIGGER */}
          {step === 2 ? (
            <div className="space-y-6 rounded-[12px] border border-[#e5e7eb] bg-white p-4 shadow-xs sm:p-6">
              {/* Crop Alias Search & Unresolved "Beans" Disambiguation Guardrail */}
              <div className="space-y-2 rounded-[10px] border border-[#e5e7eb] bg-[#fafafb] p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Label htmlFor="crop-search">Which crop? Search by English or Hausa name</Label>
                </div>
                <Input
                  id="crop-search"
                  value={cropSearch}
                  onChange={(e) => setCropSearch(e.target.value)}
                  placeholder="Search Dawa, Gero, Wake, Farar wake, Waken soya, Gyada, Masara..."
                />
                {fieldErrors.cropSearch ? (
                  <p className="text-xs text-[#b42318]">{fieldErrors.cropSearch}</p>
                ) : null}

                {isBeansAmbiguous ? (
                  <div
                    role="alert"
                    className="mt-2 flex items-start gap-3 rounded-[10px] border border-[#f5e0a3] bg-[#fdf6e2] p-3.5 text-xs text-[#8a5300]"
                  >
                    <AlertTriangle
                      className="mt-0.5 h-4 w-4 shrink-0 text-[#b45309]"
                      aria-hidden="true"
                    />
                    <div className="space-y-2">
                      <div className="font-semibold">Which bean do you mean?</div>
                      <p>
                        People use the word &ldquo;beans&rdquo; for a few different crops. Pick the
                        one you mean so we can give you the right advice:
                      </p>
                      <div className="flex flex-col gap-2 sm:flex-row">
                        <Button
                          type="button"
                          size="md"
                          variant="secondary"
                          className="w-full min-h-11 sm:w-auto"
                          onClick={() => {
                            setPlannedCrop('cowpea');
                            setCropSearch('Cowpea (Wake / Farar wake)');
                          }}
                        >
                          Cowpea (Wake / Farar wake)
                        </Button>
                        <Button
                          type="button"
                          size="md"
                          variant="secondary"
                          className="w-full min-h-11 sm:w-auto"
                          onClick={() => {
                            setPlannedCrop('soybean');
                            setCropSearch('Soybean (Waken soya)');
                          }}
                        >
                          Soybean (Waken soya)
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>

              {/* Crop Sequence Selectors */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                {farmerMode === 'existing' ? (
                  <>
                    <div className="space-y-1.5">
                      <Label htmlFor="prev-crop">What did you grow last season?</Label>
                      <Select
                        value={previousCrop}
                        onValueChange={(value) =>
                          setPreviousCrop(value === NO_CROP_VALUE ? '' : value)
                        }
                      >
                        <SelectTrigger id="prev-crop">
                          <SelectValue placeholder="Not recorded" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={NO_CROP_VALUE}>Not recorded</SelectItem>
                          {CATALOG_CROPS.map((c) => (
                            <SelectItem key={c.code} value={c.code}>
                              {formatCropWithHausa(c.code, true)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="curr-crop">What are you growing now?</Label>
                      <Select
                        value={currentCrop}
                        onValueChange={(value) => {
                          setCurrentCrop(value === NO_CROP_VALUE ? '' : value);
                          setFieldErrors((errors) => ({ ...errors, currentCrop: undefined }));
                        }}
                      >
                        <SelectTrigger id="curr-crop">
                          <SelectValue placeholder="Choose a crop" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={NO_CROP_VALUE}>Choose a crop</SelectItem>
                          {CATALOG_CROPS.map((c) => (
                            <SelectItem key={c.code} value={c.code}>
                              {formatCropWithHausa(c.code, true)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {fieldErrors.currentCrop ? (
                        <p className="text-xs text-[#b42318]">{fieldErrors.currentCrop}</p>
                      ) : null}
                    </div>
                  </>
                ) : null}

                <div className="space-y-1.5">
                  <Label htmlFor="plan-crop">Planned next crop</Label>
                  <Select
                    value={plannedCrop}
                    onValueChange={(value) => {
                      setPlannedCrop(value === NO_CROP_VALUE ? '' : value);
                      setFieldErrors((errors) => ({ ...errors, plannedCrop: undefined }));
                    }}
                  >
                    <SelectTrigger id="plan-crop">
                      <SelectValue placeholder="Choose a crop" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NO_CROP_VALUE}>Choose a crop</SelectItem>
                      {CATALOG_CROPS.map((c) => (
                        <SelectItem key={c.code} value={c.code}>
                          {formatCropWithHausa(c.code, true)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {fieldErrors.plannedCrop ? (
                    <p className="text-xs text-[#b42318]">{fieldErrors.plannedCrop}</p>
                  ) : null}
                </div>
              </div>

              {/* Planting Trigger Rule */}
              <div className="space-y-2">
                <Label>When will you plant?</Label>
                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                  <button
                    type="button"
                    onClick={() => setPlantingTriggerRule(null)}
                    className={`rounded-[10px] border p-3 text-left transition-all ${
                      plantingTriggerRule === null
                        ? 'border-[#0a4232] bg-[#eaf2ee] text-[#072f24]'
                        : 'border-[#e5e7eb] bg-[#fafafb] text-[#374151] hover:bg-white'
                    }`}
                  >
                    <div className="text-xs font-bold">Not sure yet</div>
                    <p className="mt-1 text-xs leading-snug text-[#4b5563]">
                      Skip this if you do not know yet.
                    </p>
                  </button>
                  {(
                    [
                      {
                        rule: 'wait_for_confirmed_moisture',
                        desc: 'Wait until the soil is properly wet before sowing.',
                      },
                      {
                        rule: 'plant_on_first_rains',
                        desc: 'Sow as soon as the rains really start.',
                      },
                      {
                        rule: 'prepare_and_plant_quickly',
                        desc: 'Prepare the land early and sow as soon as the soil is workable.',
                      },
                    ] as const
                  ).map((item) => {
                    const active = plantingTriggerRule === item.rule;
                    return (
                      <button
                        key={item.rule}
                        type="button"
                        onClick={() => setPlantingTriggerRule(item.rule)}
                        className={`rounded-[10px] border p-3 text-left transition-all ${
                          active
                            ? 'border-[#0a4232] bg-[#eaf2ee] text-[#072f24]'
                            : 'border-[#e5e7eb] bg-[#fafafb] text-[#374151] hover:bg-white'
                        }`}
                      >
                        <div className="text-xs font-bold">
                          {PLANTING_TRIGGER_TITLES[item.rule]?.en ?? item.rule}
                        </div>
                        <p className="mt-1 text-xs leading-snug text-[#4b5563]">{item.desc}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Farmer Goals */}
              <div className="space-y-2">
                <Label>What matters most to you?</Label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { id: 'improve_soil_fertility', label: 'Make the soil more fertile' },
                    { id: 'maturity_reliability', label: 'Harvest before the rains stop' },
                    { id: 'increase_income', label: 'Earn more money' },
                    { id: 'reduce_risk', label: 'Cope with dry spells' },
                    { id: 'conserve_water', label: 'Save water in the soil' },
                    { id: 'food_security', label: 'Feed my household' },
                    { id: 'less_work', label: 'Spend less on fertiliser and labour' },
                  ].map((goal) => {
                    const checked = selectedGoals.includes(goal.id);
                    return (
                      <button
                        key={goal.id}
                        type="button"
                        onClick={() => toggleGoal(goal.id)}
                        className={`inline-flex min-h-11 items-center rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                          checked
                            ? 'border-[#0a4232] bg-[#0a4232] text-white'
                            : 'border-[#e5e7eb] bg-[#f4f5f6] text-[#374151] hover:bg-white'
                        }`}
                      >
                        {goal.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex flex-col-reverse gap-3 border-t border-[#e5e7eb] pt-4 sm:flex-row sm:items-center sm:justify-between">
                <Button
                  variant="secondary"
                  size="md"
                  className="w-full min-h-11 sm:w-auto"
                  onClick={() => goToStep(1)}
                >
                  <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                  <span>Back</span>
                </Button>
                <Button
                  variant="primary"
                  size="md"
                  className="w-full min-h-11 sm:w-auto"
                  onClick={() => {
                    if (validateStep2()) goToStep(3);
                  }}
                >
                  <span>Next: your fields</span>
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Button>
              </div>
            </div>
          ) : null}

          {/* STEP 3: MULTI-PARCEL GEOMETRY (POLYGON OR GPS POINT WITH UNCERTAINTY) */}
          {step === 3 && !confirming ? (
            <div className="space-y-6 rounded-[12px] border border-[#e5e7eb] bg-white p-4 shadow-xs sm:p-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <h2 className="font-display text-lg font-bold text-[#111315]">
                    Your fields ({draftParcels.length})
                  </h2>
                  <p className="mt-0.5 text-xs leading-snug text-[#4b5563]">
                    Use the map below to mark each field. Draw its outline, or drop a pin for its
                    centre.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  size="md"
                  className="w-full min-h-11 sm:w-auto"
                  onClick={addDraftParcel}
                >
                  <Plus className="h-4 w-4" aria-hidden="true" />
                  <span>Add another field</span>
                </Button>
              </div>

              {/* Live Interactive Map for Boundary Capture */}
              <div className="space-y-3 rounded-[12px] border border-[#e5e7eb] bg-white p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <Crosshair className="h-4 w-4 shrink-0 text-[#0a4232]" />
                      <h3 className="font-display text-sm font-bold text-[#111315]">
                        Mark your field on the map
                      </h3>
                    </div>
                    <p className="mt-0.5 text-xs leading-snug text-[#4b5563]">
                      Editing {activeDraftParcel.name || 'your field'}. Use the map buttons to draw
                      its outline or drop a pin. It saves automatically.
                    </p>
                  </div>

                  {draftParcels.length > 1 ? (
                    <div className="flex w-full flex-col gap-1.5 sm:w-auto sm:flex-row sm:items-center">
                      <span className="text-xs font-semibold text-[#6b7280]">Editing:</span>
                      <Select value={activeDraftParcelId} onValueChange={setActiveDraftParcelId}>
                        <SelectTrigger
                          aria-label="Choose which field to edit on the map"
                          className="w-full min-h-11 sm:w-[180px]"
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {draftParcels.map((dp, i) => (
                            <SelectItem key={dp.id} value={dp.id}>
                              {dp.name || `Field ${i + 1}`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ) : null}
                </div>

                {/*
                 * The map toolbar owns the Select / Draw / Location mode. These
                 * flags only enable those tools and seed the initial mode; they
                 * must not be derived from geometryMethod, because the map sets
                 * that value back here and a changing prop would yank the map
                 * out of the tool the farmer is currently using.
                 */}
                <HonestyMapCanvas
                  parcels={mappedDraftParcels}
                  activeParcelId={activeDraftParcel.id}
                  selectedParcelId={activeDraftParcel.id}
                  captureMode
                  capturePoint={
                    activeDraftParcel.centerLon !== null && activeDraftParcel.centerLat !== null
                      ? { lon: activeDraftParcel.centerLon, lat: activeDraftParcel.centerLat }
                      : null
                  }
                  onCoordinateCapture={handleMapCoordinateCapture}
                  interactiveDraw
                  onGeometryChange={handleDrawnGeometry}
                  heightClass="h-[300px] sm:h-[380px] lg:h-[420px]"
                />

                <p className="pt-1 text-xs leading-snug text-[#6b7280]">
                  Use Draw on the map to trace your field, or Location to drop a pin. Changes save
                  automatically.
                </p>
              </div>

              <div className="space-y-4">
                {draftParcels.map((dp, idx) => {
                  const geom = hasValidGeometryDraft(dp) ? buildParcelGeometry(dp) : null;
                  const areaHa = computePolygonHa(dp);

                  return (
                    <div
                      key={dp.id}
                      onClick={() => setActiveDraftParcelId(dp.id)}
                      className={`rounded-[12px] border p-4 transition-colors ${
                        dp.id === activeDraftParcelId
                          ? 'border-[#0a4232] bg-[#eaf2ee]/40 ring-1 ring-[#0a4232]'
                          : 'border-[#e5e7eb] bg-[#fafafb] hover:bg-white'
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex min-w-0 items-center gap-3">
                          {geom ? (
                            <ParcelVectorThumbnail geometry={geom} size={44} active />
                          ) : (
                            <div
                              aria-hidden="true"
                              className="flex size-11 shrink-0 items-center justify-center rounded-lg border border-dashed border-[#d1d5db] text-xs text-[#6b7280]"
                            >
                              Map
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-[#111315]">
                              Field {idx + 1}: {dp.name || 'Unnamed field'}
                            </div>
                            <div className="tabular text-xs leading-snug text-[#072f24]">
                              {dp.geometryMethod === 'drawn_polygon'
                                ? areaHa !== null
                                  ? `Outline drawn · ${areaHa.toFixed(2)} ha`
                                  : 'Draw your field on the map to see its size'
                                : dp.locationUncertaintyM !== null
                                  ? `Pin placed · about ${dp.locationUncertaintyM} m off`
                                  : 'Drop a pin on the map to mark this field'}
                            </div>
                          </div>
                        </div>

                        {draftParcels.length > 1 ? (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                type="button"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  removeParcel(dp.id);
                                  if (activeDraftParcelId === dp.id) {
                                    const nextActive = draftParcels.find((p) => p.id !== dp.id);
                                    if (nextActive) setActiveDraftParcelId(nextActive.id);
                                  }
                                }}
                                className="flex min-h-11 min-w-11 items-center justify-center rounded p-1.5 text-[#6b7280] hover:bg-[#fdeceb] hover:text-[#b42318]"
                                aria-label={`Remove field ${idx + 1}`}
                              >
                                <Trash2 className="h-4 w-4" aria-hidden="true" />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent>Remove field</TooltipContent>
                          </Tooltip>
                        ) : null}
                      </div>

                      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div>
                          <Label htmlFor={`field-name-${idx}`}>Field name</Label>
                          <Input
                            id={`field-name-${idx}`}
                            value={dp.name}
                            onChange={(e) => updateParcel(dp.id, { name: e.target.value })}
                          />
                        </div>
                        {dp.geometryMethod === 'gps_point' ? (
                          <div>
                            <Label>How sure are you about this spot?</Label>
                            <SegmentedControl
                              fullWidth
                              className="[&_button]:min-h-11"
                              ariaLabel="How sure are you about this spot?"
                              value={String(dp.locationUncertaintyM ?? 250)}
                              onValueChange={(value) =>
                                updateParcel(dp.id, { locationUncertaintyM: Number(value) })
                              }
                              options={[
                                { value: '50', label: 'Small', shortLabel: 'Small' },
                                { value: '250', label: 'Medium', shortLabel: 'Medium' },
                                { value: '1000', label: 'Large', shortLabel: 'Large' },
                              ]}
                            />
                            <p className="mt-1 text-xs leading-snug text-[#6b7280]">
                              Small is about 50 m, medium about 250 m, large about 1,000 m.
                            </p>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>

              {statusAlert}

              <div className="flex flex-col-reverse gap-3 border-t border-[#e5e7eb] pt-4 sm:flex-row sm:items-center sm:justify-between">
                <Button
                  variant="secondary"
                  size="md"
                  className="w-full min-h-11 sm:w-auto"
                  onClick={() => goToStep(2)}
                >
                  <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                  <span>Back</span>
                </Button>
                <Button
                  variant="primary"
                  size="lg"
                  className="w-full min-h-11 sm:w-auto"
                  onClick={() => setConfirming(true)}
                >
                  <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                  <span>Review before saving</span>
                </Button>
              </div>
            </div>
          ) : null}

          {step === 3 && confirming ? (
            <div className="space-y-5 rounded-[12px] border border-[#e5e7eb] bg-white p-4 shadow-xs sm:p-6">
              <div>
                <Badge variant="Strong">Final check</Badge>
                <h2 className="mt-2 font-display text-lg font-bold text-[#111315]">
                  Check your farm before saving
                </h2>
                <p className="mt-1 text-xs leading-snug text-[#4b5563]">
                  Take a look. Nothing is saved until you tap save.
                </p>
              </div>
              <dl className="grid gap-3 rounded-[10px] border border-[#e5e7eb] bg-[#fafafb] p-4 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-xs font-semibold text-[#6b7280]">Farm name</dt>
                  <dd className="mt-0.5 text-[#111315]">{farmName || 'Not given'}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold text-[#6b7280]">Water supply</dt>
                  <dd className="mt-0.5 text-[#111315]">{waterSupplyLabel}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold text-[#6b7280]">Fields</dt>
                  <dd className="mt-0.5 text-[#111315]">{fieldSummary || 'None marked'}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold text-[#6b7280]">Crops</dt>
                  <dd className="mt-0.5 text-[#111315]">{cropSummary || 'None chosen'}</dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-xs font-semibold text-[#6b7280]">Planting trigger</dt>
                  <dd className="mt-0.5 text-[#111315]">{triggerLabel}</dd>
                </div>
              </dl>

              {statusAlert}

              <div className="flex flex-col-reverse gap-3 border-t border-[#e5e7eb] pt-4 sm:flex-row sm:items-center sm:justify-between">
                <Button
                  variant="secondary"
                  size="md"
                  className="w-full min-h-11 sm:w-auto"
                  onClick={() => setConfirming(false)}
                >
                  <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                  <span>Back to editing</span>
                </Button>
                <Button
                  variant="primary"
                  size="lg"
                  className="w-full min-h-11 sm:w-auto"
                  disabled={submitting}
                  onClick={() => void handleFinish()}
                >
                  <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                  <span>{submitting ? 'Saving your farm...' : 'Save my farm and fields'}</span>
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </TooltipProvider>
  );
}
