import {
  FARMER_GOAL_LABELS,
  type AssessmentDimension,
  type FarmerGoal,
  type RankPosition,
} from '@dalashift/shared/constants';
import type { ComparisonResult, Limitation, RotationStrategy } from '@dalashift/shared/types';

export interface CompareRotationsInput {
  readonly farmId: string;
  readonly parcelId: string | null;
  readonly strategies: readonly RotationStrategy[];
  readonly goals: readonly FarmerGoal[];
  readonly limitations: readonly Limitation[];
  readonly rulesetVersion: string;
}

const VERDICT_ORDER: Record<RotationStrategy['legs'][number]['assessment']['verdict'], number> = {
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

/** Order complete rotation options by the farmer's stated goals and evidence. */
export function compareRotations(input: CompareRotationsInput): ComparisonResult {
  if (input.rulesetVersion.trim().length === 0) {
    throw new Error('A ruleset version is required.');
  }
  const existingCount = input.strategies.filter((strategy) => strategy.kind === 'existing').length;
  const alternativeCount = input.strategies.filter(
    (strategy) => strategy.kind === 'alternative',
  ).length;
  if (existingCount !== 1 || alternativeCount < 2) {
    throw new Error(
      'A rotation comparison requires one existing strategy and at least two alternatives.',
    );
  }
  const existing = input.strategies.find((strategy) => strategy.kind === 'existing');
  if (!existing?.evidence.some((item) => item.kind === 'farmer_report')) {
    throw new Error('The existing rotation must include farmer-reported evidence.');
  }

  const dimensionOrder = uniqueDimensions(
    input.goals.flatMap((goal) => GOAL_DIMENSIONS[goal] ?? []),
  );
  const unsupportedGoals = input.goals.filter((goal) => !GOAL_DIMENSIONS[goal]);
  const limitations = [...input.limitations];
  if (unsupportedGoals.length > 0) {
    limitations.push({
      kind: 'needs_local_review',
      statement: `These goals could not guide the ordering because the comparison has no suitable evidence: ${unsupportedGoals.map((goal) => FARMER_GOAL_LABELS[goal]).join(', ')}.`,
    });
  }

  const orderingBasis = buildOrderingBasis(input.goals, dimensionOrder);
  const ranked = rankStrategies(input.strategies, dimensionOrder);
  const strategies = ranked.map(({ strategy, rank }) => ({
    ...strategy,
    rank,
    rankingBasis: orderingBasis,
  }));

  return {
    kind: 'rotation',
    farmId: input.farmId,
    parcelId: input.parcelId,
    strategies,
    rankingBasis: orderingBasis,
    goals: input.goals,
    limitations: deduplicateLimitations(limitations),
    rulesetVersion: input.rulesetVersion,
  };
}

function rankStrategies(
  strategies: readonly RotationStrategy[],
  dimensions: readonly AssessmentDimension[],
): readonly { strategy: RotationStrategy; rank: RankPosition }[] {
  const baseline = strategies.find((strategy) => strategy.kind === 'existing');
  const alternatives = strategies.filter((strategy) => strategy.kind === 'alternative');
  if (!baseline) throw new Error('The existing rotation strategy is required.');

  const orderedAlternatives = [...alternatives].sort((left, right) =>
    compareStrategy(left, right, dimensions),
  );
  const candidates = [baseline, ...orderedAlternatives];
  const leader = [...candidates].sort((left, right) => compareStrategy(left, right, dimensions))[0];
  if (!leader) throw new Error('At least one rotation strategy is required.');

  const leaders = candidates.filter(
    (strategy) => compareStrategy(strategy, leader, dimensions) === 0,
  );
  const tiedAtTop = leaders.length > 1;

  return candidates.map((strategy) => {
    const tiedWithAnother = candidates.some(
      (other) => other !== strategy && compareStrategy(strategy, other, dimensions) === 0,
    );
    return {
      strategy,
      rank: leaders.includes(strategy)
        ? tiedAtTop
          ? 'tied'
          : 'first'
        : tiedWithAnother
          ? 'tied'
          : 'lower',
    };
  });
}

function compareStrategy(
  left: RotationStrategy,
  right: RotationStrategy,
  dimensions: readonly AssessmentDimension[],
): number {
  const verdictDifference = strategyVerdictOrder(left) - strategyVerdictOrder(right);
  if (verdictDifference !== 0) return verdictDifference;

  for (const dimension of dimensions) {
    const difference =
      strategyDimensionOrder(left, dimension) - strategyDimensionOrder(right, dimension);
    if (difference !== 0) return difference;
  }

  return 0;
}

function strategyVerdictOrder(strategy: RotationStrategy): number {
  const verdicts = strategy.legs.map((leg) => leg.assessment.verdict);
  if (verdicts.length === 0) return VERDICT_ORDER.insufficient_information;
  return Math.max(...verdicts.map((verdict) => VERDICT_ORDER[verdict]));
}

function strategyDimensionOrder(
  strategy: RotationStrategy,
  dimension: AssessmentDimension,
): number {
  const assessments = strategy.legs.flatMap((leg) =>
    leg.assessment.dimensions.filter((item) => item.dimension === dimension),
  );
  if (assessments.length === 0) return STATUS_ORDER.not_assessed;
  return Math.max(...assessments.map((assessment) => STATUS_ORDER[assessment.status]));
}

function buildOrderingBasis(
  goals: readonly FarmerGoal[],
  dimensions: readonly AssessmentDimension[],
): string {
  const verdictBasis = 'Each strategy is first compared by its least suitable crop assessment.';
  if (goals.length === 0) {
    return `${verdictBasis} With no stated goals, strategies with the same crop verdict are tied.`;
  }
  const goalLabels = goals.map((goal) => FARMER_GOAL_LABELS[goal]).join(', ');
  if (dimensions.length === 0) {
    return `${verdictBasis} The stated goals (${goalLabels}) have no supported dimensions in this comparison, so equal crop verdicts remain tied.`;
  }
  return `${verdictBasis} The ordering follows the farmer's goals (${goalLabels}) and compares these dimensions in order: ${dimensions.join(', ')}. Pass is preferred to uncertain. Fail and not assessed do not separate strategies. No weights are applied.`;
}

function uniqueDimensions(
  dimensions: readonly AssessmentDimension[],
): readonly AssessmentDimension[] {
  return [...new Set(dimensions)];
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
