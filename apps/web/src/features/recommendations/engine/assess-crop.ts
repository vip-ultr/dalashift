import type {
  AssessmentDimension,
  EvidenceStrength,
  LimitationKind,
} from '@dalashift/shared/constants';
import type { CropAssessment, DimensionAssessment, Limitation } from '@dalashift/shared/types';

export interface DimensionRule {
  readonly dimension: AssessmentDimension;
  readonly min: number | null;
  readonly max: number | null;
  readonly unit: string;
  readonly citation: string;
  readonly hardConstraint: boolean;
}

export interface AssessmentObservation {
  readonly dimension: AssessmentDimension;
  readonly value: number | null;
  readonly unit: string;
  readonly sourceId: string;
  readonly observedAt: string;
  readonly evidenceStrength: EvidenceStrength;
  readonly quality: 'good' | 'suspect' | 'partial' | 'missing';
  /** Set by source-specific policy when its resolution supports this decision. */
  readonly adequateForHardConstraint: boolean;
  readonly limitation?: Limitation;
}

export interface AssessCropInput {
  readonly cropId: string;
  readonly cropCode: string;
  readonly cropName: string;
  readonly rulesetVersion: string;
  readonly rules: readonly DimensionRule[];
  readonly observations: readonly AssessmentObservation[];
}

const STRENGTH_ORDER: Record<EvidenceStrength, number> = {
  strong: 0,
  moderate: 1,
  weak: 2,
};

const DIMENSION_LABELS: Record<AssessmentDimension, string> = {
  climate_rainfall: 'Rainfall',
  climate_temperature: 'Temperature',
  water_availability: 'Water availability',
  soil_match: 'Soil conditions',
  season_length: 'Season length',
  vegetation_condition: 'Vegetation condition',
  rotation_fit: 'Rotation fit',
  management_requirement: 'Management requirements',
};

/** Compare supplied evidence to supplied, cited rules without generating scores. */
export function assessCrop(input: AssessCropInput): CropAssessment {
  if (input.rulesetVersion.trim().length === 0) {
    throw new Error('A ruleset version is required.');
  }
  if (input.rules.some((rule) => rule.min !== null && rule.max !== null && rule.min > rule.max)) {
    throw new Error('A dimension rule cannot have a minimum above its maximum.');
  }
  if (
    input.rules.some(
      (rule) =>
        (rule.min === null && rule.max === null) ||
        rule.citation.trim().length === 0 ||
        rule.unit.trim().length === 0,
    )
  ) {
    throw new Error('Every dimension rule needs a numeric bound, unit and citation.');
  }
  if (new Set(input.rules.map((rule) => rule.dimension)).size !== input.rules.length) {
    throw new Error('Only one rule per dimension is supported.');
  }

  const observationsByDimension = new Map<AssessmentDimension, AssessmentObservation>();
  for (const observation of input.observations) {
    if (observationsByDimension.has(observation.dimension)) {
      throw new Error(`Only one observation per dimension is supported: ${observation.dimension}.`);
    }
    if (
      (observation.value !== null && !Number.isFinite(observation.value)) ||
      Number.isNaN(Date.parse(observation.observedAt))
    ) {
      throw new Error(`The observation for ${observation.dimension} is invalid.`);
    }
    observationsByDimension.set(observation.dimension, observation);
  }

  const limitations: Limitation[] = [];
  const dimensions = input.rules.map((rule): DimensionAssessment => {
    const observation = observationsByDimension.get(rule.dimension);
    if (observation?.limitation) limitations.push(observation.limitation);

    if (
      !observation ||
      observation.value === null ||
      observation.quality === 'missing' ||
      observation.sourceId.trim().length === 0 ||
      observation.observedAt.trim().length === 0
    ) {
      limitations.push({
        kind: 'missing_data',
        statement: `${DIMENSION_LABELS[rule.dimension]} could not be assessed because a current value is not available.`,
      });
      return {
        dimension: rule.dimension,
        value: null,
        unit: null,
        threshold: { min: rule.min, max: rule.max, citation: rule.citation },
        status: 'not_assessed' as const,
        explanation: 'No usable value is available for this requirement.',
        sourceId: null,
        observedAt: null,
      };
    }

    const insideRange =
      (rule.min === null || observation.value >= rule.min) &&
      (rule.max === null || observation.value <= rule.max);
    const unitMatches = observation.unit === rule.unit;
    const trustworthy =
      observation.quality === 'good' &&
      observation.evidenceStrength !== 'weak' &&
      unitMatches &&
      (!rule.hardConstraint || observation.adequateForHardConstraint);
    const status: DimensionAssessment['status'] = !trustworthy
      ? 'uncertain'
      : insideRange
        ? 'pass'
        : 'fail';
    const statusText = insideRange ? 'within' : 'outside';
    const boundText = formatRange(rule.min, rule.max, rule.unit);
    const explanation = trustworthy
      ? `${observation.value} ${observation.unit} is ${statusText} the cited requirement of ${boundText}.`
      : unitMatches
        ? `The available value cannot establish whether it meets the cited requirement of ${boundText}.`
        : `The available unit (${observation.unit}) does not match the cited requirement unit (${rule.unit}).`;

    if (!trustworthy && !observation.limitation) {
      const kind: LimitationKind =
        observation.quality === 'partial'
          ? 'partial_coverage'
          : observation.quality === 'good' && !observation.adequateForHardConstraint
            ? 'coarse_resolution'
            : 'needs_local_review';
      limitations.push({
        kind,
        statement: `${DIMENSION_LABELS[rule.dimension]} evidence is not strong enough to decide this requirement.`,
      });
    }

    return {
      dimension: rule.dimension,
      value: observation.value,
      unit: observation.unit,
      threshold: { min: rule.min, max: rule.max, citation: rule.citation },
      status,
      explanation,
      sourceId: observation.sourceId,
      observedAt: observation.observedAt,
    };
  });

  const hardDimensions = dimensions.filter((dimension) =>
    input.rules.some((rule) => rule.dimension === dimension.dimension && rule.hardConstraint),
  );
  const verdict = determineVerdict(hardDimensions);
  const usedObservations = input.observations.filter((observation) =>
    input.rules.some((rule) => rule.dimension === observation.dimension),
  );
  const evidenceStrength = determineEvidenceStrength(usedObservations);
  const evidenceStrengthReason = explainEvidenceStrength(usedObservations, evidenceStrength);
  const rationale = buildRationale(dimensions, verdict);

  return {
    cropId: input.cropId,
    cropCode: input.cropCode,
    cropName: input.cropName,
    verdict,
    dimensions,
    rationale,
    limitations: deduplicateLimitations(limitations),
    evidenceStrength,
    evidenceStrengthReason,
    rulesetVersion: input.rulesetVersion,
  };
}

function determineVerdict(hardDimensions: CropAssessment['dimensions']): CropAssessment['verdict'] {
  if (hardDimensions.length === 0) return 'insufficient_information';
  if (hardDimensions.some((dimension) => dimension.status === 'fail')) return 'not_suitable';
  if (hardDimensions.some((dimension) => dimension.status === 'not_assessed')) {
    return 'insufficient_information';
  }
  if (hardDimensions.some((dimension) => dimension.status === 'uncertain')) return 'conditional';
  return 'suitable';
}

function determineEvidenceStrength(
  observations: readonly AssessmentObservation[],
): EvidenceStrength {
  if (observations.length === 0) return 'weak';
  return observations.reduce<EvidenceStrength>(
    (weakest, observation) =>
      STRENGTH_ORDER[observation.evidenceStrength] > STRENGTH_ORDER[weakest]
        ? observation.evidenceStrength
        : weakest,
    'strong',
  );
}

function explainEvidenceStrength(
  observations: readonly AssessmentObservation[],
  strength: EvidenceStrength,
): string {
  if (observations.length === 0) return 'No environmental observations were available.';
  const limiting = observations.filter(
    (observation) => observation.evidenceStrength === strength && observation.quality !== 'good',
  );
  if (limiting.length > 0) {
    return `${strength} evidence because ${limiting.map((item) => DIMENSION_LABELS[item.dimension].toLowerCase()).join(', ')} data has a ${limiting[0]?.quality} quality flag.`;
  }
  const weakDimensions = observations
    .filter((observation) => observation.evidenceStrength === strength)
    .map((observation) => DIMENSION_LABELS[observation.dimension].toLowerCase());
  return `${strength} evidence based on ${weakDimensions.join(', ')} observations and their recorded provenance.`;
}

function buildRationale(
  dimensions: CropAssessment['dimensions'],
  verdict: CropAssessment['verdict'],
): string {
  if (
    dimensions.length === 0 ||
    dimensions.every((dimension) => dimension.status === 'not_assessed')
  ) {
    return 'There is not enough cited evidence to assess this crop.';
  }
  const summary = dimensions.map((dimension) => {
    const label = DIMENSION_LABELS[dimension.dimension];
    return `${label}: ${dimension.explanation}`;
  });
  return `${verdict.replaceAll('_', ' ')}. ${summary.join(' ')}`;
}

function formatRange(min: number | null, max: number | null, unit: string): string {
  if (min !== null && max !== null) return `${min} to ${max} ${unit}`;
  if (min !== null) return `at least ${min} ${unit}`;
  if (max !== null) return `no more than ${max} ${unit}`;
  return `the cited requirement (${unit})`;
}

function deduplicateLimitations(limitations: readonly Limitation[]): readonly Limitation[] {
  const seen = new Set<string>();
  return limitations.filter((limitation) => {
    const key = `${limitation.kind}:${limitation.statement}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
