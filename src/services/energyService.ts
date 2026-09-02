import axios from 'axios';
import { FacilityRecord } from '../types';
import { groupBy } from '../utils/dataUtils';
import { parseCSV } from '../utils/dataParser';

const energySource = '/data/data_center_hybrid.csv';

/**
 * Safely converts a value to a number.
 */
const toNumber = (value: unknown): number => {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : 0;
};

/**
 * Get a numeric value from a record.
 * Supports the fields available in the current dataset
 * and also keeps compatibility with possible energy fields.
 */
const getEnergyValue = (record: FacilityRecord): number => {
  const data = record as unknown as Record<string, unknown>;

  return toNumber(
    data.energyUsage ??
      data.dailyElectricityUsageMwh ??
      data.powerUsage ??
      0
  );
};

/**
 * Energy usage grouped by building.
 */
export const calculateEnergyByBuilding = (
  records: FacilityRecord[]
) => {
  const grouped = groupBy(records, (r) => String(r.building ?? 'Unknown'));

  return Object.entries(grouped).map(([building, items]) => ({
    building,
    value: items.reduce(
      (sum, item) => sum + getEnergyValue(item),
      0
    ),
  }));
};

/**
 * Energy trend over time.
 */
export const buildEnergyTrend = (
  records: FacilityRecord[]
) => {
  const grouped = groupBy(records, (r) => String(r.timestamp ?? 'Unknown'));

  return Object.entries(grouped)
    .map(([timestamp, items]) => ({
      timestamp,
      value: items.reduce(
        (sum, item) => sum + getEnergyValue(item),
        0
      ),
    }))
    .sort(
      (a, b) =>
        new Date(a.timestamp).getTime() -
        new Date(b.timestamp).getTime()
    );
};

/**
 * Maximum power load.
 */
export const calculatePeakLoad = (
  records: FacilityRecord[]
) => {
  return Math.max(
    0,
    ...records.map((record) => {
      const data =
        record as unknown as Record<string, unknown>;

      return toNumber(data.powerUsage);
    })
  );
};

/**
 * Average runtime, if the dataset contains runtimeHours.
 */
export const calculateAverageRuntime = (
  records: FacilityRecord[]
) => {
  const values = records
    .map((record) => {
      const data =
        record as unknown as Record<string, unknown>;

      return toNumber(data.runtimeHours);
    })
    .filter((value) => value > 0);

  if (values.length === 0) {
    return 0;
  }

  return (
    values.reduce((sum, value) => sum + value, 0) /
    values.length
  );
};

/**
 * Total energy usage.
 */
export const calculateTotalEnergyUsage = (
  records: FacilityRecord[]
) => {
  return records.reduce(
    (sum, record) => sum + getEnergyValue(record),
    0
  );
};

/**
 * Load the existing energy CSV file.
 */
export const getEnergyData = async (): Promise<FacilityRecord[]> => {
  try {
    const response = await axios.get<string>(energySource, {
      responseType: 'text',
    });

    const data = parseCSV(response.data);

    if (!Array.isArray(data) || data.length === 0) {
      console.warn(
        'energyService: No energy records loaded'
      );

      return [];
    }

    console.log(
      `energyService: Loaded ${data.length} records`
    );

    return data as FacilityRecord[];
  } catch (error) {
    console.error(
      'energyService: Failed to load energy dataset:',
      error
    );

    return [];
  }
};