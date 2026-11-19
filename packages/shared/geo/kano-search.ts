/**
 * Offline, dependency-free place search for Kano State.
 *
 * WHY this is bundled: the map search must answer instantly, with no network,
 * no geocoding token and no rate limit. A small gazetteer of the 44 LGAs and
 * major towns is enough to get a farmer to the right part of Kano, and it
 * keeps working on a patchy connection.
 *
 * WHY the bounding box is enforced here: the map only covers Kano State. A
 * result outside the box would fly the camera to somewhere the map cannot
 * show, so coordinates are validated before a place can be returned.
 */

import rawGazetteer from '../../../data/kano-places.json';

/** `[west, south, east, north]`, the Kano State extent from the ACReSAL profile. */
export const KANO_BBOX = [7.693, 10.565, 9.339, 12.575] as const;

export type KanoBbox = typeof KANO_BBOX;

/** One searchable place. Coordinates are WGS84 degrees, longitude then latitude. */
export type KanoPlace = {
  readonly name: string;
  readonly aliases: readonly string[];
  readonly kind: 'lga' | 'town';
  readonly lon: number;
  readonly lat: number;
};

/** WHY a helper: the same check guards both the data load and every search result. */
function isWithinBbox(lon: number, lat: number): boolean {
  return (
    Number.isFinite(lon) &&
    Number.isFinite(lat) &&
    lon >= KANO_BBOX[0] &&
    lon <= KANO_BBOX[2] &&
    lat >= KANO_BBOX[1] &&
    lat <= KANO_BBOX[3]
  );
}

/**
 * WHY we validate at runtime: the JSON is editable data, not compiled code. A
 * bad row must be skipped rather than sent to the map as a fly-to target.
 */
function isKanoPlace(value: unknown): value is KanoPlace {
  if (typeof value !== 'object' || value === null) return false;
  const record = value as Record<string, unknown>;
  if (typeof record['name'] !== 'string' || record['name'].length === 0) return false;
  if (!Array.isArray(record['aliases'])) return false;
  if (!record['aliases'].every((alias) => typeof alias === 'string')) return false;
  if (record['kind'] !== 'lga' && record['kind'] !== 'town') return false;
  if (typeof record['lon'] !== 'number' || typeof record['lat'] !== 'number') return false;
  return isWithinBbox(record['lon'], record['lat']);
}

const placesFromData: unknown = (rawGazetteer as { places?: unknown }).places;

/** Every gazetteer row that survived validation. Exported for callers that list all places. */
export const KANO_PLACES: readonly KanoPlace[] = Array.isArray(placesFromData)
  ? placesFromData.filter(isKanoPlace)
  : [];

/** WHY normalize: farmers type lowercase and with stray spaces, so case and whitespace must not matter. */
function normalize(value: string): string {
  return value.toLowerCase().trim().replace(/\s+/g, ' ');
}

/**
 * True when `a` and `b` differ by at most one insert, delete or substitution.
 *
 * WHY a bounded edit distance: full Levenshtein is unnecessary here. We only
 * need to know whether a short query is one keystroke away from a place name,
 * so the function exits as soon as a second edit is found.
 */
function isOneEditOrLess(a: string, b: string): boolean {
  if (a === b) return true;
  if (Math.abs(a.length - b.length) > 1) return false;

  let i = 0;
  let j = 0;
  let edits = 0;
  while (i < a.length && j < b.length) {
    if (a.charAt(i) === b.charAt(j)) {
      i += 1;
      j += 1;
      continue;
    }
    edits += 1;
    if (edits > 1) return false;
    if (a.length > b.length) i += 1;
    else if (a.length < b.length) j += 1;
    else {
      i += 1;
      j += 1;
    }
  }
  if (i < a.length || j < b.length) edits += 1;
  return edits <= 1;
}

const EXACT = 0;
const PREFIX = 1;
const SUBSTRING = 2;
const TYPO = 3;

/** Best rank for a place against a query. Lower is better. `null` means no match. */
function bestRank(place: KanoPlace, query: string): number | null {
  let best: number | null = null;
  for (const candidate of [place.name, ...place.aliases]) {
    const text = normalize(candidate);
    let rank: number;
    if (text === query) rank = EXACT;
    else if (text.startsWith(query)) rank = PREFIX;
    else if (text.includes(query)) rank = SUBSTRING;
    else if (query.length >= 4 && isOneEditOrLess(query, text)) rank = TYPO;
    else continue;

    if (best === null || rank < best) best = rank;
    if (best === EXACT) break;
  }
  return best;
}

/** WHY towns first on a tie: a town is a tighter fly-to target than its LGA. */
const KIND_RANK: Record<KanoPlace['kind'], number> = { town: 0, lga: 1 };

/**
 * Find Kano places for a query, offline.
 *
 * Matching is case-insensitive and ranked: exact name or alias, then prefix,
 * then substring, then a single typo for queries of four characters or more.
 * Ties are broken by kind (town before LGA) and then name, so results are
 * deterministic. Queries shorter than two characters return nothing.
 */
export function searchKanoPlaces(query: string, limit = 6): readonly KanoPlace[] {
  const normalizedQuery = normalize(query);
  if (normalizedQuery.length < 2) return [];
  if (!Number.isFinite(limit) || limit <= 0) return [];

  const scored: Array<{ place: KanoPlace; rank: number }> = [];
  for (const place of KANO_PLACES) {
    const rank = bestRank(place, normalizedQuery);
    if (rank !== null) scored.push({ place, rank });
  }

  scored.sort(
    (a, b) =>
      a.rank - b.rank ||
      KIND_RANK[a.place.kind] - KIND_RANK[b.place.kind] ||
      a.place.name.localeCompare(b.place.name),
  );

  return scored.slice(0, limit).map((entry) => entry.place);
}
