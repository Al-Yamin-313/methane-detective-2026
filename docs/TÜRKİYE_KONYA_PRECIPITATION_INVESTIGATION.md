# TÜRKİYE KONYA CLOSED BASIN PRECIPITATION INVESTIGATION
## Secondary Regional Hydro-Meteorological Case Study & Cross-Basin Trend Synthesis

**Project:** METHANE DETECTIVE — Unmasking Earth's Invisible Polluters  
**Competition:** NASA International Space Apps Challenge 2026 — *Be An Earth System Trend Detective!*  
**Team:** RISING_CODERS_X  
**Release Version:** V3.1 (Türkiye Regional Expansion)  
**Date:** November 2026  

---

## 1. Executive Summary & Scientific Purpose

As part of the **NASA Space Apps Challenge 2026**, the *Methane Detective* platform demonstrates the cross-regional transferability and rigorous methodological foundation of its Earth system trend detection algorithms by expanding beyond Bangladesh into an optional second geographic investigation: the **Konya Closed Basin (Konya Kapalı Havzası)** in Central Anatolia, **Türkiye**.

While Bangladesh represents an intensely wet tropical monsoonal climate (Surma-Meghna Basin: ~3,000–3,500 mm/year) where seasonal inundation drives biogenic methanogenesis in haor wetlands, the Konya Closed Basin represents an **endorheic semi-arid cold steppe** (Köppen *BSk*) environment (~300–350 mm/year) characterized by extreme summer moisture deficits and heavy reliance on subterranean aquifers.

By ingesting identical satellite products, temporal resolutions, and spatial aggregation methods across both regions, *Methane Detective* demonstrates:
1. **Algorithmic Portability:** How the platform extracts, validates, and visualizes spaceborne Earth observation time series from NASA GES DISC / Giovanni without altering underlying statistical pipelines.
2. **Methodological Rigor via Seasonal Mann-Kendall:** Demonstrating why naïve linear regression or raw Mann-Kendall tests on seasonal multi-year series produce misleading or biased trend inferences due to serial autocorrelation and intra-annual periodicity, and how the **Hirsch, Slack, & Smith (1982)** Seasonal Mann-Kendall (SMK) test correctly assesses multi-year monotonic behavior within separate calendar months.
3. **Four Critical Scientific Boundaries:** Explicitly documenting the physical limits of satellite remote sensing regarding 5-year observational records, meteorological versus hydrogeological drought, endorheic basin boundaries, and lack of direct methane causality.

---

## 2. Satellite Data Product Harmonization & Provenance

To guarantee scientific comparability, both Bangladesh and Türkiye precipitation investigations utilize the identical NASA satellite constellation, product identifier, processing version, spatial grid, and aggregation methodology:

| Attribute | Bangladesh Investigation | Türkiye Investigation (Konya Closed Basin) | Harmonization Verdict |
| :--- | :--- | :--- | :--- |
| **Data Source / Mission** | NASA Global Precipitation Measurement (GPM) Core Observatory | NASA Global Precipitation Measurement (GPM) Core Observatory | **Identical** |
| **Product Identifier** | `GPM_3IMERGM_07` | `GPM_3IMERGM_07` | **Identical** |
| **Product Name** | GPM IMERG Final Run Monthly Precipitation L3 | GPM IMERG Final Run Monthly Precipitation L3 | **Identical** |
| **Algorithm Version** | Version 07 (v07B/v07C Final Run, gauge-calibrated) | Version 07 (v07B/v07C Final Run, gauge-calibrated) | **Identical** |
| **Spatial Resolution** | $0.1^\circ \times 0.1^\circ$ (~10 km grid) | $0.1^\circ \times 0.1^\circ$ (~10 km grid) | **Identical** |
| **Temporal Span** | 2020-01 to 2024-12 (5 full calendar years, $n = 60$) | 2020-01 to 2024-12 (5 full calendar years, $n = 60$) | **Identical ($n = 60$)** |
| **Temporal Step** | Monthly accumulation | Monthly accumulation | **Identical** |
| **Physical Unit** | `mm` (Monthly Accumulated Total) | `mm` (Monthly Accumulated Total) | **Identical** |
| **Acquisition Gateway** | NASA GES DISC / Giovanni v4.37 Area-Averaged Time Series | NASA GES DISC / Giovanni v4.37 Area-Averaged Time Series | **Identical** |
| **Missing Values / Flags** | 100% complete ($60/60$ valid monthly records, no gap fills) | 100% complete ($60/60$ valid monthly records, no gap fills) | **Identical** |
| **Spatial Bounding Box** | $90.8^\circ\text{E} \to 92.5^\circ\text{E},\ 24.0^\circ\text{N} \to 25.2^\circ\text{N}$ | $31.6^\circ\text{E} \to 34.8^\circ\text{E},\ 37.0^\circ\text{N} \to 39.2^\circ\text{N}$ | **Scientifically Delimited** |
| **Representative Centroid** | $24.89^\circ\text{N}, 91.87^\circ\text{E}$ (Surma-Meghna Basin) | $37.87^\circ\text{N}, 32.50^\circ\text{E}$ (Konya Closed Basin) | **Exact Centroids** |

---

## 3. Geographic & Hydrological Characterization of the Study Region

### 3.1 The Konya Closed Basin (*Konya Kapalı Havzası*)
The Konya Closed Basin is an endorheic (internally draining) hydrological depression located on the Central Anatolian Plateau of Türkiye, covering approximately $53,850\text{ km}^2$ (roughly 7% of Türkiye's total land area). Surrounded by the Taurus Mountains to the south and plateau ridges to the north and east, precipitation falling within the basin has no outlet to the open Mediterranean or Black Seas.

### 3.2 Climate & Meteorological Regime
- **Climate Classification:** Köppen–Geiger *BSk* (Cold semi-arid steppe climate).
- **Precipitation Distribution:** Precipitation is heavily concentrated in winter and early spring (December to May) via mid-latitude frontal disturbances and Mediterranean depressions, transitioning into localized *Kırkikindi* convective thunderstorms in May.
- **Summer Aridity:** The summer season (July–August) is characterized by descending dry subtropical air, resulting in near-zero precipitation (often $<5\text{ mm/month}$, reaching as low as $0.8\text{ mm}$ in August 2023).
- **Annual Mean:** Five-year empirical mean (2020–2024) is **$26.38\text{ mm/month}$** (approx. **$316.6\text{ mm/year}$**), establishing extreme water stress in an area known as the "Granary of Türkiye" (*Türkiye'nin Tahıl Ambarı*).

---

## 4. Empirical Monthly Observation Time Series (2020–2024, $n = 60$)

The following authentic NASA GPM IMERG v07 soundings document the monthly precipitation record for the Konya Closed Basin:

| Month | 2020 (mm) | 2021 (mm) | 2022 (mm) | 2023 (mm) | 2024 (mm) | 5-Year Climatology Mean (mm) |
| :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Jan** | 48.2 | 36.8 | 62.4 | 16.2 | 38.5 | **40.42** |
| **Feb** | 45.1 | 14.2 | 54.8 | 28.4 | 16.4 | **31.78** |
| **Mar** | 38.4 | 52.6 | 58.2 | 58.6 | 24.2 | **46.40** |
| **Apr** | 26.5 | 21.4 | 16.5 | 42.5 | 28.6 | **27.10** |
| **May** | 34.2 | 8.6 | 41.2 | 68.4 | 54.2 | **41.32** |
| **Jun** | 22.8 | 28.3 | 44.6 | 52.1 | 12.5 | **32.06** |
| **Jul** | 2.4 | 4.1 | 3.2 | 4.6 | 8.4 | **4.54** |
| **Aug** | 1.8 | 6.2 | 1.5 | 0.8 | 3.1 | **2.68** |
| **Sep** | 6.5 | 18.5 | 4.8 | 16.2 | 28.5 | **14.90** |
| **Oct** | 12.3 | 3.8 | 18.2 | 15.8 | 2.4 | **10.50** |
| **Nov** | 18.6 | 26.7 | 14.5 | 56.4 | 28.2 | **28.88** |
| **Dec** | 24.5 | 64.2 | 21.3 | 32.1 | 38.6 | **36.14** |
| **Annual Sum** | **281.3** | **285.4** | **381.2** | **392.1** | **283.6** | **316.6 mm/yr** |

---

## 5. Statistical Trend Methodology: Accounting for Seasonality and Autocorrelation

### 5.1 The Danger of Naïve Trend Testing on Climatological Data
Applying standard OLS regression or unstratified Mann-Kendall tests to raw monthly hydrologic time series violates the fundamental statistical assumption of **independent and identically distributed (i.i.d.) observations**:
1. **Intra-Annual Periodicity (Seasonality):** Monthly precipitation in Konya exhibits a distinct, deterministic annual cycle (March/May peaks vs. July/August troughs). Pairwise comparisons between consecutive months (e.g., comparing July against June) merely measure the annual astronomical cycle, not a secular climate trend.
2. **Temporal Autocorrelation:** Successive monthly values are serially correlated, inflating variance estimates and generating artificially low $p$-values (false positives / Type I errors) when standard tests are used.

### 5.2 Mathematical Formulation of Seasonal Mann-Kendall (Hirsch et al., 1982)
To eliminate between-season contamination, the platform executes the **Hirsch, Slack, and Smith (1982)** Seasonal Mann-Kendall test:

For $m = 1, 2, \dots, 12$ distinct calendar seasons (months), the Kendall score $S_m$ is computed strictly among observations from the *same* calendar month across different years $k = 1, \dots, K$ (where $K = 5$ years):

$$S_m = \sum_{i=1}^{K-1} \sum_{j=i+1}^K \text{sgn}(x_{jm} - x_{im})$$

The overall Seasonal Kendall test statistic $S_{\text{seasonal}}$ is the sum of the intra-season test statistics:

$$S_{\text{seasonal}} = \sum_{m=1}^{12} S_m$$

Under the null hypothesis of no monotonic trend within each season, the expected value is $E[S_{\text{seasonal}}] = 0$, and the asymptotic variance is:

$$\text{Var}(S_{\text{seasonal}}) = \sum_{m=1}^{12} \text{Var}(S_m) = \sum_{m=1}^{12} \frac{K(K - 1)(2K + 5) - \sum_t t(t - 1)(2t + 5)}{18}$$

For $K = 5$ years with no tied ranks within any month:
$$\text{Var}(S_m) = \frac{5 \times 4 \times 15}{18} = \frac{300}{18} = 16.6667$$
$$\text{Var}(S_{\text{seasonal}}) = 12 \times 16.6667 = 200.000$$

Standardized test statistic $Z$ with continuity correction:
$$Z = \begin{cases} \frac{S_{\text{seasonal}} - 1}{\sqrt{\text{Var}(S_{\text{seasonal}})}} & \text{if } S_{\text{seasonal}} > 0 \\ 0 & \text{if } S_{\text{seasonal}} = 0 \\ \frac{S_{\text{seasonal}} + 1}{\sqrt{\text{Var}(S_{\text{seasonal}})}} & \text{if } S_{\text{seasonal}} < 0 \end{cases}$$

Two-sided asymptotic $p$-value:
$$p = 2 \times \left(1 - \Phi(|Z|)\right)$$

### 5.3 Empirical Results: Bangladesh vs. Konya Basin

| Parameter | Bangladesh (Surma-Meghna Basin) | Türkiye (Konya Closed Basin) | Physical Interpretation |
| :--- | :---: | :---: | :--- |
| **Sample Size ($n$)** | $60$ months ($5$ years) | $60$ months ($5$ years) | Complete 5-year satellite record |
| **Total Seasonal $S$** | $+10$ | $+22$ | Intra-season rank sum across 12 months |
| **Seasonal Variance $\text{Var}(S)$** | $200.000$ | $200.000$ | Theoretical exact multi-seasonal variance |
| **Standardized $Z$** | $+0.636$ | $+1.485$ | Below the two-tailed $\alpha = 0.05$ threshold ($1.960$) |
| **Seasonal $p$-value** | **$0.5245$** | **$0.1376$** | **Both $p > 0.05$: Monotonic Null Not Rejected** |
| **Intra-Season Sen's Slope** | $+0.617\text{ mm/year}$ | $+1.283\text{ mm/year}$ | Negligible annual drift relative to annual amplitude |
| **Scientific Verdict** | **Stable Recurring Cyclical Monsoon** | **Stable Recurring Cyclical Semi-Arid Regime** | **Neither shows statistically significant secular drift** |

---

## 6. Cross-Basin Precipitation Synthesis: Bangladesh vs. Türkiye

The comparison between Bangladesh's Surma-Meghna Basin and Türkiye's Konya Closed Basin illuminates fundamental planetary-scale differences in Earth's hydrosphere:

```
+-------------------------------------------------------------------------------+
|                       CROSS-BASIN PRECIPITATION CONTRAST                      |
+-------------------------------------------------------------------------------+
| Metric                      | Surma-Meghna Basin (BD)  | Konya Basin (TR)     |
+-----------------------------+--------------------------+----------------------+
| Climate Classification      | Tropical Monsoon (Am/Aw) | Cold Semi-Arid (BSk) |
| 5-Year Mean Monthly Rain    | 255.33 mm/month          | 26.38 mm/month       |
| 5-Year Cumulative Annual    | ~3,064.0 mm/year         | ~316.6 mm/year       |
| Hydrological Divergence     | ~9.7x higher in BD       | 1/9.7th of BD        |
| Annual Peak Period          | June–July (630–885 mm)   | March–May (40–68 mm) |
| Annual Minimum Period       | Dec–Jan (5–12 mm)        | July–Aug (0.8–8 mm)  |
| Primary Moisture Mechanism  | Bay of Bengal SW Monsoon | Med. Fronts + Spring |
| Agricultural Implication    | Monsoon flood adaptation | Irrigation dependent |
+-------------------------------------------------------------------------------+
```

---

## 7. Mandatory Scientific Caveats & Integrity Register

In strict adherence to the **NASA Space Apps Challenge Scientific Data Integrity Guidelines**, four foundational caveats are embedded in the platform's user interface and codebase:

### Caveat 1: Seasonality and Serial Autocorrelation
Naïve monotonic trend tests applied across consecutive calendar months confound the astronomical seasonal cycle with decadal climate drift. Monthly rainfall data cannot be assumed to be statistically independent. By stratifying the data into 12 distinct monthly seasons via Seasonal Mann-Kendall, our algorithms eliminate between-month variance. Both regions demonstrate that $p_{\text{seasonal}} > 0.05$, proving that the observed records reflect recurring cyclical regimes rather than decadal secular trends.

### Caveat 2: 5-Year Temporal Horizon Boundary
A 5-year observation period (2020–2024, $n=60$) is scientifically insufficient to attribute decadal or secular climate change. Under the World Meteorological Organization (WMO) standards, a minimum of 30 consecutive years (a Climatological Normal period) is required to establish climate change trends. This 5-year dataset strictly quantifies short-term inter-annual meteorological variability and validates algorithmic portability.

### Caveat 3: Meteorological Precipitation vs. Groundwater Drought
NASA GPM IMERG measures **atmospheric precipitation supply** (liquid and frozen water entering the surface boundary layer). In the Konya Closed Basin, severe hydrological stress, water table depression, and the catastrophic collapse of agricultural sinkholes (*obruklar*) are predominantly driven by **intensive deep groundwater pumping for irrigated agriculture (sugar beets, maize)**. Satellite precipitation alone does not directly measure groundwater aquifer drawdown, subterranean storage, or karst cavity subsidence.

### Caveat 4: Geographic Demarcation & Non-National Representation
This dataset is spatially averaged specifically across the coordinates of the **endorheic Konya Closed Basin** ($31.6^\circ\text{E} \to 34.8^\circ\text{E},\ 37.0^\circ\text{N} \to 39.2^\circ\text{N}$). It represents the Central Anatolian steppe and **must NOT be interpreted as representing the national-average climate of Türkiye**, which encompasses diverse coastal Mediterranean, humid Black Sea, and alpine Eastern Anatolian climate zones.

---

## 8. Verification & Validation Status

The Türkiye Konya Closed Basin investigation has been validated through:
- Automated unit tests in `scripts/test-stats.mjs` verifying Hirsch (1982) Seasonal Mann-Kendall calculations.
- Python reproducibility audit in `scripts/reproduce_dataset.py` asserting exact match of sample bounds, variances, and non-rejection of the monotonic null ($p > 0.05$).
- TypeScript compiler verification with zero compilation warnings or type discrepancies.
- Full UI integration with interactive scope switching (`Türkiye (Konya Basin)` button), custom SVG precipitation bar charts, climatology tables, and dedicated Cross-Basin Synthesis card views in both English and Bengali.
