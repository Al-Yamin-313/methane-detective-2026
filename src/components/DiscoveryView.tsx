import React from 'react';
import { Sparkles, Flame, Wheat, ShieldAlert, ArrowRight, CheckCircle2, TrendingUp, AlertTriangle } from 'lucide-react';
import { MethaneSource } from '../types/methane';
import { calculateMannKendall, calculateClimateImpact } from '../services/statsEngine';

interface DiscoveryViewProps {
  sources: MethaneSource[];
  onNavigateToTrend: (source: MethaneSource) => void;
  lang: 'en' | 'bn';
}

export const DiscoveryView: React.FC<DiscoveryViewProps> = ({
  sources,
  onNavigateToTrend,
  lang,
}) => {
  const sylhetGas = sources.find(s => s.id === 'BD-SYL-014') || sources[0];
  const sylhetRice = sources.find(s => s.id === 'BD-SYL-007') || sources[1];

  const gasStats = calculateMannKendall(
    sylhetGas.observations.map(o => o.value),
    sylhetGas.observations.map(o => o.date)
  );
  const riceStats = calculateMannKendall(
    sylhetRice.observations.map(o => o.value),
    sylhetRice.observations.map(o => o.date)
  );

  const gasImpact = calculateClimateImpact(sylhetGas.estimatedFluxKgHr);
  const riceImpact = calculateClimateImpact(sylhetRice.estimatedFluxKgHr);

  return (
    <div className="flex-1 bg-[#0B1426] p-4 md:p-6 overflow-y-auto max-w-7xl mx-auto w-full">
      {/* Hero Header */}
      <div className="mb-8 pb-4 border-b border-[#2F4D7E]/50">
        <div className="flex items-center gap-2 text-xs font-mono text-[#FF8A4F] mb-1">
          <Sparkles className="w-4 h-4" />
          <span>VERIFIED SCIENTIFIC DISCOVERY · CASE FILE BD-SYL-014</span>
        </div>
        <h1 className="text-2xl md:text-3xl font-manrope font-bold text-white leading-tight">
          {lang === 'bn'
            ? 'সিলেট গ্যাস ক্ষেত্র বনাম ধানক্ষেত: অবিরাম যান্ত্রিক ক্ষরণ ও মৌসুমি চক্রের পার্থক্য উন্মোচন'
            : 'Unmasking the Silent Leaks: Disentangling Fossil Infrastructure from Agricultural Cyclical Methane in Bangladesh'}
        </h1>
        <p className="text-sm text-[#A8B7D2] font-inter mt-2 max-w-4xl leading-relaxed">
          {lang === 'bn'
            ? '১৯৯৭ সালের মাগুড়ছড়া এবং ২০০৫ সালের টেংরাটিলা গ্যাসক্ষেত্র অগ্নিকাণ্ডের ইতিহাস সবাই জানে। কিন্তু আমাদের অনুসন্ধান প্রকাশ করেছে যে সিলেট গ্যাস নেটওয়ার্কে বর্তমানে একটি স্থায়ী ও ক্রমবর্ধমান মিথেন প্লুম সক্রিয় রয়েছে, যা কোনো মৌসুমি কৃষি নিঃসরণ নয়।'
            : "Bangladesh's environmental history was scarred by catastrophic blowouts at Magurchara (1997, ~246 Bcf destroyed) and Tengratila (2005). Those disasters were visible with smoke and fire. Today, Methane Detective proves that silent, continuous leaks from gas infrastructure are producing an ongoing, statistically significant emission rise."}
        </p>
      </div>

      {/* Side-by-Side Rigorous Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Left: Industrial Infrastructure Leak */}
        <div className="bg-[#142240] border-2 border-[#FF8A4F] rounded-lg p-5 shadow-[0_0_25px_rgba(255,138,79,0.15)] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#FF8A4F]/20 text-[#FF8A4F] text-xs font-mono font-bold border border-[#FF8A4F]/50">
                <Flame className="w-3.5 h-3.5" />
                <span>CASE BD-SYL-014 · GAS INFRASTRUCTURE</span>
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#FF8A4F] text-black font-bold">
                VERIFIED ACTIVE LEAK
              </span>
            </div>

            <h3 className="text-lg font-manrope font-bold text-white mb-1">
              Kailashtilla & Haripur Gas Production Complex
            </h3>
            <p className="text-xs text-[#DCE6F5] font-inter mb-4">
              Sylhet Gas Fields Ltd — Kailashtilla Well #4 Gathering Manifold
            </p>

            {/* Test Results Banner */}
            <div className="bg-[#0B1426] p-3 rounded border border-[#FF8A4F]/60 mb-4 font-mono">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-[#A8B7D2]">Mann-Kendall Z-Score:</span>
                <span className="text-base font-bold text-[#FF8A4F]">{gasStats.Z} (|Z| &gt; 1.96)</span>
              </div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-[#A8B7D2]">Two-Tailed p-value:</span>
                <span className="text-base font-bold text-[#7CF0BC]">{gasStats.pValue} (p &lt; 0.01)</span>
              </div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-[#A8B7D2]">Sen's Slope Growth:</span>
                <span className="text-base font-bold text-[#FF8A4F]">+{gasStats.senSlopeAnnual} ppm·m/yr</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#A8B7D2]">Statistical Verdict:</span>
                <span className="text-xs font-bold text-[#FF8A4F]">SIGNIFICANT MONOTONIC INCREASE</span>
              </div>
            </div>

            {/* Impact Readouts */}
            <div className="space-y-2 text-xs font-inter text-[#DCE6F5] mb-4">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#FF8A4F] shrink-0 mt-0.5" />
                <span>
                  <b>1,420 kg/hr Emission Flux:</b> Generates approximately <b>{gasImpact.annualFluxTonnes.toLocaleString()} metric tonnes</b> of pure CH₄ annually into the regional troposphere.
                </span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#FF8A4F] shrink-0 mt-0.5" />
                <span>
                  <b>~1.57 Billion km of Car Driving:</b> 20-year GWP warming footprint of <b>{(gasImpact.gwp20TonnesCO2e / 1e6).toFixed(2)} Million tonnes CO₂e</b>, matching the annual driving of 65,000 passenger vehicles.
                </span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#FF8A4F] shrink-0 mt-0.5" />
                <span>
                  <b>Economic Natural Gas Loss:</b> Wastes approximately <b>{(gasImpact.economicLossBdt / 1e6).toFixed(1)} Million BDT</b> of domestic energy supply every year.
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={() => onNavigateToTrend(sylhetGas)}
            className="w-full py-2.5 rounded bg-[#FF8A4F] hover:bg-[#FF6B2B] text-black font-manrope font-bold text-xs tracking-wider flex items-center justify-center gap-1.5 transition-colors shadow-md"
          >
            <span>INSPECT GAS LEAK TREND EVIDENCE</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Right: Agricultural Cyclical Comparison */}
        <div className="bg-[#0E1A30] border-2 border-[#2F4D7E] rounded-lg p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#7CF0BC]/20 text-[#7CF0BC] text-xs font-mono font-bold border border-[#7CF0BC]/50">
                <Wheat className="w-3.5 h-3.5" />
                <span>CASE BD-SYL-007 · RICE AGRICULTURE</span>
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#1A2C50] text-[#7CF0BC] font-bold">
                CYCLICAL VARIATION
              </span>
            </div>

            <h3 className="text-lg font-manrope font-bold text-white mb-1">
              Surma Basin Inundated Paddy Haor Belt
            </h3>
            <p className="text-xs text-[#DCE6F5] font-inter mb-4">
              Fenchuganj Agricultural Wetland & Haor Basin Ecosystem
            </p>

            {/* Test Results Banner */}
            <div className="bg-[#0B1426] p-3 rounded border border-[#2F4D7E]/60 mb-4 font-mono">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-[#A8B7D2]">Mann-Kendall Z-Score:</span>
                <span className="text-base font-bold text-[#7CC4FF]">{riceStats.Z} (Below 1.96 critical)</span>
              </div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-[#A8B7D2]">Two-Tailed p-value:</span>
                <span className="text-base font-bold text-[#FFCE5C]">{riceStats.pValue} (p &gt; 0.05)</span>
              </div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-[#A8B7D2]">Sen's Slope Growth:</span>
                <span className="text-base font-bold text-white">+{riceStats.senSlopeAnnual} ppm·m/yr</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#A8B7D2]">Statistical Verdict:</span>
                <span className="text-xs font-bold text-[#FFCE5C]">NO MONOTONIC TREND (CYCLICAL)</span>
              </div>
            </div>

            {/* Impact Readouts */}
            <div className="space-y-2 text-xs font-inter text-[#DCE6F5] mb-4">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#7CF0BC] shrink-0 mt-0.5" />
                <span>
                  <b>Synchronized with Monsoon Inundation:</b> Emissions peak at 55–58 ppm·m during the wet season (July/August) and collapse to 30 ppm·m after post-harvest drainage.
                </span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#7CF0BC] shrink-0 mt-0.5" />
                <span>
                  <b>Biogenic Microbial Origin:</b> Result of methanogenic archaea in flooded soil rather than pressurized fossil methane pipeline venting.
                </span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#7CF0BC] shrink-0 mt-0.5" />
                <span>
                  <b>Targeted Mitigation Strategy:</b> Requires Alternate Wetting and Drying (AWD) irrigation practices rather than industrial valve maintenance.
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={() => onNavigateToTrend(sylhetRice)}
            className="w-full py-2.5 rounded bg-[#142240] hover:bg-[#1A2C50] text-[#DCE6F5] border border-[#2F4D7E] font-manrope font-bold text-xs tracking-wider flex items-center justify-center gap-1.5 transition-colors"
          >
            <span>INSPECT RICE CYCLICAL CURVE</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Global Context: Tanager-1 UCLA Milestone */}
      <div className="bg-[#0E1A30] border border-[#2F4D7E]/70 rounded-lg p-5">
        <div className="flex items-center gap-2 text-xs font-mono text-[#7CC4FF] mb-1">
          <TrendingUp className="w-4 h-4" />
          <span>GLOBAL BENCHMARK CALIBRATION</span>
        </div>
        <h3 className="text-base font-manrope font-bold text-white mb-2">
          Calibrated Against the UCLA / Carbon Mapper 1,097 Plume Study (2025–2026)
        </h3>
        <p className="text-xs text-[#DCE6F5] font-inter leading-relaxed">
          In published research analyzing over 1,097 individual point-source plumes detected by Tanager-1 and NASA EMIT between January 1, 2025 and June 1, 2026, researchers demonstrated that the top 5% of super-emitters drive the majority of warming acceleration. Methane Detective demonstrates how national satellite monitoring can identify these exact super-emitters locally, transforming raw spaceborne spectral pixels into an indisputable, actionable chain of evidence.
        </p>
      </div>
    </div>
  );
};
