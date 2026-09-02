// Shared types for the M3 Occupancy & Space Utilization module.

export type OccupancyStatus = 'Low' | 'Medium' | 'High' | 'Critical';

export interface OccupancyRecord {
  timestamp: number;      // epoch ms
  occupancy: number;      // Room_Occupancy_Count
  zone: string;           // dataset has a single room; logical label used
  floor: string;          // dataset has no floor column; logical label used
  capacity: number;       // FACILITY_CAPACITY
}

export interface ZoneOccupancy {
  zoneName: string;
  floor: string;
  currentOccupancy: number;
  averageOccupancy: number;
  peakOccupancy: number;
  capacity: number;
  utilization: number;    // percent
  status: OccupancyStatus;
  recordCount: number;
  lastUpdated: number;
}

export interface OccupancyKPI {
  latestOccupancy: number;
  latestTimestamp: number | null;
  lastActiveOccupancy: number | null;
  lastActiveTimestamp: number | null;
  averageOccupancy: number;
  peakOccupancy: number;
  peakTimestamp: number | null;
  peakCount: number;
  capacity: number;
  availableCapacity: number;
  utilization: number;         // current/latest based %
  averageUtilization: number;  // average based %
  overallStatus: OccupancyStatus;
  currentStatus: OccupancyStatus;
}

export interface OccupancyTrendPoint {
  timestamp: number;
  averageOccupancy: number;
  peakOccupancy: number;
  observations: number;
}

export interface OccupancyHeatmapCell {
  dayOfWeek: number;   // 0=Sunday
  hour: number;        // 0-23
  occupancy: number | null;   // avg occupancy in bucket
  peakOccupancy?: number;
  capacity: number | null;
  utilization: number | null; // percent
  status: OccupancyStatus | null;
  floor: string;
  zone: string;
  observations: number;
  timestamp: number | null;
}

export interface OvercrowdingEntry {
  zone: string;
  floor: string;
  occupancy: number;
  capacity: number;
  utilization: number;
  status: OccupancyStatus;
  timestamp: number;
}

export interface OccupancyDistribution {
  Low: number;
  Medium: number;
  High: number;
  Critical: number;
}

export interface PeakPeriodAnalysis {
  peakHour: number;
  peakHourLabel: string;
  peakHourAverage: number;
  peakDay: string;
  peakDayAverage: number;
  peakOccupancy: number;
  peakOccurrences: number;
  overallAverage: number;
}

export interface DatasetQuality {
  loaded: number;
  valid: number;
  invalid: number;
  dateRangeStart: number | null;
  dateRangeEnd: number | null;
  lastRecord: number | null;
}
