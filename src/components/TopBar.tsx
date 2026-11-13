import React, { useState, useEffect } from 'react';
import { Satellite, Languages, Info, BookOpen } from 'lucide-react';
import { NasaApiStatus } from '../types/methane';
import NasaApiService from '../services/nasaApi';
import { TRANSLATIONS } from '../data/translations';

interface TopBarProps {
  lang: 'en' | 'bn';
  onToggleLang: () => void;
  onOpenAbout: () => void;
  onOpenLearn?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({ lang, onToggleLang, onOpenAbout, onOpenLearn }) => {
  const t = TRANSLATIONS[lang];
  const [status, setStatus] = useState<NasaApiStatus | null>(null);

  useEffect(() => {
    let isMounted = true;
    // Fast CMR check for instant truthfulness
    NasaApiService.checkCmrEmit(4000)
      .then(cmrRes => {
        if (isMounted && cmrRes.online) {
          setStatus(prev => ({
            cmr: {
              online: true,
              lastChecked: new Date().toLocaleTimeString(),
              latencyMs: cmrRes.latencyMs,
              granuleCount: cmrRes.granuleCount,
              sampleGranuleTitle: cmrRes.sampleGranuleTitle
            },
            eonet: prev?.eonet || {
              online: false,
              lastChecked: '',
              latencyMs: 0,
              eventsCount: 0,
              recentEventTitle: ''
            }
          }));
        }
      })
      .catch(() => {});

    // Full telemetry status check (CMR + EONET)
    NasaApiService.getFullStatus()
      .then(s => {
        if (isMounted) setStatus(s);
      })
      .catch(() => {
        // Safe fallback to cached mode
      });
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <header className="sticky top-0 z-50 bg-[#080E1A]/95 backdrop-blur-md border-b border-[#243B66] px-4 py-2.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-[#142240] border border-[#FF8A4F]/60">
            <Satellite className="w-5 h-5 text-[#FF8A4F]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-manrope font-bold text-base md:text-lg tracking-tight text-white">
                {t.appTitle}
              </span>
              <span className="text-[10px] font-manrope font-semibold px-2 py-0.5 rounded bg-[#142240] border border-[#243B66] text-[#7CC4FF] hidden sm:inline">
                NASA Space Apps 2026
              </span>
            </div>
            <p className="text-xs text-[#A8B7D2] font-inter">
              {t.appSubtitle}
            </p>
          </div>
        </div>

        {/* Subtle, Truthful NASA Data Status Indicator */}
        <div className="hidden md:flex items-center gap-2 bg-[#142240] border border-[#243B66] rounded-full px-3 py-1 text-xs font-inter text-[#DCE6F5]">
          <span className={`w-2 h-2 rounded-full ${status?.cmr?.online ? 'bg-[#7CF0BC] shadow-[0_0_8px_rgba(124,240,188,0.6)]' : 'bg-[#FFB020]'}`} />
          <span className={`text-xs font-medium ${status?.cmr?.online ? 'text-[#7CF0BC]' : 'text-[#FFD166]'}`}>
            {status?.cmr?.online ? t.nasaLiveStatus : t.nasaCachedStatus}
          </span>
          <span className="text-[#A8B7D2] text-[11px] border-l border-[#243B66] pl-2 font-mono">
            EMIT · TROPOMI · GPM · SWOT · EONET
          </span>
        </div>

        {/* Action Controls: Learn, Language Switcher & About Icon */}
        <div className="flex items-center gap-2">
          {onOpenLearn && (
            <button
              onClick={onOpenLearn}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#142240] hover:bg-[#1A2C50] border border-[#7CF0BC]/60 text-xs font-mono text-[#7CF0BC] hover:text-white transition-colors"
              title="Open Beginner Guide & Scientific Glossary"
              aria-label="Open Learning Center"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span className="font-semibold">{lang === 'bn' ? 'শিখুন' : 'LEARN'}</span>
            </button>
          )}

          <button
            onClick={onToggleLang}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#142240] hover:bg-[#1A2C50] border border-[#243B66] text-xs font-mono text-[#DCE6F5] transition-colors"
            title="Switch Language (English / বাংলা)"
            aria-label="Toggle language"
          >
            <Languages className="w-3.5 h-3.5 text-[#7CC4FF]" />
            <span className="font-semibold">{lang === 'en' ? 'বাংলা' : 'English'}</span>
          </button>

          <button
            onClick={onOpenAbout}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#142240] hover:bg-[#1A2C50] border border-[#243B66] text-xs font-mono text-[#7CC4FF] hover:text-white transition-colors"
            title="About Methane Detective"
            aria-label="About Team and Challenge"
          >
            <Info className="w-4 h-4" />
            <span className="hidden sm:inline font-medium">About</span>
          </button>
        </div>
      </div>
    </header>
  );
};
