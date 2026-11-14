import 'server-only';

import { z } from 'zod';

import { provenancedValueSchema } from '@dalashift/shared/schemas';
import type { ProvenancedValue } from '@dalashift/shared/types';

import { buildGridCellFootprint } from '../geospatial';
import { createServiceRoleClient } from '../supabase/service';

const cachedPayloadSchema = z.array(provenancedValueSchema);

/** In-flight promise map for request coalescing within a single warm instance. */
const inFlightRequests = new Map<string, Promise<readonly ProvenancedValue[]>>();

/**
 * Read-through cache backed by `public.external_cache` when the service-role
 * client is configured, with in-memory request coalescing so concurrent calls
 * for the same grid cell never trigger duplicate upstream HTTP requests.
 */
export async function readThroughObservationsCache(input: {
  readonly sourceKey: string;
  readonly cacheKey: string;
  readonly ttlSeconds: number | null;
  readonly fetcher: () => Promise<readonly ProvenancedValue[]>;
}): Promise<readonly ProvenancedValue[]> {
  const compositeKey = `${input.sourceKey}::${input.cacheKey}`;
  const existingInFlight = inFlightRequests.get(compositeKey);
  if (existingInFlight) {
    return existingInFlight;
  }

  const task = executeCacheReadOrFetch(input).finally(() => {
    inFlightRequests.delete(compositeKey);
  });

  inFlightRequests.set(compositeKey, task);
  return task;
}

async function executeCacheReadOrFetch(input: {
  readonly sourceKey: string;
  readonly cacheKey: string;
  readonly ttlSeconds: number | null;
  readonly fetcher: () => Promise<readonly ProvenancedValue[]>;
}): Promise<readonly ProvenancedValue[]> {
  const serviceClient = createServiceRoleClient();

  if (serviceClient) {
    const nowIso = new Date().toISOString();
    const { data: cached } = await serviceClient
      .from('external_cache')
      .select('normalized_payload, expires_at')
      .eq('source_key', input.sourceKey)
      .eq('cache_key', input.cacheKey)
      .maybeSingle();

    if (cached && (!cached.expires_at || cached.expires_at > nowIso)) {
      const parsed = cachedPayloadSchema.safeParse(cached.normalized_payload);
      if (parsed.success) {
        return parsed.data;
      }
    }
  }

  const fresh = await input.fetcher();
  const validated = cachedPayloadSchema.parse(fresh);

  if (serviceClient) {
    const fetchedAt = new Date();
    const expiresAt =
      input.ttlSeconds === null
        ? null
        : new Date(fetchedAt.getTime() + input.ttlSeconds * 1000).toISOString();

    await serviceClient.from('external_cache').upsert(
      {
        source_key: input.sourceKey,
        cache_key: input.cacheKey,
        normalized_payload: validated,
        fetched_at: fetchedAt.toISOString(),
        expires_at: expiresAt,
      },
      { onConflict: 'source_key,cache_key' },
    );
  }

  return validated;
}

/**
 * Persist normalized observations and their coarse grid cell footprint into
 * `public.grid_cells` and `public.environmental_observations` when the
 * service-role client is configured.
 */
export async function persistObservationsForParcel(input: {
  readonly parcelId: string | null;
  readonly sourceKey: string;
  readonly longitude: number;
  readonly latitude: number;
  readonly observations: readonly ProvenancedValue[];
}): Promise<void> {
  if (input.observations.length === 0) return;

  const serviceClient = createServiceRoleClient();
  if (!serviceClient) return;

  const footprint = buildGridCellFootprint(input.sourceKey, input.longitude, input.latitude);
  const wktRing = footprint.polygon.coordinates[0].map(([lon, lat]) => `${lon} ${lat}`).join(', ');

  const { data: cellRow } = await serviceClient
    .from('grid_cells')
    .upsert(
      {
        source_key: input.sourceKey,
        cell_key: footprint.cellKey,
        geometry: `SRID=4326;POLYGON((${wktRing}))`,
      },
      { onConflict: 'source_key,cell_key' },
    )
    .select('id')
    .maybeSingle();

  const gridCellId = (cellRow as { id?: string } | null)?.id ?? null;
  if (!input.parcelId && !gridCellId) return;

  const rows = input.observations.map((obs) => ({
    parcel_id: input.parcelId,
    grid_cell_id: gridCellId,
    source_key: obs.sourceId,
    variable: obs.variable,
    value: obs.value,
    unit: obs.unit,
    spatial_resolution_m: obs.spatialResolutionM,
    temporal_resolution: obs.temporalResolution,
    observed_at: obs.observedAt,
    retrieved_at: obs.retrievedAt,
    is_modelled: obs.isModelled,
    aggregation_method: obs.aggregationMethod ?? 'grid_cell',
    quality_flag: obs.qualityFlag ?? (obs.value === null ? 'missing' : 'good'),
    coverage_fraction: obs.coverageFraction ?? null,
    raw_metadata: obs.rawMetadata ?? {},
  }));

  await serviceClient.from('environmental_observations').upsert(rows, {
    onConflict: input.parcelId
      ? 'parcel_id,source_key,variable,observed_at,aggregation_method'
      : 'grid_cell_id,parcel_id,source_key,variable,observed_at,aggregation_method',
  });
}
