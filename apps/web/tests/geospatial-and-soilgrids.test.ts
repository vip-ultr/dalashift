import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

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

describe('Open-Meteo and AppEEARS helpers', () => {
  it('normalises Open-Meteo daily and hourly soil moisture payloads with provenance', async () => {
    const { normaliseOpenMeteoResponse } = await import('../src/lib/integrations/open-meteo/index');
    const { formatAppEearsDate } = await import('../src/lib/integrations/appeears/index');

    expect(formatAppEearsDate('2025-05-14')).toBe('05-14-2025');

    const observations = normaliseOpenMeteoResponse({
      latitude: 12.05,
      longitude: 8.27,
      elevation: 500,
      daily: {
        time: ['2026-11-14'],
        precipitation_sum: [4.2],
        temperature_2m_mean: [27.5],
        temperature_2m_max: [33.1],
        temperature_2m_min: [21.4],
        et0_fao_evapotranspiration: [5.1],
      },
      hourly: {
        time: ['2026-11-14T00:00', '2026-11-14T01:00'],
        soil_moisture_0_to_1cm: [0.18, 0.2],
        soil_moisture_9_to_27cm: [0.24, 0.26],
      },
    });

    expect(observations.some((o) => o.variable === 'elevation_m' && o.value === 500)).toBe(true);
    expect(observations.some((o) => o.variable === 'precipitation_mm' && o.value === 4.2)).toBe(
      true,
    );
    expect(
      observations.some((o) => o.variable === 'soil_moisture_root_zone_m3_m3' && o.value === 0.25),
    ).toBe(true);
  });
});
