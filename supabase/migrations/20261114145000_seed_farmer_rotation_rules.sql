-- =============================================================================
-- Seed the two farmer-reported rotation practices documented in the field
-- interviews. These are reference statements, not agronomic prescriptions.
-- Crop requirements remain unseeded until each value has a cited source.
-- =============================================================================

insert into public.rotation_rules (
  id,
  statement,
  source_type,
  attributed_to,
  source_url,
  accessed_on,
  applies_to,
  follows,
  mechanism
)
values
  (
    'farmer-report-interview-02-rotation',
    'Change the crop each season, rotate to sorghum, pearl millet or late millet, then bring an earlier crop back later.',
    'farmer_report',
    'Interview 02 participant',
    'docs/research/field-interviews/interview-02/case-study.md',
    date '2026-11-14',
    array['maize', 'soybeans', 'groundnuts', 'peppers', 'tomatoes'],
    array['sorghum', 'pearl_millet', 'late_millet'],
    'Farmer-reported practice. An agronomic mechanism was not established in the interview.'
  ),
  (
    'farmer-report-interview-03-rotation',
    'Over a two-to-three-year cycle, rotate sorghum and soybean plots with white cowpeas or maize.',
    'farmer_report',
    'Interview 03 participant',
    'docs/research/field-interviews/interview-03/case-study.md',
    date '2026-11-14',
    array['sorghum', 'soybeans'],
    array['white_cowpeas', 'soybeans', 'maize'],
    'Farmer-reported practice. An agronomic mechanism was not established in the interview.'
  )
on conflict (id) do update set
  statement = excluded.statement,
  source_type = excluded.source_type,
  attributed_to = excluded.attributed_to,
  source_url = excluded.source_url,
  accessed_on = excluded.accessed_on,
  applies_to = excluded.applies_to,
  follows = excluded.follows,
  mechanism = excluded.mechanism;
