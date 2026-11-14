import { describe, expect, it } from 'vitest';

import {
  buildGridCacheKey,
  buildGridCellFootprint,
  describeSpatialScaleMismatch,
  getGeometryRepresentativePoint,
} from '../src/lib/geospatial';
import { normaliseSoilGridsResponse } from '../src/lib/integrations/soilgrids/normalise';
import type { SoilGridsResponse } from '../src/lib/integrations/soilgrids/types';

describe('geospatial utilities', () => {
  it('snaps coordinates in the same 0.5 x 0.625 deg NASA POWER cell to the same key', () => {
    const first = buildGridCacheKey({
      sourceKey: 'nasa_power',
      longitude: 8.27,
      latitude: 12.05,
      scope: 'climatology',
    });
    const second = buildGridCacheKey({
      sourceKey: 'nasa_power',
      longitude: 8.31,
      latitude: 12.11,
      scope: 'climatology',
    });
    expect(first).toBe(second);

    const footprint = buildGridCellFootprint('nasa_power', 8.27, 12.05);
    expect(footprint.polygon.type).toBe('Polygon');
    expect(footprint.polygon.coordinates[0]).toHaveLength(5);
  });

  it('extracts a representative point from Point and Polygon geometries', () => {
    expect(
      getGeometryRepresentativePoint({
        type: 'Point',
        coordinates: [8.27, 12.05],
      }),
    ).toEqual([8.27, 12.05]);

    const polygonCenter = getGeometryRepresentativePoint({
      type: 'Polygon',
      coordinates: [
        [
          [8.26, 12.04],
          [8.28, 12.04],
          [8.28, 12.06],
          [8.26, 12.06],
          [8.26, 12.04],
        ],
      ],
    });
    expect(polygonCenter[0]).toBeCloseTo(8.27, 5);
    expect(polygonCenter[1]).toBeCloseTo(12.05, 5);
  });

  it('describes coarse resolution honestly when a dataset pixel exceeds parcel area', () => {
    const powerMismatch = describeSpatialScaleMismatch({
      sourceName: 'NASA POWER',
      spatialResolutionM: 55_000,
      parcelAreaHa: 1.5,
    });
    expect(powerMismatch?.kind).toBe('coarse_resolution');
    expect(powerMismatch?.statement).toContain('55 km');

    const landsatMatch = describeSpatialScaleMismatch({
      sourceName: 'Landsat C2',
      spatialResolutionM: 30,
      parcelAreaHa: 3,
    });
    expect(landsatMatch).toBeNull();
  });
});

describe('normaliseSoilGridsResponse', () => {
  it('converts mapped integers using d_factor and preserves null data voids as missing', () => {
    const fixture: SoilGridsResponse = {
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [8.5, 12.0],
      },
      properties: {
        layers: [
          {
            name: 'phh2o',
            unit_measure: {
              d_factor: 10,
              mapped_units: 'pH*10',
              target_units: '-',
            },
            depths: [
              {
                label: '0-5cm',
                values: {
                  mean: 67,
                  'Q0.05': 58,
                  'Q0.5': 66,
                  'Q0.95': 74,
                },
              },
            ],
          },
          {
            name: 'clay',
            unit_measure: {
              d_factor: 10,
              mapped_units: 'g/kg',
              target_units: '%',
            },
            depths: [
              {
                label: '0-5cm',
                values: {
                  mean: null,
                  'Q0.5': null,
                },
              },
            ],
          },
        ],
      },
    };

    const normalised = normaliseSoilGridsResponse(fixture, {
      retrievedAt: '2026-11-14T18:00:00.000Z',
    });

    const ph = normalised.find((item) => item.variable === 'soil_ph');
    expect(ph?.value).toBe(6.7);
    expect(ph?.qualityFlag).toBe('good');
    expect(ph?.spatialResolutionM).toBe(250);
    expect(ph?.isModelled).toBe(true);

    const clay = normalised.find((item) => item.variable === 'soil_clay_pct');
    expect(clay?.value).toBeNull();
    expect(clay?.qualityFlag).toBe('missing');
    expect(clay?.coverageFraction).toBe(0);
  });
});
