import { provenancedValueSchema } from '@dalashift/shared/schemas';
import type { ProvenancedValue } from '@dalashift/shared/types';

import { SOILGRIDS_PROPERTIES, SOILGRIDS_SOURCE, type SoilGridsResponse } from './types';

const propertyToVariable = new Map<
  string,
  { readonly variable: string; readonly unit: string; readonly expectedDFactor: number }
>(
  Object.entries(SOILGRIDS_PROPERTIES).map(([variable, meta]) => [
    meta.property,
    { variable, unit: meta.unit, expectedDFactor: meta.expectedDFactor },
  ]),
);

/**
 * Convert an ISRIC SoilGrids response into ProvenancedValue records.
 *
 * Applies the layer's `d_factor` so mapped integers (such as `phh2o = 67`)
 * become canonical units (`6.7`). Null values from SoilGrids data voids are
 * preserved as `value: null` with `qualityFlag: 'missing'`, never converted
 * to zero.
 */
export function normaliseSoilGridsResponse(
  response: SoilGridsResponse,
  options?: { readonly retrievedAt?: string; readonly targetDepthLabel?: string },
): readonly ProvenancedValue[] {
  const retrievedAt = options?.retrievedAt ?? new Date().toISOString();
  const targetDepth = options?.targetDepthLabel ?? '0-5cm';
  const results: ProvenancedValue[] = [];

  for (const layer of response.properties.layers) {
    const mapping = propertyToVariable.get(layer.name);
    if (!mapping) continue;

    const dFactor = layer.unit_measure.d_factor || mapping.expectedDFactor;
    const depthEntry = layer.depths.find((depth) => depth.label === targetDepth) ?? layer.depths[0];
    if (!depthEntry) continue;

    const rawMean = depthEntry.values.mean ?? depthEntry.values['Q0.5'] ?? null;
    const rawQ05 = depthEntry.values['Q0.05'] ?? null;
    const rawQ50 = depthEntry.values['Q0.5'] ?? null;
    const rawQ95 = depthEntry.values['Q0.95'] ?? null;

    const convertedValue = rawMean === null ? null : Number((rawMean / dFactor).toFixed(3));
    const uncertaintyRatio =
      rawQ05 !== null && rawQ95 !== null && rawQ50 !== null && rawQ50 !== 0
        ? Number(((rawQ95 - rawQ05) / rawQ50).toFixed(3))
        : depthEntry.values.uncertainty !== undefined && depthEntry.values.uncertainty !== null
          ? Number((depthEntry.values.uncertainty / dFactor).toFixed(3))
          : null;

    const candidate = {
      variable: mapping.variable,
      value: convertedValue,
      unit: mapping.unit,
      sourceId: SOILGRIDS_SOURCE.id,
      spatialResolutionM: SOILGRIDS_SOURCE.spatialResolutionM,
      temporalResolution: SOILGRIDS_SOURCE.temporalResolution,
      observedAt: '2020-05-01T00:00:00.000Z',
      retrievedAt,
      isModelled: true,
      aggregationMethod: 'interpolated_point' as const,
      qualityFlag: convertedValue === null ? ('missing' as const) : ('good' as const),
      coverageFraction: convertedValue === null ? 0 : 1,
      rawMetadata: {
        property: layer.name,
        depthLabel: depthEntry.label,
        dFactor,
        mappedUnits: layer.unit_measure.mapped_units ?? null,
        targetUnits: layer.unit_measure.target_units ?? null,
        q05: rawQ05 === null ? null : Number((rawQ05 / dFactor).toFixed(3)),
        q50: rawQ50 === null ? null : Number((rawQ50 / dFactor).toFixed(3)),
        q95: rawQ95 === null ? null : Number((rawQ95 / dFactor).toFixed(3)),
        uncertaintyRatio,
        coordinates: response.geometry.coordinates,
      },
    };

    const parsed = provenancedValueSchema.safeParse(candidate);
    if (parsed.success) {
      results.push(parsed.data);
    }
  }

  return results;
}
