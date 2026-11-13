/**
 * Bangladesh Geographic Boundaries, Gas Fields, and NASA Satellite Swath Footprints
 */

export interface GasFieldMarker {
  name: string;
  nameBn: string;
  lat: number;
  lon: number;
  operator: string;
  discoveryYear: number;
  status: 'Producing' | 'Blowout Disaster Memorial' | 'Depleted / Low Pressure';
  statusBn: string;
}

export const BD_GAS_FIELDS: GasFieldMarker[] = [
  { name: 'Kailashtilla', nameBn: 'কৈলাশটিলা', lat: 24.912, lon: 92.015, operator: 'Sylhet Gas Fields Ltd', discoveryYear: 1962, status: 'Producing', statusBn: 'উৎপাদনরত' },
  { name: 'Haripur', nameBn: 'হরিপুর', lat: 24.960, lon: 92.030, operator: 'Sylhet Gas Fields Ltd', discoveryYear: 1955, status: 'Producing', statusBn: 'উৎপাদনরত' },
  { name: 'Rashidpur', nameBn: 'রশিদপুর', lat: 24.238, lon: 91.564, operator: 'Sylhet Gas Fields Ltd', discoveryYear: 1960, status: 'Producing', statusBn: 'উৎপাদনরত' },
  { name: 'Beanibazar', nameBn: 'বিয়ানীবাজার', lat: 24.821, lon: 92.152, operator: 'Sylhet Gas Fields Ltd', discoveryYear: 1981, status: 'Producing', statusBn: 'উৎপাদনরত' },
  { name: 'Magurchara (1997 Blowout)', nameBn: 'মাগুড়ছড়া (১৯৯৭ বিস্ফোরণ)', lat: 24.321, lon: 91.734, operator: 'Occidental (Historical)', discoveryYear: 1997, status: 'Blowout Disaster Memorial', statusBn: 'ঐতিহাসিক অগ্নিকাণ্ড ক্ষেত্র' },
  { name: 'Tengratila (2005 Blowout)', nameBn: 'টেংরাটিলা (২০০৫ বিস্ফোরণ)', lat: 25.045, lon: 91.431, operator: 'Niko Resources (Historical)', discoveryYear: 2005, status: 'Blowout Disaster Memorial', statusBn: 'ঐতিহাসিক অগ্নিকাণ্ড ক্ষেত্র' },
  { name: 'Titas Gas Field', nameBn: 'তিতাস গ্যাসক্ষেত্র', lat: 23.985, lon: 91.102, operator: 'BGFCL', discoveryYear: 1962, status: 'Producing', statusBn: 'উৎপাদনরত' },
  { name: 'Bibiyana Gas Field', nameBn: 'বিবিিয়ানা গ্যাসক্ষেত্র', lat: 24.641, lon: 91.654, operator: 'Chevron Bangladesh', discoveryYear: 1998, status: 'Producing', statusBn: 'উৎপাদনরত' }
];

export const BD_MAP_CONFIG = {
  center: [23.85, 90.35] as [number, number],
  defaultZoom: 7,
  minZoom: 3,
  maxZoom: 14,
  bounds: [
    [20.5, 88.0],
    [26.7, 92.8]
  ] as [[number, number], [number, number]]
};

// Simplified polygon outlines for key divisions in Bangladesh
export const BD_DIVISION_POLYGONS: { [key: string]: [number, number][] } = {
  Sylhet: [
    [25.18, 91.10],
    [25.20, 92.20],
    [24.85, 92.55],
    [24.50, 92.40],
    [24.10, 91.80],
    [24.20, 91.35],
    [24.70, 91.15],
    [25.18, 91.10]
  ],
  Dhaka: [
    [24.40, 89.80],
    [24.45, 90.75],
    [24.00, 90.85],
    [23.50, 90.65],
    [23.35, 90.00],
    [23.65, 89.70],
    [24.40, 89.80]
  ],
  Chittagong: [
    [23.80, 91.20],
    [23.85, 91.90],
    [23.00, 92.30],
    [21.80, 92.40],
    [20.80, 92.30],
    [21.40, 91.85],
    [22.40, 91.70],
    [23.80, 91.20]
  ],
  Rangpur: [
    [26.60, 88.30],
    [26.50, 89.70],
    [25.80, 89.75],
    [25.20, 89.50],
    [25.30, 88.80],
    [26.10, 88.20],
    [26.60, 88.30]
  ]
};

// NASA EMIT Overpass Satellite Swath Footprint Polygons (representing ISS orbital swath passes)
export const EMIT_SATELLITE_SWATHS: { id: string; name: string; polygon: [number, number][] }[] = [
  {
    id: 'EMIT-SWATH-ISS-2024A',
    name: 'EMIT Swath Orbit #000583 (Sylhet Gas Basin Pass)',
    polygon: [
      [25.30, 91.40],
      [25.10, 92.45],
      [24.15, 92.10],
      [24.35, 91.05],
      [25.30, 91.40]
    ]
  },
  {
    id: 'EMIT-SWATH-ISS-2025B',
    name: 'EMIT Swath Orbit #000840 (Dhaka Mega-Urban Corridor)',
    polygon: [
      [24.25, 89.90],
      [24.10, 90.80],
      [23.30, 90.50],
      [23.45, 89.60],
      [24.25, 89.90]
    ]
  }
];
