/**
 * Shared domain types for the DalaShift monorepo.
 *
 * The engine vocabulary follows ADR-0011 (decision D-05): there is no
 * composite suitability score, no weighting system, no confidence percentage
 * and no verdict threshold. A conclusion is a measured value compared against
 * a cited threshold, an ordinal position with a stated basis, and a
 * qualitative evidence strength with a reason.
 *
 * @packageDocumentation
 */

import type {
  AggregationMethod,
  AssessmentDimension,
  AssessmentStatus,
  ComparisonKind,
  CropCategory,
  CropStatus,
  EnvironmentVariable,
  EvidenceKind,
  EvidenceStrength,
  FarmingMethod,
  FarmerGoal,
  GeometryMethod,
  IntendedUse,
  IrrigationMethod,
  LimitationKind,
  NitrogenEffect,
  PlantingTrigger,
  QualityFlag,
  RankPosition,
  RuleSourceType,
  Season,
  TemporalResolution,
  Unit,
} from '../constants';

/**
 * A single environmental value with complete provenance.
 *
 * This is the contract every integration module returns. Nothing crosses the
 * integration boundary without it. See docs/api/data-retrieval-strategy.md.
 */
export interface ProvenancedValue {
  /** Canonical variable id, e.g. "precipitation_mm". */
  readonly variable: EnvironmentVariable | string;
  /** The value in the canonical unit. */
  readonly value: number | null;
  /** Canonical unit. */
  readonly unit: Unit | string;
  /** Foreign key to the `data_sources` registry row. */
  readonly sourceId: string;
  /** Spatial resolution of the underlying observation, in metres. */
  readonly spatialResolutionM: number;
  /** Temporal resolution of the underlying observation. */
  readonly temporalResolution: TemporalResolution | string;
  /** ISO 8601 UTC: when the observation was made. */
  readonly observedAt: string;
  /** ISO 8601 UTC: when we retrieved it. */
  readonly retrievedAt: string;
  /** True when the source modelled or interpolated the value rather than measuring it. */
  readonly isModelled: boolean;
  /** How the value was derived for the target geometry. */
  readonly aggregationMethod?: AggregationMethod;
  /** Assessment of the value's fitness for use. */
  readonly qualityFlag?: QualityFlag;
  /** Fraction of the target geometry with valid data (0 to 1). */
  readonly coverageFraction?: number;
  /** Source-specific identifiers retained for the audit trail. */
  readonly rawMetadata?: Record<string, unknown>;
}

/** A time series of provenanced values for one variable and geometry. */
export interface ProvenancedSeries {
  readonly variable: string;
  readonly unit: string;
  readonly sourceId: string;
  readonly spatialResolutionM: number;
  readonly temporalResolution: TemporalResolution | string;
  readonly aggregationMethod?: AggregationMethod;
  readonly values: readonly ProvenancedValue[];
}

/** The contract every external data source adapter implements. */
export interface DataSourceModule {
  /** Stable key matching the `data_sources.source_key` row. */
  readonly id: string;
  /** Variables this module can produce. */
  readonly capabilities: {
    readonly variables: readonly string[];
    readonly maxPointParameters: number;
  };
  /** Fetch a single value for a point geometry. */
  fetchValue(input: SourceQuery): Promise<ProvenancedValue[]>;
  /** Fetch a time series for a point or polygon geometry. */
  fetchSeries(input: SourceQuery): Promise<ProvenancedSeries>;
}

/** Input to a data source adapter. */
export interface SourceQuery {
  /** GeoJSON geometry in EPSG:4326 (lng, lat order). */
  readonly geometry: GeoJSONGeometry;
  /** Inclusive ISO date (YYYY-MM-DD) start of the requested window. */
  readonly startDate: string;
  /** Inclusive ISO date (YYYY-MM-DD) end of the requested window. */
  readonly endDate: string;
  /** Canonical variable ids to retrieve. */
  readonly variables: readonly string[];
}

/** Minimal GeoJSON geometry types used by the platform. */
export type GeoJSONGeometry =
  | { readonly type: 'Point'; readonly coordinates: readonly [number, number] }
  | {
      readonly type: 'Polygon';
      readonly coordinates: readonly (readonly (readonly [number, number])[])[];
    }
  | {
      readonly type: 'MultiPolygon';
      readonly coordinates: readonly (readonly (readonly (readonly [number, number])[])[])[];
    };

/**
 * A farm holding.
 *
 * A farm is a holding, not a single field. Decision D-09: a farm holds
 * several parcels and the parcel is the unit of analysis, because the
 * farmers in the dataset manage their land that way.
 */
export interface Farm {
  readonly id: string;
  readonly farmerId: string;
  readonly name: string;
  readonly farmingMethod: FarmingMethod;
  readonly irrigationMethod: IrrigationMethod;
  readonly soilNotes: string | null;
}

/**
 * A parcel: one geometry inside a farm, and the unit the engine analyses.
 */
export interface Parcel {
  readonly id: string;
  readonly farmId: string;
  readonly name: string;
  readonly geometry: GeoJSONGeometry;
  /** Computed by PostGIS. Never trusted from the client. */
  readonly areaHa: number;
  /** How far the recorded location may be off, in metres. */
  readonly locationUncertaintyM: number | null;
  /** How the geometry was captured. */
  readonly geometryMethod: GeometryMethod;
}

/** The lifecycle of a crop record on a parcel. */
export interface FarmCrop {
  readonly id: string;
  readonly farmId: string;
  readonly parcelId: string | null;
  readonly cropId: string;
  readonly status: CropStatus;
  readonly plantingDate: string | null;
  readonly expectedHarvestDate: string | null;
  readonly season: Season;
  readonly intendedUse: IntendedUse;
  readonly areaHa: number | null;
  readonly notes: string | null;
}

/** A farmer's stated objectives for a farm. These drive the comparison. */
export interface FarmerPriorities {
  readonly farmId: string;
  readonly goals: readonly FarmerGoal[];
  /** The farmer's tolerance for risk, 0 (risk-averse) to 1 (risk-seeking). */
  readonly riskTolerance: number | null;
  /** Whether the farmer accepts a recommendation to change crop. */
  readonly openToChange: boolean | null;
  /** The planting rule the farmer states, in their own words. */
  readonly plantingTrigger: PlantingTrigger | null;
  /** Free-text priorities the farmer typed. */
  readonly notes: string | null;
}

/**
 * A cited agronomic requirement for one crop.
 *
 * Every requirement carries the source it came from. A requirement without a
 * citation is a defect.
 */
export interface CropRequirement {
  /** What the requirement states, in plain words. */
  readonly claim: string;
  /** The measured or published value. */
  readonly value: number | string;
  readonly unit?: string;
  /** Where the requirement comes from. */
  readonly sourceType: RuleSourceType;
  readonly sourceUrl: string;
  /** ISO date the source was consulted. */
  readonly accessedOn: string;
  /** The citation rendered in the interface. */
  readonly citation: string;
}

/**
 * The agronomic requirements of one crop.
 */
export interface CropRequirements {
  readonly code: string;
  readonly name: string;
  /** Names the farmers in the interviews actually use. Decision D-14. */
  readonly aliases: readonly string[];
  readonly category: CropCategory;
  readonly applicableRegions: readonly string[];
  /** Days from sowing to harvest. A range, because varieties differ. */
  readonly growingPeriodDays: { readonly min: number; readonly max: number };
  readonly temperature: {
    readonly optimalMin: number;
    readonly optimalMax: number;
    readonly absoluteMin: number;
    readonly absoluteMax: number;
  };
  readonly rainfall: {
    readonly minMm: number;
    readonly maxMm: number;
    readonly seasonLengthDays: number;
  };
  readonly waterDemand: {
    readonly mmPerDay: number;
    readonly irrigationRequired: boolean;
  };
  readonly soil: {
    readonly ph: { readonly min: number; readonly max: number };
    readonly preferredTexture: readonly ('sand' | 'loam' | 'clay' | 'silt')[];
    readonly drainage: readonly ('poor' | 'moderate' | 'good' | 'excellent')[];
  };
  readonly rotationTraits: {
    readonly nitrogenContribution: NitrogenEffect;
    readonly residueLoad: 'low' | 'medium' | 'high';
    readonly diseaseBreak: boolean;
  };
  /**
   * Whether the crop needs chemical fertiliser, and roughly how many
   * applications. Recorded because a farmer in the interviews described
   * exactly this difference between maize and soybean.
   */
  readonly fertiliser: {
    readonly required: boolean;
    readonly applicationsPerSeason: number | null;
  };
  /** Every agronomic value in this record cites its source. */
  readonly sourceCitations: readonly CropRequirement[];
  /** The catalog version this record belongs to. */
  readonly catalogVersion: string;
}

/**
 * A rotation rule.
 *
 * Decision D-11: rules come from two labelled sources. A farmer's own stated
 * rule is a first-class input, and it is labelled so the interface never
 * presents it as published agronomy.
 */
export interface RotationRule {
  readonly id: string;
  /** What the rule says, in plain words. */
  readonly statement: string;
  readonly sourceType: RuleSourceType;
  /** Who said it, for a farmer report. */
  readonly attributedTo: string | null;
  readonly sourceUrl: string | null;
  readonly accessedOn: string;
  /** The crops the rule applies to. */
  readonly appliesTo: readonly string[];
  /** The crop the rule puts after the crop above. */
  readonly follows: readonly string[];
  /** Why the rule holds, in the words of its source. */
  readonly mechanism: string;
}

/**
 * One measured value compared against one cited threshold.
 *
 * This is the replacement for the old per-dimension score. There is no
 * number here that the farmer did not give us or that the literature did not
 * publish.
 */
export interface DimensionAssessment {
  readonly dimension: AssessmentDimension;
  /** The measured value, when there is one. */
  readonly value: number | null;
  readonly unit: string | null;
  /** The cited range the value was compared against. */
  readonly threshold: {
    readonly min: number | null;
    readonly max: number | null;
    readonly citation: string;
  };
  readonly status: AssessmentStatus;
  /** Why the status is what it is, in plain words. */
  readonly explanation: string;
  /** The source of the measured value. */
  readonly sourceId: string | null;
  readonly observedAt: string | null;
}

/**
 * One thing that is not known, not fresh, or not local enough.
 */
export interface Limitation {
  readonly kind: LimitationKind;
  /** The sentence shown to the farmer. */
  readonly statement: string;
}

/**
 * One piece of evidence supporting a claim.
 */
export interface EvidenceItem {
  readonly kind: EvidenceKind;
  readonly statement: string;
  /** The source or citation behind it. */
  readonly citation: string | null;
  /** The value it rests on, when it rests on one. */
  readonly value: number | null;
  readonly unit: string | null;
}

/**
 * The verdict of a crop assessment.
 *
 * There is no score. The verdict follows from the hard constraints, and the
 * dimension assessments show the working.
 */
export type RecommendationVerdict =
  'suitable' | 'conditional' | 'not_suitable' | 'insufficient_information';

/**
 * A crop assessed against one parcel's conditions.
 */
export interface CropAssessment {
  readonly cropId: string;
  readonly cropCode: string;
  readonly cropName: string;
  readonly verdict: RecommendationVerdict;
  /** Every dimension, reported on its own terms. */
  readonly dimensions: readonly DimensionAssessment[];
  /** Human-readable reasoning that cites the inputs it used. */
  readonly rationale: string;
  /** Explicit statement of what is unknown, coarse, stale or contested. */
  readonly limitations: readonly Limitation[];
  /**
   * How strong the evidence is. Always accompanied by the reason, because
   * "weak" alone is not an explanation.
   */
  readonly evidenceStrength: EvidenceStrength;
  readonly evidenceStrengthReason: string;
  /** Version of the ruleset that produced this assessment. */
  readonly rulesetVersion: string;
}

/**
 * One crop in one season of a rotation strategy.
 */
export interface RotationLeg {
  readonly sequence: number;
  readonly season: Season;
  readonly cropId: string;
  readonly cropCode: string;
  readonly cropName: string;
  readonly parcelId: string | null;
  readonly areaHa: number | null;
  readonly assessment: CropAssessment;
}

/**
 * The kind of strategy in a comparison.
 */
export const STRATEGY_KINDS = ['existing', 'alternative'] as const;

export type StrategyKind = (typeof STRATEGY_KINDS)[number];

/**
 * A rotation strategy, presented against its alternatives.
 *
 * The four text fields map one to one onto the challenge brief's wording,
 * which is deliberate: it makes the submission visibly compliant and it
 * forces the content to be honest.
 */
export interface RotationStrategy {
  readonly kind: StrategyKind;
  readonly label: string;
  readonly legs: readonly RotationLeg[];
  /** Why it was suggested. */
  readonly rationale: string;
  /** The evidence supporting it. */
  readonly evidence: readonly EvidenceItem[];
  /** What benefits it may offer. */
  readonly benefits: readonly string[];
  /** Where information gaps exist. */
  readonly informationGaps: readonly string[];
  /** Risks that need local review by farmers or agricultural experts. */
  readonly localReviewRisks: readonly string[];
  /** The ordinal position, when the evidence separates the strategies. */
  readonly rank: RankPosition | null;
  /** What the ordering rests on. */
  readonly rankingBasis: string;
  readonly evidenceStrength: EvidenceStrength;
  readonly evidenceStrengthReason: string;
}

/**
 * The whole comparison, for one parcel.
 */
export interface ComparisonResult {
  readonly kind: ComparisonKind;
  readonly farmId: string;
  readonly parcelId: string | null;
  readonly strategies: readonly RotationStrategy[];
  /** The ordering the strategies were given, with its basis. */
  readonly rankingBasis: string;
  /** The farmer's stated goals, so the interface can show what drove it. */
  readonly goals: readonly FarmerGoal[];
  readonly limitations: readonly Limitation[];
  readonly rulesetVersion: string;
}

/**
 * The assessment of whether to plant now.
 *
 * The engine recommends a condition, never a date. The farmer's own stated
 * rule decides which trigger is put first.
 */
export interface PlantingTriggerAssessment {
  readonly parcelId: string | null;
  /** The trigger the farmer stated, when they stated one. */
  readonly farmerRule: PlantingTrigger | null;
  /** The trigger the engine puts first, given the conditions. */
  readonly recommendedTrigger: PlantingTrigger;
  /** The condition itself, in plain words. */
  readonly condition: string;
  /** The trade-off the farmer is making, stated plainly. */
  readonly riskProfile: string;
  /** What the evidence says about the soil and the season right now. */
  readonly evidence: readonly EvidenceItem[];
  readonly limitations: readonly Limitation[];
  readonly rulesetVersion: string;
}

/**
 * A seasonal risk outlook.
 *
 * Decision D-07: built from the climate record and the season so far, framed
 * as a risk indicator and never as a forecast or a prediction.
 */
export interface SeasonalOutlook {
  readonly parcelId: string | null;
  /** The season's rainfall so far, against the long-term record. */
  readonly rainfallToDate: {
    readonly valueMm: number;
    readonly normalMm: number;
    readonly unit: string;
    readonly sourceId: string;
  };
  /** Whether the season has started, and how late it is against the record. */
  readonly onset: {
    readonly status: 'not_started' | 'started' | 'established';
    readonly daysAfterNormal: number | null;
    readonly sourceId: string;
  };
  /** The risk the outlook indicates, in plain words. */
  readonly riskStatements: readonly string[];
  /** The outlook is never a forecast. This says so. */
  readonly framingNote: string;
  readonly limitations: readonly Limitation[];
  readonly rulesetVersion: string;
}
