import { describe, expect, it } from 'vitest';

import { RESOLUTION_DESCRIPTIONS, SPATIAL_RESOLUTION_METRES } from '../constants';
import {
  farmCropInputSchema,
  farmInputSchema,
  farmerPrioritiesInputSchema,
  parcelInputSchema,
  provenancedValueSchema,
} from '../schemas';

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

  it('rejects a coverage fraction outside 0 to 1', () => {
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

describe('farmerPrioritiesInputSchema', () => {
  const farmId = 'a0000000-0000-4000-8000-000000000001';

  it('accepts valid goals and planting triggers', () => {
    const res = farmerPrioritiesInputSchema.safeParse({
      farmId,
      goals: ['improve_soil_fertility', 'reduce_risk'],
      plantingTrigger: 'wait_for_confirmed_moisture',
      riskTolerance: null,
      openToChange: null,
    });
    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.data.goals).toEqual(['improve_soil_fertility', 'reduce_risk']);
    }
  });

  it('normalizes drought_tolerance alias safely to reduce_risk', () => {
    const res = farmerPrioritiesInputSchema.safeParse({
      farmId,
      goals: ['improve_soil_fertility', 'drought_tolerance'],
      plantingTrigger: 'plant_on_first_rains',
      riskTolerance: null,
      openToChange: null,
    });
    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.data.goals).toContain('reduce_risk');
    }
  });

  it('handles null or empty inputs gracefully', () => {
    const res = farmerPrioritiesInputSchema.safeParse({
      farmId,
      goals: null,
      plantingTrigger: '',
      riskTolerance: '',
      openToChange: null,
    });
    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.data.goals).toEqual([]);
      expect(res.data.plantingTrigger).toBeNull();
      expect(res.data.riskTolerance).toBeNull();
    }
  });
});

describe('farmInputSchema', () => {
  it('accepts valid input and normalizes borehole alias to well', () => {
    const res = farmInputSchema.safeParse({
      name: 'Test Holding',
      farmingMethod: 'irrigated',
      irrigationMethod: 'borehole',
      soilNotes: '',
    });
    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.data.irrigationMethod).toBe('well');
      expect(res.data.soilNotes).toBeNull();
    }
  });

  it('normalizes canal to furrow and other to unknown', () => {
    const resCanal = farmInputSchema.safeParse({
      name: 'Canal Farm',
      farmingMethod: 'mixed',
      irrigationMethod: 'canal',
    });
    expect(resCanal.success).toBe(true);
    if (resCanal.success) {
      expect(resCanal.data.irrigationMethod).toBe('furrow');
    }

    const resOther = farmInputSchema.safeParse({
      name: 'Other Farm',
      farmingMethod: 'unknown',
      irrigationMethod: 'other',
    });
    expect(resOther.success).toBe(true);
    if (resOther.success) {
      expect(resOther.data.irrigationMethod).toBe('unknown');
    }
  });
});

describe('parcelInputSchema', () => {
  const farmId = 'a0000000-0000-4000-8000-000000000001';

  it('accepts gps_point and normalizes string uncertainty and alias', () => {
    const res = parcelInputSchema.safeParse({
      farmId,
      name: 'Parcel 1',
      geometry: { type: 'Point', coordinates: [8.42, 11.97] },
      geometryMethod: 'point',
      locationUncertaintyM: '250',
    });
    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.data.geometryMethod).toBe('gps_point');
      expect(res.data.locationUncertaintyM).toBe(250);
    }
  });
});

describe('farmCropInputSchema', () => {
  const farmId = 'a0000000-0000-4000-8000-000000000001';
  const cropId = 'b0000000-0000-4000-8000-000000000002';

  it('normalizes aliases for crop status, season, and intended use', () => {
    const res = farmCropInputSchema.safeParse({
      farmId,
      cropId,
      status: 'past',
      season: 'wet',
      intendedUse: 'market',
      plantingDate: '',
      areaHa: '',
    });
    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.data.status).toBe('previous');
      expect(res.data.season).toBe('rainy');
      expect(res.data.intendedUse).toBe('commercial');
      expect(res.data.plantingDate).toBeNull();
      expect(res.data.areaHa).toBeNull();
    }
  });
});
