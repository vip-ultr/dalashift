import { NextResponse } from 'next/server';

import { createClient } from '../../../../lib/supabase/server';

/**
 * List the reference crop catalog, farmer-reported crop names, unresolved local
 * names ('beans', 'late millet'), and rotation rules.
 *
 * Supports optional `?q=` search across canonical names, scientific names,
 * verified aliases, and farmer-reported local names. When a query matches an
 * unresolved local name, it returns the unresolved notice rather than guessing
 * a crop identity (Decision D-14).
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q')?.trim().toLowerCase() ?? '';

  const supabase = await createClient();
  const [cropsRes, unresolvedRes, rulesRes] = await Promise.all([
    supabase
      .from('crops')
      .select(
        'id, code, name, scientific_name, farmer_reported_names, variety_or_cultivar, seed_or_market_classes, verified_aliases, category, applicable_regions, growing_period_days, agronomic_requirements, rotation_traits, source_citations, fertiliser, catalog_version',
      )
      .order('name', { ascending: true }),
    supabase
      .from('unresolved_crop_names')
      .select(
        'id, reported_name, source_references, clarification_requested_from, status, resolved_crop_id, resolution_note',
      )
      .order('reported_name', { ascending: true }),
    supabase
      .from('rotation_rules')
      .select(
        'id, statement, source_type, attributed_to, source_url, accessed_on, applies_to, follows, mechanism',
      )
      .order('id', { ascending: true }),
  ]);

  if (cropsRes.error || unresolvedRes.error || rulesRes.error) {
    console.error('Failed to load crop catalog', {
      cropsError: cropsRes.error,
      unresolvedError: unresolvedRes.error,
      rulesError: rulesRes.error,
    });
    return NextResponse.json({ error: 'Unable to load reference crop catalog.' }, { status: 500 });
  }

  const allCrops = cropsRes.data ?? [];
  const allUnresolved = unresolvedRes.data ?? [];
  const allRules = rulesRes.data ?? [];

  if (!query) {
    return NextResponse.json({
      crops: allCrops,
      unresolvedCropNames: allUnresolved,
      rotationRules: allRules,
    });
  }

  const matchedCrops = allCrops.filter((crop) => {
    const reportedNames = Array.isArray(crop.farmer_reported_names)
      ? (crop.farmer_reported_names as { name?: string }[])
      : [];
    const verifiedAliases = Array.isArray(crop.verified_aliases)
      ? (crop.verified_aliases as string[])
      : [];

    return (
      crop.code.toLowerCase().includes(query) ||
      crop.name.toLowerCase().includes(query) ||
      (crop.scientific_name?.toLowerCase().includes(query) ?? false) ||
      verifiedAliases.some((alias) => alias.toLowerCase().includes(query)) ||
      reportedNames.some((entry) => entry.name?.toLowerCase().includes(query))
    );
  });

  const matchedUnresolved = allUnresolved.filter((item) =>
    item.reported_name.toLowerCase().includes(query),
  );

  return NextResponse.json({
    crops: matchedCrops,
    unresolvedCropNames: matchedUnresolved,
    rotationRules: allRules,
  });
}
