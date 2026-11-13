import React, { useState } from 'react';
import { MethaneSource, SourceCategory } from '../types/methane';
import { calculateClimateImpact } from '../services/statsEngine';
import { TRANSLATIONS } from '../data/translations';
import { Search, Flame, Wheat, Trash2, Globe, ArrowRight, MapPin, Calendar, Activity, ShieldCheck, Car, Home, DollarSign } from 'lucide-react';

interface SourceDossiersViewProps {
  sources: MethaneSource[];
  onSelectSource: (source: MethaneSource) => void;
  onNavigateToTrend: (source: MethaneSource) => void;
  onNavigateToMap: (source: MethaneSource) => void;
  lang: 'en' | 'bn';
}

export const SourceDossiersView: React.FC<SourceDossiersViewProps> = ({
  sources,
  onSelectSource,
  onNavigateToTrend,
  onNavigateToMap,
  lang,
}) => {
  const t = TRANSLATIONS[lang];
  const [selectedCategory, setSelectedCategory] = useState<SourceCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedSourceId, setExpandedSourceId] = useState<string | null>(null);

  const filteredSources = sources.filter(s => {
    const matchesCategory = selectedCategory === 'all' || s.category === selectedCategory;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      s.id.toLowerCase().includes(q) ||
      s.name.toLowerCase().includes(q) ||
      s.nameBn.includes(q) ||
      s.region.toLowerCase().includes(q) ||
      s.nearestFacility.toLowerCase().includes(q);
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="flex-1 bg-[#0B1426] p-4 md:p-6 overflow-y-auto max-w-7xl mx-auto w-full">
      {/* Header & Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b border-[#2F4D7E]/50">
        <div>
          <h1 className="text-xl md:text-2xl font-manrope font-bold text-white">
            {lang === 'bn' ? 'উৎস নথিপত্র ও গোয়েন্দা কেস ফাইল' : 'SOURCE DOSSIERS & EVIDENCE REPOSITORY'}
          </h1>
          <p className="text-xs text-[#A8B7D2] font-inter mt-1">
            {lang === 'bn'
              ? 'শনাক্তকৃত প্রতিটি মিথেন উৎসের বিস্তারিত পরিমাপ, পুনরাবৃত্ত উপগ্রহ নিরীক্ষণ ও পরিবেশগত প্রভাব'
              : 'Detailed plume inventories, repeat satellite observation logs, and quantified emission footprints.'}
          </p>
        </div>

        {/* Search input */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-[#A8B7D2] absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={lang === 'bn' ? 'উৎস বা এলাকা খুঁজুন...' : 'Search source ID, region, facility...'}
            className="w-full bg-[#0E1A30] border border-[#2F4D7E] text-[#DCE6F5] text-xs font-mono rounded pl-9 pr-3 py-2 outline-none focus:border-[#FF8A4F]"
          />
        </div>
      </div>

      {/* Category Pills Filter */}
      <div className="flex flex-wrap items-center gap-2 mb-6">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`px-3 py-1.5 rounded text-xs font-mono transition-all ${
            selectedCategory === 'all'
              ? 'bg-[#1A2C50] text-[#FF8A4F] border border-[#FF8A4F]/60'
              : 'bg-[#0E1A30] text-[#A8B7D2] hover:text-white border border-[#2F4D7E]/50'
          }`}
        >
          {t.filterAll} ({sources.length})
        </button>
        <button
          onClick={() => setSelectedCategory('gas')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono transition-all ${
            selectedCategory === 'gas'
              ? 'bg-[#1A2C50] text-[#FF8A4F] border border-[#FF8A4F]'
              : 'bg-[#0E1A30] text-[#A8B7D2] hover:text-[#FF8A4F] border border-[#2F4D7E]/50'
          }`}
        >
          <Flame className="w-3.5 h-3.5 text-[#FF8A4F]" />
          <span>{t.filterGas}</span>
        </button>
        <button
          onClick={() => setSelectedCategory('agriculture')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono transition-all ${
            selectedCategory === 'agriculture'
              ? 'bg-[#1A2C50] text-[#7CF0BC] border border-[#7CF0BC]'
              : 'bg-[#0E1A30] text-[#A8B7D2] hover:text-[#7CF0BC] border border-[#2F4D7E]/50'
          }`}
        >
          <Wheat className="w-3.5 h-3.5 text-[#7CF0BC]" />
          <span>{t.filterAgri}</span>
        </button>
        <button
          onClick={() => setSelectedCategory('urban')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono transition-all ${
            selectedCategory === 'urban'
              ? 'bg-[#1A2C50] text-[#FFCE5C] border border-[#FFCE5C]'
              : 'bg-[#0E1A30] text-[#A8B7D2] hover:text-[#FFCE5C] border border-[#2F4D7E]/50'
          }`}
        >
          <Trash2 className="w-3.5 h-3.5 text-[#FFCE5C]" />
          <span>{t.filterUrban}</span>
        </button>
        <button
          onClick={() => setSelectedCategory('global')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono transition-all ${
            selectedCategory === 'global'
              ? 'bg-[#1A2C50] text-[#7CC4FF] border border-[#7CC4FF]'
              : 'bg-[#0E1A30] text-[#A8B7D2] hover:text-[#7CC4FF] border border-[#2F4D7E]/50'
          }`}
        >
          <Globe className="w-3.5 h-3.5 text-[#7CC4FF]" />
          <span>{t.filterGlobal}</span>
        </button>
      </div>

      {/* Grid of Dossier Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredSources.map((source) => {
          const isExpanded = expandedSourceId === source.id;
          const climate = calculateClimateImpact(source.estimatedFluxKgHr);
          const latestObs = source.observations[source.observations.length - 1];

          return (
            <div
              key={source.id}
              className="bg-[#0E1A30] border border-[#2F4D7E]/70 rounded-lg p-5 hover:border-[#7CC4FF]/60 transition-all shadow-md flex flex-col justify-between"
            >
              <div>
                {/* Header row */}
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs px-2 py-0.5 rounded bg-[#1A2C50] text-[#FF8A4F] font-bold border border-[#2F4D7E]">
                      {source.id}
                    </span>
                    <span className="text-xs font-mono text-[#A8B7D2]">{source.categoryLabel}</span>
                  </div>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-semibold uppercase ${
                    source.status.includes('Active')
                      ? 'bg-[#FF8A4F]/20 text-[#FF8A4F] border border-[#FF8A4F]/50'
                      : 'bg-[#7CF0BC]/20 text-[#7CF0BC] border border-[#7CF0BC]/50'
                  }`}>
                    {lang === 'bn' ? source.statusBn : source.status}
                  </span>
                </div>

                {/* Title */}
                <h3 className="text-base font-manrope font-bold text-white mb-1">
                  {lang === 'bn' ? source.nameBn : source.name}
                </h3>
                <div className="flex items-center gap-1.5 text-xs text-[#A8B7D2] font-inter mb-3">
                  <MapPin className="w-3.5 h-3.5 text-[#7CC4FF] shrink-0" />
                  <span>{lang === 'bn' ? source.nearestFacilityBn : source.nearestFacility} ({source.lat.toFixed(3)}°N, {source.lon.toFixed(3)}°E)</span>
                </div>

                {/* Synopsis */}
                <p className="text-xs text-[#DCE6F5] font-inter leading-relaxed mb-4">
                  {lang === 'bn' ? source.descriptionBn : source.description}
                </p>

                {/* Environmental & Flux Metrics */}
                <div className="grid grid-cols-3 gap-2 bg-[#142240] p-3 rounded border border-[#2F4D7E]/50 font-mono text-xs mb-4">
                  <div>
                    <span className="text-[10px] text-[#A8B7D2] block">EMISSION FLUX</span>
                    <span className="text-sm font-bold text-[#FF8A4F]">
                      {source.estimatedFluxKgHr.toLocaleString()} <span className="text-[10px] font-normal">kg/hr</span>
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#A8B7D2] block">ANNUAL CH₄</span>
                    <span className="text-sm font-bold text-white">
                      {climate.annualFluxTonnes.toLocaleString()} <span className="text-[10px] font-normal">tonnes</span>
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#A8B7D2] block">20-YR CO₂e</span>
                    <span className="text-sm font-bold text-[#7CF0BC]">
                      {(climate.gwp20TonnesCO2e / 1000).toFixed(1)}k <span className="text-[10px] font-normal">tonnes</span>
                    </span>
                  </div>
                </div>

                {/* Satellite History Drawer (Collapsible) */}
                {isExpanded && (
                  <div className="mb-4 pt-3 border-t border-[#2F4D7E]/50">
                    <div className="flex items-center justify-between text-xs font-mono text-[#A8B7D2] mb-2">
                      <span className="text-[#7CC4FF] font-bold">REPEAT SATELLITE PASSES & CLUES</span>
                      <span>{source.observations.length} Passes</span>
                    </div>
                    <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                      {source.observations.map((obs, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between bg-[#0B1426] px-2.5 py-1.5 rounded border border-[#2F4D7E]/40 text-xs font-mono"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-[#FF8A4F]">{obs.displayDate}</span>
                            <span className="text-[10px] text-[#A8B7D2] bg-[#142240] px-1 rounded">{obs.satellite}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-white font-bold">{obs.value} ppm·m</span>
                            <span className="text-[10px] text-[#7CF0BC]">QA {Math.round(obs.qaValue * 100)}%</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Equivalent Emissions Box */}
                    <div className="mt-3 bg-[#0B1426] p-2.5 rounded border border-[#2F4D7E]/40 text-xs font-mono space-y-1">
                      <div className="flex items-center gap-1.5 text-[#DCE6F5]">
                        <Car className="w-3.5 h-3.5 text-[#FF8A4F]" />
                        <span>Car-driving equivalent: <b className="text-white">{(climate.passengerCarKm / 1e6).toFixed(1)}M km/yr</b></span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[#DCE6F5]">
                        <Home className="w-3.5 h-3.5 text-[#7CC4FF]" />
                        <span>Equivalent household energy: <b className="text-white">{climate.homesHeatedEquivalent.toLocaleString()} homes</b></span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[#DCE6F5]">
                        <DollarSign className="w-3.5 h-3.5 text-[#7CF0BC]" />
                        <span>Economic natural gas loss: <b className="text-white">{(climate.economicLossBdt / 1e6).toFixed(1)}M BDT/yr</b></span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between gap-2 pt-3 border-t border-[#2F4D7E]/40">
                <button
                  onClick={() => setExpandedSourceId(isExpanded ? null : source.id)}
                  className="text-xs font-mono text-[#7CC4FF] hover:text-white transition-colors"
                >
                  {isExpanded ? '[-] Hide Observations' : `[+] View ${source.observations.length} Passes & Impact`}
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      onSelectSource(source);
                      onNavigateToMap(source);
                    }}
                    className="px-2.5 py-1.5 rounded bg-[#142240] hover:bg-[#1A2C50] text-[#DCE6F5] border border-[#2F4D7E] text-xs font-mono flex items-center gap-1 transition-colors"
                  >
                    <MapPin className="w-3 h-3 text-[#7CC4FF]" />
                    <span>Map</span>
                  </button>
                  <button
                    onClick={() => {
                      onSelectSource(source);
                      onNavigateToTrend(source);
                    }}
                    className="px-3 py-1.5 rounded bg-[#FF8A4F] hover:bg-[#FF6B2B] text-black font-semibold text-xs font-mono flex items-center gap-1 transition-colors shadow-[0_0_10px_rgba(255,138,79,0.25)]"
                  >
                    <span>{t.viewTrend}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
