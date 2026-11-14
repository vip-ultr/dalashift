import {
  FARMER_GOAL_LABELS,
  type AssessmentDimension,
  type FarmerGoal,
  type RankPosition,
} from '@dalashift/shared/constants';
import type {
  ComparisonResult,
  CropAssessment,
  Limitation,
  ProvenancedValue,
  RotationStrategy,
} from '@dalashift/shared/types';

import {
  DEFAULT_RULESET_VERSION,
  evaluateCatalogCropForParcel,
  type CatalogCropRecord,
} from './build-crop-inputs';

const VERDICT_ORDER: Record<CropAssessment['verdict'], number> = {
  suitable: 0,
  conditional: 1,
  insufficient_information: 2,
  not_suitable: 3,
};

const STATUS_ORDER = {
  pass: 0,
  uncertain: 1,
  not_assessed: 2,
  fail: 2,
} as const;

const GOAL_DIMENSIONS: Partial<Record<FarmerGoal, readonly AssessmentDimension[]>> = {
  improve_soil_fertility: ['rotation_fit', 'soil_match'],
  conserve_water: ['water_availability', 'climate_rainfall'],
  maturity_reliability: ['season_length'],
  less_work: ['management_requirement'],
  reduce_risk: ['climate_rainfall', 'water_availability', 'season_length'],
};

/**
 * Prospective farmer suitability comparison (Decision D-03 & D-05).
 *
 * Evaluates candidate crops in the catalog for a parcel where no existing crop
 * sequence has been established, producing an ordinal shortlist with explicit
 * `'tied'` ranks whenever the available evidence cannot separate candidates.
 */
export function compareProspectiveSuitability(input: {
  readonly farmId: string;
  readonly parcelId: string | null;
  readonly parcelAreaHa: number | null;
  readonly catalogCrops: readonly CatalogCropRecord[];
  readonly observations: readonly ProvenancedValue[];
  readonly goals: readonly FarmerGoal[];
  readonly rulesetVersion?: string;
}): ComparisonResult {
  const rulesetVersion = input.rulesetVersion ?? DEFAULT_RULESET_VERSION;
  if (input.catalogCrops.length === 0) {
    throw new Error('At least one candidate crop is required for a suitability comparison.');
  }

  const dimensionsToCompare = [
    ...new Set(input.goals.flatMap((goal) => GOAL_DIMENSIONS[goal] ?? [])),
  ];

  const unrankedStrategies: RotationStrategy[] = input.catalogCrops.map((crop) => {
    const assessment = evaluateCatalogCropForParcel({
      crop,
      observations: input.observations,
      parcelAreaHa: input.parcelAreaHa,
      rulesetVersion,
    });

    const isLegume = crop.rotationTraits?.nitrogenContribution === 'fixes';

    return {
      kind: 'alternative',
      label: `${crop.name}${crop.scientificName ? ` (${crop.scientificName})` : ''}`,
      legs: [
        {
          sequence: 0,
          season: 'rainy',
          cropId: crop.id,
          cropCode: crop.code,
          cropName: crop.name,
          parcelId: input.parcelId,
          areaHa: input.parcelAreaHa,
          assessment,
        },
      ],
      rationale: `Assessed as a candidate crop for a prospective parcel in Tofa LGA against cited catalog parameters.`,
      evidence: crop.sourceCitations.map((citation) => ({
        kind: 'documented_agronomic_evidence' as const,
        statement: citation.claim,
        citation: citation.citation,
        value: null,
        unit: null,
      })),
      benefits: isLegume
        ? [
            'Grain legume candidate that can be rotated with cereals in subsequent seasons (Yusuf et al., 2009).',
          ]
        : ['Staple crop reported by farmers in Doka village, Tofa LGA.'],
      informationGaps: assessment.limitations.map((item) => item.statement),
      localReviewRisks: [
        `Confirm local variety choice, seed availability, and field-specific soil texture for ${crop.name} with the local extension officer (malamin gona).`,
      ],
      rank: null,
      rankingBasis: 'Pending suitability ordering',
      evidenceStrength: assessment.evidenceStrength,
      evidenceStrengthReason: assessment.evidenceStrengthReason,
    };
  });

  const sorted = [...unrankedStrategies].sort((left, right) =>
    compareSingleCropStrategies(left, right, dimensionsToCompare),
  );
  const topLeader = sorted[0]!;
  const topLeaders = sorted.filter(
    (item) => compareSingleCropStrategies(item, topLeader, dimensionsToCompare) === 0,
  );
  const tiedAtTop = topLeaders.length > 1;

  const rankingBasis = buildSuitabilityRankingBasis(input.goals, dimensionsToCompare, tiedAtTop);

  const strategies: RotationStrategy[] = sorted.map((strategy) => {
    const tiedWithAny = sorted.some(
      (other) =>
        other !== strategy &&
        compareSingleCropStrategies(strategy, other, dimensionsToCompare) === 0,
    );
    const rank: RankPosition = topLeaders.includes(strategy)
      ? tiedAtTop
        ? 'tied'
        : 'first'
      : tiedWithAny
        ? 'tied'
        : 'lower';

    return {
      ...strategy,
      rank,
      rankingBasis,
    };
  });

  const limitations: Limitation[] = [
    {
      kind: 'unverified_requirement',
      statement:
        'Where Tofa-specific crop thresholds remain unset in the research catalog, candidate crops cannot be separated by hard constraints and are reported as tied.',
    },
    {
      kind: 'needs_local_review',
      statement:
        'Suitability shortlists require local review of parcel soil texture, water retention, and cultivar maturity before planting.',
    },
  ];

  return {
    kind: 'suitability',
    farmId: input.farmId,
    parcelId: input.parcelId,
    strategies,
    rankingBasis,
    goals: input.goals,
    limitations,
    rulesetVersion,
  };
}

function compareSingleCropStrategies(
  left: RotationStrategy,
  right: RotationStrategy,
  dimensions: readonly AssessmentDimension[],
): number {
  const leftAssessment = left.legs[0]?.assessment;
  const rightAssessment = right.legs[0]?.assessment;
  if (!leftAssessment || !rightAssessment) return 0;

  const verdictDiff =
    VERDICT_ORDER[leftAssessment.verdict] - VERDICT_ORDER[rightAssessment.verdict];
  if (verdictDiff !== 0) return verdictDiff;

  for (const dimension of dimensions) {
    const leftDim = leftAssessment.dimensions.find((d) => d.dimension === dimension);
    const rightDim = rightAssessment.dimensions.find((d) => d.dimension === dimension);
    const leftOrder = leftDim ? STATUS_ORDER[leftDim.status] : STATUS_ORDER.not_assessed;
    const rightOrder = rightDim ? STATUS_ORDER[rightDim.status] : STATUS_ORDER.not_assessed;
    if (leftOrder !== rightOrder) return leftOrder - rightOrder;
  }

  return 0;
}

function buildSuitabilityRankingBasis(
  goals: readonly FarmerGoal[],
  dimensions: readonly AssessmentDimension[],
  tiedAtTop: boolean,
): string {
  const tieNote = tiedAtTop
    ? ' Multiple candidates are tied because the verified evidence does not separate them.'
    : '';
  if (goals.length === 0 || dimensions.length === 0) {
    return `Candidates are ordered by qualitative crop verdict with no composite score or weights.${tieNote}`;
  }
  const goalLabels = goals.map((goal) => FARMER_GOAL_LABELS[goal]).join(', ');
  return `Candidates are ordered by qualitative crop verdict and then by dimensions matching the stated goals (${goalLabels}): ${dimensions.join(', ')}.${tieNote}`;
}
