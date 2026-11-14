import { ENVIRONMENT_VARIABLES } from '@dalashift/shared/constants';
import { analysisRequestSchema, geometrySchema } from '@dalashift/shared/schemas';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import {
  buildGridCellFootprint,
  describeSpatialScaleMismatch,
  getGeometryRepresentativePoint,
} from '../../../../../lib/geospatial';
import { APPEEARS_PRODUCTS, isAppEearsConfigured } from '../../../../../lib/integrations/appeears';
import { persistObservationsForParcel } from '../../../../../lib/integrations/cache';
import {
  fetchClimatologyCached,
  fetchDailyCached,
  NASA_POWER_DAILY_SOURCE,
  NASA_POWER_VARIABLES,
} from '../../../../../lib/integrations/nasa-power';
import {
  fetchOpenMeteoForecastCached,
  OPEN_METEO_SOURCE,
} from '../../../../../lib/integrations/open-meteo';
import { fetchSoilGridsCached, SOILGRIDS_SOURCE } from '../../../../../lib/integrations/soilgrids';
import { createClient } from '../../../../../lib/supabase/server';

interface RouteContext {
  readonly params: Promise<{ farmId: string }>;
}

const farmIdSchema = z.string().uuid();

/**
 * Read stored environmental observations for a farm's parcels, along with
 * their provenance and resolution metadata.
 */
export async function GET(request: Request, { params }: RouteContext) {
  const { farmId } = await params;
  if (!farmIdSchema.safeParse(farmId).success) {
    return NextResponse.json({ error: 'Farm id is invalid.' }, { status: 400 });
  }

  const { searchParams } = new URL(request.url);
  const parcelId = searchParams.get('parcelId');
  if (parcelId && !farmIdSchema.safeParse(parcelId).success) {
    return NextResponse.json({ error: 'Parcel id is invalid.' }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData.user) {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  }

  let parcelsQuery = supabase
    .from('parcels_public')
    .select('id, farm_id, name, area_ha, geometry_geojson, centroid_geojson')
    .eq('farm_id', farmId);
  if (parcelId) {
    parcelsQuery = parcelsQuery.eq('id', parcelId);
  }

  const { data: parcels, error: parcelsError } = await parcelsQuery;
  if (parcelsError) {
    console.error('Failed to read farm parcels for environment', parcelsError);
    return NextResponse.json({ error: 'Unable to load farm parcels.' }, { status: 500 });
  }
  if (!parcels || parcels.length === 0) {
    return NextResponse.json({ observations: [], parcels: [] });
  }

  const parcelIds = parcels.map((parcel) => parcel.id as string);
  const { data: observations, error: obsError } = await supabase
    .from('environmental_observations')
    .select(
      'id, parcel_id, grid_cell_id, source_key, variable, value, unit, spatial_resolution_m, temporal_resolution, observed_at, retrieved_at, is_modelled, aggregation_method, quality_flag, coverage_fraction, raw_metadata',
    )
    .in('parcel_id', parcelIds)
    .order('observed_at', { ascending: false })
    .limit(500);

  if (obsError) {
    console.error('Failed to read environmental observations', obsError);
    return NextResponse.json({ error: 'Unable to load observations.' }, { status: 500 });
  }

  return NextResponse.json({
    parcels,
    observations: observations ?? [],
  });
}

/**
 * Fetch and cache environmental observations (NASA POWER daily + climatology,
 * plus optional ISRIC SoilGrids) for a parcel on the authenticated farmer's
 * farm, returning full provenance, grid cell footprints and resolution caveats.
 */
export async function POST(request: Request, { params }: RouteContext) {
  const { farmId } = await params;
  if (!farmIdSchema.safeParse(farmId).success) {
    return NextResponse.json({ error: 'Farm id is invalid.' }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData.user) {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Request body must be valid JSON.' }, { status: 400 });
  }

  const parsed = analysisRequestSchema.safeParse({
    ...(typeof body === 'object' && body !== null ? body : {}),
    farmId,
  });
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Environmental analysis request is invalid.', issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  let parcelQuery = supabase
    .from('parcels_public')
    .select('id, farm_id, name, area_ha, geometry_geojson, centroid_geojson')
    .eq('farm_id', farmId);
  if (parsed.data.parcelId) {
    parcelQuery = parcelQuery.eq('id', parsed.data.parcelId);
  }

  const { data: parcels, error: parcelError } = await parcelQuery.limit(1);
  if (parcelError) {
    console.error('Failed to load parcel for environmental fetch', parcelError);
    return NextResponse.json({ error: 'Unable to load parcel.' }, { status: 500 });
  }
  const targetParcel = parcels?.[0];
  if (!targetParcel) {
    return NextResponse.json(
      { error: 'No parcel found for this farm. Register a parcel first.' },
      { status: 404 },
    );
  }

  const parsedGeo = geometrySchema.safeParse(
    targetParcel.centroid_geojson ?? targetParcel.geometry_geojson,
  );
  if (!parsedGeo.success) {
    return NextResponse.json({ error: 'Parcel geometry could not be parsed.' }, { status: 500 });
  }

  const [longitude, latitude] = getGeometryRepresentativePoint(parsedGeo.data);
  const requestedPowerVars = (parsed.data.variables ?? NASA_POWER_VARIABLES).filter((v) =>
    (NASA_POWER_VARIABLES as readonly string[]).includes(v),
  );
  const powerVarsToFetch =
    requestedPowerVars.length > 0
      ? requestedPowerVars
      : [
          ENVIRONMENT_VARIABLES.precipitation,
          ENVIRONMENT_VARIABLES.temperatureMean,
          ENVIRONMENT_VARIABLES.soilWetnessRootZone,
        ];

  try {
    const [dailyObservations, climatologyObservations] = await Promise.all([
      fetchDailyCached({
        geometry: { type: 'Point', coordinates: [longitude, latitude] },
        startDate: parsed.data.startDate,
        endDate: parsed.data.endDate,
        variables: powerVarsToFetch,
      }),
      fetchClimatologyCached({
        geometry: { type: 'Point', coordinates: [longitude, latitude] },
      }),
    ]);

    let soilObservations: Awaited<ReturnType<typeof fetchSoilGridsCached>> = [];
    let openMeteoObservations: Awaited<ReturnType<typeof fetchOpenMeteoForecastCached>> = [];
    const warnings: string[] = [];

    try {
      soilObservations = await fetchSoilGridsCached({
        geometry: { type: 'Point', coordinates: [longitude, latitude] },
      });
    } catch {
      warnings.push(
        'ISRIC SoilGrids REST service was unavailable or timed out; soil properties are marked missing rather than fabricated.',
      );
    }

    try {
      openMeteoObservations = await fetchOpenMeteoForecastCached({
        geometry: { type: 'Point', coordinates: [longitude, latitude] },
      });
    } catch {
      warnings.push(
        'Open-Meteo weather and soil moisture forecast service was unavailable; forecast observations were skipped.',
      );
    }

    await Promise.all([
      persistObservationsForParcel({
        parcelId: targetParcel.id as string,
        sourceKey: NASA_POWER_DAILY_SOURCE.id,
        longitude,
        latitude,
        observations: [...dailyObservations, ...climatologyObservations],
      }),
      soilObservations.length > 0
        ? persistObservationsForParcel({
            parcelId: targetParcel.id as string,
            sourceKey: SOILGRIDS_SOURCE.id,
            longitude,
            latitude,
            observations: soilObservations,
          })
        : Promise.resolve(),
      openMeteoObservations.length > 0
        ? persistObservationsForParcel({
            parcelId: targetParcel.id as string,
            sourceKey: OPEN_METEO_SOURCE.id,
            longitude,
            latitude,
            observations: openMeteoObservations,
          })
        : Promise.resolve(),
    ]);

    const powerCell = buildGridCellFootprint(NASA_POWER_DAILY_SOURCE.id, longitude, latitude);
    const soilCell = buildGridCellFootprint(SOILGRIDS_SOURCE.id, longitude, latitude);
    const openMeteoCell = buildGridCellFootprint(OPEN_METEO_SOURCE.id, longitude, latitude);
    const scaleLimitations = [
      describeSpatialScaleMismatch({
        sourceName: 'NASA POWER',
        spatialResolutionM: NASA_POWER_DAILY_SOURCE.spatialResolutionM,
        parcelAreaHa: Number(targetParcel.area_ha ?? 1),
      }),
      describeSpatialScaleMismatch({
        sourceName: 'ISRIC SoilGrids 2.0',
        spatialResolutionM: SOILGRIDS_SOURCE.spatialResolutionM,
        parcelAreaHa: Number(targetParcel.area_ha ?? 1),
      }),
      describeSpatialScaleMismatch({
        sourceName: 'Open-Meteo Forecast',
        spatialResolutionM: OPEN_METEO_SOURCE.spatialResolutionM,
        parcelAreaHa: Number(targetParcel.area_ha ?? 1),
      }),
    ].filter((item) => item !== null);

    return NextResponse.json({
      parcelId: targetParcel.id,
      parcelAreaHa: Number(targetParcel.area_ha ?? 0),
      gridCells: {
        nasaPower: powerCell,
        soilGrids: soilCell,
        openMeteo: openMeteoCell,
      },
      dailyObservations,
      climatologyObservations,
      soilObservations,
      openMeteoObservations,
      appEears: {
        configured: isAppEearsConfigured(),
        products: APPEEARS_PRODUCTS,
      },
      limitations: scaleLimitations,
      warnings,
    });
  } catch (error) {
    console.error('Failed to retrieve environmental observations', error);
    return NextResponse.json(
      {
        error:
          'Upstream environmental data source is temporarily unavailable. Please try again later.',
      },
      { status: 502 },
    );
  }
}
