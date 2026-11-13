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

import { QUALITY_FLAGS, TEMPORAL_RESOLUTIONS } from '../constants';

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
export const provenancedValueSchema = z.object({
  variable: z.string().min(1),
  value: z.number().finite(),
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
});

export type ValidatedProvenancedValue = z.infer<typeof provenancedValueSchema>;

/** A farm creation payload. */
export const farmInputSchema = z.object({
  name: z.string().trim().min(1, 'A farm name is required').max(120),
  boundary: geometrySchema,
  farmingMethod: z.enum(['rainfed', 'irrigated', 'mixed', 'unknown']).default('unknown'),
  irrigationMethod: z
    .enum([
      'none',
      'rainfed',
      'hand_irrigation',
      'furrow',
      'sprinkler',
      'drip',
      'well',
      'river',
      'unknown',
    ])
    .default('unknown'),
  soilNotes: z.string().trim().max(2000).optional(),
});

export type FarmInput = z.infer<typeof farmInputSchema>;

/** A crop record attached to a farm. */
export const farmCropInputSchema = z.object({
  farmId: z.string().uuid(),
  plotId: z.string().uuid().nullable().default(null),
  cropId: z.string().uuid(),
  status: z.enum(['current', 'previous', 'planned']),
  plantingDate: calendarDate.nullable().default(null),
  expectedHarvestDate: calendarDate.nullable().default(null),
  season: z.enum(['rainy', 'dry', 'harmattan', 'year_round', 'unknown']).default('unknown'),
  intendedUse: z.enum(['commercial', 'household', 'both', 'unknown']).default('unknown'),
  areaHa: z.number().positive().max(10_000).nullable().default(null),
  notes: z.string().trim().max(2000).nullable().default(null),
});

export type FarmCropInput = z.infer<typeof farmCropInputSchema>;

/** A request for environmental analysis over a farm. */
export const analysisRequestSchema = z
  .object({
    farmId: z.string().uuid(),
    startDate: calendarDate,
    endDate: calendarDate,
    variables: z.array(z.string().min(1)).min(1).max(25).optional(),
  })
  .refine((value) => value.startDate <= value.endDate, {
    message: 'startDate must not be after endDate',
    path: ['startDate'],
  });

export type AnalysisRequest = z.infer<typeof analysisRequestSchema>;
