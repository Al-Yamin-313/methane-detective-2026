import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, Polygon, Tooltip, ZoomControl, useMap } from 'react-leaflet';
import L from 'leaflet';
import { MethaneSource, SourceCategory } from '../types/methane';
import { EarthSphere } from '../types/earthSystem';
import { BD_MAP_CONFIG, BD_GAS_FIELDS, EMIT_SATELLITE_SWATHS, BD_DIVISION_POLYGONS } from '../data/bangladeshGeo';
import { TRANSLATIONS } from '../data/translations';
import { FullEarthGlobe } from './FullEarthGlobe';
import { 
  Layers, 
  Flame, 
  Wheat, 
  Trash2, 
  Globe, 
  Radio, 
  ExternalLink, 
  ArrowRight, 
  ShieldCheck, 
  ChevronUp, 
  X, 
  MapPin,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  CloudRain,
  Waves,
  Leaf
} from 'lucide-react';

function MapResizer() {
  const map = useMap();
  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 250);
    return () => clearTimeout(timer);
  }, [map]);
  return null;
}

function MapViewController({
  scope,
  selectedSource
}: {
  scope: 'all' | 'bangladesh' | 'turkiye';
  selectedSource?: MethaneSource;
}) {
  const map = useMap();
  useEffect(() => {
    if (scope === 'turkiye') {
      map.flyTo([37.87, 32.50], 7, { duration: 1.2 });
    } else if (scope === 'bangladesh') {
      map.flyTo([23.85, 90.35], 7, { duration: 1.2 });
    } else if (scope === 'all') {
      map.flyTo([24.0, 50.0], 3, { duration: 1.5 });
    } else if (selectedSource && selectedSource.country === 'Türkiye') {
      map.flyTo([37.87, 32.50], 7, { duration: 1.2 });
    }
  }, [scope, selectedSource, map]);
  return null;
}

// Fix leaflet icon default issues
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface MapViewProps {
  sources: MethaneSource[];
  selectedSourceId: string;
  onSelectSource: (source: MethaneSource) => void;
  onNavigateToTrend: (source: MethaneSource) => void;
  lang: 'en' | 'bn';
}

export const MapView: React.FC<MapViewProps> = ({
  sources,
  selectedSourceId,
  onSelectSource,
  onNavigateToTrend,
  lang,
}) => {
  const t = TRANSLATIONS[lang];
  const [sphereFilter, setSphereFilter] = useState<EarthSphere | 'all'>('all');
  const [categoryFilter, setCategoryFilter] = useState<SourceCategory | 'all'>('all');
  const [scopeFilter, setScopeFilter] = useState<'all' | 'bangladesh' | 'turkiye'>('all');
  const [viewMode, setViewMode] = useState<'map' | 'globe'>('map');
  const [basemapMode, setBasemapMode] = useState<'esri' | 'nasa' | 'dark'>('esri');
  const [showGasFields, setShowGasFields] = useState<boolean>(false);
  const [showSwaths, setShowSwaths] = useState<boolean>(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState<boolean>(false);

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

  const filteredSources = sources.filter(s => {
    if (scopeFilter === 'bangladesh' && s.country !== 'Bangladesh') return false;
    if (scopeFilter === 'turkiye' && s.country !== 'Türkiye') return false;
    if (sphereFilter !== 'all' && getSphere(s) !== (sphereFilter as string).toLowerCase()) return false;
    if (categoryFilter !== 'all' && s.category !== categoryFilter) return false;
    return true;
  });

  const selectedSource = sources.find(s => s.id === selectedSourceId) || sources[0];

  const getSourceColor = (source: MethaneSource): string => {
    const sph = getSphere(source);
    if (sph === 'hydrosphere') {
      return isPrecipitation(source) ? '#38BDF8' : '#818CF8';
    }
    if (sph === 'biosphere') {
      return '#A3E635';
    }
    switch (source.category) {
      case 'gas': return '#FF8A4F'; // Methane amber
      case 'agriculture': return '#7CF0BC'; // Emerald green
      case 'urban': return '#FFCE5C'; // Gold
      case 'global': return '#7CC4FF'; // Accent blue
      default: return '#7CC4FF';
    }
  };

  const handleSelectSourceOnMap = (source: MethaneSource) => {
    onSelectSource(source);
    setIsMobileDrawerOpen(true);
  };

  const latestObs = selectedSource.observations[selectedSource.observations.length - 1];

  const formatMetricValue = () => {
    if (isPrecipitation(selectedSource)) {
      return `${latestObs?.value ?? '—'} mm`;
    }
    if (isRiverElevation(selectedSource)) {
      return `${latestObs?.value ?? '—'} m`;
    }
    if (isVegetation(selectedSource)) {
      return `${latestObs?.value ?? '—'}`;
    }
    if (selectedSource.variableType === 'ch4_column' || selectedSource.variableType === 'methane_column' || selectedSource.category === 'global') {
      return `${latestObs?.value ?? '—'} ppb`;
    }
    return `${selectedSource.estimatedFluxKgHr.toLocaleString()} kg/hr`;
  };

  const formatMetricLabel = () => {
    if (isPrecipitation(selectedSource)) return 'Monthly Accumulated Precipitation';
    if (isRiverElevation(selectedSource)) return 'Water Surface Elevation (WSE above EGM2008)';
    if (isVegetation(selectedSource)) return 'Terra MODIS 16-Day NDVI';
    if (selectedSource.variableType === 'ch4_column' || selectedSource.variableType === 'methane_column' || selectedSource.category === 'global') return 'Regional Column Mole Fraction (XCH4)';
    return 'Model-Derived Flux';
  };

  const formatMetricSublabel = () => {
    if (isPrecipitation(selectedSource)) return 'NASA GPM IMERG 0.1° monthly accumulation';
    if (isRiverElevation(selectedSource)) return 'NASA/CNES SWOT KaRIn radar (Brahmaputra-Jamuna Basin)';
    if (isVegetation(selectedSource)) return 'NASA Terra MODIS surface reflectance index';
    if (selectedSource.variableType === 'ch4_column' || selectedSource.variableType === 'methane_column' || selectedSource.category === 'global') return 'Column-averaged dry-air mole fraction (XCH4)';
    return `Estimated with ±${selectedSource.uncertaintyPct}% model uncertainty`;
  };

  // Reusable Inspector Content for both Desktop Sidebar and Mobile Bottom Sheet
  const renderInspectorContent = (isMobile: boolean = false) => (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Top Header */}
      <div className="flex items-center justify-between text-xs font-mono text-[#A8B7D2] pb-2 border-b border-[#243B66] mb-3">
        <div className="flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-[#7CC4FF]" />
          <span className="text-[#7CC4FF] font-semibold">OBSERVATION FILE</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded bg-[#142240] text-[#FF8A4F] font-bold border border-[#243B66]">
            {selectedSource.id}
          </span>
          {isMobile && (
            <button
              onClick={() => setIsMobileDrawerOpen(false)}
              className="p-1 rounded text-[#A8B7D2] hover:text-white bg-[#142240]"
              aria-label="Close Case File"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Provenance Badge & Status */}
      <div className="mb-3">
        {selectedSource.isCuratedScenario ? (
          <div className="bg-[#FF8A4F]/10 border border-[#FF8A4F]/40 p-2.5 rounded-lg text-xs font-inter text-[#DCE6F5]">
            <div className="font-semibold flex items-center gap-1.5 text-[#FF8A4F] mb-1">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              <span>{lang === 'bn' ? 'অ্যালগরিদমিক টেস্ট দৃশ্যপট' : 'Algorithmic Benchmark Scenario'}</span>
            </div>
            <p className="text-[11px] text-[#A8B7D2] leading-relaxed">
              {lang === 'bn' 
                ? 'প্ল্যাটফর্মের ট্রেন্ড ডিটেকশন অ্যালগরিদম যাচাইয়ের জন্য ব্যবহৃত মডেল টেস্ট দৃশ্যপট।'
                : 'Modeled scenario for validating client-side trend detection algorithms. Not a verified continuous pipeline leak.'}
            </p>
          </div>
        ) : (
          <div className="bg-[#7CC4FF]/10 border border-[#7CC4FF]/30 p-2.5 rounded-lg text-xs font-inter text-[#DCE6F5]">
            <div className="font-semibold flex items-center gap-1.5 text-[#7CC4FF] mb-1">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-[#7CF0BC]" />
              <span>{lang === 'bn' ? 'প্রকৃত উপগ্রহ পর্যবেক্ষণ' : 'Direct Spaceborne Observation'}</span>
            </div>
            <p className="text-[11px] text-[#A8B7D2] leading-relaxed">
              {getSphere(selectedSource) === 'hydrosphere'
                ? (isPrecipitation(selectedSource)
                    ? (lang === 'bn' ? 'নাসা জিপিএম আইমার্জ মাসিক ০.১ ডিগ্রি বৃষ্টিপাত উপাত্ত (জিইএস ডিস্ক জিওভান্নি থেকে সংগ্রহ)।' : 'NASA Global Precipitation Measurement (GPM) IMERG Monthly 0.1° via GES DISC Giovanni.')
                    : (lang === 'bn' ? 'নাসা/সিএনইএস সারফেস ওয়াটার অ্যান্ড ওশান টপোগ্রাফি (সোয়াট) রাডার উপাত্ত।' : 'NASA/CNES/CSA Surface Water and Ocean Topography (SWOT) KaRIn Ka-band radar altimetry.'))
                : getSphere(selectedSource) === 'biosphere'
                ? (lang === 'bn' ? 'নাসা টেরা মডিস ১৬-দিনের এনডিভিআই উপাত্ত (এলপি ড্যাক অ্যাপিয়ার্স)।' : 'NASA Terra MODIS 16-Day NDVI Surface Reflectance via AppEEARS LP DAAC.')
                : selectedSource.id === 'BD-HAB-001'
                ? (lang === 'bn' 
                    ? 'নাসা এমিট স্পেকট্রোমিটার দ্বারা সরাসরি ধারণকৃত মহাকাশ স্ন্যাপশট (২৩ জানুয়ারি ২০২৩)।' 
                    : 'Direct spaceborne snapshot acquired by NASA EMIT on the International Space Station (2023-01-23).')
                : (lang === 'bn'
                    ? 'কোপার্নিকাস সেন্টিনেল-৫পি ট্রোপোমি স্পেকট্রোমিটারের আঞ্চলিক বায়ুমণ্ডলীয় উপাত্ত।'
                    : 'Regional atmospheric column observations by Copernicus Sentinel-5P TROPOMI.')}
            </p>
          </div>
        )}
      </div>

      {/* Observation Name and Location */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-[#142240] text-[#7CC4FF] border border-[#243B66]">
            {getSphere(selectedSource).toUpperCase()}
          </span>
          <span className="text-[10px] font-mono text-[#A8B7D2]">
            {selectedSource.mission || selectedSource.satelliteSensor}
          </span>
        </div>
        <h2 className="text-lg font-manrope font-bold text-white leading-tight tracking-tight">
          {lang === 'bn' ? selectedSource.nameBn : selectedSource.name}
        </h2>
        <p className="text-xs text-[#A8B7D2] mt-1 font-inter">
          {selectedSource.region}, {selectedSource.country} · {lang === 'bn' ? selectedSource.nearestFacilityBn : selectedSource.nearestFacility}
        </p>
      </div>

      {/* Plain Language Satellite Detection Summary */}
      <div className="bg-[#142240] p-3 rounded-lg border border-[#243B66] mb-4 text-xs font-inter text-[#DCE6F5] leading-relaxed">
        <div className="text-[#FF8A4F] font-semibold text-[11px] mb-1 flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>{lang === 'bn' ? 'নাসা পর্যবেক্ষণ সারাংশ' : 'WHAT THE SATELLITE DETECTED'}</span>
        </div>
        <p>
          {selectedSource.id === 'BD-HAB-001'
            ? (lang === 'bn'
                ? 'নাসার এমিট সেন্সর হবিগঞ্জের নবীগঞ্জে প্রায় ৭৪ পিপিএম-মিটার মাত্রার একটি মিথেন প্লুম শনাক্ত করেছে। বাতাসের গতি বিশ্লেষণ করে আনুমানিক নির্গমন হার নির্ণয় করা হয়েছে প্রায় ৮২০ কেজি/ঘণ্টা (±২৪% অনিশ্চয়তা)। এটি কোনো নির্দিষ্ট গ্যাস ফ্যাসিলিটির নিশ্চিত পাইপলাইন লিকেজ নয়।'
                : 'NASA EMIT detected a localized methane plume of ~74 ppm·m in Nabiganj, Habiganj. Atmospheric dispersion modeling estimates an emission rate of ~820 kg/hr (±24% model uncertainty). This is an open-area snapshot and is not attributed to a named gas plant without ground truth.')
            : selectedSource.id === 'BD-TRP-SYL'
            ? (lang === 'bn'
                ? 'সেন্টিনেল-৫পি ট্রোপোমি উপগ্রহ উত্তর-পূর্ব বাংলাদেশের বায়ুমণ্ডলে মিথেন গ্যাসের কলাম-গড় মিশ্রণ অনুপাত পরিমাপ করেছে (১৯১২-১৯৪১ পিপিবি)। এটি ভূপৃষ্ঠের নির্গমন নয়, বরং পুরো বায়ুমণ্ডলীয় স্তরের গড় হিসাব।'
                : 'Copernicus Sentinel-5P measured regional column-averaged dry-air methane (1,912–1,941 ppb) over northeastern Bangladesh. This represents the total atmospheric column, not ground-level concentration.')
            : selectedSource.id === 'BD-GPM-SYL'
            ? (lang === 'bn'
                ? 'নাসা জিপিএম আইমার্জ উপগ্রহ ২০২০ থেকে ২০২৪ সাল পর্যন্ত সুরমা অববাহিকার পুঞ্জীভূত বৃষ্টিপাত পরিমাপ করেছে (পিক বর্ষায় ৬৩০-৮৮৫ মিমি/মাস)। এটি হাওর প্লাবিত করে অবায়বীয় মিথেন উৎপাদনের সহায়ক পরিবেশের সময়গত নির্দেশক।'
                : 'NASA GPM IMERG measured monthly accumulated precipitation (up to 885 mm in peak monsoon) over northeastern Bangladesh from 2020–2024, recording seasonal rainfall that inundates regional wetlands and creates conditions conducive to anaerobic microbial methanogenesis.')
            : selectedSource.id === 'BD-SWOT-JAM'
            ? (lang === 'bn'
                ? 'নাসা/সিএনইএস সোয়াট স্যাটেলাইট ব্রহ্মপুত্র-যমুনা নদীর পানির উচ্চতা ও ভূ-পৃষ্ঠীয় পরিবর্তন নির্ভুল রাডার দ্বারা পর্যবেক্ষণ করেছে (৮.৪৫ মি শুষ্ক বেসফ্লো থেকে ১৩.৭২ মি পিক বন্যা; +৫.২৭ মি বিস্তার)।'
                : 'In the separate Brahmaputra-Jamuna macro-basin, NASA/CNES/CSA SWOT radar altimetry tracks river water surface elevation (8.45 m dry baseflow to 13.72 m peak crest; +5.27 m amplitude) along the Jamuna River reach.')
            : selectedSource.id === 'BD-MOD-NDVI'
            ? (lang === 'bn'
                ? 'টেরা মডিস উপগ্রহ সিলেটের হাওর জলাভূমির উদ্ভিদের সবুজায়ন ও প্লাবনের সময়সূচি পর্যবেক্ষণ করেছে। বর্ষার সময় হাওর ডুবে যাওয়ার কারণে এনডিভিআই সূচক ০.১৭–০.২২ এ নেমে আসে।'
                : 'NASA Terra MODIS captures seasonal vegetation greenness and water submergence (NDVI 0.17–0.72) across the Sylhet Haor wetlands, showing sharp drops during monsoon inundation followed by winter boro crop recovery.')
            : (lang === 'bn' ? selectedSource.descriptionBn : selectedSource.description)}
        </p>
      </div>

      {/* Key Metric Card */}
      <div className="bg-[#142240] p-3 rounded-lg border border-[#243B66] mb-4">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] font-mono text-[#A8B7D2] uppercase">
            {formatMetricLabel()}
          </span>
          <span className="text-[10px] font-mono text-[#7CF0BC]">
            {selectedSource.observations[selectedSource.observations.length - 1]?.satellite || selectedSource.satelliteSensor} Sensor
          </span>
        </div>
        <div className="text-2xl font-manrope font-extrabold text-[#FF8A4F] tracking-tight">
          {formatMetricValue()}
        </div>
        <div className="text-[11px] font-inter text-[#A8B7D2] mt-0.5">
          {formatMetricSublabel()}
        </div>
      </div>

      {/* ONE DOMINANT ACTION: Explore observations over time */}
      <button
        onClick={() => {
          setIsMobileDrawerOpen(false);
          onNavigateToTrend(selectedSource);
        }}
        className="w-full py-3 px-4 rounded-lg bg-[#FF8A4F] hover:bg-[#FF752B] text-black font-manrope font-bold text-xs tracking-normal flex items-center justify-center gap-2 shadow-sm transition-all mb-4"
        aria-label="Explore observations over time in Trends view"
      >
        <span>{t.exploreOverTime}</span>
        <ArrowRight className="w-4 h-4" />
      </button>

      {/* Collapsible Advanced Satellite Details */}
      <details className="group border border-[#243B66] rounded-lg bg-[#080E1A]/60 text-xs">
        <summary className="p-3 font-mono text-xs text-[#7CC4FF] cursor-pointer hover:text-white flex items-center justify-between outline-none select-none">
          <span className="font-semibold flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5" />
            <span>{t.advancedDetails}</span>
          </span>
          <span className="text-[10px] text-[#A8B7D2] group-open:rotate-180 transition-transform">▼</span>
        </summary>
        <div className="p-3 pt-0 border-t border-[#243B66]/60 text-[#DCE6F5] space-y-3 font-inter">
          <div className="grid grid-cols-2 gap-2 text-[10px] font-mono bg-[#142240] p-2.5 rounded border border-[#243B66]">
            <div>
              <span className="text-[#A8B7D2] block">EARTH SPHERE:</span>
              <span className="text-white font-bold uppercase">{getSphere(selectedSource)}</span>
            </div>
            <div>
              <span className="text-[#A8B7D2] block">VARIABLE:</span>
              <span className="text-[#7CC4FF]">{selectedSource.variableType || 'methane'}</span>
            </div>
            <div>
              <span className="text-[#A8B7D2] block">MISSION / SENSOR:</span>
              <span className="text-white">{selectedSource.mission || selectedSource.satelliteSensor}</span>
            </div>
            <div>
              <span className="text-[#A8B7D2] block">RESOLUTION:</span>
              <span className="text-[#7CF0BC]">{selectedSource.spatialResolution || '60m'} · {selectedSource.temporalResolution || 'Overpass'}</span>
            </div>
          </div>

          {selectedSource.nasaGranuleId && (
            <div className="bg-[#142240] p-2 rounded text-[11px] font-mono">
              <span className="text-[#A8B7D2] block text-[10px]">PRODUCT / GRANULE UR:</span>
              <span className="text-[#7CC4FF] break-all">{selectedSource.nasaGranuleId}</span>
            </div>
          )}

          {selectedSource.dataSource && (
            <div className="text-[11px] text-[#A8B7D2]">
              <span className="text-white font-semibold block text-[10px]">SOURCE & ATTRIBUTION:</span>
              <span>{selectedSource.dataSource}</span>
            </div>
          )}

          <div className="text-[11px] text-[#A8B7D2] leading-relaxed">
            <span className="text-white font-semibold block mb-0.5">Scientific Provenance Note:</span>
            {selectedSource.provenanceNote}
          </div>

          <div>
            <div className="text-[10px] font-mono text-[#A8B7D2] uppercase mb-1">
              Recorded Observations ({selectedSource.observations.length})
            </div>
            <div className="space-y-1 max-h-[140px] overflow-y-auto pr-1">
              {selectedSource.observations.map((obs, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between bg-[#142240]/60 px-2 py-1 rounded text-[11px] font-mono"
                >
                  <span className="text-[#FF8A4F]">{obs.displayDate}</span>
                  <span className="text-white font-bold">{obs.value} {obs.unit || selectedSource.unit}</span>
                  <span className="text-[#7CF0BC] text-[10px]">QA {Math.round(obs.qaValue * 100)}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </details>
    </div>
  );

  return (
    <div className="flex-1 flex flex-col lg:flex-row h-full min-h-0 overflow-hidden bg-[#0B1426] relative">
      {/* Map Canvas / 3D Full Earth Globe Viewport */}
      <div className="relative flex-1 h-full min-h-0">
        {viewMode === 'globe' ? (
          <FullEarthGlobe
            sources={sources}
            selectedSourceId={selectedSource.id}
            onSelectSource={handleSelectSourceOnMap}
            onNavigateToTrend={onNavigateToTrend}
            onSwitchToMap={(targetScope) => {
              if (targetScope && targetScope !== 'all') {
                setScopeFilter(targetScope);
                if (targetScope === 'turkiye') {
                  const tr = sources.find(s => s.country === 'Türkiye');
                  if (tr) handleSelectSourceOnMap(tr);
                } else if (targetScope === 'bangladesh') {
                  const bd = sources.find(s => s.country === 'Bangladesh');
                  if (bd) handleSelectSourceOnMap(bd);
                }
              }
              setViewMode('map');
            }}
            lang={lang}
            initialTarget={scopeFilter === 'bangladesh' ? 'bangladesh' : scopeFilter === 'turkiye' ? 'turkiye' : 'global'}
          />
        ) : (
          <>
            {/* Top Control Bar: Beginner-Friendly Filters & Layers */}
            <div className="absolute top-2 left-2 right-2 z-[1000] flex flex-wrap items-center justify-between gap-2 pointer-events-none">
              {/* Back to 3D Full Earth Button & Scope Switcher */}
              <div className="flex items-center gap-1.5 bg-[#080E1A]/95 backdrop-blur-md p-1.5 rounded-lg border border-[#243B66] shadow-md pointer-events-auto">
                <button
                  onClick={() => setViewMode('globe')}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#142240] hover:bg-[#1A2C50] text-[#7CF0BC] hover:text-white border border-[#7CF0BC]/50 text-xs font-manrope font-bold transition-all mr-1"
                  title="Return to 3D Spherical Earth Globe"
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>{lang === 'bn' ? 'গ্লোব ভিউ' : '3D Globe'}</span>
                </button>

                {/* Simple Scope Switcher */}
                <div className="flex items-center bg-[#142240] p-0.5 rounded-md border border-[#243B66]">
                  <button
                    onClick={() => {
                      setScopeFilter('all');
                    }}
                    className={`px-2.5 py-1 rounded text-xs font-inter font-medium transition-all ${
                      scopeFilter === 'all'
                        ? 'bg-[#FF8A4F] text-black font-semibold shadow-xs'
                        : 'text-[#A8B7D2] hover:text-white'
                    }`}
                  >
                    🌍 {lang === 'bn' ? 'সমগ্র পৃথিবী' : 'Global Earth'} ({sources.length})
                  </button>
                  <button
                    onClick={() => {
                      setScopeFilter('bangladesh');
                      const bd = sources.find(s => s.country === 'Bangladesh');
                      if (bd) handleSelectSourceOnMap(bd);
                    }}
                    className={`px-2.5 py-1 rounded text-xs font-inter font-medium transition-all ${
                      scopeFilter === 'bangladesh'
                        ? 'bg-[#FF8A4F] text-black font-semibold shadow-xs'
                        : 'text-[#A8B7D2] hover:text-white'
                    }`}
                  >
                    🇧🇩 {t.filterBangladeshFocus}
                  </button>
                  <button
                    onClick={() => {
                      setScopeFilter('turkiye');
                      const tr = sources.find(s => s.country === 'Türkiye');
                      if (tr) handleSelectSourceOnMap(tr);
                    }}
                    className={`px-2.5 py-1 rounded text-xs font-inter font-medium transition-all ${
                      scopeFilter === 'turkiye'
                        ? 'bg-[#38BDF8] text-black font-semibold shadow-xs'
                        : 'text-[#A8B7D2] hover:text-white'
                    }`}
                  >
                    🇹🇷 {t.filterTurkiyeFocus}
                  </button>
                </div>

                {/* Earth Sphere Filter Dropdown */}
                <div className="relative">
                  <select
                    value={sphereFilter}
                    onChange={(e) => setSphereFilter(e.target.value as any)}
                    aria-label="Filter Earth Sphere"
                    className="bg-[#142240] border border-[#243B66] text-[#7CC4FF] text-xs font-inter font-medium rounded-md px-2.5 py-1 outline-none focus:border-[#7CC4FF] cursor-pointer"
                  >
                    <option value="all">{t.sphereAll}</option>
                    <option value="atmosphere">{t.sphereAtmosphere}</option>
                    <option value="hydrosphere">{t.sphereHydrosphere}</option>
                    <option value="biosphere">{t.sphereBiosphere}</option>
                  </select>
                </div>

                {/* Compact Category Dropdown */}
                <div className="relative">
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value as any)}
                    aria-label="Filter observation category"
                    className="bg-[#142240] border border-[#243B66] text-[#DCE6F5] text-xs font-inter rounded-md px-2.5 py-1 outline-none focus:border-[#7CC4FF] cursor-pointer"
                  >
                    <option value="all">{t.allCategories}</option>
                    <option value="gas">{t.filterGas}</option>
                    <option value="agriculture">{t.filterAgri}</option>
                    <option value="urban">{t.filterUrban}</option>
                    <option value="global">{t.filterGlobal}</option>
                  </select>
                </div>
              </div>

              {/* Layer Controls & Real Map APIs */}
              <div className="flex items-center gap-2 bg-[#080E1A]/95 backdrop-blur-md px-2.5 py-1.5 rounded-lg border border-[#243B66] shadow-md text-xs font-inter pointer-events-auto">
                <span className="text-[11px] font-semibold text-[#7CF0BC] hidden md:inline">API:</span>
                <div className="flex items-center bg-[#142240] p-0.5 rounded-md border border-[#243B66]">
                  <button
                    onClick={() => setBasemapMode('esri')}
                    className={`px-2 py-1 rounded text-[11px] font-inter font-medium transition-all ${
                      basemapMode === 'esri'
                        ? 'bg-[#7CF0BC] text-black font-semibold shadow-xs'
                        : 'text-[#A8B7D2] hover:text-white'
                    }`}
                    title="Esri World Imagery High-Resolution Satellite API"
                  >
                    🛰️ Esri Sat
                  </button>
                  <button
                    onClick={() => setBasemapMode('nasa')}
                    className={`px-2 py-1 rounded text-[11px] font-inter font-medium transition-all ${
                      basemapMode === 'nasa'
                        ? 'bg-[#7CF0BC] text-black font-semibold shadow-xs'
                        : 'text-[#A8B7D2] hover:text-white'
                    }`}
                    title="NASA EOSDIS GIBS Terra MODIS API"
                  >
                    🌍 NASA MODIS
                  </button>
                  <button
                    onClick={() => setBasemapMode('dark')}
                    className={`px-2 py-1 rounded text-[11px] font-inter font-medium transition-all ${
                      basemapMode === 'dark'
                        ? 'bg-[#7CF0BC] text-black font-semibold shadow-xs'
                        : 'text-[#A8B7D2] hover:text-white'
                    }`}
                    title="CARTO Dark Matter Canvas"
                  >
                    🗺️ Dark
                  </button>
                </div>

                <label className="hidden sm:flex items-center gap-1 text-[#A8B7D2] hover:text-white cursor-pointer ml-1 border-l border-[#243B66] pl-2">
                  <input
                    type="checkbox"
                    checked={showGasFields}
                    onChange={(e) => setShowGasFields(e.target.checked)}
                    className="rounded bg-[#142240] border-[#243B66] text-[#FF8A4F]"
                  />
                  <span className="text-[11px]">Gas Fields</span>
                </label>

                <label className="hidden sm:flex items-center gap-1 text-[#A8B7D2] hover:text-white cursor-pointer ml-1">
                  <input
                    type="checkbox"
                    checked={showSwaths}
                    onChange={(e) => setShowSwaths(e.target.checked)}
                    className="rounded bg-[#142240] border-[#243B66] text-[#7CC4FF]"
                  />
                  <span className="text-[11px]">EMIT Swaths</span>
                </label>
              </div>
            </div>

            {/* Real Map API Visual Context Badge */}
            <div className="absolute top-14 left-4 z-[900] pointer-events-auto">
              <div className="bg-[#080E1A]/95 backdrop-blur-md px-3 py-1.5 rounded-lg border border-[#7CF0BC]/60 shadow-lg flex items-center gap-2 text-xs">
                <span className="w-2 h-2 rounded-full bg-[#7CF0BC] animate-pulse" />
                <span className="font-mono text-[#7CF0BC] font-semibold">
                  {basemapMode === 'esri'
                    ? 'Esri World Satellite Imagery API'
                    : basemapMode === 'nasa'
                    ? 'NASA EOSDIS GIBS Terra MODIS API'
                    : 'CARTO Dark Matter GIS API'}
                </span>
                <span className="text-[#A8B7D2] text-[11px] hidden sm:inline border-l border-[#243B66] pl-2">
                  {lang === 'bn' ? 'প্রকৃত স্যাটেলাইট ও জিআইএস ম্যাপ এপিআই' : 'Live Real Map & Satellite API'}
                </span>
              </div>
            </div>

            {/* Leaflet Map Canvas */}
            <MapContainer
              center={BD_MAP_CONFIG.center}
              zoom={BD_MAP_CONFIG.defaultZoom}
              minZoom={2}
              maxZoom={18}
              zoomControl={false}
              className="w-full h-full"
              style={{ width: '100%', height: '100%', minHeight: '400px' }}
            >
          <MapResizer />
          <MapViewController scope={scopeFilter} selectedSource={selectedSource} />
          <ZoomControl position="bottomright" />

          {/* Real Map API Tile Layers */}
          {basemapMode === 'esri' && (
            <TileLayer
              attribution='&copy; <a href="https://www.esri.com" target="_blank" rel="noreferrer">Esri</a> · DigitalGlobe, GeoEye, Earthstar Geographics'
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              maxZoom={18}
            />
          )}
          {basemapMode === 'nasa' && (
            <TileLayer
              attribution='&copy; <a href="https://earthdata.nasa.gov/eosdis/science-system-description/eosdis-components/gibs" target="_blank" rel="noreferrer">NASA EOSDIS GIBS</a> · Terra MODIS Corrected Reflectance True Color'
              url="https://gibs-{s}.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Terra_CorrectedReflectance_TrueColor/default/2024-04-15/GoogleMapsCompatible_Level9/{z}/{x}/{y}.jpg"
              subdomains="abc"
              tileSize={256}
              maxNativeZoom={9}
              maxZoom={18}
            />
          )}
          {basemapMode === 'dark' && (
            <TileLayer
              attribution='&copy; <a href="https://carto.com/">CARTO</a> &copy; OpenStreetMap contributors'
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              subdomains="abcd"
              maxZoom={18}
            />
          )}

          {/* Bangladesh Division Boundary Polygons */}
          {Object.entries(BD_DIVISION_POLYGONS).map(([divName, coords]) => (
            <Polygon
              key={divName}
              positions={coords}
              pathOptions={{
                color: '#243B66',
                weight: 1.2,
                fillColor: '#142240',
                fillOpacity: 0.1,
                dashArray: '3, 6'
              }}
            >
              <Tooltip direction="center" opacity={0.8} permanent={false}>
                <span className="font-mono text-xs text-[#7CC4FF]">{divName} Division</span>
              </Tooltip>
            </Polygon>
          ))}

          {/* NASA EMIT Satellite Swath Footprints (Hidden by default) */}
          {showSwaths && EMIT_SATELLITE_SWATHS.map(swath => (
            <Polygon
              key={swath.id}
              positions={swath.polygon}
              pathOptions={{
                color: '#7CC4FF',
                weight: 1.5,
                fillColor: '#7CC4FF',
                fillOpacity: 0.08,
                dashArray: '6, 6'
              }}
            >
              <Tooltip direction="top" opacity={0.9}>
                <div className="font-mono text-xs p-1">
                  <div className="text-[#7CC4FF] font-bold">NASA EMIT Swath Track</div>
                  <div>{swath.name}</div>
                  <div className="text-[10px] text-[#A8B7D2]">Sensor: 60m Imaging Spectrometer</div>
                </div>
              </Tooltip>
            </Polygon>
          ))}

          {/* Gas Fields & Historic Locations (Hidden by default) */}
          {showGasFields && BD_GAS_FIELDS.map(f => (
            <CircleMarker
              key={f.name}
              center={[f.lat, f.lon]}
              radius={4}
              pathOptions={{
                color: f.status.includes('Blowout') ? '#FF4F4F' : '#FFCE5C',
                fillColor: f.status.includes('Blowout') ? '#FF4F4F' : '#FFCE5C',
                fillOpacity: 0.8,
                weight: 1
              }}
            >
              <Tooltip direction="top">
                <div className="font-mono text-xs p-1">
                  <div className="font-bold text-white">{lang === 'bn' ? f.nameBn : f.name}</div>
                  <div className="text-[#FFCE5C] text-[10px]">{lang === 'bn' ? f.statusBn : f.status}</div>
                </div>
              </Tooltip>
            </CircleMarker>
          ))}

          {/* Active Detected Methane Sources & Verified Plume Polygons */}
          {filteredSources.map((source) => {
            const isSelected = source.id === selectedSourceId;
            const color = getSourceColor(source);
            const latestObs = source.observations[source.observations.length - 1];
            const radius = Math.max(9, Math.min(20, 7 + (latestObs?.value || 40) / 8));

            return (
              <React.Fragment key={source.id}>
                {/* Render exact polygon if available (e.g. EMIT plume complex 000583) */}
                {source.polygonCoords && (
                  <Polygon
                    positions={source.polygonCoords}
                    pathOptions={{
                      color: isSelected ? '#FFFFFF' : '#FF8A4F',
                      fillColor: '#FF8A4F',
                      fillOpacity: isSelected ? 0.55 : 0.3,
                      weight: isSelected ? 2.5 : 1.5
                    }}
                    eventHandlers={{
                      click: () => handleSelectSourceOnMap(source)
                    }}
                  >
                    <Tooltip direction="top">
                      <div className="font-mono text-xs p-1">
                        <div className="text-[#FF8A4F] font-bold">NASA EMIT Plume Complex #583</div>
                        <div>Granule: {source.nasaGranuleId}</div>
                        <div className="text-[10px] text-[#7CF0BC]">Footprint: 960m x 700m (~74 ppm·m)</div>
                      </div>
                    </Tooltip>
                  </Polygon>
                )}

                <CircleMarker
                  center={[source.lat, source.lon]}
                  radius={radius}
                  eventHandlers={{
                    click: () => handleSelectSourceOnMap(source),
                  }}
                  pathOptions={{
                    color: isSelected ? '#FFFFFF' : color,
                    fillColor: color,
                    fillOpacity: isSelected ? 0.95 : 0.7,
                    weight: isSelected ? 3 : 1.5,
                  }}
                >
                  <Popup>
                    <div className="p-1 min-w-[210px] font-inter">
                      <div className="flex items-center justify-between text-xs font-mono text-[#A8B7D2] mb-1">
                        <span className="font-bold text-[#FF8A4F]">{source.id}</span>
                        <span className="text-[10px] uppercase text-[#7CC4FF]">{getSphere(source)}</span>
                      </div>
                      <div className="font-bold text-white text-sm mb-1 leading-snug">
                        {lang === 'bn' ? source.nameBn : source.name}
                      </div>
                      <div className="text-xs text-[#DCE6F5] mb-2">
                        {source.region}, {source.country}
                      </div>
                      <div className="bg-[#142240] p-2 rounded text-xs font-mono mb-2 border border-[#243B66]">
                        <span className="text-[#A8B7D2] block text-[10px] uppercase">
                          {isPrecipitation(source) ? 'MONTHLY PRECIPITATION' :
                           isRiverElevation(source) ? 'RIVER WATER ELEVATION' :
                           isVegetation(source) ? '16-DAY NDVI INDEX' :
                           source.category === 'global' ? 'XCH4 MOLE FRACTION' : 'MODEL-DERIVED FLUX'}
                        </span>
                        <span className="text-base font-bold text-[#FF8A4F]">
                          {isPrecipitation(source) ? `${latestObs?.value} mm/mo` :
                           isRiverElevation(source) ? `${latestObs?.value} m` :
                           isVegetation(source) ? `${latestObs?.value}` :
                           source.category === 'global' ? `${latestObs?.value} ppb` : `${source.estimatedFluxKgHr.toLocaleString()} kg/hr`}
                        </span>
                      </div>
                      <button
                        onClick={() => onNavigateToTrend(source)}
                        className="w-full py-2 px-3 rounded bg-[#FF8A4F] hover:bg-[#FF752B] text-black font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <span>{t.exploreOverTime}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </Popup>
                </CircleMarker>
              </React.Fragment>
            );
          })}
        </MapContainer>

        {/* Beginner Welcome Mission Card (Desktop & Tablet) */}
        <div className="hidden sm:block absolute bottom-4 left-4 z-[1000] pointer-events-auto max-w-sm">
          <div className="bg-[#080E1A]/95 backdrop-blur-md border border-[#243B66] rounded-xl p-3.5 shadow-lg text-xs font-inter text-[#DCE6F5]">
            <div className="flex items-center gap-1.5 text-[#FF8A4F] font-semibold mb-1">
              <Radio className="w-4 h-4" />
              <span>{lang === 'bn' ? 'আর্থ সিস্টেম ট্রেন্ড মিশন' : 'EARTH SYSTEM TREND MISSION'}</span>
            </div>
            <p className="text-[#A8B7D2] text-[11px] leading-relaxed mb-2">
              {t.missionBrief}
            </p>
            <div className="grid grid-cols-3 gap-1.5 text-[10px] font-mono text-[#7CC4FF] pt-1.5 border-t border-[#243B66]">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#FF8A4F]"></span> Gas CH₄
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#7CF0BC]"></span> Agri CH₄
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#7CC4FF]"></span> TROPOMI
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#38BDF8]"></span> GPM Rain
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#818CF8]"></span> SWOT River
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#A3E635]"></span> MODIS NDVI
              </span>
            </div>
          </div>
        </div>

            {/* Mobile Floating Inspector Pill (Visible only on < lg) */}
            <div className="lg:hidden absolute bottom-3 left-3 right-16 z-[1000]">
              <button
                onClick={() => setIsMobileDrawerOpen(true)}
                className="w-full bg-[#080E1A]/95 backdrop-blur-md border border-[#FF8A4F]/60 p-2.5 rounded-xl shadow-lg flex items-center justify-between text-left transition-transform active:scale-[0.98]"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#FF8A4F] flex-shrink-0" />
                  <div className="truncate">
                    <div className="text-[10px] font-mono text-[#A8B7D2] uppercase truncate">
                      {selectedSource.id} · {selectedSource.earthSphere || 'atmosphere'}
                    </div>
                    <div className="text-xs font-bold text-white truncate">
                      {lang === 'bn' ? selectedSource.nameBn : selectedSource.name}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <span className="text-xs font-mono font-bold text-[#FF8A4F]">
                    {formatMetricValue()}
                  </span>
                  <ChevronUp className="w-4 h-4 text-[#A8B7D2]" />
                </div>
              </button>
            </div>
          </>
        )}
      </div>

      {/* Desktop Sticky Inspector Sidebar (Visible only on lg and above) */}
      <div className="hidden lg:flex w-[380px] bg-[#080E1A] border-l border-[#243B66] flex-col p-4 overflow-y-auto">
        {renderInspectorContent(false)}
      </div>

      {/* Mobile Slide-Up Bottom Sheet Modal (Visible when toggled on mobile) */}
      {isMobileDrawerOpen && (
        <div 
          className="lg:hidden fixed inset-0 z-[2000] bg-black/70 backdrop-blur-sm flex flex-col justify-end"
          onClick={() => setIsMobileDrawerOpen(false)}
        >
          <div 
            className="bg-[#080E1A] border-t border-[#243B66] rounded-t-2xl p-4 max-h-[82vh] flex flex-col shadow-2xl animate-in slide-in-from-bottom duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Grab Handle */}
            <div className="w-12 h-1 bg-[#243B66] rounded-full mx-auto mb-3" />
            {renderInspectorContent(true)}
          </div>
        </div>
      )}
    </div>
  );
};
