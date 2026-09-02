import Papa from 'papaparse';
import { FacilityRecord } from '../types';

const headerMap: Record<string, string> = {
  year: 'year',
  facility_id: 'facilityId',
  facility_name: 'facilityName',
  owner_company: 'ownerCompany',
  city: 'city',
  country: 'country',
  facility_type: 'facilityType',
  estimated_capacity_mw: 'estimatedCapacityMw',
  pue: 'pue',
  cooling_system_type: 'coolingSystemType',
  wue_l_per_kwh: 'wueLPerKwh',
  daily_electricity_usage_mwh: 'dailyElectricityUsageMwh',
  daily_water_usage_gallons: 'dailyWaterUsageGallons',
  surrounding_water_stress_tier: 'surroundingWaterStressTier',
  product_id: 'productId',
  type: 'machineType',
  air_temp: 'airTemp',
  process_temp: 'processTemp',
  speed: 'speed',
  torque: 'torque',
  tool_wear: 'toolWear',
  target_real: 'targetReal',
  target: 'target',
};

const normalizeKey = (key: string) => key.trim().toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');

const detectMapping = (nk: string): string | null => {
  if (headerMap[nk]) return headerMap[nk];
  // heuristics
  if (nk.includes('electric') || nk.includes('energy') || nk.includes('mwh') || nk.includes('kwh')) return 'energyUsage';
  if (nk.includes('cost') && nk.includes('energy')) return 'energyCost';
  if (nk.includes('maintenance') && nk.includes('cost')) return 'maintenanceCost';
  if (nk.includes('water') && nk.includes('usage')) return 'otherCost';
  if (nk.includes('occup') || nk.includes('occupancy')) return 'occupancy';
  if (nk.includes('capacity') || nk.includes('occupancy_capacity')) return 'occupancyCapacity';
  if (nk.includes('health') || nk.includes('health_score') || nk.includes('healthscore')) return 'healthScore';
  if (nk.includes('alert') && nk.includes('type')) return 'alertType';
  if (nk.includes('alert') && nk.includes('severity')) return 'alertSeverity';
  if (nk.includes('facility') || nk.includes('site') || nk.includes('building') || nk.includes('facility_name')) return 'building';
  if (nk === 'floor' || nk.includes('floor')) return 'floor';
  if (nk === 'room' || nk.includes('room')) return 'room';
  if (nk.includes('device') || (nk.includes('id') && nk.includes('device'))) return 'deviceId';
  if (nk.includes('machine') && nk.includes('id')) return 'productId';
  if (nk.includes('machine') || nk.includes('product') || nk.includes('id')) return 'productId';
  if (nk.includes('type')) return 'machineType';
  if (nk.includes('timestamp') || nk.includes('date') || nk.includes('time') || nk.includes('day') || nk.includes('year')) return 'timestamp';
  if (nk.includes('power') || nk.includes('mw') || nk.includes('capacity')) return 'powerUsage';
  if (nk.includes('temp') || nk.includes('temperature')) return nk.includes('process') ? 'processTemp' : 'airTemp';
  if (nk.includes('speed')) return 'speed';
  if (nk.includes('torque')) return 'torque';
  if (nk.includes('tool') && nk.includes('wear')) return 'toolWear';
  if (nk.includes('target_real') || nk.includes('targetreal')) return 'targetReal';
  if (nk === 'target') return 'target';
  if (nk.includes('humid')) return 'humidity';
  // fallback: no mapping
  return null;
};

export const parseCSV = <T extends Record<string, any>>(csvText: string): T[] => {
  try {
    const parsed = Papa.parse<Record<string, string>>(csvText, { header: true, skipEmptyLines: true });

    // detect headers from parsed.meta.fields when available
    const detected: Record<string, string | null> = {};
    const fields = (parsed.meta && (parsed.meta as any).fields) || Object.keys(parsed.data[0] || {});
    fields.forEach((f: string) => {
      const nk = normalizeKey(f);
      detected[nk] = detectMapping(nk);
    });

    const records: T[] = parsed.data.map((row) => {
      const out: Partial<T> = {};
      Object.entries(row).forEach(([key, value]) => {
        const nk = normalizeKey(key);
        const mapped = detected[nk] ?? nk;

        if (value === undefined || value === null || value === '') {
          (out as any)[mapped] = (out as any)[mapped] ?? null;
          return;
        }

        const num = Number(value.toString().replace(/[\s,]/g, ''));
        (out as any)[mapped] = !Number.isNaN(num) ? num : value;
      });

      if ((out as any).timestamp && typeof (out as any).timestamp === 'number') {
        (out as any).timestamp = String((out as any).timestamp);
      }

      return out as T;
    });

    // eslint-disable-next-line no-console
    console.info(`parseCSV: loaded ${records.length} records`);

    return records;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('parseCSV error', err);
    return [];
  }
};
