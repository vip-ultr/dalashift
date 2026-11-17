import { createHash } from 'node:crypto';

import {
  COMPARISON_KINDS,
  FARMER_GOALS,
  PLANTING_TRIGGERS,
  RULE_SOURCE_TYPES,
  SEASONS,
  type FarmerGoal,
  type PlantingTrigger,
  type Season,
} from '@dalashift/shared/constants';
import { geometrySchema } from '@dalashift/shared/schemas';
import type { ProvenancedValue, RotationRule } from '@dalashift/shared/types';
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
import { getGeometryRepresentativePoint } from '../../../../../lib/geospatial';
import { persistObservationsForParcel } from '../../../../../lib/integrations/cache';
import {
  fetchClimatologyCached,
  fetchDailyCached,
  NASA_POWER_DAILY_SOURCE,
  NASA_POWER_VARIABLES,
} from '../../../../../lib/integrations/nasa-power';
import { getAuthenticatedClient } from '../../../../../lib/supabase/server';

interface RouteContext {
  readonly params: Promise<{ farmId: string }>;
}

const farmIdSchema = z.string().uuid();

const compareRequestSchema = z.object({
  parcelId: z.preprocess(
    (v) => (typeof v === 'string' && v.trim() ? v.trim() : null),
    z.string().uuid().nullable().optional(),
  ),
  kind: z.preprocess((v) => {
    if (typeof v !== 'string' || !v.trim()) return undefined;
    const clean = v.trim().toLowerCase();
    return (COMPARISON_KINDS as readonly string[]).includes(clean) ? clean : undefined;
  }, z.enum(COMPARISON_KINDS).optional()),
  startDate: z.preprocess(
    (v) => (typeof v === 'string' && v.trim() ? v.trim() : undefined),
    z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .optional(),
  ),
  endDate: z.preprocess(
    (v) => (typeof v === 'string' && v.trim() ? v.trim() : undefined),
    z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .optional(),
  ),
});

/**
 * Retrieve the most recent persisted analyses and rotation strategies for a
 * farm owned by the authenticated farmer.
 */
export async function GET(request: Request, { params }: RouteContext) {
  const { farmId } = await params;
  if (!farmIdSchema.safeParse(farmId).success) {
    return NextResponse.json({ error: 'Farm id is invalid.' }, { status: 400 });
  }

  const { searchParams } = new URL(request.url);
  const parcelId = searchParams.get('parcelId');
  if (parcelId && !farmIdSchema.safeParse(parcelId).success) {
    return NextResponse.json({ error: 'Parcel id is invalid.' }, { status: 400 });
  }

  const authContext = await getAuthenticatedClient();
  if (!authContext) {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  }
  const { supabase, user } = authContext;

  const { data: farm, error: farmError } = await supabase
    .from('farms')
    .select('id')
    .eq('id', farmId)
    .eq('farmer_id', user.id)
    .maybeSingle();

  if (farmError) {
    console.error('Failed to verify farm ownership', farmError);
    return NextResponse.json({ error: 'Unable to load farm analyses.' }, { status: 500 });
  }
  if (!farm) {
    return NextResponse.json({ error: 'Farm not found.' }, { status: 404 });
  }

  let analysesQuery = supabase
    .from('analyses')
    .select(
      'id, farm_id, parcel_id, kind, status, period_start, period_end, inputs, code_version, limitations, created_at',
    )
    .eq('farm_id', farmId)
    .in('kind', ['rotation', 'suitability'])
    .order('created_at', { ascending: false })
    .limit(5);

  if (parcelId) {
    analysesQuery = analysesQuery.eq('parcel_id', parcelId);
  }

  const { data: analyses, error: analysesError } = await analysesQuery;
  if (analysesError) {
    console.error('Failed to load farm analyses', analysesError);
    return NextResponse.json({ error: 'Unable to load farm analyses.' }, { status: 500 });
  }

  const latestAnalysis = analyses?.[0] ?? null;
  if (!latestAnalysis) {
    return NextResponse.json({ analyses: [], strategies: [] });
  }

  const { data: strategies, error: strategiesError } = await supabase
    .from('rotation_strategies')
    .select(
      'id, analysis_id, farm_id, parcel_id, kind, label, rationale, evidence, benefits, information_gaps, local_review_risks, rank, ranking_basis, evidence_strength, evidence_strength_reason, ruleset_version, created_at, rotation_legs(id, sequence, season, crop_id, parcel_id, area_ha, crop_assessment)',
    )
    .eq('analysis_id', latestAnalysis.id as string)
    .order('created_at', { ascending: true });

  if (strategiesError) {
    console.error('Failed to load rotation strategies', strategiesError);
    return NextResponse.json({ error: 'Unable to load rotation strategies.' }, { status: 500 });
  }

  return NextResponse.json({
    analyses: analyses ?? [],
    strategies: strategies ?? [],
  });
}

/**
 * Run a deterministic qualitative rotation comparison or prospective
 * suitability comparison for a farm parcel, along with planting trigger
 * evaluation and seasonal risk outlook, and persist the resulting analysis,
 * recommendations, strategies, and legs.
 */
export async function POST(request: Request, { params }: RouteContext) {
  const { farmId } = await params;
  if (!farmIdSchema.safeParse(farmId).success) {
    return NextResponse.json({ error: 'Farm id is invalid.' }, { status: 400 });
  }

  const authContext = await getAuthenticatedClient();
  if (!authContext) {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  }
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

  const parsed = compareRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Comparison request is invalid.', issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  // 1. Verify farm ownership
  const { data: farmRow, error: farmError } = await supabase
    .from('farms')
    .select('id, farmer_id, name, farming_method, irrigation_method, soil_notes')
    .eq('id', farmId)
    .eq('farmer_id', user.id)
    .maybeSingle();

  if (farmError) {
    console.error('Failed to read farm for comparison', farmError);
    return NextResponse.json({ error: 'Unable to load farm.' }, { status: 500 });
  }
  if (!farmRow) {
    return NextResponse.json({ error: 'Farm not found.' }, { status: 404 });
  }

  // 2. Load target parcel
  let parcelQuery = supabase
    .from('parcels_public')
    .select('id, farm_id, name, area_ha, geometry_geojson, centroid_geojson')
    .eq('farm_id', farmId);
  if (parsed.data.parcelId) {
    parcelQuery = parcelQuery.eq('id', parsed.data.parcelId);
  }
  const { data: parcelRows, error: parcelError } = await parcelQuery.limit(1);
  if (parcelError) {
    console.error('Failed to load parcel for comparison', parcelError);
    return NextResponse.json({ error: 'Unable to load parcel.' }, { status: 500 });
  }
  const targetParcel = parcelRows?.[0] ?? null;
  const targetParcelId = (targetParcel?.id as string | undefined) ?? null;
  const targetParcelAreaHa = targetParcel?.area_ha ? Number(targetParcel.area_ha) : null;

  // 3. Load catalog crops, rotation rules, farm crops, and farmer priorities
  const [cropsRes, rulesRes, farmCropsRes, prioritiesRes] = await Promise.all([
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
      .select('id, parcel_id, crop_id, status, season, area_ha, crops(code)')
      .eq('farm_id', farmId)
      .order('created_at', { ascending: true }),
    supabase
      .from('farm_priorities')
      .select('goals, risk_tolerance, open_to_change, planting_trigger, notes')
      .eq('farm_id', farmId)
      .maybeSingle(),
  ]);

  if (cropsRes.error || !cropsRes.data || cropsRes.data.length === 0) {
    console.error('Failed to load crops catalog for comparison', cropsRes.error);
    return NextResponse.json({ error: 'Crop catalog is not available.' }, { status: 500 });
  }

  const catalogCrops: CatalogCropRecord[] = cropsRes.data.map((row) =>
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

  const farmerCropHistory: FarmerCropHistoryEntry[] = (farmCropsRes.data ?? [])
    .map((row) => {
      const joinedCrop = row.crops as { code?: string } | { code?: string }[] | null;
      const cropCode = Array.isArray(joinedCrop) ? joinedCrop[0]?.code : joinedCrop?.code;
      const seasonRaw = String(row.season ?? 'unknown');
      const season: Season = (SEASONS as readonly string[]).includes(seasonRaw)
        ? (seasonRaw as Season)
        : 'unknown';
      const statusRaw = String(row.status ?? 'current');
      const status: FarmerCropHistoryEntry['status'] =
        statusRaw === 'previous' || statusRaw === 'planned' ? statusRaw : 'current';

      if (!cropCode) return null;
      return {
        cropCode,
        status,
        season,
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
  const farmerRule: PlantingTrigger | null =
    rawTrigger && (PLANTING_TRIGGERS as readonly string[]).includes(rawTrigger)
      ? (rawTrigger as PlantingTrigger)
      : null;
  const riskTolerance =
    prioritiesRes.data?.risk_tolerance !== null && prioritiesRes.data?.risk_tolerance !== undefined
      ? Number(prioritiesRes.data.risk_tolerance)
      : null;

  // 4. Load or fetch environmental observations for the parcel
  const defaultEnd = parsed.data.endDate ?? '2025-09-30';
  const defaultStart = parsed.data.startDate ?? '2025-05-01';
  let dailyObservations: ProvenancedValue[] = [];
  let climatologyObservations: ProvenancedValue[] = [];

  if (targetParcelId) {
    const { data: storedObs } = await supabase
      .from('environmental_observations')
      .select(
        'variable, value, unit, source_key, spatial_resolution_m, temporal_resolution, observed_at, retrieved_at, is_modelled, aggregation_method, quality_flag, coverage_fraction, raw_metadata',
      )
      .eq('parcel_id', targetParcelId)
      .order('observed_at', { ascending: true })
      .limit(1000);

    if (storedObs && storedObs.length > 0) {
      const mapped = storedObs.map((row) => ({
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
      dailyObservations = mapped.filter((obs) => obs.temporalResolution !== 'climatology');
      climatologyObservations = mapped.filter((obs) => obs.temporalResolution === 'climatology');
    } else if (targetParcel) {
      const parsedGeo = geometrySchema.safeParse(
        targetParcel.centroid_geojson ?? targetParcel.geometry_geojson,
      );
      if (parsedGeo.success) {
        const [longitude, latitude] = getGeometryRepresentativePoint(parsedGeo.data);
        try {
          const [fetchedDaily, fetchedClim] = await Promise.all([
            fetchDailyCached({
              geometry: { type: 'Point', coordinates: [longitude, latitude] },
              startDate: defaultStart,
              endDate: defaultEnd,
              variables: NASA_POWER_VARIABLES,
            }),
            fetchClimatologyCached({
              geometry: { type: 'Point', coordinates: [longitude, latitude] },
            }),
          ]);
          dailyObservations = [...fetchedDaily];
          climatologyObservations = [...fetchedClim];
          await persistObservationsForParcel({
            parcelId: targetParcelId,
            sourceKey: NASA_POWER_DAILY_SOURCE.id,
            longitude,
            latitude,
            observations: [...dailyObservations, ...climatologyObservations],
          });
        } catch (err) {
          console.warn(
            'Could not fetch live NASA POWER observations during comparison; degrading gracefully.',
            err,
          );
        }
      }
    }
  }

  // 5. Run comparison engine, planting trigger assessment, and seasonal outlook
  const effectiveKind =
    parsed.data.kind ?? (farmerCropHistory.length > 0 ? 'rotation' : 'suitability');

  const comparison =
    effectiveKind === 'suitability'
      ? compareProspectiveSuitability({
          farmId,
          parcelId: targetParcelId,
          parcelAreaHa: targetParcelAreaHa,
          catalogCrops,
          observations: dailyObservations,
          goals,
          rulesetVersion: DEFAULT_RULESET_VERSION,
        })
      : buildAndCompareRotationStrategies({
          farmId,
          parcelId: targetParcelId,
          parcelAreaHa: targetParcelAreaHa,
          catalogCrops,
          rotationRules,
          farmerCropHistory,
          observations: dailyObservations,
          goals,
          rulesetVersion: DEFAULT_RULESET_VERSION,
        });

  const plantingTrigger = assessPlantingTrigger({
    parcelId: targetParcelId,
    farmerRule,
    observations: dailyObservations,
    riskTolerance,
    rulesetVersion: DEFAULT_RULESET_VERSION,
  });

  const seasonalOutlook = assessSeasonalOutlook({
    parcelId: targetParcelId,
    dailyObservations,
    climatologyObservations,
    rulesetVersion: DEFAULT_RULESET_VERSION,
  });

  // 6. Persist analysis, crop recommendations, rotation strategies, and legs
  const inputsSnapshot = {
    kind: effectiveKind,
    parcelId: targetParcelId,
    startDate: defaultStart,
    endDate: defaultEnd,
    goals,
    farmerRule,
    cropHistoryCodes: farmerCropHistory.map((item) => item.cropCode),
    observationCount: dailyObservations.length,
  };
  const inputsHash =
    'sha256:' + createHash('sha256').update(JSON.stringify(inputsSnapshot)).digest('hex');

  const { data: analysisRow, error: analysisInsertError } = await supabase
    .from('analyses')
    .insert({
      farm_id: farmId,
      parcel_id: targetParcelId,
      kind: effectiveKind,
      status: dailyObservations.length > 0 ? 'complete' : 'partial',
      period_start: defaultStart,
      period_end: defaultEnd,
      inputs: inputsSnapshot,
      inputs_hash: inputsHash,
      code_version: DEFAULT_RULESET_VERSION,
      limitations: comparison.limitations,
    })
    .select('id')
    .single();

  if (analysisInsertError || !analysisRow) {
    console.error('Failed to persist analysis record', analysisInsertError);
    return NextResponse.json(
      {
        analysisId: null,
        comparison,
        plantingTrigger,
        seasonalOutlook,
      },
      { status: 200 },
    );
  }

  const analysisId = analysisRow.id as string;

  // Deduplicate unique crop assessments across strategies for the recommendations table
  const seenCropIds = new Set<string>();
  const recommendationRows = [];
  for (const strategy of comparison.strategies) {
    for (const leg of strategy.legs) {
      if (seenCropIds.has(leg.cropId)) continue;
      seenCropIds.add(leg.cropId);
      recommendationRows.push({
        analysis_id: analysisId,
        farm_id: farmId,
        parcel_id: targetParcelId,
        crop_id: leg.cropId,
        verdict: leg.assessment.verdict,
        dimensions: leg.assessment.dimensions,
        rationale: leg.assessment.rationale,
        limitations: leg.assessment.limitations,
        evidence_strength: leg.assessment.evidenceStrength,
        evidence_strength_reason: leg.assessment.evidenceStrengthReason,
        ruleset_version: leg.assessment.rulesetVersion,
        requires_local_review: true,
      });
    }
  }

  if (recommendationRows.length > 0) {
    const { error: recError } = await supabase.from('recommendations').insert(recommendationRows);
    if (recError) {
      console.warn('Failed to persist recommendations rows', recError);
    }
  }

  for (const strategy of comparison.strategies) {
    const { data: strategyRow, error: strategyError } = await supabase
      .from('rotation_strategies')
      .insert({
        analysis_id: analysisId,
        farm_id: farmId,
        parcel_id: targetParcelId,
        kind: strategy.kind,
        label: strategy.label,
        rationale: strategy.rationale,
        evidence: strategy.evidence,
        benefits: [...strategy.benefits],
        information_gaps: [...strategy.informationGaps],
        local_review_risks: [...strategy.localReviewRisks],
        rank: strategy.rank,
        ranking_basis: strategy.rankingBasis,
        evidence_strength: strategy.evidenceStrength,
        evidence_strength_reason: strategy.evidenceStrengthReason,
        ruleset_version: comparison.rulesetVersion,
      })
      .select('id')
      .single();

    if (strategyError || !strategyRow) {
      console.warn('Failed to persist rotation strategy row', strategyError);
      continue;
    }

    const legRows = strategy.legs.map((leg) => ({
      strategy_id: strategyRow.id as string,
      sequence: leg.sequence,
      season: leg.season,
      crop_id: leg.cropId,
      parcel_id: leg.parcelId,
      area_ha: leg.areaHa,
      crop_assessment: leg.assessment,
    }));

    if (legRows.length > 0) {
      const { error: legsError } = await supabase.from('rotation_legs').insert(legRows);
      if (legsError) {
        console.warn('Failed to persist rotation legs', legsError);
      }
    }
  }

  return NextResponse.json(
    {
      analysisId,
      comparison,
      plantingTrigger,
      seasonalOutlook,
    },
    { status: 201 },
  );
}
