-- =============================================================================
-- Seed the verified data sources, the research crop catalog, literature
-- rotation evidence, and the three Doka (Tofa LGA) field interview case studies.
--
-- Every crop parameter and rotation rule comes strictly from the verified
-- research records in data/reference/crop-requirements.json,
-- docs/research/evidence-register.csv and docs/research/rotation-evidence.md.
-- Unverified Tofa parameters remain null rather than invented.
-- =============================================================================

-- Allow growing_period_days to hold null min/max when Tofa variety maturity
-- days have not yet been verified by CDA / local agronomic review.
alter table public.crops
  drop constraint if exists crops_growing_period_is_a_range;

alter table public.crops
  add constraint crops_growing_period_is_a_range check (
    jsonb_typeof(growing_period_days) = 'object'
    and (growing_period_days ? 'min')
    and (growing_period_days ? 'max')
  );

-- -----------------------------------------------------------------------------
-- Additional verified data sources (docs/api/data-sources.md)
-- -----------------------------------------------------------------------------
insert into public.data_sources (
  source_key,
  name,
  source_url,
  licence,
  attribution,
  spatial_resolution_m,
  temporal_resolution,
  is_modelled
)
values
  (
    'smap_l3_enhanced',
    'NASA SMAP Enhanced L3 Daily 9 km Soil Moisture (SPL3SMP_E v006)',
    'https://nsidc.org/data/spl3smp_e/versions/6',
    'Public domain (NASA ESDIS open data policy)',
    'O''Neill, P. E., et al. SMAP Enhanced L3 Radiometer Global and Polar Grid Daily 9 km EASE-Grid Soil Moisture, Version 6. NASA NSIDC DAAC. https://doi.org/10.5067/M20OXIZHY3RJ',
    9000,
    'daily',
    false
  ),
  (
    'gpm_imerg_v07',
    'NASA GPM IMERG Precipitation V07',
    'https://gpm.nasa.gov/data/imerg',
    'Public domain (NASA ESDIS open data policy)',
    'Huffman, G. J., et al. GPM IMERG V07 precipitation data provided by NASA Goddard Earth Sciences Data and Information Services Center (GES DISC). https://doi.org/10.5067/GPM/IMERG/3B-HH/07',
    11132,
    'daily',
    false
  ),
  (
    'modis_mod13q1_v061',
    'NASA MODIS Terra Vegetation Indices 16-Day L3 Global 250 m (MOD13Q1 v061)',
    'https://www.earthdata.nasa.gov/data/catalog/lpcloud-mod13q1-061',
    'Public domain (LP DAAC open data policy)',
    'Didan, K. MODIS/Terra Vegetation Indices 16-Day L3 Global 250m SIN Grid V061. NASA EOSDIS Land Processes DAAC. https://doi.org/10.5067/MODIS/MOD13Q1.061',
    250,
    '16-day',
    false
  ),
  (
    'modis_mod11a2_v061',
    'NASA MODIS Terra Land Surface Temperature 8-Day L3 Global 1 km (MOD11A2 v061)',
    'https://modis.gsfc.nasa.gov/data/dataprod/mod11.php',
    'Public domain (LP DAAC open data policy)',
    'Wan, Z., S. Hook, G. Hulley. MODIS/Terra Land Surface Temperature/Emissivity 8-Day L3 Global 1km SIN Grid V061. NASA EOSDIS LP DAAC.',
    1000,
    '8-day',
    false
  ),
  (
    'landsat_c2_l2',
    'NASA/USGS Landsat Collection 2 Level-2 Surface Reflectance',
    'https://www.usgs.gov/landsat-missions/landsat-data-access',
    'Public domain (U.S. Government Works)',
    'Landsat Collection 2 Level-2 surface reflectance product courtesy of the U.S. Geological Survey and NASA.',
    30,
    '16-day',
    false
  ),
  (
    'chirps_v3',
    'UCSB CHG CHIRPS Daily Precipitation',
    'https://data.chc.ucsb.edu/products/CHIRPS/v3.0/daily/readme.txt',
    'Permissive / CC0 with required citation (DOI 10.15780/G2JQ0P)',
    'Funk, C., et al. Climate Hazards center InfraRed Precipitation with Station data (CHIRPS). UC Santa Barbara Climate Hazards Center. https://doi.org/10.15780/G2JQ0P',
    5500,
    'daily',
    true
  )
on conflict (source_key) do update set
  name = excluded.name,
  source_url = excluded.source_url,
  licence = excluded.licence,
  attribution = excluded.attribution,
  spatial_resolution_m = excluded.spatial_resolution_m,
  temporal_resolution = excluded.temporal_resolution,
  is_modelled = excluded.is_modelled;

-- -----------------------------------------------------------------------------
-- Crops catalog (seeded from data/reference/crop-requirements.json)
-- -----------------------------------------------------------------------------
insert into public.crops (
  code,
  name,
  scientific_name,
  farmer_reported_names,
  variety_or_cultivar,
  seed_or_market_classes,
  verified_aliases,
  category,
  applicable_regions,
  growing_period_days,
  agronomic_requirements,
  rotation_traits,
  source_citations,
  fertiliser,
  catalog_version
)
values
  (
    'sorghum',
    'Sorghum',
    'Sorghum bicolor (L.) Moench',
    '[{"name":"guinea corn","sourceReference":"docs/research/field-interviews/interview-03/transcript.md","evidenceStatus":"reported"},{"name":"sorghum","sourceReference":"docs/research/field-interviews/interview-03/transcript.md","evidenceStatus":"reported"}]'::jsonb,
    null,
    '[]'::jsonb,
    array[]::text[],
    'cereal',
    array['Tofa LGA, Kano State (Sudan Savanna)', 'Northern Nigeria'],
    '{"min":null,"max":null,"status":"unresolved_for_tofa"}'::jsonb,
    '{"rainfallRequirementMm":null,"indicativeCropWaterNeedMmPerSeason":{"min":450,"max":650,"evidenceId":"FAO-WATER-03","useAsHardConstraint":false},"temperatureC":null,"soilPh":null,"soilTexture":null,"droughtSensitivity":null,"plantingWindow":null}'::jsonb,
    '{"nitrogenContribution":"consumes","residueLoad":null,"diseaseBreak":null}'::jsonb,
    '[{"claim":"Indicative seasonal crop water need for sorghum/millet is 450 to 650 mm per total growing period (FAO rough estimate; crop ET need, not a Tofa rain-fed threshold).","value":"450-650","unit":"mm","sourceType":"literature","sourceUrl":"https://www.fao.org/4/s2022e/s2022e07.htm","accessedOn":"2026-11-14","citation":"Brouwer & Heibloem (1986), FAO Irrigation Water Management Training Manual No. 3, Ch. 3 (FAO-WATER-03)"}]'::jsonb,
    '{"required":null,"applicationsPerSeason":null}'::jsonb,
    'research-2026-11-14'
  ),
  (
    'pearl_millet',
    'Pearl millet',
    'Cenchrus americanus (syn. Pennisetum glaucum)',
    '[{"name":"millet","sourceReference":"docs/research/field-interviews/interview-02/case-study.md","evidenceStatus":"reported"}]'::jsonb,
    null,
    '[]'::jsonb,
    array[]::text[],
    'cereal',
    array['Tofa LGA, Kano State (Sudan Savanna)', 'West African Sahel'],
    '{"min":null,"max":null,"status":"unresolved_for_tofa"}'::jsonb,
    '{"rainfallRequirementMm":null,"indicativeCropWaterNeedMmPerSeason":{"min":450,"max":650,"evidenceId":"FAO-WATER-03","useAsHardConstraint":false},"temperatureC":null,"soilPh":null,"soilTexture":null,"droughtSensitivity":null,"plantingWindow":null}'::jsonb,
    '{"nitrogenContribution":"consumes","residueLoad":null,"diseaseBreak":null}'::jsonb,
    '[{"claim":"Indicative seasonal crop water need for sorghum/millet is 450 to 650 mm per total growing period (FAO rough estimate; crop ET need, not a Tofa rain-fed threshold).","value":"450-650","unit":"mm","sourceType":"literature","sourceUrl":"https://www.fao.org/4/s2022e/s2022e07.htm","accessedOn":"2026-11-14","citation":"Brouwer & Heibloem (1986), FAO Irrigation Water Management Training Manual No. 3, Ch. 3 (FAO-WATER-03)"}]'::jsonb,
    '{"required":null,"applicationsPerSeason":null}'::jsonb,
    'research-2026-11-14'
  ),
  (
    'maize',
    'Maize',
    'Zea mays L.',
    '[{"name":"maize","sourceReference":"docs/research/field-interviews/interview-02/transcript.md","evidenceStatus":"reported"}]'::jsonb,
    null,
    '[]'::jsonb,
    array[]::text[],
    'cereal',
    array['Tofa LGA, Kano State (Sudan Savanna)', 'Northern Guinea Savanna'],
    '{"min":null,"max":null,"status":"unresolved_for_tofa"}'::jsonb,
    '{"rainfallRequirementMm":null,"indicativeCropWaterNeedMmPerSeason":{"min":500,"max":800,"evidenceId":"FAO-WATER-01","useAsHardConstraint":false},"temperatureC":null,"soilPh":null,"soilTexture":null,"droughtSensitivity":null,"plantingWindow":null}'::jsonb,
    '{"nitrogenContribution":"consumes","residueLoad":null,"diseaseBreak":null}'::jsonb,
    '[{"claim":"Indicative seasonal crop water need for maize is 500 to 800 mm per total growing period (FAO rough estimate; crop ET need, not a Tofa rain-fed threshold).","value":"500-800","unit":"mm","sourceType":"literature","sourceUrl":"https://www.fao.org/4/s2022e/s2022e07.htm","accessedOn":"2026-11-14","citation":"Brouwer & Heibloem (1986), FAO Irrigation Water Management Training Manual No. 3, Ch. 3 (FAO-WATER-01)"}]'::jsonb,
    '{"required":null,"applicationsPerSeason":null}'::jsonb,
    'research-2026-11-14'
  ),
  (
    'cowpea',
    'Cowpea',
    'Vigna unguiculata (L.) Walp.',
    '[{"name":"cowpea","sourceReference":"docs/research/field-interviews/interview-02/transcript.md","evidenceStatus":"reported"},{"name":"white cowpeas","sourceReference":"docs/research/field-interviews/interview-03/transcript.md","evidenceStatus":"reported"}]'::jsonb,
    null,
    '[{"label":"white-seeded / white cowpea","attributeType":"unknown","evidenceStatus":"farmer_reported_unverified","sourceReference":"docs/research/field-interviews/interview-03/transcript.md"}]'::jsonb,
    array[]::text[],
    'legume',
    array['Tofa LGA, Kano State (Sudan Savanna)', 'Northern Nigeria'],
    '{"min":null,"max":null,"status":"unresolved_for_tofa"}'::jsonb,
    '{"rainfallRequirementMm":null,"indicativeCropWaterNeedMmPerSeason":null,"temperatureC":null,"soilPh":null,"soilTexture":null,"droughtSensitivity":null,"plantingWindow":null}'::jsonb,
    '{"nitrogenContribution":"fixes","residueLoad":null,"diseaseBreak":null}'::jsonb,
    '[{"claim":"Cowpea (Vigna unguiculata) evaluated as a grain legume preceding maize in Northern Guinea Savanna rotation trials; white cowpeas recorded as farmer-reported wording in Doka.","value":"Vigna unguiculata","sourceType":"literature","sourceUrl":"https://doi.org/10.1007/s10705-008-9232-9","accessedOn":"2026-11-14","citation":"Yusuf et al. (2009), Nutrient Cycling in Agroecosystems (NIGERIA-ROT-01)"}]'::jsonb,
    '{"required":null,"applicationsPerSeason":null}'::jsonb,
    'research-2026-11-14'
  ),
  (
    'soybean',
    'Soybean',
    'Glycine max (L.) Merr.',
    '[{"name":"soybeans","sourceReference":"docs/research/field-interviews/interview-02/transcript.md","evidenceStatus":"reported"}]'::jsonb,
    null,
    '[]'::jsonb,
    array[]::text[],
    'legume',
    array['Tofa LGA, Kano State (Sudan Savanna)', 'Northern Guinea Savanna'],
    '{"min":null,"max":null,"status":"unresolved_for_tofa"}'::jsonb,
    '{"rainfallRequirementMm":null,"indicativeCropWaterNeedMmPerSeason":{"min":450,"max":700,"evidenceId":"FAO-WATER-04","useAsHardConstraint":false},"temperatureC":null,"soilPh":null,"soilTexture":null,"droughtSensitivity":null,"plantingWindow":null}'::jsonb,
    '{"nitrogenContribution":"fixes","residueLoad":null,"diseaseBreak":null}'::jsonb,
    '[{"claim":"Indicative seasonal crop water need for soybean is 450 to 700 mm per total growing period (FAO rough estimate; crop ET need, not a Tofa rain-fed threshold).","value":"450-700","unit":"mm","sourceType":"literature","sourceUrl":"https://www.fao.org/4/s2022e/s2022e07.htm","accessedOn":"2026-11-14","citation":"Brouwer & Heibloem (1986), FAO Irrigation Water Management Training Manual No. 3, Ch. 3 (FAO-WATER-04)"}]'::jsonb,
    '{"required":null,"applicationsPerSeason":null}'::jsonb,
    'research-2026-11-14'
  ),
  (
    'groundnut',
    'Groundnut',
    'Arachis hypogaea L.',
    '[{"name":"groundnuts","sourceReference":"docs/research/field-interviews/interview-03/transcript.md","evidenceStatus":"reported"}]'::jsonb,
    null,
    '[]'::jsonb,
    array[]::text[],
    'legume',
    array['Tofa LGA, Kano State (Sudan Savanna)', 'Northern Nigeria'],
    '{"min":null,"max":null,"status":"unresolved_for_tofa"}'::jsonb,
    '{"rainfallRequirementMm":null,"indicativeCropWaterNeedMmPerSeason":{"min":500,"max":700,"evidenceId":"FAO-WATER-02","useAsHardConstraint":false},"temperatureC":null,"soilPh":null,"soilTexture":null,"droughtSensitivity":null,"plantingWindow":null}'::jsonb,
    '{"nitrogenContribution":"fixes","residueLoad":null,"diseaseBreak":null}'::jsonb,
    '[{"claim":"Indicative seasonal crop water need for groundnut is 500 to 700 mm per total growing period (FAO rough estimate; crop ET need, not a Tofa rain-fed threshold).","value":"500-700","unit":"mm","sourceType":"literature","sourceUrl":"https://www.fao.org/4/s2022e/s2022e07.htm","accessedOn":"2026-11-14","citation":"Brouwer & Heibloem (1986), FAO Irrigation Water Management Training Manual No. 3, Ch. 3 (FAO-WATER-02)"}]'::jsonb,
    '{"required":null,"applicationsPerSeason":null}'::jsonb,
    'research-2026-11-14'
  ),
  (
    'tomato',
    'Tomato',
    'Solanum lycopersicum L.',
    '[{"name":"tomatoes","sourceReference":"docs/research/field-interviews/interview-02/transcript.md","evidenceStatus":"reported"}]'::jsonb,
    null,
    '[]'::jsonb,
    array[]::text[],
    'vegetable',
    array['Tofa LGA, Kano State (Sudan Savanna)'],
    '{"min":null,"max":null,"status":"unresolved_for_tofa"}'::jsonb,
    '{"rainfallRequirementMm":null,"indicativeCropWaterNeedMmPerSeason":{"min":400,"max":800,"evidenceId":"FAO-WATER-06","useAsHardConstraint":false},"temperatureC":null,"soilPh":null,"soilTexture":null,"droughtSensitivity":null,"plantingWindow":null}'::jsonb,
    '{"nitrogenContribution":"consumes","residueLoad":null,"diseaseBreak":null}'::jsonb,
    '[{"claim":"Indicative seasonal crop water need for tomato is 400 to 800 mm per total growing period (FAO rough estimate; crop ET need, not a Tofa rain-fed threshold).","value":"400-800","unit":"mm","sourceType":"literature","sourceUrl":"https://www.fao.org/4/s2022e/s2022e07.htm","accessedOn":"2026-11-14","citation":"Brouwer & Heibloem (1986), FAO Irrigation Water Management Training Manual No. 3, Ch. 3 (FAO-WATER-06)"}]'::jsonb,
    '{"required":null,"applicationsPerSeason":null}'::jsonb,
    'research-2026-11-14'
  ),
  (
    'pepper',
    'Pepper',
    'Capsicum spp.',
    '[{"name":"peppers","sourceReference":"docs/research/field-interviews/interview-02/transcript.md","evidenceStatus":"reported"}]'::jsonb,
    null,
    '[]'::jsonb,
    array[]::text[],
    'vegetable',
    array['Tofa LGA, Kano State (Sudan Savanna)'],
    '{"min":null,"max":null,"status":"unresolved_for_tofa"}'::jsonb,
    '{"rainfallRequirementMm":null,"indicativeCropWaterNeedMmPerSeason":{"min":600,"max":900,"evidenceId":"FAO-WATER-05","useAsHardConstraint":false},"temperatureC":null,"soilPh":null,"soilTexture":null,"droughtSensitivity":null,"plantingWindow":null}'::jsonb,
    '{"nitrogenContribution":"consumes","residueLoad":null,"diseaseBreak":null}'::jsonb,
    '[{"claim":"Indicative seasonal crop water need for pepper is 600 to 900 mm per total growing period (FAO rough estimate; species and hot/sweet type unresolved in Tofa interviews).","value":"600-900","unit":"mm","sourceType":"literature","sourceUrl":"https://www.fao.org/4/s2022e/s2022e07.htm","accessedOn":"2026-11-14","citation":"Brouwer & Heibloem (1986), FAO Irrigation Water Management Training Manual No. 3, Ch. 3 (FAO-WATER-05)"}]'::jsonb,
    '{"required":null,"applicationsPerSeason":null}'::jsonb,
    'research-2026-11-14'
  )
on conflict (code) do update set
  name = excluded.name,
  scientific_name = excluded.scientific_name,
  farmer_reported_names = excluded.farmer_reported_names,
  variety_or_cultivar = excluded.variety_or_cultivar,
  seed_or_market_classes = excluded.seed_or_market_classes,
  verified_aliases = excluded.verified_aliases,
  category = excluded.category,
  applicable_regions = excluded.applicable_regions,
  growing_period_days = excluded.growing_period_days,
  agronomic_requirements = excluded.agronomic_requirements,
  rotation_traits = excluded.rotation_traits,
  source_citations = excluded.source_citations,
  fertiliser = excluded.fertiliser,
  catalog_version = excluded.catalog_version;

-- -----------------------------------------------------------------------------
-- Literature-backed rotation evidence (docs/research/rotation-evidence.md)
-- -----------------------------------------------------------------------------
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
    'literature-samaru-yusuf-2009-legume-maize',
    'Sequential rotation of maize after grain legumes (cowpea or soybean) increased mean maize yield relative to continuous maize (1.3x) and fallow (1.2x) in Samaru field trials (2003 to 2005).',
    'literature',
    'Yusuf et al. (2009)',
    'https://doi.org/10.1007/s10705-008-9232-9',
    date '2026-11-14',
    array['cowpea', 'soybean'],
    array['maize'],
    'Separated fixed-nitrogen effects from other rotation effects in Northern Guinea Savanna trials; transfer to Tofa Sudan Savanna requires local CDA review and does not guarantee an equivalent yield increase or fertilizer replacement.'
  ),
  (
    'literature-icrisat-bado-2022-millet-cowpea',
    'Sequential pearl millet and cowpea rotation evaluated over 25 years in West African Sahelian trials improved productivity when combined with crop residue and nutrient management.',
    'literature',
    'Bado et al. (2022)',
    'https://oar.icrisat.org/11988/',
    date '2026-11-14',
    array['pearl_millet', 'cowpea'],
    array['cowpea', 'pearl_millet'],
    'Long-term sequential cereal-legume rotation interacted with residue and mineral fertilizer management at ICRISAT Sadore, Niger; requires local Tofa validation and must be distinguished from within-season intercropping.'
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

-- -----------------------------------------------------------------------------
-- Case studies (docs/research/field-interviews/interview-01..03/case-study.md)
-- -----------------------------------------------------------------------------
insert into public.case_studies (
  slug,
  farmer_name,
  village,
  lga,
  state,
  farming_experience,
  summary,
  body,
  crop_codes,
  planting_trigger,
  consented_to_publication,
  consented_to_gps,
  published
)
values
  (
    'bello-yusuf-maitama',
    'Bello Yusuf Maitama',
    'Doka',
    'Tofa',
    'Kano',
    'Smallholder farmer managing 2 to 4 hectares across non-contiguous parcels in Doka village.',
    'Farms 2 to 4 ha across non-contiguous parcels in the rainy season only using strip cropping (sorghum, maize, soybeans, groundnuts, tomatoes, peppers). Waits for confirmed soil moisture across light showers before planting.',
    'Bello Yusuf Maitama farms roughly 2 to 4 hectares across non-contiguous parcels in Doka village, Tofa LGA, Kano State. Because well water is limited around his parcels, he farms strictly in the rainy season. He practices strip cropping to suppress weeds, protect the soil surface, and disrupt pest cycles. For planting timing, he waits until the soil retains confirmed moisture from early showers rather than rushing on the first rain.',
    array['sorghum', 'maize', 'soybean', 'groundnut', 'tomato', 'pepper'],
    'wait_for_confirmed_moisture',
    true,
    true,
    true
  ),
  (
    'amina-habibu',
    'Amina Habibu',
    'Doka',
    'Tofa',
    'Kano',
    'Experienced farmer managing roughly 4 hectares across three main fields and two smaller plots, trained through Bayero University extension outreach.',
    'Manages roughly 4 ha across rainy and dry seasons with structured ridge strip plans (3:3 sorghum and soybean, 4:3 sorghum and groundnut, 4:4 sorghum and soybean separated by kalankuwa millet border lines) and seasonal crop rotation. Plants immediately on the first rains.',
    'Amina Habibu manages roughly 4 hectares across three larger fields and two smaller plots in Doka village, Tofa LGA, farming in both the rainy and dry seasons. She uses structured ridge ratios separated by millet boundary lines (kalankuwa) and rotates crops across seasons to sorghum, pearl millet, or late millet before returning earlier crops. Because the rainy season can end early, she plants immediately when the first rains arrive.',
    array['sorghum', 'pearl_millet', 'maize', 'cowpea', 'soybean', 'groundnut', 'tomato', 'pepper'],
    'plant_on_first_rains',
    true,
    true,
    true
  ),
  (
    'abubakar-dan-hajiya',
    'Abubakar (Dan Hajiya)',
    'Doka',
    'Tofa',
    'Kano',
    '30 years of farming experience; owns roughly 30 hectares divided into plots of about 3 hectares each.',
    'Farms roughly 30 ha in 3 ha plots across rainy and dry seasons. Follows a 2-to-3-year plot rotation alternating sorghum and soybean with white cowpeas or maize. Prepares land and plants quickly once early rains establish good soil moisture.',
    'Abubakar (Dan Hajiya) has 30 years of farming experience in Doka village, Tofa LGA, managing roughly 30 hectares of owned farmland divided into plots of about 3 hectares. He rotates per plot on a two-to-three-year cycle, alternating sorghum and soybeans with white cowpeas or maize, and notes that soybeans require less chemical fertilizer than maize. He prepares the land and plants quickly once early rains establish good moisture in the soil.',
    array['sorghum', 'maize', 'cowpea', 'soybean', 'groundnut'],
    'prepare_and_plant_quickly',
    true,
    false,
    true
  )
on conflict (slug) do update set
  farmer_name = excluded.farmer_name,
  village = excluded.village,
  lga = excluded.lga,
  state = excluded.state,
  farming_experience = excluded.farming_experience,
  summary = excluded.summary,
  body = excluded.body,
  crop_codes = excluded.crop_codes,
  planting_trigger = excluded.planting_trigger,
  consented_to_publication = excluded.consented_to_publication,
  consented_to_gps = excluded.consented_to_gps,
  published = excluded.published;
