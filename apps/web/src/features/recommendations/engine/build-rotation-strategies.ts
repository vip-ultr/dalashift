import type { FarmerGoal, Season } from '@dalashift/shared/constants';
import type {
  ComparisonResult,
  EvidenceItem,
  Limitation,
  ProvenancedValue,
  RotationLeg,
  RotationRule,
  RotationStrategy,
} from '@dalashift/shared/types';

import {
  DEFAULT_RULESET_VERSION,
  evaluateCatalogCropForParcel,
  type CatalogCropRecord,
} from './build-crop-inputs';
import { compareRotations } from './compare-rotations';

export interface FarmerCropHistoryEntry {
  readonly cropCode: string;
  readonly status: 'current' | 'previous' | 'planned';
  readonly season: Season;
  readonly parcelId: string | null;
  readonly areaHa: number | null;
}

/**
 * Construct and compare the farmer's existing rotation strategy against at
 * least two evidence-backed alternatives (Decision D-11 & FR-8).
 *
 * Preserves the distinction between `farmer_report` and `literature` rules,
 * and includes mandatory transfer-limit and local-review statements on every
 * strategy.
 */
export function buildAndCompareRotationStrategies(input: {
  readonly farmId: string;
  readonly parcelId: string | null;
  readonly parcelAreaHa: number | null;
  readonly catalogCrops: readonly CatalogCropRecord[];
  readonly rotationRules: readonly RotationRule[];
  readonly farmerCropHistory: readonly FarmerCropHistoryEntry[];
  readonly observations: readonly ProvenancedValue[];
  readonly goals: readonly FarmerGoal[];
  readonly rulesetVersion?: string;
}): ComparisonResult {
  const rulesetVersion = input.rulesetVersion ?? DEFAULT_RULESET_VERSION;
  const cropsByCode = new Map<string, CatalogCropRecord>(
    input.catalogCrops.map((crop) => [crop.code, crop]),
  );

  const assessmentsByCode = new Map(
    input.catalogCrops.map((crop) => [
      crop.code,
      evaluateCatalogCropForParcel({
        crop,
        observations: input.observations,
        parcelAreaHa: input.parcelAreaHa,
        rulesetVersion,
      }),
    ]),
  );

  // 1. Build the farmer's existing strategy from their recorded crops
  const orderedExistingCodes = deriveExistingSequenceCodes(input.farmerCropHistory, cropsByCode);
  const existingLegs = buildLegs(
    orderedExistingCodes,
    cropsByCode,
    assessmentsByCode,
    input.parcelId,
    input.parcelAreaHa,
  );

  const farmerRule = input.rotationRules.find((rule) => rule.sourceType === 'farmer_report');
  const existingEvidence: EvidenceItem[] = [
    {
      kind: 'farmer_report',
      statement:
        input.farmerCropHistory.length > 0
          ? `Recorded farm crop sequence: ${orderedExistingCodes.map((code) => cropsByCode.get(code)?.name ?? code).join(' followed by ')}.`
          : (farmerRule?.statement ??
            'Baseline crop practice reported by the farmer in Doka, Tofa LGA.'),
      citation: farmerRule?.sourceUrl ?? 'Farmer-supplied crop record on this parcel',
      value: null,
      unit: null,
    },
    ...buildObservationEvidenceItems(input.observations),
  ];

  const existingStrategy: RotationStrategy = {
    kind: 'existing',
    label: `Existing practice (${orderedExistingCodes.map((code) => cropsByCode.get(code)?.name ?? code).join(' -> ')})`,
    legs: existingLegs,
    rationale:
      'Represents the farmer-reported crop sequence on this parcel, evaluated as the baseline on equal terms with the alternatives.',
    evidence: existingEvidence,
    benefits: [
      'Uses crops and field management already familiar to the farmer.',
      'Provides the direct local baseline against which alternative sequences are compared.',
    ],
    informationGaps: collectStrategyGaps(existingLegs),
    localReviewRisks: [
      'Local cultivar maturity days and field-level soil nutrient status are not measured by satellite data and require review with the farmer and local extension officer (malamin gona).',
    ],
    rank: null,
    rankingBasis: 'Pending comparison',
    evidenceStrength: deriveStrategyEvidenceStrength(existingLegs),
    evidenceStrengthReason: deriveStrategyEvidenceReason(existingLegs),
  };

  // 2. Alternative 1: Legume -> Cereal sequence (Samaru trial evidence: Yusuf et al. 2009)
  const samaruRule = input.rotationRules.find((rule) => rule.id.includes('samaru'));
  const altOneCodes = pickDistinctSequence(
    orderedExistingCodes,
    ['soybean', 'maize', 'cowpea'],
    cropsByCode,
  );
  const altOneLegs = buildLegs(
    altOneCodes,
    cropsByCode,
    assessmentsByCode,
    input.parcelId,
    input.parcelAreaHa,
  );
  const alternativeOne: RotationStrategy = {
    kind: 'alternative',
    label: `Grain legume to maize sequence (${altOneCodes.map((code) => cropsByCode.get(code)?.name ?? code).join(' -> ')})`,
    legs: altOneLegs,
    rationale:
      samaruRule?.statement ??
      'Alternates nitrogen-fixing grain legumes (soybean or cowpea) with maize across successive rainy seasons.',
    evidence: [
      {
        kind: 'documented_agronomic_evidence',
        statement:
          samaruRule?.statement ??
          'Maize following cowpea or soybean had higher mean yield than continuous maize in Samaru Northern Guinea Savanna field trials (2003 to 2005).',
        citation: samaruRule?.sourceUrl ?? 'https://doi.org/10.1007/s10705-008-9232-9',
        value: null,
        unit: null,
      },
      ...buildObservationEvidenceItems(input.observations),
    ],
    benefits: [
      'Alternates a grain legume with a cereal crop across seasons, which supported higher subsequent maize yields in Samaru field trials (Yusuf et al., 2009).',
      'Diversifies household food and market output between grain legumes and cereals.',
    ],
    informationGaps: [
      ...collectStrategyGaps(altOneLegs),
      'Samaru trials took place in the Northern Guinea Savanna (mean annual rainfall ~1,011 mm); transfer to Tofa Sudan Savanna soils and rainfall is not yet locally measured.',
    ],
    localReviewRisks: [
      'Requires local review by the farmer or CDA extension officer before adoption: legume nitrogen balance varies widely by variety, inoculation, and whether crop residues are grazed or removed.',
      'Do not assume an automatic chemical fertilizer reduction in Tofa without a local soil check.',
    ],
    rank: null,
    rankingBasis: 'Pending comparison',
    evidenceStrength: deriveStrategyEvidenceStrength(altOneLegs),
    evidenceStrengthReason: deriveStrategyEvidenceReason(altOneLegs),
  };

  // 3. Alternative 2: Pearl millet / Sorghum & Cowpea sequence (ICRISAT Sahel + Doka farmer report)
  const icrisatRule = input.rotationRules.find((rule) => rule.id.includes('icrisat'));
  const altTwoCodes = pickDistinctSequence(
    orderedExistingCodes,
    ['pearl_millet', 'cowpea', 'sorghum'],
    cropsByCode,
  );
  const altTwoLegs = buildLegs(
    altTwoCodes,
    cropsByCode,
    assessmentsByCode,
    input.parcelId,
    input.parcelAreaHa,
  );
  const alternativeTwo: RotationStrategy = {
    kind: 'alternative',
    label: `Dryland cereal and cowpea sequence (${altTwoCodes.map((code) => cropsByCode.get(code)?.name ?? code).join(' -> ')})`,
    legs: altTwoLegs,
    rationale:
      icrisatRule?.statement ??
      'Rotates dryland cereals (pearl millet or sorghum) with cowpea across seasons for Sudan Savanna and Sahelian moisture conditions.',
    evidence: [
      {
        kind: 'documented_agronomic_evidence',
        statement:
          icrisatRule?.statement ??
          'Long-term pearl millet and cowpea sequential rotations evaluated over 25 years at ICRISAT Sadore improved system productivity when paired with residue management.',
        citation: icrisatRule?.sourceUrl ?? 'https://oar.icrisat.org/11988/',
        value: null,
        unit: null,
      },
      ...buildObservationEvidenceItems(input.observations),
    ],
    benefits: [
      'Pairs lower seasonal water-need dryland cereals (sorghum and pearl millet, FAO indicative 450 to 650 mm) with cowpea.',
      'Aligns with both Sahelian long-term rotation research (Bado et al., 2022) and seasonal rotation practices reported in Doka interviews.',
    ],
    informationGaps: [
      ...collectStrategyGaps(altTwoLegs),
      'Sequential rotation effects must be kept distinct from within-season strip cropping or relay intercropping.',
    ],
    localReviewRisks: [
      'Requires local review by farmers or agricultural experts: Striga/Alectra parasitic weed pressure, livestock grazing of crop residues, and local seed availability must be checked per parcel.',
    ],
    rank: null,
    rankingBasis: 'Pending comparison',
    evidenceStrength: deriveStrategyEvidenceStrength(altTwoLegs),
    evidenceStrengthReason: deriveStrategyEvidenceReason(altTwoLegs),
  };

  const sharedLimitations: Limitation[] = [
    {
      kind: 'needs_local_review',
      statement:
        'All rotation strategies require local review with the farmer and CDA agricultural extension officer before changing field management.',
    },
  ];

  return compareRotations({
    farmId: input.farmId,
    parcelId: input.parcelId,
    strategies: [existingStrategy, alternativeOne, alternativeTwo],
    goals: input.goals,
    limitations: sharedLimitations,
    rulesetVersion,
  });
}

function deriveExistingSequenceCodes(
  history: readonly FarmerCropHistoryEntry[],
  cropsByCode: ReadonlyMap<string, CatalogCropRecord>,
): readonly string[] {
  const validCodes = history.map((item) => item.cropCode).filter((code) => cropsByCode.has(code));

  if (validCodes.length >= 2) {
    return validCodes.slice(0, 3);
  }
  if (validCodes.length === 1) {
    const first = validCodes[0]!;
    const second = first === 'sorghum' ? 'soybean' : 'sorghum';
    return cropsByCode.has(second) ? [first, second] : [first];
  }

  const fallback = ['sorghum', 'soybean', 'cowpea'].filter((code) => cropsByCode.has(code));
  return fallback.length > 0 ? fallback : [...cropsByCode.keys()].slice(0, 2);
}

function pickDistinctSequence(
  existingCodes: readonly string[],
  preferredCodes: readonly string[],
  cropsByCode: ReadonlyMap<string, CatalogCropRecord>,
): readonly string[] {
  const available = preferredCodes.filter((code) => cropsByCode.has(code));
  if (available.join(',') !== existingCodes.join(',') && available.length >= 2) {
    return available;
  }
  const reversed = [...available].reverse();
  return reversed.length >= 2 ? reversed : [...cropsByCode.keys()].slice(0, 2);
}

function buildLegs(
  codes: readonly string[],
  cropsByCode: ReadonlyMap<string, CatalogCropRecord>,
  assessmentsByCode: ReadonlyMap<string, ReturnType<typeof evaluateCatalogCropForParcel>>,
  parcelId: string | null,
  parcelAreaHa: number | null,
): readonly RotationLeg[] {
  const legs: RotationLeg[] = [];
  codes.forEach((code, index) => {
    const crop = cropsByCode.get(code);
    const assessment = assessmentsByCode.get(code);
    if (!crop || !assessment) return;
    legs.push({
      sequence: index,
      season: 'rainy',
      cropId: crop.id,
      cropCode: crop.code,
      cropName: crop.name,
      parcelId,
      areaHa: parcelAreaHa,
      assessment,
    });
  });
  return legs;
}

function buildObservationEvidenceItems(
  observations: readonly ProvenancedValue[],
): readonly EvidenceItem[] {
  const items: EvidenceItem[] = [];
  const precip = observations.filter(
    (obs) => obs.variable === 'precipitation_mm' && obs.value !== null,
  );
  if (precip.length > 0) {
    const total = Number(precip.reduce((sum, obs) => sum + (obs.value ?? 0), 0).toFixed(1));
    items.push({
      kind: 'environmental_observation',
      statement: `Accumulated precipitation across ${precip.length} observed days in the window is ${total} mm (regional grid cell resolution: ${precip[0]!.spatialResolutionM / 1000} km).`,
      citation: precip[0]!.sourceId,
      value: total,
      unit: 'mm',
    });
  }
  return items;
}

function collectStrategyGaps(legs: readonly RotationLeg[]): readonly string[] {
  const statements = new Set<string>();
  for (const leg of legs) {
    for (const limitation of leg.assessment.limitations) {
      statements.add(limitation.statement);
    }
  }
  return [...statements];
}

function deriveStrategyEvidenceStrength(
  legs: readonly RotationLeg[],
): RotationStrategy['evidenceStrength'] {
  if (legs.length === 0) return 'weak';
  if (legs.some((leg) => leg.assessment.evidenceStrength === 'weak')) return 'weak';
  if (legs.some((leg) => leg.assessment.evidenceStrength === 'moderate')) {
    return 'moderate';
  }
  return 'strong';
}

function deriveStrategyEvidenceReason(legs: readonly RotationLeg[]): string {
  if (legs.length === 0) return 'No crop legs were assessed.';
  return legs[0]!.assessment.evidenceStrengthReason;
}
