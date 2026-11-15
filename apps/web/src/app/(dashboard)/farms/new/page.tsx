'use client';

import { area } from '@turf/turf';
import { AlertTriangle, ArrowLeft, ArrowRight, CheckCircle2, Plus, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import * as React from 'react';
import { z } from 'zod';

import { ParcelVectorThumbnail } from '../../../../components/farms/parcel-vector-thumbnail';
import { Badge } from '../../../../components/ui/badge';
import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';
import { Label } from '../../../../components/ui/label';
import { SegmentedControl } from '../../../../components/ui/segmented-control';
import { Textarea } from '../../../../components/ui/textarea';
import { CATALOG_CROPS } from '../../../../features/cases/case-study-data';
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
  readonly widthDeg: number | null;
  readonly heightDeg: number | null;
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
  if (!hasValidCoordinates(draft)) return false;
  if (draft.geometryMethod === 'gps_point') return true;
  if (
    draft.widthDeg === null ||
    draft.heightDeg === null ||
    draft.widthDeg <= 0 ||
    draft.widthDeg > 0.01
  ) {
    return false;
  }

  const halfWidth = draft.widthDeg / 2;
  const halfHeight = draft.heightDeg / 2;
  return (
    draft.centerLon! - halfWidth >= -180 &&
    draft.centerLon! + halfWidth <= 180 &&
    draft.centerLat! - halfHeight >= -90 &&
    draft.centerLat! + halfHeight <= 90
  );
}

function parseOptionalNumber(value: string): number | null {
  if (!value.trim()) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function buildParcelGeometry(draft: DraftParcel) {
  if (!hasValidGeometryDraft(draft)) {
    throw new Error('Parcel location or geometry is invalid.');
  }
  const centerLon = draft.centerLon!;
  const centerLat = draft.centerLat!;
  if (draft.geometryMethod === 'gps_point') {
    return {
      type: 'Point' as const,
      coordinates: [centerLon, centerLat] as const,
    };
  }
  const halfW = draft.widthDeg! / 2;
  const halfH = draft.heightDeg! / 2;
  const minLon = Number((centerLon - halfW).toFixed(5));
  const maxLon = Number((centerLon + halfW).toFixed(5));
  const minLat = Number((centerLat - halfH).toFixed(5));
  const maxLat = Number((centerLat + halfH).toFixed(5));

  return {
    type: 'Polygon' as const,
    coordinates: [
      [
        [minLon, maxLat],
        [maxLon, maxLat],
        [maxLon, minLat],
        [minLon, minLat],
        [minLon, maxLat],
      ],
    ] as const,
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
  const [irrigationMethod, setIrrigationMethod] = React.useState<
    'rainfed' | 'borehole' | 'river' | 'canal' | 'other' | 'unknown'
  >('unknown');
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
      widthDeg: null,
      heightDeg: null,
      locationUncertaintyM: null,
    },
  ]);
  const [submitting, setSubmitting] = React.useState(false);
  const [statusMessage, setStatusMessage] = React.useState<string | null>(null);
  const [createdFarmId, setCreatedFarmId] = React.useState<string | null>(null);

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
        widthDeg: null,
        heightDeg: null,
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
    <div className="min-h-screen bg-[#f6f4ef] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Wizard Header & 3-Step Indicator */}
        <div className="rounded-[12px] border border-[#e5e7eb] bg-white p-6 shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <Badge variant="Strong">Parcel-First Onboarding (ADR-0011)</Badge>
              <h1 className="mt-1 font-display text-2xl font-bold tracking-tight text-[#111315]">
                Register Farm Holding &amp; Parcels
              </h1>
              <p className="text-xs text-[#4b5563] sm:text-sm">
                Supports multi-parcel holdings, drawn polygons, and GPS points with explicit
                location uncertainty radius.
              </p>
            </div>
            <div className="text-right text-xs font-semibold text-[#0b4f2f]">Step {step} of 3</div>
          </div>

          {/* Stepper Bar */}
          <div className="mt-5 grid grid-cols-3 gap-2">
            {[
              { num: 1 as const, title: '1. Holding & Farmer Mode' },
              { num: 2 as const, title: '2. Crops (Hausa) & Trigger' },
              { num: 3 as const, title: '3. Parcel Map / GPS Points' },
            ].map((item) => (
              <button
                key={item.num}
                type="button"
                onClick={() => setStep(item.num)}
                className={`rounded-[8px] border px-3 py-2 text-left text-xs font-semibold transition-colors ${
                  step === item.num
                    ? 'border-[#00b159] bg-[#ebfaef] text-[#0b4f2f]'
                    : step > item.num
                      ? 'border-[#b7ebc9] bg-white text-[#111315]'
                      : 'border-[#e5e7eb] bg-[#f4f5f6] text-[#6b7280]'
                }`}
              >
                {item.title}
              </button>
            ))}
          </div>
        </div>

        {/* STEP 1: FARMER MODE & HOLDING DETAILS */}
        {step === 1 ? (
          <div className="space-y-5 rounded-[12px] border border-[#e5e7eb] bg-white p-6 shadow-xs">
            <div className="space-y-2">
              <Label>Advisory Mode (D-09)</Label>
              <SegmentedControl
                fullWidth
                ariaLabel="Farmer advisory mode"
                value={farmerMode}
                onValueChange={setFarmerMode}
                options={[
                  {
                    value: 'existing',
                    label: 'Existing Farmer (Rotation & Planting Trigger)',
                  },
                  {
                    value: 'prospective',
                    label: 'Prospective Farmer (New Plot Crop Suitability)',
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
                  placeholder="e.g. Bello Yusuf Maitama Holding"
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
                    { value: 'mixed', label: 'Mixed Season' },
                    { value: 'irrigated', label: 'Irrigated' },
                    { value: 'unknown', label: 'Not sure' },
                  ]}
                />
              </div>
            </div>

            {farmingMethod === 'mixed' || farmingMethod === 'irrigated' ? (
              <div className="space-y-1.5">
                <Label htmlFor="irrigation-method">Water source</Label>
                <select
                  id="irrigation-method"
                  value={irrigationMethod}
                  onChange={(event) =>
                    setIrrigationMethod(
                      event.target.value as 'borehole' | 'river' | 'canal' | 'other' | 'unknown',
                    )
                  }
                  className="h-[42px] w-full rounded-[8px] border border-transparent bg-[#f4f5f6] px-3 text-sm text-[#111315] focus:border-[#00b159] focus:bg-white focus:outline-none"
                >
                  <option value="unknown">Not sure</option>
                  <option value="borehole">Borehole</option>
                  <option value="river">River</option>
                  <option value="canal">Canal</option>
                  <option value="other">Other</option>
                </select>
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
                  Search crop by English or Hausa name (try typing &ldquo;beans&rdquo; or
                  &ldquo;wake&rdquo;)
                </Label>
                <button
                  type="button"
                  onClick={() => setCropSearch('beans')}
                  className="text-xs font-semibold text-[#ab6a43] underline"
                >
                  Test &ldquo;beans&rdquo; ambiguity guardrail
                </button>
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
                      Clarification required (ADR-0011 D-08): Which legume do you mean by
                      &ldquo;beans&rdquo;?
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
                    <select
                      id="prev-crop"
                      value={previousCrop}
                      onChange={(e) => setPreviousCrop(e.target.value)}
                      className="h-[42px] w-full rounded-[8px] border border-transparent bg-[#f4f5f6] px-3 text-xs font-medium text-[#111315] focus:border-[#00b159] focus:bg-white focus:outline-none"
                    >
                      <option value="">Not recorded</option>
                      {CATALOG_CROPS.map((c) => (
                        <option key={c.code} value={c.code}>
                          {formatCropWithHausa(c.code, true)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="curr-crop">Current / recent crop</Label>
                    <select
                      id="curr-crop"
                      value={currentCrop}
                      onChange={(e) => setCurrentCrop(e.target.value)}
                      className="h-[42px] w-full rounded-[8px] border border-transparent bg-[#f4f5f6] px-3 text-xs font-medium text-[#111315] focus:border-[#00b159] focus:bg-white focus:outline-none"
                    >
                      <option value="">Choose a crop</option>
                      {CATALOG_CROPS.map((c) => (
                        <option key={c.code} value={c.code}>
                          {formatCropWithHausa(c.code, true)}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              ) : null}

              <div className="space-y-1.5">
                <Label htmlFor="plan-crop">Planned next crop (Candidate)</Label>
                <select
                  id="plan-crop"
                  value={plannedCrop}
                  onChange={(e) => setPlannedCrop(e.target.value)}
                  className="h-[42px] w-full rounded-[8px] border border-transparent bg-[#f4f5f6] px-3 text-xs font-medium text-[#111315] focus:border-[#00b159] focus:bg-white focus:outline-none"
                >
                  <option value="">Choose a crop</option>
                  {CATALOG_CROPS.map((c) => (
                    <option key={c.code} value={c.code}>
                      {formatCropWithHausa(c.code, true)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Planting Trigger Rule (D-10) */}
            <div className="space-y-2">
              <Label>Your stated planting trigger rule (Moisture-conditioned, D-10)</Label>
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
                      desc: 'Wait until cumulative rainfall and root-zone soil moisture are established (Bello Yusuf Maitama rule).',
                    },
                    {
                      rule: 'plant_on_first_rains',
                      desc: 'Sow immediately on the first rains to maximise growing season length (Amina Habibu rule).',
                    },
                    {
                      rule: 'prepare_and_plant_quickly',
                      desc: 'Clear and ridge plots early, then sow as soon as top-soil moisture is workable (Abubakar rule).',
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
                  { id: 'drought_tolerance', label: 'Dry-Spell Tolerance' },
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
                  Enter the farmer&apos;s coordinates. GPS points need an uncertainty radius.
                  Polygon mode creates a rectangle from the centre and span below, not a traced
                  boundary.
                </p>
              </div>
              <Button type="button" variant="secondary" size="sm" onClick={addDraftParcel}>
                <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Add Another Parcel</span>
              </Button>
            </div>

            <div className="space-y-4">
              {draftParcels.map((dp, idx) => {
                const geom = hasValidGeometryDraft(dp) ? buildParcelGeometry(dp) : null;
                const areaHa = computePolygonHa(dp);

                return (
                  <div
                    key={dp.id}
                    className="rounded-[12px] border border-[#e5e7eb] bg-[#fafafb] p-4"
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
                                ? `Approximate rectangle preview: ${areaHa.toFixed(2)} ha`
                                : 'Enter centre and span to preview'
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
                            updateParcel(dp.id, { geometryMethod: method })
                          }
                          options={[
                            { value: 'drawn_polygon', label: 'Drawn Polygon' },
                            { value: 'gps_point', label: 'Single GPS Point' },
                          ]}
                        />
                        {draftParcels.length > 1 ? (
                          <button
                            type="button"
                            onClick={() => removeParcel(dp.id)}
                            className="rounded p-1.5 text-[#6b7280] hover:bg-[#fdeceb] hover:text-[#b42318]"
                            title="Remove parcel"
                          >
                            <Trash2 className="h-4 w-4" aria-hidden="true" />
                          </button>
                        ) : null}
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-4">
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
                            updateParcel(dp.id, { centerLon: parseOptionalNumber(e.target.value) })
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
                            updateParcel(dp.id, { centerLat: parseOptionalNumber(e.target.value) })
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
                          <Label>Rectangle Span (°)</Label>
                          <Input
                            type="number"
                            step="0.0002"
                            min={0.0001}
                            max={0.01}
                            value={dp.widthDeg ?? ''}
                            placeholder="e.g. 0.001"
                            onChange={(e) => {
                              const val = parseOptionalNumber(e.target.value);
                              updateParcel(dp.id, {
                                widthDeg: val,
                                heightDeg: val === null ? null : val * 0.85,
                              });
                            }}
                          />
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
                {statusMessage}
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
  );
}
