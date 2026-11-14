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
  EVIDENCE_KINDS,
  EVIDENCE_STRENGTHS,
  FARMER_GOALS,
  FARMING_METHODS,
  GEOMETRY_METHODS,
  IRRIGATION_METHODS,
  LIMITATION_KINDS,
  PLANTING_TRIGGERS,
  QUALITY_FLAGS,
  RULE_SOURCE_TYPES,
  SEASONS,
  TEMPORAL_RESOLUTIONS,
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
  farmingMethod: z.enum(FARMING_METHODS).default('unknown'),
  irrigationMethod: z.enum(IRRIGATION_METHODS).default('unknown'),
  soilNotes: z.string().trim().max(2000).optional(),
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
    geometryMethod: z.enum(GEOMETRY_METHODS).default('gps_point'),
    /** How far the recorded location may be off, in metres. */
    locationUncertaintyM: z.number().min(0).max(5000).nullable().default(null),
    notes: z.string().trim().max(2000).optional(),
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

/** A crop record attached to a farm or parcel. */
export const farmCropInputSchema = z.object({
  farmId: z.string().uuid(),
  parcelId: z.string().uuid().nullable().default(null),
  cropId: z.string().uuid(),
  status: z.enum(['current', 'previous', 'planned']),
  plantingDate: calendarDate.nullable().default(null),
  expectedHarvestDate: calendarDate.nullable().default(null),
  harvestDate: calendarDate.nullable().default(null),
  season: z.enum(SEASONS).default('unknown'),
  intendedUse: z.enum(['commercial', 'household', 'both', 'unknown']).default('unknown'),
  areaHa: z.number().positive().max(10_000).nullable().default(null),
  notes: z.string().trim().max(2000).nullable().default(null),
});

export type FarmCropInput = z.infer<typeof farmCropInputSchema>;

/**
 * A farmer's stated priorities.
 *
 * These are inputs to the comparison, not display preferences, so the
 * planting trigger is part of the same record.
 */
export const farmerPrioritiesInputSchema = z.object({
  farmId: z.string().uuid(),
  goals: z.array(z.enum(FARMER_GOALS)).max(FARMER_GOALS.length).default([]),
  riskTolerance: z.number().min(0).max(1).nullable().default(null),
  openToChange: z.boolean().nullable().default(null),
  plantingTrigger: z.enum(PLANTING_TRIGGERS).nullable().default(null),
  notes: z.string().trim().max(2000).nullable().default(null),
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
