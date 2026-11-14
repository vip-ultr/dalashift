import { NextResponse } from 'next/server';
import { z } from 'zod';

import { createClient } from '../../../../lib/supabase/server';

interface RouteContext {
  readonly params: Promise<{ slug: string }>;
}

const slugSchema = z.string().trim().min(1).max(120);

/** Retrieve a single published case study by slug. Precise coordinates and contact details never appear here. */
export async function GET(_request: Request, { params }: RouteContext) {
  const { slug } = await params;
  if (!slugSchema.safeParse(slug).success) {
    return NextResponse.json({ error: 'Case study slug is invalid.' }, { status: 400 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('case_studies')
    .select(
      'id, slug, farmer_name, village, lga, state, farming_experience, summary, body, crop_codes, planting_trigger, consented_to_publication, consented_to_gps, created_at, updated_at',
    )
    .eq('slug', slug)
    .eq('published', true)
    .maybeSingle();

  if (error) {
    console.error('Failed to read case study', error);
    return NextResponse.json({ error: 'Unable to load case study.' }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: 'Case study not found.' }, { status: 404 });
  }

  return NextResponse.json({ caseStudy: data });
}
