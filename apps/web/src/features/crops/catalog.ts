import type { CatalogCropRecord } from '../recommendations/engine/build-crop-inputs';

/**
 * Reference crop catalog used by the registration wizard and the methodology
 * page. Every threshold carries a public citation. This catalog contains only
 * published agronomic references. It contains no farmer names, villages,
 * holdings or per-farm figures.
 */
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
          'Indicative seasonal crop water need for maize is 500 to 800 mm per total growing period.',
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

/** Look up a catalog crop by its stable code. */
export function getCatalogCropByCode(code: string): CatalogCropRecord | undefined {
  return CATALOG_CROPS.find((crop) => crop.code === code);
}
