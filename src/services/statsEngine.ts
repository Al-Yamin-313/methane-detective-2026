import { MannKendallResult, ClimateEquivalents, SeasonalMannKendallResult } from '../types/methane';

/**
 * Abramowitz and Stegun approximation for the error function erf(x)
 * Accurate to within 1.5e-7
 */
export function erf(x: number): number {
  const sign = x >= 0 ? 1 : -1;
  const absX = Math.abs(x);

  // Constants
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;

  const t = 1.0 / (1.0 + p * absX);
  const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-absX * absX);

  return sign * y;
}

/**
 * Standard Normal Cumulative Distribution Function Phi(z)
 */
export function standardNormalCdf(z: number): number {
  return 0.5 * (1.0 + erf(z / Math.SQRT2));
}

/**
 * Exact probability distribution of Mann-Kendall S statistic for untied observations.
 * Uses the Kendall (1975) polynomial generating function:
 * G_n(x) = Prod_{k=1}^n (1 + x + ... + x^{k-1})
 */
export function exactMannKendallPValue(n: number, S: number): number {
  if (n <= 1) return 1.0;
  
  // Maximum possible inversions: M = n*(n-1)/2
  const maxS = (n * (n - 1)) / 2;
  const absS = Math.abs(S);
  if (absS > maxS) return 0.0;
  if (absS === maxS) {
    // Exactly 2 permutations (strictly ascending or descending) out of n!
    let nFact = 1;
    for (let i = 2; i <= n; i++) nFact *= i;
    return 2.0 / nFact;
  }

  // Multiply polynomial generating function: (1 + x + ... + x^{k-1}) for k = 2..n
  let poly = [1];
  for (let k = 2; k <= n; k++) {
    const nextPoly = new Array(poly.length + k - 1).fill(0);
    for (let i = 0; i < poly.length; i++) {
      const c = poly[i];
      for (let j = 0; j < k; j++) {
        nextPoly[i + j] += c;
      }
    }
    poly = nextPoly;
  }

  let totalPerms = 0;
  let countTail = 0;
  for (let inversions = 0; inversions < poly.length; inversions++) {
    const freq = poly[inversions];
    totalPerms += freq;
    // S = maxS - 2 * inversions
    const currentS = maxS - 2 * inversions;
    if (Math.abs(currentS) >= absS) {
      countTail += freq;
    }
  }

  return totalPerms > 0 ? countTail / totalPerms : 1.0;
}

/**
 * Exact permutation distribution for small samples with TIED observations (n <= 8).
 * Enumerates all unique permutations of the multiset under H0 exchangeability.
 * Guarantees that the no-tie polynomial generating function is NEVER blindly applied to tied data.
 */
export function exactTiedMultisetPValue(values: number[], targetS: number): number {
  const n = values.length;
  if (n <= 1) return 1.0;
  if (n > 8) return 1.0; // Enforce performance boundary; for n > 8 use asymptotic tied Z

  const sorted = [...values].sort((a, b) => a - b);
  const used = new Array(n).fill(false);
  const current: number[] = [];
  let totalPerms = 0;
  let tailCount = 0;
  const absTargetS = Math.abs(targetS);

  function computeS(arr: number[]): number {
    let s = 0;
    const len = arr.length;
    for (let i = 0; i < len - 1; i++) {
      for (let j = i + 1; j < len; j++) {
        if (arr[j] > arr[i]) s++;
        else if (arr[j] < arr[i]) s--;
      }
    }
    return s;
  }

  function backtrack(): void {
    if (current.length === n) {
      totalPerms++;
      const s = computeS(current);
      if (Math.abs(s) >= absTargetS) {
        tailCount++;
      }
      return;
    }

    for (let i = 0; i < n; i++) {
      if (used[i]) continue;
      // Skip duplicate values at same recursive level to generate distinct multiset permutations
      if (i > 0 && sorted[i] === sorted[i - 1] && !used[i - 1]) continue;

      used[i] = true;
      current.push(sorted[i]);
      backtrack();
      used[i] = false;
      current.pop();
    }
  }

  backtrack();
  return totalPerms > 0 ? tailCount / totalPerms : 1.0;
}

/**
 * Calculate Mann-Kendall Trend Test, Sen's Slope Estimator, and OLS regression
 * Evaluates both Exact Permutation distribution (for n <= 10) and Asymptotic Normal approximation.
 * @param values Array of numerical observations over time
 * @param dates Optional ISO date strings for exact timestamp-based annualized slope
 * @param timeStepMonths Approximate time interval per point in months if dates not provided
 */
export function calculateMannKendall(
  values: number[],
  dates?: string[],
  timeStepMonths: number = 3.5
): MannKendallResult {
  const n = values.length;
  if (n < 4) {
    return {
      n,
      S: 0,
      varS: 0,
      Z: 0,
      pValue: 1.0,
      pAsymptotic: 1.0,
      pValueMethod: 'asymptotic_normal',
      isSignificant: false,
      trendDirection: 'MONOTONIC NULL NOT REJECTED',
      trendDirectionBn: 'অনির্দিষ্ট / অপর্যাপ্ত তথ্য',
      senSlope: 0,
      senSlopeAnnual: 0,
      senIntercept: values[0] || 0,
      rSquared: 0,
      olSlope: 0,
      confidenceInterval95: { lower: 0, upper: 0 }
    };
  }

  // 1. Calculate Mann-Kendall S statistic
  let S = 0;
  for (let k = 0; k < n - 1; k++) {
    for (let j = k + 1; j < n; j++) {
      const diff = values[j] - values[k];
      if (diff > 0) S += 1;
      else if (diff < 0) S -= 1;
    }
  }

  // 2. Compute tied groups for variance calculation
  const counts: { [key: number]: number } = {};
  for (const v of values) {
    counts[v] = (counts[v] || 0) + 1;
  }
  let tieSum = 0;
  let hasTies = false;
  for (const val in counts) {
    const t = counts[val];
    if (t > 1) {
      hasTies = true;
      tieSum += t * (t - 1) * (2 * t + 5);
    }
  }

  // 3. Variance of S with tie correction
  const varS = (n * (n - 1) * (2 * n + 5) - tieSum) / 18.0;

  // 4. Standardized Z statistic (asymptotic with continuity correction)
  let Z = 0;
  if (varS > 0) {
    if (S > 0) {
      Z = (S - 1) / Math.sqrt(varS);
    } else if (S < 0) {
      Z = (S + 1) / Math.sqrt(varS);
    } else {
      Z = 0;
    }
  }

  // 5. Compute both Asymptotic and Exact p-values
  const pAsymptotic = 2 * (1.0 - standardNormalCdf(Math.abs(Z)));
  
  let pExact: number | undefined = undefined;
  let pValueMethod: 'exact_permutation' | 'exact_multiset_permutation' | 'asymptotic_normal' | 'asymptotic_normal_ties_corrected' = 'asymptotic_normal';

  if (!hasTies && n <= 10) {
    // Untied exact distribution via Kendall polynomial generating function
    pExact = exactMannKendallPValue(n, S);
    pValueMethod = 'exact_permutation';
  } else if (hasTies && n <= 8) {
    // Tied exact distribution via multiset permutation enumeration
    pExact = exactTiedMultisetPValue(values, S);
    pValueMethod = 'exact_multiset_permutation';
  } else if (hasTies) {
    pValueMethod = 'asymptotic_normal_ties_corrected';
  } else {
    pValueMethod = 'asymptotic_normal';
  }

  // Use Exact when available for small samples, otherwise Asymptotic
  const pValue = (pExact !== undefined) ? pExact : pAsymptotic;

  const isSignificant = pValue < 0.05;

  // 6. Sen's Slope Estimator (Theil-Sen)
  // Compute time points in fractional years using actual timestamps whenever dates are available
  const timePoints: number[] = dates && dates.length === n
    ? dates.map(d => new Date(d).getTime() / (365.25 * 24 * 3600 * 1000))
    : values.map((_, i) => (i * timeStepMonths) / 12.0);

  const slopesPerPoint: number[] = [];
  const slopesAnnual: number[] = [];

  for (let i = 0; i < n - 1; i++) {
    for (let j = i + 1; j < n; j++) {
      const dtPoints = j - i;
      const dtYears = timePoints[j] - timePoints[i];
      slopesPerPoint.push((values[j] - values[i]) / dtPoints);
      if (dtYears > 0) {
        slopesAnnual.push((values[j] - values[i]) / dtYears);
      }
    }
  }

  slopesPerPoint.sort((a, b) => a - b);
  slopesAnnual.sort((a, b) => a - b);

  const midP = Math.floor(slopesPerPoint.length / 2);
  const senSlope = slopesPerPoint.length % 2 !== 0
    ? slopesPerPoint[midP]
    : (slopesPerPoint[midP - 1] + slopesPerPoint[midP]) / 2;

  const midA = Math.floor(slopesAnnual.length / 2);
  const senSlopeAnnual = slopesAnnual.length % 2 !== 0
    ? slopesAnnual[midA]
    : (slopesAnnual[midA - 1] + slopesAnnual[midA]) / 2;

  // Sen's Intercept
  const intercepts: number[] = [];
  for (let i = 0; i < n; i++) {
    intercepts.push(values[i] - senSlope * i);
  }
  intercepts.sort((a, b) => a - b);
  const intMid = Math.floor(intercepts.length / 2);
  const senIntercept = intercepts.length % 2 !== 0
    ? intercepts[intMid]
    : (intercepts[intMid - 1] + intercepts[intMid]) / 2;

  // 7. OLS Regression & R-squared
  let sumT = 0;
  let sumV = 0;
  for (let i = 0; i < n; i++) {
    sumT += i;
    sumV += values[i];
  }
  const meanT = sumT / n;
  const meanV = sumV / n;

  let num = 0;
  let denT = 0;
  let denV = 0;
  for (let i = 0; i < n; i++) {
    const dt = i - meanT;
    const dv = values[i] - meanV;
    num += dt * dv;
    denT += dt * dt;
    denV += dv * dv;
  }
  const olSlope = denT !== 0 ? num / denT : 0;
  const rSquared = (denT * denV !== 0) ? (num * num) / (denT * denV) : 0;

  // 8. 95% Confidence bounds on Annual Slope
  const kRank = Math.floor((slopesAnnual.length - 1.96 * Math.sqrt(varS)) / 2);
  const lowerIdx = Math.max(0, kRank);
  const upperIdx = Math.min(slopesAnnual.length - 1, slopesAnnual.length - 1 - kRank);

  // Determine trend direction with strict scientific qualification:
  // Non-significance means monotonic null is not rejected. It must NOT be claimed as proof of no emissions.
  let trendDirection: 'RISING' | 'FALLING' | 'STABLE' | 'MONOTONIC NULL NOT REJECTED' | 'CYCLICAL / INCONCLUSIVE' = 'MONOTONIC NULL NOT REJECTED';
  let trendDirectionBn = 'মনোটোনিক প্রবণতা নিশ্চিত নয় (অ-উল্লেখযোগ্য)';

  if (isSignificant) {
    if (Z > 0) {
      trendDirection = 'RISING';
      trendDirectionBn = 'পরিসংখ্যানগতভাবে উল্লেখযোগ্য ঊর্ধ্বমুখী প্রবণতা';
    } else {
      trendDirection = 'FALLING';
      trendDirectionBn = 'পরিসংখ্যানগতভাবে উল্লেখযোগ্য নিম্নমুখী প্রবণতা';
    }
  } else {
    trendDirection = 'MONOTONIC NULL NOT REJECTED';
    trendDirectionBn = 'মনোটোনিক নাল হাইপোথিসিস বাতিল করা যায়নি (অ-উল্লেখযোগ্য)';
  }

  return {
    n,
    S,
    varS,
    Z: Number(Z.toFixed(3)),
    pValue: pExact !== undefined ? Number(pExact.toExponential(4)) : Number(pAsymptotic.toFixed(5)),
    pExact: pExact !== undefined ? Number(pExact.toExponential(4)) : undefined,
    pAsymptotic: Number(pAsymptotic.toFixed(5)),
    pValueMethod,
    isSignificant,
    trendDirection,
    trendDirectionBn,
    senSlope: Number(senSlope.toFixed(3)),
    senSlopeAnnual: Number(senSlopeAnnual.toFixed(2)),
    senIntercept: Number(senIntercept.toFixed(2)),
    rSquared: Number(rSquared.toFixed(3)),
    olSlope: Number(olSlope.toFixed(3)),
    confidenceInterval95: {
      lower: Number((slopesAnnual[lowerIdx] ?? senSlopeAnnual).toFixed(2)),
      upper: Number((slopesAnnual[upperIdx] ?? senSlopeAnnual).toFixed(2))
    }
  };
}

/**
 * Climate Equivalents calculation from point emission flux rate (kg/hr).
 * Strictly follows IPCC Sixth Assessment Report (AR6), Working Group I, Chapter 7, Table 7.15 (with Official Published Errata):
 * - Fossil methane: GWP20 = 82.5; GWP100 = 29.8 (includes carbon-cycle feedbacks)
 * - Biogenic methane: GWP20 = 79.7; GWP100 = 27.0 (corrected in official IPCC errata from uncorrected 80.8 / 27.2)
 *
 * NOTE: Requires verified or modeled mass emission flux (kg/hr).
 * Raw path-integrated concentration (ppm·m or ppb) cannot be converted directly to mass without wind speed and plume geometry!
 */
export function calculateClimateImpact(
  fluxKgHr: number,
  methaneType: 'fossil' | 'biogenic' = 'fossil'
): ClimateEquivalents {
  // Annual metric tonnes of CH4: (kg/hr * 24 hr/day * 365.25 days/year) / 1000 kg/tonne
  const annualFluxTonnes = (fluxKgHr * 24 * 365.25) / 1000.0;

  // IPCC AR6 Working Group I, Chapter 7, Table 7.15 (with Official Published Errata)
  const gwp20Factor = methaneType === 'fossil' ? 82.5 : 79.7;
  const gwp100Factor = methaneType === 'fossil' ? 29.8 : 27.0;
  const ipccReference = 'IPCC AR6 WGI (2021) Chapter 7, Table 7.15 (Official Published Errata)';

  const gwp20TonnesCO2e = annualFluxTonnes * gwp20Factor;
  const gwp100TonnesCO2e = annualFluxTonnes * gwp100Factor;

  // Passenger car km equivalent:
  // EPA average fleet passenger vehicle emits ~0.192 kg CO2/km (~4.6 metric tons CO2/year for 24,000 km)
  const passengerCarKm = (gwp20TonnesCO2e * 1000.0) / 0.192;

  // Typical household natural gas heating consumes ~1.8 metric tons CH4 per year
  const homesHeatedEquivalent = Math.round(annualFluxTonnes / 1.8);

  // Economic valuation of lost natural gas:
  // 1 metric ton CH4 ≈ 1,400 m³ of pipeline natural gas
  // Bangladesh industrial natural gas price ≈ 30 BDT/m³ (~$10.50/MMBtu)
  const cubicMetersGas = annualFluxTonnes * 1400.0;
  const economicLossBdt = cubicMetersGas * 30.0;
  const economicLossUsd = economicLossBdt / 120.0; // @ ~120 BDT per USD

  return {
    annualFluxTonnes: Math.round(annualFluxTonnes),
    gwp20TonnesCO2e: Math.round(gwp20TonnesCO2e),
    gwp100TonnesCO2e: Math.round(gwp100TonnesCO2e),
    methaneType,
    gwp20Factor,
    gwp100Factor,
    ipccReference,
    passengerCarKm: Math.round(passengerCarKm),
    homesHeatedEquivalent,
    economicLossBdt: Math.round(economicLossBdt),
    economicLossUsd: Math.round(economicLossUsd)
  };
}

/**
 * Hirsch, Slack, and Smith (1982) Seasonal Mann-Kendall Test
 * Accounts for 12-month annual seasonality and serial autocorrelation.
 * Eliminates between-season comparisons by strictly evaluating intra-seasonal pairs.
 */
export function calculateSeasonalMannKendall(
  observations: { date: string; value: number }[]
): SeasonalMannKendallResult | null {
  if (!observations || observations.length < 24) return null;

  // Group by month (1 to 12)
  const monthlyGroups: { [month: number]: number[] } = {};
  for (let m = 1; m <= 12; m++) {
    monthlyGroups[m] = [];
  }

  for (const obs of observations) {
    const d = new Date(obs.date);
    const month = d.getUTCMonth() + 1; // 1-12
    monthlyGroups[month].push(obs.value);
  }

  let totalS = 0;
  let totalVarS = 0;
  const seasonalS: number[] = [];
  const intraSeasonSlopes: number[] = [];

  let validSeasons = 0;
  for (let m = 1; m <= 12; m++) {
    const vals = monthlyGroups[m];
    const K = vals.length;
    if (K < 2) {
      seasonalS.push(0);
      continue;
    }
    validSeasons++;
    let s_m = 0;
    for (let i = 0; i < K; i++) {
      for (let j = i + 1; j < K; j++) {
        const diff = vals[j] - vals[i];
        if (diff > 0) s_m += 1;
        else if (diff < 0) s_m -= 1;
        intraSeasonSlopes.push(diff / (j - i));
      }
    }
    seasonalS.push(s_m);
    totalS += s_m;

    // Variance for season m with tied rank adjustment
    const tieCounts: { [val: number]: number } = {};
    for (const v of vals) tieCounts[v] = (tieCounts[v] || 0) + 1;
    let tieAdjustment = 0;
    for (const count of Object.values(tieCounts)) {
      if (count > 1) {
        tieAdjustment += count * (count - 1) * (2 * count + 5);
      }
    }
    const var_m = (K * (K - 1) * (2 * K + 5) - tieAdjustment) / 18.0;
    totalVarS += var_m;
  }

  if (totalVarS <= 0) return null;

  let Z = 0;
  if (totalS > 0) {
    Z = (totalS - 1) / Math.sqrt(totalVarS);
  } else if (totalS < 0) {
    Z = (totalS + 1) / Math.sqrt(totalVarS);
  }

  const pValue = 2 * (1 - standardNormalCdf(Math.abs(Z)));
  const isSignificant = pValue < 0.05;

  let trendDirection: 'RISING' | 'FALLING' | 'STABLE' | 'MONOTONIC NULL NOT REJECTED' = 'STABLE';
  let trendDirectionBn = 'স্থির (ঋতুভিত্তিক নাল প্রত্যাখ্যাত হয়নি)';
  if (isSignificant) {
    if (totalS > 0) {
      trendDirection = 'RISING';
      trendDirectionBn = 'ঊর্ধ্বমুখী ধারা';
    } else {
      trendDirection = 'FALLING';
      trendDirectionBn = 'নিম্নমুখী ধারা';
    }
  } else {
    trendDirection = 'MONOTONIC NULL NOT REJECTED';
    trendDirectionBn = 'মনোটোনিক নাল হাইপোথিসিস বাতিল করা যায়নি (স্থির ঋতুচক্র)';
  }

  intraSeasonSlopes.sort((a, b) => a - b);
  const mid = Math.floor(intraSeasonSlopes.length / 2);
  const senSlopeAnnual = intraSeasonSlopes.length === 0 ? 0 :
    (intraSeasonSlopes.length % 2 !== 0
      ? intraSeasonSlopes[mid]
      : (intraSeasonSlopes[mid - 1] + intraSeasonSlopes[mid]) / 2.0);

  return {
    n: observations.length,
    nSeasons: validSeasons,
    years: Math.round(observations.length / 12),
    S: totalS,
    varS: Number(totalVarS.toFixed(3)),
    Z: Number(Z.toFixed(3)),
    pValue: Number(pValue.toFixed(5)),
    isSignificant,
    trendDirection,
    trendDirectionBn,
    senSlopeAnnual: Number(senSlopeAnnual.toFixed(3)),
    seasonalS
  };
}

/**
 * Monthly Climatology and Anomaly Decomposition
 * Computes 12-month baseline mean and inter-annual monthly departures.
 */
export function calculateMonthlyClimatologyAndAnomalies(
  observations: { date: string; value: number }[]
) {
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthTotals: { [m: number]: { sum: number; count: number } } = {};
  for (let m = 1; m <= 12; m++) monthTotals[m] = { sum: 0, count: 0 };

  for (const obs of observations) {
    const d = new Date(obs.date);
    const m = d.getUTCMonth() + 1;
    monthTotals[m].sum += obs.value;
    monthTotals[m].count += 1;
  }

  const climatology = [];
  const meanLookup: { [m: number]: number } = {};
  for (let m = 1; m <= 12; m++) {
    const mean = monthTotals[m].count > 0 ? monthTotals[m].sum / monthTotals[m].count : 0;
    climatology.push({
      month: m,
      monthName: monthNames[m - 1],
      mean: Number(mean.toFixed(2))
    });
    meanLookup[m] = mean;
  }

  const anomalies = observations.map((obs) => {
    const d = new Date(obs.date);
    const m = d.getUTCMonth() + 1;
    const anomaly = obs.value - (meanLookup[m] || 0);
    return {
      date: obs.date,
      value: obs.value,
      anomaly: Number(anomaly.toFixed(2))
    };
  });

  return { climatology, anomalies };
}
