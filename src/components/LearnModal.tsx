import React, { useState, useEffect } from 'react';
import { BookOpen, X, HelpCircle, Compass, BarChart2, ShieldCheck, AlertTriangle, CheckCircle2, ChevronRight, Layers, ArrowRight } from 'lucide-react';

interface LearnModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: 'en' | 'bn';
}

type LearnTab = 'journey' | 'terms' | 'interpret';

interface GlossaryTerm {
  id: string;
  termEn: string;
  termBn: string;
  summaryEn: string;
  summaryBn: string;
  whyMattersEn: string;
  whyMattersBn: string;
  technicalEn: string;
  technicalBn: string;
  category: 'core' | 'stats' | 'satellite';
}

const GLOSSARY_TERMS: GlossaryTerm[] = [
  {
    id: 'variable',
    termEn: '1. Earth-System Variable',
    termBn: '১. পৃথিবী-ব্যবস্থার চলক (Earth-System Variable)',
    category: 'core',
    summaryEn: 'A measurable physical quantity describing conditions in Earth\'s air, water, or land—such as atmospheric methane, monthly rainfall, or forest greenness.',
    summaryBn: 'পৃথিবীর বাতাস, পানি বা ভূমির অবস্থা নির্দেশকারী যেকোনো পরিমাপযোগ্য ভৌত মান—যেমন বাতাসের মিথেন গ্যাস, মাসিক বৃষ্টিপাত বা উদ্ভিদের সবুজায়ন।',
    whyMattersEn: 'Earth works as a connected system. You cannot fully understand seasonal wetland methane without also tracking precipitation and flood cycles.',
    whyMattersBn: 'পৃথিবীর সমস্ত প্রাকৃতিক মণ্ডল পরস্পর সংযুক্ত। বৃষ্টিপাত এবং বন্যার চক্র না বুঝে হাওর অঞ্চলের মৌসুমি মিথেন নিঃসরণ পুরোপুরি বোঝা অসম্ভব।',
    technicalEn: 'State variable quantified by spaceborne remote sensing across the atmosphere, hydrosphere, biosphere, cryosphere, or lithosphere.',
    technicalBn: 'বায়ুমণ্ডল, বারিমণ্ডল ও জীবমণ্ডলে উপগ্রহ সেন্সর দ্বারা পরিমাপকৃত ভৌত অবস্থার চলক।'
  },
  {
    id: 'timeseries',
    termEn: '2. Time Series',
    termBn: '২. সময় ক্রম (Time Series)',
    category: 'core',
    summaryEn: 'A sequence of data points recorded chronologically over time at the same geographic location (e.g. monthly satellite readings from 2019 to 2026).',
    summaryBn: 'একই ভৌগোলিক স্থানে নিয়মিত সময়ের ব্যবধানে ধারাবাহিকভাবে সংগৃহীত উপাত্তের তালিকা (যেমন ২০১৯ থেকে ২০২৬ পর্যন্ত প্রতি মাসের উপগ্রহ রিডিং)।',
    whyMattersEn: 'A single satellite image is only a snapshot. A time series reveals whether conditions are rising, falling, or repeating with seasons over years.',
    whyMattersBn: 'একটিমাত্র উপগ্রহ ছবি কেবল একটি মুহূর্তের চিত্র। বহু বছরের টাইম সিরিজই প্রকাশ করে কোনো দূষণ কি বাড়ছে, কমছে নাকি ঋতু পরিবর্তনের সাথে আবর্তিত হচ্ছে।',
    technicalEn: 'Chronologically indexed discrete observations X = {x₁, x₂, ..., xₙ} sampled at uniform or non-uniform temporal intervals.',
    technicalBn: 'কালানুক্রমিক পর্যবেক্ষণ ধারা X = {x₁, x₂, ..., xₙ}।'
  },
  {
    id: 'trend',
    termEn: '3. Trend',
    termBn: '৩. দীর্ঘমেয়াদী প্রবণতা (Trend)',
    category: 'stats',
    summaryEn: 'The long-term directional movement of data over many years, separated from short-term seasonal swings or random daily noise.',
    summaryBn: 'ঋতুভিত্তিক ওঠানামা বা ক্ষণস্থায়ী গোলযোগ বাদ দিয়ে বহু বছর ধরে কোনো বিষয়ের দীর্ঘমেয়াদী সাধারণ গতি বা অভিমুখ।',
    whyMattersEn: 'Prevents confusing a single rainy season or sudden factory spike with long-term climate change.',
    whyMattersBn: 'একটিমাত্র প্রবল বর্ষার মাস বা সাময়িক ধোঁয়াশাকে দীর্ঘমেয়াদী জলবায়ু বিপর্যয় ভেবে ভুল করা থেকে রক্ষা করে।',
    technicalEn: 'Monotonic directional drift in the underlying probability distribution after accounting for seasonality and stochastic noise.',
    technicalBn: 'সম্ভাব্যতা বিন্যাসে একমুখী দীর্ঘমেয়াদী স্থানান্তর (Monotonic drift)।'
  },
  {
    id: 'theilsen',
    termEn: '4. Theil-Sen Slope',
    termBn: '৪. থেইল-সেন রেখাঢাল (Theil-Sen Slope)',
    category: 'stats',
    summaryEn: 'A robust mathematical method that measures how fast a trend is rising or falling (e.g. +12.81 ppb/year). Unlike ordinary averages, it cannot be distorted by outlier spikes.',
    summaryBn: 'একটি নির্ভরযোগ্য গাণিতিক পদ্ধতি যা পরিমাপ করে কোনো মান প্রতি বছর কত দ্রুত বাড়ছে বা কমছে। সাধারণ গড়ের মতো এটি ভুল বা চরম মান (Outliers) দ্বারা বিভ্রান্ত হয় না।',
    whyMattersEn: 'Satellite readings frequently encounter bad pixels or cloud contamination. Theil-Sen takes the median of all pairwise slopes, tolerating up to 29% corrupt data without breaking.',
    whyMattersBn: 'উপগ্রহ উপাত্তে মেঘ বা সেন্সরের ত্রুটিপূর্ণ মান থাকতে পারে। থেইল-সেন সব জোড়া মানের মধ্যমা ঢাল গ্রহণ করে, ফলে ২৯% পর্যন্ত ত্রুটি থাকলেও সঠিক ফলাফল দেয়।',
    technicalEn: 'Median of pairwise slopes: Median{(xⱼ - xₖ)/(j - k) for all j > k}. Highly robust non-parametric linear rate estimator.',
    technicalBn: 'জোড়াবদ্ধ ঢালের মধ্যমা (Median of pairwise slopes)।'
  },
  {
    id: 'mannkendall',
    termEn: '5. Mann-Kendall Test',
    termBn: '৫. ম্যান-কেন্ডাল পরীক্ষা (Mann-Kendall Test)',
    category: 'stats',
    summaryEn: 'A non-parametric statistical test that checks whether an upward or downward trend is consistently real, or could simply be an accidental random pattern.',
    summaryBn: 'একটি অ-প্যারামেট্রিক পরিসংখ্যানিক পরীক্ষা যা যাচাই করে কোনো উপাত্তের বৃদ্ধি বা হ্রাস কি আসলেই পদ্ধতিগত, নাকি স্রেফ দৈব偶然 কোনো ঘটনা।',
    whyMattersEn: 'It does not require data to follow a perfect bell curve (normal distribution) and handles missing dates gracefully, making it the NASA standard for Earth observation.',
    whyMattersBn: 'এর জন্য উপাত্তকে নিখুঁত স্বাভাবিক বিন্যাসে (Normal distribution) থাকতে হয় না এবং মেঘের কারণে ফাঁকা তারিখ থাকলেও কাজ করে।',
    technicalEn: 'Rank-based test evaluating the directional sign sum S = Σ Σ sgn(xⱼ - xₖ). Standardized as Z-score under null hypothesis H₀ of no trend.',
    technicalBn: 'উপাত্তের মানের ক্রমবিন্যাসভিত্তিক এস-যোগফল (S-statistic) পরীক্ষা।'
  },
  {
    id: 'pvalue',
    termEn: '6. P-value',
    termBn: '৬. পি-মান (P-value)',
    category: 'stats',
    summaryEn: 'The probability that you would see a trend this strong purely by pure chance, even if nothing was actually changing.',
    summaryBn: 'প্রকৃতপক্ষে কোনো পরিবর্তন না থাকা সত্ত্বেও দৈব সুযোগে কাকতালীয়ভাবে এমন একটি ধারা পাওয়ার গাণিতিক সম্ভাবনা।',
    whyMattersEn: 'A smaller p-value gives us greater confidence. A threshold of p < 0.05 means there is less than a 5% chance the trend is pure coincidence.',
    whyMattersBn: 'পি-মান যত কম, নিশ্চয়তা তত বেশি। সাধারণত p < 0.05 হলে বিজ্ঞানীরা নিশ্চিত হন যে ফলাফলটি কাকতালীয় নয়।',
    technicalEn: 'p = P(|Z| ≥ |z_obs| | H₀). Computed via exact permutation distributions for small samples and Edgeworth-corrected normal approximation for n > 10.',
    technicalBn: 'নাল হাইপোথিসিস সত্য থাকা সাপেক্ষে পর্যবেক্ষণকৃত বা তার চেয়ে চরম ফলাফল পাওয়ার সম্ভাবনা।'
  },
  {
    id: 'significance',
    termEn: '7. Statistical Significance',
    termBn: '৭. পরিসংখ্যানগত তাৎপর্য (Statistical Significance)',
    category: 'stats',
    summaryEn: 'A formal scientific rule (typically p < 0.05) used to distinguish a confirmed discovery from inconclusive speculation.',
    summaryBn: 'একটি বিজ্ঞানসম্মত সীমানা (সাধারণত p < 0.05) যা নির্ধারণ করে কোনো ফলাফল বৈজ্ঞানিকভাবে প্রমাণিত নাকি অপ্রমাণিত অনুমান।',
    whyMattersEn: 'It stops scientists and policymakers from panicking over noise or declaring victory when data is still uncertain.',
    whyMattersBn: 'তথ্য যখন এখনও অপর্যাপ্ত বা অনিশ্চিত, তখন অহেতুক আতঙ্ক বা ভুল সিদ্ধান্ত গ্রহণ থেকে এটি বিজ্ঞানীদের রক্ষা করে।',
    technicalEn: 'Rejection of null hypothesis H₀ at predefined alpha level (α = 0.05). Non-rejection indicates insufficient evidence, not definitive proof of zero change.',
    technicalBn: 'নির্দিষ্ট তাৎপর্য স্তরে (α = 0.05) নাল হাইপোথিসিস বাতিল করার বৈজ্ঞানিক সিদ্ধান্ত।'
  },
  {
    id: 'ci',
    termEn: '8. Confidence Interval',
    termBn: '৮. নির্ভরযোগ্যতার ব্যাপ্তি (Confidence Interval)',
    category: 'stats',
    summaryEn: 'A range of likely numbers within which the true yearly change almost certainly lies (for example, between -2.4 and +28.1 ppb/year).',
    summaryBn: 'একটি সম্ভাব্য সংখ্যাসীমা যার ভেতরে প্রতি বছরের প্রকৃত পরিবর্তন অবস্থান করার সম্ভাবনা ৯৫% (যেমন: -২.৪ থেকে +২৮.১ পিপিবি/বছর)।',
    whyMattersEn: 'Real science embraces honest uncertainty rather than making overconfident claims about a single exact decimal.',
    whyMattersBn: 'প্রকৃত বিজ্ঞান একটিমাত্র একক সংখ্যার অহংকার না দেখিয়ে সততার সাথে নির্ভুলতার সম্ভাব্য সীমা প্রকাশ করে।',
    technicalEn: 'Sen-Kendall 95% two-sided non-parametric rank interval calculated via critical standard normal order statistics M₁ and M₂.',
    technicalBn: 'সেন-কেন্ডাল ৯৫% অ-প্যারামেট্রিক র‍্যাংক ইন্টারভ্যাল।'
  },
  {
    id: 'xch4',
    termEn: '9. XCH4 (Column Methane)',
    termBn: '৯. কলাম মিথেন (XCH4 Column-Averaged Dry Air)',
    category: 'satellite',
    summaryEn: 'The average concentration of methane in the entire column of air from Earth\'s ground up to the edge of space, measured in parts per billion (ppb).',
    summaryBn: 'মাটি থেকে মহাশূন্যের সীমানা পর্যন্ত বায়ুমণ্ডলের সম্পূর্ণ উল্লম্ব কলামে মিথেনের গড় অনুপাত, যা প্রতি একশ কোটি ভাগে (ppb) পরিমাপ করা হয়।',
    whyMattersEn: 'Satellites look down through the entire atmosphere. XCH4 shows the total gas burden overhead, rather than just what is touching the ground.',
    whyMattersBn: 'মহাকাশ থেকে উপগ্রহ পুরো বায়ুমণ্ডলের ভেতর দিয়ে তাকায়। তাই এটি শুধু মাটিতে থাকা গ্যাস নয়, বরং মাথার ওপরের পুরো বাতাসের মিথেন পরিমাপ করে।',
    technicalEn: 'Column-averaged dry-air mole fraction XCH4 = VCD_CH4 / VCD_dryair, retrieved from SWIR absorption bands by Sentinel-5P TROPOMI.',
    technicalBn: 'বায়ুমণ্ডলের সামগ্রিক কলামে শুষ্ক বাতাসের বিপরীতে মিথেনের আনবিক অনুপাত (ppb)।'
  },
  {
    id: 'ppmm',
    termEn: '10. ppm·m (Parts Per Million-Meter)',
    termBn: '১০. পিপিএম-মিটার (ppm·m Plume Enhancement)',
    category: 'satellite',
    summaryEn: 'A unit measuring how concentrated a local methane plume is, calculated by multiplying gas concentration by cloud thickness in meters.',
    summaryBn: 'স্থানীয় কোনো গ্যাস মেঘের ঘনত্ব মাপার একক; এটি গ্যাসের ঘনত্ব (ppm) এবং মেঘের পুরুত্বের (মিটার) গুণফল।',
    whyMattersEn: 'A high ppm·m reading indicates an intense, concentrated leak right over a pipeline, compressor station, or landfill fissure.',
    whyMattersBn: 'উচ্চ পিপিএম-মিটার নির্দেশ করে কোনো পাইপলাইন বা ল্যান্ডফিলের সরাসরি ওপর তীব্র ও ঘনীভূত গ্যাসের ছিদ্র রয়েছে।',
    technicalEn: 'Integrated column enhancement ΔΩ = ∫ ΔC(z) dz in ppm·m, retrieved by NASA EMIT\'s 285-band imaging spectrometer.',
    technicalBn: 'নাসা এমিট স্পেকট্রোমিটার দ্বারা শনাক্তকৃত ঘনীভূত মিথেন গ্যাস স্তম্ভের সংহত মান।'
  },
  {
    id: 'ndvi',
    termEn: '11. NDVI (Vegetation Index)',
    termBn: '১১. এনডিভিআই সূচক (Normalized Difference Vegetation Index)',
    category: 'satellite',
    summaryEn: 'An Earth greenness index ranging from -1 to +1. Dense green plants reflect infrared light and score high (~0.7), while open water scores near zero.',
    summaryBn: 'গাছপালা ও ফসলের সতেজতা মাপার সূচক (-১ থেকে +১)। সতেজ সবুজ পাতা নিকট-অবলোহিত আলো বেশি প্রতিফলিত করে (০.৭), আর পানি বা প্লাবিত জমি ০ এর কাছাকাছি থাকে।',
    whyMattersEn: 'In wetlands, low NDVI tracks monsoon flooding, while rising NDVI signals winter rice cultivation—a known source of biogenic methane.',
    whyMattersBn: 'হাওর অঞ্চলে বর্ষাকালে পানি জমে থাকায় NDVI ০.১৮-এ নেমে যায়, আর শীতকালে বোরো ধানের বৃদ্ধির সাথে সাথে তা ০.৬৮ পর্যন্ত ওঠে।',
    technicalEn: 'Normalized Difference Vegetation Index: (NIR - Red) / (NIR + Red), derived from NASA Terra MODIS bands 1 & 2 at 250m resolution.',
    technicalBn: 'নাসা টেরা মডিস উপগ্রহের ব্যান্ড ১ ও ২ হতে গণনাকৃত উদ্ভিদের স্বাভাবিকীকৃত সূচক।'
  }
];

export const LearnModal: React.FC<LearnModalProps> = ({ isOpen, onClose, lang }) => {
  const [activeTab, setActiveTab] = useState<LearnTab>('journey');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [expandedTerm, setExpandedTerm] = useState<string | null>('variable');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filteredTerms = GLOSSARY_TERMS.filter(item => {
    const term = lang === 'bn' ? item.termBn : item.termEn;
    const summary = lang === 'bn' ? item.summaryBn : item.summaryEn;
    const q = searchTerm.toLowerCase();
    return term.toLowerCase().includes(q) || summary.toLowerCase().includes(q) || item.id.includes(q);
  });

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="learn-modal-title"
      className="fixed inset-0 z-[9999] flex items-center justify-center p-3 md:p-6 bg-black/80 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-[#080E1A] border border-[#243B66] rounded-xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden pointer-events-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 md:p-5 border-b border-[#243B66] bg-[#0E1A30]/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#142240] border border-[#7CF0BC]/60 flex items-center justify-center text-[#7CF0BC]">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="learn-modal-title" className="text-lg md:text-xl font-manrope font-bold text-white">
                  {lang === 'bn' ? 'মিথেন ডিটেকটিভ শিক্ষা কেন্দ্র' : 'METHANE DETECTIVE LEARNING CENTER'}
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#142240] border border-[#243B66] text-[#7CF0BC] uppercase">
                  Beginner Guide
                </span>
              </div>
              <p className="text-xs text-[#A8B7D2] font-inter mt-0.5">
                {lang === 'bn'
                  ? 'সহজ ভাষায় উপগ্রহ পর্যবেক্ষণ, পরিসংখ্যান এবং জলবায়ু বিজ্ঞান বোঝার সহায়ক গাইড'
                  : 'A friendly, zero-jargon guide to satellite observations, statistical trends, and climate impact'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-[#142240] hover:bg-[#1A2C50] text-[#A8B7D2] hover:text-white transition-colors"
            aria-label="Close Learning Center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-[#243B66] bg-[#0A1324] px-4 pt-2 gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('journey')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-inter font-medium border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'journey'
                ? 'border-[#FF8A4F] text-[#FF8A4F] bg-[#142240]/50'
                : 'border-transparent text-[#A8B7D2] hover:text-white'
            }`}
          >
            <Compass className="w-4 h-4" />
            <span>{lang === 'bn' ? 'ক) কীভাবে ব্যবহার করবেন (৩ ধাপ)' : 'Section A: How to Use (3 Steps)'}</span>
          </button>

          <button
            onClick={() => setActiveTab('terms')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-inter font-medium border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'terms'
                ? 'border-[#7CC4FF] text-[#7CC4FF] bg-[#142240]/50'
                : 'border-transparent text-[#A8B7D2] hover:text-white'
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            <span>{lang === 'bn' ? 'খ) বৈজ্ঞানিক পরিভাষা কোষ (১১ শব্দ)' : 'Section B: Scientific Terms (Glossary)'}</span>
          </button>

          <button
            onClick={() => setActiveTab('interpret')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-inter font-medium border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'interpret'
                ? 'border-[#7CF0BC] text-[#7CF0BC] bg-[#142240]/50'
                : 'border-transparent text-[#A8B7D2] hover:text-white'
            }`}
          >
            <BarChart2 className="w-4 h-4" />
            <span>{lang === 'bn' ? 'গ) ফলাফল ব্যাখ্যা করার নিয়ম' : 'Section C: How to Interpret Results'}</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 text-sm text-[#DCE6F5] font-inter space-y-6">
          {/* SECTION A: HOW TO USE */}
          {activeTab === 'journey' && (
            <div className="space-y-6 animate-fade-in">
              <div className="bg-[#0E1A30] p-4 rounded-lg border border-[#243B66]">
                <h3 className="text-base font-manrope font-bold text-white mb-1">
                  {lang === 'bn' ? '৩টি সহজ ধাপে পৃথিবী-ব্যবস্থা অনুসন্ধান' : 'The 3-Step Earth System Detective Journey'}
                </h3>
                <p className="text-xs text-[#A8B7D2]">
                  {lang === 'bn'
                    ? 'কোনো জটিল পূর্বজ্ঞান ছাড়াই আপনি নাসার উপগ্রহ উপাত্ত দিয়ে পৃথিবীর বায়ুমণ্ডল, পানি ও গাছপালার পরিবর্তন দেখতে পারেন।'
                    : 'You do not need any background in atmospheric physics or data science. Follow three simple steps to explore NASA satellite observations.'}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Step 1 */}
                <div className="bg-[#101D36] p-4 rounded-xl border border-[#243B66] flex flex-col justify-between hover:border-[#FF8A4F]/60 transition-colors">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="w-8 h-8 rounded-lg bg-[#FF8A4F]/20 text-[#FF8A4F] font-manrope font-bold flex items-center justify-center text-sm border border-[#FF8A4F]/40">
                        1
                      </span>
                      <span className="text-[10px] font-mono text-[#FF8A4F] uppercase">Map View</span>
                    </div>
                    <h4 className="font-manrope font-bold text-white text-sm mb-2">
                      {lang === 'bn' ? '১. পর্যবেক্ষণ স্থান নির্বাচন করুন' : '1. Spot Observations'}
                    </h4>
                    <p className="text-xs text-[#A8B7D2] leading-relaxed mb-3">
                      {lang === 'bn'
                        ? 'ইন্টারেক্টিভ মানচিত্রে ক্লিক করে কোনো নির্দিষ্ট স্থান নির্বাচন করুন—যেমন হবিগঞ্জের গ্যাস লিকেজ, সিলেটের হাওর ধানক্ষেত বা বৃষ্টিপাতের কেন্দ্র।'
                        : 'Explore the Earth map. Click on any observation site—such as an EMIT point-source plume, Sylhet wetland rice paddies, or a regional rainfall station.'}
                    </p>
                  </div>
                  <div className="bg-[#080E1A] p-2.5 rounded border border-[#243B66] text-[11px] font-mono text-[#7CC4FF]">
                    {lang === 'bn' ? 'যা শিখবেন: নির্গমন কোথায় ও কোন উপগ্রহ এটি দেখেছে' : 'Key takeaway: Where it happens and which NASA sensor saw it'}
                  </div>
                </div>

                {/* Step 2 */}
                <div className="bg-[#101D36] p-4 rounded-xl border border-[#243B66] flex flex-col justify-between hover:border-[#7CC4FF]/60 transition-colors">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="w-8 h-8 rounded-lg bg-[#7CC4FF]/20 text-[#7CC4FF] font-manrope font-bold flex items-center justify-center text-sm border border-[#7CC4FF]/40">
                        2
                      </span>
                      <span className="text-[10px] font-mono text-[#7CC4FF] uppercase">Trends View</span>
                    </div>
                    <h4 className="font-manrope font-bold text-white text-sm mb-2">
                      {lang === 'bn' ? '২. উপাত্ত ও প্রবণতা বুঝুন' : '2. Understand Data'}
                    </h4>
                    <p className="text-xs text-[#A8B7D2] leading-relaxed mb-3">
                      {lang === 'bn'
                        ? 'ক্লিক করুন "Explore Over Time"। গ্রাফে দেখুন বছর বছর ধরে গ্যাসের ঘনত্ব বাড়ছে নাকি কমছে। থেইল-সেন ঢাল ও পি-মান দেখে সত্যতা যাচাই করুন।'
                        : 'Click "Explore Observations Over Time". Inspect the multi-year timeline, seasonal fluctuations, Theil-Sen slope, and Mann-Kendall test for statistical reality.'}
                    </p>
                  </div>
                  <div className="bg-[#080E1A] p-2.5 rounded border border-[#243B66] text-[11px] font-mono text-[#7CF0BC]">
                    {lang === 'bn' ? 'যা শিখবেন: পরিবর্তন কি নিয়মিত ও বৈজ্ঞানিকভাবে তাৎপর্যপূর্ণ?' : 'Key takeaway: Is the change statistically real or just random noise?'}
                  </div>
                </div>

                {/* Step 3 */}
                <div className="bg-[#101D36] p-4 rounded-xl border border-[#243B66] flex flex-col justify-between hover:border-[#7CF0BC]/60 transition-colors">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="w-8 h-8 rounded-lg bg-[#7CF0BC]/20 text-[#7CF0BC] font-manrope font-bold flex items-center justify-center text-sm border border-[#7CF0BC]/40">
                        3
                      </span>
                      <span className="text-[10px] font-mono text-[#7CF0BC] uppercase">Impact View</span>
                    </div>
                    <h4 className="font-manrope font-bold text-white text-sm mb-2">
                      {lang === 'bn' ? '৩. জলবায়ু প্রভাব মূল্যায়ন' : '3. Explore Impact'}
                    </h4>
                    <p className="text-xs text-[#A8B7D2] leading-relaxed mb-3">
                      {lang === 'bn'
                        ? 'সিমুলেটরে স্লাইডার নাড়িয়ে দেখুন—যদি এই পাইপলাইন মেরামত করা হয় বা বর্জ্য ব্যবস্থাপনা উন্নত হয়, তবে কত টন কার্বন ও জ্বালানি সাশ্রয় হবে।'
                        : 'Move the scenario slider to calculate what happens if a leak is repaired—see avoided CO₂-equivalent warming, saved household energy, and social benefits.'}
                    </p>
                  </div>
                  <div className="bg-[#080E1A] p-2.5 rounded border border-[#243B66] text-[11px] font-mono text-[#FFCE5C]">
                    {lang === 'bn' ? 'যা শিখবেন: বৈজ্ঞানিক অনুসন্ধান থেকে বাস্তব সমাধানে রূপান্তর' : 'Key takeaway: From satellite detection to real climate solutions'}
                  </div>
                </div>
              </div>

              {/* What is Methane Callout */}
              <div className="bg-[#142240] p-4 rounded-lg border border-[#243B66] flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-[#7CF0BC] shrink-0 mt-0.5" />
                <div className="text-xs space-y-1">
                  <div className="font-bold text-white">
                    {lang === 'bn' ? 'মিথেন কেন এত গুরুত্বপূর্ণ?' : 'Why Does Methane Matter?'}
                  </div>
                  <p className="text-[#A8B7D2] leading-relaxed">
                    {lang === 'bn'
                      ? 'মিথেন (CH₄) একটি বর্ণহীন, গন্ধহীন গ্যাস। এটি ২০ বছরের সময়সীমায় কার্বন ডাই অক্সাইডের চেয়ে প্রায় ৮০ গুণ বেশি শক্তিশালী তাপ-আবদ্ধকারী গ্রিনহাউস গ্যাস। তাই মিথেন নিঃসরণ বন্ধ করা হলো বিশ্ব উষ্ণায়ন রোধের দ্রুততম কার্যকর উপায়।'
                      : 'Methane (CH₄) is an invisible, odorless greenhouse gas. Over a 20-year timescale, it traps over 80 times more heat than carbon dioxide (CO₂). Stopping methane leaks is the single fastest and most cost-effective lever to slow global warming today.'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* SECTION B: SCIENTIFIC GLOSSARY (11 TERMS) */}
          {activeTab === 'terms' && (
            <div className="space-y-4 animate-fade-in">
              {/* Search bar */}
              <div className="flex items-center gap-2 bg-[#101D36] p-2 rounded-lg border border-[#243B66]">
                <HelpCircle className="w-4 h-4 text-[#7CC4FF] shrink-0 ml-1" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={lang === 'bn' ? 'পরিভাষা খুঁজুন (যেমন: p-value, slope, trend)...' : 'Search terms (e.g., p-value, Theil-Sen, NDVI, XCH4)...'}
                  className="bg-transparent text-xs text-white placeholder-[#A8B7D2] outline-none w-full"
                />
                {searchTerm && (
                  <button onClick={() => setSearchTerm('')} className="text-xs text-[#A8B7D2] hover:text-white px-2">
                    Clear
                  </button>
                )}
              </div>

              {/* Glossary Accordions */}
              <div className="space-y-3">
                {filteredTerms.map(item => {
                  const isExpanded = expandedTerm === item.id;
                  return (
                    <div
                      key={item.id}
                      className={`rounded-lg border transition-all ${
                        isExpanded
                          ? 'bg-[#101D36] border-[#7CC4FF]/60 shadow-md'
                          : 'bg-[#0E1A30]/60 border-[#243B66] hover:border-[#2F4D7E]'
                      }`}
                    >
                      <button
                        onClick={() => setExpandedTerm(isExpanded ? null : item.id)}
                        className="w-full p-3.5 text-left flex items-center justify-between gap-3 outline-none"
                      >
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${
                            item.category === 'stats' ? 'bg-[#7CF0BC]' : item.category === 'satellite' ? 'bg-[#FF8A4F]' : 'bg-[#7CC4FF]'
                          }`} />
                          <span className="font-manrope font-bold text-xs md:text-sm text-white">
                            {lang === 'bn' ? item.termBn : item.termEn}
                          </span>
                        </div>
                        <span className={`text-xs text-[#A8B7D2] transition-transform ${isExpanded ? 'rotate-90' : ''}`}>
                          <ChevronRight className="w-4 h-4" />
                        </span>
                      </button>

                      {isExpanded && (
                        <div className="p-4 pt-1 border-t border-[#243B66]/60 space-y-3 text-xs">
                          {/* 1. Plain English Summary */}
                          <div>
                            <span className="text-[10px] font-mono text-[#7CF0BC] uppercase block mb-0.5">
                              {lang === 'bn' ? 'সহজ ব্যাখ্যা (Plain Summary):' : 'Plain-English Summary:'}
                            </span>
                            <p className="text-white font-medium leading-relaxed">
                              {lang === 'bn' ? item.summaryBn : item.summaryEn}
                            </p>
                          </div>

                          {/* 2. Why it matters */}
                          <div>
                            <span className="text-[10px] font-mono text-[#7CC4FF] uppercase block mb-0.5">
                              {lang === 'bn' ? 'কেন এটি গুরুত্বপূর্ণ (Why it Matters):' : 'Why it Matters for Earth Observation:'}
                            </span>
                            <p className="text-[#DCE6F5] leading-relaxed">
                              {lang === 'bn' ? item.whyMattersBn : item.whyMattersEn}
                            </p>
                          </div>

                          {/* 3. Technical Note for Researchers */}
                          <div className="bg-[#080E1A] p-2.5 rounded border border-[#243B66] text-[11px] font-mono">
                            <span className="text-[#FFCE5C] block text-[10px] uppercase font-bold mb-0.5">
                              {lang === 'bn' ? 'গবেষকদের জন্য প্রযুক্তিগত নোট (Technical Note):' : 'Technical Note for Researchers:'}
                            </span>
                            <span className="text-[#A8B7D2]">
                              {lang === 'bn' ? item.technicalBn : item.technicalEn}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* SECTION C: HOW TO INTERPRET A RESULT */}
          {activeTab === 'interpret' && (
            <div className="space-y-6 animate-fade-in">
              <div className="bg-[#0E1A30] p-4 rounded-lg border border-[#243B66]">
                <div className="flex items-center gap-2 text-xs font-mono text-[#7CF0BC] mb-1">
                  <BarChart2 className="w-4 h-4" />
                  <span>{lang === 'bn' ? 'বাস্তব উদাহরণ দিয়ে ফলাফল বোঝার উপায়' : 'WORKED CASE STUDY: BANGLADESH TROPOMI METHANE'}</span>
                </div>
                <h3 className="text-base font-manrope font-bold text-white mb-2">
                  {lang === 'bn' ? 'ধনাত্মক ঢাল কি নিশ্চিত প্রবণতা প্রমাণ করে?' : 'Does a Positive Slope Mean a Confirmed Trend?'}
                </h3>
                <p className="text-xs text-[#A8B7D2] leading-relaxed">
                  {lang === 'bn'
                    ? 'প্রকৃত নাসা উপাত্ত দিয়ে দেখুন কীভাবে বৈজ্ঞানিক সত্য যাচাই করতে হয় এবং কেন একটি রেখা উপরের দিকে উঠলেই তাকে নিশ্চিত পরিবর্তন বলা যায় না।'
                    : 'Walk through our genuine Bangladesh regional methane record (Sentinel-5P TROPOMI, 2019–2024) to see how honest scientists evaluate uncertainty.'}
                </p>
              </div>

              {/* Case Study Metrics Card */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-[#142240] p-3.5 rounded-lg border border-[#243B66]">
                  <span className="text-[10px] font-mono text-[#A8B7D2] block uppercase">Theil-Sen Slope</span>
                  <div className="text-xl font-manrope font-bold text-[#FF8A4F] mt-1">+12.81 ppb/yr</div>
                  <span className="text-[10px] text-[#A8B7D2] mt-0.5 block">Apparent upward tendency</span>
                </div>

                <div className="bg-[#142240] p-3.5 rounded-lg border border-[#243B66]">
                  <span className="text-[10px] font-mono text-[#A8B7D2] block uppercase">Mann-Kendall P-Value</span>
                  <div className="text-xl font-manrope font-bold text-[#FFCE5C] mt-1">p = 0.10868</div>
                  <span className="text-[10px] text-[#FFCE5C] mt-0.5 block">Greater than 0.05 threshold</span>
                </div>

                <div className="bg-[#142240] p-3.5 rounded-lg border border-[#243B66]">
                  <span className="text-[10px] font-mono text-[#A8B7D2] block uppercase">Scientific Verdict</span>
                  <div className="text-sm font-manrope font-bold text-[#7CC4FF] mt-1.5 uppercase">Null Not Rejected</div>
                  <span className="text-[10px] text-[#7CF0BC] mt-0.5 block">Not statistically significant at 5%</span>
                </div>
              </div>

              {/* 4 Lessons to Learn */}
              <div className="space-y-3">
                <div className="bg-[#101D36] p-4 rounded-lg border border-[#243B66] flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#FF8A4F]/20 text-[#FF8A4F] flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    1
                  </div>
                  <div className="text-xs space-y-1">
                    <div className="font-bold text-white">
                      {lang === 'bn' ? '১. একটি ধনাত্মক ঢাল মানেই নিশ্চিত প্রবণতা নয়' : '1. A Positive Slope is NOT Automatically a Significant Trend'}
                    </div>
                    <p className="text-[#A8B7D2] leading-relaxed">
                      {lang === 'bn'
                        ? 'যদিও থেইল-সেন ঢাল বলছে বছরে গড়ে +১২.৮১ পিপিবি মিথেন বেড়েছে, কিন্তু ম্যান-কেন্ডাল পি-মান ০.১০৮৬৮ (১০.৮%) নির্দেশ করে যে এটি প্রায় ১১% ক্ষেত্রে স্রেফ কাকতালীয়ভাবে ঘটতে পারে। বিজ্ঞানের স্ট্যান্ডার্ড ৫% (p < 0.05) নিয়ম অনুযায়ী, এটিকে আমরা এখনও নিশ্চিত প্রবণতা বলতে পারি না।'
                        : 'Even though the slope is positive (+12.81 ppb/year), the p-value is 0.10868 (about 10.9%). That means there is roughly an 11% chance this slope occurred purely through random sampling variability. In science, we require p < 0.05 (less than 5% chance) before claiming proof.'}
                    </p>
                  </div>
                </div>

                <div className="bg-[#101D36] p-4 rounded-lg border border-[#243B66] flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#7CC4FF]/20 text-[#7CC4FF] flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    2
                  </div>
                  <div className="text-xs space-y-1">
                    <div className="font-bold text-white">
                      {lang === 'bn' ? '২. মেঘের কারণে উপাত্তের ফাঁক ও আত্মবিশ্বাসের প্রভাব' : '2. How Clouds and Missing Observations Reduce Confidence'}
                    </div>
                    <p className="text-[#A8B7D2] leading-relaxed">
                      {lang === 'bn'
                        ? 'বাংলাদেশে জুন থেকে আগস্ট পর্যন্ত প্রবল মৌসুমি মেঘ থাকে। উপগ্রহ অপটিক্যাল সেন্সর মেঘ ভেদ করে মিথেন মাপতে পারে না। এই অনুপস্থিত উপাত্ত পর্যবেক্ষণ সংখ্যা (n) কমিয়ে দেয়, যা আত্মবিশ্বাসের ব্যাপ্তিকে প্রশস্ত করে তোলে।'
                        : 'During the South Asian summer monsoon (June–August), dense convective clouds prevent optical satellite retrieval. These unavoidable data gaps lower the effective sample size (n), widening the 95% confidence interval and lowering statistical power.'}
                    </p>
                  </div>
                </div>

                <div className="bg-[#101D36] p-4 rounded-lg border border-[#243B66] flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#7CF0BC]/20 text-[#7CF0BC] flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    3
                  </div>
                  <div className="text-xs space-y-1">
                    <div className="font-bold text-white">
                      {lang === 'bn' ? '৩. "অপ্রমাণিত" মানে এই নয় যে কোনো গ্যাস নেই' : '3. "Not Statistically Significant" Does NOT Mean Zero Methane'}
                    </div>
                    <p className="text-[#A8B7D2] leading-relaxed">
                      {lang === 'bn'
                        ? 'এর অর্থ কেবল এই যে, বর্তমান ৬ বছরের উপাত্ত দিয়ে নিশ্চিতভাবে বৃদ্ধির গতি প্রমাণ করার মতো প্রমাণ যথেষ্ট নয়। বাতাসে এখনও প্রায় ১,৯০০ পিপিবি মিথেন বিদ্যমান, যা প্রতিনিয়ত পরিবেশকে প্রভাবিত করছে।'
                        : 'Failing to reject the null hypothesis does not mean atmospheric methane is zero or harmless. Bangladesh has high atmospheric methane (~1,900 ppb). It simply means that over this specific 2019–2024 sample, we cannot statistically confirm a continuous secular acceleration.'}
                    </p>
                  </div>
                </div>

                <div className="bg-[#101D36] p-4 rounded-lg border border-[#243B66] flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#FFCE5C]/20 text-[#FFCE5C] flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    4
                  </div>
                  <div className="text-xs space-y-1">
                    <div className="font-bold text-white">
                      {lang === 'bn' ? '৪. নাসা সায়েন্সের সততা: বানিয়ে বলা নিষেধ' : '4. NASA Open Science Integrity: Never Fabricate Certainty'}
                    </div>
                    <p className="text-[#A8B7D2] leading-relaxed">
                      {lang === 'bn'
                        ? 'অন্য অনেক সাধারণ অ্যাপ্লিকেশনে বানিয়ে বলা হয় "সবকিছু ধ্বংস হচ্ছে"। মিথেন ডিটেকটিভ সম্পূর্ণ স্বচ্ছভাবে সত্য পরিসংখ্যান দেখায়, যাতে সাধারণ মানুষ এবং গবেষক উভয়ই নির্ভুল সত্য জানতে পারেন।'
                        : 'Unscientific dashboards often force linear regressions through sparse points and pretend to have 100% certainty. Methane Detective preserves scientific integrity by rigorously reporting exact non-parametric p-values and confidence intervals.'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 border-t border-[#243B66] bg-[#0E1A30]/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-[#A8B7D2]">
            <ShieldCheck className="w-4 h-4 text-[#7CF0BC]" />
            <span>NASA Space Apps Challenge 2026 · Open Science Learning Framework</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-[#FF8A4F] hover:bg-[#FF752B] text-black font-manrope font-bold text-xs tracking-wider transition-colors"
          >
            {lang === 'bn' ? 'বোঝা গেছে, অনুসন্ধান শুরু করুন' : 'Got It, Start Investigating'}
          </button>
        </div>
      </div>
    </div>
  );
};
