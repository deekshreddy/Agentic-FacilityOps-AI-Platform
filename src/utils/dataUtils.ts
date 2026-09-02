import { FacilityRecord } from '../types';

export const sumValues = (records: FacilityRecord[], field: keyof FacilityRecord) => {
  return records.reduce((sum, record) => sum + (typeof record[field] === 'number' ? (record[field] as number) : 0), 0);
};

export const averageValues = (records: FacilityRecord[], field: keyof FacilityRecord) => {
  const values = records.map((record) => record[field]).filter((value): value is number => typeof value === 'number');
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
};

export const groupBy = <T, K extends string>(records: T[], field: (record: T) => K) => {
  return records.reduce<Record<string, T[]>>((groups, record) => {
    const key = String(field(record) ?? 'Unknown');
    if (!groups[key]) groups[key] = [];
    groups[key].push(record);
    return groups;
  }, {});
};

export const uniqueValues = (records: FacilityRecord[], field: keyof FacilityRecord) => {
  return Array.from(new Set(records.map((record) => String(record[field] ?? 'Unknown'))));
};

export const safeNumber = (value: number | null | undefined) => {
  return typeof value === 'number' && !Number.isNaN(value) ? value : 0;
};
