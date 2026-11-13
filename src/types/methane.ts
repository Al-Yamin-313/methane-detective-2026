export type SourceCategory = 'gas' | 'agriculture' | 'urban' | 'global';

export type EarthSphere = 'Atmosphere' | 'Hydrosphere' | 'Biosphere' | 'Geosphere' | 'atmosphere' | 'hydrosphere' | 'biosphere' | 'geosphere';

export type EarthVariableType = 
  | 'ch4_plume'
  | 'ch4_column'
  | 'precipitation'
  | 'surface_water_elevation'
  | 'vegetation_ndvi'
  | 'custom_import'
  | 'methane_enhancement'
  | 'methane_column'
  | 'precipitation_rate'
  | 'river_water_elevation'
  | 'vegetation_index'
  | 'soil_moisture'
  | 'custom';

export interface SourceObservation {
  date: string;              // ISO format or 'YYYY-MM'
  displayDate: string;       // e.g. 'JAN 2024'
  value: number;             // Column enhancement in ppm·m, column mixing ratio in ppb, mm/month, or m
  unit?: string;             // 'ppm·m' | 'ppb' | 'kg/hr' | 'mm/month' | 'm' | 'index'
  satellite?: string;        // 'EMIT' | 'TROPOMI' | 'Tanager-1' | 'AIRS' | 'GPM' | 'SWOT' | 'MODIS'
  note: string;
  noteBn?: string;
  qaValue: number;           // 0.0 to 1.0 (quality assurance score)
  uncertainty?: number;
  uncertaintyPct?: number;
  windSpeedMs?: number;      // Ground/plume wind speed estimate in m/s
  estimatedFluxKgHr?: number;// Estimated emission flux rate
}

export interface MethaneSource {
  id: string;
  name: string;
  nameBn: string;
  region: string;
  regionBn: string;
  country: string;
  countryBn?: string;
  lat: number;
  lon: number;
  category: SourceCategory;
  categoryLabel: string;
  categoryLabelBn: string;
  status: 'Under Investigation' | 'Observed' | 'Under Review' | 'Verified Active Leak' | 'Curated Scenario' | 'Direct Plume Detection';
  statusBn: string;
  unit?: string;
  intensity: number;         // Relative severity index 0.0 - 1.0
  firstSeen: string;
  lastSeen: string;
  estimatedFluxKgHr: number; // in kg/hr
  uncertaintyPct: number;    // ± % error margin
  description: string;
  descriptionBn: string;
  nearestFacility: string;
  nearestFacilityBn: string;
  observations: SourceObservation[];
  nasaGranuleId?: string;
  isBenchmark?: boolean;
  isCuratedScenario?: boolean;
  provenanceType?: 'direct_satellite_granule' | 'curated_demonstration_scenario' | 'live_api_event' | 'giovanni_time_series' | 'swot_hydrology_reach' | 'custom_imported_csv';
  provenanceNote?: string;
  polygonCoords?: [number, number][]; // Plume boundary vertices [lat, lon]

  // Multi-variable Earth system metadata extension
  sphere?: EarthSphere;
  sphereBn?: string;
  variableType?: EarthVariableType;
  variableLabel?: string;
  variableLabelBn?: string;
  unitLabel?: string;
  unitLabelBn?: string;
  sourceOrg?: string;
  mission?: string;
  productIdentifier?: string;
  productVersion?: string;
  spatialResolution?: string;
  temporalResolution?: string;
  geographicCoverage?: string;
  observationPeriod?: string;
  processingMethod?: string;
  qualityFlags?: string;
  missingDataPolicy?: string;
  documentationUrl?: string;
  dataUseConditions?: string;
  isFlagshipMethane?: boolean;
  earthSphere?: EarthSphere;
  satelliteSensor?: string;
  dataSource?: string;
}

export interface MannKendallResult {
  n: number;
  S: number;
  varS: number;
  Z: number;
  pValue: number;             // Primary reported p-value (exact if n <= 10, else asymptotic)
  pExact?: number;            // Exact permutation p-value (Kendall 1975)
  pAsymptotic: number;        // Continuity-corrected asymptotic Gaussian p-value
  pValueMethod: 'exact_permutation' | 'exact_multiset_permutation' | 'asymptotic_normal' | 'asymptotic_normal_ties_corrected';
  isSignificant: boolean;     // p < 0.05
  trendDirection: 'RISING' | 'FALLING' | 'STABLE' | 'MONOTONIC NULL NOT REJECTED' | 'CYCLICAL / INCONCLUSIVE';
  trendDirectionBn: string;
  senSlope: number;           // rate of change per time step
  senSlopeAnnual: number;     // rate of change in units/year
  senIntercept: number;
  rSquared: number;           // OLS coefficient of determination
  olSlope: number;
  confidenceInterval95: {
    lower: number;
    upper: number;
  };
}

export interface SeasonalMannKendallResult {
  n: number;
  nSeasons: number;
  years: number;
  S: number;
  varS: number;
  Z: number;
  pValue: number;
  isSignificant: boolean;
  trendDirection: 'RISING' | 'FALLING' | 'STABLE' | 'MONOTONIC NULL NOT REJECTED';
  trendDirectionBn: string;
  senSlopeAnnual: number;
  seasonalS: number[];
}

export interface ClimateEquivalents {
  annualFluxTonnes: number;
  gwp20TonnesCO2e: number;
  gwp100TonnesCO2e: number;
  methaneType: 'fossil' | 'biogenic';
  gwp20Factor: number;
  gwp100Factor: number;
  ipccReference: string;
  passengerCarKm: number;
  homesHeatedEquivalent: number;
  economicLossBdt: number;
  economicLossUsd: number;
}

export interface NasaApiStatus {
  cmr: {
    online: boolean;
    lastChecked: string;
    latencyMs: number;
    granuleCount: number;
    sampleGranuleTitle?: string;
    error?: string;
  };
  eonet: {
    online: boolean;
    lastChecked: string;
    latencyMs: number;
    eventsCount: number;
    recentEventTitle?: string;
    error?: string;
  };
}
