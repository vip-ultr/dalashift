-- =============================================================================
-- Analyses, qualitative recommendations, rotation comparisons and reports.
--
-- Decision D-05 (ADR-0011): there is no composite suitability score, no
-- weighting system, no confidence percentage and no verdict threshold.
-- Every persisted assessment records per-dimension comparisons against cited
-- thresholds, an ordinal ranking with a stated basis, and a qualitative
-- evidence strength ('strong', 'moderate', 'weak') with its reason.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- recommendation_rulesets
-- -----------------------------------------------------------------------------
create table public.recommendation_rulesets (
  id uuid primary key default gen_random_uuid(),
  version text not null unique check (length(btrim(version)) > 0),
  content_hash text not null check (length(btrim(content_hash)) > 0),
  content jsonb not null,
  published_at timestamptz not null default now(),
  notes text
);

comment on table public.recommendation_rulesets is
  'Versioned qualitative ruleset definitions used by the deterministic assessment and comparison engine.';

alter table public.recommendation_rulesets enable row level security;

create policy recommendation_rulesets_read
on public.recommendation_rulesets
for select
using (true);

insert into public.recommendation_rulesets (
  version,
  content_hash,
  content,
  notes
)
values (
  '2026.11.14-qualitative',
  'sha256:9f84c2b5d1e8407a9b61c3d0e4f281a6b7c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3',
  jsonb_build_object(
    'adr', 'ADR-0011',
    'scoringMode', 'qualitative_only',
    'verdictOrder', jsonb_build_array('suitable', 'conditional', 'insufficient_information', 'not_suitable'),
    'statusOrder', jsonb_build_array('pass', 'uncertain', 'not_assessed', 'fail'),
    'plantingTriggers', jsonb_build_array(
      'wait_for_confirmed_moisture',
      'plant_on_first_rains',
      'prepare_and_plant_quickly'
    )
  ),
  'Initial ADR-0011 qualitative ruleset: no composite scores, weights or confidence percentages.'
)
on conflict (version) do update set
  content_hash = excluded.content_hash,
  content = excluded.content,
  notes = excluded.notes;

-- -----------------------------------------------------------------------------
-- analyses
-- -----------------------------------------------------------------------------
create table public.analyses (
  id uuid primary key default gen_random_uuid(),
  farm_id uuid not null references public.farms (id) on delete cascade,
  parcel_id uuid references public.parcels (id) on delete set null,
  kind text not null
    check (
      kind in (
        'environment',
        'recommendation',
        'rotation',
        'suitability',
        'outlook',
        'planting_trigger',
        'monitoring'
      )
    ),
  status text not null default 'complete'
    check (status in ('pending', 'complete', 'partial', 'failed')),
  period_start date,
  period_end date,
  inputs jsonb not null default '{}'::jsonb,
  inputs_hash text not null check (length(btrim(inputs_hash)) > 0),
  code_version text not null check (length(btrim(code_version)) > 0),
  limitations jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  constraint analyses_period_ordered check (
    period_start is null or period_end is null or period_start <= period_end
  ),
  constraint analyses_limitations_array check (jsonb_typeof(limitations) = 'array')
);

comment on table public.analyses is
  'Immutable snapshot of inputs and status for an environmental or recommendation run on a farm or parcel.';

create index analyses_farm_created_idx on public.analyses (farm_id, created_at desc);
create index analyses_parcel_created_idx on public.analyses (parcel_id, created_at desc)
  where parcel_id is not null;

-- Ensure a non-null parcel_id on an analysis belongs to the same farm.
create or replace function public.validate_analysis_parcel_farm()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.parcel_id is not null and not exists (
    select 1
    from public.parcels p
    where p.id = new.parcel_id
      and p.farm_id = new.farm_id
  ) then
    raise exception 'Parcel must belong to the same farm as the analysis';
  end if;
  return new;
end;
$$;

create trigger analyses_validate_parcel_farm
before insert or update on public.analyses
for each row execute function public.validate_analysis_parcel_farm();

alter table public.analyses enable row level security;

create policy analyses_all_own
on public.analyses
for all
using (
  exists (
    select 1
    from public.farms f
    where f.id = analyses.farm_id
      and f.farmer_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.farms f
    where f.id = analyses.farm_id
      and f.farmer_id = auth.uid()
  )
);

-- -----------------------------------------------------------------------------
-- recommendations (qualitative crop assessments, ADR-0011 D-05)
-- -----------------------------------------------------------------------------
create table public.recommendations (
  id uuid primary key default gen_random_uuid(),
  analysis_id uuid not null references public.analyses (id) on delete cascade,
  farm_id uuid not null references public.farms (id) on delete cascade,
  parcel_id uuid references public.parcels (id) on delete set null,
  crop_id uuid not null references public.crops (id),
  verdict text not null
    check (verdict in ('suitable', 'conditional', 'not_suitable', 'insufficient_information')),
  dimensions jsonb not null default '[]'::jsonb,
  rationale text not null check (length(btrim(rationale)) > 0),
  limitations jsonb not null default '[]'::jsonb,
  evidence_strength text not null
    check (evidence_strength in ('strong', 'moderate', 'weak')),
  evidence_strength_reason text not null check (length(btrim(evidence_strength_reason)) > 0),
  ruleset_version text not null references public.recommendation_rulesets (version),
  requires_local_review boolean not null default true,
  created_at timestamptz not null default now(),
  constraint recommendations_dimensions_array check (jsonb_typeof(dimensions) = 'array'),
  constraint recommendations_limitations_array check (jsonb_typeof(limitations) = 'array')
);

comment on table public.recommendations is
  'Qualitative crop assessments per parcel. Carries dimension assessments and evidence strength, never a numeric score.';

create index recommendations_farm_crop_idx
  on public.recommendations (farm_id, crop_id, created_at desc);
create index recommendations_analysis_idx
  on public.recommendations (analysis_id);

alter table public.recommendations enable row level security;

create policy recommendations_all_own
on public.recommendations
for all
using (
  exists (
    select 1
    from public.farms f
    where f.id = recommendations.farm_id
      and f.farmer_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.farms f
    where f.id = recommendations.farm_id
      and f.farmer_id = auth.uid()
  )
);

-- -----------------------------------------------------------------------------
-- rotation_strategies
-- -----------------------------------------------------------------------------
create table public.rotation_strategies (
  id uuid primary key default gen_random_uuid(),
  analysis_id uuid not null references public.analyses (id) on delete cascade,
  farm_id uuid not null references public.farms (id) on delete cascade,
  parcel_id uuid references public.parcels (id) on delete set null,
  kind text not null check (kind in ('existing', 'alternative')),
  label text not null check (length(btrim(label)) > 0),
  rationale text not null check (length(btrim(rationale)) > 0),
  evidence jsonb not null default '[]'::jsonb,
  benefits text[] not null default '{}',
  information_gaps text[] not null default '{}',
  local_review_risks text[] not null default '{}',
  rank text check (rank is null or rank in ('first', 'tied', 'lower')),
  ranking_basis text not null check (length(btrim(ranking_basis)) > 0),
  evidence_strength text not null check (evidence_strength in ('strong', 'moderate', 'weak')),
  evidence_strength_reason text not null check (length(btrim(evidence_strength_reason)) > 0),
  ruleset_version text not null references public.recommendation_rulesets (version),
  created_at timestamptz not null default now(),
  constraint rotation_strategies_evidence_array check (jsonb_typeof(evidence) = 'array')
);

comment on table public.rotation_strategies is
  'Evaluated rotation or suitability strategies with evidence, benefits, information gaps, local review risks and ordinal rank.';

create index rotation_strategies_analysis_idx on public.rotation_strategies (analysis_id);
create index rotation_strategies_farm_idx on public.rotation_strategies (farm_id, created_at desc);

alter table public.rotation_strategies enable row level security;

create policy rotation_strategies_all_own
on public.rotation_strategies
for all
using (
  exists (
    select 1
    from public.farms f
    where f.id = rotation_strategies.farm_id
      and f.farmer_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.farms f
    where f.id = rotation_strategies.farm_id
      and f.farmer_id = auth.uid()
  )
);

-- -----------------------------------------------------------------------------
-- rotation_legs
-- -----------------------------------------------------------------------------
create table public.rotation_legs (
  id uuid primary key default gen_random_uuid(),
  strategy_id uuid not null references public.rotation_strategies (id) on delete cascade,
  sequence integer not null check (sequence >= 0),
  season text not null check (season in ('rainy', 'dry', 'harmattan', 'year_round', 'unknown')),
  crop_id uuid not null references public.crops (id),
  parcel_id uuid references public.parcels (id) on delete set null,
  area_ha numeric(12, 3) check (area_ha is null or area_ha > 0),
  crop_assessment jsonb not null,
  notes text,
  unique (strategy_id, sequence)
);

comment on table public.rotation_legs is
  'Ordered seasonal crop steps inside a rotation strategy.';

create index rotation_legs_strategy_idx on public.rotation_legs (strategy_id, sequence);

alter table public.rotation_legs enable row level security;

create policy rotation_legs_all_own
on public.rotation_legs
for all
using (
  exists (
    select 1
    from public.rotation_strategies rs
    join public.farms f on f.id = rs.farm_id
    where rs.id = rotation_legs.strategy_id
      and f.farmer_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.rotation_strategies rs
    join public.farms f on f.id = rs.farm_id
    where rs.id = rotation_legs.strategy_id
      and f.farmer_id = auth.uid()
  )
);

-- -----------------------------------------------------------------------------
-- reports
-- -----------------------------------------------------------------------------
create table public.reports (
  id uuid primary key default gen_random_uuid(),
  farm_id uuid not null references public.farms (id) on delete cascade,
  parcel_id uuid references public.parcels (id) on delete set null,
  kind text not null check (kind in ('farm_summary', 'seasonal', 'rotation_plan')),
  period_start date,
  period_end date,
  params jsonb not null default '{}'::jsonb,
  payload jsonb not null default '{}'::jsonb,
  storage_path text,
  generated_at timestamptz not null default now(),
  constraint reports_period_ordered check (
    period_start is null or period_end is null or period_start <= period_end
  )
);

comment on table public.reports is
  'Generated farm reports containing environmental provenance, qualitative rotation comparisons and source attributions.';

create index reports_farm_generated_idx on public.reports (farm_id, generated_at desc);

alter table public.reports enable row level security;

create policy reports_all_own
on public.reports
for all
using (
  exists (
    select 1
    from public.farms f
    where f.id = reports.farm_id
      and f.farmer_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.farms f
    where f.id = reports.farm_id
      and f.farmer_id = auth.uid()
  )
);
