import { NextResponse } from 'next/server';

import { createClient } from '../../../lib/supabase/server';

/** List published field interview case studies from Doka village, Tofa LGA. */
export async function GET() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('case_studies')
    .select(
      'id, slug, farmer_name, village, lga, state, farming_experience, summary, crop_codes, planting_trigger, consented_to_publication, consented_to_gps, created_at',
    )
    .eq('published', true)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Failed to list published case studies', error);
    return NextResponse.json({ error: 'Unable to load case studies.' }, { status: 500 });
  }

  return NextResponse.json({ caseStudies: data ?? [] });
}
