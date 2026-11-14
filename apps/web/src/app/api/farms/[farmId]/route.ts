import { farmInputSchema } from '@dalashift/shared/schemas';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import { createClient } from '../../../../lib/supabase/server';

interface RouteContext {
  readonly params: Promise<{ farmId: string }>;
}

const farmIdSchema = z.string().uuid();

/** Read a single farm owned by the signed-in farmer, along with its parcels, crops and priorities. */
export async function GET(_request: Request, { params }: RouteContext) {
  const { farmId } = await params;
  if (!farmIdSchema.safeParse(farmId).success) {
    return NextResponse.json({ error: 'Farm id is invalid.' }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData.user) {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  }

  const [farmRes, parcelsRes, cropsRes, prioritiesRes] = await Promise.all([
    supabase
      .from('farms')
      .select(
        'id, name, farming_method, irrigation_method, soil_notes, area_ha, created_at, updated_at',
      )
      .eq('id', farmId)
      .maybeSingle(),
    supabase
      .from('parcels_public')
      .select('*')
      .eq('farm_id', farmId)
      .order('created_at', { ascending: true }),
    supabase
      .from('farm_crops')
      .select(
        'id, farm_id, parcel_id, crop_id, status, planting_date, expected_harvest_date, harvest_date, season, intended_use, area_ha, notes, created_at, crop:crops(id, code, name, scientific_name, category)',
      )
      .eq('farm_id', farmId)
      .order('created_at', { ascending: false }),
    supabase
      .from('farm_priorities')
      .select('farm_id, goals, risk_tolerance, open_to_change, planting_trigger, notes, updated_at')
      .eq('farm_id', farmId)
      .maybeSingle(),
  ]);

  if (farmRes.error) {
    console.error('Failed to read farm', farmRes.error);
    return NextResponse.json({ error: 'Unable to load farm.' }, { status: 500 });
  }
  if (!farmRes.data) {
    return NextResponse.json({ error: 'Farm not found.' }, { status: 404 });
  }

  return NextResponse.json({
    farm: farmRes.data,
    parcels: parcelsRes.data ?? [],
    crops: cropsRes.data ?? [],
    priorities: prioritiesRes.data ?? null,
  });
}

/** Update a farm's details. RLS guarantees only the owner can update it. */
export async function PATCH(request: Request, { params }: RouteContext) {
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

  const parsed = farmInputSchema.partial().safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Farm details are invalid.', issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const updateFields: Record<string, unknown> = {};
  if (parsed.data.name !== undefined) updateFields.name = parsed.data.name;
  if (parsed.data.farmingMethod !== undefined) {
    updateFields.farming_method = parsed.data.farmingMethod;
  }
  if (parsed.data.irrigationMethod !== undefined) {
    updateFields.irrigation_method = parsed.data.irrigationMethod;
  }
  if (parsed.data.soilNotes !== undefined) {
    updateFields.soil_notes = parsed.data.soilNotes;
  }

  const { data, error } = await supabase
    .from('farms')
    .update(updateFields)
    .eq('id', farmId)
    .select(
      'id, name, farming_method, irrigation_method, soil_notes, area_ha, created_at, updated_at',
    )
    .maybeSingle();

  if (error) {
    console.error('Failed to update farm', error);
    return NextResponse.json({ error: 'Unable to update farm.' }, { status: 400 });
  }
  if (!data) {
    return NextResponse.json({ error: 'Farm not found.' }, { status: 404 });
  }

  return NextResponse.json({ farm: data });
}

/** Delete a farm and its cascading parcels and crop records. */
export async function DELETE(_request: Request, { params }: RouteContext) {
  const { farmId } = await params;
  if (!farmIdSchema.safeParse(farmId).success) {
    return NextResponse.json({ error: 'Farm id is invalid.' }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData.user) {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  }

  const { data, error } = await supabase
    .from('farms')
    .delete()
    .eq('id', farmId)
    .select('id')
    .maybeSingle();

  if (error) {
    console.error('Failed to delete farm', error);
    return NextResponse.json({ error: 'Unable to delete farm.' }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: 'Farm not found.' }, { status: 404 });
  }

  return new NextResponse(null, { status: 204 });
}
