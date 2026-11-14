-- Separate scientific crop identity from farmer wording, formal classes and
-- verified aliases. Preserve legacy alias strings as unverified farmer terms.

alter table public.crops
  add column scientific_name text,
  add column farmer_reported_names jsonb not null default '[]'::jsonb,
  add column variety_or_cultivar text,
  add column seed_or_market_classes jsonb not null default '[]'::jsonb,
  add column verified_aliases text[] not null default '{}';

update public.crops c
set farmer_reported_names = coalesce(
  (
    select jsonb_agg(
      jsonb_build_object(
        'name', legacy_name,
        'source_reference', null,
        'evidence_status', 'unverified_legacy_alias'
      )
    )
    from unnest(c.aliases) as legacy_name
  ),
  '[]'::jsonb
);

drop index if exists public.crops_aliases_idx;
alter table public.crops drop column aliases;

alter table public.crops
  add constraint crops_scientific_name_nonempty
    check (scientific_name is null or length(btrim(scientific_name)) > 0),
  add constraint crops_farmer_names_are_array
    check (jsonb_typeof(farmer_reported_names) = 'array'),
  add constraint crops_seed_market_classes_are_array
    check (jsonb_typeof(seed_or_market_classes) = 'array');

create index crops_verified_aliases_idx
  on public.crops using gin (verified_aliases);

comment on column public.crops.scientific_name is
  'Scientific identity of the crop. Null means it has not been verified.';
comment on column public.crops.farmer_reported_names is
  'Farmer wording with source provenance. It is not automatically a verified alias.';
comment on column public.crops.variety_or_cultivar is
  'Named variety or cultivar when the evidence establishes one.';
comment on column public.crops.seed_or_market_classes is
  'Seed colour or market-class descriptors with value-level evidence status and provenance.';
comment on column public.crops.verified_aliases is
  'Verified synonyms only. Farmer wording belongs in farmer_reported_names.';

create table public.unresolved_crop_names (
  id uuid primary key default gen_random_uuid(),
  reported_name text not null unique check (length(btrim(reported_name)) > 0),
  source_references text[] not null default '{}',
  clarification_requested_from text[] not null
    default array['Tofa farmers', 'CDA extension officer']::text[],
  status text not null default 'unresolved'
    check (status in ('unresolved', 'resolved')),
  resolved_crop_id uuid references public.crops (id),
  resolution_note text,
  created_at timestamptz not null default now(),
  constraint unresolved_crop_name_resolution_consistent check (
    (status = 'unresolved' and resolved_crop_id is null)
    or (status = 'resolved' and resolved_crop_id is not null)
  )
);

alter table public.unresolved_crop_names enable row level security;
create policy unresolved_crop_names_read
on public.unresolved_crop_names for select using (true);

insert into public.unresolved_crop_names (reported_name, source_references)
values
  (
    'beans',
    array[
      'docs/research/field-interviews/interview-02/transcript.md',
      'docs/research/field-interviews/interview-03/transcript.md'
    ]
  ),
  (
    'late millet',
    array[
      'docs/research/field-interviews/interview-02/transcript.md',
      'docs/research/field-interviews/interview-02/case-study.md'
    ]
  )
on conflict (reported_name) do update set
  source_references = excluded.source_references,
  clarification_requested_from = excluded.clarification_requested_from;

-- Rotation arrays hold canonical crop codes. The source statements continue
-- to preserve farmer wording such as "white cowpeas" and "late millet".
update public.rotation_rules
set applies_to = array['maize', 'soybean', 'groundnut', 'pepper', 'tomato'],
    follows = array['sorghum', 'pearl_millet']
where id = 'farmer-report-interview-02-rotation';

update public.rotation_rules
set applies_to = array['sorghum', 'soybean'],
    follows = array['cowpea', 'soybean', 'maize']
where id = 'farmer-report-interview-03-rotation';
