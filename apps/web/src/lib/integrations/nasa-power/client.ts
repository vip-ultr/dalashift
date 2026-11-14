import 'server-only';

import { powerDailyResponseSchema } from './types';

const REQUEST_TIMEOUT_MS = 15_000;
const MAX_ATTEMPTS = 3;

export class PowerUpstreamError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PowerUpstreamError';
  }
}

export async function fetchPowerDaily(input: {
  readonly latitude: number;
  readonly longitude: number;
  readonly startDate: string;
  readonly endDate: string;
  readonly parameters: readonly string[];
}) {
  const url = new URL('https://power.larc.nasa.gov/api/temporal/daily/point');
  url.searchParams.set('parameters', input.parameters.join(','));
  url.searchParams.set('community', 'AG');
  url.searchParams.set('latitude', String(input.latitude));
  url.searchParams.set('longitude', String(input.longitude));
  url.searchParams.set('start', input.startDate.replaceAll('-', ''));
  url.searchParams.set('end', input.endDate.replaceAll('-', ''));
  url.searchParams.set('format', 'JSON');
  url.searchParams.set('time-standard', 'LST');

  return executePowerRequest(url);
}

/**
 * Fetch multi-year monthly and annual climatology from the documented
 * NASA POWER climatology point endpoint.
 */
export async function fetchPowerClimatology(input: {
  readonly latitude: number;
  readonly longitude: number;
  readonly parameters: readonly string[];
}) {
  const url = new URL('https://power.larc.nasa.gov/api/temporal/climatology/point');
  url.searchParams.set('parameters', input.parameters.join(','));
  url.searchParams.set('community', 'AG');
  url.searchParams.set('latitude', String(input.latitude));
  url.searchParams.set('longitude', String(input.longitude));
  url.searchParams.set('format', 'JSON');

  return executePowerRequest(url);
}

async function executePowerRequest(url: URL) {
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(url, {
        headers: { Accept: 'application/json' },
        signal: controller.signal,
        cache: 'no-store',
      });

      if (response.status === 404) {
        throw new PowerUpstreamError('NASA POWER has no data for this request.');
      }
      if (response.status === 429) {
        throw new PowerUpstreamError('NASA POWER is temporarily rate-limiting requests.');
      }
      if (!response.ok) {
        if (response.status >= 500 && attempt < MAX_ATTEMPTS - 1) {
          await delay(300 * 2 ** attempt);
          continue;
        }
        throw new PowerUpstreamError(`NASA POWER returned HTTP ${response.status}.`);
      }

      const payload: unknown = await response.json();
      const parsed = powerDailyResponseSchema.safeParse(payload);
      if (!parsed.success) {
        throw new PowerUpstreamError('NASA POWER returned an unexpected response.');
      }
      return parsed.data;
    } catch (error) {
      if (error instanceof PowerUpstreamError) throw error;
      if (attempt === MAX_ATTEMPTS - 1) {
        throw new PowerUpstreamError(
          error instanceof Error && error.name === 'AbortError'
            ? 'NASA POWER request timed out.'
            : 'NASA POWER could not be reached.',
        );
      }
      await delay(300 * 2 ** attempt);
    } finally {
      clearTimeout(timeout);
    }
  }

  throw new PowerUpstreamError('NASA POWER could not be reached.');
}

function delay(milliseconds: number) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}
