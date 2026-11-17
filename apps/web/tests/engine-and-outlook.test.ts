import { describe, expect, it } from 'vitest';

import type { ProvenancedValue, RotationRule } from '@dalashift/shared/types';

import { assessSeasonalOutlook } from '../src/features/outlook/assess-seasonal-outlook';
import { assessPlantingTrigger } from '../src/features/recommendations/engine/assess-planting-trigger';
import {
  evaluateCatalogCropForParcel,
  type CatalogCropRecord,
} from '../src/features/recommendations/engine/build-crop-inputs';
import { buildAndCompareRotationStrategies } from '../src/features/recommendations/engine/build-rotation-strategies';
import { compareProspectiveSuitability } from '../src/features/recommendations/engine/compare-suitability';
import { buildFarmReportPayload } from '../src/features/reports/build-farm-report';

const sampleCatalogCrops: readonly CatalogCropRecord[] = [
  {
    id: '00000000-0000-0000-0000-000000000001',
    code: 'sorghum',
    name: 'Sorghum',
    scientificName: 'Sorghum bicolor (L.) Moench',
    category: 'cereal',
    growingPeriodDays: { min: null, max: null },
    agronomicRequirements: {
      rainfallRequirementMm: null,
      indicativeCropWaterNeedMmPerSeason: {
        min: 450,
        max: 650,
        evidenceId: 'FAO-WATER-03',
        useAsHardConstraint: false,
      },
      temperatureC: null,
      soilPh: null,
    },
    rotationTraits: { nitrogenContribution: 'consumes' },
    sourceCitations: [
      {
        claim: 'Indicative seasonal crop water need for sorghum/millet is 450 to 650 mm.',
        citation: 'Brouwer & Heibloem (1986), FAO Training Manual No. 3 (FAO-WATER-03)',
      },
    ],
  },
  {
    id: '00000000-0000-0000-0000-000000000002',
    code: 'soybean',
    name: 'Soybean',
    scientificName: 'Glycine max (L.) Merr.',
    category: 'legume',
    growingPeriodDays: { min: null, max: null },
    agronomicRequirements: {
      rainfallRequirementMm: null,
      indicativeCropWaterNeedMmPerSeason: {
        min: 450,
        max: 700,
        evidenceId: 'FAO-WATER-04',
        useAsHardConstraint: false,
      },
      temperatureC: null,
      soilPh: null,
    },
    rotationTraits: { nitrogenContribution: 'fixes' },
    sourceCitations: [
      {
        claim: 'Indicative seasonal crop water need for soybean is 450 to 700 mm.',
        citation: 'Brouwer & Heibloem (1986), FAO Training Manual No. 3 (FAO-WATER-04)',
      },
    ],
  },
  {
    id: '00000000-0000-0000-0000-000000000003',
    code: 'maize',
    name: 'Maize',
    scientificName: 'Zea mays L.',
    category: 'cereal',
    growingPeriodDays: { min: null, max: null },
    agronomicRequirements: {
      rainfallRequirementMm: null,
      indicativeCropWaterNeedMmPerSeason: {
        min: 500,
        max: 800,
        evidenceId: 'FAO-WATER-01',
        useAsHardConstraint: false,
      },
      temperatureC: null,
      soilPh: null,
    },
    rotationTraits: { nitrogenContribution: 'consumes' },
    sourceCitations: [
      {
        claim: 'Indicative seasonal crop water need for maize is 500 to 800 mm.',
        citation: 'Brouwer & Heibloem (1986), FAO Training Manual No. 3 (FAO-WATER-01)',
      },
    ],
  },
  {
    id: '00000000-0000-0000-0000-000000000004',
    code: 'cowpea',
    name: 'Cowpea',
    scientificName: 'Vigna unguiculata (L.) Walp.',
    category: 'legume',
    growingPeriodDays: { min: null, max: null },
    agronomicRequirements: {
      rainfallRequirementMm: null,
      indicativeCropWaterNeedMmPerSeason: null,
      temperatureC: null,
      soilPh: null,
    },
    rotationTraits: { nitrogenContribution: 'fixes' },
    sourceCitations: [
      {
        claim: 'Cowpea evaluated in Samaru grain legume rotation trials.',
        citation: 'Yusuf et al. (2009) (NIGERIA-ROT-01)',
      },
    ],
  },
  {
    id: '00000000-0000-0000-0000-000000000005',
    code: 'pearl_millet',
    name: 'Pearl millet',
    scientificName: 'Cenchrus americanus',
    category: 'cereal',
    growingPeriodDays: { min: null, max: null },
    agronomicRequirements: {
      rainfallRequirementMm: null,
      indicativeCropWaterNeedMmPerSeason: {
        min: 450,
        max: 650,
        evidenceId: 'FAO-WATER-03',
        useAsHardConstraint: false,
      },
      temperatureC: null,
      soilPh: null,
    },
    rotationTraits: { nitrogenContribution: 'consumes' },
    sourceCitations: [
      {
        claim: 'Indicative seasonal crop water need for sorghum/millet is 450 to 650 mm.',
        citation: 'Brouwer & Heibloem (1986), FAO Training Manual No. 3 (FAO-WATER-03)',
      },
    ],
  },
];

const sampleRules: readonly RotationRule[] = [
  {
    id: 'farmer-report-interview-03-rotation',
    statement:
      'Rotate sorghum and soybean plots with white cowpeas or maize on a 2 to 3 year cycle.',
    sourceType: 'farmer_report',
    attributedTo: 'Interview 03 participant',
    sourceUrl: 'docs/research/field-interviews/interview-03/case-study.md',
    accessedOn: '2026-11-14',
    appliesTo: ['sorghum', 'soybean'],
    follows: ['cowpea', 'soybean', 'maize'],
    mechanism: 'Farmer-reported practice from an anonymised interview in Tofa LGA.',
  },
  {
    id: 'literature-samaru-yusuf-2009-legume-maize',
    statement:
      'Sequential rotation of maize after grain legumes increased mean maize yield in Samaru trials.',
    sourceType: 'literature',
    attributedTo: 'Yusuf et al. (2009)',
    sourceUrl: 'https://doi.org/10.1007/s10705-008-9232-9',
    accessedOn: '2026-11-14',
    appliesTo: ['cowpea', 'soybean'],
    follows: ['maize'],
    mechanism: 'Fixed-N and rotation effects in Northern Guinea Savanna trials.',
  },
  {
    id: 'literature-icrisat-bado-2022-millet-cowpea',
    statement:
      'Sequential pearl millet and cowpea rotation evaluated over 25 years at ICRISAT Sadore.',
    sourceType: 'literature',
    attributedTo: 'Bado et al. (2022)',
    sourceUrl: 'https://oar.icrisat.org/11988/',
    accessedOn: '2026-11-14',
    appliesTo: ['pearl_millet', 'cowpea'],
    follows: ['cowpea', 'pearl_millet'],
    mechanism: 'Long-term cereal-legume rotation with residue management.',
  },
];

const sampleObservations: readonly ProvenancedValue[] = [
  {
    variable: 'precipitation_mm',
    value: 14.5,
    unit: 'mm',
    sourceId: 'nasa_power',
    spatialResolutionM: 55_000,
    temporalResolution: 'daily',
    observedAt: '2026-06-10T00:00:00.000Z',
    retrievedAt: '2026-11-14T12:00:00.000Z',
    isModelled: true,
    qualityFlag: 'good',
  },
  {
    variable: 'precipitation_mm',
    value: 11.2,
    unit: 'mm',
    sourceId: 'nasa_power',
    spatialResolutionM: 55_000,
    temporalResolution: 'daily',
    observedAt: '2026-06-11T00:00:00.000Z',
    retrievedAt: '2026-11-14T12:00:00.000Z',
    isModelled: true,
    qualityFlag: 'good',
  },
  {
    variable: 'soil_wetness_root_zone',
    value: 0.42,
    unit: '1',
    sourceId: 'nasa_power',
    spatialResolutionM: 55_000,
    temporalResolution: 'daily',
    observedAt: '2026-06-11T00:00:00.000Z',
    retrievedAt: '2026-11-14T12:00:00.000Z',
    isModelled: true,
    qualityFlag: 'good',
  },
];

describe('qualitative engine, planting trigger, and seasonal outlook', () => {
  it('evaluates a catalog crop with explicit unverified_requirement limitations when Tofa hard constraints are unset', () => {
    const assessment = evaluateCatalogCropForParcel({
      crop: sampleCatalogCrops[0]!,
      observations: sampleObservations,
      parcelAreaHa: 1.5,
    });

    expect(assessment.verdict).toBe('insufficient_information');
    expect(assessment.limitations.some((item) => item.kind === 'unverified_requirement')).toBe(
      true,
    );
    expect(assessment.limitations.some((item) => item.kind === 'coarse_resolution')).toBe(true);
  });

  it('builds and compares three rotation strategies including the existing farmer practice', () => {
    const comparison = buildAndCompareRotationStrategies({
      farmId: '00000000-0000-0000-0000-000000000099',
      parcelId: '00000000-0000-0000-0000-000000000088',
      parcelAreaHa: 3.0,
      catalogCrops: sampleCatalogCrops,
      rotationRules: sampleRules,
      farmerCropHistory: [
        {
          cropCode: 'sorghum',
          status: 'previous',
          season: 'rainy',
          parcelId: '00000000-0000-0000-0000-000000000088',
          areaHa: 3.0,
        },
        {
          cropCode: 'soybean',
          status: 'current',
          season: 'rainy',
          parcelId: '00000000-0000-0000-0000-000000000088',
          areaHa: 3.0,
        },
      ],
      observations: sampleObservations,
      goals: ['conserve_water', 'improve_soil_fertility'],
    });

    expect(comparison.kind).toBe('rotation');
    expect(comparison.strategies).toHaveLength(3);
    expect(comparison.strategies[0]?.kind).toBe('existing');
    expect(comparison.strategies.filter((s) => s.kind === 'alternative')).toHaveLength(2);
    expect(
      comparison.strategies.every((s) => s.localReviewRisks.length > 0 && s.rank !== null),
    ).toBe(true);
  });

  it('compares prospective suitability and reports ties when Tofa thresholds do not separate candidates', () => {
    const suitability = compareProspectiveSuitability({
      farmId: '00000000-0000-0000-0000-000000000099',
      parcelId: null,
      parcelAreaHa: 2.0,
      catalogCrops: sampleCatalogCrops,
      observations: sampleObservations,
      goals: ['conserve_water'],
    });

    expect(suitability.kind).toBe('suitability');
    expect(suitability.strategies.length).toBe(sampleCatalogCrops.length);
    const tiedTop = suitability.strategies.filter((s) => s.rank === 'tied');
    expect(tiedTop.length).toBe(4);
    expect(suitability.strategies.find((s) => s.label.startsWith('Cowpea'))?.rank).toBe('lower');
  });

  it('recommends a planting trigger condition conditioned on the farmer rule without recommending a calendar date', () => {
    const trigger = assessPlantingTrigger({
      parcelId: '00000000-0000-0000-0000-000000000088',
      farmerRule: 'wait_for_confirmed_moisture',
      observations: sampleObservations,
    });

    expect(trigger.recommendedTrigger).toBe('wait_for_confirmed_moisture');
    expect(trigger.condition).toContain('moisture');
    expect(trigger.evidence.some((item) => item.kind === 'farmer_report')).toBe(true);
  });

  it('computes a seasonal risk outlook with the mandatory non-forecast framing note', () => {
    const outlook = assessSeasonalOutlook({
      parcelId: '00000000-0000-0000-0000-000000000088',
      dailyObservations: sampleObservations,
      climatologyObservations: [
        {
          variable: 'precipitation_mm',
          value: 4.0,
          unit: 'mm',
          sourceId: 'nasa_power',
          spatialResolutionM: 55_000,
          temporalResolution: 'climatology',
          observedAt: '2001-06-01T00:00:00.000Z',
          retrievedAt: '2026-11-14T12:00:00.000Z',
          isModelled: true,
          qualityFlag: 'good',
          rawMetadata: { climatologyMonth: 'JUN', daysInMonth: 30 },
        },
      ],
    });

    expect(outlook.rainfallToDate.valueMm).toBe(25.7);
    expect(outlook.rainfallToDate.normalMm).toBe(120);
    expect(outlook.onset.status).toBe('started');
    expect(outlook.framingNote.toLowerCase()).toContain('never a weather forecast');
  });

  it('builds a printable farm report with redacted coordinates and source attributions', () => {
    const report = buildFarmReportPayload({
      kind: 'farm_summary',
      periodStart: '2026-05-01',
      periodEnd: '2026-10-31',
      farm: {
        id: '00000000-0000-0000-0000-000000000099',
        farmerId: '00000000-0000-0000-0000-000000000011',
        name: 'Gonar Arewa',
        farmingMethod: 'mixed',
        irrigationMethod: 'rainfed',
        soilNotes: 'Sandy loam ridges',
      },
      parcels: [
        {
          id: '00000000-0000-0000-0000-000000000088',
          name: 'Kudu Parcel',
          areaHa: 1.5,
          locationUncertaintyM: 15,
          geometryMethod: 'gps_point',
        },
      ],
      crops: [],
      priorities: null,
      observations: sampleObservations,
      comparison: null,
      plantingTrigger: null,
      seasonalOutlook: null,
    });

    expect(report.farm.totalAreaHa).toBe(1.5);
    expect(report.parcels[0]?.coordinatesIncluded).toBe(false);
    expect(report.attributions.some((attr) => attr.sourceId === 'nasa_power')).toBe(true);
    expect(report.disclaimer).toContain('not affiliated with or endorsed by NASA');
  });
});
