import {
  ENVIRONMENT_VARIABLES,
  SPATIAL_RESOLUTION_METRES,
  UNITS,
  type FarmerGoal,
  type PlantingTrigger,
} from '@dalashift/shared/constants';
import type {
  ComparisonResult,
  Farm,
  FarmCrop,
  FarmerPriorities,
  Parcel,
  PlantingTriggerAssessment,
  ProvenancedValue,
  RotationRule,
  SeasonalOutlook,
} from '@dalashift/shared/types';

import type { TimeSeriesPoint } from '../../components/charts/honesty-time-series-chart';
import { assessSeasonalOutlook } from '../outlook/assess-seasonal-outlook';
import { assessPlantingTrigger } from '../recommendations/engine/assess-planting-trigger';
import {
  DEFAULT_RULESET_VERSION,
  type CatalogCropRecord,
} from '../recommendations/engine/build-crop-inputs';
import {
  buildAndCompareRotationStrategies,
  type FarmerCropHistoryEntry,
} from '../recommendations/engine/build-rotation-strategies';
import { compareProspectiveSuitability } from '../recommendations/engine/compare-suitability';

export interface CaseStudyFullProfile {
  readonly slug: string;
  readonly farmerName: string;
  readonly village: string;
  readonly lga: string;
  readonly state: string;
  readonly holdingSummary: string;
  readonly farmingExperience: string;
  readonly verbatimQuote: string;
  readonly quoteSourceRef: string;
  readonly consentedToPublication: boolean;
  readonly consentedToGps: boolean;
  readonly farm: Farm;
  readonly parcels: readonly Parcel[];
  readonly cropCodes: readonly string[];
  readonly crops: readonly FarmCrop[];
  readonly priorities: FarmerPriorities;
  readonly plantingTrigger: PlantingTriggerAssessment;
  readonly seasonalOutlook: SeasonalOutlook;
  readonly rotationComparison: ComparisonResult;
  readonly suitabilityComparison: ComparisonResult;
  readonly observations: readonly ProvenancedValue[];
  readonly rainfallChartSeries: readonly TimeSeriesPoint[];
  readonly soilMoistureChartSeries: readonly TimeSeriesPoint[];
  readonly ndviChartSeries: readonly TimeSeriesPoint[];
}

export const CATALOG_CROPS: readonly CatalogCropRecord[] = [
  {
    id: 'crop-sorghum',
    code: 'sorghum',
    name: 'Sorghum',
    scientificName: 'Sorghum bicolor (L.) Moench',
    category: 'cereal',
    growingPeriodDays: { min: 90, max: 120 },
    agronomicRequirements: {
      indicativeCropWaterNeedMmPerSeason: {
        min: 450,
        max: 650,
        evidenceId: 'FAO-WATER-03',
        citation:
          'Brouwer & Heibloem (1986), FAO Irrigation Water Management Training Manual No. 3, Ch. 3',
        useAsHardConstraint: false,
      },
      temperatureC: {
        min: 20,
        max: 37,
        citation: 'FAO Crop Water Information: Sorghum',
      },
      soilPh: {
        min: 5.5,
        max: 7.8,
        citation: 'FAO Ecocrop / IITA Sudan Savanna reference',
      },
    },
    rotationTraits: { nitrogenContribution: 'consumes' },
    sourceCitations: [
      {
        claim:
          'Indicative seasonal crop water need for sorghum is 450 to 650 mm per total growing period (FAO rough estimate).',
        citation: 'Brouwer & Heibloem (1986), FAO Training Manual No. 3 (FAO-WATER-03)',
        sourceUrl: 'https://www.fao.org/4/s2022e/s2022e07.htm',
      },
    ],
  },
  {
    id: 'crop-pearl-millet',
    code: 'pearl_millet',
    name: 'Pearl millet',
    scientificName: 'Cenchrus americanus (syn. Pennisetum glaucum)',
    category: 'cereal',
    growingPeriodDays: { min: 65, max: 100 },
    agronomicRequirements: {
      indicativeCropWaterNeedMmPerSeason: {
        min: 450,
        max: 650,
        evidenceId: 'FAO-WATER-03',
        citation:
          'Brouwer & Heibloem (1986), FAO Irrigation Water Management Training Manual No. 3, Ch. 3',
        useAsHardConstraint: false,
      },
      temperatureC: {
        min: 22,
        max: 38,
        citation: 'ICRISAT West African Sahelian Millet Reference',
      },
      soilPh: {
        min: 5.0,
        max: 7.5,
        citation: 'ICRISAT / FAO Reference',
      },
    },
    rotationTraits: { nitrogenContribution: 'consumes' },
    sourceCitations: [
      {
        claim:
          'Indicative seasonal crop water need for millet is 450 to 650 mm per total growing period (FAO rough estimate).',
        citation: 'Brouwer & Heibloem (1986), FAO Training Manual No. 3 (FAO-WATER-03)',
        sourceUrl: 'https://www.fao.org/4/s2022e/s2022e07.htm',
      },
    ],
  },
  {
    id: 'crop-cowpea',
    code: 'cowpea',
    name: 'Cowpea (White cowpea)',
    scientificName: 'Vigna unguiculata (L.) Walp.',
    category: 'legume',
    growingPeriodDays: { min: 60, max: 90 },
    agronomicRequirements: {
      indicativeCropWaterNeedMmPerSeason: {
        min: 350,
        max: 550,
        evidenceId: 'NIGERIA-ROT-01',
        citation: 'Yusuf et al. (2009), Nutrient Cycling in Agroecosystems',
        useAsHardConstraint: false,
      },
      temperatureC: {
        min: 20,
        max: 36,
        citation: 'IITA Cowpea Production Guide for Northern Nigeria',
      },
      soilPh: {
        min: 5.5,
        max: 7.5,
        citation: 'IITA Cowpea Guide',
      },
    },
    rotationTraits: { nitrogenContribution: 'fixes' },
    sourceCitations: [
      {
        claim:
          'Cowpea (Vigna unguiculata) fixes biological nitrogen and improved subsequent cereal yields in Northern Nigeria rotation trials.',
        citation: 'Yusuf et al. (2009), Nutrient Cycling in Agroecosystems (NIGERIA-ROT-01)',
        sourceUrl: 'https://doi.org/10.1007/s10705-008-9232-9',
      },
    ],
  },
  {
    id: 'crop-soybean',
    code: 'soybean',
    name: 'Soybean',
    scientificName: 'Glycine max (L.) Merr.',
    category: 'legume',
    growingPeriodDays: { min: 90, max: 120 },
    agronomicRequirements: {
      indicativeCropWaterNeedMmPerSeason: {
        min: 450,
        max: 700,
        evidenceId: 'FAO-WATER-04',
        citation: 'Brouwer & Heibloem (1986), FAO Training Manual No. 3 (FAO-WATER-04)',
        useAsHardConstraint: false,
      },
      temperatureC: {
        min: 20,
        max: 34,
        citation: 'IITA Soybean Guide for Savanna',
      },
      soilPh: {
        min: 5.8,
        max: 7.2,
        citation: 'IITA Soybean Guide',
      },
    },
    rotationTraits: { nitrogenContribution: 'fixes' },
    sourceCitations: [
      {
        claim:
          'Indicative seasonal crop water need for soybean is 450 to 700 mm per total growing period.',
        citation: 'Brouwer & Heibloem (1986), FAO Training Manual No. 3 (FAO-WATER-04)',
        sourceUrl: 'https://www.fao.org/4/s2022e/s2022e07.htm',
      },
    ],
  },
  {
    id: 'crop-groundnut',
    code: 'groundnut',
    name: 'Groundnut',
    scientificName: 'Arachis hypogaea L.',
    category: 'legume',
    growingPeriodDays: { min: 90, max: 115 },
    agronomicRequirements: {
      indicativeCropWaterNeedMmPerSeason: {
        min: 500,
        max: 700,
        evidenceId: 'FAO-WATER-02',
        citation: 'Brouwer & Heibloem (1986), FAO Training Manual No. 3 (FAO-WATER-02)',
        useAsHardConstraint: false,
      },
      temperatureC: {
        min: 22,
        max: 35,
        citation: 'ICRISAT Groundnut Reference',
      },
      soilPh: {
        min: 5.5,
        max: 7.0,
        citation: 'ICRISAT Groundnut Reference',
      },
    },
    rotationTraits: { nitrogenContribution: 'fixes' },
    sourceCitations: [
      {
        claim:
          'Indicative seasonal crop water need for groundnut is 500 to 700 mm per total growing period.',
        citation: 'Brouwer & Heibloem (1986), FAO Training Manual No. 3 (FAO-WATER-02)',
        sourceUrl: 'https://www.fao.org/4/s2022e/s2022e07.htm',
      },
    ],
  },
  {
    id: 'crop-maize',
    code: 'maize',
    name: 'Maize',
    scientificName: 'Zea mays L.',
    category: 'cereal',
    growingPeriodDays: { min: 90, max: 120 },
    agronomicRequirements: {
      indicativeCropWaterNeedMmPerSeason: {
        min: 500,
        max: 800,
        evidenceId: 'FAO-WATER-01',
        citation: 'Brouwer & Heibloem (1986), FAO Training Manual No. 3 (FAO-WATER-01)',
        useAsHardConstraint: false,
      },
      temperatureC: {
        min: 18,
        max: 34,
        citation: 'FAO Maize Reference',
      },
      soilPh: {
        min: 5.8,
        max: 7.5,
        citation: 'IITA Maize Production Guide',
      },
    },
    rotationTraits: { nitrogenContribution: 'consumes' },
    sourceCitations: [
      {
        claim:
          'Indicative seasonal crop water need for maize is 500 to 800 mm per total growing period; higher fertiliser demand reported by Doka farmers compared to soybean.',
        citation: 'Brouwer & Heibloem (1986), FAO Training Manual No. 3 (FAO-WATER-01)',
        sourceUrl: 'https://www.fao.org/4/s2022e/s2022e07.htm',
      },
    ],
  },
  {
    id: 'crop-tomato',
    code: 'tomato',
    name: 'Tomato',
    scientificName: 'Solanum lycopersicum L.',
    category: 'vegetable',
    growingPeriodDays: { min: 75, max: 110 },
    agronomicRequirements: {
      indicativeCropWaterNeedMmPerSeason: {
        min: 400,
        max: 800,
        evidenceId: 'FAO-WATER-06',
        citation: 'Brouwer & Heibloem (1986), FAO Training Manual No. 3 (FAO-WATER-06)',
        useAsHardConstraint: false,
      },
    },
    rotationTraits: { nitrogenContribution: 'consumes' },
    sourceCitations: [
      {
        claim:
          'Indicative seasonal crop water need for tomato is 400 to 800 mm per total growing period.',
        citation: 'Brouwer & Heibloem (1986), FAO Training Manual No. 3 (FAO-WATER-06)',
      },
    ],
  },
  {
    id: 'crop-pepper',
    code: 'pepper',
    name: 'Pepper',
    scientificName: 'Capsicum spp.',
    category: 'vegetable',
    growingPeriodDays: { min: 85, max: 120 },
    agronomicRequirements: {
      indicativeCropWaterNeedMmPerSeason: {
        min: 600,
        max: 900,
        evidenceId: 'FAO-WATER-05',
        citation: 'Brouwer & Heibloem (1986), FAO Training Manual No. 3 (FAO-WATER-05)',
        useAsHardConstraint: false,
      },
    },
    rotationTraits: { nitrogenContribution: 'consumes' },
    sourceCitations: [
      {
        claim:
          'Indicative seasonal crop water need for pepper is 600 to 900 mm per total growing period.',
        citation: 'Brouwer & Heibloem (1986), FAO Training Manual No. 3 (FAO-WATER-05)',
      },
    ],
  },
];

export const SEEDED_ROTATION_RULES: readonly RotationRule[] = [
  {
    id: 'literature-samaru-yusuf-2009-legume-maize',
    statement:
      'Sequential rotation of maize after grain legumes (cowpea or soybean) increased mean maize yield relative to continuous maize (1.3x) and fallow (1.2x) in Samaru field trials (2003 to 2005).',
    sourceType: 'literature',
    attributedTo: 'Yusuf et al. (2009)',
    sourceUrl: 'https://doi.org/10.1007/s10705-008-9232-9',
    accessedOn: '2026-11-14',
    appliesTo: ['cowpea', 'soybean'],
    follows: ['maize', 'sorghum'],
    mechanism:
      'Biological nitrogen fixation and non-N rotation effects in Northern Guinea Savanna trials; transfer to Tofa Sudan Savanna requires local CDA review.',
  },
  {
    id: 'literature-icrisat-bado-2022-millet-cowpea',
    statement:
      'Sequential pearl millet and cowpea rotation evaluated over 25 years in West African Sahelian trials improved productivity when combined with crop residue and nutrient management.',
    sourceType: 'literature',
    attributedTo: 'Bado et al. (2022)',
    sourceUrl: 'https://oar.icrisat.org/11988/',
    accessedOn: '2026-11-14',
    appliesTo: ['pearl_millet', 'cowpea'],
    follows: ['cowpea', 'pearl_millet'],
    mechanism:
      'Long-term sequential cereal-legume rotation interacted with residue and mineral fertilizer management at ICRISAT Sadore; requires local Tofa validation.',
  },
  {
    id: 'farmer-report-amina-doka-rotation',
    statement:
      'If you plant on a farm this year, next season you rotate to sorghum, pearl millet, or late millet, and then bring the previous crop back later.',
    sourceType: 'farmer_report',
    attributedTo: 'Amina Habibu (Doka village, Tofa LGA)',
    sourceUrl: 'docs/research/field-interviews/interview-02/transcript.md',
    accessedOn: '2026-11-14',
    appliesTo: ['soybean', 'groundnut', 'cowpea'],
    follows: ['sorghum', 'pearl_millet'],
    mechanism:
      'Farmer-reported seasonal rotation practice learned through Bayero University extension training and applied across ridge-based plots in Doka.',
  },
  {
    id: 'farmer-report-abubakar-doka-rotation',
    statement:
      'Wherever we plant sorghum and soybeans, next time that same spot gets white cowpeas or soybeans, or if it had white cowpeas or soybeans, it gets sorghum or maize, following a two-to-three-year crop rotation cycle.',
    sourceType: 'farmer_report',
    attributedTo: 'Abubakar / Dan Hajiya (Doka village, Tofa LGA)',
    sourceUrl: 'docs/research/field-interviews/interview-03/transcript.md',
    accessedOn: '2026-11-14',
    appliesTo: ['sorghum', 'soybean', 'cowpea'],
    follows: ['cowpea', 'soybean', 'sorghum', 'maize'],
    mechanism:
      'Farmer-reported two-to-three-year plot-level rotation cycle across 3 ha parcels in Doka, reducing chemical fertiliser applications in legume years.',
  },
];

/**
 * Representative observations for the Tofa LGA validation cell (derived from
 * precomputed NASA POWER, SMAP, and SoilGrids records).
 */
export const TOFA_VALIDATION_OBSERVATIONS: readonly ProvenancedValue[] = [
  {
    variable: ENVIRONMENT_VARIABLES.precipitation,
    value: 584,
    unit: UNITS.millimetre,
    sourceId: 'nasa_power',
    spatialResolutionM: SPATIAL_RESOLUTION_METRES.powerLatitude,
    temporalResolution: 'seasonal',
    observedAt: '2026-10-31T00:00:00.000Z',
    retrievedAt: '2026-11-14T21:15:45.051Z',
    isModelled: true,
    aggregationMethod: 'grid_cell',
    qualityFlag: 'good',
  },
  {
    variable: ENVIRONMENT_VARIABLES.precipitation,
    value: 14.2,
    unit: UNITS.millimetre,
    sourceId: 'chirps_v3',
    spatialResolutionM: SPATIAL_RESOLUTION_METRES.chirps,
    temporalResolution: 'daily',
    observedAt: '2026-06-12T00:00:00.000Z',
    retrievedAt: '2026-11-14T21:15:45.051Z',
    isModelled: true,
    aggregationMethod: 'grid_cell',
    qualityFlag: 'good',
  },
  {
    variable: ENVIRONMENT_VARIABLES.precipitation,
    value: 9.6,
    unit: UNITS.millimetre,
    sourceId: 'chirps_v3',
    spatialResolutionM: SPATIAL_RESOLUTION_METRES.chirps,
    temporalResolution: 'daily',
    observedAt: '2026-06-15T00:00:00.000Z',
    retrievedAt: '2026-11-14T21:15:45.051Z',
    isModelled: true,
    aggregationMethod: 'grid_cell',
    qualityFlag: 'good',
  },
  {
    variable: ENVIRONMENT_VARIABLES.temperatureMean,
    value: 27.6,
    unit: UNITS.degreeCelsius,
    sourceId: 'nasa_power',
    spatialResolutionM: SPATIAL_RESOLUTION_METRES.powerLatitude,
    temporalResolution: 'seasonal',
    observedAt: '2026-10-31T00:00:00.000Z',
    retrievedAt: '2026-11-14T21:15:45.051Z',
    isModelled: true,
    aggregationMethod: 'grid_cell',
    qualityFlag: 'good',
  },
  {
    variable: ENVIRONMENT_VARIABLES.soilWetnessRootZone,
    value: 0.39,
    unit: UNITS.dimensionless,
    sourceId: 'smap_l3_enhanced',
    spatialResolutionM: SPATIAL_RESOLUTION_METRES.smapSoilMoisture,
    temporalResolution: 'daily',
    observedAt: '2026-11-13T00:00:00.000Z',
    retrievedAt: '2026-11-14T21:15:45.051Z',
    isModelled: false,
    aggregationMethod: 'grid_cell',
    qualityFlag: 'good',
  },
  {
    variable: ENVIRONMENT_VARIABLES.soilPh,
    value: 6.2,
    unit: UNITS.dimensionless,
    sourceId: 'soilgrids',
    spatialResolutionM: SPATIAL_RESOLUTION_METRES.soilGrids,
    temporalResolution: 'climatology',
    observedAt: '2026-01-01T00:00:00.000Z',
    retrievedAt: '2026-11-14T21:15:45.051Z',
    isModelled: true,
    aggregationMethod: 'interpolated_point',
    qualityFlag: 'good',
  },
  {
    variable: ENVIRONMENT_VARIABLES.ndvi,
    value: 0.54,
    unit: UNITS.dimensionless,
    sourceId: 'modis_mod13q1_v061',
    spatialResolutionM: SPATIAL_RESOLUTION_METRES.modisVegetationIndex,
    temporalResolution: '16-day',
    observedAt: '2026-10-31T00:00:00.000Z',
    retrievedAt: '2026-11-14T21:15:45.051Z',
    isModelled: false,
    aggregationMethod: 'zonal',
    qualityFlag: 'good',
    coverageFraction: 0.85,
  },
];

export const TOFA_CLIMATOLOGY_OBSERVATIONS: readonly ProvenancedValue[] = [
  {
    variable: ENVIRONMENT_VARIABLES.precipitation,
    value: 620,
    unit: UNITS.millimetre,
    sourceId: 'nasa_power',
    spatialResolutionM: SPATIAL_RESOLUTION_METRES.powerLatitude,
    temporalResolution: 'climatology',
    observedAt: '2025-12-31T00:00:00.000Z',
    retrievedAt: '2026-11-14T21:15:45.051Z',
    isModelled: true,
    rawMetadata: { daysInMonth: 1 },
  },
];

export const TOFA_RAINFALL_CHART_SERIES: readonly TimeSeriesPoint[] = [
  { label: 'May', value: 42, baseline: 54 },
  { label: 'Jun', value: 88, baseline: 102 },
  { label: 'Jul', value: 168, baseline: 182 },
  { label: 'Aug', value: 212, baseline: 224 },
  { label: 'Sep', value: 84, baseline: 92 },
  { label: 'Oct', value: 14, baseline: 18 },
];

export const TOFA_SOIL_MOISTURE_CHART_SERIES: readonly TimeSeriesPoint[] = [
  { label: '15 May', value: 0.16, baseline: 0.28 },
  { label: '1 Jun', value: 0.24, baseline: 0.32 },
  { label: '15 Jun', value: 0.21, baseline: 0.34 },
  { label: '1 Jul', value: 0.38, baseline: 0.36 },
  { label: '15 Jul', value: 0.44, baseline: 0.38 },
  { label: '1 Aug', value: 0.49, baseline: 0.41 },
  { label: '15 Aug', value: 0.46, baseline: 0.4 },
  { label: '1 Sep', value: 0.35, baseline: 0.34 },
];

/**
 * Includes an explicit cloud-cover gap in July to demonstrate Journey C
 * (docs/product/user-flows.md section 5: never draw a flat line or zero across a gap).
 */
export const TOFA_NDVI_CHART_SERIES: readonly TimeSeriesPoint[] = [
  { label: 'May', value: 0.19 },
  { label: 'Jun', value: 0.31 },
  { label: 'Jul (Early)', value: null, isMissingGap: true },
  { label: 'Jul (Late)', value: null, isMissingGap: true },
  { label: 'Aug', value: 0.62 },
  { label: 'Sep', value: 0.58 },
  { label: 'Oct', value: 0.39 },
];

function createCaseStudyProfile(input: {
  readonly slug: string;
  readonly farmerName: string;
  readonly holdingSummary: string;
  readonly farmingExperience: string;
  readonly verbatimQuote: string;
  readonly quoteSourceRef: string;
  readonly consentedToGps: boolean;
  readonly farm: Farm;
  readonly parcels: readonly Parcel[];
  readonly cropCodes: readonly string[];
  readonly cropHistory: readonly FarmerCropHistoryEntry[];
  readonly goals: readonly FarmerGoal[];
  readonly plantingTriggerRule: PlantingTrigger;
  readonly riskTolerance: number;
  readonly prioritiesNotes: string;
}): CaseStudyFullProfile {
  const primaryParcel = input.parcels[0]!;

  const rotationComparison = buildAndCompareRotationStrategies({
    farmId: input.farm.id,
    parcelId: primaryParcel.id,
    parcelAreaHa: primaryParcel.areaHa,
    catalogCrops: CATALOG_CROPS,
    rotationRules: SEEDED_ROTATION_RULES,
    farmerCropHistory: input.cropHistory,
    observations: TOFA_VALIDATION_OBSERVATIONS,
    goals: input.goals,
    rulesetVersion: DEFAULT_RULESET_VERSION,
  });

  const suitabilityComparison = compareProspectiveSuitability({
    farmId: input.farm.id,
    parcelId: primaryParcel.id,
    parcelAreaHa: primaryParcel.areaHa,
    catalogCrops: CATALOG_CROPS,
    observations: TOFA_VALIDATION_OBSERVATIONS,
    goals: input.goals,
    rulesetVersion: DEFAULT_RULESET_VERSION,
  });

  const plantingTrigger = assessPlantingTrigger({
    parcelId: primaryParcel.id,
    farmerRule: input.plantingTriggerRule,
    observations: TOFA_VALIDATION_OBSERVATIONS,
    riskTolerance: input.riskTolerance,
    rulesetVersion: DEFAULT_RULESET_VERSION,
  });

  const seasonalOutlook = assessSeasonalOutlook({
    parcelId: primaryParcel.id,
    dailyObservations: TOFA_VALIDATION_OBSERVATIONS,
    climatologyObservations: TOFA_CLIMATOLOGY_OBSERVATIONS,
    rulesetVersion: DEFAULT_RULESET_VERSION,
  });

  const crops: FarmCrop[] = input.cropHistory.map((item, idx) => ({
    id: `${input.farm.id}-crop-${idx + 1}`,
    farmId: input.farm.id,
    parcelId: item.parcelId,
    cropId: `crop-${item.cropCode}`,
    status: item.status,
    plantingDate: item.status === 'current' ? '2026-06-14' : null,
    expectedHarvestDate: item.status === 'current' ? '2026-10-10' : null,
    harvestDate: item.status === 'previous' ? '2025-10-18' : null,
    season: item.season,
    intendedUse: 'both',
    areaHa: item.areaHa,
    notes: null,
  }));

  const priorities: FarmerPriorities = {
    farmId: input.farm.id,
    goals: input.goals,
    riskTolerance: input.riskTolerance,
    openToChange: true,
    plantingTrigger: input.plantingTriggerRule,
    notes: input.prioritiesNotes,
  };

  return {
    slug: input.slug,
    farmerName: input.farmerName,
    village: 'Doka',
    lga: 'Tofa',
    state: 'Kano',
    holdingSummary: input.holdingSummary,
    farmingExperience: input.farmingExperience,
    verbatimQuote: input.verbatimQuote,
    quoteSourceRef: input.quoteSourceRef,
    consentedToPublication: true,
    consentedToGps: input.consentedToGps,
    farm: input.farm,
    parcels: input.parcels,
    cropCodes: input.cropCodes,
    crops,
    priorities,
    plantingTrigger,
    seasonalOutlook,
    rotationComparison,
    suitabilityComparison,
    observations: TOFA_VALIDATION_OBSERVATIONS,
    rainfallChartSeries: TOFA_RAINFALL_CHART_SERIES,
    soilMoistureChartSeries: TOFA_SOIL_MOISTURE_CHART_SERIES,
    ndviChartSeries: TOFA_NDVI_CHART_SERIES,
  };
}

export const CASE_STUDY_PROFILES: readonly CaseStudyFullProfile[] = [
  createCaseStudyProfile({
    slug: 'bello-yusuf-maitama',
    farmerName: 'Bello Yusuf Maitama',
    holdingSummary: '2 to 4 ha across non-contiguous parcels · Rain-fed only · Strip cropping',
    farmingExperience:
      'Smallholder farmer managing 2 to 4 hectares across non-contiguous parcels in Doka village. Because well water is scarce near his parcels, he farms only in the rainy season.',
    verbatimQuote:
      'When the first rains fall, I do not rush out to plant immediately. I wait until the soil retains sufficient moisture from subsequent light showers. Those who rushed to plant without caution suffered losses when the rain paused.',
    quoteSourceRef: 'docs/research/field-interviews/interview-01/transcript.md',
    consentedToGps: true,
    farm: {
      id: '11111111-1111-4111-8111-111111111101',
      farmerId: 'farmer-bello',
      name: 'Bello Maitama Holding (Doka)',
      farmingMethod: 'rainfed',
      irrigationMethod: 'rainfed',
      soilNotes:
        'Sandy-loam Sudan Savanna ridges; local wells lack sufficient water for dry-season irrigation.',
    },
    parcels: [
      {
        id: '11111111-1111-4111-8111-111111111201',
        farmId: '11111111-1111-4111-8111-111111111101',
        name: 'Parcel A: North Strip Field',
        geometry: {
          type: 'Polygon',
          coordinates: [
            [
              [8.268, 12.052],
              [8.27, 12.0522],
              [8.2698, 12.0508],
              [8.2679, 12.0507],
              [8.268, 12.052],
            ],
          ],
        },
        areaHa: 1.6,
        locationUncertaintyM: 6,
        geometryMethod: 'drawn_polygon',
      },
      {
        id: '11111111-1111-4111-8111-111111111202',
        farmId: '11111111-1111-4111-8111-111111111101',
        name: 'Parcel B: East Rain-fed Plot',
        geometry: {
          type: 'Point',
          coordinates: [8.2735, 12.049],
        },
        areaHa: 1.4,
        locationUncertaintyM: 8,
        geometryMethod: 'gps_point',
      },
    ],
    cropCodes: ['sorghum', 'soybean', 'groundnut', 'maize', 'tomato', 'pepper'],
    cropHistory: [
      {
        cropCode: 'sorghum',
        status: 'current',
        season: 'rainy',
        parcelId: '11111111-1111-4111-8111-111111111201',
        areaHa: 0.8,
      },
      {
        cropCode: 'soybean',
        status: 'current',
        season: 'rainy',
        parcelId: '11111111-1111-4111-8111-111111111201',
        areaHa: 0.8,
      },
      {
        cropCode: 'groundnut',
        status: 'previous',
        season: 'rainy',
        parcelId: '11111111-1111-4111-8111-111111111201',
        areaHa: 1.6,
      },
    ],
    goals: ['reduce_risk', 'conserve_water', 'improve_soil_fertility'],
    plantingTriggerRule: 'wait_for_confirmed_moisture',
    riskTolerance: 0.25,
    prioritiesNotes:
      'Prioritises avoiding seed failure during early dry spells and suppressing weeds via strip cropping.',
  }),
  createCaseStudyProfile({
    slug: 'amina-habibu',
    farmerName: 'Amina Habibu',
    holdingSummary:
      '~4 ha (3 main fields + 2 smaller plots) · Structured ridge ratios & kalankuwa borders',
    farmingExperience:
      'Experienced farmer managing roughly 4 hectares across five parcels in Doka village, trained through Bayero University extension outreach.',
    verbatimQuote:
      'When the rainy season starts, we plant immediately on the first rains without waiting, because the rainy season can be short. Next season we rotate that field to sorghum, pearl millet, or late millet, and bring the previous crop back later.',
    quoteSourceRef: 'docs/research/field-interviews/interview-02/transcript.md',
    consentedToGps: true,
    farm: {
      id: '22222222-2222-4222-8222-222222222101',
      farmerId: 'farmer-amina',
      name: 'Amina Habibu Holding (Doka)',
      farmingMethod: 'mixed',
      irrigationMethod: 'rainfed',
      soilNotes:
        'Structured ridge strips (3:3 sorghum-soybean, 4:3 sorghum-groundnut) with pearl millet (kalankuwa) boundary lines.',
    },
    parcels: [
      {
        id: '22222222-2222-4222-8222-222222222201',
        farmId: '22222222-2222-4222-8222-222222222101',
        name: 'Field 1: 3:3 Sorghum & Soybean Ridges',
        geometry: {
          type: 'Polygon',
          coordinates: [
            [
              [8.271, 12.054],
              [8.2728, 12.0541],
              [8.2726, 12.0528],
              [8.2709, 12.0527],
              [8.271, 12.054],
            ],
          ],
        },
        areaHa: 1.5,
        locationUncertaintyM: 5,
        geometryMethod: 'drawn_polygon',
      },
      {
        id: '22222222-2222-4222-8222-222222222202',
        farmId: '22222222-2222-4222-8222-222222222101',
        name: 'Field 2: 4:3 Sorghum & Groundnut Ridges',
        geometry: {
          type: 'Polygon',
          coordinates: [
            [
              [8.265, 12.048],
              [8.2668, 12.0482],
              [8.2665, 12.047],
              [8.2648, 12.0469],
              [8.265, 12.048],
            ],
          ],
        },
        areaHa: 1.3,
        locationUncertaintyM: 5,
        geometryMethod: 'drawn_polygon',
      },
    ],
    cropCodes: [
      'sorghum',
      'pearl_millet',
      'soybean',
      'groundnut',
      'cowpea',
      'maize',
      'tomato',
      'pepper',
    ],
    cropHistory: [
      {
        cropCode: 'soybean',
        status: 'previous',
        season: 'rainy',
        parcelId: '22222222-2222-4222-8222-222222222201',
        areaHa: 1.5,
      },
      {
        cropCode: 'sorghum',
        status: 'current',
        season: 'rainy',
        parcelId: '22222222-2222-4222-8222-222222222201',
        areaHa: 1.5,
      },
      {
        cropCode: 'pearl_millet',
        status: 'planned',
        season: 'rainy',
        parcelId: '22222222-2222-4222-8222-222222222201',
        areaHa: 1.5,
      },
    ],
    goals: ['maturity_reliability', 'increase_income', 'improve_soil_fertility'],
    plantingTriggerRule: 'plant_on_first_rains',
    riskTolerance: 0.78,
    prioritiesNotes:
      'Maximises growing season length by sowing on first rains; requests 30-day seasonal rainfall risk outlook to choose between sorghum and shorter-duration cowpea.',
  }),
  createCaseStudyProfile({
    slug: 'abubakar-dan-hajiya',
    farmerName: 'Abubakar (Dan Hajiya)',
    holdingSummary:
      '~30 ha owned holding divided into 3 ha plots · 2-to-3-year cereal-legume cycle',
    farmingExperience:
      '30 years of farming experience in Doka village, managing roughly 30 hectares divided into 3-hectare management plots across rainy and dry seasons.',
    verbatimQuote:
      'Wherever we plant sorghum and soybeans, next time that same spot gets white cowpeas or soybeans, or if it had white cowpeas or soybeans, it gets sorghum or maize, following a two-to-three-year crop rotation cycle. Soybeans also need much less chemical fertilizer than maize.',
    quoteSourceRef: 'docs/research/field-interviews/interview-03/transcript.md',
    consentedToGps: false,
    farm: {
      id: '33333333-3333-4333-8333-333333333101',
      farmerId: 'farmer-abubakar',
      name: 'Abubakar (Dan Hajiya) Plots (Doka)',
      farmingMethod: 'mixed',
      irrigationMethod: 'rainfed',
      soilNotes:
        'Managed in 3 ha rotation blocks; coordinates kept synthetic because GPS capture was not raised in Interview 03.',
    },
    parcels: [
      {
        id: '33333333-3333-4333-8333-333333333201',
        farmId: '33333333-3333-4333-8333-333333333101',
        name: 'Plot 1: 3 ha Rotation Block (Representative)',
        geometry: {
          type: 'Polygon',
          coordinates: [
            [
              [8.274, 12.053],
              [8.2765, 12.0532],
              [8.2763, 12.0512],
              [8.2738, 12.051],
              [8.274, 12.053],
            ],
          ],
        },
        areaHa: 3.0,
        locationUncertaintyM: null,
        geometryMethod: 'drawn_polygon',
      },
      {
        id: '33333333-3333-4333-8333-333333333202',
        farmId: '33333333-3333-4333-8333-333333333101',
        name: 'Plot 2: 3 ha Legume Block (Representative)',
        geometry: {
          type: 'Polygon',
          coordinates: [
            [
              [8.277, 12.053],
              [8.2795, 12.0532],
              [8.2793, 12.0512],
              [8.2768, 12.051],
              [8.277, 12.053],
            ],
          ],
        },
        areaHa: 3.0,
        locationUncertaintyM: null,
        geometryMethod: 'drawn_polygon',
      },
    ],
    cropCodes: ['sorghum', 'soybean', 'cowpea', 'maize', 'groundnut'],
    cropHistory: [
      {
        cropCode: 'sorghum',
        status: 'previous',
        season: 'rainy',
        parcelId: '33333333-3333-4333-8333-333333333201',
        areaHa: 3.0,
      },
      {
        cropCode: 'cowpea',
        status: 'current',
        season: 'rainy',
        parcelId: '33333333-3333-4333-8333-333333333201',
        areaHa: 3.0,
      },
      {
        cropCode: 'maize',
        status: 'planned',
        season: 'rainy',
        parcelId: '33333333-3333-4333-8333-333333333201',
        areaHa: 3.0,
      },
    ],
    goals: ['improve_soil_fertility', 'increase_income', 'less_work'],
    plantingTriggerRule: 'prepare_and_plant_quickly',
    riskTolerance: 0.5,
    prioritiesNotes:
      'Alternates sorghum/maize with soybean and white cowpeas on a 2-to-3-year cycle to maintain fertility and lower chemical fertiliser outlay.',
  }),
];

export function getCaseStudyBySlug(slug: string): CaseStudyFullProfile | undefined {
  return CASE_STUDY_PROFILES.find((item) => item.slug === slug);
}

export function getCaseStudyByFarmId(farmIdOrSlug: string): CaseStudyFullProfile | undefined {
  return CASE_STUDY_PROFILES.find(
    (item) => item.farm.id === farmIdOrSlug || item.slug === farmIdOrSlug,
  );
}
