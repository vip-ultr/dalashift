/**
 * Shared domain types for the DalaShift monorepo.
 *
 * Phase 1: these describe the boundaries between modules. Entity types are
 * derived from the canonical schema in docs/database/data-model.md.
 *
 * @packageDocumentation
 */

import type {
  AggregationMethod,
  CropStatus,
  EnvironmentVariable,
  FarmingMethod,
  IntendedUse,
  IrrigationMethod,
  QualityFlag,
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
  readonly value: number;
  /** Canonical unit. */
  readonly unit: Unit | string;
  /** Foreign key to the `data_sources` registry row. */
  readonly sourceId: string;
  /** Spatial resolution of the underlying observation, in metres. */
  readonly spatialResolutionM: number;
  /** Temporal resolution of the underlying observation. */
  readonly temporalResolution: TemporalResolution | string;
  /** ISO 8601 UTC — when the observation was made. */
  readonly observedAt: string;
  /** ISO 8601 UTC — when we retrieved it. */
  readonly retrievedAt: string;
  /** True when the source modelled or interpolated the value rather than measuring it. */
  readonly isModelled: boolean;
  /** How the value was derived for the target geometry. */
  readonly aggregationMethod?: AggregationMethod;
  /** Assessment of the value's fitness for use. */
  readonly qualityFlag?: QualityFlag;
  /** Fraction of the target geometry with valid data (0–1). */
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

/** The two recommendation scenarios. These are distinct product paths. */
export type FarmerMode = 'existing' | 'prospective';

/** The lifecycle of a crop record on a farm. */
export interface FarmCrop {
  readonly id: string;
  readonly farmId: string;
  readonly plotId: string | null;
  readonly cropId: string;
  readonly status: CropStatus;
  readonly plantingDate: string | null;
  readonly expectedHarvestDate: string | null;
  readonly season: Season;
  readonly intendedUse: IntendedUse;
  readonly areaHa: number | null;
  readonly notes: string | null;
}

/** A farm, with its authoritative area computed by PostGIS. */
export interface Farm {
  readonly id: string;
  readonly farmerId: string;
  readonly name: string;
  readonly centroid: GeoJSONGeometry;
  readonly boundary: GeoJSONGeometry;
  /** Computed by PostGIS `ST_Area(boundary::geography)`. Never trusted from the client. */
  readonly areaHa: number;
  readonly farmingMethod: FarmingMethod;
  readonly irrigationMethod: IrrigationMethod;
}

/** A farmer's stated objectives for a farm. Drives rotation prioritisation. */
export interface FarmerPriorities {
  readonly farmId: string;
  /** e.g. "improve soil fertility", "reduce water use", "increase income". */
  readonly goals: readonly string[];
  /** The farmer's tolerance for risk, 0 (risk-averse) to 1 (risk-seeking). */
  readonly riskTolerance: number | null;
  /** Whether the farmer accepts a recommendation to change crop. */
  readonly openToChange: boolean | null;
}

/** The verdict of a crop assessment. */
export type RecommendationVerdict =
  'suitable' | 'conditional' | 'not_suitable' | 'insufficient_information';

/** A single recommendation, produced by the deterministic rules engine. */
export interface Recommendation {
  readonly id: string;
  readonly analysisId: string;
  readonly farmId: string;
  readonly cropId: string | null;
  readonly verdict: RecommendationVerdict;
  /** Weighted total, 0–1. */
  readonly score: number;
  /** Per-dimension scores, 0–1. */
  readonly subscores: Readonly<Record<string, number>>;
  /** Human-readable reasoning that cites the inputs. */
  readonly rationale: string;
  /** Explicit statement of what is unknown or untrustworthy. */
  readonly limitations: readonly string[];
  /** How much weight this deserves, given data completeness and resolution. */
  readonly confidence: number;
  /** Version of the ruleset that produced this recommendation. */
  readonly rulesetVersion: string;
}
