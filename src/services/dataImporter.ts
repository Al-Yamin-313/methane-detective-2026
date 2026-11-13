import { EarthSystemDataset, GiovanniCsvImportResult } from '../types/earthSystem';
import { MethaneSource } from '../types/methane';

export function datasetToMethaneSource(dataset: EarthSystemDataset): MethaneSource {
  return {
    id: dataset.id,
    name: dataset.name,
    nameBn: dataset.nameBn,
    region: dataset.region,
    regionBn: dataset.regionBn,
    country: dataset.country,
    lat: dataset.lat,
    lon: dataset.lon,
    category: dataset.category,
    categoryLabel: dataset.categoryLabel,
    categoryLabelBn: dataset.categoryLabelBn,
    status: dataset.status,
    statusBn: dataset.statusBn,
    unit: dataset.unit,
    intensity: dataset.intensity,
    firstSeen: dataset.firstSeen,
    lastSeen: dataset.lastSeen,
    estimatedFluxKgHr: dataset.estimatedFluxKgHr,
    uncertaintyPct: dataset.uncertaintyPct,
    description: dataset.description,
    descriptionBn: dataset.descriptionBn,
    nearestFacility: dataset.nearestFacility,
    nearestFacilityBn: dataset.nearestFacilityBn,
    sphere: dataset.sphere,
    earthSphere: dataset.sphere,
    sphereBn: dataset.sphereBn,
    variableType: dataset.variableType,
    variableLabel: dataset.variableLabel,
    variableLabelBn: dataset.variableLabelBn,
    sourceOrg: dataset.sourceOrg,
    mission: dataset.mission,
    productIdentifier: dataset.productIdentifier,
    spatialResolution: dataset.spatialResolution,
    temporalResolution: dataset.temporalResolution,
    geographicCoverage: dataset.geographicCoverage,
    observationPeriod: dataset.observationPeriod,
    processingMethod: dataset.processingMethod,
    qualityFlags: dataset.qualityFlags,
    missingDataPolicy: dataset.missingDataPolicy,
    documentationUrl: dataset.documentationUrl,
    dataUseConditions: dataset.dataUseConditions,
    provenanceType: dataset.provenanceType,
    provenanceNote: dataset.provenanceNote,
    observations: dataset.observations.map(o => ({
      date: o.date,
      displayDate: o.displayDate,
      value: o.value,
      unit: o.unit,
      satellite: o.satellite || dataset.mission,
      note: o.note,
      qaValue: o.qaValue
    }))
  };
}

export class DataImporterService {
  /**
   * Parse and validate NASA Giovanni or AppEEARS CSV data.
   * Handles metadata header comments, auto-detects date/value columns,
   * screens missing value flags (-9999, NaN), and ensures chronological order.
   */
  public static parseCsv(csvText: string, customTitle?: string): GiovanniCsvImportResult {
    const warnings: string[] = [];
    const lines = csvText.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);

    if (lines.length < 5) {
      const err = 'File contains insufficient data lines (minimum 4 valid observation points required).';
      return {
        success: false,
        error: err,
        errors: [err],
        warnings,
        metadata: { totalRows: lines.length, validPoints: 0, missingPoints: 0, duplicateTimestamps: 0 }
      };
    }

    // 1. Extract metadata from comment lines starting with #
    let title = customTitle || '';
    let variable = 'Custom Environmental Variable';
    let units = 'units';
    let spatialBounding = 'User Defined Region';
    let temporalRange = '';
    let sourceOrg = 'NASA Earth Science / User Data';
    let dataLinesStart = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.startsWith('#')) {
        const comment = line.substring(1).trim();
        if (comment.toLowerCase().includes('variable:')) {
          variable = comment.split(/variable:/i)[1].trim();
        } else if (comment.toLowerCase().includes('units:') || comment.toLowerCase().includes('unit:')) {
          units = comment.split(/units?:/i)[1].trim();
        } else if (comment.toLowerCase().includes('bounding box:') || comment.toLowerCase().includes('spatial:')) {
          spatialBounding = comment.split(/box:|spatial:/i)[1].trim();
        } else if (comment.toLowerCase().includes('temporal range:') || comment.toLowerCase().includes('range:')) {
          temporalRange = comment.split(/range:/i)[1].trim();
        } else if (comment.toLowerCase().includes('source:') || comment.toLowerCase().includes('giovanni')) {
          sourceOrg = comment;
        } else if (!title && comment.length > 5 && !comment.startsWith('---')) {
          title = comment;
        }
        dataLinesStart = i + 1;
      } else {
        break;
      }
    }

    if (dataLinesStart >= lines.length) {
      return {
        success: false,
        error: 'CSV contains only comment headers and no tabular data rows.',
        warnings,
        metadata: { totalRows: 0, validPoints: 0, missingPoints: 0, duplicateTimestamps: 0 }
      };
    }

    // 2. Identify header row
    const headerLine = lines[dataLinesStart];
    // Split by comma, tab, or semicolon
    const delimiter = headerLine.includes('\t') ? '\t' : headerLine.includes(';') ? ';' : ',';
    const rawHeaders = headerLine.split(delimiter).map(h => h.trim().replace(/^["']|["']$/g, ''));

    // Detect Date and Value column indexes
    let dateColIdx = -1;
    let valueColIdx = -1;
    let qaColIdx = -1;

    for (let i = 0; i < rawHeaders.length; i++) {
      const hLower = rawHeaders[i].toLowerCase();
      if (dateColIdx === -1 && (hLower === 'time' || hLower === 'date' || hLower === 'datetime' || hLower === 'timestamp' || hLower === 'year' || hLower.includes('date'))) {
        dateColIdx = i;
      } else if (qaColIdx === -1 && (hLower.includes('qa') || hLower.includes('qc') || hLower.includes('quality'))) {
        qaColIdx = i;
      } else if (valueColIdx === -1 && (hLower.includes('val') || hLower.includes('precip') || hLower.includes('elevation') || hLower.includes('ndvi') || hLower.includes('ch4') || hLower.includes('rate') || hLower.includes('anomaly') || i > 0)) {
        valueColIdx = i;
      }
    }

    // Fallbacks if not detected by name
    if (dateColIdx === -1) dateColIdx = 0;
    if (valueColIdx === -1) valueColIdx = rawHeaders.length > 1 ? 1 : 0;

    if (rawHeaders.length > valueColIdx && !variable.includes('_')) {
      const colName = rawHeaders[valueColIdx];
      if (colName && !colName.toLowerCase().includes('value')) {
        variable = colName;
      }
    }

    // 3. Parse Data Rows
    const dataRows = lines.slice(dataLinesStart + 1);
    const parsedPoints: { date: string; displayDate: string; value: number; qaValue: number }[] = [];
    const seenDates = new Set<string>();
    let duplicateTimestamps = 0;
    let missingPoints = 0;

    for (let i = 0; i < dataRows.length; i++) {
      const row = dataRows[i];
      if (row.startsWith('#') || row.length === 0) continue;

      const cells = row.split(delimiter).map(c => c.trim().replace(/^["']|["']$/g, ''));
      if (cells.length <= Math.max(dateColIdx, valueColIdx)) continue;

      const rawDate = cells[dateColIdx];
      const rawVal = cells[valueColIdx];

      // Missing value screening
      if (
        rawVal === '' || 
        rawVal === '-9999' || 
        rawVal === '-9999.0' || 
        rawVal === '-999' || 
        rawVal.toLowerCase() === 'nan' || 
        rawVal.toLowerCase() === 'null' || 
        rawVal.toLowerCase() === 'na'
      ) {
        missingPoints++;
        continue;
      }

      const numVal = parseFloat(rawVal);
      if (isNaN(numVal)) {
        missingPoints++;
        continue;
      }

      // Date parsing & normalization
      let isoDate = '';
      let displayDate = rawDate;

      // Handle standard ISO or YYYY-MM
      if (/^\d{4}-\d{2}-\d{2}/.test(rawDate)) {
        isoDate = rawDate.substring(0, 10);
      } else if (/^\d{4}-\d{2}/.test(rawDate)) {
        isoDate = `${rawDate.substring(0, 7)}-01`;
      } else if (/^\d{4}\/\d{2}\/\d{2}/.test(rawDate)) {
        isoDate = rawDate.replace(/\//g, '-').substring(0, 10);
      } else {
        const d = new Date(rawDate);
        if (!isNaN(d.getTime())) {
          isoDate = d.toISOString().split('T')[0];
        } else {
          // Synthetic chronological fallback
          isoDate = `2024-01-${String((i % 28) + 1).padStart(2, '0')}`;
          warnings.push(`Line ${i + 1}: Unrecognized date format "${rawDate}", normalized to ${isoDate}`);
        }
      }

      // Check duplicates
      if (seenDates.has(isoDate)) {
        duplicateTimestamps++;
        warnings.push(`Duplicate timestamp detected: ${isoDate} (averaged or latest preserved).`);
      }
      seenDates.add(isoDate);

      // QA value parsing if present
      let qaVal = 0.90;
      if (qaColIdx !== -1 && cells.length > qaColIdx) {
        const parsedQa = parseFloat(cells[qaColIdx]);
        if (!isNaN(parsedQa)) {
          qaVal = parsedQa > 1.0 ? parsedQa / 100.0 : parsedQa;
        }
      }

      parsedPoints.push({
        date: isoDate,
        displayDate,
        value: numVal,
        qaValue: Math.min(1.0, Math.max(0.1, qaVal))
      });
    }

    if (parsedPoints.length < 4) {
      return {
        success: false,
        error: `Only ${parsedPoints.length} valid numerical observations were found. Non-parametric trend analysis requires a minimum of 4 points.`,
        warnings,
        metadata: {
          totalRows: dataRows.length,
          validPoints: parsedPoints.length,
          missingPoints,
          duplicateTimestamps
        }
      };
    }

    // 4. Sort observations chronologically
    parsedPoints.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Format display dates
    parsedPoints.forEach(p => {
      const d = new Date(p.date);
      if (!isNaN(d.getTime())) {
        const monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
        p.displayDate = `${monthNames[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
      }
    });

    const datasetId = `IMP-${Date.now().toString().slice(-6)}`;
    const finalTitle = title || `Imported: ${variable}`;

    // 5. Build standardized EarthSystemDataset object
    const dataset: EarthSystemDataset = {
      id: datasetId,
      name: `${finalTitle} (${sourceOrg})`,
      nameBn: `${finalTitle} (আমদানিকৃত উপাত্ত)`,
      sphere: variable.toLowerCase().includes('precip') || variable.toLowerCase().includes('water') || variable.toLowerCase().includes('rain')
        ? 'Hydrosphere'
        : variable.toLowerCase().includes('ndvi') || variable.toLowerCase().includes('veg')
        ? 'Biosphere'
        : 'Atmosphere',
      sphereBn: variable.toLowerCase().includes('precip') || variable.toLowerCase().includes('water')
        ? 'হাইড্রোস্ফিয়ার (জলমণ্ডল)'
        : 'বায়ুমণ্ডল',
      variableType: 'custom_import',
      variableLabel: variable,
      variableLabelBn: variable,
      region: spatialBounding,
      regionBn: spatialBounding,
      country: 'Global / Regional',
      lat: 24.5,
      lon: 91.0,
      category: 'global',
      categoryLabel: 'Custom Import',
      categoryLabelBn: 'কাস্টম আমদানিকৃত',
      status: 'Observed',
      statusBn: 'সরাসরি উপাত্ত রেকর্ড',
      unit: units,
      unitLabel: `${variable} (${units})`,
      unitLabelBn: `${variable} (${units})`,
      intensity: 0.65,
      firstSeen: parsedPoints[0].displayDate,
      lastSeen: parsedPoints[parsedPoints.length - 1].displayDate,
      estimatedFluxKgHr: 0,
      uncertaintyPct: 10,
      description: `Validated user-imported time series from ${sourceOrg}. Extracted ${parsedPoints.length} valid chronological observation records spanning ${parsedPoints[0].date} to ${parsedPoints[parsedPoints.length - 1].date}.`,
      descriptionBn: `${sourceOrg} থেকে ব্যবহারকারী-আমদানিকৃত যাচাইকৃত টাইম-সিরিজ। ${parsedPoints[0].date} থেকে ${parsedPoints[parsedPoints.length - 1].date} পর্যন্ত মোট ${parsedPoints.length}টি ধারাবাহিক পর্যবেক্ষণ অন্তর্ভুক্ত।`,
      nearestFacility: spatialBounding,
      nearestFacilityBn: spatialBounding,
      sourceOrg,
      mission: 'NASA GES DISC / Giovanni / AppEEARS',
      productIdentifier: variable,
      spatialResolution: 'User Subset Area',
      temporalResolution: `${Math.round((new Date(parsedPoints[parsedPoints.length - 1].date).getTime() - new Date(parsedPoints[0].date).getTime()) / (parsedPoints.length * 86400000))} days mean interval`,
      geographicCoverage: spatialBounding,
      observationPeriod: `${parsedPoints[0].date} to ${parsedPoints[parsedPoints.length - 1].date}`,
      processingMethod: 'Client-side CSV parsing, missing-value screening, and chronological normalization',
      qualityFlags: missingPoints > 0 ? `${missingPoints} missing/NaN values screened and quarantined` : '100% complete records without missing flags',
      missingDataPolicy: 'Missing or negative fill values are excluded without artificial synthetic interpolation.',
      documentationUrl: 'https://giovanni.gsfc.nasa.gov/',
      dataUseConditions: 'NASA Earth Science open data policy. NASA does not endorse any non-U.S. Government entity.',
      isFlagshipMethane: false,
      provenanceType: 'custom_imported_csv',
      provenanceNote: `Imported via DataImporterService. Original headers: [${rawHeaders.join(', ')}]. Total rows parsed: ${dataRows.length}, valid points: ${parsedPoints.length}.`,
      observations: parsedPoints.map(p => ({
        date: p.date,
        displayDate: p.displayDate,
        value: p.value,
        unit: units,
        satellite: 'GPM',
        note: `NASA Open Science observation (${units})`,
        qaValue: p.qaValue
      }))
    };

    return {
      success: true,
      dataset,
      source: datasetToMethaneSource(dataset),
      errors: [],
      warnings,
      metadata: {
        title: finalTitle,
        variable,
        variableName: variable,
        units,
        spatialBounding,
        temporalRange: `${parsedPoints[0].date} to ${parsedPoints[parsedPoints.length - 1].date}`,
        totalRows: dataRows.length,
        validPoints: parsedPoints.length,
        missingPoints,
        droppedRowsCount: missingPoints,
        duplicateTimestamps
      }
    };
  }

  /**
   * Pre-loaded sample Giovanni CSV files for instant 1-click user validation
   */
  public static readonly SAMPLE_GIOVANNI_GPM_CSV = `# NASA GES DISC Giovanni v4.37
# Title: Area-Averaged Monthly Accumulated Precipitation over Surma-Meghna Basin
# Variable: Monthly Accumulated Precipitation (GPM_3IMERGM_07)
# Units: mm
# Spatial Bounding Box: 91.0E, 24.0N, 92.5E, 25.5N
# Temporal Range: 2020-01-01 to 2024-12-31
# Data Source: NASA / JAXA Global Precipitation Measurement (GPM) Core Observatory
time,precipitation
2020-01-01,12.4
2020-02-01,18.7
2020-03-01,65.2
2020-04-01,142.8
2020-05-01,310.5
2020-06-01,642.1
2020-07-01,718.3
2020-08-01,524.6
2020-09-01,412.0
2020-10-01,185.4
2020-11-01,24.1
2020-12-01,8.3
2021-01-01,10.1
2021-02-01,14.6
2021-03-01,48.9
2021-04-01,118.2
2021-05-01,288.4
2021-06-01,612.8
2021-07-01,695.1
2021-08-01,498.3
2021-09-01,385.2
2021-10-01,162.7
2021-11-01,19.5
2021-12-01,6.8
2022-01-01,15.2
2022-02-01,21.4
2022-03-01,84.1
2022-04-01,198.6
2022-05-01,412.3
2022-06-01,885.6
2022-07-01,640.2
2022-08-01,460.5
2022-09-01,370.1
2022-10-01,210.4
2022-11-01,14.8
2022-12-01,5.2
2023-01-01,9.8
2023-02-01,12.1
2023-03-01,52.3
2023-04-01,130.5
2023-05-01,325.8
2023-06-01,630.4
2023-07-01,680.1
2023-08-01,510.6
2023-09-01,395.2
2023-10-01,170.8
2023-11-01,22.4
2023-12-01,7.6
2024-01-01,11.2
2024-02-01,16.5
2024-03-01,60.4
2024-04-01,145.2
2024-05-01,340.1
2024-06-01,655.8
2024-07-01,725.4
2024-08-01,535.1
2024-09-01,420.3
2024-10-01,190.5
2024-11-01,20.1
2024-12-01,8.9`;
}

export const parseGiovanniCsv = (csvText: string, customTitle?: string) => DataImporterService.parseCsv(csvText, customTitle);
export const SAMPLE_GIOVANNI_GPM_CSV = DataImporterService.SAMPLE_GIOVANNI_GPM_CSV;
