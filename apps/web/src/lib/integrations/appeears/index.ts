import 'server-only';

import { SPATIAL_RESOLUTION_METRES } from '@dalashift/shared/constants';
import { z } from 'zod';

const APPEEARS_BASE_URL = 'https://appeears.earthdatacloud.nasa.gov/api';
const REQUEST_TIMEOUT_MS = 12_000;

/**
 * Verified NASA AppEEARS product and layer identifiers checked live against
 * https://appeears.earthdatacloud.nasa.gov/api/product on 2026-11-14.
 */
export const APPEEARS_PRODUCTS = {
  modisNdvi250m: {
    product: 'MOD13Q1.061',
    sourceKey: 'modis_mod13q1_v061',
    spatialResolutionM: SPATIAL_RESOLUTION_METRES.modisVegetationIndex,
    layers: ['_250m_16_days_NDVI', '_250m_16_days_EVI', '_250m_16_days_VI_Quality'] as const,
  },
  modisLst1km: {
    product: 'MOD11A2.061',
    sourceKey: 'modis_mod11a2_v061',
    spatialResolutionM: SPATIAL_RESOLUTION_METRES.modisLandSurfaceTemperature,
    layers: ['LST_Day_1km', 'LST_Night_1km', 'QC_Day'] as const,
  },
  smapEnhanced9km: {
    product: 'SPL3SMP_E.006',
    sourceKey: 'smap_l3_enhanced',
    spatialResolutionM: SPATIAL_RESOLUTION_METRES.smapSoilMoisture,
    layers: [
      'Soil_Moisture_Retrieval_Data_AM_soil_moisture',
      'Soil_Moisture_Retrieval_Data_AM_retrieval_qual_flag',
    ] as const,
  },
  srtmDem30m: {
    product: 'SRTMGL1_NC.003',
    sourceKey: 'srtm_gl1',
    spatialResolutionM: 30,
    layers: ['SRTMGL1_DEM'] as const,
  },
  landsat9Sr30m: {
    product: 'L09.002',
    sourceKey: 'landsat_c2_l2',
    spatialResolutionM: SPATIAL_RESOLUTION_METRES.landsat,
    layers: ['SR_B4', 'SR_B5', 'QA_PIXEL'] as const,
  },
} as const;

const appEearsLayerEntrySchema = z.object({
  Layer: z.string(),
  Description: z.string(),
  Units: z.string().optional(),
  ScaleFactor: z.number().nullable().optional(),
  AddOffset: z.number().nullable().optional(),
  FillValue: z.number().nullable().optional(),
  IsQA: z.boolean().optional(),
});

const appEearsLayerMapSchema = z.record(z.string(), appEearsLayerEntrySchema);

const appEearsTaskResponseSchema = z.object({
  task_id: z.string(),
  status: z.string(),
});

const appEearsTaskStatusSchema = z.object({
  task_id: z.string(),
  task_name: z.string().optional(),
  status: z.string(),
  updated: z.string().optional(),
});

export class AppEearsUpstreamError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AppEearsUpstreamError';
  }
}

function getEarthdataToken(): string | null {
  const token = process.env.NASA_EARTHDATA_TOKEN?.trim();
  return token && token.length > 0 ? token : null;
}

/** Whether `NASA_EARTHDATA_TOKEN` is configured in the server environment. */
export function isAppEearsConfigured(): boolean {
  return getEarthdataToken() !== null;
}

/**
 * Format an ISO date (`YYYY-MM-DD`) into the `MM-DD-YYYY` format required by
 * NASA AppEEARS task payloads (docs/api/data-sources.md § 8.1).
 */
export function formatAppEearsDate(isoDate: string): string {
  const [year, month, day] = isoDate.split('-');
  if (!year || !month || !day) {
    throw new Error(`Invalid ISO date for AppEEARS: ${isoDate}`);
  }
  return `${month}-${day}-${year}`;
}

/**
 * Fetch the verified layer specifications for a NASA AppEEARS product.
 * Works with or without a Bearer token.
 */
export async function fetchAppEearsProductLayers(
  productAndVersion: string,
): Promise<Record<string, z.infer<typeof appEearsLayerEntrySchema>>> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  const token = getEarthdataToken();

  try {
    const response = await fetch(
      `${APPEEARS_BASE_URL}/product/${encodeURIComponent(productAndVersion)}`,
      {
        headers: {
          Accept: 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        signal: controller.signal,
        cache: 'no-store',
      },
    );

    if (!response.ok) {
      throw new AppEearsUpstreamError(
        `NASA AppEEARS product catalog returned HTTP ${response.status}.`,
      );
    }

    const payload: unknown = await response.json();
    const parsed = appEearsLayerMapSchema.safeParse(payload);
    if (!parsed.success) {
      throw new AppEearsUpstreamError('NASA AppEEARS returned an unexpected layer catalogue.');
    }
    return parsed.data;
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Submit an asynchronous point-sample extraction task to NASA AppEEARS for
 * MODIS 250 m NDVI, SMAP 9 km soil moisture, Landsat 9 30 m reflectance, and
 * SRTM 30 m elevation at a parcel coordinate.
 *
 * Requires `NASA_EARTHDATA_TOKEN` in the server environment.
 */
export async function submitAppEearsPointTask(input: {
  readonly taskName: string;
  readonly id: string;
  readonly category: string;
  readonly latitude: number;
  readonly longitude: number;
  readonly startDate: string;
  readonly endDate: string;
}): Promise<{ readonly taskId: string; readonly status: string }> {
  const token = getEarthdataToken();
  if (!token) {
    throw new AppEearsUpstreamError('NASA_EARTHDATA_TOKEN is not configured on the server.');
  }

  const layers = [
    ...APPEEARS_PRODUCTS.modisNdvi250m.layers.map((layer) => ({
      product: APPEEARS_PRODUCTS.modisNdvi250m.product,
      layer,
    })),
    ...APPEEARS_PRODUCTS.smapEnhanced9km.layers.map((layer) => ({
      product: APPEEARS_PRODUCTS.smapEnhanced9km.product,
      layer,
    })),
    ...APPEEARS_PRODUCTS.srtmDem30m.layers.map((layer) => ({
      product: APPEEARS_PRODUCTS.srtmDem30m.product,
      layer,
    })),
    ...APPEEARS_PRODUCTS.landsat9Sr30m.layers.map((layer) => ({
      product: APPEEARS_PRODUCTS.landsat9Sr30m.product,
      layer,
    })),
  ];

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${APPEEARS_BASE_URL}/task`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        task_type: 'point',
        task_name: input.taskName,
        params: {
          dates: [
            {
              startDate: formatAppEearsDate(input.startDate),
              endDate: formatAppEearsDate(input.endDate),
            },
          ],
          layers,
          coordinates: [
            {
              id: input.id,
              category: input.category,
              latitude: input.latitude,
              longitude: input.longitude,
            },
          ],
        },
      }),
      signal: controller.signal,
      cache: 'no-store',
    });

    if (response.status === 401 || response.status === 403) {
      throw new AppEearsUpstreamError(
        'NASA AppEEARS rejected NASA_EARTHDATA_TOKEN (HTTP 401/403). Confirm the token is active and AppEEARS is enabled on your Earthdata account.',
      );
    }
    if (!response.ok) {
      throw new AppEearsUpstreamError(
        `NASA AppEEARS task submission returned HTTP ${response.status}.`,
      );
    }

    const payload: unknown = await response.json();
    const parsed = appEearsTaskResponseSchema.safeParse(payload);
    if (!parsed.success) {
      throw new AppEearsUpstreamError('NASA AppEEARS returned an unexpected task response.');
    }

    return {
      taskId: parsed.data.task_id,
      status: parsed.data.status,
    };
  } finally {
    clearTimeout(timeout);
  }
}

/** Poll the status of an existing NASA AppEEARS task (`GET /api/task/{taskId}`). */
export async function getAppEearsTaskStatus(taskId: string): Promise<{
  readonly taskId: string;
  readonly taskName: string | null;
  readonly status: string;
  readonly updatedAt: string | null;
}> {
  const token = getEarthdataToken();
  if (!token) {
    throw new AppEearsUpstreamError('NASA_EARTHDATA_TOKEN is not configured on the server.');
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${APPEEARS_BASE_URL}/task/${encodeURIComponent(taskId)}`, {
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
      signal: controller.signal,
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new AppEearsUpstreamError(
        `NASA AppEEARS task status returned HTTP ${response.status}.`,
      );
    }

    const payload: unknown = await response.json();
    const parsed = appEearsTaskStatusSchema.safeParse(payload);
    if (!parsed.success) {
      throw new AppEearsUpstreamError('NASA AppEEARS returned an unexpected task status.');
    }

    return {
      taskId: parsed.data.task_id,
      taskName: parsed.data.task_name ?? null,
      status: parsed.data.status,
      updatedAt: parsed.data.updated ?? null,
    };
  } finally {
    clearTimeout(timeout);
  }
}
