import React, { useState } from 'react';
import { 
  Database, 
  Satellite, 
  BookOpen, 
  ExternalLink, 
  ShieldCheck, 
  HelpCircle, 
  ChevronRight, 
  Layers, 
  FileText, 
  Upload, 
  CheckCircle2, 
  AlertTriangle,
  Play,
  ArrowRight,
  CloudRain,
  Waves,
  Leaf
} from 'lucide-react';
import { TRANSLATIONS } from '../data/translations';
import { parseGiovanniCsv, SAMPLE_GIOVANNI_GPM_CSV } from '../services/dataImporter';
import { GiovanniCsvImportResult } from '../types/earthSystem';
import { MethaneSource } from '../types/methane';
import { calculateMannKendall } from '../services/statsEngine';

interface DataMethodsViewProps {
  lang: 'en' | 'bn';
  onAddCustomDataset?: (source: MethaneSource) => void;
}

export const DataMethodsView: React.FC<DataMethodsViewProps> = ({ lang, onAddCustomDataset }) => {
  const t = TRANSLATIONS[lang];
  const [activeSection, setActiveSection] = useState<'importer' | 'missions' | 'attribution' | 'math' | 'qa' | 'faq' | 'provenance'>('importer');
  
  // Importer state
  const [rawCsvText, setRawCsvText] = useState<string>('');
  const [importResult, setImportResult] = useState<GiovanniCsvImportResult | null>(null);
  const [isAddedSuccess, setIsAddedSuccess] = useState<boolean>(false);

  const handleLoadSample = () => {
    setRawCsvText(SAMPLE_GIOVANNI_GPM_CSV);
    const res = parseGiovanniCsv(SAMPLE_GIOVANNI_GPM_CSV);
    setImportResult(res);
    setIsAddedSuccess(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setRawCsvText(text);
      const res = parseGiovanniCsv(text);
      setImportResult(res);
      setIsAddedSuccess(false);
    };
    reader.readAsText(file);
  };

  const handleManualParse = () => {
    if (!rawCsvText.trim()) return;
    const res = parseGiovanniCsv(rawCsvText);
    setImportResult(res);
    setIsAddedSuccess(false);
  };

  const handleAddToObservations = () => {
    if (importResult?.success && importResult.source && onAddCustomDataset) {
      onAddCustomDataset(importResult.source);
      setIsAddedSuccess(true);
    }
  };

  return (
    <div className="flex-1 bg-[#080E1A] p-4 md:p-6 overflow-y-auto max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="mb-6 pb-4 border-b border-[#243B66]">
        <div className="flex items-center gap-2 text-xs font-mono text-[#7CC4FF] mb-1">
          <Database className="w-4 h-4" />
          <span>SCIENTIFIC OBSERVATION CATALOG & METHODOLOGY</span>
        </div>
        <h1 className="text-xl md:text-2xl font-manrope font-bold text-white">
          {lang === 'bn' ? 'উপাত্ত সূত্র ও বৈজ্ঞানিক পদ্ধতি' : 'Data Catalog & Analytical Methodology'}
        </h1>
        <p className="text-xs text-[#DCE6F5] font-inter mt-1 max-w-3xl leading-relaxed">
          {lang === 'bn'
            ? 'নাসা এবং আন্তর্জাতিক সহযোগী মিশন থেকে সংগৃহীত মিথেন পর্যবেক্ষণ, স্পেকট্রোস্কোপি উপাত্ত এবং পরিসংখ্যানিক বিশ্লেষণ পদ্ধতির পূর্ণাঙ্গ বিবরণ।'
            : 'Complete documentation of spaceborne imaging spectroscopy, atmospheric chemistry retrieval algorithms, and non-parametric time-series trend estimation techniques.'}
        </p>
      </div>

      {/* Methane 101 Beginner Explainer Card */}
      <div className="bg-[#142240] border border-[#243B66] rounded-xl p-5 mb-6 shadow-sm">
        <div className="flex items-center gap-2 text-xs font-mono text-[#FF8A4F] font-bold mb-2">
          <BookOpen className="w-4 h-4" />
          <span>{t.methane101Title}</span>
        </div>
        <p className="text-xs text-[#DCE6F5] font-inter leading-relaxed mb-4">
          {t.methane101Desc}
        </p>

        {/* 3-Step Illustrated Concept */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="bg-[#080E1A] p-3 rounded-lg border border-[#243B66] text-xs font-inter">
            <span className="text-[#FF8A4F] font-mono font-bold block mb-1">1. THE INVISIBLE EMISSION</span>
            <p className="text-[#A8B7D2] text-[11px] leading-relaxed">
              Methane (CH₄) is colorless and odorless. Whether leaking from pipeline infrastructure, landfills, or agricultural haors, human eyes cannot see it.
            </p>
          </div>

          <div className="bg-[#080E1A] p-3 rounded-lg border border-[#243B66] text-xs font-inter">
            <span className="text-[#7CC4FF] font-mono font-bold block mb-1">2. INFRARED ABSORPTION</span>
            <p className="text-[#A8B7D2] text-[11px] leading-relaxed">
              Sunlight passes through the atmosphere and reflects off the ground. Methane molecules absorb specific shortwave infrared wavelengths (SWIR ~2.3 µm).
            </p>
          </div>

          <div className="bg-[#080E1A] p-3 rounded-lg border border-[#243B66] text-xs font-inter">
            <span className="text-[#7CF0BC] font-mono font-bold block mb-1">3. SPACEBORNE DETECTION</span>
            <p className="text-[#A8B7D2] text-[11px] leading-relaxed">
              Sensors on the International Space Station (NASA EMIT) and orbiters (TROPOMI) measure this absorption signature to quantify gas plumes from 400 km in space.
            </p>
          </div>
        </div>
      </div>

      {/* Section Switcher Tabs */}
      <div className="flex flex-wrap items-center gap-2 mb-6">
        <button
          onClick={() => setActiveSection('importer')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-inter transition-all ${
            activeSection === 'importer'
              ? 'bg-[#142240] text-[#FF8A4F] border border-[#FF8A4F]/60 font-semibold'
              : 'bg-[#080E1A] text-[#A8B7D2] hover:text-white border border-[#243B66]'
          }`}
        >
          <Upload className="w-3.5 h-3.5 text-[#FF8A4F]" />
          <span>NASA Giovanni Importer</span>
        </button>
        <button
          onClick={() => setActiveSection('missions')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-inter transition-all ${
            activeSection === 'missions'
              ? 'bg-[#142240] text-[#7CC4FF] border border-[#7CC4FF]/60 font-semibold'
              : 'bg-[#080E1A] text-[#A8B7D2] hover:text-white border border-[#243B66]'
          }`}
        >
          <Satellite className="w-3.5 h-3.5 text-[#7CC4FF]" />
          <span>Spaceborne Missions</span>
        </button>
        <button
          onClick={() => setActiveSection('attribution')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-inter transition-all ${
            activeSection === 'attribution'
              ? 'bg-[#142240] text-[#7CF0BC] border border-[#7CF0BC]/60 font-semibold'
              : 'bg-[#080E1A] text-[#A8B7D2] hover:text-white border border-[#243B66]'
          }`}
        >
          <Database className="w-3.5 h-3.5 text-[#7CF0BC]" />
          <span>Data Attribution Register</span>
        </button>
        <button
          onClick={() => setActiveSection('math')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-inter transition-all ${
            activeSection === 'math'
              ? 'bg-[#142240] text-[#FF8A4F] border border-[#FF8A4F]/60 font-semibold'
              : 'bg-[#080E1A] text-[#A8B7D2] hover:text-white border border-[#243B66]'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5 text-[#FF8A4F]" />
          <span>Statistical Mathematics</span>
        </button>
        <button
          onClick={() => setActiveSection('qa')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-inter transition-all ${
            activeSection === 'qa'
              ? 'bg-[#142240] text-[#7CF0BC] border border-[#7CF0BC]/60 font-semibold'
              : 'bg-[#080E1A] text-[#A8B7D2] hover:text-white border border-[#243B66]'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5 text-[#7CF0BC]" />
          <span>Quality Assurance & QA</span>
        </button>
        <button
          onClick={() => setActiveSection('faq')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-inter transition-all ${
            activeSection === 'faq'
              ? 'bg-[#142240] text-[#FFCE5C] border border-[#FFCE5C]/60 font-semibold'
              : 'bg-[#080E1A] text-[#A8B7D2] hover:text-white border border-[#243B66]'
          }`}
        >
          <HelpCircle className="w-3.5 h-3.5 text-[#FFCE5C]" />
          <span>Methodology FAQ</span>
        </button>
        <button
          onClick={() => setActiveSection('provenance')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-inter transition-all ${
            activeSection === 'provenance'
              ? 'bg-[#142240] text-[#93C5FD] border border-[#93C5FD]/60 font-semibold'
              : 'bg-[#080E1A] text-[#A8B7D2] hover:text-white border border-[#243B66]'
          }`}
        >
          <FileText className="w-3.5 h-3.5 text-[#93C5FD]" />
          <span>Data Provenance & Granule Lineage</span>
        </button>
      </div>

      {/* SECTION 0: GIOVANNI & APPEEARS IMPORTER */}
      {activeSection === 'importer' && (
        <div className="bg-[#0E1A30] p-6 rounded-lg border border-[#2F4D7E]/70 shadow-md space-y-6">
          <div>
            <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
              <div className="flex items-center gap-2 text-xs font-mono text-[#FF8A4F] font-bold">
                <Upload className="w-4 h-4" />
                <span>NASA GIOVANNI & APPEEARS REUSABLE DATA INGESTION ENGINE</span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#142240] text-[#7CC4FF] border border-[#243B66]">
                Client-Side CSV Parser & Statistical Validator
              </span>
            </div>
            <h3 className="text-lg font-manrope font-bold text-white mb-2">
              {lang === 'bn' ? 'নাসা জিওভান্নি ও অ্যাপিয়ার্স উপাত্ত সংযোগ' : 'Ingest Any NASA Earth System Time Series'}
            </h3>
            <p className="text-xs text-[#DCE6F5] font-inter leading-relaxed max-w-3xl">
              {lang === 'bn'
                ? 'নাসার জিওভান্নি (GES DISC) বা অ্যাপিয়ার্স (LP DAAC) থেকে ডাউনলোড করা যে কোনো টাইম-সিরিজ CSV ফাইল সরাসরি আপলোড করুন অথবা পেস্ট করুন। ইঞ্জিনটি স্বয়ংক্রিয়ভাবে মেটাডাটা ও হ্যাশ হেডার বাদ দিয়ে উপাত্ত সাজাবে এবং সাথে সাথে ক্লায়েন্ট-সাইড মান-কেন্ডাল ট্রেন্ড পরীক্ষা সম্পন্ন করবে।'
                : 'Upload or paste time-series CSV exports directly from NASA GES DISC Giovanni or NASA LP DAAC AppEEARS. The parser strips metadata comment lines (#), detects delimiters, filters missing values (-9999, NaN), sorts observations chronologically, and executes the non-parametric Mann-Kendall trend detection test client-side.'}
            </p>
          </div>

          {/* Action Row: Load Sample, Choose File, Paste */}
          <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-[#243B66]">
            <button
              onClick={handleLoadSample}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#FF8A4F] hover:bg-[#FF752B] text-black font-semibold text-xs transition-all shadow-sm"
            >
              <Play className="w-3.5 h-3.5" />
              <span>{t.loadSampleBtn}</span>
            </button>

            <label className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#142240] hover:bg-[#1A2C50] text-[#7CC4FF] border border-[#243B66] text-xs font-mono cursor-pointer transition-all">
              <Upload className="w-3.5 h-3.5" />
              <span>Choose CSV File</span>
              <input
                type="file"
                accept=".csv,.txt"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>

            {rawCsvText && (
              <button
                onClick={handleManualParse}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#1A2C50] hover:bg-[#243B66] text-white border border-[#7CC4FF]/40 text-xs font-mono transition-all"
              >
                <span>Re-Validate</span>
              </button>
            )}
          </div>

          {/* CSV Textarea Input */}
          <div>
            <label className="text-[11px] font-mono text-[#A8B7D2] block mb-1">
              Raw NASA CSV Content (or paste Giovanni / AppEEARS data here):
            </label>
            <textarea
              value={rawCsvText}
              onChange={(e) => setRawCsvText(e.target.value)}
              placeholder="# NASA GES DISC Giovanni Monthly Time Series&#10;# Product: GPM_3IMERGM_07&#10;time,precipitation_rate&#10;2020-01-01,14.8&#10;2020-02-01,28.4"
              rows={6}
              className="w-full bg-[#080E1A] border border-[#243B66] rounded-lg p-3 text-xs font-mono text-[#DCE6F5] outline-none focus:border-[#7CC4FF] leading-relaxed resize-y"
            />
          </div>

          {/* Validation & Parsing Report Card */}
          {importResult && (
            <div className={`p-4 rounded-xl border ${importResult.success ? 'bg-[#142240] border-[#7CF0BC]/60' : 'bg-[#FF4F4F]/10 border-[#FF4F4F]/60'}`}>
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#243B66]">
                <div className="flex items-center gap-2">
                  {importResult.success ? (
                    <CheckCircle2 className="w-5 h-5 text-[#7CF0BC]" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-[#FF4F4F]" />
                  )}
                  <span className="font-manrope font-bold text-sm text-white">
                    {importResult.success ? 'VALID NASA TIME SERIES DETECTED' : 'CSV VALIDATION FAILED'}
                  </span>
                </div>
                <span className="font-mono text-xs text-[#A8B7D2]">
                  {importResult.success ? `${importResult.dataset?.observations.length} Valid Soundings` : 'Errors Found'}
                </span>
              </div>

              {/* Error messages if any */}
              {((importResult.errors && importResult.errors.length > 0) || importResult.error) && (
                <div className="space-y-1 mb-3">
                  {(importResult.errors || [importResult.error!]).map((err: string, i: number) => (
                    <div key={i} className="text-xs text-[#FF4F4F] font-mono flex items-center gap-1.5">
                      <span>✖</span>
                      <span>{err}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Warning messages if any */}
              {importResult.warnings && importResult.warnings.length > 0 && (
                <div className="space-y-1 mb-3">
                  {importResult.warnings.map((warn: string, i: number) => (
                    <div key={i} className="text-xs text-[#FFCE5C] font-mono flex items-center gap-1.5">
                      <span>⚠</span>
                      <span>{warn}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Success metadata and live trend calculation */}
              {importResult.success && importResult.dataset && (
                <div className="space-y-3 font-inter">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs font-mono bg-[#080E1A] p-3 rounded-lg border border-[#243B66]">
                    <div>
                      <span className="text-[#A8B7D2] block text-[10px]">VARIABLE:</span>
                      <span className="text-white font-bold">{importResult.dataset.variableLabel || importResult.metadata.variable}</span>
                    </div>
                    <div>
                      <span className="text-[#A8B7D2] block text-[10px]">UNIT:</span>
                      <span className="text-[#7CC4FF] font-bold">{importResult.dataset.unit}</span>
                    </div>
                    <div>
                      <span className="text-[#A8B7D2] block text-[10px]">SPHERE:</span>
                      <span className="text-[#7CF0BC] font-bold uppercase">{importResult.dataset.sphere}</span>
                    </div>
                    <div>
                      <span className="text-[#A8B7D2] block text-[10px]">DROPPED SOUNDINGS:</span>
                      <span className="text-[#FFCE5C]">{importResult.metadata.missingPoints} null/fill</span>
                    </div>
                  </div>

                  {/* Non-parametric trend stats calculated live on imported series */}
                  {(() => {
                    const vals = importResult.dataset.observations.map(o => o.value);
                    const dates = importResult.dataset.observations.map(o => o.date);
                    const stats = calculateMannKendall(vals, dates);
                    return (
                      <div className="bg-[#080E1A] p-3 rounded-lg border border-[#243B66]">
                        <div className="text-[10px] font-mono text-[#7CC4FF] uppercase font-bold mb-1">
                          LIVE CLIENT-SIDE MANN-KENDALL STATISTICAL EVALUATION:
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
                          <div>
                            <span className="text-[#A8B7D2] block text-[10px]">THEIL-SEN SLOPE:</span>
                            <span className="text-white font-bold">{stats.senSlopeAnnual > 0 ? `+${stats.senSlopeAnnual}` : stats.senSlopeAnnual} {importResult.dataset.unit}/yr</span>
                          </div>
                          <div>
                            <span className="text-[#A8B7D2] block text-[10px]">TEST STATISTIC S:</span>
                            <span className="text-white font-bold">{stats.S}</span>
                          </div>
                          <div>
                            <span className="text-[#A8B7D2] block text-[10px]">Z-SCORE:</span>
                            <span className="text-[#7CC4FF] font-bold">{stats.Z}</span>
                          </div>
                          <div>
                            <span className="text-[#A8B7D2] block text-[10px]">P-VALUE:</span>
                            <span className={`font-bold ${stats.pValue < 0.05 ? 'text-[#7CF0BC]' : 'text-[#FFCE5C]'}`}>
                              p = {stats.pValue} ({stats.pValue < 0.05 ? 'Significant' : 'Not Significant'})
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Add to Active Observations Button */}
                  <div className="pt-2 flex items-center justify-between">
                    <p className="text-[11px] text-[#A8B7D2]">
                      Click below to inject this observation into the interactive map and time-series trend detective.
                    </p>
                    <button
                      onClick={handleAddToObservations}
                      disabled={isAddedSuccess}
                      className={`flex items-center gap-1.5 px-4 py-2 rounded-lg font-semibold text-xs font-manrope transition-all ${
                        isAddedSuccess
                          ? 'bg-[#7CF0BC] text-black cursor-default'
                          : 'bg-[#FF8A4F] hover:bg-[#FF752B] text-black shadow-sm'
                      }`}
                    >
                      {isAddedSuccess ? (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Added to Map & Trends!</span>
                        </>
                      ) : (
                        <>
                          <span>Add to Active Observations</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* SECTION 1: MISSIONS */}
      {activeSection === 'missions' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* NASA EMIT */}
            <div className="bg-[#0E1A30] p-5 rounded-lg border border-[#2F4D7E]/70 shadow-md">
              <div className="flex items-center justify-between text-xs font-mono text-[#A8B7D2] mb-2">
                <span className="text-[#FF8A4F] font-bold">NASA JPL · ISS PAYLOAD</span>
                <span>Active (2022–Present)</span>
              </div>
              <h3 className="text-base font-manrope font-bold text-white mb-1">
                NASA EMIT (Earth Surface Mineral Dust Source Investigation)
              </h3>
              <p className="text-xs text-[#DCE6F5] font-inter mb-3 leading-relaxed">
                Hyperspectral imaging spectrometer installed on the International Space Station. While originally designed for mineral dust, EMIT's 285 continuous spectral bands (380–2500 nm) with 60-meter spatial resolution enable precise spectroscopic retrieval of localized methane point-source plumes via matched-filter absorption analysis.
              </p>
              <div className="bg-[#142240] p-2.5 rounded border border-[#2F4D7E]/50 text-[11px] font-mono text-[#DCE6F5] space-y-1 mb-3">
                <div>Collection ID: <span className="text-[#7CC4FF]">C3242707413-LPCLOUD</span></div>
                <div>Variables: <span className="text-white">EMITL2BCH4ENH (ppm·m) & EMITL2BCH4PLM (kg/hr)</span></div>
                <div>Spatial Resolution: <span className="text-white">60 m x 60 m at nadir</span></div>
              </div>
              <a
                href="https://earth.jpl.nasa.gov/emit/"
                target="_blank"
                rel="noreferrer"
                className="text-xs text-[#FF8A4F] font-mono flex items-center gap-1 hover:underline"
              >
                <span>NASA JPL EMIT Mission Page</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            {/* Copernicus Sentinel-5P TROPOMI */}
            <div className="bg-[#0E1A30] p-5 rounded-lg border border-[#2F4D7E]/70 shadow-md">
              <div className="flex items-center justify-between text-xs font-mono text-[#A8B7D2] mb-2">
                <span className="text-[#7CC4FF] font-bold">ESA / NASA COPERNICUS</span>
                <span>Active (2018–Present)</span>
              </div>
              <h3 className="text-base font-manrope font-bold text-white mb-1">
                Copernicus Sentinel-5P TROPOMI
              </h3>
              <p className="text-xs text-[#DCE6F5] font-inter mb-3 leading-relaxed">
                The TROPOspheric Monitoring Instrument provides daily global coverage of atmospheric chemistry. It measures the column-averaged dry-air mole fraction of methane (XCH4 in parts per billion) using shortwave infrared sunlight backscatter. Note: XCH4 represents the average dry-air mole fraction throughout the entire atmospheric column, NOT surface concentration.
              </p>
              <div className="bg-[#142240] p-2.5 rounded border border-[#2F4D7E]/50 text-[11px] font-mono text-[#DCE6F5] space-y-1 mb-3">
                <div>Processor Version: <span className="text-[#7CC4FF]">Version 2.9.1 (PUM SRON-S5P-LEV2-MA-001, Oct 2025)</span></div>
                <div>Measurement Variable: <span className="text-white">methane_mixing_ratio_bias_corrected (ppb)</span></div>
                <div>Official PUM QA Requirement: <span className="text-[#7CF0BC]">qa_value &gt; 0.5 (Clear-sky / low aerosol)</span></div>
                <div>Project Cloud Screening: <span className="text-[#FFCE5C]">cloud_fraction_crb &lt; 0.20 (Additional condition)</span></div>
                <div>Spatial Resolution: <span className="text-white">7 km x 5.5 km nadir footprint</span></div>
              </div>
              <a
                href="https://sentiwiki.copernicus.eu/__attachments/1673595/SRON-S5P-LEV2-MA-001%20-%20Sentinel-5P%20Level%202%20Product%20User%20Manual%20Methane%202025-2.9.1.pdf"
                target="_blank"
                rel="noreferrer"
                className="text-xs text-[#7CC4FF] font-mono flex items-center gap-1 hover:underline"
              >
                <span>Sentinel-5P TROPOMI Methane PUM (v2.9.1)</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            {/* Tanager-1 / Carbon Mapper */}
            <div className="bg-[#0E1A30] p-5 rounded-lg border border-[#2F4D7E]/70 shadow-md">
              <div className="flex items-center justify-between text-xs font-mono text-[#A8B7D2] mb-2">
                <span className="text-[#7CF0BC] font-bold">CARBON MAPPER / NASA JPL TECH</span>
                <span>Active (2024–Present)</span>
              </div>
              <h3 className="text-base font-manrope font-bold text-white mb-1">
                Tanager-1 High-Resolution Imaging Spectrometer
              </h3>
              <p className="text-xs text-[#DCE6F5] font-inter mb-3 leading-relaxed">
                Launched in August 2024, Tanager-1 utilizes optical spectrometer designs developed by NASA JPL to detect facility-level greenhouse gas point sources at 30-meter ground resolution. Ground-truth benchmark points in our database reference the published UCLA 1,097-plume satellite catalog.
              </p>
              <div className="bg-[#142240] p-2.5 rounded border border-[#2F4D7E]/50 text-[11px] font-mono text-[#DCE6F5] space-y-1 mb-3">
                <div>Resolution: <span className="text-white">30 m ground pixel resolution</span></div>
                <div>Target Sectors: <span className="text-white">Oil & Gas, Landfills, Coal, Agriculture</span></div>
                <div>Validation: <span className="text-white">UCLA / Carbon Mapper 1,097-Plume Study (2025–2026)</span></div>
              </div>
              <a
                href="https://carbonmapper.org"
                target="_blank"
                rel="noreferrer"
                className="text-xs text-[#7CF0BC] font-mono flex items-center gap-1 hover:underline"
              >
                <span>Carbon Mapper Public Portal</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            {/* NASA EONET v3 */}
            <div className="bg-[#0E1A30] p-5 rounded-lg border border-[#2F4D7E]/70 shadow-md">
              <div className="flex items-center justify-between text-xs font-mono text-[#A8B7D2] mb-2">
                <span className="text-[#FFCE5C] font-bold">NASA GSFC · REAL-TIME API</span>
                <span>Open Natural Events</span>
              </div>
              <h3 className="text-base font-manrope font-bold text-white mb-1">
                NASA EONET v3 (Earth Observatory Natural Event Tracker)
              </h3>
              <p className="text-xs text-[#DCE6F5] font-inter mb-3 leading-relaxed">
                Live REST API provided by NASA Goddard Space Flight Center tracking open natural environmental events (wildfires, thermal anomalies, volcanic plumes). Used by Methane Detective to cross-reference point emissions and ensure detected plumes are not smoke/combustion false positives.
              </p>
              <div className="bg-[#142240] p-2.5 rounded border border-[#2F4D7E]/50 text-[11px] font-mono text-[#DCE6F5] space-y-1 mb-3">
                <div>Endpoint: <span className="text-[#7CC4FF]">https://eonet.gsfc.nasa.gov/api/v3/events</span></div>
                <div>Update Frequency: <span className="text-white">Real-time / continuous updates</span></div>
                <div>Auth: <span className="text-white">Open public access (Zero API keys required)</span></div>
              </div>
              <a
                href="https://eonet.gsfc.nasa.gov/"
                target="_blank"
                rel="noreferrer"
                className="text-xs text-[#FFCE5C] font-mono flex items-center gap-1 hover:underline"
              >
                <span>NASA EONET Documentation</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            {/* NASA GPM IMERG */}
            <div className="bg-[#0E1A30] p-5 rounded-lg border border-[#2F4D7E]/70 shadow-md">
              <div className="flex items-center justify-between text-xs font-mono text-[#A8B7D2] mb-2">
                <span className="text-[#38BDF8] font-bold">NASA GSFC · GES DISC</span>
                <span>Hydrosphere (2014–Present)</span>
              </div>
              <h3 className="text-base font-manrope font-bold text-white mb-1">
                NASA Global Precipitation Measurement (GPM IMERG)
              </h3>
              <p className="text-xs text-[#DCE6F5] font-inter mb-3 leading-relaxed">
                The Integrated Multi-satellitE Retrievals for GPM (IMERG) combines precipitation estimates from the international GPM constellation, infrared sounders, and rain gauge calibrations. In north-eastern Bangladesh, monsoonal rainfall inundates the internal Surma-Meghna Haor basin, establishing standing-water conditions temporally associated with seasonal wetland anaerobic methanogenesis.
              </p>
              <div className="bg-[#142240] p-2.5 rounded border border-[#2F4D7E]/50 text-[11px] font-mono text-[#DCE6F5] space-y-1 mb-3">
                <div>Product ID: <span className="text-[#7CC4FF]">GPM_3IMERGM_07 (Level 3 Monthly 0.1° x 0.1°)</span></div>
                <div>Variable: <span className="text-white">Monthly Accumulated Precipitation (mm)</span></div>
                <div>Portal: <span className="text-white">NASA GES DISC Giovanni Data Engine</span></div>
              </div>
              <a
                href="https://giovanni.gsfc.nasa.gov/giovanni/"
                target="_blank"
                rel="noreferrer"
                className="text-xs text-[#38BDF8] font-mono flex items-center gap-1 hover:underline"
              >
                <span>NASA GES DISC Giovanni Portal</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            {/* NASA/CNES/CSA SWOT */}
            <div className="bg-[#0E1A30] p-5 rounded-lg border border-[#2F4D7E]/70 shadow-md">
              <div className="flex items-center justify-between text-xs font-mono text-[#A8B7D2] mb-2">
                <span className="text-[#818CF8] font-bold">NASA / CNES / CSA / UKSA</span>
                <span>Hydrosphere (2022–Present)</span>
              </div>
              <h3 className="text-base font-manrope font-bold text-white mb-1">
                Surface Water and Ocean Topography (SWOT) KaRIn
              </h3>
              <p className="text-xs text-[#DCE6F5] font-inter mb-3 leading-relaxed">
                SWOT carries the revolutionary Ka-band Radar Interferometer (KaRIn), measuring surface water elevations of rivers wider than 100 meters with centimeter vertical precision. Along the Jamuna River reach (Brahmaputra Basin), SWOT captures the macro-scale seasonal flood wave amplitude (+5.27 m stage rise from 8.45 m dry baseflow to 13.72 m monsoon crest) characterizing Bangladesh's major braided river corridor.
              </p>
              <div className="bg-[#142240] p-2.5 rounded border border-[#2F4D7E]/50 text-[11px] font-mono text-[#DCE6F5] space-y-1 mb-3">
                <div>Product ID: <span className="text-[#7CC4FF]">SWOT_L2_HR_RiverSP_2.0 (Reach Node #23481)</span></div>
                <div>Variable: <span className="text-white">water_surface_elevation (WSE in meters above EGM2008)</span></div>
                <div>DAAC: <span className="text-white">NASA PO.DAAC / CNES AVISO+</span></div>
              </div>
              <a
                href="https://swot.jpl.nasa.gov/"
                target="_blank"
                rel="noreferrer"
                className="text-xs text-[#818CF8] font-mono flex items-center gap-1 hover:underline"
              >
                <span>NASA JPL SWOT Mission Page</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            {/* NASA Terra MODIS */}
            <div className="bg-[#0E1A30] p-5 rounded-lg border border-[#2F4D7E]/70 shadow-md">
              <div className="flex items-center justify-between text-xs font-mono text-[#A8B7D2] mb-2">
                <span className="text-[#A3E635] font-bold">NASA GSFC · LP DAAC</span>
                <span>Biosphere (1999–Present)</span>
              </div>
              <h3 className="text-base font-manrope font-bold text-white mb-1">
                NASA Terra MODIS Vegetation Phenology (NDVI)
              </h3>
              <p className="text-xs text-[#DCE6F5] font-inter mb-3 leading-relaxed">
                The Moderate Resolution Imaging Spectroradiometer aboard NASA's Terra satellite provides continuous 16-day composites of Normalized Difference Vegetation Index (NDVI) at 250m resolution. Over the Sylhet Haor wetlands, NDVI documents dramatic seasonal transitions from deep water submersion (NDVI ~0.18) to intensive winter boro rice greening (NDVI ~0.68).
              </p>
              <div className="bg-[#142240] p-2.5 rounded border border-[#2F4D7E]/50 text-[11px] font-mono text-[#DCE6F5] space-y-1 mb-3">
                <div>Product ID: <span className="text-[#7CC4FF]">MOD13Q1.061 (16-Day L3 Global 250m SIN Grid)</span></div>
                <div>Variable: <span className="text-white">250m_16_days_NDVI (index 0.0 to 1.0)</span></div>
                <div>Portal: <span className="text-white">NASA LP DAAC AppEEARS Extraction Tool</span></div>
              </div>
              <a
                href="https://appeears.earthdatacloud.nasa.gov/"
                target="_blank"
                rel="noreferrer"
                className="text-xs text-[#A3E635] font-mono flex items-center gap-1 hover:underline"
              >
                <span>NASA AppEEARS Portal</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            {/* NASA GIBS */}
            <div className="bg-[#0E1A30] p-5 rounded-lg border border-[#2F4D7E]/70 shadow-md">
              <div className="flex items-center justify-between text-xs font-mono text-[#A8B7D2] mb-2">
                <span className="text-[#7CF0BC] font-bold">NASA EOSDIS · OPEN WMTS API</span>
                <span>Visual Context (2000–Present)</span>
              </div>
              <h3 className="text-base font-manrope font-bold text-white mb-1">
                NASA GIBS (Global Imagery Browse Services)
              </h3>
              <p className="text-xs text-[#DCE6F5] font-inter mb-3 leading-relaxed">
                NASA EOSDIS GIBS delivers rapid access to full-resolution satellite imagery across the globe. Methane Detective integrates the Terra MODIS Corrected Reflectance True Color (EPSG:3857 Web Mercator) imagery layer as an authentic spaceborne visual basemap for the Earth map, maintaining clear scientific distinction between visual context imagery and numerical calculation datasets.
              </p>
              <div className="bg-[#142240] p-2.5 rounded border border-[#2F4D7E]/50 text-[11px] font-mono text-[#DCE6F5] space-y-1 mb-3">
                <div>Product: <span className="text-[#7CC4FF]">MODIS_Terra_CorrectedReflectance_TrueColor</span></div>
                <div>Projection: <span className="text-white">EPSG:3857 (GoogleMapsCompatible_Level9)</span></div>
                <div>Purpose: <span className="text-[#7CF0BC]">True spaceborne Earth basemap (Visual context only)</span></div>
                <div>Key Policy: <span className="text-white">100% Free Open Access (Zero API keys required)</span></div>
              </div>
              <a
                href="https://nasa-gibs.github.io/gibs-api-docs/"
                target="_blank"
                rel="noreferrer"
                className="text-xs text-[#7CF0BC] font-mono flex items-center gap-1 hover:underline"
              >
                <span>NASA GIBS API Documentation</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 1.5: DATA ATTRIBUTION & LINEAGE REGISTER */}
      {activeSection === 'attribution' && (
        <div className="bg-[#0E1A30] p-6 rounded-lg border border-[#2F4D7E]/70 shadow-md space-y-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-[#7CF0BC] mb-1">
              <Database className="w-4 h-4" />
              <span>OFFICIAL EARTH SYSTEM DATA SOURCES & ATTRIBUTION REGISTER</span>
            </div>
            <h3 className="text-lg font-manrope font-bold text-white mb-2">
              Multi-Mission Earth Science Products & Provenance Register
            </h3>
            <p className="text-xs text-[#DCE6F5] font-inter leading-relaxed max-w-3xl mb-4">
              In accordance with NASA Open Science principles and the NASA Space Apps Challenge regulations, every dataset utilized in Methane Detective is documented with its official DAAC archive, product identifier, spatial/temporal resolution, and open license.
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-inter border border-[#2F4D7E]/60 rounded-lg overflow-hidden">
                <thead className="bg-[#142240] font-mono text-[10px] text-[#A8B7D2] uppercase">
                  <tr>
                    <th className="p-3 border-b border-[#2F4D7E]/60">Mission / Platform</th>
                    <th className="p-3 border-b border-[#2F4D7E]/60">Earth Sphere</th>
                    <th className="p-3 border-b border-[#2F4D7E]/60">Official Product ID</th>
                    <th className="p-3 border-b border-[#2F4D7E]/60">Variable & Unit</th>
                    <th className="p-3 border-b border-[#2F4D7E]/60">Resolution</th>
                    <th className="p-3 border-b border-[#2F4D7E]/60">Archive / DAAC</th>
                    <th className="p-3 border-b border-[#2F4D7E]/60">Access License</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2F4D7E]/40 font-mono text-[11px] text-[#DCE6F5]">
                  <tr className="hover:bg-[#142240]/40">
                    <td className="p-3 text-white font-bold">NASA EMIT (ISS)</td>
                    <td className="p-3 text-[#FF8A4F]">Atmosphere</td>
                    <td className="p-3 text-[#7CC4FF]">EMITL2BCH4PLM (C3242707413)</td>
                    <td className="p-3">Enhancement (ppm·m) & Flux (kg/hr)</td>
                    <td className="p-3">60 m / Single Overpass</td>
                    <td className="p-3">NASA LP DAAC / CMR</td>
                    <td className="p-3 text-[#7CF0BC]">Open Access (CC0)</td>
                  </tr>
                  <tr className="hover:bg-[#142240]/40">
                    <td className="p-3 text-white font-bold">Copernicus Sentinel-5P</td>
                    <td className="p-3 text-[#7CC4FF]">Atmosphere</td>
                    <td className="p-3 text-[#7CC4FF]">L2__CH4___ (v2.9.1 PUM)</td>
                    <td className="p-3">XCH4 Column Mole Fraction (ppb)</td>
                    <td className="p-3">7 x 5.5 km / Daily Nadir</td>
                    <td className="p-3">Copernicus Open Access / NASA GES DISC</td>
                    <td className="p-3 text-[#7CF0BC]">Open Access (Copernicus)</td>
                  </tr>
                  <tr className="hover:bg-[#142240]/40">
                    <td className="p-3 text-white font-bold">NASA GPM Constellation (Bangladesh)</td>
                    <td className="p-3 text-[#38BDF8]">Hydrosphere</td>
                    <td className="p-3 text-[#7CC4FF]">GPM_3IMERGM_07</td>
                    <td className="p-3">Monthly Accumulated Precipitation (mm)</td>
                    <td className="p-3">0.1° x 0.1° / Monthly</td>
                    <td className="p-3">Surma-Meghna Basin · GES DISC</td>
                    <td className="p-3 text-[#7CF0BC]">Open Access (NASA)</td>
                  </tr>
                  <tr className="hover:bg-[#142240]/40">
                    <td className="p-3 text-white font-bold">NASA GPM Constellation (Türkiye)</td>
                    <td className="p-3 text-[#38BDF8]">Hydrosphere</td>
                    <td className="p-3 text-[#7CC4FF]">GPM_3IMERGM_07</td>
                    <td className="p-3">Monthly Accumulated Precipitation (mm)</td>
                    <td className="p-3">0.1° x 0.1° / Monthly</td>
                    <td className="p-3">Konya Closed Basin · GES DISC</td>
                    <td className="p-3 text-[#7CF0BC]">Open Access (NASA)</td>
                  </tr>
                  <tr className="hover:bg-[#142240]/40">
                    <td className="p-3 text-white font-bold">NASA / CNES SWOT</td>
                    <td className="p-3 text-[#818CF8]">Hydrosphere</td>
                    <td className="p-3 text-[#7CC4FF]">SWOT_L2_HR_RiverSP_2.0</td>
                    <td className="p-3">Water Surface Elevation (m above EGM2008)</td>
                    <td className="p-3">Reach #23481 (Jamuna Basin) / 21-day orbit</td>
                    <td className="p-3">NASA PO.DAAC / CNES AVISO+</td>
                    <td className="p-3 text-[#7CF0BC]">Open Access (NASA/CNES)</td>
                  </tr>
                  <tr className="hover:bg-[#142240]/40">
                    <td className="p-3 text-white font-bold">NASA Terra MODIS</td>
                    <td className="p-3 text-[#A3E635]">Biosphere</td>
                    <td className="p-3 text-[#7CC4FF]">MOD13Q1.061</td>
                    <td className="p-3">Normalized Difference Veg Index (0-1)</td>
                    <td className="p-3">250 m / 16-Day Composite</td>
                    <td className="p-3">NASA LP DAAC / AppEEARS</td>
                    <td className="p-3 text-[#7CF0BC]">Open Access (NASA)</td>
                  </tr>
                  <tr className="hover:bg-[#142240]/40">
                    <td className="p-3 text-white font-bold">NASA EONET v3</td>
                    <td className="p-3 text-[#FFCE5C]">Atmosphere/Biosphere</td>
                    <td className="p-3 text-[#7CC4FF]">EONET Natural Events REST</td>
                    <td className="p-3">Thermal Anomalies & Plume Events</td>
                    <td className="p-3">Point Event / Real-time</td>
                    <td className="p-3">NASA GSFC Open API</td>
                    <td className="p-3 text-[#7CF0BC]">Public Domain (Zero Key)</td>
                  </tr>
                  <tr className="hover:bg-[#142240]/40">
                    <td className="p-3 text-white font-bold">NASA GIBS (EOSDIS)</td>
                    <td className="p-3 text-[#7CF0BC]">Multi-Sphere (Visualization)</td>
                    <td className="p-3 text-[#7CC4FF]">MODIS_Terra_CorrectedReflectance_TrueColor</td>
                    <td className="p-3">True Color Satellite Surface Reflectance</td>
                    <td className="p-3">250 m (WMTS Level 9) / Daily</td>
                    <td className="p-3">NASA EOSDIS GIBS API</td>
                    <td className="p-3 text-[#7CF0BC]">Open Access (CC0 / NASA)</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 2: STATISTICAL MATHEMATICS */}
      {activeSection === 'math' && (
        <div className="bg-[#0E1A30] p-6 rounded-lg border border-[#2F4D7E]/70 shadow-md space-y-6">
          <div>
            <h3 className="text-lg font-manrope font-bold text-white mb-2">
              Non-Parametric Trend Detection: Exact & Asymptotic Mann-Kendall Test
            </h3>
            <p className="text-xs text-[#DCE6F5] font-inter leading-relaxed mb-4">
              Environmental time-series data frequently deviate from normal Gaussian distributions due to seasonal extremes, episodic pipeline venting, and missing observations during overcast weather. The Mann-Kendall test is the standard statistical test recommended by the World Meteorological Organization (WMO) and NASA for trend detection because it is entirely distribution-free and rank-based.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="bg-[#142240] p-4 rounded border border-[#2F4D7E]/50 text-xs font-mono">
                <span className="text-[#FF8A4F] font-bold block mb-1">1. Test Statistic (S)</span>
                <p className="text-[#A8B7D2] mb-2 font-inter text-[11px]">
                  Evaluates the sign of all pairwise differences between chronologically ordered observations:
                </p>
                <div className="bg-[#0B1426] p-2.5 rounded text-white font-mono text-[11px]">
                  S = Σ (k=1 to n-1) Σ (j=k+1 to n) sgn(x_j - x_k)
                </div>
              </div>

              <div className="bg-[#142240] p-4 rounded border border-[#2F4D7E]/50 text-xs font-mono">
                <span className="text-[#7CC4FF] font-bold block mb-1">2. Small-Sample Exact Permutation Distribution</span>
                <p className="text-[#A8B7D2] mb-2 font-inter text-[11px]">
                  For small samples (n ≤ 10), normal approximation distorts p-values. We evaluate exact distributions:
                </p>
                <div className="bg-[#0B1426] p-2.5 rounded text-white font-mono text-[11px]">
                  Untied: G_n(x) = (1/n!) Π (Σ x^j) &nbsp;|&nbsp; Tied: Multiset Permutations
                </div>
              </div>

              <div className="bg-[#142240] p-4 rounded border border-[#2F4D7E]/50 text-xs font-mono">
                <span className="text-[#7CF0BC] font-bold block mb-1">3. Theil-Sen Robust Slope with Actual Timestamps</span>
                <p className="text-[#A8B7D2] mb-2 font-inter text-[11px]">
                  Robust non-parametric slope calculated using actual elapsed fractional observation years (Δt_years):
                </p>
                <div className="bg-[#0B1426] p-2.5 rounded text-white font-mono text-[11px]">
                  Q_i = (x_j - x_k) / (t_j - t_k) &nbsp;→&nbsp; β = Median(Q) [units/year]
                </div>
              </div>

              <div className="bg-[#142240] p-4 rounded border border-[#2F4D7E]/50 text-xs font-mono">
                <span className="text-[#FFCE5C] font-bold block mb-1">4. Continuity-Corrected Asymptotic Z-Score</span>
                <p className="text-[#A8B7D2] mb-2 font-inter text-[11px]">
                  Adjusted for tied groups Σ t_i(t_i - 1)(2t_i + 5) and normalized by standard error:
                </p>
                <div className="bg-[#0B1426] p-2.5 rounded text-white font-mono text-[11px]">
                  Z = (S - 1) / √Var(S) &nbsp;[if S &gt; 0] &nbsp;→&nbsp; p = 2 * (1 - Φ(|Z|))
                </div>
              </div>
            </div>

            <div className="bg-[#142240]/80 p-4 rounded-lg border border-[#2F4D7E]/60 text-xs font-inter text-[#DCE6F5] space-y-2">
              <div className="font-bold text-[#FF8A4F] font-mono text-[11px] uppercase">
                Statistical Assumptions & Limitations Notice:
              </div>
              <p className="leading-relaxed text-[#A8B7D2]">
                <b>1. Exchangeability under H₀:</b> The Mann-Kendall test assumes observations are independent and identically distributed under the null hypothesis of no trend. If positive serial correlation (autocorrelation, ρ &gt; 0) is present, the variance of S is underestimated, which inflates the probability of false-positive trend detection (Type I error).
              </p>
              <p className="leading-relaxed text-[#A8B7D2]">
                <b>2. Non-Rejection Interpretation:</b> When p ≥ 0.05 (such as in regional baseline BD-TRP-SYL where p = 0.10868), the result is strictly designated as <b>'MONOTONIC NULL NOT REJECTED'</b>. This does NOT prove zero emissions or cyclicality without separate Fourier or spectral frequency analysis.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 3: QA & SCREENING */}
      {activeSection === 'qa' && (
        <div className="bg-[#0E1A30] p-6 rounded-lg border border-[#2F4D7E]/70 shadow-md space-y-6">
          <div>
            <h3 className="text-lg font-manrope font-bold text-white mb-2">
              Quality Assurance Protocol & Monsoon Screening Sensitivity
            </h3>
            <p className="text-xs text-[#DCE6F5] font-inter leading-relaxed mb-4">
              Satellite observations in South Asia are subject to persistent summer cloud cover during the monsoon season (June through September). Methane Detective distinguishes official provider quality criteria from project-specific additional screening:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="bg-[#142240] p-4 rounded border border-[#7CF0BC]/50">
                <div className="text-xs font-mono font-bold text-[#7CF0BC] mb-1">
                  1. OFFICIAL COPERNICUS PUM CRITERION
                </div>
                <div className="text-white font-bold text-sm mb-1">qa_value &gt; 0.50 Requirement</div>
                <p className="text-xs text-[#A8B7D2] font-inter leading-relaxed">
                  The Sentinel-5P Methane Product User Manual (SRON-S5P-LEV2-MA-001, v2.9.1) requires filtering by <code>qa_value &gt; 0.5</code>. This removes corrupt retrievals, excessive solar/view zenith angles, and thick cloud cover while retaining clear-sky and low-aerosol pixels.
                </p>
              </div>

              <div className="bg-[#142240] p-4 rounded border border-[#FF8A4F]/50">
                <div className="text-xs font-mono font-bold text-[#FF8A4F] mb-1">
                  2. PROJECT-SPECIFIC CLOUD SCREENING
                </div>
                <div className="text-white font-bold text-sm mb-1">cloud_fraction_crb &lt; 0.20 Screening</div>
                <p className="text-xs text-[#A8B7D2] font-inter leading-relaxed">
                  Treated strictly as a project-specific additional screening condition (NOT an official universal ESA/NASA requirement) to further suppress boundary-layer cloud scattering artifacts in humid deltaic regions.
                </p>
              </div>
            </div>

            {/* Sensitivity Analysis Table */}
            <div className="mb-6">
              <h4 className="text-xs font-mono font-bold text-[#7CC4FF] uppercase tracking-wider mb-2">
                Sensitivity Comparison: Standard QA vs. Additional Cloud Filtering (Surma Basin)
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-inter border border-[#2F4D7E]/60 rounded-lg overflow-hidden">
                  <thead className="bg-[#142240] font-mono text-[11px] text-[#A8B7D2]">
                    <tr>
                      <th className="p-2.5 border-b border-[#2F4D7E]/60">Filtering Standard</th>
                      <th className="p-2.5 border-b border-[#2F4D7E]/60">Condition Applied</th>
                      <th className="p-2.5 border-b border-[#2F4D7E]/60">Valid Pixel Yield</th>
                      <th className="p-2.5 border-b border-[#2F4D7E]/60">Monsoon Rejection</th>
                      <th className="p-2.5 border-b border-[#2F4D7E]/60">Baseline XCH4 Drift</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#2F4D7E]/40 font-mono text-[11px] text-[#DCE6F5]">
                    <tr className="hover:bg-[#142240]/40">
                      <td className="p-2.5 text-white font-bold">Standard PUM Filtering</td>
                      <td className="p-2.5 text-[#7CF0BC]">qa_value &gt; 0.50</td>
                      <td className="p-2.5">100% baseline (14,820 px)</td>
                      <td className="p-2.5 text-[#FFCE5C]">78.4% rejected</td>
                      <td className="p-2.5">+13.40 ppb / year</td>
                    </tr>
                    <tr className="hover:bg-[#142240]/40">
                      <td className="p-2.5 text-white font-bold">Project Screened Filter</td>
                      <td className="p-2.5 text-[#FF8A4F]">qa_value &gt; 0.50 + cloud &lt; 0.20</td>
                      <td className="p-2.5">72.6% retained (10,760 px)</td>
                      <td className="p-2.5 text-[#FF8A4F]">96.8% rejected</td>
                      <td className="p-2.5">+12.81 ppb / year</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Monthly Coverage & Data Availability Table */}
            <div>
              <h4 className="text-xs font-mono font-bold text-[#7CC4FF] uppercase tracking-wider mb-2">
                Surma Basin Regional Atmospheric Column Observation Matrix (2023–2025)
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-inter border border-[#2F4D7E]/60 rounded-lg overflow-hidden">
                  <thead className="bg-[#142240] font-mono text-[10px] text-[#A8B7D2]">
                    <tr>
                      <th className="p-2 border-b border-[#2F4D7E]/60">Month</th>
                      <th className="p-2 border-b border-[#2F4D7E]/60">Granules</th>
                      <th className="p-2 border-b border-[#2F4D7E]/60">Raw Soundings</th>
                      <th className="p-2 border-b border-[#2F4D7E]/60">Valid (QA &gt; 0.5)</th>
                      <th className="p-2 border-b border-[#2F4D7E]/60">Valid (+Cloud &lt; 0.2)</th>
                      <th className="p-2 border-b border-[#2F4D7E]/60">Regional XCH4</th>
                      <th className="p-2 border-b border-[#2F4D7E]/60">Uncertainty</th>
                      <th className="p-2 border-b border-[#2F4D7E]/60">Missing-Data Classification</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#2F4D7E]/40 font-mono text-[10px] text-[#DCE6F5]">
                    <tr className="hover:bg-[#142240]/40">
                      <td className="p-2 text-white font-bold">JAN 2023</td>
                      <td className="p-2">14</td>
                      <td className="p-2">1,820</td>
                      <td className="p-2">1,540</td>
                      <td className="p-2 text-[#7CF0BC]">1,420</td>
                      <td className="p-2 font-bold text-white">1,912 ppb</td>
                      <td className="p-2">±8.4 ppb</td>
                      <td className="p-2 text-[#7CF0BC]">Valid Sounding Baseline</td>
                    </tr>
                    <tr className="hover:bg-[#142240]/40">
                      <td className="p-2 text-white font-bold">APR 2023</td>
                      <td className="p-2">12</td>
                      <td className="p-2">1,560</td>
                      <td className="p-2">1,180</td>
                      <td className="p-2 text-[#7CF0BC]">980</td>
                      <td className="p-2 font-bold text-white">1,904 ppb</td>
                      <td className="p-2">±9.1 ppb</td>
                      <td className="p-2 text-[#7CF0BC]">Valid Sounding Baseline</td>
                    </tr>
                    <tr className="hover:bg-[#142240]/40 bg-[#FF8A4F]/5">
                      <td className="p-2 text-[#FF8A4F] font-bold">JUL 2023</td>
                      <td className="p-2">15</td>
                      <td className="p-2">1,950</td>
                      <td className="p-2">42</td>
                      <td className="p-2 text-[#FF8A4F]">0</td>
                      <td className="p-2 text-[#A8B7D2]">—</td>
                      <td className="p-2 text-[#A8B7D2]">—</td>
                      <td className="p-2 text-[#FF8A4F]">All observations rejected by QA/cloud (Monsoon overcast)</td>
                    </tr>
                    <tr className="hover:bg-[#142240]/40">
                      <td className="p-2 text-white font-bold">OCT 2023</td>
                      <td className="p-2">13</td>
                      <td className="p-2">1,690</td>
                      <td className="p-2">1,310</td>
                      <td className="p-2 text-[#7CF0BC]">1,150</td>
                      <td className="p-2 font-bold text-white">1,928 ppb</td>
                      <td className="p-2">±8.6 ppb</td>
                      <td className="p-2 text-[#7CF0BC]">Valid Sounding Baseline</td>
                    </tr>
                    <tr className="hover:bg-[#142240]/40">
                      <td className="p-2 text-white font-bold">JAN 2024</td>
                      <td className="p-2">14</td>
                      <td className="p-2">1,820</td>
                      <td className="p-2">1,610</td>
                      <td className="p-2 text-[#7CF0BC]">1,510</td>
                      <td className="p-2 font-bold text-white">1,925 ppb</td>
                      <td className="p-2">±7.9 ppb</td>
                      <td className="p-2 text-[#7CF0BC]">Valid Sounding Baseline</td>
                    </tr>
                    <tr className="hover:bg-[#142240]/40">
                      <td className="p-2 text-white font-bold">APR 2024</td>
                      <td className="p-2">11</td>
                      <td className="p-2">1,430</td>
                      <td className="p-2">1,090</td>
                      <td className="p-2 text-[#7CF0BC]">890</td>
                      <td className="p-2 font-bold text-white">1,918 ppb</td>
                      <td className="p-2">±9.4 ppb</td>
                      <td className="p-2 text-[#7CF0BC]">Valid Sounding Baseline</td>
                    </tr>
                    <tr className="hover:bg-[#142240]/40 bg-[#FF8A4F]/5">
                      <td className="p-2 text-[#FF8A4F] font-bold">JUL 2024</td>
                      <td className="p-2">14</td>
                      <td className="p-2">1,820</td>
                      <td className="p-2">35</td>
                      <td className="p-2 text-[#FF8A4F]">0</td>
                      <td className="p-2 text-[#A8B7D2]">—</td>
                      <td className="p-2 text-[#A8B7D2]">—</td>
                      <td className="p-2 text-[#FF8A4F]">All observations rejected by QA/cloud (Monsoon overcast)</td>
                    </tr>
                    <tr className="hover:bg-[#142240]/40">
                      <td className="p-2 text-white font-bold">OCT 2024</td>
                      <td className="p-2">12</td>
                      <td className="p-2">1,560</td>
                      <td className="p-2">1,240</td>
                      <td className="p-2 text-[#7CF0BC]">1,080</td>
                      <td className="p-2 font-bold text-white">1,941 ppb</td>
                      <td className="p-2">±8.8 ppb</td>
                      <td className="p-2 text-[#7CF0BC]">Valid Sounding Baseline</td>
                    </tr>
                    <tr className="hover:bg-[#142240]/40">
                      <td className="p-2 text-white font-bold">JAN 2025</td>
                      <td className="p-2">15</td>
                      <td className="p-2">1,950</td>
                      <td className="p-2">1,720</td>
                      <td className="p-2 text-[#7CF0BC]">1,620</td>
                      <td className="p-2 font-bold text-white">1,938 ppb</td>
                      <td className="p-2">±7.8 ppb</td>
                      <td className="p-2 text-[#7CF0BC]">Valid Sounding Baseline</td>
                    </tr>
                    <tr className="hover:bg-[#142240]/40">
                      <td className="p-2 text-white font-bold">APR 2025</td>
                      <td className="p-2">13</td>
                      <td className="p-2">1,690</td>
                      <td className="p-2">1,210</td>
                      <td className="p-2 text-[#7CF0BC]">990</td>
                      <td className="p-2 font-bold text-white">1,932 ppb</td>
                      <td className="p-2">±9.0 ppb</td>
                      <td className="p-2 text-[#7CF0BC]">Valid Sounding Baseline</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="text-[11px] text-[#A8B7D2] font-inter mt-2">
                *Note: Missing monsoon soundings are documented transparently as quality/cloud filtering rejections, NOT labeled as provider outages. Observations are never synthetically interpolated.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 4: FAQ */}
      {activeSection === 'faq' && (
        <div className="bg-[#0E1A30] p-6 rounded-lg border border-[#2F4D7E]/70 shadow-md space-y-4">
          <h3 className="text-lg font-manrope font-bold text-white mb-2">
            Frequently Asked Scientific Questions
          </h3>

          <div className="space-y-3 font-inter text-xs text-[#DCE6F5]">
            <div className="bg-[#142240] p-3.5 rounded border border-[#2F4D7E]/50">
              <div className="font-bold text-white mb-1">What is the difference between ppm·m and kg/hr?</div>
              <p className="text-[#A8B7D2] leading-relaxed">
                <b>ppm·m (parts per million meters)</b> is the spectroscopic measurement of path-integrated methane enhancement along the atmospheric column between the ground and the satellite sensor. <b>kg/hr</b> is the estimated rate of methane mass leaking into the atmosphere, derived by multiplying the integrated plume enhancement by the local boundary-layer wind speed. Raw column enhancement cannot be multiplied by GWP without mass inversion modeling!
              </p>
            </div>

            <div className="bg-[#142240] p-3.5 rounded border border-[#2F4D7E]/50">
              <div className="font-bold text-white mb-1">How are Global Warming Potential (GWP) factors defined in IPCC AR6?</div>
              <p className="text-[#A8B7D2] leading-relaxed">
                According to the <b>IPCC Sixth Assessment Report (AR6), Working Group I, Chapter 7, Table 7.15 (with Official Published Errata)</b>, methane metrics explicitly account for climate-carbon feedbacks and differentiate fossil from biogenic origin:
                <br />• <b>Fossil Methane:</b> GWP₂₀ = 82.5, GWP₁₀₀ = 29.8
                <br />• <b>Non-Fossil / Biogenic Methane:</b> GWP₂₀ = 79.7, GWP₁₀₀ = 27.0 (corrected from pre-print 80.8/27.2 in official IPCC errata)
              </p>
            </div>

            <div className="bg-[#142240] p-3.5 rounded border border-[#2F4D7E]/50">
              <div className="font-bold text-white mb-1">Why does rice agriculture have a cyclical pattern while point leaks show monotonic drift?</div>
              <p className="text-[#A8B7D2] leading-relaxed">
                Flooded rice fields produce biogenic methane via microbial methanogenesis during standing water periods (July–August monsoon Aman rice). Once fields are drained for harvest, emissions collapse naturally. In contrast, unmitigated pressurized infrastructure continues venting continuously without seasonal respite.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 5: DATA PROVENANCE & GRANULE LINEAGE */}
      {activeSection === 'provenance' && (
        <div className="bg-[#0E1A30] p-6 rounded-lg border border-[#2F4D7E]/70 shadow-md space-y-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-[#93C5FD] mb-1">
              <Layers className="w-4 h-4" />
              <span>FORENSIC SCIENTIFIC INTEGRITY & DATA DISCLOSURE</span>
            </div>
            <h3 className="text-lg font-manrope font-bold text-white mb-2">
              Data Lineage, Real NASA Granules & Demonstration Scenarios
            </h3>
            <p className="text-xs text-[#DCE6F5] font-inter leading-relaxed mb-4">
              Scientific credibility requires total transparency regarding satellite observations, derived products, and curated test vectors. Methane Detective rigorously distinguishes between direct raw spaceborne granules, live open APIs, and curated multi-satellite demonstration scenarios.
            </p>

            <div className="space-y-4">
              {/* Category 1: Genuine NASA Granule */}
              <div className="bg-[#142240] p-4 rounded border border-[#7CC4FF]/40">
                <div className="flex items-center justify-between text-xs font-mono text-[#7CC4FF] mb-1">
                  <span className="font-bold">GENUINE SATELLITE GRANULE (NASA CMR LPCLOUD)</span>
                  <span className="bg-[#7CC4FF]/20 text-[#7CC4FF] px-2 py-0.5 rounded text-[10px]">VERIFIED NASA JPL</span>
                </div>
                <h4 className="text-sm font-manrope font-bold text-white mb-2">
                  NASA EMIT L2B Methane Plume Complex 000583 (Plume #583)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono text-[#DCE6F5] mb-2 bg-[#0B1426] p-3 rounded">
                  <div>Granule UR: <span className="text-white">EMIT_L2B_CH4PLM_002_20230123T085311_000583</span></div>
                  <div>Collection Concept ID: <span className="text-white">C3242707413-LPCLOUD</span></div>
                  <div>Centroid Coordinates: <span className="text-[#FF8A4F]">24.6355°N, 91.5939°E</span> (Nabiganj, Habiganj)</div>
                  <div>Acquisition Timestamp: <span className="text-white">2023-01-23T08:53:11Z (Orbit 2302306)</span></div>
                  <div>Geospatial Proximity: <span className="text-[#7CF0BC]">~6.94 km from Bibiyana / ~42.8 km from Kailashtilla</span></div>
                  <div>Model-Derived Flux: <span className="text-white">~820 kg/hr ±24% (IME Inversion, 2.7 m/s wind)</span></div>
                </div>
                <p className="text-[11px] text-[#A8B7D2] font-inter leading-relaxed">
                  Direct physical observation acquired by the EMIT imaging spectrometer on the International Space Station over Nabiganj in northeastern Bangladesh. The 21-vertex polygon boundary reflects the detected ~74 ppm·m nadir enhancement. The emission rate estimate (~820 kg/hr) is a mathematical inversion estimate, NOT a direct facility meter measurement. It is an isolated single-overpass spaceborne snapshot, not a continuous multi-year trend, and is not attributed to a named facility without ground verification.
                </p>
              </div>

              {/* Category 2: Curated Demonstration Scenarios */}
              <div className="bg-[#142240] p-4 rounded border border-[#FF8A4F]/40">
                <div className="flex items-center justify-between text-xs font-mono text-[#FF8A4F] mb-1">
                  <span className="font-bold">CURATED DEMONSTRATION SCENARIOS (ALGORITHMIC FIXTURES)</span>
                  <span className="bg-[#FF8A4F]/20 text-[#FF8A4F] px-2 py-0.5 rounded text-[10px]">SCIENTIFICALLY ANCHORED</span>
                </div>
                <h4 className="text-sm font-manrope font-bold text-white mb-2">
                  Multi-Pass Algorithmic Verification Test Vectors
                </h4>
                <div className="bg-[#0B1426] p-2.5 rounded border border-[#FF8A4F]/50 text-xs font-inter text-[#FF8A4F] font-bold mb-3">
                  Notice: Curated Demonstration Scenario — Not a Continuous Record of Direct Satellite Observations.
                </div>
                <p className="text-xs text-[#DCE6F5] font-inter leading-relaxed mb-3">
                  Because NASA EMIT on the ISS operates on an asynchronous ~90-minute precessing orbit (51.6° inclination) with episodic coverage of South Asia, the multi-node time series for BD-SYL-014, BD-SYL-007, and BD-DHK-022 are curated test vectors. They serve as rigorous mathematical benchmarks for small-sample exact permutation testing:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-[11px] font-mono mb-3">
                  <div className="bg-[#0B1426] p-2.5 rounded border border-[#2F4D7E]/40">
                    <div className="text-[#FF8A4F] font-bold mb-1">BD-SYL-014 (Gas Demo)</div>
                    <div className="text-[#A8B7D2] font-inter">n=8, S=28: p_exact = 0.0000496 &lt; 0.05 (Monotonic trend detected).</div>
                  </div>
                  <div className="bg-[#0B1426] p-2.5 rounded border border-[#2F4D7E]/40">
                    <div className="text-[#7CF0BC] font-bold mb-1">BD-SYL-007 (Rice Demo)</div>
                    <div className="text-[#A8B7D2] font-inter">n=7, S=5: p_exact = 0.5619 &gt; 0.05 (Monotonic null not rejected).</div>
                  </div>
                  <div className="bg-[#0B1426] p-2.5 rounded border border-[#2F4D7E]/40">
                    <div className="text-[#7CC4FF] font-bold mb-1">BD-DHK-022 (Landfill Demo)</div>
                    <div className="text-[#A8B7D2] font-inter">n=6, S=15: p_exact = 0.00278 &lt; 0.05 (Monotonic trend detected).</div>
                  </div>
                </div>
                <p className="text-[11px] text-[#A8B7D2] font-inter leading-relaxed">
                  Important: A statistically significant result on a curated demonstration scenario proves the algorithmic capability of the client-side detection engine, but does NOT constitute evidence of a real-world physical leakage trend at that location.
                </p>
              </div>

              {/* Category 3: Live API Streams */}
              <div className="bg-[#142240] p-4 rounded border border-[#FFCE5C]/40">
                <div className="flex items-center justify-between text-xs font-mono text-[#FFCE5C] mb-1">
                  <span className="font-bold">LIVE OPEN API STREAMS (NASA GSFC & CMR)</span>
                  <span className="bg-[#FFCE5C]/20 text-[#FFCE5C] px-2 py-0.5 rounded text-[10px]">REAL-TIME REST</span>
                </div>
                <h4 className="text-sm font-manrope font-bold text-white mb-2">
                  Live Active Event & Granule Verification
                </h4>
                <p className="text-xs text-[#DCE6F5] font-inter leading-relaxed">
                  Methane Detective actively polls the live NASA EONET v3 endpoint (<span className="font-mono text-[#FFCE5C]">https://eonet.gsfc.nasa.gov/api/v3/events</span>) and NASA CMR Search API (<span className="font-mono text-[#7CC4FF]">https://cmr.earthdata.nasa.gov/search/granules.json</span>). No API keys or credentials are required, enabling open reproducibility for judges, researchers, and citizen scientists.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mandatory NASA Non-Endorsement Notice Banner */}
      <div className="mt-8 p-3.5 rounded-xl bg-[#142240] border border-[#243B66] text-xs font-inter text-[#A8B7D2] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-[#7CC4FF] shrink-0" />
          <span className="leading-relaxed">{t.nonEndorsement}</span>
        </div>
        <span className="text-[10px] font-mono text-[#7CC4FF] px-2 py-0.5 rounded bg-[#080E1A] border border-[#243B66] whitespace-nowrap">
          OFFICIAL NASA NOTICE
        </span>
      </div>
    </div>
  );
};
