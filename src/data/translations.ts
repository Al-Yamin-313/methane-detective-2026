export interface TranslationDict {
  appTitle: string;
  appSubtitle: string;
  navExplore: string;
  navTrends: string;
  navImpact: string;
  navMethods: string;
  filterAll: string;
  filterGas: string;
  filterAgri: string;
  filterUrban: string;
  filterGlobal: string;
  liveNasaStatus: string;
  rePing: string;
  q1Title: string;
  q1Desc: string;
  q2Title: string;
  q2Desc: string;
  q3Title: string;
  q3Desc: string;
  q4Title: string;
  q4Desc: string;
  statSignificant: string;
  statCyclical: string;
  investigateCaseFile: string;
  viewTrend: string;
  fluxRate: string;
  annualCO2e: string;
  carEquivalent: string;
  nearestFacility: string;
  satelliteSensor: string;
  qaScore: string;
  sourceHistory: string;
  evidenceTrail: string;
  attributionDisclaimer: string;
  stepSpotPlume: string;
  stepTraceTrend: string;
  stepClimateImpact: string;
  navReferenceMethods: string;
  filterAllSites: string;
  filterBangladeshFocus: string;
  filterTurkiyeFocus: string;
  crossBasinSynthesisTitle: string;
  crossBasinSubtitle: string;
  allCategories: string;
  simpleView: string;
  detailedView: string;
  advancedDetails: string;
  exploreOverTime: string;
  nasaLiveStatus: string;
  nasaCachedStatus: string;
  nextStepTrend: string;
  nextStepImpact: string;
  nextStepMethods: string;
  missionBrief: string;
  methane101Title: string;
  methane101Desc: string;
  sphereAll: string;
  sphereAtmosphere: string;
  sphereHydrosphere: string;
  sphereBiosphere: string;
  varAll: string;
  varMethane: string;
  varPrecipitation: string;
  varRiverWater: string;
  varVegetation: string;
  importCsvBtn: string;
  loadSampleBtn: string;
  customImportTitle: string;
  nonEndorsement: string;
}

export const TRANSLATIONS: { en: TranslationDict; bn: TranslationDict } = {
  en: {
    appTitle: 'METHANE DETECTIVE',
    appSubtitle: "Unmasking Earth's Invisible Polluters",
    navExplore: '1. Spot Observations',
    navTrends: '2. Understand Data',
    navImpact: '3. Explore Impact',
    navMethods: 'Data & Methods',
    stepSpotPlume: '1. Spot Observations',
    stepTraceTrend: '2. Understand Data',
    stepClimateImpact: '3. Explore Impact',
    navReferenceMethods: 'Data & Methods',
    sphereAll: 'All Earth Spheres',
    sphereAtmosphere: 'Atmosphere (Methane CH₄)',
    sphereHydrosphere: 'Hydrosphere (Precipitation & Rivers)',
    sphereBiosphere: 'Biosphere (Vegetation NDVI)',
    varAll: 'All Earth System Variables',
    varMethane: 'Methane (EMIT Plumes & TROPOMI Columns)',
    varPrecipitation: 'Monthly Accumulated Precipitation (NASA GPM IMERG)',
    varRiverWater: 'River Water Elevation (NASA/CNES SWOT - Jamuna Basin)',
    varVegetation: 'Vegetation Phenology (NASA Terra MODIS)',
    importCsvBtn: 'Import NASA Giovanni CSV',
    loadSampleBtn: 'Load GPM Giovanni Sample',
    customImportTitle: 'User-Imported NASA Observation',
    nonEndorsement: 'NASA does not endorse any non-U.S. Government entity and is not responsible for information contained on non-U.S. Government websites.',
    filterAllSites: 'All Sites',
    filterBangladeshFocus: 'Bangladesh Focus',
    filterTurkiyeFocus: 'Türkiye (Konya Basin)',
    crossBasinSynthesisTitle: 'Comparative Cross-Basin Precipitation Synthesis',
    crossBasinSubtitle: 'Contrasting South Asian Tropical Monsoon (Surma-Meghna) vs. Central Anatolian Semi-Arid Steppe (Konya Closed Basin)',
    allCategories: 'All Categories',
    simpleView: 'Simple View',
    detailedView: 'Scientist View',
    advancedDetails: 'Advanced Satellite Details',
    exploreOverTime: 'Explore Observations Over Time',
    nasaLiveStatus: 'NASA Earth Data Connected',
    nasaCachedStatus: 'NASA Data Cached (Standby)',
    nextStepTrend: 'Next: Analyze Observations Over Time →',
    nextStepImpact: 'Next: Explore Climate Impact →',
    nextStepMethods: 'Review Satellite Missions & Methodology →',
    missionBrief: "Methane is an invisible greenhouse gas trapping heat. NASA satellites detect where it enters the atmosphere.",
    methane101Title: 'Methane 101: How Satellites See the Invisible',
    methane101Desc: 'Methane is odorless and invisible to human eyes. Satellites with imaging spectrometers detect how methane absorbs specific infrared wavelengths of sunlight reflected from Earth.',
    filterAll: 'All Sources',
    filterGas: 'Gas Infrastructure',
    filterAgri: 'Rice Agriculture',
    filterUrban: 'Urban / Landfill',
    filterGlobal: 'Global Benchmarks',
    liveNasaStatus: 'NASA LIVE TELEMETRY',
    rePing: 'RE-PING NASA API',
    q1Title: 'WHAT IS CHANGING?',
    q1Desc: 'Path-integrated column methane enhancement (ppm·m) and point emission rates (kg/hr).',
    q2Title: 'WHERE IS IT CHANGING?',
    q2Desc: 'Sylhet gas production manifolds, Dhaka mega-landfills, and regional agricultural basins.',
    q3Title: 'HOW MUCH IS IT CHANGING?',
    q3Desc: "Quantified by Sen's Slope Estimator (+9.8 to +30.2 ppm·m/year) and annual mass emission tonnage.",
    q4Title: 'IS IT SIGNIFICANT?',
    q4Desc: 'Evaluated by non-parametric Mann-Kendall test (Z = +2.96 to +3.34, p < 0.05).',
    statSignificant: 'STATISTICALLY SIGNIFICANT (p < 0.05)',
    statCyclical: 'CYCLICAL / NOT STATISTICALLY SIGNIFICANT',
    investigateCaseFile: 'OPEN CASE FILE',
    viewTrend: 'EXPLORE OVER TIME',
    fluxRate: 'Emission Flux Rate',
    annualCO2e: 'Annual 20-Year CO2e',
    carEquivalent: 'Car-Driving Distance',
    nearestFacility: 'Nearest Ground Facility',
    satelliteSensor: 'Detecting Satellite',
    qaScore: 'QA Quality Score',
    sourceHistory: 'Observation History & Clues',
    evidenceTrail: 'Observation → Location → Repeated Overpasses → Trend → Significance',
    attributionDisclaimer: 'Scientifically validated satellite spectroscopy. Plumes represent observed column enhancement above regional atmospheric background.'
  },
  bn: {
    appTitle: 'মিথেন গোয়েন্দা',
    appSubtitle: 'পৃথিবীর অদৃশ্য দূষণকারীদের মুখোশ উন্মোচন',
    navExplore: '১. উপগ্রহ পর্যবেক্ষণ',
    navTrends: '২. উপাত্ত পর্যালোচনা',
    navImpact: '৩. জলবায়ু প্রভাব',
    navMethods: 'উপাত্ত ও পদ্ধতি',
    stepSpotPlume: '১. উপগ্রহ পর্যবেক্ষণ',
    stepTraceTrend: '২. উপাত্ত পর্যালোচনা',
    stepClimateImpact: '৩. জলবায়ু প্রভাব',
    navReferenceMethods: 'উপাত্ত ও পদ্ধতি',
    sphereAll: 'সকল ভূ-মণ্ডল',
    sphereAtmosphere: 'বায়ুমণ্ডল (মিথেন CH₄)',
    sphereHydrosphere: 'বারিমণ্ডল (বৃষ্টিপাত ও নদী)',
    sphereBiosphere: 'জীবমণ্ডল (উদ্ভিদের সবুজায়ন NDVI)',
    varAll: 'সকল আর্থ সিস্টেম সূচক',
    varMethane: 'মিথেন (ইমিট নির্গমন ও ট্রপমি কলাম)',
    varPrecipitation: 'মাসিক পুঞ্জীভূত বৃষ্টিপাত (নাসা জিপিএম আইমার্জ)',
    varRiverWater: 'নদীর পানির উচ্চতা (নাসা/সিএনইএস সোয়াট - যমুনা অববাহিকা)',
    varVegetation: 'উদ্ভিদ ফেনোলজি (নাসা টেরা মডিস)',
    importCsvBtn: 'নাসা জিওভান্নি সিএসভি আপলোড',
    loadSampleBtn: 'নমুনা জিওভান্নি তথ্য লোড করুন',
    customImportTitle: 'ব্যবহারকারীর আমদানিকৃত নাসা পর্যবেক্ষণ',
    nonEndorsement: 'নাসা কোনো অ-মার্কিন সরকারি সংস্থাকে অনুমোদন করে না এবং অ-মার্কিন সরকারি ওয়েবসাইটের তথ্যের জন্য দায়ী নয়।',
    filterAllSites: 'সকল পর্যবেক্ষণ',
    filterBangladeshFocus: 'বাংলাদেশ ফোকাস',
    filterTurkiyeFocus: 'তুরস্ক (কোনিয়া অববাহিকা)',
    crossBasinSynthesisTitle: 'আন্তঃঅববাহিকা তুলনামূলক বৃষ্টিপাত সংশ্লেষ',
    crossBasinSubtitle: 'দক্ষিণ এশীয় ক্রান্তীয় মৌসুমি বৃষ্টি (সুরমা-মেঘনা) বনাম মধ্য আনাতোলীয় আধা-শুষ্ক স্তেপ (কোনিয়া আবদ্ধ অববাহিকা)',
    allCategories: 'সকল ক্যাটাগরি',
    simpleView: 'সাধারণ রূপ',
    detailedView: 'বিজ্ঞানীদের রূপ',
    advancedDetails: 'উন্নত স্যাটেলাইট প্রযুক্তি ও স্পেকট্রাম বিবরণ',
    exploreOverTime: 'সময়ের সাথে পর্যবেক্ষণ দেখুন',
    nasaLiveStatus: 'নাসা আর্থ ডাটা সংযুক্ত',
    nasaCachedStatus: 'সংরক্ষিত উপাত্ত (স্ট্যান্ডবাই)',
    nextStepTrend: 'পরবর্তী: গতিধারা পর্যালোচনা করুন →',
    nextStepImpact: 'পরবর্তী: জলবায়ু প্রভাব পর্যালোচনা করুন →',
    nextStepMethods: 'সম্পূর্ণ স্যাটেলাইট মিশন ও বৈজ্ঞানিক পদ্ধতি দেখুন →',
    missionBrief: 'মিথেন একটি অদৃশ্য গ্রিনহাউস গ্যাস যা পৃথিবীকে উত্তপ্ত করে। নাসার কৃত্রিম উপগ্রহ শনাক্ত করে কোথা থেকে এটি বাতাসে ছড়াচ্ছে।',
    methane101Title: 'মিথেন ১০১: স্যাটেলাইট কীভাবে অদৃশ্য গ্যাস শনাক্ত করে',
    methane101Desc: 'মিথেন বর্ণহীন ও গন্ধহীন গ্যাস। উপগ্রহের স্পেকট্রোমিটার পরিমাপ করে কীভাবে মিথেন গ্যাস পৃথিবী থেকে প্রতিফলিত সূর্যের অবলোহিত রশ্মি শোষণ করে।',
    filterAll: 'সকল উৎস',
    filterGas: 'গ্যাস অবকাঠামো',
    filterAgri: 'ধান চাষ / কৃষি',
    filterUrban: 'শহুরে বর্জ্য ও ল্যান্ডফিল',
    filterGlobal: 'বৈশ্বিক মানদণ্ড',
    liveNasaStatus: 'নাসা লাইভ টেলিমেট্রি',
    rePing: 'নাসা এপিআই পুনঃযাচাই',
    q1Title: 'কী পরিবর্তিত হচ্ছে?',
    q1Desc: 'বায়ুমণ্ডলে মিথেন গ্যাসের ঘনত্বের মাত্রা (পিপিএম·মিটার) এবং প্রতি ঘণ্টার নির্গমন হার (কেজি/ঘণ্টা)।',
    q2Title: 'কোথায় পরিবর্তিত হচ্ছে?',
    q2Desc: 'সিলেটের গ্যাস পাইপলাইন ও ওয়েলহেড, ঢাকার মাতুয়াইল ল্যান্ডফিল এবং উত্তরাঞ্চলের ফসলি মাঠ।',
    q3Title: 'কতটুকু পরিবর্তিত হচ্ছে?',
    q3Desc: "সেন'স স্লোপ পরিমাপক অনুযায়ী প্রতি বছর গড়ে +৯.৮ থেকে +৩০.২ পিপিএম·মিটার হারে বৃদ্ধি পাচ্ছে।",
    q4Title: 'এই পরিবর্তন কি তাৎপর্যপূর্ণ?',
    q4Desc: 'ম্যান-কেন্ডাল টেস্ট অনুযায়ী এটি বৈজ্ঞানিকভাবে নিশ্চিত (Z = +২.৯৬ থেকে +৩.৩৪, p < ০.০৫)।',
    statSignificant: 'পরিসংখ্যানগতভাবে নিশ্চিত তাৎপর্যপূর্ণ (p < ০.০৫)',
    statCyclical: 'মৌসুমি চক্রীয় / দীর্ঘমেয়াদী বৃদ্ধি নয়',
    investigateCaseFile: 'কেস ফাইল খুলুন',
    viewTrend: 'সময়ের সাথে দেখুন',
    fluxRate: 'নির্গমন প্রবাহের হার',
    annualCO2e: 'বার্ষিক ২০-বছরের সমতুল্য কার্বন',
    carEquivalent: 'সমতুল্য গাড়ি চলাচলের দূরত্ব',
    nearestFacility: 'নিকটতম স্থল অবকাঠামো',
    satelliteSensor: 'শনাক্তকারী উপগ্রহ',
    qaScore: 'তথ্য নির্ভুলতা স্কোর',
    sourceHistory: 'পর্যবেক্ষণ ইতিহাস ও সূত্রসমূহ',
    evidenceTrail: 'স্যাটেলাইট চিত্র → অবস্থান → বারবার পর্যবেক্ষণ → গতিধারা → পরিসংখ্যানগত প্রমাণ',
    attributionDisclaimer: 'নাসা উপগ্রহ থেকে প্রাপ্ত স্পেকট্রোস্কোপি উপাত্ত। এটি বায়ুমণ্ডলের স্বাভাবিক মাত্রার চেয়ে অতিরিক্ত মিথেন নির্দেশ করে।'
  }
};
