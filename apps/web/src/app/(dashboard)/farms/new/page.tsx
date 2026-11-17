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

function parseOptionalNumber(value: string): number | null {
  if (!value.trim()) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
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
      name: 'Parcel 1',
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
    if (targetParcel?.geometryMethod !== 'gps_point') return;

    updateParcel(targetId, {
      centerLon: lon,
      centerLat: lat,
      locationUncertaintyM: targetParcel.locationUncertaintyM ?? 250,
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
    updateParcel(targetId, {
      geometry,
      centerLon: Number(Number(center.geometry.coordinates[0]).toFixed(5)),
      centerLat: Number(Number(center.geometry.coordinates[1]).toFixed(5)),
      locationUncertaintyM: null,
    });
  };

  const isBeansAmbiguous =
    cropSearch.trim().toLowerCase() === 'beans' || cropSearch.trim().toLowerCase() === 'bean';

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
        name: `Parcel ${nextIndex}`,
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
    if (!farmName.trim()) {
      setStatusMessage('Enter the holding name before saving.');
      return;
    }
    if (isBeansAmbiguous) {
      setStatusMessage('Choose a specific crop instead of the unresolved name “beans”.');
      return;
    }
    if (farmerMode === 'existing' ? !currentCrop || !plannedCrop : !plannedCrop) {
      setStatusMessage(
        farmerMode === 'existing'
          ? 'Choose the current and planned crops, or change to prospective farmer mode.'
          : 'Choose the planned crop before saving.',
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
        'Enter each parcel name and a valid location. GPS points also need an uncertainty radius from 1 to 5,000 metres.',
      );
      return;
    }

    setSubmitting(true);
    let farmId: string | null = null;
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

      const { crops } = await requestApi('/api/catalog/crops', cropCatalogSchema, {
        method: 'GET',
        cache: 'no-store',
      });
      const cropIds = new Map(crops.map((crop) => [crop.code, crop.id]));
      const parcelIds: string[] = [];

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
      setStatusMessage(
        farmId
          ? `${message} The holding was created, but some details may still need to be saved.`
          : message,
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-[#f6f4ef] px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl space-y-6">
          {/* Wizard Header & 3-Step Indicator */}
          <div className="rounded-[12px] border border-[#e5e7eb] bg-white p-6 shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <Badge variant="Strong">Parcel Registration</Badge>
                <h1 className="mt-1 font-display text-2xl font-bold tracking-tight text-[#111315]">
                  Register Farm Holding &amp; Parcels
                </h1>
                <p className="text-xs text-[#4b5563] sm:text-sm">
                  Supports multi-parcel holdings, drawn polygons, and GPS points with explicit
                  location uncertainty radius.
                </p>
              </div>
              <div className="text-right text-xs font-semibold text-[#0b4f2f]">
                Step {step} of 3
              </div>
            </div>

            {/* Stepper Bar */}
            <div className="mt-5 grid grid-cols-3 gap-1.5 sm:gap-2">
              {[
                { num: 1 as const, title: '1. Holding & Advisory Focus', short: '1. Holding' },
                { num: 2 as const, title: '2. Crops (Hausa) & Trigger', short: '2. Crops' },
                { num: 3 as const, title: '3. Parcel Map / GPS Points', short: '3. Parcels' },
              ].map((item) => (
                <button
                  key={item.num}
                  type="button"
                  onClick={() => setStep(item.num)}
                  className={`rounded-[8px] border px-2 sm:px-3 py-2 text-left text-xs font-semibold transition-colors ${
                    step === item.num
                      ? 'border-[#00b159] bg-[#ebfaef] text-[#0b4f2f]'
                      : step > item.num
                        ? 'border-[#b7ebc9] bg-white text-[#111315]'
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
            <div className="space-y-5 rounded-[12px] border border-[#e5e7eb] bg-white p-6 shadow-xs">
              <div className="space-y-2">
                <Label>Advisory Focus</Label>
                <SegmentedControl
                  fullWidth
                  stackOnMobile
                  ariaLabel="Advisory focus"
                  value={farmerMode}
                  onValueChange={setFarmerMode}
                  options={[
                    {
                      value: 'existing',
                      label: 'Existing Farm (Rotation & Moisture Trigger)',
                      shortLabel: 'Existing Farm (Rotation & Moisture)',
                    },
                    {
                      value: 'prospective',
                      label: 'Prospective Land (Crop Suitability Screening)',
                      shortLabel: 'Prospective Land (Suitability)',
                    },
                  ]}
                />
                <p className="text-xs text-[#6b7280]">
                  {farmerMode === 'existing'
                    ? 'Compares your current crop sequence against 2 evidence-supported rotation alternatives and evaluates your moisture-conditioned planting trigger.'
                    : 'Evaluates all 6 catalog crops against your parcel soil pH, rainfall climatology, and management priorities to produce a ranked shortlist.'}
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="farm-name">Holding name</Label>
                  <Input
                    id="farm-name"
                    value={farmName}
                    onChange={(e) => setFarmName(e.target.value)}
                    placeholder="e.g. Riverside Rainfed Holding"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label>Water supply regime</Label>
                  <SegmentedControl
                    fullWidth
                    size="sm"
                    ariaLabel="Farming water supply regime"
                    value={farmingMethod}
                    onValueChange={(val) => {
                      setFarmingMethod(val);
                      if (val === 'rainfed') setIrrigationMethod('rainfed');
                      else if (irrigationMethod === 'rainfed') setIrrigationMethod('unknown');
                    }}
                    options={[
                      { value: 'rainfed', label: 'Rainfed' },
                      { value: 'mixed', label: 'Mixed Season', shortLabel: 'Mixed' },
                      { value: 'irrigated', label: 'Irrigated' },
                      { value: 'unknown', label: 'Not sure' },
                    ]}
                  />
                </div>
              </div>

              {farmingMethod === 'mixed' || farmingMethod === 'irrigated' ? (
                <div className="space-y-1.5">
                  <Label htmlFor="irrigation-method">Water source</Label>
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
                <Label htmlFor="soil-notes">
                  Farmer observations on soil &amp; fertility (optional ground truth)
                </Label>
                <Textarea
                  id="soil-notes"
                  value={soilNotes}
                  onChange={(e) => setSoilNotes(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="flex justify-end border-t border-[#e5e7eb] pt-4">
                <Button variant="primary" size="md" onClick={() => setStep(2)}>
                  <span>Continue to Crops &amp; Planting Trigger</span>
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Button>
              </div>
            </div>
          ) : null}

          {/* STEP 2: CROPS (WITH HAUSA ALIASES + BEANS GUARDRAIL) & PLANTING TRIGGER */}
          {step === 2 ? (
            <div className="space-y-6 rounded-[12px] border border-[#e5e7eb] bg-white p-6 shadow-xs">
              {/* Crop Alias Search & Unresolved "Beans" Disambiguation Guardrail */}
              <div className="space-y-2 rounded-[10px] border border-[#e5e7eb] bg-[#fafafb] p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Label htmlFor="crop-search">
                    Search crop by English or Hausa name (the term &ldquo;beans&rdquo; needs
                    clarification)
                  </Label>
                </div>
                <Input
                  id="crop-search"
                  value={cropSearch}
                  onChange={(e) => setCropSearch(e.target.value)}
                  placeholder="Search Dawa, Gero, Wake, Farar wake, Waken soya, Gyada, Masara..."
                />

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
                      <div className="font-semibold">
                        Clarification required: Which legume do you mean by &ldquo;beans&rdquo;?
                      </div>
                      <p>
                        In Kano State field interviews, English translations often render three
                        distinct crops as &ldquo;beans&rdquo;. Please select the specific crop below
                        so nitrogen fixation and water thresholds are accurate:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          onClick={() => {
                            setPlannedCrop('cowpea');
                            setCropSearch('Cowpea (Wake / Farar wake)');
                          }}
                        >
                          Select Cowpea / White Cowpea (Wake / Farar wake)
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          onClick={() => {
                            setPlannedCrop('soybean');
                            setCropSearch('Soybean (Waken soya)');
                          }}
                        >
                          Select Soybean (Waken soya)
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
                      <Label htmlFor="prev-crop">Last season crop (Previous)</Label>
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
                      <Label htmlFor="curr-crop">Current / recent crop</Label>
                      <Select
                        value={currentCrop}
                        onValueChange={(value) =>
                          setCurrentCrop(value === NO_CROP_VALUE ? '' : value)
                        }
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
                    </div>
                  </>
                ) : null}

                <div className="space-y-1.5">
                  <Label htmlFor="plan-crop">Planned next crop (Candidate)</Label>
                  <Select
                    value={plannedCrop}
                    onValueChange={(value) => setPlannedCrop(value === NO_CROP_VALUE ? '' : value)}
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
                </div>
              </div>

              {/* Planting Trigger Rule */}
              <div className="space-y-2">
                <Label>Your stated planting trigger rule (Moisture-conditioned)</Label>
                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                  <button
                    type="button"
                    onClick={() => setPlantingTriggerRule(null)}
                    className={`rounded-[10px] border p-3 text-left transition-all ${
                      plantingTriggerRule === null
                        ? 'border-[#00b159] bg-[#ebfaef] text-[#0b4f2f]'
                        : 'border-[#e5e7eb] bg-[#fafafb] text-[#374151] hover:bg-white'
                    }`}
                  >
                    <div className="text-xs font-bold">Not recorded yet</div>
                    <p className="mt-1 text-[11px] leading-snug text-[#4b5563]">
                      Leave this blank if the farmer has not stated a planting rule.
                    </p>
                  </button>
                  {(
                    [
                      {
                        rule: 'wait_for_confirmed_moisture',
                        desc: 'Wait until cumulative rainfall and root-zone soil moisture are established before sowing.',
                      },
                      {
                        rule: 'plant_on_first_rains',
                        desc: 'Sow immediately on the first sustained rains to maximise growing season length.',
                      },
                      {
                        rule: 'prepare_and_plant_quickly',
                        desc: 'Clear and ridge plots early, then sow as soon as top-soil moisture is workable.',
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
                            ? 'border-[#00b159] bg-[#ebfaef] text-[#0b4f2f]'
                            : 'border-[#e5e7eb] bg-[#fafafb] text-[#374151] hover:bg-white'
                        }`}
                      >
                        <div className="text-xs font-bold">
                          {PLANTING_TRIGGER_TITLES[item.rule]?.en ?? item.rule}
                        </div>
                        <p className="mt-1 text-[11px] leading-snug text-[#4b5563]">{item.desc}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Farmer Goals */}
              <div className="space-y-2">
                <Label>Management priorities</Label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { id: 'improve_soil_fertility', label: 'Restore Soil Fertility (Legume N)' },
                    { id: 'maturity_reliability', label: 'Reliable Harvest Before Rains End' },
                    { id: 'increase_income', label: 'Market Value & Cash Return' },
                    { id: 'reduce_risk', label: 'Dry-Spell Tolerance & Risk Reduction' },
                    { id: 'conserve_water', label: 'Conserve Soil Moisture & Water' },
                    { id: 'food_security', label: 'Household Food Security' },
                    { id: 'less_work', label: 'Lower Fertiliser & Labour Outlay' },
                  ].map((goal) => {
                    const checked = selectedGoals.includes(goal.id);
                    return (
                      <button
                        key={goal.id}
                        type="button"
                        onClick={() => toggleGoal(goal.id)}
                        className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                          checked
                            ? 'border-[#00b159] bg-[#00b159] text-white'
                            : 'border-[#e5e7eb] bg-[#f4f5f6] text-[#374151] hover:bg-white'
                        }`}
                      >
                        {goal.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-[#e5e7eb] pt-4">
                <Button variant="secondary" size="md" onClick={() => setStep(1)}>
                  <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                  <span>Back</span>
                </Button>
                <Button variant="primary" size="md" onClick={() => setStep(3)}>
                  <span>Continue to Parcel Geometry</span>
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Button>
              </div>
            </div>
          ) : null}

          {/* STEP 3: MULTI-PARCEL GEOMETRY (POLYGON OR GPS POINT WITH UNCERTAINTY) */}
          {step === 3 ? (
            <div className="space-y-6 rounded-[12px] border border-[#e5e7eb] bg-white p-6 shadow-xs">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="font-display text-lg font-bold text-[#111315]">
                    Parcels{farmName.trim() ? ` in ${farmName}` : ''} ({draftParcels.length})
                  </h2>
                  <p className="text-xs text-[#4b5563]">
                    Capture coordinates on the interactive map or enter them below. GPS points need
                    an uncertainty radius. Polygon mode draws the real field boundary on the map.
                  </p>
                </div>
                <Button type="button" variant="secondary" size="sm" onClick={addDraftParcel}>
                  <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Add Another Parcel</span>
                </Button>
              </div>

              {/* Live Interactive Map for Boundary Capture */}
              <div className="space-y-3 rounded-[12px] border border-[#e5e7eb] bg-white p-4">
                <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                  <div>
                    <div className="flex items-center gap-2">
                      <Crosshair className="h-4 w-4 text-[#00b159]" />
                      <h3 className="font-display text-sm font-bold text-[#111315]">
                        Capture Land Parcel on Map · {activeDraftParcel.name}
                      </h3>
                    </div>
                    <p className="mt-0.5 text-xs text-[#4b5563]">
                      Click anywhere on the satellite map to position this parcel. The coordinates
                      will sync automatically.
                    </p>
                  </div>

                  {draftParcels.length > 1 ? (
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] font-semibold text-[#6b7280]">Target:</span>
                      <Select value={activeDraftParcelId} onValueChange={setActiveDraftParcelId}>
                        <SelectTrigger aria-label="Select active parcel for map capture">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {draftParcels.map((dp, i) => (
                            <SelectItem key={dp.id} value={dp.id}>
                              {dp.name || `Parcel ${i + 1}`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ) : null}
                </div>

                <HonestyMapCanvas
                  parcels={mappedDraftParcels}
                  captureMode={activeDraftParcel.geometryMethod === 'gps_point'}
                  capturePoint={
                    activeDraftParcel.centerLon !== null && activeDraftParcel.centerLat !== null
                      ? { lon: activeDraftParcel.centerLon, lat: activeDraftParcel.centerLat }
                      : null
                  }
                  onCoordinateCapture={handleMapCoordinateCapture}
                  interactiveDraw={activeDraftParcel.geometryMethod === 'drawn_polygon'}
                  onGeometryChange={handleDrawnGeometry}
                  heightClass="h-[300px] sm:h-[380px] lg:h-[420px]"
                />

                <p className="pt-1 text-xs text-[#6b7280]">
                  {activeDraftParcel.geometryMethod === 'drawn_polygon'
                    ? 'Polygon mode: click points around the boundary on the map, then click the first point (or press Enter) to finish. The exact drawn shape is saved.'
                    : 'Point mode: click the map or use your GPS to place a parcel centre, then enter its accuracy radius below.'}
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
                          ? 'border-[#00b159] bg-[#ebfaef]/40 ring-1 ring-[#00b159]'
                          : 'border-[#e5e7eb] bg-[#fafafb] hover:bg-white'
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          {geom ? (
                            <ParcelVectorThumbnail geometry={geom} size={44} active />
                          ) : (
                            <div
                              aria-hidden="true"
                              className="flex size-11 items-center justify-center rounded-lg border border-dashed border-[#d1d5db] text-xs text-[#6b7280]"
                            >
                              Map
                            </div>
                          )}
                          <div>
                            <div className="text-xs font-bold text-[#111315]">
                              Parcel {idx + 1}: {dp.name}
                            </div>
                            <div className="tabular text-[11px] text-[#0b4f2f]">
                              {dp.geometryMethod === 'drawn_polygon'
                                ? areaHa !== null
                                  ? `Drawn polygon · ${areaHa.toFixed(2)} ha`
                                  : 'Draw the boundary on the map to preview its area'
                                : dp.locationUncertaintyM !== null
                                  ? `GPS point · Uncertainty ±${dp.locationUncertaintyM} m`
                                  : 'Enter a GPS point and its uncertainty'}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <SegmentedControl
                            size="sm"
                            ariaLabel={`Geometry method for ${dp.name}`}
                            value={dp.geometryMethod}
                            onValueChange={(method) =>
                              updateParcel(dp.id, {
                                geometryMethod: method,
                                geometry: null,
                                centerLon: null,
                                centerLat: null,
                                locationUncertaintyM: null,
                              })
                            }
                            options={[
                              {
                                value: 'drawn_polygon',
                                label: 'Drawn Polygon',
                                shortLabel: 'Polygon',
                              },
                              {
                                value: 'gps_point',
                                label: 'Single GPS Point',
                                shortLabel: 'GPS Point',
                              },
                            ]}
                          />
                          {draftParcels.length > 1 ? (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button
                                  type="button"
                                  onClick={() => removeParcel(dp.id)}
                                  className="rounded p-1.5 text-[#6b7280] hover:bg-[#fdeceb] hover:text-[#b42318]"
                                  aria-label="Remove parcel"
                                >
                                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                                </button>
                              </TooltipTrigger>
                              <TooltipContent>Remove parcel</TooltipContent>
                            </Tooltip>
                          ) : null}
                        </div>
                      </div>

                      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        <div>
                          <Label>Parcel name</Label>
                          <Input
                            value={dp.name}
                            onChange={(e) => updateParcel(dp.id, { name: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label>Longitude (°E)</Label>
                          <Input
                            type="number"
                            step="0.001"
                            min={-180}
                            max={180}
                            value={dp.centerLon ?? ''}
                            onChange={(e) =>
                              updateParcel(dp.id, {
                                centerLon: parseOptionalNumber(e.target.value),
                              })
                            }
                          />
                        </div>
                        <div>
                          <Label>Latitude (°N)</Label>
                          <Input
                            type="number"
                            step="0.001"
                            min={-90}
                            max={90}
                            value={dp.centerLat ?? ''}
                            onChange={(e) =>
                              updateParcel(dp.id, {
                                centerLat: parseOptionalNumber(e.target.value),
                              })
                            }
                          />
                        </div>
                        {dp.geometryMethod === 'gps_point' ? (
                          <div>
                            <Label>GPS Uncertainty Radius (m)</Label>
                            <Input
                              type="number"
                              min={1}
                              max={5000}
                              value={dp.locationUncertaintyM ?? ''}
                              onChange={(e) =>
                                updateParcel(dp.id, {
                                  locationUncertaintyM: parseOptionalNumber(e.target.value),
                                })
                              }
                            />
                          </div>
                        ) : (
                          <div>
                            <Label>Drawn boundary</Label>
                            <div className="flex items-center gap-2">
                              <span className="flex h-[42px] flex-1 items-center rounded-[10px] border border-[#e5e7eb] bg-[#fafafb] px-3 text-xs text-[#4b5563]">
                                {dp.geometry?.type === 'Polygon'
                                  ? `${dp.geometry.coordinates[0]?.length ?? 0} boundary points`
                                  : 'Not drawn yet'}
                              </span>
                              <Button
                                type="button"
                                variant="secondary"
                                size="sm"
                                onClick={() => updateParcel(dp.id, { geometry: null })}
                                disabled={!dp.geometry}
                              >
                                Clear
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {statusMessage ? (
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
                      Sign in to save holding
                    </Link>
                  ) : null}
                  {createdFarmId ? (
                    <Link
                      href={`/farms/${createdFarmId}`}
                      className="ml-1 underline underline-offset-2"
                    >
                      Open the saved holding.
                    </Link>
                  ) : null}
                </div>
              ) : null}

              <div className="flex items-center justify-between border-t border-[#e5e7eb] pt-4">
                <Button variant="secondary" size="md" onClick={() => setStep(2)}>
                  <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                  <span>Back</span>
                </Button>
                <Button variant="primary" size="lg" disabled={submitting} onClick={handleFinish}>
                  <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                  <span>
                    {submitting
                      ? 'Generating Parcel Guidance...'
                      : 'Save Holding & Run Deterministic Engine'}
                  </span>
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </TooltipProvider>
  );
}
