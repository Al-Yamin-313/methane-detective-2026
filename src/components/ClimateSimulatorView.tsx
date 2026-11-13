import React, { useState } from 'react';
import { calculateClimateImpact } from '../services/statsEngine';
import { Calculator, Flame, Car, Home, DollarSign, Trees, ArrowRight, ShieldCheck, Zap } from 'lucide-react';
import { TRANSLATIONS } from '../data/translations';

interface ClimateSimulatorViewProps {
  lang: 'en' | 'bn';
  onNavigateToMethods?: () => void;
}

export const ClimateSimulatorView: React.FC<ClimateSimulatorViewProps> = ({ lang, onNavigateToMethods }) => {
  const t = TRANSLATIONS[lang];
  const [fluxRate, setFluxRate] = useState<number>(820); // Default to genuine Habiganj EMIT level (~820 kg/hr)
  const [methaneType, setMethaneType] = useState<'fossil' | 'biogenic'>('fossil');

  const impact = calculateClimateImpact(fluxRate, methaneType);

  const presets = [
    { label: 'Habiganj Plume (NASA EMIT)', rate: 820, sourceId: 'BD-HAB-001', type: 'fossil' as const },
    { label: 'Surma Rice Agriculture', rate: 540, sourceId: 'BD-SYL-007', type: 'biogenic' as const },
    { label: 'Chittagong Corridor', rate: 720, sourceId: 'BD-CHT-009', type: 'fossil' as const },
    { label: 'Matuail Urban Landfill', rate: 980, sourceId: 'BD-DHK-022', type: 'biogenic' as const },
    { label: 'Kailashtilla Demo Scenario', rate: 1420, sourceId: 'BD-SYL-014', type: 'fossil' as const },
    { label: 'Permian Super-Emitter (USA)', rate: 3250, sourceId: 'GL-PER-101', type: 'fossil' as const },
  ];

  return (
    <div className="flex-1 bg-[#080E1A] p-4 md:p-6 overflow-y-auto max-w-7xl mx-auto w-full">
      {/* Step 3 Transition & Multi-Sphere Scaffolding Banner */}
      <div className="mb-5 bg-[#0E1A30] border border-[#7CF0BC]/50 rounded-xl p-4 shadow-md">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#7CF0BC]/20 border border-[#7CF0BC]/40 flex items-center justify-center text-[#7CF0BC] shrink-0 mt-0.5">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div className="text-xs space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-manrope font-bold text-white text-xs md:text-sm tracking-tight">
                {lang === 'bn' ? 'ধাপ ৩ রূপান্তর: পর্যবেক্ষণ থেকে প্রশমন মূল্যায়ন' : 'Step 3 Transition: From Earth-System Observation to Climate Mitigation'}
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#142240] border border-[#243B66] text-[#7CF0BC] uppercase hidden sm:inline">
                IPCC AR6 Framework
              </span>
            </div>
            <p className="text-[#DCE6F5] leading-relaxed">
              {lang === 'bn'
                ? 'পূর্ববর্তী ধাপগুলোতে আপনি উপগ্রহ দ্বারা পরিমাপকৃত পৃথিবী-ব্যবস্থার চলকগুলো (বায়ুমণ্ডলীয় মিথেন কলাম, বৃষ্টিপাত, নদীপ্রবাহ ও উদ্ভিদ সূচক) পর্যবেক্ষণ করেছেন। এই ধাপে আপনি আইপিসিসি এআর৬ নির্দেশিকা অনুসারে বাস্তব মিথেন নির্গমন হ্রাস ও জলবায়ু প্রভাব মূল্যায়ন করছেন। এটি একটি সম্ভাব্য প্রশমন মডেল (Prospective scenario model)—যা সরাসরি একক কারণ-ফলাফল দাবি না করে স্বতন্ত্র উপগ্রহ উপাত্তের পাশাপাশি পরিপূরক বিশ্লেষণ প্রদান করে।'
                : 'In Steps 1 & 2, you observed genuine Earth-system measurements (atmospheric methane columns, precipitation accumulation, river stages, and vegetation greenness). Here in Step 3, you transition to evaluating prospective climate mitigation calculations and physical abatement context using IPCC AR6 GWP metrics. Note: These scenario calculations evaluate the physical potential of stopping detected emissions without asserting unsubstantiated single-cause links to broader regional trends.'}
            </p>
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="mb-6 pb-4 border-b border-[#243B66]">
        <div className="flex items-center gap-2 text-xs font-mono text-[#FF8A4F] mb-1">
          <Calculator className="w-4 h-4" />
          <span>{lang === 'bn' ? 'বাস্তব জলবায়ু ও শক্তি প্রভাব সিমুলেটর' : 'Quantitative Environmental Impact Simulator'}</span>
        </div>
        <h1 className="text-xl md:text-2xl font-manrope font-bold text-white tracking-tight">
          {lang === 'bn' ? 'মিথেন নিঃসরণ ও জলবায়ু প্রভাব সিমুলেটর' : 'What Happens When We Stop a Methane Leak?'}
        </h1>
        <p className="text-xs text-[#DCE6F5] font-inter mt-1 max-w-3xl leading-relaxed">
          {lang === 'bn'
            ? 'আইপিসিসি এআর৬ (IPCC AR6 Table 7.15 Errata) নির্দেশিকা অনুযায়ী জীবাশ্ম ও জৈব মিথেনের পৃথক গ্লোবাল ওয়ার্মিং পটেনশিয়াল (GWP) দ্বারা জলবায়ু প্রভাব ও জ্বালানি শক্তির আর্থিক ক্ষতি গণনা করুন।'
            : 'Interactive Scenario Simulator: Explore real-world CO₂-equivalent climate consequences, energy savings, and abatement benefits based on emission flux rates (kg/hr).'}
        </p>
      </div>

      {/* Preset Quick Selectors & Methane Classification Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-inter text-[#A8B7D2] mr-1">Presets:</span>
          {presets.map(p => (
            <button
              key={p.label}
              onClick={() => {
                setFluxRate(p.rate);
                setMethaneType(p.type);
              }}
              className={`px-2.5 py-1 rounded-lg text-xs font-inter transition-all ${
                fluxRate === p.rate
                  ? 'bg-[#FF8A4F] text-black font-semibold shadow-xs'
                  : 'bg-[#142240] text-[#DCE6F5] hover:text-white border border-[#243B66]'
              }`}
            >
              {p.label} ({p.rate} kg/h)
            </button>
          ))}
        </div>

        {/* Fossil vs Biogenic Toggle */}
        <div className="flex items-center gap-1.5 bg-[#142240] p-1 rounded-lg border border-[#243B66] text-xs font-inter self-start sm:self-auto">
          <span className="text-[#A8B7D2] text-[11px] px-1">Source:</span>
          <button
            onClick={() => setMethaneType('fossil')}
            className={`px-2.5 py-1 rounded text-xs transition-colors ${
              methaneType === 'fossil'
                ? 'bg-[#FF8A4F] text-black font-semibold'
                : 'text-[#A8B7D2] hover:text-white'
            }`}
          >
            Fossil (GWP₂₀=82.5)
          </button>
          <button
            onClick={() => setMethaneType('biogenic')}
            className={`px-2.5 py-1 rounded text-xs transition-colors ${
              methaneType === 'biogenic'
                ? 'bg-[#7CF0BC] text-black font-semibold'
                : 'text-[#A8B7D2] hover:text-white'
            }`}
          >
            Biogenic (GWP₂₀=79.7)
          </button>
        </div>
      </div>

      {/* Main Interactive Slider Card */}
      <div className="bg-[#142240] border border-[#243B66] rounded-xl p-5 md:p-6 mb-6 shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div>
            <span className="text-xs font-inter text-[#A8B7D2] uppercase tracking-wider block">
              SIMULATED EMISSION FLUX RATE
            </span>
            <div className="text-3xl font-manrope font-bold text-[#FF8A4F] flex items-baseline gap-2 mt-1">
              <span>{fluxRate.toLocaleString()}</span>
              <span className="text-sm font-normal text-white">kg / hour</span>
            </div>
            <p className="text-xs text-[#A8B7D2] font-inter mt-1">
              {fluxRate === 820
                ? 'Matched to genuine NASA EMIT Habiganj plume model estimate (820 kg/hr ±24%).'
                : 'Drag the slider to test different emission reduction scenarios.'}
            </p>
          </div>

          <div className="text-left md:text-right bg-[#080E1A] p-3 rounded-lg border border-[#243B66] self-start md:self-auto">
            <span className="text-xs font-inter text-[#A8B7D2] uppercase tracking-wider block">
              ANNUAL METHANE BURDEN
            </span>
            <div className="text-2xl font-manrope font-bold text-white mt-0.5">
              {impact.annualFluxTonnes.toLocaleString()} <span className="text-xs font-normal text-[#7CF0BC]">tonnes CH₄ / yr</span>
            </div>
          </div>
        </div>

        {/* Range Slider */}
        <div className="py-2">
          <input
            type="range"
            min="50"
            max="5000"
            step="50"
            value={fluxRate}
            onChange={(e) => setFluxRate(Number(e.target.value))}
            aria-label="Emission flux rate slider in kg per hour"
            className="w-full h-2.5 bg-[#080E1A] rounded-lg appearance-none cursor-pointer accent-[#FF8A4F] border border-[#243B66]"
          />
        </div>

        <div className="flex justify-between text-[11px] font-inter text-[#A8B7D2] mt-1">
          <span>Minor Leak (50 kg/hr)</span>
          <span className="hidden sm:inline">NASA EMIT Habiganj (~820 kg/hr)</span>
          <span>Super-Emitter (5,000 kg/hr)</span>
        </div>
      </div>

      {/* Real-World Equivalents Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Car Distance */}
        <div className="bg-[#142240] p-4 rounded-xl border border-[#243B66] flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-inter text-[#FF8A4F] font-semibold mb-1">
              <Car className="w-4 h-4" />
              <span>VEHICLE EQUIVALENT</span>
            </div>
            <div className="text-2xl font-manrope font-bold text-white mt-1">
              {(impact.passengerCarKm / 1e6).toFixed(1)}M
            </div>
            <span className="text-xs font-mono text-[#A8B7D2]">km driven per year</span>
            <p className="text-xs text-[#DCE6F5] font-inter mt-3 leading-relaxed">
              Equivalent to the annual greenhouse emissions of <b>{Math.round(impact.passengerCarKm / 24000).toLocaleString()}</b> passenger cars driven for an entire year (EPA fleet factor).
            </p>
          </div>
        </div>

        {/* 20-Year Warming Impact */}
        <div className="bg-[#142240] p-4 rounded-xl border border-[#243B66] flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-inter text-[#7CF0BC] font-semibold mb-1">
              <Flame className="w-4 h-4" />
              <span>20-YEAR WARMING IMPACT</span>
            </div>
            <div className="text-2xl font-manrope font-bold text-white mt-1">
              {(impact.gwp20TonnesCO2e / 1000).toFixed(1)}k
            </div>
            <span className="text-xs font-mono text-[#A8B7D2]">tonnes CO₂e (GWP₂₀ = {impact.gwp20Factor})</span>
            <p className="text-xs text-[#DCE6F5] font-inter mt-3 leading-relaxed">
              Methane traps <b>{impact.gwp20Factor} times more heat</b> than carbon dioxide over a 20-year timescale ({impact.methaneType} factor, IPCC AR6 Errata).
            </p>
          </div>
        </div>

        {/* Household Gas Value */}
        <div className="bg-[#142240] p-4 rounded-xl border border-[#243B66] flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-inter text-[#7CC4FF] font-semibold mb-1">
              <Home className="w-4 h-4" />
              <span>HOUSEHOLD CLEAN ENERGY</span>
            </div>
            <div className="text-2xl font-manrope font-bold text-white mt-1">
              {impact.homesHeatedEquivalent.toLocaleString()}
            </div>
            <span className="text-xs font-mono text-[#A8B7D2]">homes fueled annually</span>
            <p className="text-xs text-[#DCE6F5] font-inter mt-3 leading-relaxed">
              Natural gas energy escaping into the air that could supply clean cooking and power for thousands of domestic households.
            </p>
          </div>
        </div>

        {/* Economic Pipeline Fuel Loss */}
        <div className="bg-[#142240] p-4 rounded-xl border border-[#243B66] flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-inter text-[#FFCE5C] font-semibold mb-1">
              <DollarSign className="w-4 h-4" />
              <span>ECONOMIC FUEL LOSS</span>
            </div>
            <div className="text-2xl font-manrope font-bold text-[#FFCE5C] mt-1">
              {(impact.economicLossBdt / 1e6).toFixed(1)}M
            </div>
            <span className="text-xs font-mono text-[#A8B7D2]">BDT/yr (~${(impact.economicLossUsd / 1000).toFixed(0)}k USD)</span>
            <p className="text-xs text-[#DCE6F5] font-inter mt-3 leading-relaxed">
              Estimated commercial value of lost natural gas calculated at Bangladesh industrial gas tariff rates (~30 BDT/m³).
            </p>
          </div>
        </div>
      </div>

      {/* Abatement Return Card */}
      <div className="bg-[#142240] border border-[#7CF0BC]/40 rounded-xl p-5 mb-6 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-mono text-[#7CF0BC] font-semibold mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span>LEAK DETECTION & ABATEMENT VALUE</span>
          </div>
          <h3 className="text-base font-manrope font-bold text-white mb-1">
            Immediate Return from Satellite Methane Detection
          </h3>
          <p className="text-xs text-[#DCE6F5] font-inter max-w-3xl leading-relaxed">
            By finding and sealing a {fluxRate.toLocaleString()} kg/hr leak within 30 days, Bangladesh avoids approximately <b>{Math.round(impact.annualFluxTonnes / 12).toLocaleString()} metric tonnes of methane venting</b> and saves <b>{(impact.economicLossBdt / 12 / 1e6).toFixed(2)} Million BDT</b> in domestic fuel every month.
          </p>
        </div>
      </div>

      {/* Next Step Action Button */}
      {onNavigateToMethods && (
        <div className="mb-6">
          <button
            onClick={onNavigateToMethods}
            className="w-full py-3.5 px-4 rounded-xl bg-[#142240] hover:bg-[#1A2C50] border border-[#243B66] text-[#7CC4FF] hover:text-white font-manrope font-bold text-xs tracking-normal flex items-center justify-center gap-2 transition-all"
            aria-label="Proceed to Data & Methods reference"
          >
            <span>{t.nextStepMethods}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Expandable IPCC AR6 Methodology & Formula Assumptions */}
      <details className="border border-[#243B66] rounded-xl bg-[#080E1A] p-4 text-xs font-inter group">
        <summary className="font-mono text-xs text-[#7CC4FF] cursor-pointer hover:text-white flex items-center justify-between outline-none select-none">
          <span className="font-semibold flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#7CF0BC]" />
            <span>🔬 Methodological Notice: IPCC AR6 WGI Table 7.15 (with Official Published Errata)</span>
          </span>
          <span className="text-[10px] text-[#A8B7D2] group-open:rotate-180 transition-transform">▼</span>
        </summary>

        <div className="pt-3 border-t border-[#243B66] mt-3 text-[#DCE6F5] space-y-2 leading-relaxed">
          <p>
            CO₂-equivalent warming impact is calculated exclusively from validated or modeled mass emission flux rates (kg/hr) using corrected IPCC AR6 factors:
          </p>
          <ul className="list-disc pl-5 space-y-1 font-mono text-[11px] text-[#A8B7D2]">
            <li>Fossil Methane: GWP₂₀ = 82.5, GWP₁₀₀ = 29.8 (includes carbon-cycle feedbacks)</li>
            <li>Biogenic Methane: GWP₂₀ = 79.7, GWP₁₀₀ = 27.0 (official IPCC errata replacing uncorrected 80.8/27.2)</li>
          </ul>
          <p className="text-[11px] text-[#A8B7D2]">
            <strong>Critical Restriction:</strong> Raw spectroscopic column enhancements (ppm·m) or column-averaged dry-air mole fractions (ppb) cannot be converted directly into CO₂e mass without a mass-balance or Integrated Methane Excess (IME) inversion model coupled with local boundary layer wind vectors.
          </p>
        </div>
      </details>
    </div>
  );
};
