import {
  ENVIRONMENT_VARIABLES,
  PLANTING_TRIGGERS,
  PLANTING_TRIGGER_PROFILES,
  type PlantingTrigger,
} from '@dalashift/shared/constants';
import type {
  EvidenceItem,
  Limitation,
  PlantingTriggerAssessment,
  ProvenancedValue,
} from '@dalashift/shared/types';

import { DEFAULT_RULESET_VERSION } from './build-crop-inputs';

/**
 * Evaluate the planting trigger condition for a parcel (Decision D-10).
 *
 * The engine never recommends a calendar date. It evaluates soil moisture and
 * recent rainfall observations against the planting rules reported in the
 * anonymised field interviews, and respects the farmer's own stated rule
 * when ordering the recommendation.
 */
export function assessPlantingTrigger(input: {
  readonly parcelId: string | null;
  readonly farmerRule: PlantingTrigger | null;
  readonly observations: readonly ProvenancedValue[];
  readonly riskTolerance?: number | null;
  readonly rulesetVersion?: string;
}): PlantingTriggerAssessment {
  const rulesetVersion = input.rulesetVersion ?? DEFAULT_RULESET_VERSION;
  const evidence: EvidenceItem[] = [];
  const limitations: Limitation[] = [];

  const moistureObs = input.observations
    .filter(
      (obs) =>
        (obs.variable === ENVIRONMENT_VARIABLES.soilWetnessRootZone ||
          obs.variable === ENVIRONMENT_VARIABLES.soilMoistureSurface) &&
        obs.value !== null &&
        obs.qualityFlag !== 'missing',
    )
    .sort((a, b) => a.observedAt.localeCompare(b.observedAt));

  const recentPrecip = input.observations
    .filter(
      (obs) =>
        (obs.variable === ENVIRONMENT_VARIABLES.precipitation ||
          obs.variable === ENVIRONMENT_VARIABLES.precipitationSatellite) &&
        obs.value !== null &&
        obs.qualityFlag !== 'missing' &&
        obs.rawMetadata?.isForecast !== true,
    )
    .sort((a, b) => a.observedAt.localeCompare(b.observedAt));

  const recentWindowPrecip = recentPrecip.slice(-7);
  const recentRainMm = Number(
    recentWindowPrecip.reduce((sum, item) => sum + (item.value ?? 0), 0).toFixed(1),
  );
  const rainyDaysCount = recentWindowPrecip.filter((item) => (item.value ?? 0) >= 2).length;

  const recentMoistureWindow = moistureObs.slice(-5);
  const meanWetness =
    recentMoistureWindow.length > 0
      ? Number(
          (
            recentMoistureWindow.reduce((sum, item) => sum + (item.value ?? 0), 0) /
            recentMoistureWindow.length
          ).toFixed(3),
        )
      : null;

  if (recentWindowPrecip.length > 0) {
    const latestRain = recentWindowPrecip[recentWindowPrecip.length - 1]!;
    evidence.push({
      kind: 'environmental_observation',
      statement: `Recent ${recentWindowPrecip.length}-day precipitation total is ${recentRainMm} mm across ${rainyDaysCount} day(s) with at least 2 mm of rain (resolution: ${Math.round(latestRain.spatialResolutionM / 1000)} km).`,
      citation: latestRain.sourceId,
      value: recentRainMm,
      unit: 'mm',
    });
    limitations.push({
      kind: 'coarse_resolution',
      statement: `Rainfall observations come from a ${Math.round(latestRain.spatialResolutionM / 1000)} km grid cell and must be paired with direct visual inspection of rainfall on the parcel.`,
    });
  } else {
    limitations.push({
      kind: 'missing_data',
      statement: 'Recent daily precipitation observations are missing for this parcel.',
    });
  }

  if (meanWetness !== null && recentMoistureWindow.length > 0) {
    const latestMoisture = recentMoistureWindow[recentMoistureWindow.length - 1]!;
    evidence.push({
      kind: 'environmental_observation',
      statement: `Recent ${recentMoistureWindow.length}-day mean soil moisture/wetness indicator is ${meanWetness} ${latestMoisture.unit} (resolution: ${Math.round(latestMoisture.spatialResolutionM / 1000)} km).`,
      citation: latestMoisture.sourceId,
      value: meanWetness,
      unit: latestMoisture.unit,
    });
    limitations.push({
      kind: 'coarse_resolution',
      statement: `Soil moisture is estimated over a ${Math.round(latestMoisture.spatialResolutionM / 1000)} km cell (${latestMoisture.isModelled ? 'modelled' : 'observed'}) and describes neighbourhood wetness, not individual ridge moisture.`,
    });
  } else {
    limitations.push({
      kind: 'missing_data',
      statement:
        'Recent soil moisture observations are missing; check topsoil moisture directly in the field before sowing.',
    });
  }

  if (input.farmerRule) {
    evidence.push({
      kind: 'farmer_report',
      statement: `Farmer stated planting rule: ${PLANTING_TRIGGER_PROFILES[input.farmerRule].condition}`,
      citation: 'Farmer priority record',
      value: null,
      unit: null,
    });
  } else {
    limitations.push({
      kind: 'unknown_farmer_input',
      statement:
        'No farmer-stated planting trigger rule is recorded for this farm; showing the balanced moisture-confirmation trigger by default.',
    });
  }

  const recommendedTrigger = selectTrigger({
    farmerRule: input.farmerRule,
    riskTolerance: input.riskTolerance ?? null,
    meanWetness,
    rainyDaysCount,
  });

  const profile = PLANTING_TRIGGER_PROFILES[recommendedTrigger];
  const currentMoistureNote = describeCurrentConditionState({
    meanWetness,
    recentRainMm,
    rainyDaysCount,
  });

  return {
    parcelId: input.parcelId,
    farmerRule: input.farmerRule,
    recommendedTrigger,
    condition: `${profile.condition} Current field context: ${currentMoistureNote}`,
    riskProfile: profile.riskProfile,
    evidence,
    limitations,
    rulesetVersion,
  };
}

function selectTrigger(input: {
  readonly farmerRule: PlantingTrigger | null;
  readonly riskTolerance: number | null;
  readonly meanWetness: number | null;
  readonly rainyDaysCount: number;
}): PlantingTrigger {
  // Decision D-10: the farmer's stated rule selects and orders the trigger.
  if (input.farmerRule && PLANTING_TRIGGERS.includes(input.farmerRule)) {
    return input.farmerRule;
  }

  if (input.riskTolerance !== null) {
    if (input.riskTolerance <= 0.35) return 'wait_for_confirmed_moisture';
    if (input.riskTolerance >= 0.7) return 'plant_on_first_rains';
  }

  if (input.meanWetness !== null && input.meanWetness < 0.3 && input.rainyDaysCount <= 1) {
    return 'wait_for_confirmed_moisture';
  }

  return 'prepare_and_plant_quickly';
}

function describeCurrentConditionState(input: {
  readonly meanWetness: number | null;
  readonly recentRainMm: number;
  readonly rainyDaysCount: number;
}): string {
  if (input.meanWetness === null && input.recentRainMm === 0) {
    return 'No recent rainfall or soil wetness increase is recorded in the regional grid cell; verify moisture in the parcel before sowing.';
  }
  if (input.rainyDaysCount >= 2 && (input.meanWetness === null || input.meanWetness >= 0.35)) {
    return `Regional data shows ${input.recentRainMm} mm of rain across ${input.rainyDaysCount} days with sustained soil wetness; verify that your parcel's ridges hold moisture at planting depth.`;
  }
  if (input.recentRainMm > 0) {
    return `Early showers (${input.recentRainMm} mm over ${input.rainyDaysCount} day(s)) are recorded, but multi-day soil moisture retention is not yet established; planting now carries dry-spell establishment risk.`;
  }
  return 'Regional observations show dry conditions; wait for rain and check soil moisture on the parcel.';
}
