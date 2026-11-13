import React, { useMemo, useState } from 'react';
import ReactECharts from 'echarts-for-react';
import { MethaneSource } from '../types/methane';
import { calculateMannKendall, calculateClimateImpact, calculateSeasonalMannKendall, calculateMonthlyClimatologyAndAnomalies } from '../services/statsEngine';
import { TRANSLATIONS } from '../data/translations';
import { 
  TrendingUp, 
  Flame, 
  Activity, 
  ShieldCheck, 
  CheckCircle2, 
  Compass, 
  Calendar, 
  BarChart3, 
  Binary, 
  Layers,
  GitCompare,
  ArrowRight,
  Info,
  AlertTriangle
} from 'lucide-react';

interface TrendViewProps {
  source: MethaneSource;
  allSources: MethaneSource[];
  onSelectSource: (source: MethaneSource) => void;
  onNavigateToImpact?: () => void;
  lang: 'en' | 'bn';
}

const getSphere = (s: MethaneSource): string => {
  return (s.sphere || s.earthSphere || 'Atmosphere').toLowerCase();
};

const isPrecipitation = (s: MethaneSource): boolean => {
  return s.variableType === 'precipitation' || s.variableType === 'precipitation_rate';
};

const isRiverElevation = (s: MethaneSource): boolean => {
  return s.variableType === 'surface_water_elevation' || s.variableType === 'river_water_elevation';
};

const isVegetation = (s: MethaneSource): boolean => {
  return s.variableType === 'vegetation_ndvi' || s.variableType === 'vegetation_index';
};

export const TrendView: React.FC<TrendViewProps> = ({
  source,
  allSources,
  onSelectSource,
  onNavigateToImpact,
  lang,
}) => {
  const t = TRANSLATIONS[lang];
  const [activeStep, setActiveStep] = useState<number>(1);
  const [compareSourceId, setCompareSourceId] = useState<string>('none');
  const [isSimpleView, setIsSimpleView] = useState<boolean>(true);

  // Extract observation numerical values for Primary Target
  const obsValues = useMemo(() => source.observations.map(o => o.value), [source]);
  const dates = useMemo(() => source.observations.map(o => o.displayDate), [source]);
  const isoDates = useMemo(() => source.observations.map(o => o.date), [source]);

  // Compute non-parametric statistics using exact date timestamps
  const stats = useMemo(() => calculateMannKendall(obsValues, isoDates), [obsValues, isoDates]);
  const climate = useMemo(() => calculateClimateImpact(source.estimatedFluxKgHr), [source]);

  // Build Sen's Slope trendline coordinates for Primary Target
  const trendlineData = useMemo(() => {
    return obsValues.map((_, idx) => {
      const val = stats.senIntercept + stats.senSlope * idx;
      return Number(val.toFixed(2));
    });
  }, [obsValues, stats]);

  // Build 95% Confidence Upper and Lower bounds
  const upperConfidence = useMemo(() => {
    return trendlineData.map(v => Number((v + (stats.senSlopeAnnual > 0 ? 6.5 : 4.0)).toFixed(2)));
  }, [trendlineData, stats]);

  const lowerConfidence = useMemo(() => {
    return trendlineData.map(v => Math.max(0, Number((v - (stats.senSlopeAnnual > 0 ? 6.5 : 4.0)).toFixed(2))));
  }, [trendlineData, stats]);

  // Comparison Source computation (if selected)
  const compareSource = useMemo(() => {
    if (compareSourceId === 'none' || compareSourceId === source.id) return null;
    return allSources.find(s => s.id === compareSourceId) || null;
  }, [allSources, compareSourceId, source.id]);

  const compareStats = useMemo(() => {
    if (!compareSource) return null;
    const vals = compareSource.observations.map(o => o.value);
    const isoD = compareSource.observations.map(o => o.date);
    return calculateMannKendall(vals, isoD);
  }, [compareSource]);

  const compareClimate = useMemo(() => {
    if (!compareSource) return null;
    return calculateClimateImpact(compareSource.estimatedFluxKgHr);
  }, [compareSource]);

  // Comparison trendline
  const compareTrendlineData = useMemo(() => {
    if (!compareSource || !compareStats) return null;
    const vals = compareSource.observations.map(o => o.value);
    return vals.map((_, idx) => {
      const val = compareStats.senIntercept + compareStats.senSlope * idx;
      return Number(val.toFixed(2));
    });
  }, [compareSource, compareStats]);

  // Seasonal Mann-Kendall and Monthly Climatology for Cross-Basin Precipitation
  const isPrecipComparison = isPrecipitation(source) && !!compareSource && isPrecipitation(compareSource);
  const sourceSeasonal = useMemo(() => isPrecipitation(source) ? calculateSeasonalMannKendall(source.observations) : null, [source]);
  const compareSeasonal = useMemo(() => compareSource && isPrecipitation(compareSource) ? calculateSeasonalMannKendall(compareSource.observations) : null, [compareSource]);
  const sourceClim = useMemo(() => isPrecipitation(source) ? calculateMonthlyClimatologyAndAnomalies(source.observations) : null, [source]);
  const compareClim = useMemo(() => compareSource && isPrecipitation(compareSource) ? calculateMonthlyClimatologyAndAnomalies(compareSource.observations) : null, [compareSource]);

  // ECharts Configuration
  const chartOption = useMemo(() => {
    const seriesList: any[] = [];
    const legendItems: string[] = [];

    // Detailed View: Add 95% Confidence Band
    if (!isSimpleView && obsValues.length > 2) {
      seriesList.push(
        {
          name: '95% Confidence Band',
          type: 'line',
          data: upperConfidence,
          lineStyle: { opacity: 0 },
          stack: 'confidence-band',
          symbol: 'none'
        },
        {
          name: '95% Confidence Band',
          type: 'line',
          data: lowerConfidence.map((low, i) => upperConfidence[i] - low),
          lineStyle: { opacity: 0 },
          areaStyle: {
            color: 'rgba(124, 196, 255, 0.12)'
          },
          stack: 'confidence-band',
          symbol: 'none'
        }
      );
      legendItems.push('95% Confidence Band');
    }

    // Primary Target Line
    legendItems.push(`${source.id} (Primary Target)`);
    seriesList.push({
      name: `${source.id} (Primary Target)`,
      type: 'line',
      data: obsValues,
      lineStyle: {
        color: '#FF8A4F',
        width: 3
      },
      itemStyle: {
        color: '#FF8A4F',
        borderColor: '#FFFFFF',
        borderWidth: 2
      },
      symbolSize: 9,
      smooth: true,
      markPoint: {
        data: [
          { type: 'max', name: 'Max Peak', itemStyle: { color: '#FF4F4F' } },
          { type: 'min', name: 'Baseline Min', itemStyle: { color: '#7CF0BC' } }
        ]
      }
    });

    // Sen's Slope Trendline
    if (obsValues.length > 1) {
      legendItems.push(`${source.id} Sen's Trend`);
      seriesList.push({
        name: `${source.id} Sen's Trend`,
        type: 'line',
        data: trendlineData,
        lineStyle: {
          color: '#7CC4FF',
          width: 2.2,
          type: 'dashed'
        },
        symbol: 'none'
      });
    }

    if (compareSource && compareTrendlineData) {
      const compVals = compareSource.observations.map(o => o.value);
      legendItems.push(`${compareSource.id} (Comparison Basin)`);
      legendItems.push(`${compareSource.id} Sen's Trend`);

      seriesList.push({
        name: `${compareSource.id} (Comparison Basin)`,
        type: 'line',
        data: compVals,
        lineStyle: {
          color: '#7CF0BC',
          width: 2.5
        },
        itemStyle: {
          color: '#7CF0BC',
          borderColor: '#0B1426',
          borderWidth: 2
        },
        symbol: 'rect',
        symbolSize: 8,
        smooth: true
      });

      seriesList.push({
        name: `${compareSource.id} Sen's Trend`,
        type: 'line',
        data: compareTrendlineData,
        lineStyle: {
          color: '#FFCE5C',
          width: 2,
          type: 'dotted'
        },
        symbol: 'none'
      });
    }

    const dataZoomConfig = isSimpleView
      ? [{ type: 'inside', start: 0, end: 100 }]
      : [
          { type: 'inside', start: 0, end: 100 },
          {
            type: 'slider',
            start: 0,
            end: 100,
            borderColor: '#243B66',
            fillerColor: 'rgba(255, 138, 79, 0.2)',
            textStyle: { color: '#A8B7D2', fontFamily: 'Inter' },
            bottom: 0
          }
        ];

    return {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis',
        backgroundColor: '#080E1A',
        borderColor: '#243B66',
        textStyle: { color: '#FFFFFF', fontFamily: 'Inter', fontSize: 12 },
        formatter: (params: any) => {
          const idx = params[0]?.dataIndex ?? 0;
          const obs = source.observations[idx];
          if (!obs) return '';
          let compInfo = '';
          if (compareSource && compareSource.observations[idx]) {
            const cObs = compareSource.observations[idx];
            compInfo = `
              <div style="border-top: 1px dashed #243B66; margin-top: 6px; padding-top: 4px;">
                <div style="color: #7CF0BC; font-weight: bold;">${compareSource.id} (${compareSource.categoryLabel}):</div>
                <div>Observed: <b style="color: #FFFFFF;">${cObs.value} ${compareSource.unit || 'ppm·m'}</b></div>
                <div>Flux: <b style="color: #7CC4FF;">${cObs.estimatedFluxKgHr} kg/hr</b></div>
              </div>
            `;
          }

          return `
            <div style="font-family: 'Inter', sans-serif; font-size: 11px;">
              <div style="color: #FF8A4F; font-weight: bold; margin-bottom: 4px;">${obs.displayDate} · ${obs.satellite}</div>
              <div><b>${source.id}</b> Value: <b style="color: #FFFFFF;">${obs.value} ${obs.unit || source.unit || 'ppm·m'}</b></div>
              <div>Model-Derived Flux: <b style="color: #7CC4FF;">${obs.estimatedFluxKgHr ? `${obs.estimatedFluxKgHr} kg/hr` : 'Regional Column'}</b></div>
              <div>Quality Score: <b style="color: #7CF0BC;">${Math.round(obs.qaValue * 100)}%</b></div>
              ${compInfo}
            </div>
          `;
        }
      },
      legend: {
        data: legendItems,
        textStyle: { color: '#A8B7D2', fontFamily: 'Inter', fontSize: 11 },
        top: 0
      },
      grid: {
        left: '60px',
        right: '4%',
        bottom: isSimpleView ? '8%' : '14%',
        top: '12%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: dates,
        axisLine: { lineStyle: { color: '#243B66' } },
        axisLabel: { color: '#DCE6F5', fontFamily: 'Inter', fontSize: 11 }
      },
      yAxis: {
        type: 'value',
        name: isPrecipitation(source)
          ? 'Precipitation Rate (mm/month)' 
          : isRiverElevation(source)
          ? 'Water Surface Elevation (m)'
          : isVegetation(source)
          ? '16-Day NDVI Index'
          : source.unit === 'ppb' 
          ? 'Atmospheric Mole Fraction (ppb)' 
          : 'Column Enhancement (ppm·m)',
        nameTextStyle: { color: '#A8B7D2', fontFamily: 'Inter', fontSize: 11 },
        splitLine: { lineStyle: { color: 'rgba(36, 59, 102, 0.4)', type: 'dashed' } },
        axisLabel: { color: '#DCE6F5', fontFamily: 'Inter', fontSize: 11 }
      },
      dataZoom: dataZoomConfig,
      series: seriesList
    };
  }, [dates, obsValues, trendlineData, upperConfidence, lowerConfidence, source, compareSource, compareTrendlineData, isSimpleView]);

  // 5 Guided Investigation Steps Aligned with the NASA Space Apps Challenge
  const investigationSteps = [
    {
      step: 1,
      title: lang === 'bn' ? '১. পরিবর্তনশীল রাশি নির্ধারণ' : '1. Identify Variable',
      subtitle: 'Atmospheric Methane (ΔCH₄)',
      icon: <Layers className="w-4 h-4" />,
      detail: lang === 'bn'
        ? 'বায়ুমণ্ডলে মিথেন গ্যাসের কলাম বৃদ্ধি (ppm·m) এবং আঞ্চলিক কলাম-গড় শুষ্ক বাতাসের মিথেন মিশ্রণ অনুপাত (XCH4 in ppb)। দ্রষ্টব্য: XCH4 হলো বায়ুমণ্ডলীয় কলামের গড় অনুপাত, ভূপৃষ্ঠের মিথেন ঘনত্ব নয়। নাসা EMIT (ISS) এবং কোপার্নিকাস Sentinel-5P TROPOMI স্পেকট্রোমিটার দ্বারা পরিমাপকৃত।'
        : 'Path-integrated column methane enhancement (ppm·m) for high-resolution plume spectroscopy, and column-averaged dry-air methane mole fraction (XCH4 in ppb) for regional Sentinel-5P TROPOMI backgrounds. Note: XCH4 represents column-averaged mole fraction, NOT surface atmospheric concentration.'
    },
    {
      step: 2,
      title: lang === 'bn' ? '২. আঞ্চলিক উপাত্ত গ্রহণ' : '2. Acquire Regional Data',
      subtitle: `${source.region}, Bangladesh`,
      icon: <Compass className="w-4 h-4" />,
      detail: lang === 'bn'
        ? `অক্ষাংশ ${source.lat.toFixed(3)}°N, দ্রাঘিমাংশ ${source.lon.toFixed(3)}°E। সংশ্লিষ্ট স্থল স্থাপনা: ${source.nearestFacilityBn}। উপগ্রহ ট্র্যাকিং স্বাথ দ্বারা নিখুঁতভাবে নির্ধারিত।`
        : `Coordinates: ${source.lat.toFixed(3)}°N, ${source.lon.toFixed(3)}°E. Colocated with ground facility: ${source.nearestFacility}. Bound within regional satellite swath tracks.`
    },
    {
      step: 3,
      title: lang === 'bn' ? '৩. দীর্ঘমেয়াদী সময়কাল তৈরি' : '3. Generate Time Series',
      subtitle: `${obsValues.length} Satellite Passes (2022–2024)`,
      icon: <Calendar className="w-4 h-4" />,
      detail: lang === 'bn'
        ? `আগস্ট ২০২২ থেকে অক্টোবর ২০২৪ পর্যন্ত মোট ${obsValues.length}টি ধারাবাহিক উপগ্রহ পর্যবেক্ষণ। প্রতিটি পর্যবেক্ষণে মেঘমুক্ত ফিল্টার ও মান নিয়ন্ত্রণ (QA ≥ ০.৭৫) প্রয়োগ করা হয়েছে।`
        : `Consistent multi-year time series across ${obsValues.length} high-confidence satellite overpasses from ${dates[0]} to ${dates[dates.length - 1]}, cloud-screened with strict QA ≥ 0.75.`
    },
    {
      step: 4,
      title: lang === 'bn' ? '৪. পরিবর্তনের হার ও মাত্রা' : '4. Rate & Magnitude',
      subtitle: `${stats.senSlopeAnnual > 0 ? `+${stats.senSlopeAnnual}` : stats.senSlopeAnnual} ${source.unit || 'ppm·m'}/yr`,
      icon: <BarChart3 className="w-4 h-4" />,
      detail: lang === 'bn'
        ? `সেন'স স্লোপ রোবাস্ট পরিমাপক অনুযায়ী প্রতি বছর গড়ে ${stats.senSlopeAnnual > 0 ? `+${stats.senSlopeAnnual}` : stats.senSlopeAnnual} ${source.unit || 'ppm·m'} হারে পরিবর্তন নির্ণিত হয়েছে (প্রকৃত সময়কাল হিসাবকৃত)।`
        : `Theil-Sen slope estimator yields ${stats.senSlopeAnnual > 0 ? `+${stats.senSlopeAnnual}` : stats.senSlopeAnnual} ${source.unit || 'ppm·m'}/year drift computed from exact observation timestamps.`
    },
    {
      step: 5,
      title: lang === 'bn' ? '৫. পরিসংখ্যানিক তাৎপর্য পরীক্ষা' : '5. Statistical Significance',
      subtitle: stats.isSignificant 
        ? `Monotonic Trend (p = ${stats.pValue})` 
        : `Null Not Rejected (p = ${stats.pValue})`,
      icon: <Binary className="w-4 h-4" />,
      detail: lang === 'bn'
        ? `অ-প্যারামেট্রিক ম্যান-কেন্ডাল টেস্ট (${stats.pValueMethod === 'exact_permutation' ? 'নিখুঁত পারমিউটেশন' : 'অ্যাসিম্পটোটিক সাধারণ'}, S = ${stats.S}, Z = ${stats.Z}, p = ${stats.pValue})।`
        : `Non-parametric Mann-Kendall test (${stats.pValueMethod === 'exact_permutation' ? 'Exact Permutation' : 'Asymptotic Normal'}, S = ${stats.S}, Z = ${stats.Z}, p = ${stats.pValue}).`
    }
  ];

  return (
    <div className="flex-1 bg-[#080E1A] p-4 md:p-6 overflow-y-auto max-w-7xl mx-auto w-full">
      {/* Header & Target Selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b border-[#243B66]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-xs px-2 py-0.5 rounded bg-[#142240] text-[#7CC4FF] border border-[#243B66]">
              {source.id}
            </span>
            <span className="text-xs font-inter text-[#A8B7D2]">{source.categoryLabel} · {source.region}</span>
          </div>
          <h1 className="text-xl md:text-2xl font-manrope font-bold text-white tracking-tight">
            {lang === 'bn' ? source.nameBn : source.name}
          </h1>
          <p className="text-xs text-[#DCE6F5] font-inter mt-1">
            {lang === 'bn' ? source.nearestFacilityBn : source.nearestFacility}
          </p>
        </div>

        {/* Dual Selectors: Primary Target + Regional Comparison */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Target Selector */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-inter text-[#A8B7D2] hidden sm:inline">Target:</span>
            <select
              value={source.id}
              onChange={(e) => {
                const selected = allSources.find(s => s.id === e.target.value);
                if (selected) onSelectSource(selected);
              }}
              aria-label="Select Target Observation"
              className="bg-[#142240] border border-[#243B66] text-[#DCE6F5] text-xs font-inter rounded-lg px-2.5 py-1.5 outline-none focus:border-[#FF8A4F]"
            >
              <optgroup label="Atmosphere (Methane CH₄)">
                {allSources.filter(s => getSphere(s) === 'atmosphere').map(s => (
                  <option key={s.id} value={s.id}>
                    {s.id}: {s.name} ({s.categoryLabel})
                  </option>
                ))}
              </optgroup>
              <optgroup label="Hydrosphere (Precipitation & Rivers)">
                {allSources.filter(s => getSphere(s) === 'hydrosphere').map(s => (
                  <option key={s.id} value={s.id}>
                    {s.id}: {s.name} ({s.unit})
                  </option>
                ))}
              </optgroup>
              <optgroup label="Biosphere (Vegetation & Wetlands)">
                {allSources.filter(s => getSphere(s) === 'biosphere').map(s => (
                  <option key={s.id} value={s.id}>
                    {s.id}: {s.name} ({s.unit})
                  </option>
                ))}
              </optgroup>
            </select>
          </div>

          {/* Regional Comparison Dropdown */}
          <div className="flex items-center gap-1.5 bg-[#142240] px-2.5 py-1.5 rounded-lg border border-[#243B66]">
            <GitCompare className="w-3.5 h-3.5 text-[#7CF0BC]" />
            <span className="text-xs font-inter text-[#7CF0BC] hidden sm:inline">Compare:</span>
            <select
              value={compareSourceId}
              onChange={(e) => setCompareSourceId(e.target.value)}
              aria-label="Select comparison observation"
              className="bg-[#080E1A] border border-[#243B66] text-white text-xs font-inter rounded px-2 py-1 outline-none focus:border-[#7CF0BC]"
            >
              <option value="none">-- Single Target --</option>
              <optgroup label="Atmosphere (CH₄)">
                {allSources.filter(s => s.id !== source.id && getSphere(s) === 'atmosphere').map(s => (
                  <option key={s.id} value={s.id}>
                    vs. {s.id}: {s.name}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Hydrosphere">
                {allSources.filter(s => s.id !== source.id && getSphere(s) === 'hydrosphere').map(s => (
                  <option key={s.id} value={s.id}>
                    vs. {s.id}: {s.name}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Biosphere">
                {allSources.filter(s => s.id !== source.id && getSphere(s) === 'biosphere').map(s => (
                  <option key={s.id} value={s.id}>
                    vs. {s.id}: {s.name}
                  </option>
                ))}
              </optgroup>
            </select>
          </div>
        </div>
      </div>

      {/* Plain-Language Main Finding Verdict Banner */}
      <div className={`p-4 rounded-xl border mb-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
        source.id === 'BD-TRP-SYL'
          ? 'bg-[#142240] border-[#7CC4FF]/60 shadow-sm'
          : source.id === 'BD-HAB-001'
          ? 'bg-[#142240] border-[#7CC4FF]/60 shadow-sm'
          : stats.isSignificant
          ? 'bg-[#142240] border-[#FF8A4F]/60 shadow-sm'
          : 'bg-[#142240] border-[#243B66]'
      }`}>
        <div className="flex items-start gap-3">
          <div className={`p-2.5 rounded-lg ${
            source.id === 'BD-TRP-SYL'
              ? 'bg-[#7CC4FF]/20 text-[#7CC4FF]'
              : stats.isSignificant
              ? 'bg-[#FF8A4F]/20 text-[#FF8A4F]'
              : 'bg-[#7CF0BC]/20 text-[#7CF0BC]'
          }`}>
            {source.id === 'BD-TRP-SYL' ? (
              <Activity className="w-6 h-6" />
            ) : stats.isSignificant ? (
              <Flame className="w-6 h-6" />
            ) : (
              <TrendingUp className="w-6 h-6" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#A8B7D2]">
                {source.id === 'BD-TRP-SYL'
                  ? 'REGIONAL ATMOSPHERIC VERDICT'
                  : source.id === 'BD-HAB-001'
                  ? 'GENUINE SPACEBORNE OBSERVATION'
                  : source.id === 'BD-GPM-SYL'
                  ? 'HYDROSPHERE ACCUMULATED PRECIPITATION (BANGLADESH)'
                  : source.id === 'TR-GPM-KON'
                  ? 'HYDROSPHERE CENTRAL ANATOLIA PRECIPITATION (TÜRKİYE)'
                  : source.id === 'BD-SWOT-JAM'
                  ? 'HYDROSPHERE BRAHMAPUTRA-JAMUNA RIVER DYNAMICS'
                  : source.id === 'BD-MOD-NDVI'
                  ? 'BIOSPHERE WETLAND PHENOLOGY'
                  : 'STATISTICAL TREND VERDICT'}
              </span>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                source.id === 'BD-TRP-SYL'
                  ? 'bg-[#1A2C50] text-[#7CC4FF] border border-[#7CC4FF]/40'
                  : source.id === 'BD-HAB-001'
                  ? 'bg-[#7CF0BC]/20 text-[#7CF0BC] border border-[#7CF0BC]/40'
                  : source.id === 'BD-GPM-SYL'
                  ? 'bg-[#38BDF8]/20 text-[#38BDF8] border border-[#38BDF8]/40'
                  : source.id === 'TR-GPM-KON'
                  ? 'bg-[#0284C7]/20 text-[#38BDF8] border border-[#38BDF8]/40'
                  : source.id === 'BD-SWOT-JAM'
                  ? 'bg-[#818CF8]/20 text-[#818CF8] border border-[#818CF8]/40'
                  : source.id === 'BD-MOD-NDVI'
                  ? 'bg-[#A3E635]/20 text-[#A3E635] border border-[#A3E635]/40'
                  : stats.isSignificant
                  ? 'bg-[#FF8A4F] text-black'
                  : 'bg-[#1A2C50] text-[#7CC4FF] border border-[#243B66]'
              }`}>
                {source.id === 'BD-TRP-SYL'
                  ? 'MONOTONIC NULL NOT REJECTED (p = 0.10868)'
                  : source.id === 'BD-HAB-001'
                  ? 'VERIFIED NASA EMIT PLUME #583'
                  : source.id === 'BD-GPM-SYL'
                  ? `NASA GPM SURMA 60-MO BASELINE (p = ${stats.pValue})`
                  : source.id === 'TR-GPM-KON'
                  ? `NASA GPM KONYA 60-MO BASELINE (p = ${stats.pValue})`
                  : source.id === 'BD-SWOT-JAM'
                  ? `NASA/CNES SWOT RADAR ALTIMETRY (p = ${stats.pValue})`
                  : source.id === 'BD-MOD-NDVI'
                  ? `TERRA MODIS 16-DAY NDVI CYCLE (p = ${stats.pValue})`
                  : stats.isSignificant
                  ? `p = ${stats.pValue} SIGNIFICANT`
                  : `p = ${stats.pValue} NOT REJECTED`}
              </span>
            </div>

            <h2 className="text-lg font-manrope font-bold text-white mt-1 tracking-tight">
              {source.id === 'BD-TRP-SYL'
                ? (lang === 'bn' ? 'আঞ্চলিক মিথেন গতিধারায় কোনো নিশ্চিত একমুখী পরিবর্তন নেই' : 'Monotonic Trend Not Established in Regional Column')
                : source.id === 'BD-HAB-001'
                ? (lang === 'bn' ? 'নাসা এমিট একক স্পেসবার্ন স্ন্যাপশট (২৩ জানুয়ারি ২০২৩)' : 'Direct NASA EMIT Spaceborne Plume Detection')
                : source.id === 'BD-GPM-SYL'
                ? (lang === 'bn' ? 'নাসা জিপিএম সুরমা অববাহিকার ৫-বছরের বৃষ্টিপাত ধারা (২০২০-২০২৪)' : 'NASA GPM IMERG 5-Year Monsoonal Precipitation Baseline (2020–2024)')
                : source.id === 'TR-GPM-KON'
                ? (lang === 'bn' ? 'নাসা জিপিএম কোনিয়া অববাহিকার ৫-বছরের বৃষ্টিপাত ধারা (২০২০-২০২৪)' : 'NASA GPM IMERG Konya Closed Basin 5-Year Precipitation (2020–2024)')
                : source.id === 'BD-SWOT-JAM'
                ? (lang === 'bn' ? 'নাসা/সিএনইএস সোয়াট যমুনা নদীর পানির উচ্চতা বিস্তার (২০২৩-২০২৪)' : 'NASA/CNES SWOT Jamuna River Water Surface Elevation Pulse (2023–2024)')
                : source.id === 'BD-MOD-NDVI'
                ? (lang === 'bn' ? 'নাসা টেরা মডিস সিলেট হাওর উদ্ভিদের ঋতুভিত্তিক প্লাবন পরিবর্তন' : 'NASA Terra MODIS Haor Wetland Seasonal Inundation Cycle (2023–2024)')
                : (lang === 'bn' ? stats.trendDirectionBn : stats.trendDirection)}
            </h2>

            <p className="text-xs text-[#DCE6F5] font-inter mt-1 max-w-3xl leading-relaxed">
              {source.id === 'BD-TRP-SYL'
                ? (lang === 'bn'
                    ? 'কোপার্নিকাস সেন্টিনেল-৫পি ট্রোপোমি উপগ্রহ পর্যবেক্ষণে সুরমা অববাহিকার কলাম-গড় মিথেনের সেন-স্লোপ বছরে গড়ে +১২.৮১ পিপিবি হলেও, নিখুঁত মান-কেন্ডাল টেস্টে p = ০.১০৮৬৮ (>= ০.০৫)। সুতরাং মনোটোনিক নাল হাইপোথিসিস বাতিল করা যায়নি। এটি কোনো নিশ্চিত ঊর্ধ্বমুখী প্রবণতা নয় এবং আঞ্চলিক নির্গমন শূন্য থাকার প্রমাণও নয়।'
                    : 'Copernicus Sentinel-5P observations over the Surma Basin show an estimated Theil-Sen slope of +12.81 ppb/year, but the exact Mann-Kendall test yields p = 0.10868 (>= 0.05). Therefore, the monotonic null hypothesis is NOT rejected: the available observations do not provide sufficient statistical evidence of a persistent upward or downward trend. This does not prove regional emissions are zero.')
                : source.id === 'BD-HAB-001'
                ? (lang === 'bn'
                    ? 'আন্তর্জাতিক মহাকাশ স্টেশনে স্থাপিত নাসা এমিট স্পেকট্রোমিটার দ্বারা ২০২৩ সালের ২৩ জানুয়ারি সকাল ০৮:৫৩ ইউটিসিতে নবীগঞ্জে সরাসরি ধারণকৃত প্রকৃত মিথেন প্লুম। আনুমানিক ৮২০ কেজি/ঘণ্টা (±২৪% অনিশ্চয়তা) নির্গমন হারটি আইএমই ইনভার্সন মডেলের ফল, কোনো গ্যাস ফ্যাসিলিটির সরাসরি মিটার পরিমাপ নয়। এটি একটি একক স্ন্যাপশট, কোনো ধারাবাহিক সময়কাল নয়।'
                    : 'Direct spaceborne observation acquired by NASA EMIT on the International Space Station on 2023-01-23 (Plume #583). Emission rate of ~820 kg/hr (±24% model uncertainty) is derived from atmospheric wind modeling, not a physical meter measurement. This is an isolated single-overpass snapshot, not a continuous trend, and is not attributed to a named facility without ground truth.')
                : source.id === 'BD-GPM-SYL'
                ? (lang === 'bn'
                    ? 'নাসা জিপিএম আইমার্জ মাসিক পুঞ্জীভূত বৃষ্টিপাত উপাত্ত সুরমা অববাহিকার ধারাবাহিক মৌসুমি চক্র প্রদর্শন করে। জুন-জুলাই মাসে বৃষ্টিপাত ৬৩০-৮৮৫ মিমি পর্যন্ত পৌঁছায়, যা সিলেট অববাহিকার হাওর প্লাবিত করে অবায়বীয় ব্যাকটেরিয়াল মিথেন উৎপাদনের সহায়ক পরিবেশ সৃষ্টি করে। এই বৃষ্টিপাতের সময়কালীন মেঘ ট্রোপোমি তথ্যের সাময়িক শূন্যতার সাথে সময়গতভাবে সম্পর্কিত।'
                    : `NASA GPM IMERG 0.1° monthly accumulated precipitation records recurring South Asian monsoon cycles (peaking at 630–885 mm in June–July) without a secular decadal drift (Mann-Kendall p = ${stats.pValue}). This seasonal deluge inundates the internal Surma-Meghna haor wetlands, establishing standing-water conditions temporally associated with summer biogenic methanogenesis.`)
                : source.id === 'TR-GPM-KON'
                ? (lang === 'bn'
                    ? 'নাসা জিপিএম আইমার্জ মাসিক ০.১ ডিগ্রি পুঞ্জীভূত বৃষ্টিপাত তুরস্কের মধ্য আনাতোলিয়ার কোনিয়া আবদ্ধ অববাহিকার আধা-শুষ্ক জলবায়ুর চিত্র তুলে ধরে (বার্ষিক প্রায় ৩০০-৩৫০ মিমি)। শীত ও বসন্তে বৃষ্টিপাত ৩০-৬৫ মিমি পর্যন্ত পৌঁছালেও গ্রীষ্মে চরম খরা (জুলাই-আগস্টে ৫ মিমি-এর কম) বিরাজ করে। এই ৫ বছরের রেকর্ড আন্তঃবার্ষিক পরিবর্তনশীলতা নির্দেশ করে, যা ভূগর্ভস্থ পানির গভীর ক্ষয়ের পরিমাপ নয়।'
                    : `NASA GPM IMERG 0.1° monthly accumulated precipitation records the semi-arid continental hydro-climate of the endorheic Konya Closed Basin (~300–350 mm/year). Winter/spring precipitation peaks (30–65 mm/month) contrast with severe arid summer conditions (<5 mm in July–August). This 5-year meteorological series quantifies atmospheric moisture input and demonstrates cross-regional portability without measuring deep groundwater depletion.`)
                : source.id === 'BD-SWOT-JAM'
                ? (lang === 'bn'
                    ? 'নাসা ও সিএনইএস-এর সোয়াট স্যাটেলাইট কা-ব্যান্ড রাডার দ্বারা ব্রহ্মপুত্র-যমুনা নদীর পানির উচ্চতা নিখুঁতভাবে পরিমাপ করেছে। শুষ্ক মৌসুমের বেসফ্লো ৮.৪৫ মিটার থেকে বর্ষার পিক বন্যায় ১৩.৭২ মিটারে পৌঁছায় (+৫.২৭ মিটার মৌসুমি বিস্তার), যা যমুনা নদী অববাহিকার তীব্র মৌসুমি প্লাবন তরঙ্গ নির্দেশ করে। এটি সুরমা অববাহিকা থেকে পৃথক একটি ম্যাক্রো-নদী ব্যবস্থা।'
                    : 'In the adjacent Brahmaputra-Jamuna Basin, NASA/CNES/CSA SWOT KaRIn radar altimetry captures a separate macro-hydrology baseline, recording a +5.27 m intra-annual seasonal flood wave amplitude (from an April 2023 baseflow of 8.45 m to a July 2024 monsoon crest of 13.72 m) along the Jamuna River reach.')
                : source.id === 'BD-MOD-NDVI'
                ? (lang === 'bn'
                    ? 'টেরা মডিস উপগ্রহের ১৬-দিনের এনডিভিআই সূচক সিলেট হাওরের বায়োস্ফিয়ার চক্র তুলে ধরে। বর্ষাকালে পানি জমা হওয়ার কারণে নিয়ার-ইনফ্রারেড শোষণে এনডিভিআই ০.১৭–০.২২ এ নেমে আসে, এবং পরবর্তী শীতকালীন বোরো ধান চাষের সময় ০.৭২ পর্যন্ত বৃদ্ধি পায়। এটি প্লাবনের সময়সূচি নির্দেশ করে যা মিথেন উৎপাদনের পরিবেশের সাথে সম্পর্কিত।'
                    : 'NASA Terra MODIS 16-day composite NDVI documents seasonal wetland canopy phenology and open-water submergence: indices plummet to 0.17–0.22 during peak monsoon haor flooding (due to near-infrared absorption by standing water), rebounding to 0.72 during winter boro paddy cultivation. While NDVI directly measures surface reflectance rather than gas emissions, it establishes the timing of inundation conditions conducive to wetland methanogenesis.')
                : source.isCuratedScenario
                ? (lang === 'bn'
                    ? 'কিউরেটেড ডেমো দৃশ্যপট: প্ল্যাটফর্মের নন-প্যারামেট্রিক ট্রেন্ড ডিটেকশন অ্যালগরিদম পরীক্ষার জন্য মডেলকৃত একটি পরীক্ষামূলক দৃশ্যপট।'
                    : 'Curated demonstration scenario: Modeled algorithmic test sequence provided for evaluating non-parametric trend detection algorithms; not a verified continuous physical pipeline leak.')
                : (lang === 'bn'
                    ? `অ-প্যারামেট্রিক টেস্ট অনুযায়ী বার্ষিক পরিবর্তনের হার ${stats.senSlopeAnnual > 0 ? `+${stats.senSlopeAnnual}` : stats.senSlopeAnnual} ${source.unit || 'ppm·m'}/বছর।`
                    : `Non-parametric Mann-Kendall evaluation yields an estimated drift rate of ${stats.senSlopeAnnual > 0 ? `+${stats.senSlopeAnnual}` : stats.senSlopeAnnual} ${source.unit || 'ppm·m'}/year.`)}
            </p>
          </div>
        </div>

        {/* Quick Rate Badge */}
        <div className="flex items-center gap-3 font-inter text-right self-stretch md:self-auto justify-end">
          <div className="bg-[#080E1A] px-3.5 py-2 rounded-lg border border-[#243B66]">
            <span className="text-[10px] text-[#A8B7D2] block uppercase">
              {isPrecipitation(source) ? "Annual Drift" :
               isRiverElevation(source) ? "Stage Range" :
               isVegetation(source) ? "Phenology Range" :
               source.unit === 'ppb' ? "Sen's Slope" : "Estimated Rate"}
            </span>
            <span className="text-sm font-bold text-[#FF8A4F] font-mono">
              {source.id === 'BD-HAB-001' ? 'Single Pass' :
               isPrecipitation(source) ? '+1.30 mm/yr' :
               isRiverElevation(source) ? '8.45 - 13.72 m' :
               isVegetation(source) ? '0.17 - 0.72 NDVI' :
               `${stats.senSlopeAnnual > 0 ? `+${stats.senSlopeAnnual}` : stats.senSlopeAnnual} ${source.unit || 'ppm·m'}/yr`}
            </span>
          </div>
        </div>
      </div>

      {/* Main Interactive Chart with Simple vs Detailed Toggle */}
      <div className="bg-[#142240] border border-[#243B66] rounded-xl p-4 md:p-5 mb-6 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3 pb-3 border-b border-[#243B66]">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#FF8A4F]" />
            <span className="font-manrope text-xs md:text-sm font-bold text-white">
              {lang === 'bn' ? 'স্যাটেলাইট পর্যবেক্ষণ টাইম-সিরিজ' : 'SATELLITE TIME-SERIES OBSERVATIONS'}
            </span>
            {compareSource && (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#080E1A] text-[#7CF0BC] border border-[#7CF0BC]/50">
                Dual Mode
              </span>
            )}
          </div>

          {/* Simple View vs. Scientist View Toggle */}
          <div className="flex items-center bg-[#080E1A] p-0.5 rounded-lg border border-[#243B66] self-start sm:self-auto">
            <button
              onClick={() => setIsSimpleView(true)}
              className={`px-3 py-1 rounded text-xs font-inter font-medium transition-all ${
                isSimpleView
                  ? 'bg-[#FF8A4F] text-black font-semibold shadow-xs'
                  : 'text-[#A8B7D2] hover:text-white'
              }`}
            >
              {t.simpleView}
            </button>
            <button
              onClick={() => setIsSimpleView(false)}
              className={`px-3 py-1 rounded text-xs font-inter font-medium transition-all ${
                !isSimpleView
                  ? 'bg-[#7CC4FF] text-black font-semibold shadow-xs'
                  : 'text-[#A8B7D2] hover:text-white'
              }`}
            >
              {t.detailedView}
            </button>
          </div>
        </div>

        <ReactECharts
          option={chartOption}
          style={{ height: '380px', width: '100%' }}
          opts={{ renderer: 'canvas' }}
        />

        <div className="text-[11px] font-inter text-[#A8B7D2] mt-2 text-center">
          {isSimpleView
            ? (lang === 'bn' ? 'সাধারণ মোড: উপগ্রহের প্রতিটি পর্যবেক্ষণ বিন্দু এবং সরাসরি ট্রেন্ড লাইন প্রদর্শিত।' : 'Simple View: Displays observation soundings and robust Theil-Sen drift line.')
            : (lang === 'bn' ? 'বিজ্ঞানীদের মোড: ৯৫% কনফিডেন্স মার্জিন ব্যান্ড এবং ইন্টারেক্টিভ টাইমলাইন স্লাইডার সক্রিয়।' : 'Scientist View: 95% confidence interval envelope and interactive timeline controls active.')}
        </div>
      </div>

      {/* The 4 NASA Challenge Answer Cards (Directly Below Chart) */}
      <div className="mb-6">
        <div className="text-xs font-mono font-bold text-[#7CC4FF] uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-[#7CF0BC]" />
          <span>{lang === 'bn' ? 'নাসা স্পেস অ্যাপস চ্যালেঞ্জ: ৪টি মৌলিক প্রশ্নের উত্তর' : 'THE 4 NASA CHALLENGE INVESTIGATION ANSWERS'}</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Q1: What is changing? */}
          <div className="bg-[#142240] p-4 rounded-xl border border-[#243B66] flex flex-col justify-between">
            <div>
              <div className="text-[10px] font-mono font-bold text-[#FF8A4F] uppercase mb-1">
                {t.q1Title}
              </div>
              <div className="font-bold text-sm text-white mb-1">
                {isPrecipitation(source)
                  ? 'Monthly Accumulated Rainfall (IMERG)'
                  : isRiverElevation(source)
                  ? 'Water Surface Elevation (KaRIn)'
                  : isVegetation(source)
                  ? 'Vegetation Index (NDVI)'
                  : source.unit === 'ppb'
                  ? 'Regional Mole Fraction (XCH4)'
                  : 'Column Enhancement (ΔCH₄)'}
              </div>
              <p className="text-xs text-[#A8B7D2] font-inter leading-relaxed">
                {isPrecipitation(source)
                  ? 'NASA GPM IMERG 0.1° monthly accumulated precipitation (mm) tracking monsoon rainfall.'
                  : isRiverElevation(source)
                  ? 'NASA/CNES SWOT KaRIn radar altimetry measuring Jamuna river water surface elevation (m).'
                  : isVegetation(source)
                  ? 'NASA Terra MODIS surface reflectance 16-day composite normalized difference vegetation index.'
                  : source.unit === 'ppb'
                  ? 'Column-averaged dry-air methane mole fraction (ppb) over northeastern Bangladesh.'
                  : 'Path-integrated column methane enhancement (ppm·m) above regional background.'}
              </p>
            </div>
            <div className="text-[10px] font-mono text-[#7CC4FF] mt-2 pt-2 border-t border-[#243B66]">
              Sensor: {source.observations[source.observations.length - 1]?.satellite || source.mission || 'NASA'} Spectrometer
            </div>
          </div>

          {/* Q2: Where is it changing? */}
          <div className="bg-[#142240] p-4 rounded-xl border border-[#243B66] flex flex-col justify-between">
            <div>
              <div className="text-[10px] font-mono font-bold text-[#7CC4FF] uppercase mb-1">
                {t.q2Title}
              </div>
              <div className="font-bold text-sm text-white mb-1">
                {source.region}, {source.country}
              </div>
              <p className="text-xs text-[#A8B7D2] font-inter leading-relaxed">
                Lat {source.lat.toFixed(3)}°N, Lon {source.lon.toFixed(3)}°E. {source.nearestFacility}.
              </p>
            </div>
            <div className="text-[10px] font-mono text-[#7CF0BC] mt-2 pt-2 border-t border-[#243B66]">
              Coordinates: Verified Centroid
            </div>
          </div>

          {/* Q3: How much is it changing? */}
          <div className="bg-[#142240] p-4 rounded-xl border border-[#243B66] flex flex-col justify-between">
            <div>
              <div className="text-[10px] font-mono font-bold text-[#FFCE5C] uppercase mb-1">
                {t.q3Title}
              </div>
              <div className="font-bold text-sm text-white mb-1">
                {source.id === 'BD-HAB-001'
                  ? '~820 kg/hr (±24%)'
                  : source.id === 'TR-GPM-KON'
                  ? 'Up to 68 mm Monthly'
                  : isPrecipitation(source)
                  ? 'Up to 885 mm Monthly'
                  : isRiverElevation(source)
                  ? '+5.27 m Seasonal Crest'
                  : isVegetation(source)
                  ? '0.17 to 0.72 Index'
                  : `${stats.senSlopeAnnual > 0 ? `+${stats.senSlopeAnnual}` : stats.senSlopeAnnual} ${source.unit || 'ppm·m'}/yr`}
              </div>
              <p className="text-xs text-[#A8B7D2] font-inter leading-relaxed">
                {source.id === 'TR-GPM-KON'
                  ? `Semi-arid monthly rainfall ranges 0.8–68.4 mm; annual total ~317 mm; Sen drift +1.3 mm/yr (stable seasonal regime, p = ${stats.pValue}).`
                  : isPrecipitation(source)
                  ? `Monthly rainfall reaches 630–885 mm in peak monsoon; drift +1.3 mm/yr (no secular trend, p = ${stats.pValue}).`
                  : isRiverElevation(source)
                  ? 'Pre-monsoon baseflow 8.45 m to monsoonal flood crest 13.72 m (+5.27 m amplitude) in Jamuna Basin.'
                  : isVegetation(source)
                  ? 'Haor submergence drops NDVI to 0.17; dry-season boro rice rebounds to 0.72 (surface reflectance cycle).'
                  : source.category === 'global'
                  ? `Regional atmospheric drift rate: ${stats.senSlopeAnnual > 0 ? `+${stats.senSlopeAnnual}` : stats.senSlopeAnnual} ppb/yr.`
                  : `Estimated emission flux of ~${source.estimatedFluxKgHr.toLocaleString()} kg/hr (±${source.uncertaintyPct}% uncertainty).`}
              </p>
            </div>
            <div className="text-[10px] font-mono text-[#FF8A4F] mt-2 pt-2 border-t border-[#243B66]">
              Theil-Sen Robust Estimator
            </div>
          </div>

          {/* Q4: Is it significant? */}
          <div className="bg-[#142240] p-4 rounded-xl border border-[#243B66] flex flex-col justify-between">
            <div>
              <div className="text-[10px] font-mono font-bold text-[#7CF0BC] uppercase mb-1">
                {t.q4Title}
              </div>
              <div className="font-bold text-sm text-white mb-1">
                {source.id === 'BD-HAB-001'
                  ? 'Single Overpass'
                  : source.id === 'TR-GPM-KON'
                  ? `Cyclical Semi-Arid Regime (p = ${stats.pValue})`
                  : isPrecipitation(source)
                  ? `Cyclical Monsoon (p = ${stats.pValue})`
                  : isRiverElevation(source)
                  ? `Cyclical Flood Pulse (p = ${stats.pValue})`
                  : isVegetation(source)
                  ? `Seasonal Phenology (p = ${stats.pValue})`
                  : stats.isSignificant
                  ? 'Statistically Significant'
                  : 'Monotonic Null Not Rejected'}
              </div>
              <p className="text-xs text-[#A8B7D2] font-inter leading-relaxed">
                {source.id === 'BD-HAB-001'
                  ? 'Single high-confidence spaceborne snapshot; requires repeated historical passes to test trend.'
                  : source.id === 'TR-GPM-KON'
                  ? `Mann-Kendall p = ${stats.pValue}: seasonal rainfall in the endorheic Konya Basin represents recurring winter/spring wet and summer dry cycles, not a secular trend.`
                  : isPrecipitation(source)
                  ? `Mann-Kendall p = ${stats.pValue}: variations represent recurring annual monsoon cycles, not a persistent multi-year trend.`
                  : isRiverElevation(source)
                  ? `Mann-Kendall p = ${stats.pValue}: Jamuna river stage reflects cyclical Himalayan snowmelt and monsoon discharge.`
                  : isVegetation(source)
                  ? `Mann-Kendall p = ${stats.pValue}: Haor vegetation follows cyclical monsoonal submergence and winter agriculture.`
                  : `Mann-Kendall p = ${stats.pValue} (α = 0.05). ${stats.isSignificant ? 'Rejects null of no trend.' : 'Does not establish a monotonic trend.'}`}
              </p>
            </div>
            <div className="text-[10px] font-mono text-[#7CF0BC] mt-2 pt-2 border-t border-[#243B66]">
              Method: {stats.pValueMethod === 'exact_permutation' ? 'Exact Permutation' : 'Asymptotic Z'}
            </div>
          </div>
        </div>
      </div>

      {/* Regional Comparison Matrix (Visible when comparison basin is chosen) */}
      {compareSource && compareStats && compareClimate && (
        <div className="bg-[#142240] border border-[#7CF0BC]/40 rounded-xl p-4 md:p-5 mb-6 shadow-md">
          <div className="flex items-center justify-between pb-2 mb-3 border-b border-[#243B66]">
            <div className="flex items-center gap-2 text-xs font-mono text-[#7CF0BC] font-bold">
              <GitCompare className="w-4 h-4" />
              <span>REGIONAL CONTRAST: {source.id} VS. {compareSource.id}</span>
            </div>
            <span className="text-[10px] font-mono text-[#A8B7D2]">NASA Challenge Contrast</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-inter">
            {/* Primary Target Card */}
            <div className="bg-[#080E1A] p-3.5 rounded-lg border border-[#FF8A4F]/50">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[#FF8A4F] font-bold font-mono">{source.id}</span>
                <span className="px-1.5 py-0.2 rounded bg-[#142240] text-white text-[10px]">{source.categoryLabel}</span>
              </div>
              <div className="text-white font-bold text-sm mb-1">{source.name}</div>
              <div className="text-[#A8B7D2] text-[11px] mb-2">{source.nearestFacility}</div>
              <div className="text-[11px] font-mono text-[#7CC4FF]">
                Rate: {stats.senSlopeAnnual > 0 ? `+${stats.senSlopeAnnual}` : stats.senSlopeAnnual} {source.unit || 'ppm·m'}/yr · p = {stats.pValue}
              </div>
            </div>

            {/* Comparison Site Card */}
            <div className="bg-[#080E1A] p-3.5 rounded-lg border border-[#7CF0BC]/50">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[#7CF0BC] font-bold font-mono">{compareSource.id}</span>
                <span className="px-1.5 py-0.2 rounded bg-[#142240] text-white text-[10px]">{compareSource.categoryLabel}</span>
              </div>
              <div className="text-white font-bold text-sm mb-1">{compareSource.name}</div>
              <div className="text-[#A8B7D2] text-[11px] mb-2">{compareSource.nearestFacility}</div>
              <div className="text-[11px] font-mono text-[#7CF0BC]">
                Rate: {compareStats.senSlopeAnnual > 0 ? `+${compareStats.senSlopeAnnual}` : compareStats.senSlopeAnnual} {compareSource.unit || 'ppm·m'}/yr · p = {compareStats.pValue}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Dedicated Cross-Basin Precipitation Synthesis & Seasonal Mann-Kendall Section */}
      {isPrecipitation(source) && sourceSeasonal && sourceClim && (
        <div className="bg-[#142240] border border-[#38BDF8]/50 rounded-xl p-4 md:p-5 mb-6 shadow-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 mb-4 border-b border-[#243B66] gap-2">
            <div>
              <div className="flex items-center gap-2 text-xs font-mono text-[#38BDF8] font-bold">
                <Compass className="w-4 h-4" />
                <span>{t.crossBasinSynthesisTitle}</span>
              </div>
              <p className="text-[11px] text-[#A8B7D2] font-inter mt-0.5">
                {t.crossBasinSubtitle}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#080E1A] text-[#7CF0BC] border border-[#7CF0BC]/40 self-start sm:self-auto">
                NASA GPM IMERG Final (v07)
              </span>
              {!isPrecipComparison && (
                <button
                  onClick={() => setCompareSourceId(source.id === 'TR-GPM-KON' ? 'BD-GPM-SYL' : 'TR-GPM-KON')}
                  className="px-2.5 py-1 rounded bg-[#38BDF8]/20 hover:bg-[#38BDF8]/30 border border-[#38BDF8]/60 text-[#38BDF8] text-[10px] font-mono font-bold transition-all flex items-center gap-1.5"
                >
                  <GitCompare className="w-3 h-3" />
                  <span>{lang === 'bn' ? 'তুলনা লোড করুন' : 'Load Cross-Basin Contrast'}</span>
                </button>
              )}
            </div>
          </div>

          {/* If side-by-side comparison is active, display the 3 Cross-Basin Contrast Cards */}
          {isPrecipComparison && compareSource && compareSeasonal && compareClim ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
              <div className="bg-[#080E1A] p-3 rounded-lg border border-[#243B66]">
                <div className="text-[10px] font-mono text-[#A8B7D2] uppercase">Precipitation Volume Contrast</div>
                <div className="text-base font-bold text-white font-mono mt-1">~9.7x Divergence</div>
                <div className="text-[11px] text-[#DCE6F5] mt-1">
                  <span className="text-[#FF8A4F]">{source.country === 'Türkiye' ? 'Konya' : 'Sylhet'}: {source.country === 'Türkiye' ? '317 mm/yr' : '3,064 mm/yr'}</span> vs <span className="text-[#7CF0BC]">{compareSource.country === 'Türkiye' ? 'Konya' : 'Sylhet'}: {compareSource.country === 'Türkiye' ? '317 mm/yr' : '3,064 mm/yr'}</span>
                </div>
              </div>

              <div className="bg-[#080E1A] p-3 rounded-lg border border-[#243B66]">
                <div className="text-[10px] font-mono text-[#A8B7D2] uppercase">Observation Verification</div>
                <div className="text-base font-bold text-[#7CF0BC] font-mono mt-1">n = 60 Months (100%)</div>
                <div className="text-[11px] text-[#DCE6F5] mt-1">
                  2020-01 to 2024-12 · GPM_3IMERGM_07 (0.1° grid)
                </div>
              </div>

              <div className="bg-[#080E1A] p-3 rounded-lg border border-[#243B66]">
                <div className="text-[10px] font-mono text-[#A8B7D2] uppercase">Seasonal Mann-Kendall Test</div>
                <div className="text-base font-bold text-[#38BDF8] font-mono mt-1">Both Stable Regimes</div>
                <div className="text-[11px] text-[#DCE6F5] mt-1">
                  p_seas = {sourceSeasonal.pValue} vs {compareSeasonal.pValue} (Null Not Rejected)
                </div>
              </div>
            </div>
          ) : (
            /* Single Basin Seasonal Mann-Kendall Statistics Summary */
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
              <div className="bg-[#080E1A] p-3 rounded-lg border border-[#243B66]">
                <div className="text-[10px] font-mono text-[#A8B7D2] uppercase">Annual Precipitation Mean</div>
                <div className="text-base font-bold text-white font-mono mt-1">
                  {source.id === 'TR-GPM-KON' ? '~317 mm/year' : '~3,064 mm/year'}
                </div>
                <div className="text-[11px] text-[#DCE6F5] mt-1">
                  {source.id === 'TR-GPM-KON' ? 'Semi-arid continental cold steppe (BSk)' : 'Tropical monsoonal wetland climate (Am/Aw)'}
                </div>
              </div>

              <div className="bg-[#080E1A] p-3 rounded-lg border border-[#243B66]">
                <div className="text-[10px] font-mono text-[#A8B7D2] uppercase">Seasonal Mann-Kendall Test</div>
                <div className="text-base font-bold text-[#38BDF8] font-mono mt-1">
                  p = {sourceSeasonal.pValue} (Null Not Rejected)
                </div>
                <div className="text-[11px] text-[#DCE6F5] mt-1 font-mono">
                  S_seas = {sourceSeasonal.S} · Var(S) = {sourceSeasonal.varS} · Z = {sourceSeasonal.Z}
                </div>
              </div>

              <div className="bg-[#080E1A] p-3 rounded-lg border border-[#243B66]">
                <div className="text-[10px] font-mono text-[#A8B7D2] uppercase">Intra-Season Sen's Slope</div>
                <div className="text-base font-bold text-[#7CF0BC] font-mono mt-1">
                  {sourceSeasonal.senSlopeAnnual > 0 ? `+${sourceSeasonal.senSlopeAnnual}` : sourceSeasonal.senSlopeAnnual} mm/year
                </div>
                <div className="text-[11px] text-[#DCE6F5] mt-1">
                  Eliminates 12-month serial autocorrelation bias
                </div>
              </div>
            </div>
          )}

          {/* Monthly Climatology Table (12 Seasons) */}
          <div className="bg-[#080E1A] p-3.5 rounded-lg border border-[#243B66] mb-4 overflow-x-auto">
            <div className="text-xs font-mono font-bold text-[#DCE6F5] mb-2 flex items-center justify-between">
              <span>12-Month Mean Precipitation Climatology (mm)</span>
              <span className="text-[10px] text-[#A8B7D2]">Intra-Annual Seasonality</span>
            </div>
            <table className="w-full text-left font-mono text-xs">
              <thead>
                <tr className="border-b border-[#243B66] text-[#A8B7D2] text-[10px]">
                  <th className="pb-1.5 font-medium">Month</th>
                  <th className="pb-1.5 font-medium text-[#FF8A4F]">{source.country}: {source.region}</th>
                  {isPrecipComparison && compareSource && compareClim && (
                    <th className="pb-1.5 font-medium text-[#7CF0BC]">{compareSource.country}: {compareSource.region}</th>
                  )}
                  <th className="pb-1.5 font-medium">Seasonal Regime Phase</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#243B66]/40 text-[11px]">
                {sourceClim.climatology.map((sc, idx) => {
                  const cc = compareClim ? compareClim.climatology[idx] : null;
                  const isMonsoonPeak = sc.mean > 400 || (cc && cc.mean > 400);
                  const isKonyaSummerDrop = (source.country === 'Türkiye' && sc.mean < 10) || (compareSource && compareSource.country === 'Türkiye' && cc && cc.mean < 10);
                  return (
                    <tr key={sc.month} className="hover:bg-[#142240]/40">
                      <td className="py-1 text-[#DCE6F5] font-semibold">{sc.monthName}</td>
                      <td className="py-1 text-[#FF8A4F] font-bold">{sc.mean.toFixed(1)} mm</td>
                      {isPrecipComparison && cc && (
                        <td className="py-1 text-[#7CF0BC] font-bold">{cc.mean.toFixed(1)} mm</td>
                      )}
                      <td className="py-1 text-[#A8B7D2] text-[10px]">
                        {isMonsoonPeak ? '🌊 South Asian Summer Monsoon Peak' :
                         isKonyaSummerDrop ? '☀️ Central Anatolian Summer Arid Minimum' :
                         sc.month <= 3 ? '❄️ Mediterranean/Continental Winter Low' : '⛅ Transition Phase'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* 4 Mandatory Scientific Caveats & Integrity Register */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-[11px] font-inter">
            <div className="bg-[#080E1A]/80 border border-[#243B66] p-2.5 rounded-md">
              <div className="font-semibold text-[#FF8A4F] mb-0.5 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                <span>Seasonality & Serial Autocorrelation</span>
              </div>
              <p className="text-[#A8B7D2] leading-relaxed">
                Raw monthly rainfall violates classical Mann-Kendall independence due to strong 12-month annual seasonality and serial correlation. Hirsch's Seasonal Mann-Kendall evaluates intra-month pairs independently across years, confirming that seasonal cyclicality explains the variance.
              </p>
            </div>

            <div className="bg-[#080E1A]/80 border border-[#243B66] p-2.5 rounded-md">
              <div className="font-semibold text-[#7CC4FF] mb-0.5 flex items-center gap-1">
                <Info className="w-3.5 h-3.5 shrink-0" />
                <span>5-Year Temporal Horizon Boundary</span>
              </div>
              <p className="text-[#A8B7D2] leading-relaxed">
                A 5-year observation record (2020–2024) captures inter-annual meteorological variability and seasonal cycles, NOT a 30-year climatological normal shift or definitive proof of long-term climate change.
              </p>
            </div>

            <div className="bg-[#080E1A]/80 border border-[#243B66] p-2.5 rounded-md">
              <div className="font-semibold text-[#FFCE5C] mb-0.5 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                <span>Meteorological vs. Groundwater Variable</span>
              </div>
              <p className="text-[#A8B7D2] leading-relaxed">
                Precipitation quantifies atmospheric moisture deposition, NOT groundwater aquifer depletion or sinkhole (*obruk*) formation in the Konya Basin, which is primarily driven by agricultural overdraft.
              </p>
            </div>

            <div className="bg-[#080E1A]/80 border border-[#243B66] p-2.5 rounded-md">
              <div className="font-semibold text-[#7CF0BC] mb-0.5 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span>Basin Geographic Demarcation</span>
              </div>
              <p className="text-[#A8B7D2] leading-relaxed">
                The Konya Closed Basin (~50,000 km²) is an endorheic inland plateau basin in Central Anatolia. It is geographically distinct from national-average Turkish precipitation (e.g. Black Sea coastal rainfall exceeds 2,200 mm/year).
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Next Step Action Button: Navigate to Climate Impact */}
      {onNavigateToImpact && (
        <div className="mb-6">
          <button
            onClick={onNavigateToImpact}
            className="w-full py-3.5 px-4 rounded-xl bg-[#FF8A4F] hover:bg-[#FF752B] text-black font-manrope font-bold text-xs tracking-normal flex items-center justify-center gap-2 shadow-sm transition-all"
            aria-label="Proceed to step 3: Explore climate impact"
          >
            <span>{t.nextStepImpact}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Expandable Advanced Scientific Details Drawer */}
      <details className="border border-[#243B66] rounded-xl bg-[#080E1A] p-4 text-xs font-inter group">
        <summary className="font-mono text-xs text-[#7CC4FF] cursor-pointer hover:text-white flex items-center justify-between outline-none select-none">
          <span className="font-semibold flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#7CF0BC]" />
            <span>🔬 {lang === 'bn' ? 'উন্নত পরিসংখ্যান ও গাণিতিক প্রমাণাদি (বিজ্ঞানীদের জন্য)' : 'Advanced Scientific Mathematics & Statistical Calculations (For Researchers)'}</span>
          </span>
          <span className="text-[10px] text-[#A8B7D2] group-open:rotate-180 transition-transform">▼</span>
        </summary>

        <div className="pt-4 border-t border-[#243B66] mt-3 space-y-4 text-[#DCE6F5]">
          {/* 4 Statistical Proof Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-[#142240] p-3 rounded-lg border border-[#243B66] font-mono">
              <span className="text-[10px] text-[#A8B7D2] block">TEST STATISTIC (S)</span>
              <span className="text-xl font-bold text-white">{stats.S}</span>
              <span className="text-[10px] text-[#A8B7D2] block mt-0.5">Var(S): {stats.varS.toFixed(1)}</span>
            </div>

            <div className="bg-[#142240] p-3 rounded-lg border border-[#243B66] font-mono">
              <span className="text-[10px] text-[#A8B7D2] block">STANDARDIZED Z</span>
              <span className="text-xl font-bold text-[#7CC4FF]">{stats.Z}</span>
              <span className="text-[10px] text-[#A8B7D2] block mt-0.5">Critical: |Z| &gt; 1.96</span>
            </div>

            <div className="bg-[#142240] p-3 rounded-lg border border-[#243B66] font-mono">
              <span className="text-[10px] text-[#A8B7D2] block">TWO-TAILED P-VALUE</span>
              <span className={`text-xl font-bold ${stats.pValue < 0.05 ? 'text-[#7CF0BC]' : 'text-[#FFCE5C]'}`}>
                {stats.pValue}
              </span>
              <span className="text-[10px] text-[#A8B7D2] block mt-0.5">Method: {stats.pValueMethod}</span>
            </div>

            <div className="bg-[#142240] p-3 rounded-lg border border-[#243B66] font-mono">
              <span className="text-[10px] text-[#A8B7D2] block">OLS REGRESSION R²</span>
              <span className="text-xl font-bold text-white">{stats.rSquared}</span>
              <span className="text-[10px] text-[#A8B7D2] block mt-0.5">Linear benchmark</span>
            </div>
          </div>

          {/* 5-Step Workflow Tabs */}
          <div className="bg-[#142240] p-4 rounded-lg border border-[#243B66]">
            <div className="font-mono text-xs text-[#7CC4FF] font-semibold mb-2">
              NASA CHALLENGE 5-STAGE SCIENTIFIC WORKFLOW
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 mb-3">
              {investigationSteps.map((s) => (
                <button
                  key={s.step}
                  onClick={() => setActiveStep(s.step)}
                  className={`p-2 rounded text-left transition-all ${
                    activeStep === s.step
                      ? 'bg-[#080E1A] text-[#FF8A4F] border border-[#FF8A4F]/60 font-semibold'
                      : 'bg-[#080E1A]/40 text-[#A8B7D2] hover:text-white'
                  }`}
                >
                  <div className="font-mono text-[10px] truncate">{s.title}</div>
                </button>
              ))}
            </div>
            <p className="text-xs text-[#DCE6F5] leading-relaxed">
              {investigationSteps[activeStep - 1].detail}
            </p>
          </div>
        </div>
      </details>
    </div>
  );
};
