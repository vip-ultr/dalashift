import { farmCropInputSchema } from '@dalashift/shared/schemas';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import { getAuthenticatedClient } from '../../../../../lib/supabase/server';

interface RouteContext {
  readonly params: Promise<{ farmId: string }>;
}

const farmIdSchema = z.string().uuid();

/** List the signed-in farmer's crop records for a farm. */
export async function GET(_request: Request, { params }: RouteContext) {
  const { farmId } = await params;
  if (!farmIdSchema.safeParse(farmId).success) {
    return NextResponse.json({ error: 'Farm id is invalid.' }, { status: 400 });
  }

  const authContext = await getAuthenticatedClient();
  if (!authContext) {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  }
  const { supabase } = authContext;

  const { data, error } = await supabase
    .from('farm_crops')
    .select(
      'id, farm_id, parcel_id, crop_id, status, planting_date, expected_harvest_date, harvest_date, season, intended_use, area_ha, notes, created_at, crop:crops(id, code, name, scientific_name, farmer_reported_names, variety_or_cultivar, seed_or_market_classes, verified_aliases, category)',
    )
    .eq('farm_id', farmId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Failed to list farm crops', error);
    return NextResponse.json({ error: 'Unable to load crop records.' }, { status: 500 });
  }

  return NextResponse.json({ crops: data });
}

/** Record a crop supplied by the farmer. The crop identity is never guessed. */
export async function POST(request: Request, { params }: RouteContext) {
  const { farmId } = await params;
  if (!farmIdSchema.safeParse(farmId).success) {
    return NextResponse.json({ error: 'Farm id is invalid.' }, { status: 400 });
  }

  const authContext = await getAuthenticatedClient();
  if (!authContext) {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  }
  const { supabase } = authContext;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Request body must be valid JSON.' }, { status: 400 });
  }

  const parsed = farmCropInputSchema.safeParse({
    ...(typeof body === 'object' && body !== null ? body : {}),
    farmId,
  });
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Crop details are invalid.', issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { data, error } = await supabase
    .from('farm_crops')
    .insert({
      farm_id: farmId,
      parcel_id: parsed.data.parcelId,
      crop_id: parsed.data.cropId,
      status: parsed.data.status,
      planting_date: parsed.data.plantingDate,
      expected_harvest_date: parsed.data.expectedHarvestDate,
      harvest_date: parsed.data.harvestDate,
      season: parsed.data.season,
      intended_use: parsed.data.intendedUse,
      area_ha: parsed.data.areaHa,
      notes: parsed.data.notes,
    })
    .select(
      'id, farm_id, parcel_id, crop_id, status, planting_date, expected_harvest_date, harvest_date, season, intended_use, area_ha, notes, created_at',
    )
    .single();

  if (error) {
    console.error('Failed to create farm crop record', error);
    return NextResponse.json({ error: 'Unable to save crop record.' }, { status: 400 });
  }

  return NextResponse.json({ crop: data }, { status: 201 });
}
