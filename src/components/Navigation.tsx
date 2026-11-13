import React from 'react';
import { Globe, TrendingUp, Calculator, Database, BookOpen } from 'lucide-react';
import { TRANSLATIONS } from '../data/translations';

export type ActiveTab = 'explore' | 'trends' | 'impact' | 'methods';

interface NavigationProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  lang: 'en' | 'bn';
  selectedSourceId: string;
  onOpenLearn?: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({ activeTab, onSelectTab, lang, onOpenLearn }) => {
  const t = TRANSLATIONS[lang];

  const items: { id: ActiveTab; stepNumber?: string; label: string; icon: React.ReactNode }[] = [
    { id: 'explore', stepNumber: '1', label: t.stepSpotPlume, icon: <Globe className="w-4 h-4" /> },
    { id: 'trends', stepNumber: '2', label: t.stepTraceTrend, icon: <TrendingUp className="w-4 h-4" /> },
    { id: 'impact', stepNumber: '3', label: t.stepClimateImpact, icon: <Calculator className="w-4 h-4" /> },
    { id: 'methods', label: t.navReferenceMethods, icon: <Database className="w-4 h-4" /> },
  ];

  return (
    <nav 
      role="tablist"
      aria-label="Application Navigation"
      className="bg-[#080E1A] border-b border-[#243B66] px-4 py-2 overflow-x-auto"
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 min-w-max">
        <div className="flex items-center gap-2">
          {items.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                role="tab"
                aria-selected={isActive}
                onClick={() => onSelectTab(item.id)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-inter font-medium tracking-wide transition-all ${
                  isActive
                    ? 'bg-[#142240] text-white border border-[#FF8A4F]/80 shadow-sm'
                    : 'text-[#A8B7D2] hover:text-white hover:bg-[#142240]/60 border border-transparent'
                }`}
              >
                <span className={isActive ? 'text-[#FF8A4F]' : 'text-[#7CC4FF]'}>
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {onOpenLearn && (
          <button
            onClick={onOpenLearn}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-inter font-bold tracking-wider transition-all bg-[#142240] hover:bg-[#1A2C50] text-[#7CF0BC] hover:text-white border border-[#7CF0BC]/60 shadow-xs hover:border-[#7CF0BC]"
            aria-label="Open Learning Center"
            title="Open Beginner Guide & Scientific Glossary"
          >
            <BookOpen className="w-3.5 h-3.5 text-[#7CF0BC]" />
            <span>{lang === 'bn' ? 'শিখুন (LEARN)' : 'LEARN'}</span>
          </button>
        )}
      </div>
    </nav>
  );
};
