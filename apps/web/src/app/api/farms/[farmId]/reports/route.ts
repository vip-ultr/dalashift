import {
  FARMER_GOALS,
  FARMING_METHODS,
  GEOMETRY_METHODS,
  IRRIGATION_METHODS,
  PLANTING_TRIGGERS,
  RULE_SOURCE_TYPES,
  SEASONS,
  type FarmerGoal,
  type FarmingMethod,
  type GeometryMethod,
  type IntendedUse,
  type IrrigationMethod,
  type PlantingTrigger,
  type Season,
} from '@dalashift/shared/constants';
import type {
  Farm,
  FarmCrop,
  FarmerPriorities,
  ProvenancedValue,
  RotationRule,
} from '@dalashift/shared/types';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import { assessSeasonalOutlook } from '../../../../../features/outlook/assess-seasonal-outlook';
import { assessPlantingTrigger } from '../../../../../features/recommendations/engine/assess-planting-trigger';
import {
  DEFAULT_RULESET_VERSION,
  mapDatabaseCropRowToCatalogRecord,
  type CatalogCropRecord,
} from '../../../../../features/recommendations/engine/build-crop-inputs';
import {
  buildAndCompareRotationStrategies,
  type FarmerCropHistoryEntry,
} from '../../../../../features/recommendations/engine/build-rotation-strategies';
import { compareProspectiveSuitability } from '../../../../../features/recommendations/engine/compare-suitability';
import {
  buildFarmReportPayload,
  type ReportKind,
  type ReportParcelInput,
} from '../../../../../features/reports/build-farm-report';
import { requireFarmOwnership } from '../../../../../lib/auth/farm-access';
import { getAuthenticatedClient, hasSameOrigin } from '../../../../../lib/supabase/server';
import {
  createReportSignedUrl,
  uploadFarmReportArtifact,
} from '../../../../../lib/supabase/storage';

interface RouteContext {
  readonly params: Promise<{ farmId: string }>;
}

const farmIdSchema = z.string().uuid();

const reportRequestSchema = z
  .object({
    kind: z
      .preprocess(
        (v) => {
          if (typeof v !== 'string' || !v.trim()) return 'farm_summary';
          const clean = v.trim().toLowerCase();
          if (clean === 'summary') return 'farm_summary';
          if (clean === 'rotation') return 'rotation_plan';
          return clean;
        },
        z.enum(['farm_summary', 'seasonal', 'rotation_plan']),
      )
      .default('farm_summary'),
    parcelId: z.preprocess(
      (v) => (typeof v === 'string' && v.trim() ? v.trim() : null),
      z.string().uuid().nullable().optional(),
    ),
    periodStart: z.preprocess(
      (v) => (typeof v === 'string' && v.trim() ? v.trim() : null),
      z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/)
        .nullable()
        .optional(),
    ),
    periodEnd: z.preprocess(
      (v) => (typeof v === 'string' && v.trim() ? v.trim() : null),
      z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/)
        .nullable()
        .optional(),
    ),
  })
  .refine(
    (val) =>
      !val.periodStart || !val.periodEnd || val.periodStart.localeCompare(val.periodEnd) <= 0,
    {
      message: 'periodStart must not be after periodEnd',
      path: ['periodStart'],
    },
  );

/**
 * List generated farm reports for a farm owned by the authenticated farmer.
 */
export async function GET(_request: Request, { params }: RouteContext) {
  const { farmId } = await params;
  if (!farmIdSchema.safeParse(farmId).success) {
    return NextResponse.json({ error: 'Farm id is invalid.' }, { status: 400 });
  }

  const authContext = await getAuthenticatedClient();
  if (!authContext) {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  }
  const ownership = await requireFarmOwnership(authContext, farmId);
  if (!ownership.ok) {
    return NextResponse.json({ error: ownership.error }, { status: ownership.status });
  }
  const { supabase } = authContext;

  const { data: reports, error } = await supabase
    .from('reports')
    .select(
      'id, farm_id, parcel_id, kind, period_start, period_end, params, payload, storage_path, generated_at',
    )
    .eq('farm_id', farmId)
    .order('generated_at', { ascending: false })
    .limit(25);

  if (error) {
    console.error('Failed to read farm reports', error);
    return NextResponse.json({ error: 'Unable to load farm reports.' }, { status: 500 });
  }

  const enrichedReports = await Promise.all(
    (reports ?? []).map(async (item) => {
      const signedUrl = await createReportSignedUrl({
        supabase,
        storagePath: (item.storage_path as string | null) ?? null,
      });
      return {
        ...item,
        signed_url: signedUrl,
      };
    }),
  );

  return NextResponse.json({ reports: enrichedReports });
}

/**
 * Generate and store a printable farm report (FR-6 & ADR-0011 D-12) with
 * redacted coordinates and complete source attributions.
 */
export async function POST(request: Request, { params }: RouteContext) {
  const { farmId } = await params;
  if (!farmIdSchema.safeParse(farmId).success) {
    return NextResponse.json({ error: 'Farm id is invalid.' }, { status: 400 });
  }
  if (!hasSameOrigin(request)) {
    return NextResponse.json({ error: 'Request origin is not allowed.' }, { status: 403 });
  }

  const authContext = await getAuthenticatedClient();
  if (!authContext) {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  }
  // Ownership is checked before any farm-scoped data is read, and the farm row
  // is reused below instead of fetching it a second time.
  const ownership = await requireFarmOwnership(
    authContext,
    farmId,
    'id, farmer_id, name, farming_method, irrigation_method, soil_notes',
  );
  if (!ownership.ok) {
    return NextResponse.json({ error: ownership.error }, { status: ownership.status });
  }
  const farmRow = ownership.farm;
  const { supabase, user } = authContext;

  let body: unknown = {};
  try {
    const rawText = await request.text();
    if (rawText.trim().length > 0) {
      body = JSON.parse(rawText);
    }
  } catch {
    return NextResponse.json({ error: 'Request body must be valid JSON.' }, { status: 400 });
  }

  const parsed = reportRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Report request is invalid.', issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const [parcelsRes, cropsRes, rulesRes, farmCropsRes, prioritiesRes] = await Promise.all([
    supabase
      .from('parcels_public')
      .select(
        'id, farm_id, name, area_ha, geometry_method, location_uncertainty_m, geometry_geojson, centroid_geojson',
      )
      .eq('farm_id', farmId)
      .order('created_at', { ascending: true }),
    supabase
      .from('crops')
      .select(
        'id, code, name, scientific_name, category, growing_period_days, agronomic_requirements, rotation_traits, fertiliser, source_citations',
      )
      .order('name', { ascending: true }),
    supabase
      .from('rotation_rules')
      .select(
        'id, statement, source_type, attributed_to, source_url, accessed_on, applies_to, follows, mechanism',
      )
      .order('id', { ascending: true }),
    supabase
      .from('farm_crops')
      .select(
        'id, farm_id, parcel_id, crop_id, status, planting_date, expected_harvest_date, harvest_date, season, intended_use, area_ha, notes, crops(code)',
      )
      .eq('farm_id', farmId)
      .order('created_at', { ascending: true }),
    supabase
      .from('farm_priorities')
      .select('farm_id, goals, risk_tolerance, open_to_change, planting_trigger, notes')
      .eq('farm_id', farmId)
      .maybeSingle(),
  ]);

  const farmingMethod: FarmingMethod = (FARMING_METHODS as readonly string[]).includes(
    String(farmRow.farming_method),
  )
    ? (farmRow.farming_method as FarmingMethod)
    : 'unknown';
  const irrigationMethod: IrrigationMethod = (IRRIGATION_METHODS as readonly string[]).includes(
    String(farmRow.irrigation_method),
  )
    ? (farmRow.irrigation_method as IrrigationMethod)
    : 'unknown';

  const farm: Farm = {
    id: String(farmRow.id),
    farmerId: String(farmRow.farmer_id),
    name: String(farmRow.name),
    farmingMethod,
    irrigationMethod,
    soilNotes: (farmRow.soil_notes as string | null) ?? null,
  };

  const parcels: ReportParcelInput[] = (parcelsRes.data ?? []).map((row) => {
    const geometryMethod: GeometryMethod = (GEOMETRY_METHODS as readonly string[]).includes(
      String(row.geometry_method),
    )
      ? (row.geometry_method as GeometryMethod)
      : 'gps_point';
    return {
      id: String(row.id),
      name: String(row.name),
      areaHa: Number(row.area_ha ?? 0),
      locationUncertaintyM:
        row.location_uncertainty_m !== null && row.location_uncertainty_m !== undefined
          ? Number(row.location_uncertainty_m)
          : null,
      geometryMethod,
    };
  });

  const targetParcel =
    (parsed.data.parcelId ? parcels.find((p) => p.id === parsed.data.parcelId) : parcels[0]) ??
    null;

  let observations: ProvenancedValue[] = [];
  if (targetParcel) {
    const { data: storedObs } = await supabase
      .from('environmental_observations')
      .select(
        'variable, value, unit, source_key, spatial_resolution_m, temporal_resolution, observed_at, retrieved_at, is_modelled, aggregation_method, quality_flag, coverage_fraction, raw_metadata',
      )
      .eq('parcel_id', targetParcel.id)
      .order('observed_at', { ascending: true })
      .limit(1000);

    observations = (storedObs ?? []).map((row) => ({
      variable: String(row.variable),
      value: row.value !== null && row.value !== undefined ? Number(row.value) : null,
      unit: String(row.unit),
      sourceId: String(row.source_key),
      spatialResolutionM: Number(row.spatial_resolution_m),
      temporalResolution: String(row.temporal_resolution),
      observedAt: new Date(String(row.observed_at)).toISOString(),
      retrievedAt: new Date(String(row.retrieved_at)).toISOString(),
      isModelled: Boolean(row.is_modelled),
      ...(row.aggregation_method
        ? {
            aggregationMethod: row.aggregation_method as NonNullable<
              ProvenancedValue['aggregationMethod']
            >,
          }
        : {}),
      ...(row.quality_flag
        ? { qualityFlag: row.quality_flag as NonNullable<ProvenancedValue['qualityFlag']> }
        : {}),
      ...(row.coverage_fraction !== null && row.coverage_fraction !== undefined
        ? { coverageFraction: Number(row.coverage_fraction) }
        : {}),
      ...(row.raw_metadata && typeof row.raw_metadata === 'object'
        ? { rawMetadata: row.raw_metadata as Record<string, unknown> }
        : {}),
    }));
  }

  const dailyObs = observations.filter((obs) => obs.temporalResolution !== 'climatology');
  const climObs = observations.filter((obs) => obs.temporalResolution === 'climatology');

  const catalogCrops: CatalogCropRecord[] = (cropsRes.data ?? []).map((row) =>
    mapDatabaseCropRowToCatalogRecord(row as Record<string, unknown>),
  );

  const rotationRules: RotationRule[] = (rulesRes.data ?? [])
    .filter((row) =>
      (RULE_SOURCE_TYPES as readonly string[]).includes(String(row.source_type ?? '')),
    )
    .map((row) => ({
      id: String(row.id),
      statement: String(row.statement),
      sourceType: row.source_type as RotationRule['sourceType'],
      attributedTo: (row.attributed_to as string | null) ?? null,
      sourceUrl: (row.source_url as string | null) ?? null,
      accessedOn: String(row.accessed_on),
      appliesTo: Array.isArray(row.applies_to) ? (row.applies_to as string[]) : [],
      follows: Array.isArray(row.follows) ? (row.follows as string[]) : [],
      mechanism: String(row.mechanism),
    }));

  const farmCrops: FarmCrop[] = (farmCropsRes.data ?? []).map((row) => ({
    id: String(row.id),
    farmId: String(row.farm_id),
    parcelId: (row.parcel_id as string | null) ?? null,
    cropId: String(row.crop_id),
    status:
      row.status === 'previous' || row.status === 'planned' ? row.status : ('current' as const),
    plantingDate: (row.planting_date as string | null) ?? null,
    expectedHarvestDate: (row.expected_harvest_date as string | null) ?? null,
    harvestDate: (row.harvest_date as string | null) ?? null,
    season: (SEASONS as readonly string[]).includes(String(row.season))
      ? (row.season as Season)
      : 'unknown',
    intendedUse: (['commercial', 'household', 'both', 'unknown'] as const).includes(
      row.intended_use as IntendedUse,
    )
      ? (row.intended_use as IntendedUse)
      : 'unknown',
    areaHa: row.area_ha !== null && row.area_ha !== undefined ? Number(row.area_ha) : null,
    notes: (row.notes as string | null) ?? null,
  }));

  const farmerCropHistory: FarmerCropHistoryEntry[] = (farmCropsRes.data ?? [])
    .map((row) => {
      const joinedCrop = row.crops as { code?: string } | { code?: string }[] | null;
      const cropCode = Array.isArray(joinedCrop) ? joinedCrop[0]?.code : joinedCrop?.code;
      if (!cropCode) return null;
      return {
        cropCode,
        status:
          row.status === 'previous' || row.status === 'planned' ? row.status : ('current' as const),
        season: (SEASONS as readonly string[]).includes(String(row.season))
          ? (row.season as Season)
          : 'unknown',
        parcelId: (row.parcel_id as string | null) ?? null,
        areaHa: row.area_ha !== null && row.area_ha !== undefined ? Number(row.area_ha) : null,
      };
    })
    .filter((item): item is FarmerCropHistoryEntry => item !== null);

  const rawGoals = Array.isArray(prioritiesRes.data?.goals)
    ? (prioritiesRes.data.goals as string[])
    : [];
  const goals: FarmerGoal[] = rawGoals.filter((g): g is FarmerGoal =>
    (FARMER_GOALS as readonly string[]).includes(g),
  );
  const rawTrigger = prioritiesRes.data?.planting_trigger as string | null | undefined;
  const plantingTriggerRule: PlantingTrigger | null =
    rawTrigger && (PLANTING_TRIGGERS as readonly string[]).includes(rawTrigger)
      ? (rawTrigger as PlantingTrigger)
      : null;

  const priorities: FarmerPriorities | null = prioritiesRes.data
    ? {
        farmId,
        goals,
        riskTolerance:
          prioritiesRes.data.risk_tolerance !== null &&
          prioritiesRes.data.risk_tolerance !== undefined
            ? Number(prioritiesRes.data.risk_tolerance)
            : null,
        openToChange:
          prioritiesRes.data.open_to_change !== null &&
          prioritiesRes.data.open_to_change !== undefined
            ? Boolean(prioritiesRes.data.open_to_change)
            : null,
        plantingTrigger: plantingTriggerRule,
        notes: (prioritiesRes.data.notes as string | null) ?? null,
      }
    : null;

  const comparison =
    catalogCrops.length > 0
      ? farmerCropHistory.length > 0
        ? buildAndCompareRotationStrategies({
            farmId,
            parcelId: targetParcel?.id ?? null,
            parcelAreaHa: targetParcel?.areaHa ?? null,
            catalogCrops,
            rotationRules,
            farmerCropHistory,
            observations: dailyObs,
            goals,
            rulesetVersion: DEFAULT_RULESET_VERSION,
          })
        : compareProspectiveSuitability({
            farmId,
            parcelId: targetParcel?.id ?? null,
            parcelAreaHa: targetParcel?.areaHa ?? null,
            catalogCrops,
            observations: dailyObs,
            goals,
            rulesetVersion: DEFAULT_RULESET_VERSION,
          })
      : null;

  const plantingTrigger = assessPlantingTrigger({
    parcelId: targetParcel?.id ?? null,
    farmerRule: plantingTriggerRule,
    observations: dailyObs,
    riskTolerance: priorities?.riskTolerance ?? null,
    rulesetVersion: DEFAULT_RULESET_VERSION,
  });

  const seasonalOutlook = assessSeasonalOutlook({
    parcelId: targetParcel?.id ?? null,
    dailyObservations: dailyObs,
    climatologyObservations: climObs,
    rulesetVersion: DEFAULT_RULESET_VERSION,
  });

  const payload = buildFarmReportPayload({
    kind: parsed.data.kind as ReportKind,
    periodStart: parsed.data.periodStart ?? null,
    periodEnd: parsed.data.periodEnd ?? null,
    farm,
    parcels,
    crops: farmCrops,
    priorities,
    observations,
    comparison,
    plantingTrigger,
    seasonalOutlook,
  });

  const { data: insertedReport, error: insertError } = await supabase
    .from('reports')
    .insert({
      farm_id: farmId,
      parcel_id: targetParcel?.id ?? null,
      kind: parsed.data.kind,
      period_start: parsed.data.periodStart ?? null,
      period_end: parsed.data.periodEnd ?? null,
      params: {
        kind: parsed.data.kind,
        parcelId: targetParcel?.id ?? null,
        periodStart: parsed.data.periodStart ?? null,
        periodEnd: parsed.data.periodEnd ?? null,
      },
      payload,
    })
    .select(
      'id, farm_id, parcel_id, kind, period_start, period_end, params, payload, storage_path, generated_at',
    )
    .single();

  if (insertError) {
    console.error('Failed to persist report', insertError);
    return NextResponse.json({ error: 'Unable to save generated report.' }, { status: 500 });
  }

  const { storagePath, signedUrl } = await uploadFarmReportArtifact({
    supabase,
    farmerId: user.id,
    farmId,
    reportId: String(insertedReport.id),
    payload,
  });

  if (storagePath) {
    await supabase
      .from('reports')
      .update({ storage_path: storagePath })
      .eq('id', String(insertedReport.id));
  }

  return NextResponse.json(
    {
      report: {
        ...insertedReport,
        storage_path: storagePath ?? insertedReport.storage_path,
        signed_url: signedUrl,
      },
      signedUrl,
    },
    { status: 201 },
  );
}
