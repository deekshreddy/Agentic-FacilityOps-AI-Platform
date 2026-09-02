import axios from 'axios';
import { parseCSV } from '../utils/dataParser';
import { FacilityRecord } from '../types';

const defaultSources = [
  '/data/data_center_hybrid.csv',
  '/data/facility-data.json',
  '/data/facility-data.csv',
  '/data/facility-data.xlsx',
];

const fetchJson = async (url: string): Promise<FacilityRecord[]> => {
  const response = await axios.get(url);
  return response.data;
};

const fetchCsv = async (url: string): Promise<FacilityRecord[]> => {
  const response = await axios.get(url, { responseType: 'text' });
  return parseCSV(response.data);
};

const fetchXlsx = async (url: string): Promise<FacilityRecord[]> => {
  const response = await axios.get(url, { responseType: 'arraybuffer' });
  const workbook = await import('xlsx');
  const workbookData = workbook.read(response.data, { type: 'array' });
  const sheetName = workbookData.SheetNames[0];
  const sheet = workbookData.Sheets[sheetName];
  const worksheetData = workbook.utils.sheet_to_json<FacilityRecord>(sheet, { defval: null });
  return worksheetData as FacilityRecord[];
};

const loadManifest = async (): Promise<string[]> => {
  try {
    const res = await axios.get('/data/_manifest.json');
    if (Array.isArray(res.data)) return res.data.map((s: string) => `/data/${s}`);
  } catch (e) {
    // manifest optional
  }
  return defaultSources;
};

const fetchData = async (): Promise<FacilityRecord[]> => {
  const sources = await loadManifest();

  for (const source of sources) {
    try {
      if (source.endsWith('.json')) {
        const data = await fetchJson(source);
        if (Array.isArray(data) && data.length) {
          // eslint-disable-next-line no-console
          console.info(`dashboardService: loaded ${data.length} records from ${source}`);
          return data;
        }
      }
      if (source.endsWith('.csv')) {
        const data = await fetchCsv(source);
        if (Array.isArray(data) && data.length) {
          // eslint-disable-next-line no-console
          console.info(`dashboardService: loaded ${data.length} records from ${source}`);
          return data;
        }
      }
      if (source.endsWith('.xlsx')) {
        const data = await fetchXlsx(source);
        if (Array.isArray(data) && data.length) {
          // eslint-disable-next-line no-console
          console.info(`dashboardService: loaded ${data.length} records from ${source}`);
          return data;
        }
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn(`dashboardService: failed to load ${source}`, error);
      continue;
    }
  }

  return [];
};

export const getDashboardData = async (): Promise<FacilityRecord[]> => {
  return fetchData();
};
