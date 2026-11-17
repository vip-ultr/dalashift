import { NextResponse } from 'next/server';
import { z } from 'zod';

import { getAuthenticatedClient } from '../../../lib/supabase/server';

const profileUpdateSchema = z.object({
  fullName: z.preprocess(
    (v) => (typeof v === 'string' && v.trim() ? v.trim() : undefined),
    z.string().min(1).max(120).optional(),
  ),
  phone: z.preprocess(
    (v) => (typeof v === 'string' && v.trim() ? v.trim() : null),
    z.string().max(40).nullable().optional(),
  ),
  preferredLanguage: z.preprocess((v) => {
    if (typeof v !== 'string' || !v.trim()) return undefined;
    const clean = v.trim().toLowerCase();
    if (clean === 'hausa' || clean === 'ha-ng') return 'ha';
    if (clean === 'english' || clean === 'en-us' || clean === 'en-ng') return 'en';
    return clean;
  }, z.string().min(2).max(12).optional()),
  farmingExperience: z.preprocess(
    (v) => (typeof v === 'string' && v.trim() ? v.trim() : null),
    z.string().max(2000).nullable().optional(),
  ),
});

/** Read the authenticated farmer's profile row. */
export async function GET() {
  const authContext = await getAuthenticatedClient();
  if (!authContext) {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  }
  const { supabase, user } = authContext;

  const { data, error } = await supabase
    .from('profiles')
    .select(
      'id, full_name, phone, preferred_language, farming_experience, role, created_at, updated_at',
    )
    .eq('id', user.id)
    .maybeSingle();

  if (error) {
    console.error('Failed to read profile', error);
    return NextResponse.json({ error: 'Unable to load profile.' }, { status: 500 });
  }

  return NextResponse.json({
    profile: data ?? {
      id: user.id,
      email: user.email,
      phone: user.phone,
    },
  });
}

/** Update the authenticated farmer's profile row (RLS enforces `id = auth.uid()`). */
export async function PATCH(request: Request) {
  const authContext = await getAuthenticatedClient();
  if (!authContext) {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  }
  const { supabase, user } = authContext;

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
    .eq('id', user.id)
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
