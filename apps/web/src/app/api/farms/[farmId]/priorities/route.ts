import { farmerPrioritiesInputSchema } from '@dalashift/shared/schemas';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import { createClient } from '../../../../../lib/supabase/server';

interface RouteContext {
  readonly params: Promise<{ farmId: string }>;
}

const farmIdSchema = z.string().uuid();

/** Read the farmer's stated comparison priorities. */
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

  const { data, error } = await supabase
    .from('farm_priorities')
    .select('farm_id, goals, risk_tolerance, open_to_change, planting_trigger, notes, updated_at')
    .eq('farm_id', farmId)
    .maybeSingle();

  if (error) {
    console.error('Failed to read farm priorities', error);
    return NextResponse.json({ error: 'Unable to load farmer priorities.' }, { status: 500 });
  }

  return NextResponse.json({ priorities: data });
}

/** Save the farmer's stated goals and planting trigger. */
export async function PUT(request: Request, { params }: RouteContext) {
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

  const parsed = farmerPrioritiesInputSchema.safeParse({
    ...(typeof body === 'object' && body !== null ? body : {}),
    farmId,
  });
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Priority details are invalid.', issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { data, error } = await supabase
    .from('farm_priorities')
    .upsert(
      {
        farm_id: farmId,
        goals: parsed.data.goals,
        risk_tolerance: parsed.data.riskTolerance,
        open_to_change: parsed.data.openToChange,
        planting_trigger: parsed.data.plantingTrigger,
        notes: parsed.data.notes,
      },
      { onConflict: 'farm_id' },
    )
    .select('farm_id, goals, risk_tolerance, open_to_change, planting_trigger, notes, updated_at')
    .single();

  if (error) {
    console.error('Failed to save farm priorities', error);
    return NextResponse.json({ error: 'Unable to save farmer priorities.' }, { status: 400 });
  }

  return NextResponse.json({ priorities: data });
}
