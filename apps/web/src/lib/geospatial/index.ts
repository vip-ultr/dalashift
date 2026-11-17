import { SPATIAL_RESOLUTION_METRES } from '@dalashift/shared/constants';
import type { GeoJSONGeometry, Limitation } from '@dalashift/shared/types';

type Language = 'en' | 'ha';

/**
 * Grid cell specification for coarse environmental sources.
 *
 * Rounding coordinates to the source grid cell ensures that neighbouring
 * parcels inside the same 55 km POWER cell or 250 m SoilGrids cell share one
 * cached response and one grid_cells footprint row.
 */
export interface GridCellFootprint {
  readonly sourceKey: string;
  readonly cellKey: string;
  readonly center: readonly [number, number];
  readonly polygon: {
    readonly type: 'Polygon';
    readonly coordinates: readonly [readonly (readonly [number, number])[]];
  };
}

/** Extract a representative [longitude, latitude] point from a valid GeoJSON geometry. */
export function getGeometryRepresentativePoint(
  geometry: GeoJSONGeometry,
): readonly [number, number] {
  if (geometry.type === 'Point') {
    const [lon, lat] = geometry.coordinates;
    validateCoordinates(lon, lat);
    return [lon, lat];
  }

  const ring = geometry.type === 'Polygon' ? geometry.coordinates[0] : geometry.coordinates[0]?.[0];

  if (!ring || ring.length === 0) {
    throw new Error('Polygon geometry contains no coordinate ring.');
  }

  // Exclude the closing duplicate vertex when averaging ring vertices.
  const vertices =
    ring.length > 1 &&
    ring[0]?.[0] === ring[ring.length - 1]?.[0] &&
    ring[0]?.[1] === ring[ring.length - 1]?.[1]
      ? ring.slice(0, -1)
      : ring;

  let sumLon = 0;
  let sumLat = 0;
  for (const vertex of vertices) {
    const [lon, lat] = vertex;
    validateCoordinates(lon, lat);
    sumLon += lon;
    sumLat += lat;
  }

  return [
    Number((sumLon / vertices.length).toFixed(6)),
    Number((sumLat / vertices.length).toFixed(6)),
  ];
}

/** Snap a coordinate pair to its source grid cell and build the cell polygon in SRID 4326. */
export function buildGridCellFootprint(
  sourceKey: string,
  longitude: number,
  latitude: number,
): GridCellFootprint {
  validateCoordinates(longitude, latitude);

  const step = getGridStepDegrees(sourceKey);
  const centerLon = roundToStep(longitude, step.lonStep);
  const centerLat = roundToStep(latitude, step.latStep);
  const halfLon = step.lonStep / 2;
  const halfLat = step.latStep / 2;

  const west = Number(Math.max(-180, centerLon - halfLon).toFixed(6));
  const east = Number(Math.min(180, centerLon + halfLon).toFixed(6));
  const south = Number(Math.max(-90, centerLat - halfLat).toFixed(6));
  const north = Number(Math.min(90, centerLat + halfLat).toFixed(6));

  return {
    sourceKey,
    cellKey: `${sourceKey}:${centerLat.toFixed(4)}:${centerLon.toFixed(4)}`,
    center: [Number(centerLon.toFixed(6)), Number(centerLat.toFixed(6))],
    polygon: {
      type: 'Polygon',
      coordinates: [
        [
          [west, south],
          [east, south],
          [east, north],
          [west, north],
          [west, south],
        ],
      ],
    },
  };
}

/** Build a deterministic cache key for a source, coordinate pair, variable set and period. */
export function buildGridCacheKey(input: {
  readonly sourceKey: string;
  readonly longitude: number;
  readonly latitude: number;
  readonly scope: string;
}): string {
  const footprint = buildGridCellFootprint(input.sourceKey, input.longitude, input.latitude);
  return `${footprint.cellKey}:${input.scope}`;
}

/**
 * Compare a dataset's spatial resolution against a parcel's area in hectares.
 *
 * Returns an explicit `coarse_resolution` limitation whenever a single pixel
 * covers more area than the parcel itself, so the interface never presents a
 * regional or neighbourhood pixel as a field-level measurement.
 */
export function describeSpatialScaleMismatch(
  input: {
    readonly sourceName: string;
    readonly spatialResolutionM: number;
    readonly parcelAreaHa: number | null;
  },
  language: Language = 'en',
): Limitation | null {
  const pixelAreaHa = (input.spatialResolutionM * input.spatialResolutionM) / 10_000;
  const targetAreaHa = input.parcelAreaHa && input.parcelAreaHa > 0 ? input.parcelAreaHa : 1;

  if (pixelAreaHa <= targetAreaHa * 2) {
    return null;
  }

  const resolutionLabel =
    input.spatialResolutionM >= 1000
      ? `${(input.spatialResolutionM / 1000).toFixed(input.spatialResolutionM % 1000 === 0 ? 0 : 1)} km`
      : `${input.spatialResolutionM} m`;

  return {
    kind: 'coarse_resolution',
    statement: `${input.sourceName} has a spatial resolution of ${resolutionLabel} (about ${Math.round(pixelAreaHa).toLocaleString(language === 'ha' ? 'ha-NG' : 'en-US')} ha per grid cell), which is much coarser than a ${targetAreaHa.toFixed(2)} ha parcel and describes the surrounding area rather than the individual field.`,
  };
}

function getGridStepDegrees(sourceKey: string): {
  readonly latStep: number;
  readonly lonStep: number;
} {
  switch (sourceKey) {
    case 'nasa_power':
    case 'nasa_power_daily':
      // Verified live in docs/api/data-sources.md § 1: 0.5 deg lat x 0.625 deg lon.
      return { latStep: 0.5, lonStep: 0.625 };
    case 'gpm_imerg_v07':
    case 'open_meteo':
      return { latStep: 0.1, lonStep: 0.1 };
    case 'smap_l3_enhanced':
    case 'smap_spl3smp_e':
      return { latStep: 0.09, lonStep: 0.09 };
    case 'chirps_v3':
    case 'chirps_v2':
      return { latStep: 0.05, lonStep: 0.05 };
    case 'soilgrids':
    case 'soilgrids_250m_v2':
    case 'modis_mod13q1_v061':
    case 'modis_mod13q1':
      return { latStep: 0.0025, lonStep: 0.0025 };
    case 'landsat_c2_l2':
    case 'srtm_gl1':
      return { latStep: 0.0003, lonStep: 0.0003 };
    case 'modis_mod11a2_v061':
      return { latStep: 0.01, lonStep: 0.01 };
    default:
      return {
        latStep: SPATIAL_RESOLUTION_METRES.soilGrids / 111_320,
        lonStep: SPATIAL_RESOLUTION_METRES.soilGrids / 111_320,
      };
  }
}

function roundToStep(value: number, step: number): number {
  return Math.round(value / step) * step;
}

function validateCoordinates(longitude: number, latitude: number): void {
  if (
    !Number.isFinite(longitude) ||
    !Number.isFinite(latitude) ||
    longitude < -180 ||
    longitude > 180 ||
    latitude < -90 ||
    latitude > 90
  ) {
    throw new Error('Coordinates must be finite numbers within [-180, 180] and [-90, 90].');
  }
}
