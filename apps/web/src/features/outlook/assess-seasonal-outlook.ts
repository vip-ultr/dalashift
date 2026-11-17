import { ENVIRONMENT_VARIABLES, UNITS } from '@dalashift/shared/constants';
import type { Limitation, ProvenancedValue, SeasonalOutlook } from '@dalashift/shared/types';

import { DEFAULT_RULESET_VERSION } from '../recommendations/engine/build-crop-inputs';

const MANDATORY_FRAMING_NOTE =
  'This seasonal risk outlook is derived from the historical climate record and season-to-date observations for the regional grid cell. It is a risk indicator, never a weather forecast or a prediction of future rain.';

type Language = 'en' | 'ha';

/** Locale-aware number formatting so Hausa mode uses ha-NG (brief section 9.1). */
function formatNumber(value: number, language: Language): string {
  return value.toLocaleString(language === 'ha' ? 'ha-NG' : 'en-US');
}

/**
 * Compute the seasonal risk outlook for a parcel from season-to-date daily
 * precipitation and multi-year climatology (Decision D-07).
 *
 * Explicitly framed as a seasonal risk indicator and never as a weather
 * forecast.
 */
export function assessSeasonalOutlook(
  input: {
    readonly parcelId: string | null;
    readonly dailyObservations: readonly ProvenancedValue[];
    readonly climatologyObservations: readonly ProvenancedValue[];
    readonly rulesetVersion?: string;
  },
  language: Language = 'en',
): SeasonalOutlook {
  const rulesetVersion = input.rulesetVersion ?? DEFAULT_RULESET_VERSION;
  const limitations: Limitation[] = [];

  const dailyPrecip = input.dailyObservations
    .filter(
      (obs) =>
        (obs.variable === ENVIRONMENT_VARIABLES.precipitation ||
          obs.variable === ENVIRONMENT_VARIABLES.precipitationSatellite) &&
        obs.value !== null &&
        obs.qualityFlag !== 'missing',
    )
    .sort((a, b) => a.observedAt.localeCompare(b.observedAt));

  const totalToDateMm = Number(
    dailyPrecip.reduce((sum, item) => sum + (item.value ?? 0), 0).toFixed(1),
  );
  const sourceId =
    dailyPrecip[0]?.sourceId ?? input.climatologyObservations[0]?.sourceId ?? 'nasa_power';

  const observedMonths = new Set<number>();
  for (const obs of dailyPrecip) {
    const month = Number(obs.observedAt.slice(5, 7));
    if (Number.isFinite(month) && month >= 1 && month <= 12) {
      observedMonths.add(month);
    }
  }

  const normalMm = computeClimatologyNormalMm(
    input.climatologyObservations,
    observedMonths,
    dailyPrecip.length,
  );

  const onset = evaluateRainfallOnset(dailyPrecip);
  const riskStatements: string[] = [];

  if (dailyPrecip.length === 0) {
    limitations.push({
      kind: 'missing_data',
      statement:
        'No season-to-date daily precipitation observations were available for this parcel.',
    });
    riskStatements.push(
      'Season-to-date rainfall cannot be compared against the long-term record until daily observations are loaded.',
    );
  } else {
    const resolutionKm = Math.round(dailyPrecip[0]!.spatialResolutionM / 1000);
    limitations.push({
      kind: 'coarse_resolution',
      statement: `Rainfall and climatology figures come from a ${formatNumber(resolutionKm, language)} km regional grid cell and describe regional climate context rather than a rain gauge on the parcel.`,
    });

    if (normalMm > 0) {
      const deltaMm = Number((totalToDateMm - normalMm).toFixed(1));
      if (totalToDateMm < normalMm * 0.8) {
        riskStatements.push(
          `Season-to-date rainfall (${formatNumber(totalToDateMm, language)} mm) is below the long-term regional normal (${formatNumber(normalMm, language)} mm by ${formatNumber(Math.abs(deltaMm), language)} mm), indicating elevated dry-spell and short-season risk for long-duration varieties.`,
        );
      } else if (totalToDateMm > normalMm * 1.2) {
        riskStatements.push(
          `Season-to-date rainfall (${formatNumber(totalToDateMm, language)} mm) is above the long-term regional normal (${formatNumber(normalMm, language)} mm), indicating adequate regional moisture accumulation so far.`,
        );
      } else {
        riskStatements.push(
          `Season-to-date rainfall (${formatNumber(totalToDateMm, language)} mm) is tracking near the long-term regional normal (${formatNumber(normalMm, language)} mm).`,
        );
      }
    } else {
      limitations.push({
        kind: 'missing_data',
        statement:
          'Long-term climatology baseline was not available for the observed months; showing season-to-date accumulation only.',
      });
      riskStatements.push(
        `Recorded season-to-date precipitation is ${formatNumber(totalToDateMm, language)} mm across ${formatNumber(dailyPrecip.length, language)} observed days.`,
      );
    }

    if (onset.status === 'not_started') {
      riskStatements.push(
        'Sustained rainy-season onset has not yet been established in the observed window; early sowing carries a risk of post-rain dry spells.',
      );
    } else if (onset.status === 'started') {
      riskStatements.push(
        'Initial rains have started, but follow-up showers should be monitored closely before committing long-duration crops.',
      );
    } else {
      riskStatements.push('Sustained rainfall onset is established in the regional record.');
    }
  }

  return {
    parcelId: input.parcelId,
    rainfallToDate: {
      valueMm: totalToDateMm,
      normalMm,
      unit: UNITS.millimetre,
      sourceId,
    },
    onset: {
      status: onset.status,
      daysAfterNormal: onset.daysAfterNormal,
      sourceId,
    },
    riskStatements,
    framingNote: MANDATORY_FRAMING_NOTE,
    limitations,
    rulesetVersion,
  };
}

function computeClimatologyNormalMm(
  climatology: readonly ProvenancedValue[],
  observedMonths: ReadonlySet<number>,
  observedDaysCount: number,
): number {
  const precipClimatology = climatology.filter(
    (obs) =>
      obs.variable === ENVIRONMENT_VARIABLES.precipitation &&
      obs.value !== null &&
      obs.qualityFlag !== 'missing',
  );
  if (precipClimatology.length === 0) return 0;

  if (observedMonths.size > 0) {
    let totalNormal = 0;
    for (const obs of precipClimatology) {
      const month = Number(obs.observedAt.slice(5, 7));
      const daysInMonth =
        typeof obs.rawMetadata?.daysInMonth === 'number' ? obs.rawMetadata.daysInMonth : 30;
      if (observedMonths.has(month)) {
        // NASA POWER climatology PRECTOTCORR is in mm/day for that month.
        totalNormal += (obs.value ?? 0) * daysInMonth;
      }
    }
    if (totalNormal > 0) {
      return Number(totalNormal.toFixed(1));
    }
  }

  const meanDailyRate =
    precipClimatology.reduce((sum, item) => sum + (item.value ?? 0), 0) / precipClimatology.length;
  return Number((meanDailyRate * Math.max(observedDaysCount, 30)).toFixed(1));
}

function evaluateRainfallOnset(dailyPrecip: readonly ProvenancedValue[]): {
  readonly status: 'not_started' | 'started' | 'established';
  readonly daysAfterNormal: number | null;
} {
  if (dailyPrecip.length === 0) {
    return { status: 'not_started', daysAfterNormal: null };
  }

  // Check for a 3-day window with >= 20 mm total rain, and whether dry spells (>10 days <2 mm) immediately followed.
  for (let i = 0; i < dailyPrecip.length; i += 1) {
    const threeDaySlice = dailyPrecip.slice(i, i + 3);
    const threeDaySum = threeDaySlice.reduce((sum, item) => sum + (item.value ?? 0), 0);

    if (threeDaySum >= 20) {
      const followUpSlice = dailyPrecip.slice(i + 3, i + 14);
      const followUpRainDays = followUpSlice.filter((item) => (item.value ?? 0) >= 2).length;
      if (followUpSlice.length >= 7 && followUpRainDays >= 2) {
        return { status: 'established', daysAfterNormal: null };
      }
      return { status: 'started', daysAfterNormal: null };
    }
  }

  const anyRain = dailyPrecip.some((item) => (item.value ?? 0) >= 5);
  return {
    status: anyRain ? 'started' : 'not_started',
    daysAfterNormal: null,
  };
}
