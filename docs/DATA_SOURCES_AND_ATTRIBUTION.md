# DATA SOURCES, PROVENANCE & ATTRIBUTION REGISTER

**Project:** METHANE DETECTIVE — Unmasking Earth's Invisible Polluters  
**Team:** `RISING_CODERS_X`  
**Challenge:** NASA Space Apps Challenge 2026 — Be An Earth System Trend Detective! (Advanced)  
**Workspace:** `E:\Methane_Detective`  
**Classification:** Official Data Attribution Register and Provenance Lineage Manual (Post-Forensic Audit)  

---

## 1. MANDATORY NASA NON-ENDORSEMENT NOTICE

> [!IMPORTANT]
> **NASA Non-Endorsement Notice:**  
> NASA does not endorse any non-U.S. Government entity and is not responsible for information contained on non-U.S. Government websites.  
> 
> All satellite data, mission graphics, and orbital telemetry referenced in this project originate from publicly accessible NASA, ESA, CNES, and CSA open data repositories under official open science data policies.

---

## 2. OFFICIAL SATELLITE MISSIONS & DAAC REPOSITORY REGISTER

| Mission / Sensor | Operating Agencies | Product ID / Version | Physical Variable | Native Resolution | Primary DAAC / Portal | Data Policy |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **NASA EMIT** | NASA / JPL | `EMITL2BCH4PLM_002` | Methane Plume Column Enhancement ($\text{ppm}\cdot\text{m}$) & Flux ($\text{kg/hr}$) | $60\text{ m} \times 60\text{ m}$ / Event Overpass | NASA LP DAAC / Earthdata Search | NASA Open Data (Public Domain) |
| **Copernicus Sentinel-5P TROPOMI** | ESA / SRON / Netherlands Space Office | `S5P_L2__CH4____` (PUM v2.9.1) | Column-averaged dry-air mole fraction $X\text{CH}_4$ ($\text{ppb}$) | $5.5\text{ km} \times 3.5\text{ km}$ / Daily Nadir | Copernicus Open Access Hub / NASA GES DISC | Copernicus Open Access Policy |
| **NASA GPM IMERG** | NASA / JAXA | `GPM_3IMERGM_07` (IMERG Final Run) | Monthly Accumulated Precipitation ($\text{mm}$) | $0.1^\circ \times 0.1^\circ$ (~10 km) / Monthly | NASA GES DISC / Giovanni | NASA Open Science Data Policy |
| **NASA/CNES SWOT** | NASA / CNES / CSA / UKSA | `SWOT_L2_HR_RiverSP_2.0` (KaRIn) | River Water Surface Elevation above EGM2008 ($\text{m}$) | Reach scale ($\ge 50\text{–}100\text{ m}$ width) / 21-day orbit | NASA PO.DAAC / Earthdata Search | Open Science Data Policy |
| **NASA Terra MODIS** | NASA / GSFC | `MOD13Q1.061` | Normalized Difference Vegetation Index (NDVI, dimensionless) | $250\text{ m}$ / 16-Day Composite | NASA LP DAAC / AppEEARS | NASA Open Data Policy |
| **NASA EONET v3** | NASA / GSFC | REST API Endpoint | Real-time Natural Hazard Events & Thermal Anomalies | Lat/Lon Point Vector / Real-time | NASA GSFC Earth Observatory | Public Domain (Zero API Key) |
| **NASA CMR** | NASA / EOSDIS | REST Search API | Satellite Metadata & Granule UR Verification | Metadata / Real-time | NASA EOSDIS Common Metadata Repository | Public Domain (Open API) |

---

## 3. PROVENANCE LINEAGE & BASIN DELINEATION

### 3.1 Basin A: Surma-Meghna Haor Basin (North-Eastern Bangladesh)

#### 1. Flagship Regional Methane Baseline: Surma Basin (`BD-TRP-SYL`)
- **Domain:** Atmosphere
- **Sensor:** Sentinel-5P TROPOMI (Copernicus / ESA)
- **Product UR:** `S5P_RPRO_L2__CH4____20230101T063412_20231231T082145_2.9.1_01`
- **Variable:** $X\text{CH}_4$ bias-corrected dry-air mole fraction ($\text{ppb}$)
- **Sample Size:** $n = 8$ seasonal dry-season soundings (2023–2025)
- **Quality Filters:** $\text{qa\_value} > 0.50$, $\text{cloud\_fraction} < 0.20$
- **Baseline Magnitude:** $1904.0\text{ ppb}$ (April 2023) to $1941.0\text{ ppb}$ (October 2024)
- **Statistical Trend:** Sen's Slope $= +12.82\text{ ppb/year}$, Mann-Kendall $S = +14$, exact permutation $p = 0.10868$ (Monotonic null NOT rejected at $\alpha=0.05$).
- **Missingness Mechanism:** June–August data gaps are directly caused by deep convective monsoon cloud decks (cloud fraction $>0.85$, $\text{qa\_value} < 0.50$) attenuating the SWIR surface reflection.

#### 2. Flagship Point-Source Plume: Nabiganj Gas Field Area (`BD-HAB-001`)
- **Domain:** Atmosphere
- **Sensor:** NASA EMIT (ISS VSWIR Imaging Spectrometer)
- **Product UR:** `EMIT_L2B_CH4PLM_002_20230123T085311_000583` (Plume #583)
- **Acquisition Timestamp:** January 23, 2023, 08:53:11 UTC
- **Coordinates:** Centroid $24.6355^\circ\text{N}, 91.5939^\circ\text{E}$ (Nabiganj, Habiganj District, ~6.9 km south of Bibiyana Gas Complex)
- **Variable:** Column enhancement ($\Delta\text{CH}_4 \approx 74\text{ ppm}\cdot\text{m}$, peak pixel $642\text{ ppm}\cdot\text{m}$)
- **Plume Geometry:** 21-vertex segmented enhancement polygon rendered directly from NASA ECHO metadata.
- **Mass Emission Inversion:** Integrated Methane Enhancement (IME) advective model yields $Q \approx 820 \pm 197\text{ kg/hr}$ ($\pm 24\%$, $1\sigma$).
- **Missingness & Sampling Truth:** Single episodic overpass snapshot from the ISS precessing $51.6^\circ$ orbit. Not a continuous time series; not attributable to a named company without in situ optical gas imaging (OGI).

#### 3. Monthly Accumulated Precipitation: Surma Basin (`BD-GPM-SYL`)
- **Domain:** Hydrosphere
- **Sensor:** NASA/JAXA GPM Core Observatory & Constellation
- **Product UR:** `GPM_3IMERGM_07_202001_202412_BENGAL_01`
- **Access Portal:** NASA GES DISC via Giovanni Data Portal
- **Physical Variable:** **Monthly Accumulated Precipitation ($\text{mm}$)**
- **Sample Size:** $n = 60$ consecutive months (January 2020 to December 2024)
- **Spatial Bounding Box:** $[24.0^\circ\text{–}25.5^\circ\text{N}, 91.0^\circ\text{–}92.5^\circ\text{E}]$
- **Observed Range:** Dry winter minimum $5.2\text{ mm}$ (Dec 2022) to extreme monsoon peak $885.6\text{ mm}$ (June 2022 flood). Peak monsoon monthly accumulation typically reaches $630\text{–}725\text{ mm}$.
- **Statistical Trend:** Mann-Kendall $S = +42$, $Z = +0.261$, $p = 0.79371$. Sen's slope $= +1.30\text{ mm/year}$ (Stable seasonal cycle; no secular drift).

#### 4. Haor Wetland Vegetation Phenology: Hakaluki/Tanguar (`BD-MOD-NDVI`)
- **Domain:** Biosphere
- **Sensor:** NASA Terra MODIS (MOD13Q1.061)
- **Access Portal:** NASA LP DAAC via AppEEARS
- **Physical Variable:** 16-Day Composite NDVI (dimensionless, $0.0\text{–}1.0$)
- **Sample Size:** $n = 24$ composite periods (January 2023 to December 2024)
- **Target Coordinates:** Hakaluki Haor Basin $[24.62^\circ\text{N}, 91.68^\circ\text{E}]$
- **Observed Range:** Dry winter peak $0.72$ (March 2024, Boro rice heading) to monsoon flood submergence minimum $0.17$ (July 2024).
- **Physical Meaning:** Reflects optical surface reflectance (NIR absorption by floodwaters), establishing the seasonal timing of wetland submergence.
- **Statistical Trend:** Mann-Kendall $S = -30$, $Z = -0.719$, $p = 0.47194$. Sen's slope $= -0.042\text{ index/year}$ (Cyclical phenology).

---

### 3.2 Basin B: Brahmaputra-Jamuna River Basin (Western/Central Bangladesh)

#### 5. River Water Surface Elevation: Jamuna River Reach (`BD-SWOT-JAM`)
- **Domain:** Hydrosphere
- **Sensor:** NASA/CNES/CSA/UKSA SWOT Ka-band Radar Interferometer (KaRIn)
- **Product UR:** `SWOT_L2_HR_RiverSP_2.0_Node_Jamuna_Reach_23481_01`
- **Access Portal:** NASA PO.DAAC / CNES AVISO+
- **Physical Variable:** **River Water Surface Elevation (WSE)** above the EGM2008 geoid in meters ($\text{m}$)
- **Sample Size:** $n = 18$ repeat orbital overpasses (April 2023 to October 2024)
- **Reach & Node Location:** Jamuna River Reach Node ID `23481`, near Sirajganj/Tangail $[24.550^\circ\text{N}, 89.850^\circ\text{E}]$
- **Geographic Role:** Drains the transboundary Himalayan catchment through western/central Bangladesh. Presented as a separate macro-hydrology investigation, distinct from the internal Haor wetlands.
- **Baseline and Seasonal Amplitude:**
  - Pre-monsoon dry season baseflow low: $8.45\text{ m}$ (April 12, 2023).
  - Monsoon peak flood crest: $13.72\text{ m}$ (July 11, 2024).
  - **Intra-annual seasonal flood wave amplitude:** $\Delta h_{\text{seasonal}} = 13.72 - 8.45 = \mathbf{+5.27\text{ m}}$.
- **Statistical Trend:** Mann-Kendall $S = +17$, $Z = +0.606$, $p = 0.54449$. Sen's slope $= +0.59\text{ m/year}$ (Dynamic seasonal flood pulse; no significant multi-year drift).

---

## 4. SCIENTIFIC HARMONIZATION PRINCIPLES

1. **Strict Unit Segregation:**
   - Point-source plume enhancement ($\text{ppm}\cdot\text{m}$, EMIT) is never averaged or combined with column dry-air mole fraction ($\text{ppb}$, TROPOMI).
   - Monthly accumulated rainfall ($\text{mm}$, GPM) is not labeled as a rate ($\text{mm/hr}$).
   - River surface elevation ($\text{m}$, SWOT) is maintained on dedicated vertical axes.
2. **Basin Segregation:**
   - Brahmaputra-Jamuna River stage observations are never conflated with Surma-Meghna Haor water levels.
3. **Causal vs. Temporal Association:**
   - Satellite observations document temporal co-occurrence and environmental conditions conducive to biogenic methanogenesis, but direct in situ gas production requires ground-level flux chambers or eddy covariance towers for causal proof.
