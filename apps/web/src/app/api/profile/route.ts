import { NextResponse } from 'next/server';
import { z } from 'zod';

import { createClient } from '../../../lib/supabase/server';

const profileUpdateSchema = z.object({
  fullName: z.string().trim().min(1).max(120).optional(),
  phone: z.string().trim().max(40).nullable().optional(),
  preferredLanguage: z.string().trim().min(2).max(12).optional(),
  farmingExperience: z.string().trim().max(2000).nullable().optional(),
});

/** Read the authenticated farmer's profile row. */
export async function GET() {
  const supabase = await createClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData.user) {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  }

  const { data, error } = await supabase
    .from('profiles')
    .select(
      'id, full_name, phone, preferred_language, farming_experience, role, created_at, updated_at',
    )
    .eq('id', authData.user.id)
    .maybeSingle();

  if (error) {
    console.error('Failed to read profile', error);
    return NextResponse.json({ error: 'Unable to load profile.' }, { status: 500 });
  }

  return NextResponse.json({
    profile: data ?? {
      id: authData.user.id,
      email: authData.user.email ?? null,
    },
  });
}

/** Update the authenticated farmer's profile row (RLS enforces `id = auth.uid()`). */
export async function PATCH(request: Request) {
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

  const parsed = profileUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Profile details are invalid.', issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const updates: Record<string, unknown> = {};
  if (parsed.data.fullName !== undefined) updates.full_name = parsed.data.fullName;
  if (parsed.data.phone !== undefined) updates.phone = parsed.data.phone;
  if (parsed.data.preferredLanguage !== undefined) {
    updates.preferred_language = parsed.data.preferredLanguage;
  }
  if (parsed.data.farmingExperience !== undefined) {
    updates.farming_experience = parsed.data.farmingExperience;
  }

  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', authData.user.id)
    .select(
      'id, full_name, phone, preferred_language, farming_experience, role, created_at, updated_at',
    )
    .maybeSingle();

  if (error) {
    console.error('Failed to update profile', error);
    return NextResponse.json({ error: 'Unable to update profile.' }, { status: 400 });
  }

  return NextResponse.json({ profile: data });
}
