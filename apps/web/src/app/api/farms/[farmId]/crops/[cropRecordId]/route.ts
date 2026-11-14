import { farmCropInputSchema } from '@dalashift/shared/schemas';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import { createClient } from '../../../../../../lib/supabase/server';

interface RouteContext {
  readonly params: Promise<{ farmId: string; cropRecordId: string }>;
}

const idSchema = z.string().uuid();
const cropSelection =
  'id, farm_id, parcel_id, crop_id, status, planting_date, expected_harvest_date, harvest_date, season, intended_use, area_ha, notes, created_at';

/** Replace a farmer-supplied crop record. */
export async function PUT(request: Request, { params }: RouteContext) {
  const { farmId, cropRecordId } = await params;
  if (!idSchema.safeParse(farmId).success || !idSchema.safeParse(cropRecordId).success) {
    return NextResponse.json({ error: 'Farm or crop record id is invalid.' }, { status: 400 });
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
    .update({
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
    .eq('farm_id', farmId)
    .eq('id', cropRecordId)
    .select(cropSelection)
    .maybeSingle();

  if (error) {
    console.error('Failed to update farm crop record', error);
    return NextResponse.json({ error: 'Unable to update crop record.' }, { status: 400 });
  }
  if (!data) {
    return NextResponse.json({ error: 'Crop record not found.' }, { status: 404 });
  }

  return NextResponse.json({ crop: data });
}

/** Delete a crop record without exposing records hidden by RLS. */
export async function DELETE(_request: Request, { params }: RouteContext) {
  const { farmId, cropRecordId } = await params;
  if (!idSchema.safeParse(farmId).success || !idSchema.safeParse(cropRecordId).success) {
    return NextResponse.json({ error: 'Farm or crop record id is invalid.' }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData.user) {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  }

  const { data, error } = await supabase
    .from('farm_crops')
    .delete()
    .eq('farm_id', farmId)
    .eq('id', cropRecordId)
    .select('id')
    .maybeSingle();

  if (error) {
    console.error('Failed to delete farm crop record', error);
    return NextResponse.json({ error: 'Unable to delete crop record.' }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: 'Crop record not found.' }, { status: 404 });
  }

  return new NextResponse(null, { status: 204 });
}
