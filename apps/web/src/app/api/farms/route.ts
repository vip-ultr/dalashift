import { farmInputSchema } from '@dalashift/shared/schemas';
import { NextResponse } from 'next/server';

import { createClient } from '../../../lib/supabase/server';

/** List the signed-in farmer's farms. Database RLS enforces ownership. */
export async function GET() {
  const supabase = await createClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();

  if (authError || !authData.user) {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  }

  const { data, error } = await supabase
    .from('farms')
    .select('id, name, farming_method, irrigation_method, soil_notes, area_ha, created_at')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Failed to list farms', error);
    return NextResponse.json({ error: 'Unable to load farms.' }, { status: 500 });
  }

  return NextResponse.json({ farms: data });
}

/** Create a farm for the authenticated user. The owner id never comes from the body. */
export async function POST(request: Request) {
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

  const parsed = farmInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Farm details are invalid.', issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { data, error } = await supabase
    .from('farms')
    .insert({
      farmer_id: authData.user.id,
      name: parsed.data.name,
      farming_method: parsed.data.farmingMethod,
      irrigation_method: parsed.data.irrigationMethod,
      soil_notes: parsed.data.soilNotes ?? null,
    })
    .select('id, name, farming_method, irrigation_method, soil_notes, area_ha, created_at')
    .single();

  if (error) {
    console.error('Failed to create farm', error);
    return NextResponse.json({ error: 'Unable to create farm.' }, { status: 500 });
  }

  return NextResponse.json({ farm: data }, { status: 201 });
}
