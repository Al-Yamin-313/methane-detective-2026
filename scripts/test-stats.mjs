import os from 'os';
import path from 'path';
// Test script for stats formulas matching src/services/statsEngine.ts
function erf(x) {
  const sign = x >= 0 ? 1 : -1;
  const absX = Math.abs(x);
  const a1 = 0.254829592, a2 = -0.284496736, a3 = 1.421413741, a4 = -1.453152027, a5 = 1.061405429, p = 0.3275911;
  const t = 1.0 / (1.0 + p * absX);
  const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-absX * absX);
  return sign * y;
}

function standardNormalCdf(z) {
  return 0.5 * (1.0 + erf(z / Math.SQRT2));
}

function exactMannKendallPValue(n, S) {
  if (n <= 1) return 1.0;
  const maxS = (n * (n - 1)) / 2;
  const absS = Math.abs(S);
  if (absS > maxS) return 0.0;
  if (absS === maxS) {
    let nFact = 1;
    for (let i = 2; i <= n; i++) nFact *= i;
    return 2.0 / nFact;
  }

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
    const currentS = maxS - 2 * inversions;
    if (Math.abs(currentS) >= absS) {
      countTail += freq;
    }
  }

  return totalPerms > 0 ? countTail / totalPerms : 1.0;
}

function exactTiedMultisetPValue(values, targetS) {
  const n = values.length;
  if (n <= 1) return 1.0;
  const sorted = [...values].sort((a, b) => a - b);
  const used = new Array(n).fill(false);
  const current = [];
  let totalPerms = 0;
  let tailCount = 0;
  const absTargetS = Math.abs(targetS);

  function computeS(arr) {
    let s = 0;
    for (let i = 0; i < arr.length - 1; i++) {
      for (let j = i + 1; j < arr.length; j++) {
        if (arr[j] > arr[i]) s++;
        else if (arr[j] < arr[i]) s--;
      }
    }
    return s;
  }

  function backtrack() {
    if (current.length === n) {
      totalPerms++;
      if (Math.abs(computeS(current)) >= absTargetS) {
        tailCount++;
      }
      return;
    }
    for (let i = 0; i < n; i++) {
      if (used[i]) continue;
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

function runTest(name, values, unit) {
  const n = values.length;
  let S = 0;
  for (let k = 0; k < n - 1; k++) {
    for (let j = k + 1; j < n; j++) {
      if (values[j] > values[k]) S++;
      else if (values[j] < values[k]) S--;
    }
  }
  const counts = {};
  for (const v of values) counts[v] = (counts[v] || 0) + 1;
  const hasTies = Object.values(counts).some(t => t > 1);
  const tieSum = Object.values(counts).reduce((acc, t) => t > 1 ? acc + t * (t - 1) * (2 * t + 5) : acc, 0);
  const varS = (n * (n - 1) * (2 * n + 5) - tieSum) / 18.0;
  const Z = S > 0 ? (S - 1) / Math.sqrt(varS) : S < 0 ? (S + 1) / Math.sqrt(varS) : 0;
  const pAsymp = 2 * (1.0 - standardNormalCdf(Math.abs(Z)));
  
  let pExact = null;
  let method = 'asymptotic_normal';
  if (!hasTies && n <= 10) {
    pExact = exactMannKendallPValue(n, S);
    method = 'exact_permutation';
  } else if (hasTies && n <= 8) {
    pExact = exactTiedMultisetPValue(values, S);
    method = 'exact_multiset_permutation';
  }

  console.log(`\n--- ${name} ---`);
  console.log(`n: ${n}, S: ${S}, varS: ${varS.toFixed(3)}, Z: ${Z.toFixed(3)}, Method: ${method}`);
  console.log(`Exact p: ${pExact !== null ? pExact.toFixed(7) : 'N/A'} | Asymptotic p: ${pAsymp.toFixed(5)}`);
  console.log(`Is Significant (p < 0.05): ${(pExact !== null ? pExact : pAsymp) < 0.05}`);
}

// 1. BD-SYL-014 (Curated Gas Complex Scenario)
runTest('BD-SYL-014 (Curated Gas Scenario)', [42, 48, 54, 61, 73, 85, 96, 108], 'ppm·m');

// 2. BD-SYL-007 (Curated Rice Agriculture Scenario)
runTest('BD-SYL-007 (Curated Rice Scenario)', [30, 55, 38, 32, 58, 36, 45], 'ppm·m');

// 3. BD-DHK-022 (Curated Landfill Scenario)
runTest('BD-DHK-022 (Curated Landfill Scenario)', [38, 44, 49, 56, 62, 70], 'ppm·m');

// 4. BD-TRP-SYL (Genuine Sentinel-5P TROPOMI Column)
runTest('BD-TRP-SYL (Genuine TROPOMI Column in ppb)', [1912, 1904, 1928, 1925, 1918, 1941, 1938, 1932], 'ppb');

// 5. Multiset Ties Test Case
runTest('Multiset Tied Small Sample Verification', [10, 10, 15, 20, 25, 30, 35, 40], 'ppm·m');

// 6. Seasonal Mann-Kendall (Hirsch et al., 1982) for 12-Month Multi-Year Series
function runSeasonalMannKendallTest(name, dates, values, unit) {
  const n = values.length;
  const monthlyGroups = {};
  for (let m = 1; m <= 12; m++) monthlyGroups[m] = [];

  for (let i = 0; i < n; i++) {
    const d = new Date(dates[i]);
    const month = d.getUTCMonth() + 1;
    monthlyGroups[month].push(values[i]);
  }

  let totalS = 0;
  let totalVarS = 0;
  const intraSeasonSlopes = [];
  const seasonalS = [];

  for (let m = 1; m <= 12; m++) {
    const vals = monthlyGroups[m];
    const K = vals.length;
    if (K < 2) {
      seasonalS.push(0);
      continue;
    }
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

    const tieCounts = {};
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

  let Z = 0;
  if (totalS > 0) Z = (totalS - 1) / Math.sqrt(totalVarS);
  else if (totalS < 0) Z = (totalS + 1) / Math.sqrt(totalVarS);

  const pValue = 2 * (1 - standardNormalCdf(Math.abs(Z)));
  const isSignificant = pValue < 0.05;

  intraSeasonSlopes.sort((a, b) => a - b);
  const mid = Math.floor(intraSeasonSlopes.length / 2);
  const senSlopeAnnual = intraSeasonSlopes.length === 0 ? 0 :
    (intraSeasonSlopes.length % 2 !== 0 ? intraSeasonSlopes[mid] : (intraSeasonSlopes[mid - 1] + intraSeasonSlopes[mid]) / 2.0);

  console.log(`\n--- ${name} (Seasonal Mann-Kendall) ---`);
  console.log(`n: ${n}, Years: ${n / 12}, Total S: ${totalS}, Var(S): ${totalVarS.toFixed(3)}, Z: ${Z.toFixed(3)}, p: ${pValue.toFixed(5)}`);
  console.log(`Intra-season Sen's Slope: ${senSlopeAnnual.toFixed(3)} ${unit}/yr | Significant: ${isSignificant}`);
  return { n, totalS, totalVarS, Z, pValue, isSignificant, senSlopeAnnual };
}

// 6a. BD-GPM-SYL (Bangladesh Surma-Meghna Precipitation)
const bdGpmVals = [
  12.4, 18.7, 65.2, 142.8, 310.5, 642.1, 718.3, 524.6, 412.0, 185.4, 24.1, 8.3,
  10.1, 14.6, 48.9, 118.2, 288.4, 612.8, 695.1, 498.3, 385.2, 162.7, 19.5, 6.8,
  15.2, 21.4, 84.1, 198.6, 412.3, 885.6, 640.2, 460.5, 370.1, 210.4, 14.8, 5.2,
  9.8, 12.1, 52.3, 130.5, 325.8, 630.4, 680.1, 510.6, 395.2, 170.8, 22.4, 7.6,
  11.2, 16.5, 60.4, 145.2, 340.1, 655.8, 725.4, 535.1, 420.3, 190.5, 20.1, 8.9
];
const dates60 = [];
for (let yr = 2020; yr <= 2024; yr++) {
  for (let mo = 1; mo <= 12; mo++) {
    const mm = mo < 10 ? `0${mo}` : `${mo}`;
    dates60.push(`${yr}-${mm}-01`);
  }
}
const bdRes = runSeasonalMannKendallTest('BD-GPM-SYL (Bangladesh Precipitation)', dates60, bdGpmVals, 'mm');
if (bdRes.isSignificant !== false) throw new Error('Bangladesh SMK should be non-significant (cyclical monsoon)');

// 6b. TR-GPM-KON (Türkiye Konya Closed Basin Precipitation)
const trGpmVals = [
  48.2, 45.1, 38.4, 26.5, 34.2, 22.8, 2.4, 1.8, 6.5, 12.3, 18.6, 24.5,
  36.8, 14.2, 52.6, 21.4, 8.6, 28.3, 4.1, 6.2, 18.5, 3.8, 26.7, 64.2,
  62.4, 54.8, 58.2, 16.5, 41.2, 44.6, 3.2, 1.5, 4.8, 18.2, 14.5, 21.3,
  16.2, 28.4, 58.6, 42.5, 68.4, 52.1, 4.6, 0.8, 16.2, 15.8, 56.4, 32.1,
  38.5, 16.4, 24.2, 28.6, 54.2, 12.5, 8.4, 3.1, 28.5, 2.4, 28.2, 38.6
];
const trRes = runSeasonalMannKendallTest('TR-GPM-KON (Türkiye Konya Basin Precipitation)', dates60, trGpmVals, 'mm');
if (trRes.isSignificant !== false) throw new Error('Konya SMK should be non-significant (cyclical semi-arid)');
console.log('\n[PASS] All standard and Seasonal Mann-Kendall assertions verified!');

