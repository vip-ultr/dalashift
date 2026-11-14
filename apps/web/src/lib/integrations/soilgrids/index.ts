import 'server-only';

import type { GeoJSONGeometry, ProvenancedValue } from '@dalashift/shared/types';

import { buildGridCacheKey, getGeometryRepresentativePoint } from '../../geospatial';
import { readThroughObservationsCache } from '../cache';
import { normaliseSoilGridsResponse } from './normalise';
import { SOILGRIDS_PROPERTIES, SOILGRIDS_SOURCE, soilGridsResponseSchema } from './types';

const REQUEST_TIMEOUT_MS = 10_000;

export class SoilGridsUpstreamError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SoilGridsUpstreamError';
  }
}

/**
 * Fetch or read cached SoilGrids 2.0 soil properties for a parcel geometry.
 *
 * Because the ISRIC SoilGrids REST endpoint is rate-limited (5 calls/minute)
 * and intermittently degraded (see docs/api/data-sources.md § 6), results are
 * cached permanently per 250 m cell in `public.external_cache`.
 */
export async function fetchSoilGridsCached(input: {
  readonly geometry: GeoJSONGeometry;
  readonly depthLabel?: string;
}): Promise<readonly ProvenancedValue[]> {
  const [longitude, latitude] = getGeometryRepresentativePoint(input.geometry);
  const depthLabel = input.depthLabel ?? '0-5cm';
  const cacheKey = buildGridCacheKey({
    sourceKey: SOILGRIDS_SOURCE.id,
    longitude,
    latitude,
    scope: `properties:${depthLabel}`,
  });

  return readThroughObservationsCache({
    sourceKey: SOILGRIDS_SOURCE.id,
    cacheKey,
    ttlSeconds: null,
    fetcher: () =>
      fetchSoilGridsLive({
        longitude,
        latitude,
        depthLabel,
      }),
  });
}

export async function fetchSoilGridsLive(input: {
  readonly longitude: number;
  readonly latitude: number;
  readonly depthLabel?: string;
}): Promise<readonly ProvenancedValue[]> {
  const depthLabel = input.depthLabel ?? '0-5cm';
  const url = new URL(SOILGRIDS_SOURCE.endpoint);
  url.searchParams.set('lon', String(input.longitude));
  url.searchParams.set('lat', String(input.latitude));
  for (const meta of Object.values(SOILGRIDS_PROPERTIES)) {
    url.searchParams.append('property', meta.property);
  }
  url.searchParams.append('depth', depthLabel);
  url.searchParams.append('value', 'mean');
  url.searchParams.append('value', 'Q0.05');
  url.searchParams.append('value', 'Q0.5');
  url.searchParams.append('value', 'Q0.95');

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      headers: { Accept: 'application/json' },
      signal: controller.signal,
      cache: 'no-store',
    });

    if (response.status === 429) {
      throw new SoilGridsUpstreamError(
        'ISRIC SoilGrids rate limit reached (5 requests per minute).',
      );
    }
    if (!response.ok) {
      throw new SoilGridsUpstreamError(`ISRIC SoilGrids returned HTTP ${response.status}.`);
    }

    const payload: unknown = await response.json();
    const parsed = soilGridsResponseSchema.safeParse(payload);
    if (!parsed.success) {
      throw new SoilGridsUpstreamError('ISRIC SoilGrids returned an unexpected response.');
    }

    return normaliseSoilGridsResponse(parsed.data, { targetDepthLabel: depthLabel });
  } catch (error) {
    if (error instanceof SoilGridsUpstreamError) throw error;
    throw new SoilGridsUpstreamError(
      error instanceof Error && error.name === 'AbortError'
        ? 'ISRIC SoilGrids request timed out.'
        : 'ISRIC SoilGrids could not be reached.',
    );
  } finally {
    clearTimeout(timeout);
  }
}

export { normaliseSoilGridsResponse } from './normalise';
export { SOILGRIDS_PROPERTIES, SOILGRIDS_SOURCE } from './types';
