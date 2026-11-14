import {
  RESOLUTION_DESCRIPTIONS,
  SPATIAL_RESOLUTION_METRES,
  type PlantingTrigger,
  type SpatialResolutionKey,
} from '@dalashift/shared/constants';
import { format, formatDistanceToNowStrict, parseISO } from 'date-fns';

/**
 * Format a spatial resolution in metres into the honest plain-language phrase
 * defined in @dalashift/shared/constants.
 */
export function formatSpatialResolutionPhrase(spatialResolutionM: number): string {
  const entries = Object.entries(SPATIAL_RESOLUTION_METRES) as [SpatialResolutionKey, number][];
  for (const [key, metres] of entries) {
    if (metres === spatialResolutionM) {
      return RESOLUTION_DESCRIPTIONS[key];
    }
  }
  if (spatialResolutionM <= 50) {
    return `measured over your farm at ${spatialResolutionM} m resolution`;
  }
  if (spatialResolutionM < 1000) {
    return `an estimate for the ${spatialResolutionM} m cell containing your farm`;
  }
  const km = Number((spatialResolutionM / 1000).toFixed(1));
  if (km >= 40) {
    return `a regional climate figure covering roughly ${Math.round(km)} km`;
  }
  return `an estimate for the ${km} km area around your farm`;
}

/**
 * Compact resolution label for badges (e.g. "9 km area", "250 m cell", "55 km regional").
 */
export function formatResolutionShortBadge(spatialResolutionM: number): string {
  if (spatialResolutionM <= 50) {
    return `${spatialResolutionM} m field pixel`;
  }
  if (spatialResolutionM < 1000) {
    return `${spatialResolutionM} m grid cell`;
  }
  const km = Number((spatialResolutionM / 1000).toFixed(1));
  if (km >= 40) {
    return `~${Math.round(km)} km regional cell`;
  }
  return `${km} km grid cell`;
}

/**
 * Human-readable source name from canonical sourceId.
 */
export function formatSourceName(sourceId: string): string {
  const map: Record<string, string> = {
    nasa_power: 'NASA POWER',
    'nasa-power-daily': 'NASA POWER',
    'nasa-power-climatology': 'NASA POWER Climatology',
    smap_l3_enhanced: 'NASA SMAP L3',
    gpm_imerg_v07: 'NASA GPM IMERG',
    chirps_v3: 'CHIRPS v3',
    soilgrids: 'ISRIC SoilGrids 2.0',
    modis_mod13q1_v061: 'NASA MODIS NDVI',
    modis_mod11a2_v061: 'NASA MODIS LST',
    landsat_c2_l2: 'NASA/USGS Landsat C2',
  };
  return map[sourceId] ?? sourceId.replace(/_/g, ' ').toUpperCase();
}

/**
 * Format an ISO observation timestamp into relative text if recent (within 7 days)
 * or absolute date ("12 Nov 2026") per design-system.md section 9.2.
 */
export function formatObservationDate(isoDate: string | null | undefined): string {
  if (!isoDate) {
    return 'Date unrecorded';
  }
  try {
    const parsed = parseISO(isoDate);
    const diffMs = Date.now() - parsed.getTime();
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
    if (diffMs >= 0 && diffMs <= sevenDaysMs) {
      return `${formatDistanceToNowStrict(parsed)} ago`;
    }
    return format(parsed, 'd MMM yyyy');
  } catch {
    return isoDate.slice(0, 10);
  }
}

/**
 * Format a numeric value with tabular precision, returning "n/a" when missing.
 */
export const formatResolutionHonesty = formatSpatialResolutionPhrase;

export function formatMetric(
  value: number | null | undefined,
  unit = '',
  decimals = 1,
): string {
  const formatted = formatMetricValue(value, decimals);
  if (formatted === 'n/a') return formatted;
  return unit ? `${formatted} ${unit}` : formatted;
}

export function formatCropWithHausa(
  cropCode: string,
  includeHausa = true,
): string {
  const entry = HAUSA_CROP_NAMES[cropCode];
  if (!entry) {
    return cropCode.replace(/_/g, ' ');
  }
  return includeHausa
    ? `${entry.localEnglish} (${entry.hausa})`
    : entry.localEnglish;
}

  value: number | null | undefined,
  decimals = 1,
): string {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return 'n/a';
  }
  if (Number.isInteger(value) && decimals === 0) {
    return value.toLocaleString('en-US');
  }
  return Number(value.toFixed(decimals)).toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  });
}

/**
 * Hausa field-layer terms for crops, triggers, and key concepts (Decision D-08 & D-14).
 * Operator chrome remains English while field terms surface local equivalents.
 */
export const HAUSA_CROP_NAMES: Readonly<
  Record<string, { readonly hausa: string; readonly localEnglish: string }>
> = {
  sorghum: { hausa: 'Dawa', localEnglish: 'Sorghum / Guinea corn' },
  pearl_millet: { hausa: 'Gero (Maiwa for late millet)', localEnglish: 'Pearl millet' },
  maize: { hausa: 'Masara', localEnglish: 'Maize' },
  cowpea: { hausa: 'Farin wake / Wake', localEnglish: 'Cowpea / White cowpea' },
  soybean: { hausa: 'Waken suya', localEnglish: 'Soybean' },
  groundnut: { hausa: 'Gyada', localEnglish: 'Groundnut' },
  tomato: { hausa: 'Tumatur', localEnglish: 'Tomato' },
  pepper: { hausa: 'Tattasai / Barkono', localEnglish: 'Pepper' },
};

export const PLANTING_TRIGGER_TITLES: Readonly<
  Record<
    PlantingTrigger,
    { readonly en: string; readonly ha: string; readonly exampleFarmer: string }
  >
> = {
  wait_for_confirmed_moisture: {
    en: 'Wait for confirmed soil moisture across several showers',
    ha: 'Jira har kasa ta rike danshi sosai kafin shuka',
    exampleFarmer: 'Bello Yusuf Maitama (Doka)',
  },
  plant_on_first_rains: {
    en: 'Plant immediately on the first sustained rains',
    ha: 'Shuka nan take da zarar ruwan sama na farko ya sauka',
    exampleFarmer: 'Amina Habibu (Doka)',
  },
  prepare_and_plant_quickly: {
    en: 'Prepare the land and sow quickly once early moisture establishes',
    ha: 'Gyara gona da shuka da wuri bayan ruwan farko ya jiqa kasa',
    exampleFarmer: 'Abubakar / Dan Hajiya (Doka)',
  },
};
