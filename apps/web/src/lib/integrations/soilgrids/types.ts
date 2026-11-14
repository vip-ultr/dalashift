import { z } from 'zod';

import {
  ENVIRONMENT_VARIABLES,
  SPATIAL_RESOLUTION_METRES,
  UNITS,
} from '@dalashift/shared/constants';

export const SOILGRIDS_SOURCE = {
  id: 'soilgrids',
  endpoint: 'https://rest.isric.org/soilgrids/v2.0/properties/query',
  spatialResolutionM: SPATIAL_RESOLUTION_METRES.soilGrids,
  temporalResolution: 'annual',
  attribution:
    'SoilGrids 2.0, ISRIC World Soil Information, CC BY 4.0. Changes and access date must be stated.',
} as const;

export const SOILGRIDS_PROPERTIES = {
  [ENVIRONMENT_VARIABLES.soilPh]: {
    property: 'phh2o',
    unit: UNITS.dimensionless,
    expectedDFactor: 10,
  },
  [ENVIRONMENT_VARIABLES.soilClay]: {
    property: 'clay',
    unit: UNITS.percent,
    expectedDFactor: 10,
  },
  [ENVIRONMENT_VARIABLES.soilSand]: {
    property: 'sand',
    unit: UNITS.percent,
    expectedDFactor: 10,
  },
  [ENVIRONMENT_VARIABLES.soilSilt]: {
    property: 'silt',
    unit: UNITS.percent,
    expectedDFactor: 10,
  },
  [ENVIRONMENT_VARIABLES.soilOrganicCarbon]: {
    property: 'soc',
    unit: 'g_kg',
    expectedDFactor: 10,
  },
  [ENVIRONMENT_VARIABLES.soilBulkDensity]: {
    property: 'bdod',
    unit: 'kg_dm3',
    expectedDFactor: 100,
  },
} as const;

export const soilGridsLayerDepthSchema = z.object({
  label: z.string(),
  range: z
    .object({
      top_depth: z.number(),
      bottom_depth: z.number(),
      unit_depth: z.string(),
    })
    .optional(),
  values: z.object({
    mean: z.number().finite().nullable().optional(),
    'Q0.05': z.number().finite().nullable().optional(),
    'Q0.5': z.number().finite().nullable().optional(),
    'Q0.95': z.number().finite().nullable().optional(),
    uncertainty: z.number().finite().nullable().optional(),
  }),
});

export const soilGridsLayerSchema = z.object({
  name: z.string(),
  unit_measure: z.object({
    d_factor: z.number().positive(),
    mapped_units: z.string().optional(),
    target_units: z.string().optional(),
  }),
  depths: z.array(soilGridsLayerDepthSchema),
});

export const soilGridsResponseSchema = z.object({
  type: z.literal('Feature'),
  geometry: z.object({
    type: z.literal('Point'),
    coordinates: z.array(z.number().finite()).min(2),
  }),
  properties: z.object({
    layers: z.array(soilGridsLayerSchema),
  }),
});

export type SoilGridsResponse = z.infer<typeof soilGridsResponseSchema>;
