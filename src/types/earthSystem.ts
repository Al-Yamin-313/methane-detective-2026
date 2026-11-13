import { SourceCategory } from './methane';

export type EarthSphere = 'Atmosphere' | 'Hydrosphere' | 'Biosphere' | 'Geosphere';

export type EarthVariableType = 
  | 'ch4_plume'
  | 'ch4_column'
  | 'precipitation'
  | 'surface_water_elevation'
  | 'vegetation_ndvi'
  | 'custom_import';

export interface DatasetObservation {
  date: string;              // ISO format 'YYYY-MM-DD' or 'YYYY-MM'
  displayDate: string;       // e.g. 'JAN 2024'
  value: number;             // Measurement value
  unit: string;              // e.g. 'ppb', 'ppm·m', 'mm/month', 'm', 'index'
  satellite?: string;        // e.g. 'EMIT', 'TROPOMI', 'GPM', 'SWOT', 'MODIS'
  note: string;
  noteBn?: string;
  qaValue: number;           // 0.0 to 1.0 (quality assurance score)
  uncertainty?: number;      // ± uncertainty in measurement units
  uncertaintyPct?: number;   // ± %
  windSpeedMs?: number;      // For plume mass flux inversion
  estimatedFluxKgHr?: number;// For emission point sources
}

export interface EarthSystemDataset {
  id: string;
  name: string;
  nameBn: string;
  sphere: EarthSphere;
  sphereBn: string;
  variableType: EarthVariableType;
  variableLabel: string;
  variableLabelBn: string;
  variableName?: string;
  metadata?: any;
  region: string;
  regionBn: string;
  country: string;
  lat: number;
  lon: number;
  category: SourceCategory;
  categoryLabel: string;
  categoryLabelBn: string;
  status: 'Under Investigation' | 'Observed' | 'Under Review' | 'Verified Active Leak' | 'Curated Scenario' | 'Direct Plume Detection';
  statusBn: string;
  unit: string;
  unitLabel: string;
  unitLabelBn: string;
  intensity: number;         // 0.0 - 1.0
  firstSeen: string;
  lastSeen: string;
  estimatedFluxKgHr: number; // For methane plume calculations (0 if not point plume)
  uncertaintyPct: number;
  description: string;
  descriptionBn: string;
  nearestFacility: string;
  nearestFacilityBn: string;
  
  // Mandatory NASA Challenge Metadata Register
  sourceOrg: string;         // e.g. 'NASA / JPL', 'NASA / JAXA', 'ESA / Copernicus', 'NASA / CNES / CSA'
  mission: string;           // e.g. 'EMIT (ISS)', 'GPM Core Observatory', 'Sentinel-5P', 'SWOT'
  productIdentifier: string; // e.g. 'EMIT_L2B_CH4PLM_002', 'GPM_3IMERGM_07', 'S5P_L2__CH4____HiR', 'SWOT_L2_HR_RiverSP_2.0'
  productVersion?: string;   // e.g. 'v002', 'v07', 'v2.9.1', 'v2.0'
  spatialResolution: string; // e.g. '60 m', '0.1° (~10 km)', '7 x 5.5 km', '100 m reach'
  temporalResolution: string;// e.g. 'Monthly', 'Single-pass snapshot', 'Seasonal soundings', '21-day repeat'
  geographicCoverage: string;// e.g. 'Surma Basin, Bangladesh (24.0°N–25.5°N, 91.0°E–92.5°E)'
  observationPeriod: string; // e.g. '2020-01 to 2024-12 (5 Years)'
  processingMethod: string;  // e.g. 'Area-averaged spatial subset via NASA Giovanni v4.37'
  qualityFlags: string;      // Description of QA filtering applied
  missingDataPolicy: string; // Description of cloud-masking or seasonal gap handling
  documentationUrl: string;  // Link to official PUM or user guide
  dataUseConditions: string; // Applicable license / non-endorsement conditions

  // Data series & Geometry
  observations: DatasetObservation[];
  nasaGranuleId?: string;
  isBenchmark?: boolean;
  isCuratedScenario?: boolean;
  isFlagshipMethane?: boolean;
  provenanceType: 'direct_satellite_granule' | 'curated_demonstration_scenario' | 'live_api_event' | 'giovanni_time_series' | 'swot_hydrology_reach' | 'custom_imported_csv';
  provenanceNote: string;
  polygonCoords?: [number, number][]; // Plume boundary or reach coordinates [lat, lon]
}

export interface GiovanniCsvImportResult {
  success: boolean;
  dataset?: EarthSystemDataset;
  source?: any;
  error?: string;
  errors?: string[];
  warnings: string[];
  metadata: {
    title?: string;
    variable?: string;
    variableName?: string;
    units?: string;
    spatialBounding?: string;
    temporalRange?: string;
    totalRows: number;
    validPoints: number;
    missingPoints: number;
    duplicateTimestamps: number;
    droppedRowsCount?: number;
  };
}
