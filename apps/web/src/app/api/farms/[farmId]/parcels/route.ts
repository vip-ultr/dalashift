import { parcelInputSchema } from '@dalashift/shared/schemas';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import { getAuthenticatedClient } from '../../../../../lib/supabase/server';

interface RouteContext {
  readonly params: Promise<{ farmId: string }>;
}

const farmIdSchema = z.string().uuid();

function invalidFarmId(farmId: string) {
  return !farmIdSchema.safeParse(farmId).success;
}

/** List a farm's parcels. RLS hides farms and parcels owned by other users. */
export async function GET(_request: Request, { params }: RouteContext) {
  const { farmId } = await params;
  if (invalidFarmId(farmId)) {
    return NextResponse.json({ error: 'Farm id is invalid.' }, { status: 400 });
  }

  const authContext = await getAuthenticatedClient();
  if (!authContext) {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  }
  const { supabase, user } = authContext;

  const { data: farm, error: farmError } = await supabase
    .from('farms')
    .select('id')
    .eq('id', farmId)
    .eq('farmer_id', user.id)
    .maybeSingle();

  if (farmError) {
    console.error('Failed to verify farm ownership', farmError);
    return NextResponse.json({ error: 'Unable to load parcels.' }, { status: 500 });
  }
  if (!farm) {
    return NextResponse.json({ error: 'Farm not found.' }, { status: 404 });
  }

  const { data, error } = await supabase
    .from('parcels_public')
    .select('*')
    .eq('farm_id', farmId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Failed to list parcels', error);
    return NextResponse.json({ error: 'Unable to load parcels.' }, { status: 500 });
  }

  return NextResponse.json({ parcels: data });
}

/** Create a parcel through the PostGIS RPC so GPS promotion and geometry checks stay server-side. */
export async function POST(request: Request, { params }: RouteContext) {
  const { farmId } = await params;
  if (invalidFarmId(farmId)) {
    return NextResponse.json({ error: 'Farm id is invalid.' }, { status: 400 });
  }

  const authContext = await getAuthenticatedClient();
  if (!authContext) {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  }
  const { supabase, user } = authContext;

  const { data: farm, error: farmError } = await supabase
    .from('farms')
    .select('id')
    .eq('id', farmId)
    .eq('farmer_id', user.id)
    .maybeSingle();

  if (farmError) {
    console.error('Failed to verify farm ownership', farmError);
    return NextResponse.json({ error: 'Unable to load parcels.' }, { status: 500 });
  }
  if (!farm) {
    return NextResponse.json({ error: 'Farm not found.' }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Request body must be valid JSON.' }, { status: 400 });
  }

  const parsed = parcelInputSchema.safeParse({
    ...(typeof body === 'object' && body !== null ? body : {}),
    farmId,
  });
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Parcel details are invalid.', issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { data: created, error: createError } = await supabase.rpc('create_parcel', {
    p_farm_id: farmId,
    p_name: parsed.data.name,
    p_geometry_geojson: parsed.data.geometry,
    p_geometry_method: parsed.data.geometryMethod,
    p_location_uncertainty_m: parsed.data.locationUncertaintyM,
    p_notes: parsed.data.notes ?? null,
  });

  if (createError || !created) {
    console.error('Failed to create parcel', createError);
    return NextResponse.json({ error: 'Unable to create parcel.' }, { status: 400 });
  }

  const parcelId = (created as { id?: unknown }).id;
  if (typeof parcelId !== 'string') {
    console.error('Parcel creation returned no identifier');
    return NextResponse.json({ error: 'Unable to create parcel.' }, { status: 500 });
  }

  const { data, error } = await supabase
    .from('parcels_public')
    .select('*')
    .eq('id', parcelId)
    .single();

  if (error) {
    console.error('Failed to read created parcel', error);
    return NextResponse.json(
      { error: 'Parcel was created but could not be loaded.' },
      { status: 500 },
    );
  }

  return NextResponse.json({ parcel: data }, { status: 201 });
}
