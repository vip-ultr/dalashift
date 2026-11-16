/**
 * Shared Zod validation schemas for the DalaShift monorepo.
 *
 * These are the runtime validation layer at every boundary: route handler
 * inputs, server action inputs, and, critically, **upstream API responses**.
 * An upstream payload is never trusted without passing through a schema here.
 *
 * @packageDocumentation
 */

import { z } from 'zod';

import {
  ASSESSMENT_DIMENSIONS,
  ASSESSMENT_STATUSES,
  CROP_CATEGORIES,
  CROP_STATUSES,
  EVIDENCE_KINDS,
  EVIDENCE_STRENGTHS,
  FARMER_GOALS,
  FARMING_METHODS,
  GEOMETRY_METHODS,
  INTENDED_USES,
  IRRIGATION_METHODS,
  LIMITATION_KINDS,
  PLANTING_TRIGGERS,
  QUALITY_FLAGS,
  RULE_SOURCE_TYPES,
  SEASONS,
  TEMPORAL_RESOLUTIONS,
  type CropStatus,
  type FarmerGoal,
  type IntendedUse,
  type PlantingTrigger,
  type Season,
} from '../constants';

/** ISO 8601 timestamp in UTC. */
const isoUtc = z.string().refine((value) => !Number.isNaN(Date.parse(value)), {
  message: 'Must be a valid ISO 8601 timestamp',
});

/** `YYYY-MM-DD` calendar date. */
const calendarDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'Must be a YYYY-MM-DD date' });

/** GeoJSON geometry in EPSG:4326. Note the lng, lat ordering. */
export const geometrySchema = z.union([
  z.object({
    type: z.literal('Point'),
    coordinates: z.tuple([z.number(), z.number()]),
  }),
  z.object({
    type: z.literal('Polygon'),
    coordinates: z.array(z.array(z.tuple([z.number(), z.number()]))).min(1),
  }),
  z.object({
    type: z.literal('MultiPolygon'),
    coordinates: z.array(z.array(z.array(z.tuple([z.number(), z.number()])))).min(1),
  }),
]);

/**
 * A normalised environmental value with complete provenance.
 *
 * This is the schema every integration module's output must satisfy. It is
 * what guarantees the product never stores a number without knowing where it
 * came from.
 */
export const provenancedValueSchema = z
  .object({
    variable: z.string().min(1),
    value: z.number().finite().nullable(),
    unit: z.string().min(1),
    sourceId: z.string().min(1),
    spatialResolutionM: z.number().positive(),
    temporalResolution: z.enum(TEMPORAL_RESOLUTIONS),
    observedAt: isoUtc,
    retrievedAt: isoUtc,
    isModelled: z.boolean(),
    aggregationMethod: z
      .enum(['grid_cell', 'point_sample', 'zonal', 'interpolated_point'])
      .optional(),
    qualityFlag: z.enum(QUALITY_FLAGS).optional(),
    coverageFraction: z.number().min(0).max(1).optional(),
    rawMetadata: z.record(z.string(), z.unknown()).optional(),
  })
  .refine((value) => (value.value === null) === (value.qualityFlag === 'missing'), {
    message: 'A missing value must use the missing quality flag, and vice versa',
    path: ['value'],
  });

export type ValidatedProvenancedValue = z.infer<typeof provenancedValueSchema>;

/** A farm creation payload. The farm is the holding, not a single field. */
export const farmInputSchema = z.object({
  name: z.string().trim().min(1, 'A farm name is required').max(120),
  farmingMethod: z
    .preprocess((v) => {
      if (typeof v !== 'string' || !v.trim()) return 'unknown';
      const clean = v.trim().toLowerCase();
      return (FARMING_METHODS as readonly string[]).includes(clean) ? clean : 'unknown';
    }, z.enum(FARMING_METHODS))
    .default('unknown'),
  irrigationMethod: z
    .preprocess((v) => {
      if (typeof v !== 'string' || !v.trim()) return 'unknown';
      const clean = v.trim().toLowerCase();
      if (clean === 'borehole') return 'well';
      if (clean === 'canal') return 'furrow';
      if (clean === 'other') return 'unknown';
      return (IRRIGATION_METHODS as readonly string[]).includes(clean) ? clean : 'unknown';
    }, z.enum(IRRIGATION_METHODS))
    .default('unknown'),
  soilNotes: z
    .preprocess(
      (v) => (typeof v === 'string' && v.trim() ? v.trim() : null),
      z.string().max(2000).nullable().optional(),
    )
    .default(null),
});

export type FarmInput = z.infer<typeof farmInputSchema>;

/**
 * A parcel payload.
 *
 * Decision D-06: a GPS point is the default path and a drawn polygon is also
 * accepted. A point is promoted to a small geometry server-side so the
 * parcel always has one.
 */
export const parcelInputSchema = z
  .object({
    farmId: z.string().uuid(),
    name: z.string().trim().min(1, 'A parcel name is required').max(120),
    geometry: geometrySchema,
    geometryMethod: z
      .preprocess((v) => {
        if (typeof v !== 'string' || !v.trim()) return 'gps_point';
        const clean = v.trim().toLowerCase();
        if (clean === 'point' || clean === 'gps' || clean === 'single_point') return 'gps_point';
        if (clean === 'polygon' || clean === 'drawn') return 'drawn_polygon';
        return (GEOMETRY_METHODS as readonly string[]).includes(clean) ? clean : 'gps_point';
      }, z.enum(GEOMETRY_METHODS))
      .default('gps_point'),
    /** How far the recorded location may be off, in metres. */
    locationUncertaintyM: z
      .preprocess((v) => {
        if (v === '' || v === null || v === undefined) return null;
        const parsed = Number(v);
        return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
      }, z.number().min(0).max(5000).nullable())
      .default(null),
    notes: z
      .preprocess(
        (v) => (typeof v === 'string' && v.trim() ? v.trim() : null),
        z.string().max(2000).nullable().optional(),
      )
      .default(null),
  })
  .refine(
    (value) =>
      value.geometryMethod === 'gps_point'
        ? value.geometry.type === 'Point'
        : value.geometry.type !== 'Point',
    {
      message: 'A GPS parcel must carry a point geometry and a drawn parcel must not',
      path: ['geometry'],
    },
  );

export type ParcelInput = z.infer<typeof parcelInputSchema>;

const CROP_STATUS_ALIASES: Record<string, CropStatus> = {
  previous: 'previous',
  last: 'previous',
  past: 'previous',
  current: 'current',
  now: 'current',
  present: 'current',
  planned: 'planned',
  next: 'planned',
  candidate: 'planned',
  future: 'planned',
};

const SEASON_ALIASES: Record<string, Season> = {
  rainy: 'rainy',
  wet: 'rainy',
  rain: 'rainy',
  rainy_season: 'rainy',
  dry: 'dry',
  dry_season: 'dry',
  harmattan: 'harmattan',
  year_round: 'year_round',
  all_year: 'year_round',
  unknown: 'unknown',
};

const INTENDED_USE_ALIASES: Record<string, IntendedUse> = {
  commercial: 'commercial',
  market: 'commercial',
  cash: 'commercial',
  household: 'household',
  home: 'household',
  subsistence: 'household',
  both: 'both',
  unknown: 'unknown',
};

/** A crop record attached to a farm or parcel. */
export const farmCropInputSchema = z.object({
  farmId: z.string().uuid(),
  parcelId: z.string().uuid().nullable().default(null),
  cropId: z.string().uuid(),
  status: z
    .preprocess((v) => {
      if (typeof v !== 'string' || !v.trim()) return 'current';
      const clean = v.trim().toLowerCase();
      return CROP_STATUS_ALIASES[clean] ?? ((CROP_STATUSES as readonly string[]).includes(clean) ? clean : 'current');
    }, z.enum(CROP_STATUSES))
    .default('current'),
  plantingDate: z
    .preprocess((v) => (typeof v === 'string' && v.trim() ? v.trim() : null), calendarDate.nullable())
    .default(null),
  expectedHarvestDate: z
    .preprocess((v) => (typeof v === 'string' && v.trim() ? v.trim() : null), calendarDate.nullable())
    .default(null),
  harvestDate: z
    .preprocess((v) => (typeof v === 'string' && v.trim() ? v.trim() : null), calendarDate.nullable())
    .default(null),
  season: z
    .preprocess((v) => {
      if (typeof v !== 'string' || !v.trim()) return 'unknown';
      const clean = v.trim().toLowerCase();
      return SEASON_ALIASES[clean] ?? ((SEASONS as readonly string[]).includes(clean) ? clean : 'unknown');
    }, z.enum(SEASONS))
    .default('unknown'),
  intendedUse: z
    .preprocess((v) => {
      if (typeof v !== 'string' || !v.trim()) return 'unknown';
      const clean = v.trim().toLowerCase();
      return INTENDED_USE_ALIASES[clean] ?? ((INTENDED_USES as readonly string[]).includes(clean) ? clean : 'unknown');
    }, z.enum(INTENDED_USES))
    .default('unknown'),
  areaHa: z
    .preprocess((v) => {
      if (v === '' || v === null || v === undefined) return null;
      const parsed = Number(v);
      return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
    }, z.number().positive().max(10_000).nullable())
    .default(null),
  notes: z
    .preprocess(
      (v) => (typeof v === 'string' && v.trim() ? v.trim() : null),
      z.string().max(2000).nullable().optional(),
    )
    .default(null),
});

export type FarmCropInput = z.infer<typeof farmCropInputSchema>;

const GOAL_ALIASES: Record<string, FarmerGoal> = {
  drought_tolerance: 'reduce_risk',
  drought: 'reduce_risk',
  dry_spell_tolerance: 'reduce_risk',
  risk_reduction: 'reduce_risk',
  reduce_risk: 'reduce_risk',
  risk: 'reduce_risk',
  fertility: 'improve_soil_fertility',
  soil_fertility: 'improve_soil_fertility',
  restore_fertility: 'improve_soil_fertility',
  improve_soil_fertility: 'improve_soil_fertility',
  water: 'conserve_water',
  moisture: 'conserve_water',
  conserve_water: 'conserve_water',
  conserve_moisture: 'conserve_water',
  income: 'increase_income',
  market_value: 'increase_income',
  increase_income: 'increase_income',
  cash: 'increase_income',
  food: 'food_security',
  food_security: 'food_security',
  household_food: 'food_security',
  subsistence: 'food_security',
  maturity: 'maturity_reliability',
  early_maturity: 'maturity_reliability',
  maturity_reliability: 'maturity_reliability',
  reliable_harvest: 'maturity_reliability',
  reliability: 'maturity_reliability',
  work: 'less_work',
  less_work: 'less_work',
  labour: 'less_work',
  labor: 'less_work',
  less_labor: 'less_work',
  less_labour: 'less_work',
};

const TRIGGER_ALIASES: Record<string, PlantingTrigger> = {
  wait_for_confirmed_moisture: 'wait_for_confirmed_moisture',
  confirmed_moisture: 'wait_for_confirmed_moisture',
  moisture_confirmed: 'wait_for_confirmed_moisture',
  wait_for_moisture: 'wait_for_confirmed_moisture',
  moisture: 'wait_for_confirmed_moisture',
  plant_on_first_rains: 'plant_on_first_rains',
  first_rains: 'plant_on_first_rains',
  early_rains: 'plant_on_first_rains',
  sow_on_first_rains: 'plant_on_first_rains',
  prepare_and_plant_quickly: 'prepare_and_plant_quickly',
  prepare_quickly: 'prepare_and_plant_quickly',
  plant_quickly: 'prepare_and_plant_quickly',
  quick_planting: 'prepare_and_plant_quickly',
};

/**
 * A farmer's stated priorities.
 *
 * These are inputs to the comparison, not display preferences, so the
 * planting trigger is part of the same record.
 */
export const farmerPrioritiesInputSchema = z.object({
  farmId: z.string().uuid(),
  goals: z
    .preprocess(
      (val) => {
        if (!Array.isArray(val)) return [];
        const normalized = val
          .filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
          .map((item) => {
            const clean = item.trim().toLowerCase();
            return GOAL_ALIASES[clean] ?? ((FARMER_GOALS as readonly string[]).includes(clean) ? clean : null);
          })
          .filter((item): item is FarmerGoal => Boolean(item));
        return Array.from(new Set(normalized));
      },
      z.array(z.enum(FARMER_GOALS)).max(FARMER_GOALS.length),
    )
    .default([]),
  riskTolerance: z
    .preprocess((v) => {
      if (v === '' || v === null || v === undefined) return null;
      const parsed = typeof v === 'number' ? v : Number(v);
      return Number.isFinite(parsed) && parsed >= 0 && parsed <= 1 ? parsed : null;
    }, z.number().min(0).max(1).nullable())
    .default(null),
  openToChange: z
    .preprocess((v) => {
      if (typeof v === 'boolean') return v;
      if (v === 'true' || v === 1 || v === '1') return true;
      if (v === 'false' || v === 0 || v === '0') return false;
      return null;
    }, z.boolean().nullable())
    .default(null),
  plantingTrigger: z
    .preprocess((v) => {
      if (typeof v !== 'string' || !v.trim()) return null;
      const clean = v.trim().toLowerCase();
      return TRIGGER_ALIASES[clean] ?? null;
    }, z.enum(PLANTING_TRIGGERS).nullable())
    .default(null),
  notes: z
    .preprocess(
      (v) => (typeof v === 'string' && v.trim() ? v.trim() : null),
      z.string().max(2000).nullable().optional(),
    )
    .default(null),
});

export type FarmerPrioritiesInput = z.infer<typeof farmerPrioritiesInputSchema>;

/** A request for environmental analysis over a parcel. */
export const analysisRequestSchema = z
  .object({
    farmId: z.string().uuid(),
    parcelId: z.string().uuid().nullable().default(null),
    startDate: calendarDate,
    endDate: calendarDate,
    variables: z.array(z.string().min(1)).min(1).max(25).optional(),
  })
  .refine((value) => value.startDate <= value.endDate, {
    message: 'startDate must not be after endDate',
    path: ['startDate'],
  });

export type AnalysisRequest = z.infer<typeof analysisRequestSchema>;

/**
 * One dimension assessment, as it crosses the engine boundary.
 *
 * There is no score field. The status and the explanation carry the meaning.
 */
export const dimensionAssessmentSchema = z.object({
  dimension: z.enum(ASSESSMENT_DIMENSIONS),
  value: z.number().finite().nullable(),
  unit: z.string().nullable(),
  threshold: z.object({
    min: z.number().finite().nullable(),
    max: z.number().finite().nullable(),
    citation: z.string().min(1),
  }),
  status: z.enum(ASSESSMENT_STATUSES),
  explanation: z.string().min(1),
  sourceId: z.string().nullable(),
  observedAt: isoUtc.nullable(),
});

export type ValidatedDimensionAssessment = z.infer<typeof dimensionAssessmentSchema>;

/** A limitation, as it crosses the engine boundary. */
export const limitationSchema = z.object({
  kind: z.enum(LIMITATION_KINDS),
  statement: z.string().min(1),
});

export type ValidatedLimitation = z.infer<typeof limitationSchema>;

/** An evidence item, as it crosses the engine boundary. */
export const evidenceItemSchema = z.object({
  kind: z.enum(EVIDENCE_KINDS),
  statement: z.string().min(1),
  citation: z.string().nullable(),
  value: z.number().finite().nullable(),
  unit: z.string().nullable(),
});

export type ValidatedEvidenceItem = z.infer<typeof evidenceItemSchema>;

/** A cited agronomic requirement. A requirement without a citation is invalid. */
export const cropRequirementSchema = z.object({
  claim: z.string().min(1),
  value: z.union([z.number().finite(), z.string().min(1)]),
  unit: z.string().optional(),
  sourceType: z.enum(RULE_SOURCE_TYPES),
  sourceUrl: z.string().min(1),
  accessedOn: calendarDate,
  citation: z.string().min(1),
});

export type ValidatedCropRequirement = z.infer<typeof cropRequirementSchema>;

export const farmerReportedCropNameSchema = z.object({
  name: z.string().min(1),
  sourceReference: z.string().nullable(),
  evidenceStatus: z.enum(['reported', 'unverified_legacy_alias']),
});

export const cropSeedOrMarketClassSchema = z.object({
  label: z.string().min(1),
  attributeType: z.enum(['seed_colour', 'market_class', 'unknown']),
  evidenceStatus: z.enum(['farmer_reported_unverified', 'source_verified']),
  sourceReference: z.string().nullable(),
});

/**
 * A crop record in the catalog.
 *
 * Every record must carry at least one citation, and the citation must name
 * which claim it supports.
 */
export const cropRequirementsSchema = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
  scientificName: z.string().min(1).nullable(),
  farmerReportedNames: z.array(farmerReportedCropNameSchema).default([]),
  varietyOrCultivar: z.string().nullable(),
  seedOrMarketClasses: z.array(cropSeedOrMarketClassSchema).default([]),
  verifiedAliases: z.array(z.string().min(1)).default([]),
  category: z.enum(CROP_CATEGORIES),
  applicableRegions: z.array(z.string().min(1)).min(1),
  growingPeriodDays: z.object({
    min: z.number().int().positive(),
    max: z.number().int().positive(),
  }),
  temperature: z.object({
    optimalMin: z.number(),
    optimalMax: z.number(),
    absoluteMin: z.number(),
    absoluteMax: z.number(),
  }),
  rainfall: z.object({
    minMm: z.number().nonnegative(),
    maxMm: z.number().nonnegative(),
    seasonLengthDays: z.number().int().positive(),
  }),
  waterDemand: z.object({
    mmPerDay: z.number().nonnegative(),
    irrigationRequired: z.boolean(),
  }),
  soil: z.object({
    ph: z.object({ min: z.number(), max: z.number() }),
    preferredTexture: z.array(z.enum(['sand', 'loam', 'clay', 'silt'])).min(1),
    drainage: z.array(z.enum(['poor', 'moderate', 'good', 'excellent'])).min(1),
  }),
  rotationTraits: z.object({
    nitrogenContribution: z.enum(['fixes', 'consumes', 'neutral']),
    residueLoad: z.enum(['low', 'medium', 'high']),
    diseaseBreak: z.boolean(),
  }),
  fertiliser: z.object({
    required: z.boolean(),
    applicationsPerSeason: z.number().int().nonnegative().nullable(),
  }),
  sourceCitations: z.array(cropRequirementSchema).min(1),
  catalogVersion: z.string().min(1),
});

export type ValidatedCropRequirements = z.infer<typeof cropRequirementsSchema>;

/**
 * A rotation rule.
 *
 * The source type is required, so a farmer's rule can never be presented as
 * published agronomy.
 */
export const rotationRuleSchema = z.object({
  id: z.string().min(1),
  statement: z.string().min(1),
  sourceType: z.enum(RULE_SOURCE_TYPES),
  attributedTo: z.string().nullable(),
  sourceUrl: z.string().nullable(),
  accessedOn: calendarDate,
  appliesTo: z.array(z.string().min(1)).min(1),
  follows: z.array(z.string().min(1)).min(1),
  mechanism: z.string().min(1),
});

export type ValidatedRotationRule = z.infer<typeof rotationRuleSchema>;

/** A crop assessment as it crosses the engine boundary. */
export const cropAssessmentSchema = z.object({
  cropId: z.string().min(1),
  cropCode: z.string().min(1),
  cropName: z.string().min(1),
  verdict: z.enum(['suitable', 'conditional', 'not_suitable', 'insufficient_information']),
  dimensions: z.array(dimensionAssessmentSchema),
  rationale: z.string().min(1),
  limitations: z.array(limitationSchema),
  evidenceStrength: z.enum(EVIDENCE_STRENGTHS),
  evidenceStrengthReason: z.string().min(1),
  rulesetVersion: z.string().min(1),
});

export type ValidatedCropAssessment = z.infer<typeof cropAssessmentSchema>;
