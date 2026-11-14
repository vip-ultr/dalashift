import 'server-only';

import { z } from 'zod';

import { ENVIRONMENT_VARIABLES } from '@dalashift/shared/constants';
import { provenancedValueSchema } from '@dalashift/shared/schemas';
import type { ProvenancedValue, SourceQuery } from '@dalashift/shared/types';

import { fetchPowerDaily } from './client';
import { NASA_POWER_DAILY_SOURCE, POWER_DAILY_PARAMETERS } from './params';

const supportedVariables = new Set<string>(Object.keys(POWER_DAILY_PARAMETERS));
const powerDateRangeSchema = z.object({
  startDate: z.string().date(),
  endDate: z.string().date(),
});

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

export const NASA_POWER_VARIABLES = Object.values(ENVIRONMENT_VARIABLES).filter((variable) =>
  supportedVariables.has(variable),
);
