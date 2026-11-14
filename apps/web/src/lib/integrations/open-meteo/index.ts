import 'server-only';

import { ENVIRONMENT_VARIABLES, UNITS } from '@dalashift/shared/constants';
import { provenancedValueSchema } from '@dalashift/shared/schemas';
import type { GeoJSONGeometry, ProvenancedValue } from '@dalashift/shared/types';
import { z } from 'zod';

import { buildGridCacheKey, getGeometryRepresentativePoint } from '../../geospatial';
import { readThroughObservationsCache } from '../cache';

const REQUEST_TIMEOUT_MS = 10_000;
const ONE_HOUR_SECONDS = 3_600;

export const OPEN_METEO_SOURCE = {
  id: 'open_meteo',
  endpoint: 'https://api.open-meteo.com/v1/forecast',
  spatialResolutionM: 9_000,
  temporalResolution: 'daily' as const,
  attribution:
    'Weather and soil moisture forecast data provided by Open-Meteo (https://open-meteo.com/) under CC BY 4.0.',
} as const;

const openMeteoResponseSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
  elevation: z.number().optional(),
  timezone: z.string().optional(),
  daily: z
    .object({
      time: z.array(z.string()),
      precipitation_sum: z.array(z.number().nullable()).optional(),
      temperature_2m_max: z.array(z.number().nullable()).optional(),
      temperature_2m_min: z.array(z.number().nullable()).optional(),
      temperature_2m_mean: z.array(z.number().nullable()).optional(),
      et0_fao_evapotranspiration: z.array(z.number().nullable()).optional(),
    })
    .optional(),
  hourly: z
    .object({
      time: z.array(z.string()),
      soil_moisture_0_to_1cm: z.array(z.number().nullable()).optional(),
      soil_moisture_3_to_9cm: z.array(z.number().nullable()).optional(),
      soil_moisture_9_to_27cm: z.array(z.number().nullable()).optional(),
    })
    .optional(),
});

export class OpenMeteoUpstreamError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'OpenMeteoUpstreamError';
  }
}

/**
 * Fetch 7-day weather, evapotranspiration and volumetric soil moisture
 * forecasts from Open-Meteo, cached per 0.1 deg (~9 km) cell for 1 hour per
 * docs/api/data-retrieval-strategy.md § 3 and § 8.
 */
export async function fetchOpenMeteoForecastCached(input: {
  readonly geometry: GeoJSONGeometry;
  readonly forecastDays?: number;
}): Promise<readonly ProvenancedValue[]> {
  const [longitude, latitude] = getGeometryRepresentativePoint(input.geometry);
  const forecastDays = Math.min(Math.max(input.forecastDays ?? 7, 1), 16);
  const runDateHour = new Date().toISOString().slice(0, 13);
  const cacheKey = buildGridCacheKey({
    sourceKey: OPEN_METEO_SOURCE.id,
    longitude,
    latitude,
    scope: `forecast:${forecastDays}d:${runDateHour}`,
  });

  return readThroughObservationsCache({
    sourceKey: OPEN_METEO_SOURCE.id,
    cacheKey,
    ttlSeconds: ONE_HOUR_SECONDS,
    fetcher: () =>
      fetchOpenMeteoForecastLive({
        longitude,
        latitude,
        forecastDays,
      }),
  });
}

export async function fetchOpenMeteoForecastLive(input: {
  readonly longitude: number;
  readonly latitude: number;
  readonly forecastDays?: number;
}): Promise<readonly ProvenancedValue[]> {
  const forecastDays = Math.min(Math.max(input.forecastDays ?? 7, 1), 16);
  const url = new URL(OPEN_METEO_SOURCE.endpoint);
  url.searchParams.set('latitude', String(input.latitude));
  url.searchParams.set('longitude', String(input.longitude));
  url.searchParams.set(
    'daily',
    [
      'precipitation_sum',
      'temperature_2m_max',
      'temperature_2m_min',
      'temperature_2m_mean',
      'et0_fao_evapotranspiration',
    ].join(','),
  );
  url.searchParams.set(
    'hourly',
    ['soil_moisture_0_to_1cm', 'soil_moisture_3_to_9cm', 'soil_moisture_9_to_27cm'].join(','),
  );
  url.searchParams.set('timezone', 'UTC');
  url.searchParams.set('forecast_days', String(forecastDays));

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      headers: { Accept: 'application/json' },
      signal: controller.signal,
      cache: 'no-store',
    });

    if (response.status === 429) {
      throw new OpenMeteoUpstreamError('Open-Meteo rate limit reached.');
    }
    if (!response.ok) {
      throw new OpenMeteoUpstreamError(`Open-Meteo returned HTTP ${response.status}.`);
    }

    const payload: unknown = await response.json();
    const parsed = openMeteoResponseSchema.safeParse(payload);
    if (!parsed.success) {
      throw new OpenMeteoUpstreamError('Open-Meteo returned an unexpected response.');
    }

    return normaliseOpenMeteoResponse(parsed.data);
  } catch (error) {
    if (error instanceof OpenMeteoUpstreamError) throw error;
    throw new OpenMeteoUpstreamError(
      error instanceof Error && error.name === 'AbortError'
        ? 'Open-Meteo request timed out.'
        : 'Open-Meteo could not be reached.',
    );
  } finally {
    clearTimeout(timeout);
  }
}

export function normaliseOpenMeteoResponse(
  payload: z.infer<typeof openMeteoResponseSchema>,
): readonly ProvenancedValue[] {
  const retrievedAt = new Date().toISOString();
  const output: ProvenancedValue[] = [];
  const returnedCenter = [payload.longitude, payload.latitude] as const;

  if (typeof payload.elevation === 'number' && Number.isFinite(payload.elevation)) {
    const elevationEntry = provenancedValueSchema.safeParse({
      variable: ENVIRONMENT_VARIABLES.elevation,
      value: payload.elevation,
      unit: UNITS.metre,
      sourceId: OPEN_METEO_SOURCE.id,
      spatialResolutionM: OPEN_METEO_SOURCE.spatialResolutionM,
      temporalResolution: 'climatology',
      observedAt: retrievedAt,
      retrievedAt,
      isModelled: true,
      aggregationMethod: 'grid_cell',
      qualityFlag: 'good',
      rawMetadata: {
        providerParameter: 'elevation',
        returnedGridCellCenter: returnedCenter,
      },
    });
    if (elevationEntry.success) output.push(elevationEntry.data);
  }

  const daily = payload.daily;
  if (daily) {
    const dailyMappings = [
      {
        variable: ENVIRONMENT_VARIABLES.precipitation,
        unit: UNITS.millimetre,
        series: daily.precipitation_sum,
        providerParameter: 'precipitation_sum',
      },
      {
        variable: ENVIRONMENT_VARIABLES.temperatureMean,
        unit: UNITS.degreeCelsius,
        series: daily.temperature_2m_mean,
        providerParameter: 'temperature_2m_mean',
      },
      {
        variable: ENVIRONMENT_VARIABLES.temperatureMax,
        unit: UNITS.degreeCelsius,
        series: daily.temperature_2m_max,
        providerParameter: 'temperature_2m_max',
      },
      {
        variable: ENVIRONMENT_VARIABLES.temperatureMin,
        unit: UNITS.degreeCelsius,
        series: daily.temperature_2m_min,
        providerParameter: 'temperature_2m_min',
      },
      {
        variable: ENVIRONMENT_VARIABLES.evapotranspiration,
        unit: UNITS.millimetre,
        series: daily.et0_fao_evapotranspiration,
        providerParameter: 'et0_fao_evapotranspiration',
      },
    ] as const;

    for (const mapping of dailyMappings) {
      if (!mapping.series) continue;
      daily.time.forEach((dateStr, index) => {
        const value = mapping.series?.[index];
        if (value === undefined || value === null || !Number.isFinite(value)) return;

        const parsed = provenancedValueSchema.safeParse({
          variable: mapping.variable,
          value,
          unit: mapping.unit,
          sourceId: OPEN_METEO_SOURCE.id,
          spatialResolutionM: OPEN_METEO_SOURCE.spatialResolutionM,
          temporalResolution: 'daily',
          observedAt: `${dateStr}T00:00:00.000Z`,
          retrievedAt,
          isModelled: true,
          aggregationMethod: 'grid_cell',
          qualityFlag: 'good',
          rawMetadata: {
            providerParameter: mapping.providerParameter,
            returnedGridCellCenter: returnedCenter,
            elevationM: payload.elevation ?? null,
            isForecast: true,
          },
        });
        if (parsed.success) output.push(parsed.data);
      });
    }
  }

  const hourly = payload.hourly;
  if (hourly) {
    const surfaceByDate = new Map<string, number[]>();
    const rootByDate = new Map<string, number[]>();

    hourly.time.forEach((isoTime, index) => {
      const dateStr = isoTime.slice(0, 10);
      const surfaceVal = hourly.soil_moisture_0_to_1cm?.[index];
      if (surfaceVal !== undefined && surfaceVal !== null && Number.isFinite(surfaceVal)) {
        const list = surfaceByDate.get(dateStr) ?? [];
        list.push(surfaceVal);
        surfaceByDate.set(dateStr, list);
      }

      const rootVal = hourly.soil_moisture_9_to_27cm?.[index];
      if (rootVal !== undefined && rootVal !== null && Number.isFinite(rootVal)) {
        const list = rootByDate.get(dateStr) ?? [];
        list.push(rootVal);
        rootByDate.set(dateStr, list);
      }
    });

    for (const [dateStr, values] of surfaceByDate.entries()) {
      const meanVal = Number((values.reduce((sum, v) => sum + v, 0) / values.length).toFixed(4));
      const parsed = provenancedValueSchema.safeParse({
        variable: ENVIRONMENT_VARIABLES.soilMoistureSurface,
        value: meanVal,
        unit: UNITS.cubicMetrePerCubicMetre,
        sourceId: OPEN_METEO_SOURCE.id,
        spatialResolutionM: OPEN_METEO_SOURCE.spatialResolutionM,
        temporalResolution: 'daily',
        observedAt: `${dateStr}T00:00:00.000Z`,
        retrievedAt,
        isModelled: true,
        aggregationMethod: 'grid_cell',
        qualityFlag: 'good',
        rawMetadata: {
          providerParameter: 'soil_moisture_0_to_1cm',
          depthLabel: '0-1cm',
          hourlySamplesAggregated: values.length,
          returnedGridCellCenter: returnedCenter,
        },
      });
      if (parsed.success) output.push(parsed.data);
    }

    for (const [dateStr, values] of rootByDate.entries()) {
      const meanVal = Number((values.reduce((sum, v) => sum + v, 0) / values.length).toFixed(4));
      const parsed = provenancedValueSchema.safeParse({
        variable: ENVIRONMENT_VARIABLES.soilMoistureRootZone,
        value: meanVal,
        unit: UNITS.cubicMetrePerCubicMetre,
        sourceId: OPEN_METEO_SOURCE.id,
        spatialResolutionM: OPEN_METEO_SOURCE.spatialResolutionM,
        temporalResolution: 'daily',
        observedAt: `${dateStr}T00:00:00.000Z`,
        retrievedAt,
        isModelled: true,
        aggregationMethod: 'grid_cell',
        qualityFlag: 'good',
        rawMetadata: {
          providerParameter: 'soil_moisture_9_to_27cm',
          depthLabel: '9-27cm',
          hourlySamplesAggregated: values.length,
          returnedGridCellCenter: returnedCenter,
        },
      });
      if (parsed.success) output.push(parsed.data);
    }
  }

  return output;
}
