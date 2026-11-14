import 'server-only';

import { z } from 'zod';

import { ENVIRONMENT_VARIABLES } from '@dalashift/shared/constants';
import { provenancedValueSchema } from '@dalashift/shared/schemas';
import type { ProvenancedValue, SourceQuery } from '@dalashift/shared/types';

import { buildGridCacheKey, getGeometryRepresentativePoint } from '../../geospatial';
import { readThroughObservationsCache } from '../cache';
import { fetchPowerClimatology, fetchPowerDaily } from './client';
import { NASA_POWER_DAILY_SOURCE, POWER_DAILY_PARAMETERS } from './params';

export { NASA_POWER_DAILY_SOURCE };

const supportedVariables = new Set<string>(Object.keys(POWER_DAILY_PARAMETERS));
const powerDateRangeSchema = z.object({
  startDate: z.string().date(),
  endDate: z.string().date(),
});

const CLIMATOLOGY_MONTH_KEYS: Record<
  string,
  { readonly monthIndex: number; readonly days: number }
> = {
  JAN: { monthIndex: 1, days: 31 },
  FEB: { monthIndex: 2, days: 28 },
  MAR: { monthIndex: 3, days: 31 },
  APR: { monthIndex: 4, days: 30 },
  MAY: { monthIndex: 5, days: 31 },
  JUN: { monthIndex: 6, days: 30 },
  JUL: { monthIndex: 7, days: 31 },
  AUG: { monthIndex: 8, days: 31 },
  SEP: { monthIndex: 9, days: 30 },
  OCT: { monthIndex: 10, days: 31 },
  NOV: { monthIndex: 11, days: 30 },
  DEC: { monthIndex: 12, days: 31 },
};

/** Fetch and normalize daily NASA POWER values for a PostGIS-supplied point. */
export async function fetchDaily(input: SourceQuery): Promise<readonly ProvenancedValue[]> {
  const dates = powerDateRangeSchema.safeParse(input);
  if (!dates.success || input.startDate > input.endDate) {
    throw new Error('NASA POWER requires a valid, ordered date range.');
  }
  if (input.geometry.type !== 'Point') {
    throw new Error('NASA POWER point requests require a point supplied by the server.');
  }
  if (input.variables.some((variable) => !supportedVariables.has(variable))) {
    throw new Error('The request includes a variable not supported by NASA POWER daily data.');
  }

  const [longitude, latitude] = input.geometry.coordinates;
  if (longitude === undefined || latitude === undefined) {
    throw new Error('The point coordinates are incomplete.');
  }
  if (longitude < -180 || longitude > 180 || latitude < -90 || latitude > 90) {
    throw new Error('The point coordinates are outside the valid longitude and latitude ranges.');
  }
  const mapping = input.variables.map((variable) => {
    const definition = POWER_DAILY_PARAMETERS[variable as keyof typeof POWER_DAILY_PARAMETERS];
    return { variable, ...definition };
  });

  const response = await fetchPowerDaily({
    latitude,
    longitude,
    startDate: input.startDate,
    endDate: input.endDate,
    parameters: mapping.map(({ parameter }) => parameter),
  });
  const retrievedAt = new Date().toISOString();
  const output: ProvenancedValue[] = [];

  for (const { variable, parameter, unit } of mapping) {
    const series = response.properties.parameter[parameter];
    if (!series) continue;

    for (const [date, value] of Object.entries(series)) {
      if (value === null || value === response.properties.header.fill_value) continue;
      const mapped = {
        variable,
        value,
        unit,
        sourceId: NASA_POWER_DAILY_SOURCE.id,
        spatialResolutionM: NASA_POWER_DAILY_SOURCE.spatialResolutionM,
        temporalResolution: NASA_POWER_DAILY_SOURCE.temporalResolution,
        observedAt: `${date.slice(0, 4)}-${date.slice(4, 6)}-${date.slice(6, 8)}T00:00:00.000Z`,
        retrievedAt,
        isModelled: true,
        aggregationMethod: 'grid_cell' as const,
        qualityFlag: 'good' as const,
        rawMetadata: {
          providerParameter: parameter,
          providerUnits: response.properties.parameters[parameter]?.units ?? null,
          timeStandard: response.properties.header.time_standard,
          sourceNames: response.properties.header.sources ?? [],
          providerMessages: response.properties.messages ?? [],
          returnedGridCellCenter: response.geometry.coordinates,
          gridLongitudeResolutionDegrees: 0.625,
          gridLatitudeResolutionDegrees: 0.5,
        },
      };

      const parsed = provenancedValueSchema.safeParse(mapped);
      if (parsed.success) output.push(parsed.data);
    }
  }

  return output;
}

/**
 * Fetch daily NASA POWER observations through the durable grid-cell cache.
 *
 * Per docs/api/data-retrieval-strategy.md § 8: windows older than 90 days are
 * frozen indefinitely; recent windows refresh every 24 hours.
 */
export async function fetchDailyCached(input: SourceQuery): Promise<readonly ProvenancedValue[]> {
  const [longitude, latitude] = getGeometryRepresentativePoint(input.geometry);
  const sortedVars = [...input.variables].sort().join(',');
  const cacheKey = buildGridCacheKey({
    sourceKey: NASA_POWER_DAILY_SOURCE.id,
    longitude,
    latitude,
    scope: `daily:${input.startDate}:${input.endDate}:${sortedVars}`,
  });

  const endTimestamp = Date.parse(`${input.endDate}T00:00:00.000Z`);
  const ninetyDaysAgo = Date.now() - 90 * 24 * 60 * 60 * 1000;
  const ttlSeconds = endTimestamp < ninetyDaysAgo ? null : 24 * 60 * 60;

  return readThroughObservationsCache({
    sourceKey: NASA_POWER_DAILY_SOURCE.id,
    cacheKey,
    ttlSeconds,
    fetcher: () =>
      fetchDaily({
        ...input,
        geometry: { type: 'Point', coordinates: [longitude, latitude] },
      }),
  });
}

/**
 * Fetch NASA POWER monthly climatology normals for a point or parcel centroid,
 * cached permanently per 0.5 x 0.625 deg grid cell.
 */
export async function fetchClimatologyCached(input: {
  readonly geometry: SourceQuery['geometry'];
  readonly variables?: readonly string[];
}): Promise<readonly ProvenancedValue[]> {
  const [longitude, latitude] = getGeometryRepresentativePoint(input.geometry);
  const requestedVariables = input.variables ?? [
    ENVIRONMENT_VARIABLES.precipitation,
    ENVIRONMENT_VARIABLES.temperatureMean,
  ];
  if (requestedVariables.some((variable) => !supportedVariables.has(variable))) {
    throw new Error('The request includes a variable not supported by NASA POWER climatology.');
  }

  const sortedVars = [...requestedVariables].sort().join(',');
  const cacheKey = buildGridCacheKey({
    sourceKey: NASA_POWER_DAILY_SOURCE.id,
    longitude,
    latitude,
    scope: `climatology:${sortedVars}`,
  });

  return readThroughObservationsCache({
    sourceKey: NASA_POWER_DAILY_SOURCE.id,
    cacheKey,
    ttlSeconds: null,
    fetcher: async () => {
      const mapping = requestedVariables.map((variable) => {
        const definition = POWER_DAILY_PARAMETERS[variable as keyof typeof POWER_DAILY_PARAMETERS];
        return { variable, ...definition };
      });

      const response = await fetchPowerClimatology({
        latitude,
        longitude,
        parameters: mapping.map(({ parameter }) => parameter),
      });

      const retrievedAt = new Date().toISOString();
      const output: ProvenancedValue[] = [];

      for (const { variable, parameter, unit } of mapping) {
        const series = response.properties.parameter[parameter];
        if (!series) continue;

        for (const [monthCode, monthMeta] of Object.entries(CLIMATOLOGY_MONTH_KEYS)) {
          const rawValue = series[monthCode];
          if (
            rawValue === undefined ||
            rawValue === null ||
            rawValue === response.properties.header.fill_value
          ) {
            continue;
          }
          const monthPadded = String(monthMeta.monthIndex).padStart(2, '0');
          const mapped = {
            variable,
            value: rawValue,
            unit,
            sourceId: NASA_POWER_DAILY_SOURCE.id,
            spatialResolutionM: NASA_POWER_DAILY_SOURCE.spatialResolutionM,
            temporalResolution: 'climatology' as const,
            observedAt: `2001-${monthPadded}-01T00:00:00.000Z`,
            retrievedAt,
            isModelled: true,
            aggregationMethod: 'grid_cell' as const,
            qualityFlag: 'good' as const,
            rawMetadata: {
              climatologyMonth: monthCode,
              daysInMonth: monthMeta.days,
              providerParameter: parameter,
              providerUnits: response.properties.parameters[parameter]?.units ?? null,
              returnedGridCellCenter: response.geometry.coordinates,
            },
          };

          const parsed = provenancedValueSchema.safeParse(mapped);
          if (parsed.success) output.push(parsed.data);
        }
      }

      return output;
    },
  });
}

export const NASA_POWER_VARIABLES = Object.values(ENVIRONMENT_VARIABLES).filter((variable) =>
  supportedVariables.has(variable),
);
