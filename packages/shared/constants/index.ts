/**
 * Canonical constants shared across the DalaShift monorepo.
 *
 * These are the vocabulary the whole system agrees on: units, variable
 * identifiers, spatial resolutions, quality flags, and the qualitative
 * vocabulary of the comparison engine.
 *
 * The engine vocabulary changed with ADR-0011 (decision D-05): there is no
 * composite score, no weighting system, no confidence percentage and no
 * verdict threshold. What remains is a status per dimension, an ordinal
 * ranking with a stated basis, and a qualitative evidence strength with a
 * reason attached.
 *
 * @packageDocumentation
 */

/** Canonical unit identifiers. Every stored value uses one of these. */
export const UNITS = {
  millimetre: 'mm',
  degreeCelsius: 'degC',
  cubicMetrePerCubicMetre: 'm3_m3',
  dimensionless: '1',
  megajoulePerSquareMetrePerDay: 'MJ_m2_day',
  metrePerSecond: 'm_s',
  percent: '%',
  degree: 'deg',
  metre: 'm',
  hectare: 'ha',
  wattPerSquareMetre: 'W_m2',
} as const;

export type Unit = (typeof UNITS)[keyof typeof UNITS];

/**
 * Temporal resolution identifiers for stored observations.
 * Mirrors the vocabulary used by the upstream providers.
 */
export const TEMPORAL_RESOLUTIONS = [
  'hourly',
  'daily',
  '3-hourly',
  '8-day',
  '16-day',
  'monthly',
  'seasonal',
  'annual',
  'climatology',
] as const;

export type TemporalResolution = (typeof TEMPORAL_RESOLUTIONS)[number];

/**
 * Canonical environment variable identifiers.
 *
 * These are provider-neutral: the integration layer maps upstream parameter
 * names onto these ids, so downstream code never depends on a provider's
 * naming scheme.
 */
export const ENVIRONMENT_VARIABLES = {
  precipitation: 'precipitation_mm',
  precipitationSatellite: 'precipitation_satellite_mm',
  temperatureMean: 'temperature_mean_degC',
  temperatureMax: 'temperature_max_degC',
  temperatureMin: 'temperature_min_degC',
  soilTemperature: 'soil_temperature_degC',
  soilMoistureSurface: 'soil_moisture_surface_m3_m3',
  soilMoistureRootZone: 'soil_moisture_root_zone_m3_m3',
  soilMoistureProfile: 'soil_moisture_profile_m3_m3',
  soilWetnessRootZone: 'soil_wetness_root_zone',
  relativeHumidity: 'relative_humidity_pct',
  windSpeed: 'wind_speed_m_s',
  shortwaveRadiation: 'shortwave_radiation_MJ_m2_day',
  photosyntheticallyActiveRadiation: 'par_MJ_m2_day',
  evapotranspiration: 'evapotranspiration_mm_day',
  growingDegreeDays: 'growing_degree_days',
  frostDays: 'frost_days',
  ndvi: 'ndvi',
  evi: 'evi',
  landSurfaceTemperature: 'land_surface_temperature_degC',
  elevation: 'elevation_m',
  soilPh: 'soil_ph',
  soilClay: 'soil_clay_pct',
  soilSand: 'soil_sand_pct',
  soilSilt: 'soil_silt_pct',
  soilOrganicCarbon: 'soil_organic_carbon_g_kg',
  soilBulkDensity: 'soil_bulk_density_kg_dm3',
} as const;

export type EnvironmentVariable =
  (typeof ENVIRONMENT_VARIABLES)[keyof typeof ENVIRONMENT_VARIABLES];

/** Quality flags attached to a stored observation. */
export const QUALITY_FLAGS = ['good', 'suspect', 'missing', 'partial'] as const;

export type QualityFlag = (typeof QUALITY_FLAGS)[number];

/**
 * The resolution ladder.
 *
 * These are the *real* spatial resolutions of the sources we integrate, in
 * metres. They exist so that no code, and no screen, ever implies more
 * precision than the source has.
 *
 * See docs/api/data-sources.md for the source of every number.
 */
export const SPATIAL_RESOLUTION_METRES = {
  /** Landsat Collection 2 Level 2 surface reflectance. */
  landsat: 30,
  /** Copernicus Sentinel-2 Level 2A (via Google Earth Engine). */
  sentinel2: 10,
  /** ISRIC SoilGrids 2.0 primary grid. */
  soilGrids: 250,
  /** MODIS MOD13Q1 vegetation index. */
  modisVegetationIndex: 250,
  /** MODIS MOD13A2 vegetation index. */
  modisVegetationIndexCoarse: 1000,
  /** MODIS MOD11 land surface temperature. */
  modisLandSurfaceTemperature: 1000,
  /** NASA SMAP L3 enhanced. */
  smapSoilMoisture: 9000,
  /** NASA GPM IMERG v07. */
  gpmImerg: 11_132,
  /** CHIRPS v3 daily. */
  chirps: 5500,
  /** NASA POWER meteorological grid: 0.5° latitude. */
  powerLatitude: 55_000,
  /** NASA POWER meteorological grid: 0.625° longitude. */
  powerLongitude: 70_000,
} as const;

export type SpatialResolutionKey = keyof typeof SPATIAL_RESOLUTION_METRES;

/**
 * Plain-language descriptions of resolution, for the interface.
 *
 * The product rule: a farmer must be able to understand, without jargon, how
 * far the number reaches. These strings are the approved wording.
 */
export const RESOLUTION_DESCRIPTIONS: Record<SpatialResolutionKey, string> = {
  landsat: 'measured over your farm at 30 m resolution',
  sentinel2: 'measured over your farm at 10 m resolution',
  soilGrids: 'an estimate for the 250 m cell containing your farm',
  modisVegetationIndex: 'an estimate for the 250 m cell containing your farm',
  modisVegetationIndexCoarse: 'an estimate for the 1 km cell containing your farm',
  modisLandSurfaceTemperature: 'an estimate for the 1 km cell containing your farm',
  smapSoilMoisture: 'an estimate for the 9 km area around your farm',
  gpmImerg: 'an estimate for the 11 km area around your farm',
  chirps: 'an estimate for the 5.5 km area around your farm',
  powerLatitude: 'a regional climate figure covering roughly 55 km',
  powerLongitude: 'a regional climate figure covering roughly 70 km',
};

/**
 * Aggregation methods, applied according to each source's own geometry.
 * See ADR-0005 for the rationale.
 */
export const AGGREGATION_METHODS = [
  /** Value of the grid cell containing the farm centroid. */
  'grid_cell',
  /** Sample at the farm centroid. */
  'point_sample',
  /** Statistics computed over the farm polygon from a raster. */
  'zonal',
  /** Interpolated value at the farm centroid (e.g. SoilGrids WCS). */
  'interpolated_point',
] as const;

export type AggregationMethod = (typeof AGGREGATION_METHODS)[number];

/** Land Surface Reference System identifier for stored geometry. */
export const GEOMETRY_SRID = 4326;

/** Standard farm-management categories. */
export const FARMING_METHODS = ['rainfed', 'irrigated', 'mixed', 'unknown'] as const;
export const IRRIGATION_METHODS = [
  'none',
  'rainfed',
  'hand_irrigation',
  'furrow',
  'sprinkler',
  'drip',
  'well',
  'river',
  'borehole',
  'canal',
  'other',
  'unknown',
] as const;
export const CROP_STATUSES = ['current', 'previous', 'planned'] as const;
export const INTENDED_USES = ['commercial', 'household', 'both', 'unknown'] as const;
export const SEASONS = ['rainy', 'dry', 'harmattan', 'year_round', 'unknown'] as const;

export type FarmingMethod = (typeof FARMING_METHODS)[number];
export type IrrigationMethod = (typeof IRRIGATION_METHODS)[number];

/** How a parcel's geometry was captured. */
export const GEOMETRY_METHODS = ['gps_point', 'drawn_polygon'] as const;

export type GeometryMethod = (typeof GEOMETRY_METHODS)[number];
export type CropStatus = (typeof CROP_STATUSES)[number];
export type IntendedUse = (typeof INTENDED_USES)[number];
export type Season = (typeof SEASONS)[number];

/**
 * Reference system for the application.
 *
 * Every value in the platform is presented with its provenance: which source
 * it came from, how precise it is, when it was observed, and whether it is a
 * direct observation or a model output.
 */
export const PROVENANCE_NOTES: Record<string, string> = {
  observed: 'Directly observed by the source instrument.',
  modelled: 'Produced by a model rather than measured directly.',
  interpolated: 'Interpolated from measurements at nearby points.',
};

/* -------------------------------------------------------------------------- */
/* The comparison engine vocabulary (ADR-0011, decision D-05)                 */
/* -------------------------------------------------------------------------- */

/**
 * The status of one measured value against one cited threshold.
 *
 * This replaces the old per-dimension score. A dimension is either inside the
 * range the agronomic literature gives for the crop, outside it, uncertain
 * because the evidence is coarse, or not assessed because the input was
 * missing.
 */
export const ASSESSMENT_STATUSES = ['pass', 'fail', 'uncertain', 'not_assessed'] as const;

export type AssessmentStatus = (typeof ASSESSMENT_STATUSES)[number];

/**
 * How strong the evidence behind a conclusion is.
 *
 * A qualitative replacement for the old confidence percentage. It always
 * carries a reason, because "weak" on its own is not an explanation.
 */
export const EVIDENCE_STRENGTHS = ['strong', 'moderate', 'weak'] as const;

export type EvidenceStrength = (typeof EVIDENCE_STRENGTHS)[number];

/**
 * The dimensions the engine assesses for each crop.
 *
 * There are no weights. Each dimension is reported on its own terms, and the
 * ordering of strategies states which dimensions drove it.
 */
export const ASSESSMENT_DIMENSIONS = [
  'climate_rainfall',
  'climate_temperature',
  'water_availability',
  'soil_match',
  'season_length',
  'vegetation_condition',
  'rotation_fit',
  'management_requirement',
] as const;

export type AssessmentDimension = (typeof ASSESSMENT_DIMENSIONS)[number];

/**
 * Human-readable labels for each dimension, for the interface.
 */
export const ASSESSMENT_DIMENSION_LABELS: Record<AssessmentDimension, string> = {
  climate_rainfall: 'Rainfall',
  climate_temperature: 'Temperature',
  water_availability: 'Water available',
  soil_match: 'Soil conditions',
  season_length: 'Time in the season',
  vegetation_condition: 'Condition of the plants',
  rotation_fit: 'Fit with the rotation',
  management_requirement: 'Inputs and work needed',
};

/**
 * Where a rule came from.
 *
 * Decision D-11: a farmer's own stated rule is a first-class engine input,
 * and it is labelled so that the interface can say where it came from. A
 * farmer report is not presented as agronomic evidence.
 */
export const RULE_SOURCE_TYPES = ['literature', 'farmer_report'] as const;

export type RuleSourceType = (typeof RULE_SOURCE_TYPES)[number];

/**
 * The three planting trigger strategies, taken from the three farmers in
 * Doka village (decision D-10).
 *
 * The engine never recommends a date. It recommends a condition, and the
 * farmer's own rule selects which strategy is put first.
 */
export const PLANTING_TRIGGERS = [
  'wait_for_confirmed_moisture',
  'plant_on_first_rains',
  'prepare_and_plant_quickly',
] as const;

export type PlantingTrigger = (typeof PLANTING_TRIGGERS)[number];

/**
 * The plain-language description and risk profile of each trigger.
 *
 * The risk profile is stated, not hidden. Each farmer in the dataset chose a
 * different one, and each is coherent.
 */
export const PLANTING_TRIGGER_PROFILES: Record<
  PlantingTrigger,
  { readonly condition: string; readonly riskProfile: string }
> = {
  wait_for_confirmed_moisture: {
    condition:
      'The soil holds enough moisture across several days before you sow, so the seed germinates rather than drying out.',
    riskProfile:
      'Lowest risk of the seed failing, but it uses up part of the season. If the rains stop early there is less time left to mature.',
  },
  plant_on_first_rains: {
    condition: 'You sow as soon as the first sustained rains fall, without waiting for more.',
    riskProfile:
      'Gives the crop the longest possible season, but if a dry spell follows early rains the seed can fail before it establishes.',
  },
  prepare_and_plant_quickly: {
    condition:
      'You wait until the soil has good moisture from the early rains, then prepare the land and sow straight away.',
    riskProfile:
      'A balance between the two: the seed has some moisture to start with, and the season is not wasted waiting.',
  },
};

/**
 * The crop categories the rotation engine reasons about.
 */
export const CROP_CATEGORIES = [
  'cereal',
  'legume',
  'vegetable',
  'root',
  'tuber',
  'cash_crop',
] as const;

export type CropCategory = (typeof CROP_CATEGORIES)[number];

/**
 * How a crop affects the soil nitrogen in the rotation.
 */
export const NITROGEN_EFFECTS = ['fixes', 'consumes', 'neutral'] as const;

export type NitrogenEffect = (typeof NITROGEN_EFFECTS)[number];

/**
 * The farmer's stated objectives for a farm.
 *
 * These are inputs to the comparison, not display preferences. Each one
 * changes which dimensions are surfaced first and how the alternatives are
 * ordered.
 */
export const FARMER_GOALS = [
  'improve_soil_fertility',
  'conserve_water',
  'increase_income',
  'food_security',
  'maturity_reliability',
  'less_work',
  'reduce_risk',
  'drought_tolerance',
] as const;

export type FarmerGoal = (typeof FARMER_GOALS)[number];

/**
 * The plain-language label for each goal, shown where the farmer set it.
 */
export const FARMER_GOAL_LABELS: Record<FarmerGoal, string> = {
  improve_soil_fertility: 'Improve soil fertility',
  conserve_water: 'Conserve water',
  increase_income: 'Increase income',
  food_security: 'Food security',
  maturity_reliability: 'Reliable harvest before the season ends',
  less_work: 'Less work',
  reduce_risk: 'Reduce risk',
  drought_tolerance: 'Dry-spell tolerance',
};

/**
 * The kind of evidence that supports a claim in the interface.
 *
 * The distinction is the same one the interview documentation makes, and the
 * platform must not blur it.
 */
export const EVIDENCE_KINDS = [
  'environmental_observation',
  'documented_agronomic_evidence',
  'farmer_report',
] as const;

export type EvidenceKind = (typeof EVIDENCE_KINDS)[number];

/**
 * The plain-language description of each evidence kind.
 */
export const EVIDENCE_KIND_LABELS: Record<EvidenceKind, string> = {
  environmental_observation: 'Satellite or station observation',
  documented_agronomic_evidence: 'Published agronomic reference',
  farmer_report: 'Reported by the farmer',
};

/**
 * The kinds of gap that make an assessment weaker.
 *
 * Each one names a specific missing or coarse input, so a limitation is
 * always actionable rather than a generic apology.
 */
export const LIMITATION_KINDS = [
  'coarse_resolution',
  'missing_data',
  'stale_data',
  'modelled_value',
  'partial_coverage',
  'unknown_farmer_input',
  'unverified_requirement',
  'needs_local_review',
] as const;

export type LimitationKind = (typeof LIMITATION_KINDS)[number];

/**
 * The kind of comparison being run.
 */
export const COMPARISON_KINDS = ['rotation', 'suitability'] as const;

export type ComparisonKind = (typeof COMPARISON_KINDS)[number];

/**
 * The status of a strategy within an ordinal ranking.
 *
 * `tied` exists because the evidence sometimes cannot separate two
 * strategies, and saying so is the honest answer.
 */
export const RANK_POSITIONS = ['first', 'tied', 'lower'] as const;

export type RankPosition = (typeof RANK_POSITIONS)[number];
