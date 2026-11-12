import { describe, expect, it } from 'vitest';

import { RESOLUTION_DESCRIPTIONS, SPATIAL_RESOLUTION_METRES } from '../constants';
import { provenancedValueSchema } from '../schemas';

describe('SPATIAL_RESOLUTION_METRES', () => {
  it('records the real resolution of each source, not a flattering one', () => {
    expect(SPATIAL_RESOLUTION_METRES.powerLatitude).toBe(55_000);
    expect(SPATIAL_RESOLUTION_METRES.powerLongitude).toBe(70_000);
    expect(SPATIAL_RESOLUTION_METRES.smapSoilMoisture).toBe(9000);
    expect(SPATIAL_RESOLUTION_METRES.gpmImerg).toBe(11_132);
    expect(SPATIAL_RESOLUTION_METRES.soilGrids).toBe(250);
    expect(SPATIAL_RESOLUTION_METRES.landsat).toBe(30);
    expect(SPATIAL_RESOLUTION_METRES.sentinel2).toBe(10);
  });

  it('has a plain-language description for every resolution key', () => {
    const keys = Object.keys(SPATIAL_RESOLUTION_METRES) as (keyof typeof RESOLUTION_DESCRIPTIONS)[];
    for (const key of keys) {
      expect(RESOLUTION_DESCRIPTIONS[key]).toBeTruthy();
    }
  });
});

describe('provenancedValueSchema', () => {
  const valid = {
    variable: 'precipitation_mm',
    value: 12.4,
    unit: 'mm',
    sourceId: 'nasa-power',
    spatialResolutionM: 55_000,
    temporalResolution: 'daily',
    observedAt: '2026-11-12T00:00:00.000Z',
    retrievedAt: '2026-11-13T09:00:00.000Z',
    isModelled: true,
    coverageFraction: 1,
  } as const;

  it('accepts a complete observation', () => {
    expect(provenancedValueSchema.safeParse(valid).success).toBe(true);
  });

  it('rejects an observation with no source', () => {
    const { sourceId: _sourceId, ...withoutSource } = valid;
    expect(provenancedValueSchema.safeParse(withoutSource).success).toBe(false);
  });

  it('rejects an observation with no spatial resolution', () => {
    const { spatialResolutionM: _r, ...withoutResolution } = valid;
    expect(provenancedValueSchema.safeParse(withoutResolution).success).toBe(false);
  });

  it('rejects a coverage fraction outside 0–1', () => {
    expect(provenancedValueSchema.safeParse({ ...valid, coverageFraction: 1.5 }).success).toBe(
      false,
    );
    expect(provenancedValueSchema.safeParse({ ...valid, coverageFraction: -0.1 }).success).toBe(
      false,
    );
  });

  it('rejects a non-finite value', () => {
    expect(provenancedValueSchema.safeParse({ ...valid, value: Number.NaN }).success).toBe(false);
  });
});
