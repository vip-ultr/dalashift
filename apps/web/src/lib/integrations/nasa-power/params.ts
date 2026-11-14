import {
  ENVIRONMENT_VARIABLES,
  SPATIAL_RESOLUTION_METRES,
  UNITS,
} from '@dalashift/shared/constants';

export const POWER_DAILY_PARAMETERS = {
  [ENVIRONMENT_VARIABLES.precipitation]: {
    parameter: 'PRECTOTCORR',
    unit: UNITS.millimetre,
  },
  [ENVIRONMENT_VARIABLES.temperatureMean]: {
    parameter: 'T2M',
    unit: UNITS.degreeCelsius,
  },
  [ENVIRONMENT_VARIABLES.temperatureMax]: {
    parameter: 'T2M_MAX',
    unit: UNITS.degreeCelsius,
  },
  [ENVIRONMENT_VARIABLES.temperatureMin]: {
    parameter: 'T2M_MIN',
    unit: UNITS.degreeCelsius,
  },
  [ENVIRONMENT_VARIABLES.soilWetnessRootZone]: {
    parameter: 'GWETROOT',
    unit: UNITS.dimensionless,
  },
} as const;

export const NASA_POWER_DAILY_SOURCE = {
  id: 'nasa_power',
  endpoint: 'https://power.larc.nasa.gov/api/temporal/daily/point',
  spatialResolutionM: SPATIAL_RESOLUTION_METRES.powerLatitude,
  temporalResolution: 'daily',
  attribution:
    "The data was obtained from NASA Langley Research Center's POWER project, funded through the NASA Earth Science Division.",
} as const;
