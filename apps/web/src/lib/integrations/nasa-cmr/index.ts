import 'server-only';

import { z } from 'zod';

const cmrGranuleEntrySchema = z.object({
  id: z.string(),
  title: z.string().optional(),
  dataset_id: z.string().optional(),
  data_center: z.string().optional(),
  time_start: z.string(),
  time_end: z.string().optional(),
  granule_size: z.string().optional(),
  cloud_cover: z.string().optional(),
  online_access_flag: z.boolean().optional(),
  links: z
    .array(
      z.object({
        rel: z.string().optional(),
        href: z.string(),
        type: z.string().optional(),
      }),
    )
    .optional(),
});

const cmrGranuleSearchResponseSchema = z.object({
  feed: z.object({
    entry: z.array(cmrGranuleEntrySchema),
  }),
});

export interface CmrGranuleMetadata {
  readonly id: string;
  readonly datasetId: string | null;
  readonly dataCenter: string | null;
  readonly timeStart: string;
  readonly timeEnd: string | null;
  readonly cloudCoverPct: number | null;
  readonly downloadUrl: string | null;
}

export class CmrUpstreamError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CmrUpstreamError';
  }
}

/**
 * Search NASA Earthdata Common Metadata Repository (CMR) granules for a
 * bounding box and date window.
 *
 * Uses the live-verified `page_size` parameter (never `limit`, which CMR
 * rejects with HTTP 400; see docs/api/data-sources.md § 8.3).
 */
export async function searchCmrGranules(input: {
  readonly shortName: 'SPL3SMP_E' | 'MOD13Q1' | 'MOD11A2';
  readonly version: '006' | '061';
  readonly boundingBox: readonly [number, number, number, number];
  readonly startDate?: string;
  readonly endDate?: string;
  readonly pageSize?: number;
}): Promise<readonly CmrGranuleMetadata[]> {
  const url = new URL('https://cmr.earthdata.nasa.gov/search/granules.json');
  url.searchParams.set('short_name', input.shortName);
  url.searchParams.set('version', input.version);
  url.searchParams.set('bounding_box', input.boundingBox.join(','));
  url.searchParams.set('page_size', String(Math.min(Math.max(input.pageSize ?? 10, 1), 50)));
  url.searchParams.set('sort_key', '-start_date');

  if (input.startDate && input.endDate) {
    url.searchParams.set('temporal', `${input.startDate}T00:00:00Z,${input.endDate}T23:59:59Z`);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12_000);

  try {
    const response = await fetch(url, {
      headers: { Accept: 'application/json' },
      signal: controller.signal,
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new CmrUpstreamError(`NASA CMR returned HTTP ${response.status}.`);
    }

    const payload: unknown = await response.json();
    const parsed = cmrGranuleSearchResponseSchema.safeParse(payload);
    if (!parsed.success) {
      throw new CmrUpstreamError('NASA CMR returned an unexpected granule response.');
    }

    return parsed.data.feed.entry.map((entry) => {
      const cloudCoverNumber =
        entry.cloud_cover !== undefined ? Number(entry.cloud_cover) : Number.NaN;
      const dataLink = entry.links?.find((link) => link.rel?.includes('/data#'))?.href ?? null;
      return {
        id: entry.id,
        datasetId: entry.dataset_id ?? null,
        dataCenter: entry.data_center ?? null,
        timeStart: entry.time_start,
        timeEnd: entry.time_end ?? null,
        cloudCoverPct: Number.isFinite(cloudCoverNumber) ? cloudCoverNumber : null,
        downloadUrl: dataLink,
      };
    });
  } catch (error) {
    if (error instanceof CmrUpstreamError) throw error;
    throw new CmrUpstreamError(
      error instanceof Error && error.name === 'AbortError'
        ? 'NASA CMR granule search timed out.'
        : 'NASA CMR could not be reached.',
    );
  } finally {
    clearTimeout(timeout);
  }
}
