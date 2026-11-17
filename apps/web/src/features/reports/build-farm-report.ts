import type {
  ComparisonResult,
  Farm,
  FarmCrop,
  FarmerPriorities,
  Parcel,
  PlantingTriggerAssessment,
  ProvenancedValue,
  SeasonalOutlook,
} from '@dalashift/shared/types';

export type ReportKind = 'farm_summary' | 'seasonal' | 'rotation_plan';

/**
 * The parcel fields a printable report needs. Geometry is deliberately absent:
 * coordinates are redacted in shareable reports, so no geometry (real or
 * invented) is required to produce one.
 */
export type ReportParcelInput = Pick<
  Parcel,
  'id' | 'name' | 'areaHa' | 'geometryMethod' | 'locationUncertaintyM'
>;

export interface SourceAttributionRecord {
  readonly sourceId: string;
  readonly name: string;
  readonly licence: string;
  readonly attribution: string;
  readonly spatialResolutionM: number;
  readonly isModelled: boolean;
}

export interface FarmReportPayload {
  readonly kind: ReportKind;
  readonly generatedAt: string;
  readonly periodStart: string | null;
  readonly periodEnd: string | null;
  readonly farm: {
    readonly id: string;
    readonly name: string;
    readonly farmingMethod: Farm['farmingMethod'];
    readonly irrigationMethod: Farm['irrigationMethod'];
    readonly soilNotes: string | null;
    readonly totalAreaHa: number;
  };
  readonly parcels: readonly {
    readonly id: string;
    readonly name: string;
    readonly areaHa: number;
    readonly geometryMethod: Parcel['geometryMethod'];
    readonly locationUncertaintyM: number | null;
    /** Coordinates are redacted by default in shareable reports per ADR-0011 D-12. */
    readonly coordinatesIncluded: false;
  }[];
  readonly crops: readonly FarmCrop[];
  readonly priorities: FarmerPriorities | null;
  readonly comparison: ComparisonResult | null;
  readonly plantingTrigger: PlantingTriggerAssessment | null;
  readonly seasonalOutlook: SeasonalOutlook | null;
  readonly attributions: readonly SourceAttributionRecord[];
  readonly disclaimer: string;
}

const KNOWN_SOURCE_ATTRIBUTIONS: Readonly<Record<string, SourceAttributionRecord>> = {
  nasa_power: {
    sourceId: 'nasa_power',
    name: 'NASA POWER Agroclimatology',
    licence: 'NASA POWER terms; courtesy attribution required',
    attribution:
      "The data was obtained from NASA Langley Research Center's POWER project, funded through the NASA Earth Science Division.",
    spatialResolutionM: 55_000,
    isModelled: true,
  },
  soilgrids: {
    sourceId: 'soilgrids',
    name: 'ISRIC SoilGrids 2.0',
    licence: 'CC BY 4.0',
    attribution:
      'SoilGrids 2.0, ISRIC World Soil Information, CC BY 4.0. Changes and access date must be stated.',
    spatialResolutionM: 250,
    isModelled: true,
  },
  smap_l3_enhanced: {
    sourceId: 'smap_l3_enhanced',
    name: 'NASA SMAP Enhanced L3 Daily 9 km Soil Moisture (SPL3SMP_E v006)',
    licence: 'Public domain (NASA ESDIS open data policy)',
    attribution:
      "O'Neill, P. E., et al. SMAP Enhanced L3 Radiometer Global and Polar Grid Daily 9 km EASE-Grid Soil Moisture, Version 6. NASA NSIDC DAAC. https://doi.org/10.5067/M20OXIZHY3RJ",
    spatialResolutionM: 9000,
    isModelled: false,
  },
  gpm_imerg_v07: {
    sourceId: 'gpm_imerg_v07',
    name: 'NASA GPM IMERG Precipitation V07',
    licence: 'Public domain (NASA ESDIS open data policy)',
    attribution:
      'Huffman, G. J., et al. GPM IMERG V07 precipitation data provided by NASA GES DISC. https://doi.org/10.5067/GPM/IMERG/3B-HH/07',
    spatialResolutionM: 11_132,
    isModelled: false,
  },
  modis_mod13q1_v061: {
    sourceId: 'modis_mod13q1_v061',
    name: 'NASA MODIS Terra Vegetation Indices 16-Day L3 Global 250 m (MOD13Q1 v061)',
    licence: 'Public domain (LP DAAC open data policy)',
    attribution:
      'Didan, K. MODIS/Terra Vegetation Indices 16-Day L3 Global 250m SIN Grid V061. NASA EOSDIS LP DAAC.',
    spatialResolutionM: 250,
    isModelled: false,
  },
  landsat_c2_l2: {
    sourceId: 'landsat_c2_l2',
    name: 'NASA/USGS Landsat Collection 2 Level-2 Surface Reflectance',
    licence: 'Public domain (U.S. Government Works)',
    attribution:
      'Landsat Collection 2 Level-2 surface reflectance product courtesy of the U.S. Geological Survey and NASA.',
    spatialResolutionM: 30,
    isModelled: false,
  },
};

/**
 * Assemble a complete, printable farm report payload with mandatory source
 * attributions and redacted parcel coordinates (FR-6 & ADR-0011 D-12).
 */
export function buildFarmReportPayload(input: {
  readonly kind: ReportKind;
  readonly periodStart: string | null;
  readonly periodEnd: string | null;
  readonly farm: Farm;
  readonly parcels: readonly ReportParcelInput[];
  readonly crops: readonly FarmCrop[];
  readonly priorities: FarmerPriorities | null;
  readonly observations: readonly ProvenancedValue[];
  readonly comparison: ComparisonResult | null;
  readonly plantingTrigger: PlantingTriggerAssessment | null;
  readonly seasonalOutlook: SeasonalOutlook | null;
  readonly generatedAt?: string;
}): FarmReportPayload {
  const generatedAt = input.generatedAt ?? new Date().toISOString();
  const totalAreaHa = Number(
    input.parcels.reduce((sum, parcel) => sum + parcel.areaHa, 0).toFixed(3),
  );

  // Only sources behind observations we actually consumed may be attributed.
  // A seasonal outlook can carry a placeholder source id when no observation
  // was used, so it is never added here on its own. When no observation was
  // used the report carries no source entries rather than claiming a source
  // it did not consume.
  const usedSourceIds = new Set<string>();
  for (const obs of input.observations) {
    usedSourceIds.add(obs.sourceId);
  }

  const attributions: SourceAttributionRecord[] = [];
  for (const sourceId of usedSourceIds) {
    const known = KNOWN_SOURCE_ATTRIBUTIONS[sourceId];
    if (known) {
      attributions.push(known);
    } else {
      attributions.push({
        sourceId,
        name: sourceId,
        licence: 'Open environmental data licence; see docs/api/data-sources.md',
        attribution: `Environmental observations sourced from ${sourceId}.`,
        spatialResolutionM: 55_000,
        isModelled: true,
      });
    }
  }

  return {
    kind: input.kind,
    generatedAt,
    periodStart: input.periodStart,
    periodEnd: input.periodEnd,
    farm: {
      id: input.farm.id,
      name: input.farm.name,
      farmingMethod: input.farm.farmingMethod,
      irrigationMethod: input.farm.irrigationMethod,
      soilNotes: input.farm.soilNotes,
      totalAreaHa,
    },
    parcels: input.parcels.map((parcel) => ({
      id: parcel.id,
      name: parcel.name,
      areaHa: parcel.areaHa,
      geometryMethod: parcel.geometryMethod,
      locationUncertaintyM: parcel.locationUncertaintyM,
      coordinatesIncluded: false,
    })),
    crops: input.crops,
    priorities: input.priorities,
    comparison: input.comparison,
    plantingTrigger: input.plantingTrigger,
    seasonalOutlook: input.seasonalOutlook,
    attributions,
    disclaimer:
      'DalaShift is not affiliated with or endorsed by NASA. NASA provides Earth observation data, not crop recommendations. All rotation and suitability comparisons require local review by the farmer and an agricultural extension officer (malamin gona).',
  };
}
