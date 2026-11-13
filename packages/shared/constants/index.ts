/**
 * Canonical constants shared across the DalaShift monorepo.
 *
 * Phase 1: these are the vocabulary the whole system agrees on: units,
 * variable identifiers, spatial resolutions and quality flags. Anything that
 * appears in more than one package belongs here.
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
  gpmImerg: 11132,
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
  'unknown',
] as const;
export const CROP_STATUSES = ['current', 'previous', 'planned'] as const;
export const INTENDED_USES = ['commercial', 'household', 'both', 'unknown'] as const;
export const SEASONS = ['rainy', 'dry', 'harmattan', 'year_round', 'unknown'] as const;

export type FarmingMethod = (typeof FARMING_METHODS)[number];
export type IrrigationMethod = (typeof IRRIGATION_METHODS)[number];
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
