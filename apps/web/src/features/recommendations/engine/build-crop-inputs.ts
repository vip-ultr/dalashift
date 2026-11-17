import {
  ENVIRONMENT_VARIABLES,
  SPATIAL_RESOLUTION_METRES,
  UNITS,
  type EvidenceStrength,
} from '@dalashift/shared/constants';
import type { CropAssessment, Limitation, ProvenancedValue } from '@dalashift/shared/types';

import { describeSpatialScaleMismatch } from '../../../lib/geospatial';

import { assessCrop, type AssessmentObservation, type DimensionRule } from './assess-crop';

export const DEFAULT_RULESET_VERSION = '2026.11.14-qualitative';

export interface CatalogCropRecord {
  readonly id: string;
  readonly code: string;
  readonly name: string;
  readonly scientificName: string | null;
  readonly category: string;
  readonly growingPeriodDays: {
    readonly min: number | null;
    readonly max: number | null;
    readonly citation?: string;
  };
  readonly agronomicRequirements: {
    readonly rainfallRequirementMm?: {
      readonly min: number | null;
      readonly max: number | null;
      readonly citation?: string;
      readonly hardConstraint?: boolean;
    } | null;
    readonly indicativeCropWaterNeedMmPerSeason?: {
      readonly min: number | null;
      readonly max: number | null;
      readonly evidenceId?: string;
      readonly citation?: string;
      readonly useAsHardConstraint?: boolean;
    } | null;
    readonly temperatureC?: {
      readonly min: number | null;
      readonly max: number | null;
      readonly citation?: string;
      readonly hardConstraint?: boolean;
    } | null;
    readonly soilPh?: {
      readonly min: number | null;
      readonly max: number | null;
      readonly citation?: string;
      readonly hardConstraint?: boolean;
    } | null;
  };
  readonly rotationTraits?: {
    readonly nitrogenContribution?: 'fixes' | 'consumes' | 'neutral' | null;
  } | null;
  readonly sourceCitations: readonly {
    readonly claim: string;
    readonly citation: string;
    readonly sourceUrl?: string;
  }[];
}

/**
 * Convert a row from `public.crops` into a `CatalogCropRecord` suitable for
 * the qualitative crop assessment engine.
 */
export function mapDatabaseCropRowToCatalogRecord(row: Record<string, unknown>): CatalogCropRecord {
  const gp =
    typeof row.growing_period_days === 'object' && row.growing_period_days !== null
      ? (row.growing_period_days as Record<string, unknown>)
      : {};
  const agro =
    typeof row.agronomic_requirements === 'object' && row.agronomic_requirements !== null
      ? (row.agronomic_requirements as Record<string, unknown>)
      : {};
  const rain =
    typeof agro.rainfallRequirementMm === 'object' && agro.rainfallRequirementMm !== null
      ? (agro.rainfallRequirementMm as Record<string, unknown>)
      : typeof row.rainfall_mm === 'object' && row.rainfall_mm !== null
        ? (row.rainfall_mm as Record<string, unknown>)
        : null;
  const water =
    typeof agro.indicativeCropWaterNeedMmPerSeason === 'object' &&
    agro.indicativeCropWaterNeedMmPerSeason !== null
      ? (agro.indicativeCropWaterNeedMmPerSeason as Record<string, unknown>)
      : typeof row.water_demand === 'object' && row.water_demand !== null
        ? (row.water_demand as Record<string, unknown>)
        : null;
  const temp =
    typeof agro.temperatureC === 'object' && agro.temperatureC !== null
      ? (agro.temperatureC as Record<string, unknown>)
      : typeof row.temperature_c === 'object' && row.temperature_c !== null
        ? (row.temperature_c as Record<string, unknown>)
        : null;
  const soil =
    typeof row.soil === 'object' && row.soil !== null ? (row.soil as Record<string, unknown>) : {};
  const soilPh =
    typeof agro.soilPh === 'object' && agro.soilPh !== null
      ? (agro.soilPh as Record<string, unknown>)
      : typeof soil.ph === 'object' && soil.ph !== null
        ? (soil.ph as Record<string, unknown>)
        : null;
  const rot =
    typeof row.rotation_traits === 'object' && row.rotation_traits !== null
      ? (row.rotation_traits as Record<string, unknown>)
      : {};

  const numOrNull = (val: unknown): number | null =>
    typeof val === 'number' && Number.isFinite(val) ? val : null;

  const citations = Array.isArray(row.source_citations)
    ? row.source_citations.flatMap((item) => {
        if (typeof item !== 'object' || item === null) return [];
        const rec = item as Record<string, unknown>;
        return [
          {
            claim: String(rec.claim ?? ''),
            citation: String(rec.citation ?? ''),
            ...(typeof rec.sourceUrl === 'string' ? { sourceUrl: rec.sourceUrl } : {}),
          },
        ];
      })
    : [];

  return {
    id: String(row.id ?? ''),
    code: String(row.code ?? ''),
    name: String(row.name ?? ''),
    scientificName: typeof row.scientific_name === 'string' ? row.scientific_name : null,
    category: String(row.category ?? 'other'),
    growingPeriodDays: {
      min: numOrNull(gp.min),
      max: numOrNull(gp.max),
      ...(typeof gp.citation === 'string' ? { citation: gp.citation } : {}),
    },
    agronomicRequirements: {
      rainfallRequirementMm: rain
        ? {
            min: numOrNull(rain.min ?? rain.minMm),
            max: numOrNull(rain.max ?? rain.maxMm),
            ...(typeof rain.citation === 'string' ? { citation: rain.citation } : {}),
            hardConstraint: rain.hardConstraint === true,
          }
        : null,
      indicativeCropWaterNeedMmPerSeason: water
        ? {
            min: numOrNull(water.min ?? water.indicativeSeasonMinMm),
            max: numOrNull(water.max ?? water.indicativeSeasonMaxMm),
            ...(typeof water.evidenceId === 'string' ? { evidenceId: water.evidenceId } : {}),
            ...(typeof water.citation === 'string' ? { citation: water.citation } : {}),
            useAsHardConstraint: water.useAsHardConstraint === true,
          }
        : null,
      temperatureC: temp
        ? {
            min: numOrNull(temp.min ?? temp.optimalMin),
            max: numOrNull(temp.max ?? temp.optimalMax),
            ...(typeof temp.citation === 'string' ? { citation: temp.citation } : {}),
            hardConstraint: temp.hardConstraint === true,
          }
        : null,
      soilPh: soilPh
        ? {
            min: numOrNull(soilPh.min),
            max: numOrNull(soilPh.max),
            ...(typeof soilPh.citation === 'string' ? { citation: soilPh.citation } : {}),
            hardConstraint: soilPh.hardConstraint === true,
          }
        : null,
    },
    rotationTraits: {
      nitrogenContribution:
        rot.nitrogenContribution === 'fixes' ||
        rot.nitrogenContribution === 'consumes' ||
        rot.nitrogenContribution === 'neutral'
          ? rot.nitrogenContribution
          : null,
    },
    sourceCitations: citations,
  };
}

/**
 * Evaluate a catalog crop record against a parcel's environmental observations.
 *
 * Uses only cited thresholds present in the catalog record. Where Tofa-specific
 * rainfall, temperature, soil pH or maturity thresholds remain intentionally
 * unset in `data/reference/crop-requirements.json`, this builder records
 * explicit `unverified_requirement` limitations rather than inventing numbers.
 */
export function evaluateCatalogCropForParcel(input: {
  readonly crop: CatalogCropRecord;
  readonly observations: readonly ProvenancedValue[];
  readonly parcelAreaHa: number | null;
  readonly rulesetVersion?: string;
}): CropAssessment {
  const rulesetVersion = input.rulesetVersion ?? DEFAULT_RULESET_VERSION;
  const rules: DimensionRule[] = [];
  const mappedObservations: AssessmentObservation[] = [];
  const catalogLimitations: Limitation[] = [];

  const defaultCitation =
    input.crop.sourceCitations[0]?.citation ??
    'Brouwer & Heibloem (1986), FAO Irrigation Water Management Training Manual No. 3, Ch. 3';

  // 1. Water availability / seasonal crop water need (FAO indicative reference)
  const waterNeed = input.crop.agronomicRequirements.indicativeCropWaterNeedMmPerSeason;
  const rainfallReq = input.crop.agronomicRequirements.rainfallRequirementMm;

  if (rainfallReq && (rainfallReq.min !== null || rainfallReq.max !== null)) {
    rules.push({
      dimension: 'climate_rainfall',
      min: rainfallReq.min,
      max: rainfallReq.max,
      unit: UNITS.millimetre,
      citation: rainfallReq.citation ?? defaultCitation,
      hardConstraint: rainfallReq.hardConstraint ?? true,
    });
  } else {
    catalogLimitations.push({
      kind: 'unverified_requirement',
      statement: `Rain-fed seasonal rainfall thresholds for ${input.crop.name} in Tofa LGA are not yet verified by CDA extension review and are not applied as hard constraints.`,
    });
  }

  if (waterNeed && (waterNeed.min !== null || waterNeed.max !== null)) {
    rules.push({
      dimension: 'water_availability',
      min: waterNeed.min,
      max: waterNeed.max,
      unit: UNITS.millimetre,
      citation:
        waterNeed.citation ??
        `${defaultCitation} (${waterNeed.evidenceId ?? 'FAO indicative crop water need; non-binding context'})`,
      hardConstraint: waterNeed.useAsHardConstraint === true,
    });
  } else {
    catalogLimitations.push({
      kind: 'unverified_requirement',
      statement: `Indicative seasonal crop water need for ${input.crop.name} is not populated in the verified Tofa catalog.`,
    });
  }

  const precipObs = aggregatePrecipitationMm(input.observations, input.parcelAreaHa);
  if (precipObs) {
    if (rules.some((rule) => rule.dimension === 'climate_rainfall')) {
      mappedObservations.push({ ...precipObs, dimension: 'climate_rainfall' });
    }
    if (rules.some((rule) => rule.dimension === 'water_availability')) {
      mappedObservations.push({ ...precipObs, dimension: 'water_availability' });
    }
  }

  // 2. Temperature
  const tempReq = input.crop.agronomicRequirements.temperatureC;
  if (tempReq && (tempReq.min !== null || tempReq.max !== null)) {
    rules.push({
      dimension: 'climate_temperature',
      min: tempReq.min,
      max: tempReq.max,
      unit: UNITS.degreeCelsius,
      citation: tempReq.citation ?? defaultCitation,
      hardConstraint: tempReq.hardConstraint ?? true,
    });
    const tempObs = aggregateMeanTemperature(input.observations, input.parcelAreaHa);
    if (tempObs) {
      mappedObservations.push(tempObs);
    }
  } else {
    catalogLimitations.push({
      kind: 'unverified_requirement',
      statement: `Local temperature thresholds for ${input.crop.name} varieties grown in Tofa LGA are not yet verified.`,
    });
  }

  // 3. Soil pH
  const soilPhReq = input.crop.agronomicRequirements.soilPh;
  if (soilPhReq && (soilPhReq.min !== null || soilPhReq.max !== null)) {
    rules.push({
      dimension: 'soil_match',
      min: soilPhReq.min,
      max: soilPhReq.max,
      unit: UNITS.dimensionless,
      citation: soilPhReq.citation ?? defaultCitation,
      hardConstraint: soilPhReq.hardConstraint ?? false,
    });
    const phObs = extractSoilPhObservation(input.observations, input.parcelAreaHa);
    if (phObs) {
      mappedObservations.push(phObs);
    }
  } else {
    catalogLimitations.push({
      kind: 'unverified_requirement',
      statement: `Local soil pH and texture tolerance bounds for ${input.crop.name} in Tofa LGA require CDA confirmation.`,
    });
  }

  // 4. Season length / maturity days. The citation must describe maturity, not
  //    crop water need, so never fall back to the water-need citation here.
  if (input.crop.growingPeriodDays.min !== null || input.crop.growingPeriodDays.max !== null) {
    const maturityCitation = input.crop.growingPeriodDays.citation;
    if (maturityCitation) {
      rules.push({
        dimension: 'season_length',
        min: input.crop.growingPeriodDays.min,
        max: input.crop.growingPeriodDays.max,
        unit: 'days',
        citation: maturityCitation,
        hardConstraint: false,
      });
    } else {
      catalogLimitations.push({
        kind: 'unverified_requirement',
        statement: `Maturity bounds for ${input.crop.name} have no crop-specific citation and are not applied.`,
      });
    }
  } else {
    catalogLimitations.push({
      kind: 'unverified_requirement',
      statement: `Days to maturity for ${input.crop.name} depend on the local cultivar planted in Tofa LGA and remain unset pending CDA variety verification.`,
    });
  }

  const baseAssessment = assessCrop({
    cropId: input.crop.id,
    cropCode: input.crop.code,
    cropName: input.crop.name,
    rulesetVersion,
    rules,
    observations: mappedObservations,
  });

  const combinedLimitations = mergeLimitations(baseAssessment.limitations, catalogLimitations);

  return {
    ...baseAssessment,
    limitations: combinedLimitations,
  };
}

function aggregatePrecipitationMm(
  observations: readonly ProvenancedValue[],
  parcelAreaHa: number | null,
): AssessmentObservation | null {
  const isForecast = (obs: ProvenancedValue): boolean =>
    obs.rawMetadata?.isForecast === true ||
    (typeof obs.rawMetadata?.forecast === 'boolean' && obs.rawMetadata.forecast);

  // Only closed, observed days contribute. Forecasts are modelled future values
  // and must never be summed into a realised seasonal rainfall total.
  const valid = observations.filter(
    (obs) =>
      (obs.variable === ENVIRONMENT_VARIABLES.precipitation ||
        obs.variable === ENVIRONMENT_VARIABLES.precipitationSatellite) &&
      obs.value !== null &&
      obs.qualityFlag !== 'missing' &&
      !isForecast(obs),
  );
  if (valid.length === 0) return null;

  // Multiple providers can report the same day. Prefer the finest resolution
  // for each UTC day so overlapping sources are not double counted.
  const byDay = new Map<string, ProvenancedValue>();
  for (const obs of valid) {
    const day = obs.observedAt.slice(0, 10);
    const existing = byDay.get(day);
    if (!existing || obs.spatialResolutionM < existing.spatialResolutionM) {
      byDay.set(day, obs);
    }
  }
  const deduplicated = Array.from(byDay.values());

  const totalMm = Number(deduplicated.reduce((sum, item) => sum + (item.value ?? 0), 0).toFixed(1));
  const latest = deduplicated.reduce((prev, curr) =>
    curr.observedAt > prev.observedAt ? curr : prev,
  );
  const strength = deriveStrengthFromResolution(latest.spatialResolutionM);
  const limitation =
    describeSpatialScaleMismatch({
      sourceName: latest.sourceId,
      spatialResolutionM: latest.spatialResolutionM,
      parcelAreaHa,
    }) ?? undefined;

  return {
    dimension: 'water_availability',
    value: totalMm,
    unit: UNITS.millimetre,
    sourceId: latest.sourceId,
    observedAt: latest.observedAt,
    evidenceStrength: strength,
    quality: latest.qualityFlag ?? 'good',
    adequateForHardConstraint: latest.spatialResolutionM <= SPATIAL_RESOLUTION_METRES.chirps,
    ...(limitation ? { limitation } : {}),
  };
}

function aggregateMeanTemperature(
  observations: readonly ProvenancedValue[],
  parcelAreaHa: number | null,
): AssessmentObservation | null {
  const valid = observations.filter(
    (obs) =>
      obs.variable === ENVIRONMENT_VARIABLES.temperatureMean &&
      obs.value !== null &&
      obs.qualityFlag !== 'missing',
  );
  if (valid.length === 0) return null;

  const meanDegC = Number(
    (valid.reduce((sum, item) => sum + (item.value ?? 0), 0) / valid.length).toFixed(2),
  );
  const latest = valid.reduce((prev, curr) => (curr.observedAt > prev.observedAt ? curr : prev));
  const limitation =
    describeSpatialScaleMismatch({
      sourceName: latest.sourceId,
      spatialResolutionM: latest.spatialResolutionM,
      parcelAreaHa,
    }) ?? undefined;

  return {
    dimension: 'climate_temperature',
    value: meanDegC,
    unit: UNITS.degreeCelsius,
    sourceId: latest.sourceId,
    observedAt: latest.observedAt,
    evidenceStrength: deriveStrengthFromResolution(latest.spatialResolutionM),
    quality: latest.qualityFlag ?? 'good',
    adequateForHardConstraint: true,
    ...(limitation ? { limitation } : {}),
  };
}

function extractSoilPhObservation(
  observations: readonly ProvenancedValue[],
  parcelAreaHa: number | null,
): AssessmentObservation | null {
  const match = observations.find((obs) => obs.variable === ENVIRONMENT_VARIABLES.soilPh);
  if (!match) return null;

  const limitation =
    describeSpatialScaleMismatch({
      sourceName: match.sourceId,
      spatialResolutionM: match.spatialResolutionM,
      parcelAreaHa,
    }) ?? undefined;

  return {
    dimension: 'soil_match',
    value: match.value,
    unit: match.unit,
    sourceId: match.sourceId,
    observedAt: match.observedAt,
    evidenceStrength: deriveStrengthFromResolution(match.spatialResolutionM),
    quality: match.qualityFlag ?? (match.value === null ? 'missing' : 'good'),
    adequateForHardConstraint: false,
    ...(limitation ? { limitation } : {}),
  };
}

function deriveStrengthFromResolution(spatialResolutionM: number): EvidenceStrength {
  if (spatialResolutionM <= SPATIAL_RESOLUTION_METRES.modisVegetationIndex) {
    return 'strong';
  }
  if (spatialResolutionM <= SPATIAL_RESOLUTION_METRES.gpmImerg) {
    return 'moderate';
  }
  return 'weak';
}

function mergeLimitations(
  first: readonly Limitation[],
  second: readonly Limitation[],
): readonly Limitation[] {
  const seen = new Set<string>();
  const merged: Limitation[] = [];
  for (const item of [...first, ...second]) {
    const key = `${item.kind}:${item.statement}`;
    if (!seen.has(key)) {
      seen.add(key);
      merged.push(item);
    }
  }
  return merged;
}
