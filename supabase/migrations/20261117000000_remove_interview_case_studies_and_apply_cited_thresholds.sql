-- =============================================================================
-- Privacy cleanup and catalog update for already-deployed databases.
--
-- The seed migration (20261114152000) has been amended so FRESH databases do
-- not seed interview case studies and do carry the cited rainfall thresholds.
-- This migration brings databases that already ran the old seed up to the same
-- state: it purges all personal case-study data and applies the same thresholds.
--
-- The interview participants were research volunteers. Their names, village,
-- holding sizes and per-farm practice must not be stored in a public product.
-- =============================================================================

-- 1. Remove the case-study feature data entirely. The application no longer
--    exposes any /cases page or /api/case-studies route.
drop table if exists public.case_studies;

-- 2. Apply cited, documented rain-fed rainfall floors and advisory maturity
--    bounds to the catalog. These are the low end of published ranges for West
--    African rain-fed systems, not Tofa-local measurements. The engine's
--    resolution gate prevents coarse POWER data from ever producing a hard
--    "suitable" or "not suitable" verdict from them. Source details are in
--    docs/research/evidence-register.csv and the crop's source_citations.

update public.crops
set agronomic_requirements = jsonb_set(
      coalesce(agronomic_requirements, '{}'::jsonb),
      '{rainfallRequirementMm}',
      '{"min":400,"max":null,"citation":"Concern Worldwide, Crop Weather and Climate Vulnerability Profiles (sorghum 400-900 mm/season); corroborated by ICRISAT/WASIP (1990), 400-500 mm in the southern Sahel. Low end of the cited rain-fed range, not a Tofa-local threshold. Accessed 2026-11-17.","hardConstraint":true}'::jsonb,
      true
    ),
    growing_period_days = '{"min":120,"max":135,"status":"advisory_sudan_savanna","citation":"Kassam (1976), Crops of the West African Semi-Arid Tropics, ICRISAT; local photoperiodic sorghum 120-135 days in the Sudan Savanna. Advisory only. Accessed 2026-11-17."}'::jsonb
where code = 'sorghum';

update public.crops
set agronomic_requirements = jsonb_set(
      coalesce(agronomic_requirements, '{}'::jsonb),
      '{rainfallRequirementMm}',
      '{"min":250,"max":null,"citation":"Concern Worldwide, Crop Weather and Climate Vulnerability Profiles (pearl millet 250-700 mm/season); Ajeigbe et al. (2020), ICRISAT Nigeria handbook (mostly 250-700 mm). Low end of the cited range, not a Tofa-local threshold. Accessed 2026-11-17.","hardConstraint":true}'::jsonb,
      true
    ),
    growing_period_days = '{"min":55,"max":70,"status":"advisory_early_types","citation":"Ajeigbe et al. (2020), Handbook on Improved Pearl Millet Production Practices in North Eastern Nigeria, ICRISAT; early types mature 55-65 days. Advisory only. Accessed 2026-11-17."}'::jsonb
where code = 'pearl_millet';

update public.crops
set agronomic_requirements = jsonb_set(
      coalesce(agronomic_requirements, '{}'::jsonb),
      '{rainfallRequirementMm}',
      '{"min":500,"max":null,"citation":"Concern Worldwide, Crop Weather and Climate Vulnerability Profiles (maize 500-1200 mm/cycle, optimum 600-900 mm); ICRISAT (1984) documents failure-level yields near 400 mm. Low end of the cited range; maize is marginal in the drier Tofa area. Accessed 2026-11-17.","hardConstraint":true}'::jsonb,
      true
    )
where code = 'maize';

update public.crops
set agronomic_requirements = jsonb_set(
      coalesce(agronomic_requirements, '{}'::jsonb),
      '{rainfallRequirementMm}',
      '{"min":300,"max":null,"citation":"Omoigui et al. (2018), Guide to Cowpea production in West Africa, IITA/ICRISAT (KNARDA Kano partner); Sudan-savanna short-rainfall band 300-500 mm with 60-70-day varieties. Low end of the cited range, not a Tofa-local threshold. Accessed 2026-11-17.","hardConstraint":true}'::jsonb,
      true
    ),
    growing_period_days = '{"min":60,"max":85,"status":"advisory_sudan_savanna","citation":"Omoigui et al. (2018), Guide to Cowpea production in West Africa, IITA/ICRISAT; Nigerian released varieties 60-85 days. Advisory only. Accessed 2026-11-17."}'::jsonb
where code = 'cowpea';

update public.crops
set agronomic_requirements = jsonb_set(
      coalesce(agronomic_requirements, '{}'::jsonb),
      '{rainfallRequirementMm}',
      '{"min":350,"max":null,"citation":"Concern Worldwide, Crop Weather and Climate Vulnerability Profiles (soybean 350-1100 mm/cycle); FAO Irrigation & Drainage 56 range 450-825 mm. Low end of the cited range; soybean is advisory at the dry margin of the Tofa area. Accessed 2026-11-17.","hardConstraint":true}'::jsonb,
      true
    )
where code = 'soybean';

-- Groundnut: no single defensible rain-fed floor (published minima range from
-- 250 mm for extra-early to 500 mm for late types), so rainfallRequirementMm
-- is deliberately left unset. Tomato and pepper have no rain-fed threshold in
-- the reviewed literature and are likewise left unset. This is honest, not an
-- omission: the engine reports an unverified_requirement limitation for them.
