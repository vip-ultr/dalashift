import { describe, expect, it } from 'vitest';

import rawGazetteer from '../../../data/kano-places.json';
import { KANO_BBOX, KANO_PLACES, searchKanoPlaces } from '../geo/kano-search';

const [WEST, SOUTH, EAST, NORTH] = KANO_BBOX;

function isInBbox(lon: number, lat: number): boolean {
  return lon >= WEST && lon <= EAST && lat >= SOUTH && lat <= NORTH;
}

describe('searchKanoPlaces', () => {
  it('returns prefix matches first', () => {
    const results = searchKanoPlaces('daw');
    expect(results.length).toBeGreaterThanOrEqual(2);
    expect(results.map((place) => place.name)).toContain('Dawakin Kudu');
    expect(results.map((place) => place.name)).toContain('Dawakin Tofa');
    for (const place of results) {
      const candidates = [place.name, ...place.aliases];
      expect(candidates.some((candidate) => candidate.toLowerCase().startsWith('daw'))).toBe(true);
    }
  });

  it('finds a place through a common Hausa spelling alias', () => {
    const results = searchKanoPlaces('nasarawa');
    const names = results.map((place) => place.name);
    expect(names).toContain('Nassarawa');
    expect(results[0]?.kind).toBe('town');
  });

  it('tolerates one typo for queries of four characters or more', () => {
    expect(searchKanoPlaces('wudill').map((place) => place.name)).toContain('Wudil');
    expect(searchKanoPlaces('dawakin kutu').map((place) => place.name)).toContain('Dawakin Kudu');
  });

  it('does not use typo tolerance for short queries', () => {
    expect(searchKanoPlaces('kno')).toEqual([]);
  });

  it('rejects queries shorter than two characters', () => {
    expect(searchKanoPlaces('')).toEqual([]);
    expect(searchKanoPlaces('k')).toEqual([]);
    expect(searchKanoPlaces(' a ')).toEqual([]);
  });

  it('never returns a result outside the Kano bounding box', () => {
    for (const query of ['kano', 'bichi', 'gaya', 'wudil', 'dawakin']) {
      for (const place of searchKanoPlaces(query, 50)) {
        expect(isInBbox(place.lon, place.lat)).toBe(true);
      }
    }
  });

  it('respects the result limit', () => {
    expect(searchKanoPlaces('ka').length).toBeGreaterThan(2);
    expect(searchKanoPlaces('ka', 2)).toHaveLength(2);
    expect(searchKanoPlaces('kano').length).toBeLessThanOrEqual(6);
    expect(searchKanoPlaces('kano', 0)).toEqual([]);
  });

  it('ranks an exact alias above a substring match', () => {
    const results = searchKanoPlaces('kano');
    expect(results[0]?.name).toBe('Kano city');
  });
});

describe('Kano gazetteer', () => {
  it('uses the documented Kano State bounding box', () => {
    expect([...KANO_BBOX]).toEqual([7.693, 10.565, 9.339, 12.575]);
  });

  it('contains all 44 LGAs and 15 major towns', () => {
    expect(rawGazetteer.places).toHaveLength(59);
    expect(rawGazetteer.places.filter((place) => place.kind === 'lga')).toHaveLength(44);
    expect(rawGazetteer.places.filter((place) => place.kind === 'town')).toHaveLength(15);
    expect(KANO_PLACES).toHaveLength(rawGazetteer.places.length);
  });

  it('keeps every gazetteer entry inside the bounding box', () => {
    for (const place of rawGazetteer.places) {
      expect(isInBbox(place.lon, place.lat), `${place.name} outside Kano bbox`).toBe(true);
    }
  });
});
