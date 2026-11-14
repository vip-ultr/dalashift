#!/usr/bin/env node
/**
 * Pre-compute and cache NASA POWER daily + climatology observations, Open-Meteo
 * high-resolution weather and soil moisture forecasts, NASA CMR granule metadata,
 * and NASA AppEEARS product layer catalogs for the Tofa LGA field validation
 * region (Kano State, Nigeria; 12.05 N, 8.27 E).
 *
 * By default this script runs in dry-run mode and reports the target grid cell
 * and parameters. Pass `--apply` to fetch from the APIs, write the provenanced
 * JSON bundle to `data/processed/tofa-validation-power.json` (gitignored), and
 * seed `public.grid_cells`, `public.external_cache`, and
 * `public.environmental_observations` on the configured Supabase database.
 *
 * Usage:
 *   node scripts/data/precompute-validation-region.mjs [--apply] [--start=2025-05-01] [--end=2025-10-31]
 */

import dns from 'node:dns';
import { existsSync, readFileSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import net from 'node:net';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

dns.setDefaultResultOrder('ipv4first');
if (typeof net.setDefaultAutoSelectFamily === 'function') {
  net.setDefaultAutoSelectFamily(false);
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '../..');

const TOFA_COORDINATES = {
  name: 'Doka, Tofa LGA, Kano State, Nigeria',
  latitude: 12.05,
  longitude: 8.27,
  boundingBox: [8.2, 12.0, 8.35, 12.1],
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

const CANONICAL_POWER_MAP = [
  { variable: 'precipitation_mm', parameter: 'PRECTOTCORR', unit: 'mm' },
  { variable: 'temperature_mean_degC', parameter: 'T2M', unit: 'degC' },
  { variable: 'temperature_max_degC', parameter: 'T2M_MAX', unit: 'degC' },
  { variable: 'temperature_min_degC', parameter: 'T2M_MIN', unit: 'degC' },
  { variable: 'soil_wetness_root_zone', parameter: 'GWETROOT', unit: '1' },
];

const CLIMATOLOGY_MONTHS = {
  JAN: { monthIndex: 1, days: 31 },
  FEB: { monthIndex: 2, days: 28 },
  MAR: { monthIndex: 3, days: 31 },
  APR: { monthIndex: 4, days: 30 },
  MAY: { monthIndex: 5, days: 31 },
  JUN: { monthIndex: 6, days: 30 },
  JUL: { monthIndex: 7, days: 31 },
  AUG: { monthIndex: 8, days: 31 },
  SEP: { monthIndex: 9, days: 30 },
  OCT: { monthIndex: 10, days: 31 },
  NOV: { monthIndex: 11, days: 30 },
  DEC: { monthIndex: 12, days: 31 },
};

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

async function fetchJsonWithRetry(url, maxAttempts = 3) {
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    try {
      const response = await fetch(url, {
        headers: {
          Accept: 'application/json',
          'User-Agent': 'DalaShift/0.1 (validation-region-precompute)',
        },
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status} from ${url}`);
      }
      return await response.json();
    } catch (error) {
      if (attempt === maxAttempts - 1) throw error;
      await new Promise((resolve) => setTimeout(resolve, 500 * 2 ** attempt));
    }
  }
  throw new Error(`Unreachable: ${url}`);
}

function normaliseDailyPayload(payload, retrievedAt) {
  const fillValue = payload?.properties?.header?.fill_value ?? -999;
  const output = [];

  for (const { variable, parameter, unit } of CANONICAL_POWER_MAP) {
    const series = payload?.properties?.parameter?.[parameter];
    if (!series) continue;

    for (const [dateStr, value] of Object.entries(series)) {
      if (value === null || value === undefined || value === fillValue) continue;
      output.push({
        variable,
        value,
        unit,
        sourceId: 'nasa_power',
        spatialResolutionM: 55_000,
        temporalResolution: 'daily',
        observedAt: `${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}T00:00:00.000Z`,
        retrievedAt,
        isModelled: true,
        aggregationMethod: 'grid_cell',
        qualityFlag: 'good',
        rawMetadata: {
          providerParameter: parameter,
          providerUnits: payload?.properties?.parameters?.[parameter]?.units ?? null,
          timeStandard: payload?.properties?.header?.time_standard ?? 'LST',
          sourceNames: payload?.properties?.header?.sources ?? [],
          returnedGridCellCenter: payload?.geometry?.coordinates ?? [8.27, 12.05],
          gridLongitudeResolutionDegrees: 0.625,
          gridLatitudeResolutionDegrees: 0.5,
        },
      });
    }
  }

  return output;
}

function normaliseClimatologyPayload(payload, retrievedAt) {
  const fillValue = payload?.properties?.header?.fill_value ?? -999;
  const output = [];

  for (const { variable, parameter, unit } of CANONICAL_POWER_MAP.slice(0, 4)) {
    const series = payload?.properties?.parameter?.[parameter];
    if (!series) continue;

    for (const [monthCode, monthMeta] of Object.entries(CLIMATOLOGY_MONTHS)) {
      const value = series[monthCode];
      if (value === null || value === undefined || value === fillValue) continue;
      const monthPadded = String(monthMeta.monthIndex).padStart(2, '0');
      output.push({
        variable,
        value,
        unit,
        sourceId: 'nasa_power',
        spatialResolutionM: 55_000,
        temporalResolution: 'climatology',
        observedAt: `2001-${monthPadded}-01T00:00:00.000Z`,
        retrievedAt,
        isModelled: true,
        aggregationMethod: 'grid_cell',
        qualityFlag: 'good',
        rawMetadata: {
          climatologyMonth: monthCode,
          daysInMonth: monthMeta.days,
          providerParameter: parameter,
          providerUnits: payload?.properties?.parameters?.[parameter]?.units ?? null,
          returnedGridCellCenter: payload?.geometry?.coordinates ?? [8.27, 12.05],
        },
      });
    }
  }

  return output;
}

function normaliseOpenMeteoPayload(payload, retrievedAt) {
  const output = [];
  const returnedCenter = [payload.longitude, payload.latitude];

  const daily = payload.daily;
  if (daily && Array.isArray(daily.time)) {
    const dailyMappings = [
      {
        variable: 'precipitation_mm',
        unit: 'mm',
        series: daily.precipitation_sum,
        providerParameter: 'precipitation_sum',
      },
      {
        variable: 'temperature_mean_degC',
        unit: 'degC',
        series: daily.temperature_2m_mean,
        providerParameter: 'temperature_2m_mean',
      },
      {
        variable: 'temperature_max_degC',
        unit: 'degC',
        series: daily.temperature_2m_max,
        providerParameter: 'temperature_2m_max',
      },
      {
        variable: 'temperature_min_degC',
        unit: 'degC',
        series: daily.temperature_2m_min,
        providerParameter: 'temperature_2m_min',
      },
      {
        variable: 'evapotranspiration_mm_day',
        unit: 'mm',
        series: daily.et0_fao_evapotranspiration,
        providerParameter: 'et0_fao_evapotranspiration',
      },
    ];

    for (const mapping of dailyMappings) {
      if (!Array.isArray(mapping.series)) continue;
      daily.time.forEach((dateStr, index) => {
        const value = mapping.series[index];
        if (value === null || value === undefined || !Number.isFinite(value)) return;
        output.push({
          variable: mapping.variable,
          value,
          unit: mapping.unit,
          sourceId: 'open_meteo',
          spatialResolutionM: 9000,
          temporalResolution: 'daily',
          observedAt: `${dateStr}T00:00:00.000Z`,
          retrievedAt,
          isModelled: true,
          aggregationMethod: 'grid_cell',
          qualityFlag: 'good',
          rawMetadata: {
            providerParameter: mapping.providerParameter,
            returnedGridCellCenter: returnedCenter,
            elevationM: payload.elevation ?? null,
            isForecast: true,
          },
        });
      });
    }
  }

  const hourly = payload.hourly;
  if (hourly && Array.isArray(hourly.time)) {
    const surfaceByDate = new Map();
    const rootByDate = new Map();

    hourly.time.forEach((isoTime, index) => {
      const dateStr = isoTime.slice(0, 10);
      const surfaceVal = hourly.soil_moisture_0_to_1cm?.[index];
      if (surfaceVal !== null && surfaceVal !== undefined && Number.isFinite(surfaceVal)) {
        const list = surfaceByDate.get(dateStr) ?? [];
        list.push(surfaceVal);
        surfaceByDate.set(dateStr, list);
      }
      const rootVal = hourly.soil_moisture_9_to_27cm?.[index];
      if (rootVal !== null && rootVal !== undefined && Number.isFinite(rootVal)) {
        const list = rootByDate.get(dateStr) ?? [];
        list.push(rootVal);
        rootByDate.set(dateStr, list);
      }
    });

    for (const [dateStr, values] of surfaceByDate.entries()) {
      const meanVal = Number((values.reduce((sum, v) => sum + v, 0) / values.length).toFixed(4));
      output.push({
        variable: 'soil_moisture_surface_m3_m3',
        value: meanVal,
        unit: 'm3_m3',
        sourceId: 'open_meteo',
        spatialResolutionM: 9000,
        temporalResolution: 'daily',
        observedAt: `${dateStr}T00:00:00.000Z`,
        retrievedAt,
        isModelled: true,
        aggregationMethod: 'grid_cell',
        qualityFlag: 'good',
        rawMetadata: {
          providerParameter: 'soil_moisture_0_to_1cm',
          depthLabel: '0-1cm',
          returnedGridCellCenter: returnedCenter,
        },
      });
    }

    for (const [dateStr, values] of rootByDate.entries()) {
      const meanVal = Number((values.reduce((sum, v) => sum + v, 0) / values.length).toFixed(4));
      output.push({
        variable: 'soil_moisture_root_zone_m3_m3',
        value: meanVal,
        unit: 'm3_m3',
        sourceId: 'open_meteo',
        spatialResolutionM: 9000,
        temporalResolution: 'daily',
        observedAt: `${dateStr}T00:00:00.000Z`,
        retrievedAt,
        isModelled: true,
        aggregationMethod: 'grid_cell',
        qualityFlag: 'good',
        rawMetadata: {
          providerParameter: 'soil_moisture_9_to_27cm',
          depthLabel: '9-27cm',
          returnedGridCellCenter: returnedCenter,
        },
      });
    }
  }

  return output;
}

function loadSupabaseEnv() {
  const envPath = path.join(repoRoot, 'apps', 'web', '.env.local');
  if (!existsSync(envPath)) return null;

  const text = readFileSync(envPath, 'utf8');
  const map = Object.fromEntries(
    text
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith('#') && line.includes('='))
      .map((line) => {
        const idx = line.indexOf('=');
        return [
          line.slice(0, idx).trim(),
          line
            .slice(idx + 1)
            .trim()
            .replace(/^["']|["']$/g, ''),
        ];
      }),
  );

  if (!map.NEXT_PUBLIC_SUPABASE_URL || !map.SUPABASE_SERVICE_ROLE_KEY) return null;
  return {
    url: map.NEXT_PUBLIC_SUPABASE_URL,
    serviceKey: map.SUPABASE_SERVICE_ROLE_KEY,
  };
}

async function seedLiveSupabase({
  supabaseEnv,
  retrievedAt,
  start,
  end,
  dailyNormalized,
  climatologyNormalized,
  openMeteoNormalized,
  smapGranules,
  modisGranules,
  appEearsCatalog,
}) {
  const headers = {
    apikey: supabaseEnv.serviceKey,
    Authorization: `Bearer ${supabaseEnv.serviceKey}`,
    'Content-Type': 'application/json',
    Prefer: 'resolution=merge-duplicates,return=representation',
  };

  const gridCells = [
    {
      source_key: 'nasa_power',
      cell_key: 'nasa_power:12.0000:8.1250',
      geometry:
        'SRID=4326;POLYGON((7.8125 11.75, 8.4375 11.75, 8.4375 12.25, 7.8125 12.25, 7.8125 11.75))',
    },
    {
      source_key: 'open_meteo',
      cell_key: 'open_meteo:12.1000:8.3000',
      geometry: 'SRID=4326;POLYGON((8.25 12.05, 8.35 12.05, 8.35 12.15, 8.25 12.15, 8.25 12.05))',
    },
    {
      source_key: 'smap_l3_enhanced',
      cell_key: 'smap_l3_enhanced:12.0600:8.2800',
      geometry:
        'SRID=4326;POLYGON((8.235 12.015, 8.325 12.015, 8.325 12.105, 8.235 12.105, 8.235 12.015))',
    },
    {
      source_key: 'modis_mod13q1_v061',
      cell_key: 'modis_mod13q1_v061:12.0500:8.2700',
      geometry:
        'SRID=4326;POLYGON((8.26875 12.04875, 8.27125 12.04875, 8.27125 12.05125, 8.26875 12.05125, 8.26875 12.04875))',
    },
    {
      source_key: 'soilgrids',
      cell_key: 'soilgrids:12.0500:8.2700',
      geometry:
        'SRID=4326;POLYGON((8.26875 12.04875, 8.27125 12.04875, 8.27125 12.05125, 8.26875 12.05125, 8.26875 12.04875))',
    },
  ];

  const cellRes = await fetch(
    `${supabaseEnv.url}/rest/v1/grid_cells?on_conflict=source_key,cell_key`,
    {
      method: 'POST',
      headers,
      body: JSON.stringify(gridCells),
    },
  );
  if (!cellRes.ok) {
    throw new Error(`Failed to upsert grid_cells: HTTP ${cellRes.status} ${await cellRes.text()}`);
  }
  const insertedCells = await cellRes.json();
  const powerCell = insertedCells.find((c) => c.source_key === 'nasa_power');
  const openMeteoCell = insertedCells.find((c) => c.source_key === 'open_meteo');

  const threeVarSet = new Set([
    'precipitation_mm',
    'soil_wetness_root_zone',
    'temperature_mean_degC',
  ]);
  const climDefaultSet = new Set(['precipitation_mm', 'temperature_mean_degC']);
  const runDateHour = retrievedAt.slice(0, 13);

  const cacheEntries = [
    {
      source_key: 'nasa_power',
      cache_key: `nasa_power:12.0000:8.1250:daily:${start}:${end}:precipitation_mm,soil_wetness_root_zone,temperature_max_degC,temperature_mean_degC,temperature_min_degC`,
      normalized_payload: dailyNormalized,
      fetched_at: retrievedAt,
      expires_at: null,
    },
    {
      source_key: 'nasa_power',
      cache_key: `nasa_power:12.0000:8.1250:daily:${start}:${end}:precipitation_mm,soil_wetness_root_zone,temperature_mean_degC`,
      normalized_payload: dailyNormalized.filter((item) => threeVarSet.has(item.variable)),
      fetched_at: retrievedAt,
      expires_at: null,
    },
    {
      source_key: 'nasa_power',
      cache_key: 'nasa_power:12.0000:8.1250:climatology:precipitation_mm,temperature_mean_degC',
      normalized_payload: climatologyNormalized.filter((item) => climDefaultSet.has(item.variable)),
      fetched_at: retrievedAt,
      expires_at: null,
    },
    {
      source_key: 'open_meteo',
      cache_key: `open_meteo:12.1000:8.3000:forecast:7d:${runDateHour}`,
      normalized_payload: openMeteoNormalized,
      fetched_at: retrievedAt,
      expires_at: new Date(Date.now() + 3600 * 1000).toISOString(),
    },
    {
      source_key: 'smap_l3_enhanced',
      cache_key: 'smap_l3_enhanced:12.0600:8.2800:cmr_granules:v006',
      normalized_payload: smapGranules,
      fetched_at: retrievedAt,
      expires_at: null,
    },
    {
      source_key: 'modis_mod13q1_v061',
      cache_key: 'modis_mod13q1_v061:12.0500:8.2700:cmr_granules:v061',
      normalized_payload: modisGranules,
      fetched_at: retrievedAt,
      expires_at: null,
    },
    {
      source_key: 'modis_mod13q1_v061',
      cache_key: 'modis_mod13q1_v061:12.0500:8.2700:appeears_layers:v061',
      normalized_payload: appEearsCatalog,
      fetched_at: retrievedAt,
      expires_at: null,
    },
  ];

  const cacheRes = await fetch(
    `${supabaseEnv.url}/rest/v1/external_cache?on_conflict=source_key,cache_key`,
    {
      method: 'POST',
      headers,
      body: JSON.stringify(cacheEntries),
    },
  );
  if (!cacheRes.ok) {
    throw new Error(
      `Failed to upsert external_cache: HTTP ${cacheRes.status} ${await cacheRes.text()}`,
    );
  }

  const allObs = [];
  if (powerCell?.id) {
    for (const obs of [...dailyNormalized, ...climatologyNormalized]) {
      allObs.push({
        parcel_id: null,
        grid_cell_id: powerCell.id,
        source_key: obs.sourceId,
        variable: obs.variable,
        value: obs.value,
        unit: obs.unit,
        spatial_resolution_m: obs.spatialResolutionM,
        temporal_resolution: obs.temporalResolution,
        observed_at: obs.observedAt,
        retrieved_at: obs.retrievedAt,
        is_modelled: obs.isModelled,
        aggregation_method: obs.aggregationMethod,
        quality_flag: obs.qualityFlag,
        coverage_fraction: null,
        raw_metadata: obs.rawMetadata,
      });
    }
  }

  if (openMeteoCell?.id) {
    for (const obs of openMeteoNormalized) {
      allObs.push({
        parcel_id: null,
        grid_cell_id: openMeteoCell.id,
        source_key: obs.sourceId,
        variable: obs.variable,
        value: obs.value,
        unit: obs.unit,
        spatial_resolution_m: obs.spatialResolutionM,
        temporal_resolution: obs.temporalResolution,
        observed_at: obs.observedAt,
        retrieved_at: obs.retrievedAt,
        is_modelled: obs.isModelled,
        aggregation_method: obs.aggregationMethod,
        quality_flag: obs.qualityFlag,
        coverage_fraction: null,
        raw_metadata: obs.rawMetadata,
      });
    }
  }

  if (allObs.length > 0) {
    const obsRes = await fetch(
      `${supabaseEnv.url}/rest/v1/environmental_observations?on_conflict=grid_cell_id,parcel_id,source_key,variable,observed_at,aggregation_method`,
      {
        method: 'POST',
        headers: {
          ...headers,
          Prefer: 'resolution=merge-duplicates,return=minimal',
        },
        body: JSON.stringify(allObs),
      },
    );
    if (!obsRes.ok) {
      throw new Error(
        `Failed to upsert environmental_observations: HTTP ${obsRes.status} ${await obsRes.text()}`,
      );
    }
    console.log(
      `Seeded live Supabase: ${insertedCells.length} grid_cells, ${cacheEntries.length} external_cache entries, and ${allObs.length} environmental_observations rows.`,
    );
  }
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
    `&time-standard=LST` +
    `&format=JSON`;

  const climatologyUrl =
    `https://power.larc.nasa.gov/api/temporal/climatology/point` +
    `?parameters=PRECTOTCORR,T2M,T2M_MAX,T2M_MIN,GWETROOT` +
    `&community=AG` +
    `&longitude=${TOFA_COORDINATES.longitude}` +
    `&latitude=${TOFA_COORDINATES.latitude}` +
    `&format=JSON`;

  const openMeteoUrl =
    `https://api.open-meteo.com/v1/forecast` +
    `?latitude=${TOFA_COORDINATES.latitude}&longitude=${TOFA_COORDINATES.longitude}` +
    `&daily=precipitation_sum,temperature_2m_max,temperature_2m_min,temperature_2m_mean,et0_fao_evapotranspiration` +
    `&hourly=soil_moisture_0_to_1cm,soil_moisture_3_to_9cm,soil_moisture_9_to_27cm` +
    `&timezone=UTC&forecast_days=7`;

  const bbox = TOFA_COORDINATES.boundingBox.join(',');
  const smapCmrUrl =
    `https://cmr.earthdata.nasa.gov/search/granules.json` +
    `?short_name=SPL3SMP_E&version=006&bounding_box=${bbox}&page_size=5&sort_key=-start_date`;
  const modisCmrUrl =
    `https://cmr.earthdata.nasa.gov/search/granules.json` +
    `?short_name=MOD13Q1&version=061&bounding_box=${bbox}&page_size=5&sort_key=-start_date`;
  const appEearsModisUrl = `https://appeears.earthdatacloud.nasa.gov/api/product/MOD13Q1.061`;

  console.log(`Target validation region: ${TOFA_COORDINATES.name}`);
  console.log(
    `Representative point: (${TOFA_COORDINATES.latitude}, ${TOFA_COORDINATES.longitude})`,
  );
  console.log(`Window: ${start} to ${end}`);
  console.log(`Daily endpoint: ${dailyUrl}`);
  console.log(`Climatology endpoint: ${climatologyUrl}`);
  console.log(`Open-Meteo endpoint: ${openMeteoUrl}`);

  if (!apply) {
    console.log(
      'Dry-run complete. Re-run with --apply to fetch from NASA POWER, Open-Meteo, NASA CMR, and NASA AppEEARS, write data/processed/tofa-validation-power.json, and seed Supabase.',
    );
    return;
  }

  const retrievedAt = new Date().toISOString();
  const dailyPayload = await fetchJsonWithRetry(dailyUrl);
  const climatologyPayload = await fetchJsonWithRetry(climatologyUrl);
  const openMeteoPayload = await fetchJsonWithRetry(openMeteoUrl);
  const smapPayload = await fetchJsonWithRetry(smapCmrUrl);
  const modisPayload = await fetchJsonWithRetry(modisCmrUrl);
  const appEearsCatalog = await fetchJsonWithRetry(appEearsModisUrl);

  const dailyNormalized = normaliseDailyPayload(dailyPayload, retrievedAt);
  const climatologyNormalized = normaliseClimatologyPayload(climatologyPayload, retrievedAt);
  const openMeteoNormalized = normaliseOpenMeteoPayload(openMeteoPayload, retrievedAt);
  const smapGranules = (smapPayload?.feed?.entry ?? []).map((entry) => ({
    id: entry.id,
    title: entry.title ?? null,
    datasetId: entry.dataset_id ?? null,
    timeStart: entry.time_start,
    timeEnd: entry.time_end ?? null,
  }));
  const modisGranules = (modisPayload?.feed?.entry ?? []).map((entry) => ({
    id: entry.id,
    title: entry.title ?? null,
    datasetId: entry.dataset_id ?? null,
    timeStart: entry.time_start,
    timeEnd: entry.time_end ?? null,
  }));

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
        dailyObservationsCount: dailyNormalized.length,
        climatologyObservationsCount: climatologyNormalized.length,
        openMeteoObservationsCount: openMeteoNormalized.length,
        smapGranules,
        modisGranules,
        appEearsModisLayers: Object.keys(appEearsCatalog ?? {}),
        daily: dailyPayload,
        climatology: climatologyPayload,
        openMeteo: openMeteoPayload,
      },
      null,
      2,
    ) + '\n',
    'utf8',
  );

  console.log(`Wrote pre-computed validation bundle to ${outPath}`);

  const supabaseEnv = loadSupabaseEnv();
  if (supabaseEnv) {
    await seedLiveSupabase({
      supabaseEnv,
      retrievedAt,
      start,
      end,
      dailyNormalized,
      climatologyNormalized,
      openMeteoNormalized,
      smapGranules,
      modisGranules,
      appEearsCatalog,
    });
  } else {
    console.log('Skipping Supabase seed (no apps/web/.env.local credentials found).');
  }
}

main().catch((err) => {
  console.error('Pre-computation failed:', err);
  process.exitCode = 1;
});
