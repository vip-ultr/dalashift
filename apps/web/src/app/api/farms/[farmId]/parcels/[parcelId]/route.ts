import { GEOMETRY_METHODS } from '@dalashift/shared/constants';
import { geometrySchema } from '@dalashift/shared/schemas';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import { getAuthenticatedClient } from '../../../../../../lib/supabase/server';

interface RouteContext {
  readonly params: Promise<{ farmId: string; parcelId: string }>;
}

const uuidSchema = z.string().uuid();

const parcelUpdateSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  geometry: geometrySchema.optional(),
  geometryMethod: z.enum(GEOMETRY_METHODS).optional(),
  locationUncertaintyM: z.number().min(0).max(5000).nullable().optional(),
  notes: z.string().trim().max(2000).nullable().optional(),
});

/** Read a single parcel from the security-invoker `parcels_public` view. */
export async function GET(_request: Request, { params }: RouteContext) {
  const { farmId, parcelId } = await params;
  if (!uuidSchema.safeParse(farmId).success || !uuidSchema.safeParse(parcelId).success) {
    return NextResponse.json({ error: 'Farm or parcel id is invalid.' }, { status: 400 });
  }

  const authContext = await getAuthenticatedClient();
  if (!authContext) {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  }
  const { supabase } = authContext;

  const { data, error } = await supabase
    .from('parcels_public')
    .select('*')
    .eq('farm_id', farmId)
    .eq('id', parcelId)
    .maybeSingle();

  if (error) {
    console.error('Failed to read parcel', error);
    return NextResponse.json({ error: 'Unable to load parcel.' }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: 'Parcel not found.' }, { status: 404 });
  }

  return NextResponse.json({ parcel: data });
}

/** Update a parcel's geometry (via the PostGIS `set_parcel_geometry` RPC) or metadata. */
export async function PATCH(request: Request, { params }: RouteContext) {
  const { farmId, parcelId } = await params;
  if (!uuidSchema.safeParse(farmId).success || !uuidSchema.safeParse(parcelId).success) {
    return NextResponse.json({ error: 'Farm or parcel id is invalid.' }, { status: 400 });
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

  const parsed = parcelUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Parcel update details are invalid.', issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  if (parsed.data.geometry) {
    const { error: geoError } = await supabase.rpc('set_parcel_geometry', {
      p_parcel_id: parcelId,
      p_geometry_geojson: parsed.data.geometry,
      p_geometry_method: parsed.data.geometryMethod ?? null,
      p_location_uncertainty_m: parsed.data.locationUncertaintyM ?? null,
    });
    if (geoError) {
      console.error('Failed to update parcel geometry', geoError);
      return NextResponse.json({ error: 'Unable to update parcel geometry.' }, { status: 400 });
    }
  }

  if (parsed.data.name !== undefined || parsed.data.notes !== undefined) {
    const metadataUpdate: Record<string, unknown> = {};
    if (parsed.data.name !== undefined) metadataUpdate.name = parsed.data.name;
    if (parsed.data.notes !== undefined) metadataUpdate.notes = parsed.data.notes;

    const { error: metaError } = await supabase
      .from('parcels')
      .update(metadataUpdate)
      .eq('farm_id', farmId)
      .eq('id', parcelId);

    if (metaError) {
      console.error('Failed to update parcel metadata', metaError);
      return NextResponse.json({ error: 'Unable to update parcel metadata.' }, { status: 400 });
    }
  }

  const { data, error } = await supabase
    .from('parcels_public')
    .select('*')
    .eq('farm_id', farmId)
    .eq('id', parcelId)
    .maybeSingle();

  if (error || !data) {
    return NextResponse.json({ error: 'Parcel not found.' }, { status: 404 });
  }

  return NextResponse.json({ parcel: data });
}

/** Delete a parcel from a farm. PostGIS triggers recompute the farm's total area and centroid. */
export async function DELETE(_request: Request, { params }: RouteContext) {
  const { farmId, parcelId } = await params;
  if (!uuidSchema.safeParse(farmId).success || !uuidSchema.safeParse(parcelId).success) {
    return NextResponse.json({ error: 'Farm or parcel id is invalid.' }, { status: 400 });
  }

  const authContext = await getAuthenticatedClient();
  if (!authContext) {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  }
  const { supabase } = authContext;

  const { data, error } = await supabase
    .from('parcels')
    .delete()
    .eq('farm_id', farmId)
    .eq('id', parcelId)
    .select('id')
    .maybeSingle();

  if (error) {
    console.error('Failed to delete parcel', error);
    return NextResponse.json({ error: 'Unable to delete parcel.' }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: 'Parcel not found.' }, { status: 404 });
  }

  return new NextResponse(null, { status: 204 });
}
