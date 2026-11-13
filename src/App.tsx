import React, { useState } from 'react';
import { TopBar } from './components/TopBar';
import { Navigation, ActiveTab } from './components/Navigation';
import { MapView } from './components/MapView';
import { TrendView } from './components/TrendView';
import { ClimateSimulatorView } from './components/ClimateSimulatorView';
import { DataMethodsView } from './components/DataMethodsView';
import { AboutModal } from './components/AboutModal';
import { LearnModal } from './components/LearnModal';
import { METHANE_SOURCES } from './data/methaneSources';
import { MethaneSource } from './types/methane';
import { ShieldCheck, Satellite } from 'lucide-react';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('explore');
  const [sources, setSources] = useState<MethaneSource[]>(METHANE_SOURCES);
  const [selectedSource, setSelectedSource] = useState<MethaneSource>(METHANE_SOURCES[0]);
  const [lang, setLang] = useState<'en' | 'bn'>('en');
  const [isAboutOpen, setIsAboutOpen] = useState<boolean>(false);
  const [isLearnOpen, setIsLearnOpen] = useState<boolean>(false);

  const handleToggleLang = () => {
    setLang(prev => (prev === 'en' ? 'bn' : 'en'));
  };

  const handleNavigateToTrend = (source: MethaneSource) => {
    setSelectedSource(source);
    setActiveTab('trends');
  };

  const handleNavigateToImpact = () => {
    setActiveTab('impact');
  };

  const handleNavigateToMethods = () => {
    setActiveTab('methods');
  };

  const handleAddCustomDataset = (newSource: MethaneSource) => {
    setSources(prev => {
      const exists = prev.some(s => s.id === newSource.id);
      if (exists) {
        return prev.map(s => s.id === newSource.id ? newSource : s);
      }
      return [newSource, ...prev];
    });
    setSelectedSource(newSource);
    setActiveTab('trends');
  };

  return (
    <div className="h-screen flex flex-col bg-[#080E1A] text-white overflow-hidden">
      {/* Top Bar with Live Telemetry */}
      <TopBar
        lang={lang}
        onToggleLang={handleToggleLang}
        onOpenAbout={() => setIsAboutOpen(true)}
        onOpenLearn={() => setIsLearnOpen(true)}
      />

      {/* Main Navigation Tabs */}
      <Navigation
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        lang={lang}
        selectedSourceId={selectedSource.id}
        onOpenLearn={() => setIsLearnOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {activeTab === 'explore' && (
          <MapView
            sources={sources}
            selectedSourceId={selectedSource.id}
            onSelectSource={setSelectedSource}
            onNavigateToTrend={handleNavigateToTrend}
            lang={lang}
          />
        )}

        {activeTab === 'trends' && (
          <TrendView
            source={selectedSource}
            allSources={sources}
            onSelectSource={setSelectedSource}
            onNavigateToImpact={handleNavigateToImpact}
            lang={lang}
          />
        )}

        {activeTab === 'impact' && (
          <ClimateSimulatorView 
            lang={lang} 
            onNavigateToMethods={handleNavigateToMethods}
          />
        )}

        {activeTab === 'methods' && (
          <DataMethodsView 
            lang={lang} 
            onAddCustomDataset={handleAddCustomDataset}
          />
        )}
      </main>

      {/* System Footer with Compliance Notice */}
      <footer className="bg-[#080E1A] border-t border-[#243B66] px-4 py-2 text-xs font-inter text-[#A8B7D2] flex flex-wrap items-center justify-between gap-2 z-40">
        <div className="flex items-center gap-2">
          <Satellite className="w-3.5 h-3.5 text-[#FF8A4F]" />
          <span className="font-medium text-white">METHANE DETECTIVE</span>
          <span className="text-[#243B66]">|</span>
          <span>NASA Space Apps Challenge 2026 · Earth System Trend Detective</span>
        </div>
        <div className="flex items-center gap-4 text-[11px] font-mono">
          <span>EMIT · TROPOMI · GPM · SWOT · MODIS</span>
          <span className="text-[#7CF0BC] flex items-center gap-1">
            <ShieldCheck className="w-3 h-3" /> Non-Parametric Exact Statistics
          </span>
        </div>
      </footer>

      {/* Section 11 About Modal */}
      <AboutModal
        isOpen={isAboutOpen}
        onClose={() => setIsAboutOpen(false)}
      />

      {/* Beginner Learning Center Modal */}
      <LearnModal
        isOpen={isLearnOpen}
        onClose={() => setIsLearnOpen(false)}
        lang={lang}
      />
    </div>
  );
};

export default App;
