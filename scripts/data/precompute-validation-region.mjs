#!/usr/bin/env node
/**
 * Pre-compute and cache NASA POWER daily and climatology observations for the
 * Tofa LGA field validation region (Kano State, Nigeria; 12.05 N, 8.27 E).
 *
 * By default this script runs in dry-run mode and reports the target grid cell
 * and parameters. Pass `--apply` to fetch from the NASA POWER API and write
 * the provenanced JSON bundle to `data/processed/tofa-validation-power.json`
 * (gitignored).
 *
 * Usage:
 *   node scripts/data/precompute-validation-region.mjs [--apply] [--start=2025-05-01] [--end=2025-10-31]
 */

import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '../..');

const TOFA_COORDINATES = {
  name: 'Doka, Tofa LGA, Kano State, Nigeria',
  latitude: 12.05,
  longitude: 8.27,
};

const PARAMETERS = [
  'PRECTOTCORR',
  'T2M',
  'T2M_MAX',
  'T2M_MIN',
  'GWETTOP',
  'GWETROOT',
  'ALLSKY_SFC_SW_DWN',
  'RH2M',
  'WS2M',
];

function parseArgs(argv) {
  let apply = false;
  let start = '2025-05-01';
  let end = '2025-10-31';

  for (const arg of argv) {
    if (arg === '--apply') apply = true;
    if (arg.startsWith('--start=')) start = arg.slice('--start='.length);
    if (arg.startsWith('--end=')) end = arg.slice('--end='.length);
  }

  return { apply, start, end };
}

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: {
      Accept: 'application/json',
      'User-Agent': 'DalaShift/0.1 (validation-region-precompute)',
    },
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} from ${url}`);
  }
  return response.json();
}

async function main() {
  const { apply, start, end } = parseArgs(process.argv.slice(2));
  const compactStart = start.replaceAll('-', '');
  const compactEnd = end.replaceAll('-', '');

  const dailyUrl =
    `https://power.larc.nasa.gov/api/temporal/daily/point` +
    `?parameters=${PARAMETERS.join(',')}` +
    `&community=AG` +
    `&longitude=${TOFA_COORDINATES.longitude}` +
    `&latitude=${TOFA_COORDINATES.latitude}` +
    `&start=${compactStart}` +
    `&end=${compactEnd}` +
    `&format=JSON`;

  const climatologyUrl =
    `https://power.larc.nasa.gov/api/temporal/climatology/point` +
    `?parameters=PRECTOTCORR,T2M,T2M_MAX,T2M_MIN` +
    `&community=AG` +
    `&longitude=${TOFA_COORDINATES.longitude}` +
    `&latitude=${TOFA_COORDINATES.latitude}` +
    `&format=JSON`;

  console.log(`Target validation region: ${TOFA_COORDINATES.name}`);
  console.log(
    `Representative point: (${TOFA_COORDINATES.latitude}, ${TOFA_COORDINATES.longitude})`,
  );
  console.log(`Window: ${start} to ${end}`);
  console.log(`Daily endpoint: ${dailyUrl}`);
  console.log(`Climatology endpoint: ${climatologyUrl}`);

  if (!apply) {
    console.log(
      'Dry-run complete. Re-run with --apply to fetch from NASA POWER and write data/processed/tofa-validation-power.json.',
    );
    return;
  }

  const retrievedAt = new Date().toISOString();
  const [dailyPayload, climatologyPayload] = await Promise.all([
    fetchJson(dailyUrl),
    fetchJson(climatologyUrl),
  ]);

  const outDir = path.join(repoRoot, 'data', 'processed');
  await mkdir(outDir, { recursive: true });
  const outPath = path.join(outDir, 'tofa-validation-power.json');

  await writeFile(
    outPath,
    JSON.stringify(
      {
        region: TOFA_COORDINATES,
        retrievedAt,
        sourceId: 'nasa_power',
        spatialResolutionM: 55_000,
        isModelled: true,
        window: { start, end },
        daily: dailyPayload,
        climatology: climatologyPayload,
      },
      null,
      2,
    ) + '\n',
    'utf8',
  );

  console.log(`Wrote pre-computed validation bundle to ${outPath}`);
}

main().catch((err) => {
  console.error('Pre-computation failed:', err);
  process.exitCode = 1;
});
