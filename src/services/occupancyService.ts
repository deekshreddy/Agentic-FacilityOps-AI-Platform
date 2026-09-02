/* ============================================================
   OCCUPANCY SERVICE
   FacilityOps AI Platform - Milestone 3

   REAL DATASET:
   Date
   Time
   S1_Temp ... S7_PIR
   Room_Occupancy_Count
============================================================ */

export interface OccupancyRecord {
  Date?: string;
  Time?: string;

  S1_Temp?: string | number;
  S2_Temp?: string | number;
  S3_Temp?: string | number;
  S4_Temp?: string | number;

  S1_Light?: string | number;
  S2_Light?: string | number;
  S3_Light?: string | number;
  S4_Light?: string | number;

  S1_Sound?: string | number;
  S2_Sound?: string | number;
  S3_Sound?: string | number;
  S4_Sound?: string | number;

  S5_CO2?: string | number;
  S5_CO2_Slope?: string | number;

  S6_PIR?: string | number;
  S7_PIR?: string | number;

  Room_Occupancy_Count?: string | number;

  [key: string]: string | number | undefined;
}

/* ============================================================
   NUMBER HELPER
============================================================ */

const toNumber = (
  value: unknown
): number => {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return 0;
  }

  if (typeof value === "number") {
    return Number.isFinite(value)
      ? value
      : 0;
  }

  const parsed = Number(
    String(value)
      .trim()
      .replace(/,/g, "")
  );

  return Number.isFinite(parsed)
    ? parsed
    : 0;
};

/* ============================================================
   OCCUPANCY VALUE
   DIRECTLY FROM REAL DATASET
============================================================ */

export const getOccupancyValue = (
  record: OccupancyRecord
): number => {
  return toNumber(
    record.Room_Occupancy_Count
  );
};

/* ============================================================
   DATE
============================================================ */

export const getRecordDate = (
  record: OccupancyRecord
): string => {
  return record.Date
    ? String(record.Date).trim()
    : "Unknown date";
};

/* ============================================================
   TIME
============================================================ */

export const getRecordTime = (
  record: OccupancyRecord
): string => {
  return record.Time
    ? String(record.Time).trim()
    : "Unknown time";
};

/* ============================================================
   CAPACITY

   The real dataset does not contain a capacity column.
   Therefore we do NOT claim this is the actual room capacity.

   This is only used as a configurable reference for M3
   overcrowding visualization.
============================================================ */

export const DEFAULT_ROOM_CAPACITY = 10;

export const getCapacity = (
  _record: OccupancyRecord
): number => {
  return DEFAULT_ROOM_CAPACITY;
};

/* ============================================================
   OCCUPANCY PERCENTAGE
============================================================ */

export const calculateOccupancyPercentage = (
  record: OccupancyRecord
): number => {
  const occupancy =
    getOccupancyValue(record);

  const capacity =
    getCapacity(record);

  if (capacity <= 0) {
    return 0;
  }

  return Number(
    ((occupancy / capacity) * 100).toFixed(1)
  );
};

/* ============================================================
   STATUS
============================================================ */

export const getOccupancyStatus = (
  record: OccupancyRecord
): string => {
  const occupancy =
    getOccupancyValue(record);

  if (occupancy >= 10) {
    return "Critical";
  }

  if (occupancy >= 7) {
    return "Warning";
  }

  if (occupancy > 0) {
    return "Occupied";
  }

  return "Empty";
};

/* ============================================================
   ANALYSIS
============================================================ */

export interface OccupancyAnalysis {
  totalRecords: number;
  averageOccupancy: number;
  maximumOccupancy: number;
  minimumOccupancy: number;
  averageUtilization: number;
  overcrowdedCount: number;
  occupiedRecords: number;
  emptyRecords: number;
}

export const analyzeOccupancy = (
  records: OccupancyRecord[]
): OccupancyAnalysis => {
  if (
    !records ||
    records.length === 0
  ) {
    return {
      totalRecords: 0,
      averageOccupancy: 0,
      maximumOccupancy: 0,
      minimumOccupancy: 0,
      averageUtilization: 0,
      overcrowdedCount: 0,
      occupiedRecords: 0,
      emptyRecords: 0,
    };
  }

  const values = records.map(
    getOccupancyValue
  );

  const total = values.reduce(
    (sum, value) =>
      sum + value,
    0
  );

  const average =
    total / values.length;

  const maximum =
    Math.max(...values);

  const minimum =
    Math.min(...values);

  const occupiedRecords =
    values.filter(
      (value) => value > 0
    ).length;

  const emptyRecords =
    values.filter(
      (value) => value === 0
    ).length;

  const utilizationValues =
    records.map(
      calculateOccupancyPercentage
    );

  const averageUtilization =
    utilizationValues.reduce(
      (sum, value) =>
        sum + value,
      0
    ) / utilizationValues.length;

  const overcrowdedCount =
    values.filter(
      (value) =>
        value > DEFAULT_ROOM_CAPACITY
    ).length;

  return {
    totalRecords:
      records.length,

    averageOccupancy:
      Number(
        average.toFixed(2)
      ),

    maximumOccupancy:
      maximum,

    minimumOccupancy:
      minimum,

    averageUtilization:
      Number(
        averageUtilization.toFixed(1)
      ),

    overcrowdedCount,

    occupiedRecords,

    emptyRecords,
  };
};

/* ============================================================
   ALERT
============================================================ */

export interface OccupancyAlert {
  id: string;
  message: string;
  severity:
    | "Critical"
    | "Warning";
  occupancy: number;
  date: string;
  time: string;
}

/* ============================================================
   ALERT GENERATION
============================================================ */

export const generateOccupancyAlerts = (
  records: OccupancyRecord[]
): OccupancyAlert[] => {
  if (
    !records ||
    records.length === 0
  ) {
    return [];
  }

  return records
    .map(
      (record, index) => {
        const occupancy =
          getOccupancyValue(record);

        if (
          occupancy >
          DEFAULT_ROOM_CAPACITY
        ) {
          return {
            id:
              `occupancy-critical-${index}`,

            message:
              `Overcrowding detected: ${occupancy} people`,

            severity: "Critical" as const,

            occupancy,

            date:
              getRecordDate(record),

            time:
              getRecordTime(record),
          };
        }

        if (
          occupancy >= 7
        ) {
          return {
            id:
              `occupancy-warning-${index}`,

            message:
              `High occupancy detected: ${occupancy} people`,

            severity: "Warning" as const,

            occupancy,

            date:
              getRecordDate(record),

            time:
              getRecordTime(record),
          };
        }

        return null;
      }
    )
    .filter(
      (
        alert
      ): alert is OccupancyAlert =>
        alert !== null
    );
};

/* ============================================================
   OBSERVATIONS

   These are ACTUAL DATASET RECORDS.
   No fake Room 1 / Room 2 occupancy values are generated.
============================================================ */

export interface ZoneUtilization {
  name: string;
  occupancy: number;
  capacity: number;
  utilization: number;
  date: string;
  time: string;
}

export const getZoneUtilization = (
  records: OccupancyRecord[]
): ZoneUtilization[] => {
  if (
    !records ||
    records.length === 0
  ) {
    return [];
  }

  return records
    .slice(0, 20)
    .map(
      (record, index) => {
        const occupancy =
          getOccupancyValue(record);

        const utilization =
          calculateOccupancyPercentage(
            record
          );

        return {
          name:
            `Sensor Record ${index + 1}`,

          occupancy,

          capacity:
            DEFAULT_ROOM_CAPACITY,

          utilization,

          date:
            getRecordDate(record),

          time:
            getRecordTime(record),
        };
      }
    );
};

/* ============================================================
   SENSOR SUMMARY
============================================================ */

export interface SensorSummary {
  temperature: number;
  light: number;
  sound: number;
  co2: number;
  pir: number;
}

export const getSensorSummary = (
  record: OccupancyRecord
): SensorSummary => {
  const temperatures = [
    toNumber(record.S1_Temp),
    toNumber(record.S2_Temp),
    toNumber(record.S3_Temp),
    toNumber(record.S4_Temp),
  ];

  const lights = [
    toNumber(record.S1_Light),
    toNumber(record.S2_Light),
    toNumber(record.S3_Light),
    toNumber(record.S4_Light),
  ];

  const sounds = [
    toNumber(record.S1_Sound),
    toNumber(record.S2_Sound),
    toNumber(record.S3_Sound),
    toNumber(record.S4_Sound),
  ];

  const temperature =
    temperatures.reduce(
      (sum, value) =>
        sum + value,
      0
    ) / temperatures.length;

  const light =
    lights.reduce(
      (sum, value) =>
        sum + value,
      0
    ) / lights.length;

  const sound =
    sounds.reduce(
      (sum, value) =>
        sum + value,
      0
    ) / sounds.length;

  const co2 =
    toNumber(record.S5_CO2);

  const pir =
    (
      toNumber(record.S6_PIR) +
      toNumber(record.S7_PIR)
    ) / 2;

  return {
    temperature:
      Number(
        temperature.toFixed(2)
      ),

    light:
      Number(
        light.toFixed(2)
      ),

    sound:
      Number(
        sound.toFixed(2)
      ),

    co2:
      Number(
        co2.toFixed(2)
      ),

    pir:
      Number(
        pir.toFixed(2)
      ),
  };
};

/* ============================================================
   TREND
============================================================ */

export interface OccupancyTrend {
  date: string;
  time: string;
  occupancy: number;
}

export const getOccupancyTrend = (
  records: OccupancyRecord[]
): OccupancyTrend[] => {
  return records.map(
    (record) => ({
      date:
        getRecordDate(record),

      time:
        getRecordTime(record),

      occupancy:
        getOccupancyValue(record),
    })
  );
};

/* ============================================================
   PEAK RECORD
============================================================ */

export const getPeakOccupancyRecord = (
  records: OccupancyRecord[]
): OccupancyRecord | null => {
  if (
    !records ||
    records.length === 0
  ) {
    return null;
  }

  return records.reduce(
    (highest, current) =>
      getOccupancyValue(current) >
      getOccupancyValue(highest)
        ? current
        : highest
  );
};

/* ============================================================
   M3 ANALYTICS LAYER
   All values below are derived strictly from the loaded
   Occupancy_Estimation.csv records. The dataset contains one
   instrumented room, so "zones" resolve to that single real
   zone (ZONE_MAIN_ROOM / Level 1) configured in
   occupancyThresholds.ts. Nothing is fabricated.
   ============================================================ */

import {
  FACILITY_CAPACITY,
  OCCUPANCY_ZONES,
  getUtilizationStatus,
  UtilizationStatus,
} from "../config/occupancyThresholds";

export type TrendGranularity = "hourly" | "daily" | "weekly";

/* ---------------- shared timestamp helpers ---------------- */

export const parseRecordTimestamp = (
  record: OccupancyRecord
): number => {
  const date = String(record.Date ?? "").replace(/\//g, "-");
  const time = String(record.Time ?? "");
  const ms = new Date(`${date}T${time}`).getTime();
  return Number.isFinite(ms) ? ms : NaN;
};

const fmtTime = (ms: number | null): string =>
  ms === null || !Number.isFinite(ms)
    ? "—"
    : new Date(ms).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

const fmtDate = (ms: number | null): string =>
  ms === null || !Number.isFinite(ms)
    ? "—"
    : new Date(ms).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });

const hourLabel = (hour: number): string =>
  `${String(hour).padStart(2, "0")}:00`;

const pct = (value: number): number =>
  Number.isFinite(value) ? Math.round(value * 10) / 10 : 0;

/* ---------------- types ---------------- */

export interface OccupancyKPIs {
  totalOccupants: number;
  latestReading: number;
  latestReadingTime: string;
  latestActiveReading: number;
  latestActiveReadingTime: string;
  averageOccupancy: number;
  averageUtilization: number;
  facilityCapacity: number;
  availableCapacity: number;
  utilizationPercent: number;
  peakOccupancy: number;
  peakOccupancyTime: string;
  peakUtilization: number;
  activeZones: number;
}

export interface ZoneMetrics {
  zoneId: string;
  zoneName: string;
  floor: string;
  occupancy: number;
  avgOccupancy: number;
  avgUtilization: number;
  peakOccupancy: number;
  peakHour: string;
  capacity: number;
  utilization: number;
  status: UtilizationStatus;
  recommendation: string;
}

export interface OvercrowdingAlert {
  id: string;
  zone: string;
  message: string;
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  timestamp: string;
  utilization: number;
}

export interface TrendPoint {
  label: string;
  occupancy: number;
}

export interface ForecastPoint {
  label: string;
  occupancy: number;
  type: "history" | "forecast";
}

export interface HourZoneCell {
  zoneId: string;
  zoneName: string;
  floor: string;
  hour: string;
  occupancy: number;
  capacity: number;
  utilization: number;
  status: UtilizationStatus;
}

export interface HourlyZoneMatrixRow {
  hour: number;
  cells: Record<string, HourZoneCell>;
}

export interface PeakOccupancyAnalysis {
  highestOccupancy: number;
  lowestOccupancy: number;
  averageOccupancy: number;
  peakDay: string;
  peakHour: string;
  hourProfile: { hour: string; occupancy: number }[];
}

export interface PeakPeriod {
  date: string;
  time: string;
  occupancy: number;
  utilization: number;
  zone: string;
  status: UtilizationStatus;
}

export interface StatusDistributionPoint {
  status: UtilizationStatus;
  count: number;
  percentage: number;
}

export interface UnderutilizedZone {
  zoneId: string;
  zoneName: string;
  floor: string;
  avgOccupancy: number;
  capacity: number;
  utilization: number;
  action: string;
}

export interface AiSpaceInsight {
  currentUtilization: number;
  averageUtilization: number;
  peakUtilization: number;
  highestZone: string;
  highestZoneUtilization: number;
  lowestZone: string;
  lowestZoneUtilization: number;
  availableCapacity: number;
  overcrowdingRisk: "Low" | "Medium" | "High" | "Critical";
  recommendation: string;
  latestActiveReading: number;
  latestActiveReadingTime: string;
  peakOccupancy: number;
  peakOccupancyTime: string;
  averageOccupancy: number;
  totalRecords: number;
}

/* ---------------- KPIs ---------------- */

export const computeOccupancyKPIs = (
  records: OccupancyRecord[]
): OccupancyKPIs => {
  if (!records || records.length === 0) {
    return {
      totalOccupants: 0,
      latestReading: 0,
      latestReadingTime: "—",
      latestActiveReading: 0,
      latestActiveReadingTime: "—",
      averageOccupancy: 0,
      averageUtilization: 0,
      facilityCapacity: FACILITY_CAPACITY,
      availableCapacity: FACILITY_CAPACITY,
      utilizationPercent: 0,
      peakOccupancy: 0,
      peakOccupancyTime: "—",
      peakUtilization: 0,
      activeZones: 0,
    };
  }

  let latestMs = NaN;
  let latestValue = 0;
  let latestActiveMs = NaN;
  let latestActiveValue = 0;
  let peakValue = 0;
  let peakMs = NaN;
  let sum = 0;

  records.forEach((record) => {
    const value = getOccupancyValue(record);
    const ms = parseRecordTimestamp(record);
    sum += value;

    if (Number.isFinite(ms)) {
      if (!Number.isFinite(latestMs) || ms > latestMs) {
        latestMs = ms;
        latestValue = value;
      }
      if (value > 0 && (!Number.isFinite(latestActiveMs) || ms > latestActiveMs)) {
        latestActiveMs = ms;
        latestActiveValue = value;
      }
      if (value > peakValue) {
        peakValue = value;
        peakMs = ms;
      }
    } else if (value > peakValue) {
      peakValue = value;
    }
  });

  const averageOccupancy = sum / records.length;
  const averageUtilization =
    FACILITY_CAPACITY > 0 ? (averageOccupancy / FACILITY_CAPACITY) * 100 : 0;
  const utilizationPercent =
    FACILITY_CAPACITY > 0 ? (latestActiveValue / FACILITY_CAPACITY) * 100 : 0;

  return {
    totalOccupants: latestActiveValue,
    latestReading: latestValue,
    latestReadingTime: fmtTime(latestMs),
    latestActiveReading: latestActiveValue,
    latestActiveReadingTime: fmtTime(latestActiveMs),
    averageOccupancy: pct(averageOccupancy),
    averageUtilization: pct(averageUtilization),
    facilityCapacity: FACILITY_CAPACITY,
    availableCapacity: Math.max(0, FACILITY_CAPACITY - latestActiveValue),
    utilizationPercent: pct(utilizationPercent),
    peakOccupancy: peakValue,
    peakOccupancyTime: fmtTime(peakMs),
    peakUtilization:
      FACILITY_CAPACITY > 0 ? pct((peakValue / FACILITY_CAPACITY) * 100) : 0,
    activeZones: latestActiveValue > 0 ? OCCUPANCY_ZONES.length : 0,
  };
};

/* ---------------- zone metrics ---------------- */

export const buildZoneMetrics = (
  records: OccupancyRecord[]
): ZoneMetrics[] => {
  if (!records || records.length === 0) return [];

  const kpis = computeOccupancyKPIs(records);

  let sum = 0;
  let peak = 0;
  const hourBuckets = new Map<number, { sum: number; count: number }>();

  records.forEach((record) => {
    const value = getOccupancyValue(record);
    sum += value;
    if (value > peak) peak = value;
    const ms = parseRecordTimestamp(record);
    if (Number.isFinite(ms)) {
      const hour = new Date(ms).getHours();
      const bucket = hourBuckets.get(hour) ?? { sum: 0, count: 0 };
      bucket.sum += value;
      bucket.count += 1;
      hourBuckets.set(hour, bucket);
    }
  });

  const avgOccupancy = sum / records.length;
  const avgUtilization =
    FACILITY_CAPACITY > 0 ? (avgOccupancy / FACILITY_CAPACITY) * 100 : 0;
  const status = getUtilizationStatus(avgUtilization);

  let peakHour = hourLabel(0);
  let peakHourAvg = -1;
  hourBuckets.forEach((bucket, hour) => {
    const avg = bucket.count > 0 ? bucket.sum / bucket.count : 0;
    if (avg > peakHourAvg) {
      peakHourAvg = avg;
      peakHour = hourLabel(hour);
    }
  });

  const recommendation =
    status === "Critical"
      ? "At or over configured capacity — redistribute occupants immediately."
      : status === "High"
      ? `Approaching capacity — average ${pct(avgOccupancy)} occupants, peak ${peak} at ${peakHour}. Prepare overflow space.`
      : status === "Medium"
      ? `Moderate load (${pct(avgUtilization)}% avg). Monitor during peak hour ${peakHour}.`
      : `Underutilized (${pct(avgUtilization)}% avg) — consider consolidating activities here.`;

  return OCCUPANCY_ZONES.map((zone) => ({
    zoneId: zone.id,
    zoneName: zone.name,
    floor: zone.floor,
    occupancy: kpis.latestActiveReading,
    avgOccupancy: pct(avgOccupancy),
    avgUtilization: pct(avgUtilization),
    peakOccupancy: peak,
    peakHour,
    capacity: FACILITY_CAPACITY,
    utilization: kpis.utilizationPercent,
    status,
    recommendation,
  }));
};

/* ---------------- overcrowding detection ---------------- */

export const detectOvercrowding = (
  records: OccupancyRecord[]
): OvercrowdingAlert[] => {
  if (!records || records.length === 0) return [];

  const zones = buildZoneMetrics(records);
  const kpis = computeOccupancyKPIs(records);

  const alerts: OvercrowdingAlert[] = [];
  zones.forEach((zone) => {
    if (zone.status === "Critical" || zone.status === "High") {
      alerts.push({
        id: `overcrowding-${zone.zoneId}`,
        zone: zone.zoneName,
        message:
          zone.status === "Critical"
            ? `${zone.zoneName} is at critical utilization (${zone.avgUtilization}% avg, peak ${zone.peakOccupancy}). Immediate redistribution advised.`
            : `${zone.zoneName} is at high utilization (${zone.avgUtilization}% avg, peak ${zone.peakOccupancy} at ${zone.peakHour}).`,
        severity: zone.status === "Critical" ? "CRITICAL" : "HIGH",
        timestamp: kpis.latestActiveReadingTime,
        utilization: zone.avgUtilization,
      });
    }
  });

  return alerts;
};

/* ---------------- chronological sort ---------------- */

export const sortRecordsChronologically = (
  records: OccupancyRecord[]
): OccupancyRecord[] =>
  [...records].sort(
    (a, b) => {
      const ta = parseRecordTimestamp(a);
      const tb = parseRecordTimestamp(b);
      if (Number.isFinite(ta) && Number.isFinite(tb)) return ta - tb;
      if (Number.isFinite(ta)) return 1;
      if (Number.isFinite(tb)) return -1;
      return 0;
    }
  );

/* ---------------- occupancy trend ---------------- */

const buildTrendBuckets = (
  records: OccupancyRecord[],
  granularity: TrendGranularity
): Map<string, { sum: number; count: number; sortKey: number }> => {
  const buckets = new Map<string, { sum: number; count: number; sortKey: number }>();

  records.forEach((record) => {
    const ms = parseRecordTimestamp(record);
    if (!Number.isFinite(ms)) return;
    const date = new Date(ms);

    let label: string;
    let sortKey: number;

    if (granularity === "daily") {
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
      label = date.toLocaleDateString([], { month: "short", day: "numeric" });
      sortKey = date.getTime() - (date.getTime() % 86400000);
    } else if (granularity === "weekly") {
      const weekStart = new Date(date);
      weekStart.setHours(0, 0, 0, 0);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      label = `Wk of ${weekStart.toLocaleDateString([], { month: "short", day: "numeric" })}`;
      sortKey = weekStart.getTime();
    } else {
      const hour = date.getHours();
      label = hourLabel(hour);
      sortKey = hour;
    }

    const value = getOccupancyValue(record);
    const bucket = buckets.get(label) ?? { sum: 0, count: 0, sortKey };
    bucket.sum += value;
    bucket.count += 1;
    buckets.set(label, bucket);
  });

  return buckets;
};

export const buildOccupancyTrend = (
  records: OccupancyRecord[],
  granularity: TrendGranularity,
  _zone: string,
  _floor: string
): TrendPoint[] => {
  if (!records || records.length === 0) return [];

  const buckets = buildTrendBuckets(records, granularity);
  return [...buckets.entries()]
    .sort((a, b) => a[1].sortKey - b[1].sortKey)
    .map(([label, bucket]) => ({
      label,
      occupancy: bucket.count > 0 ? pct(bucket.sum / bucket.count) : 0,
    }));
};

/* ---------------- forecast ----------------
   3-point moving average over the hourly profile,
   projecting a 4-hour horizon. ---------------- */

export const forecastOccupancy = (
  records: OccupancyRecord[]
): ForecastPoint[] => {
  if (!records || records.length === 0) return [];

  const hourly = buildOccupancyTrend(records, "hourly", "ALL", "ALL");
  if (hourly.length === 0) return [];

  const history: ForecastPoint[] = hourly.map((p) => ({
    label: p.label,
    occupancy: p.occupancy,
    type: "history",
  }));

  const values = hourly.map((p) => p.occupancy);
  const horizon = Math.min(4, values.length);
  const forecast: ForecastPoint[] = [];
  let working = [...values];

  for (let i = 0; i < horizon; i++) {
    const window = working.slice(-3);
    const next =
      window.reduce((sum, v) => sum + v, 0) / Math.max(1, window.length);
    const rounded = pct(next);
    working.push(rounded);
    forecast.push({
      label: `+${i + 1}h`,
      occupancy: rounded,
      type: "forecast",
    });
  }

  return [...history, ...forecast];
};

/* ---------------- hourly zone matrix (heatmap) ---------------- */

export const buildHourlyZoneMatrix = (
  records: OccupancyRecord[]
): HourlyZoneMatrixRow[] => {
  if (!records || records.length === 0) return [];

  const zone = OCCUPANCY_ZONES[0];
  if (!zone) return [];

  const buckets = new Map<number, { sum: number; count: number; peak: number }>();

  records.forEach((record) => {
    const ms = parseRecordTimestamp(record);
    if (!Number.isFinite(ms)) return;
    const hour = new Date(ms).getHours();
    const value = getOccupancyValue(record);
    const bucket = buckets.get(hour) ?? { sum: 0, count: 0, peak: 0 };
    bucket.sum += value;
    bucket.count += 1;
    bucket.peak = Math.max(bucket.peak, value);
    buckets.set(hour, bucket);
  });

  const rows: HourlyZoneMatrixRow[] = [];
  for (let hour = 0; hour < 24; hour++) {
    const bucket = buckets.get(hour);
    const occupancy =
      bucket && bucket.count > 0 ? bucket.sum / bucket.count : 0;
    const utilization =
      FACILITY_CAPACITY > 0 ? (occupancy / FACILITY_CAPACITY) * 100 : 0;
    rows.push({
      hour,
      cells: {
        [zone.id]: {
          zoneId: zone.id,
          zoneName: zone.name,
          floor: zone.floor,
          hour: hourLabel(hour),
          occupancy: pct(occupancy),
          capacity: FACILITY_CAPACITY,
          utilization: pct(utilization),
          status: getUtilizationStatus(utilization),
        },
      },
    });
  }

  return rows;
};

/* ---------------- peak analysis ---------------- */

export const getPeakOccupancy = (
  records: OccupancyRecord[]
): PeakOccupancyAnalysis => {
  if (!records || records.length === 0) {
    return {
      highestOccupancy: 0,
      lowestOccupancy: 0,
      averageOccupancy: 0,
      peakDay: "—",
      peakHour: "—",
      hourProfile: [],
    };
  }

  const values = records.map(getOccupancyValue);
  const highestOccupancy = Math.max(...values);
  const lowestOccupancy = Math.min(...values);
  const averageOccupancy =
    values.reduce((sum, v) => sum + v, 0) / values.length;

  let peakMs = NaN;
  let peakValue = -1;
  const hourBuckets = new Map<number, { sum: number; count: number }>();
  const dayBuckets = new Map<string, { sum: number; count: number }>();

  records.forEach((record) => {
    const ms = parseRecordTimestamp(record);
    const value = getOccupancyValue(record);
    if (Number.isFinite(ms)) {
      if (value > peakValue) {
        peakValue = value;
        peakMs = ms;
      }
      const date = new Date(ms);
      const hour = date.getHours();
      const hb = hourBuckets.get(hour) ?? { sum: 0, count: 0 };
      hb.sum += value;
      hb.count += 1;
      hourBuckets.set(hour, hb);

      const dayKey = date.toLocaleDateString([], { month: "short", day: "numeric" });
      const db = dayBuckets.get(dayKey) ?? { sum: 0, count: 0 };
      db.sum += value;
      db.count += 1;
      dayBuckets.set(dayKey, db);
    }
  });

  let peakHour = "—";
  let peakHourAvg = -1;
  hourBuckets.forEach((bucket, hour) => {
    const avg = bucket.sum / bucket.count;
    if (avg > peakHourAvg) {
      peakHourAvg = avg;
      peakHour = hourLabel(hour);
    }
  });

  let peakDay = "—";
  let peakDayAvg = -1;
  dayBuckets.forEach((bucket, day) => {
    const avg = bucket.sum / bucket.count;
    if (avg > peakDayAvg) {
      peakDayAvg = avg;
      peakDay = day;
    }
  });

  const hourProfile: { hour: string; occupancy: number }[] = [];
  for (let hour = 0; hour < 24; hour++) {
    const bucket = hourBuckets.get(hour);
    hourProfile.push({
      hour: hourLabel(hour),
      occupancy: bucket ? pct(bucket.sum / bucket.count) : 0,
    });
  }

  return {
    highestOccupancy,
    lowestOccupancy,
    averageOccupancy: pct(averageOccupancy),
    peakDay,
    peakHour,
    hourProfile,
  };
};

/* ---------------- top peak periods ---------------- */

export const calculatePeakPeriods = (
  records: OccupancyRecord[]
): PeakPeriod[] => {
  if (!records || records.length === 0) return [];

  const zoneName = OCCUPANCY_ZONES[0]?.name ?? "—";

  return [...records]
    .sort(
      (a, b) => getOccupancyValue(b) - getOccupancyValue(a)
    )
    .slice(0, 5)
    .map((record) => {
      const value = getOccupancyValue(record);
      const ms = parseRecordTimestamp(record);
      const utilization =
        FACILITY_CAPACITY > 0 ? (value / FACILITY_CAPACITY) * 100 : 0;
      return {
        date: fmtDate(ms),
        time: fmtTime(ms),
        occupancy: value,
        utilization: pct(utilization),
        zone: zoneName,
        status: getUtilizationStatus(utilization),
      };
    });
};

/* ---------------- status distribution ---------------- */

export const calculateStatusDistribution = (
  records: OccupancyRecord[]
): StatusDistributionPoint[] => {
  const counts: Record<UtilizationStatus, number> = {
    Low: 0,
    Medium: 0,
    High: 0,
    Critical: 0,
  };

  records.forEach((record) => {
    const value = getOccupancyValue(record);
    const utilization =
      FACILITY_CAPACITY > 0 ? (value / FACILITY_CAPACITY) * 100 : 0;
    counts[getUtilizationStatus(utilization)] += 1;
  });

  const total = records.length || 1;

  return (["Low", "Medium", "High", "Critical"] as UtilizationStatus[]).map(
    (status) => ({
      status,
      count: counts[status],
      percentage: pct((counts[status] / total) * 100),
    })
  );
};

/* ---------------- underutilized zones ---------------- */

export const getUnderutilizedZones = (
  records: OccupancyRecord[]
): UnderutilizedZone[] => {
  if (!records || records.length === 0) return [];

  return buildZoneMetrics(records)
    .filter((zone) => zone.avgUtilization < 40)
    .map((zone) => ({
      zoneId: zone.zoneId,
      zoneName: zone.zoneName,
      floor: zone.floor,
      avgOccupancy: zone.avgOccupancy,
      capacity: zone.capacity,
      utilization: zone.avgUtilization,
      action: `Underutilized space (${zone.avgUtilization}% avg) — consider consolidating activities or hosting teams here during peak hours elsewhere.`,
    }));
};

/* ---------------- AI space insight ---------------- */

export const generateSpaceInsight = (
  records: OccupancyRecord[]
): AiSpaceInsight | null => {
  if (!records || records.length === 0) return null;

  const kpis = computeOccupancyKPIs(records);
  const peak = getPeakOccupancy(records);
  const zones = buildZoneMetrics(records);
  const distribution = calculateStatusDistribution(records);

  const sortedZones = [...zones].sort(
    (a, b) => b.avgUtilization - a.avgUtilization
  );
  const highest = sortedZones[0];
  const lowest = sortedZones[sortedZones.length - 1] ?? highest;

  const criticalRecords = distribution.find((d) => d.status === "Critical")?.count ?? 0;
  const highRecords = distribution.find((d) => d.status === "High")?.count ?? 0;
  const criticalShare = (criticalRecords + highRecords) / records.length;

  const overcrowdingRisk: AiSpaceInsight["overcrowdingRisk"] =
    kpis.utilizationPercent >= 90 || criticalShare > 0.25
      ? "Critical"
      : kpis.utilizationPercent >= 70 || criticalShare > 0.1
      ? "High"
      : kpis.utilizationPercent >= 40
      ? "Medium"
      : "Low";

  const recommendation =
    overcrowdingRisk === "Critical"
      ? "Occupancy has reached the configured capacity during peak periods. Immediate space balancing is recommended."
      : overcrowdingRisk === "High"
      ? "Occupancy is high during peak periods. Consider redistributing workspace usage and preparing overflow capacity."
      : overcrowdingRisk === "Medium"
      ? "Occupancy is moderate. Continue monitoring space utilization, especially around the peak hour."
      : "Space utilization is low. Consider consolidating workspace usage during this period.";

  return {
    currentUtilization: kpis.utilizationPercent,
    averageUtilization: kpis.averageUtilization,
    peakUtilization: kpis.peakUtilization,
    highestZone: highest?.zoneName ?? "—",
    highestZoneUtilization: highest?.avgUtilization ?? 0,
    lowestZone: lowest?.zoneName ?? "—",
    lowestZoneUtilization: lowest?.avgUtilization ?? 0,
    availableCapacity: kpis.availableCapacity,
    overcrowdingRisk,
    recommendation,
    latestActiveReading: kpis.latestActiveReading,
    latestActiveReadingTime: kpis.latestActiveReadingTime,
    peakOccupancy: kpis.peakOccupancy,
    peakOccupancyTime: kpis.peakOccupancyTime,
    averageOccupancy: kpis.averageOccupancy,
    totalRecords: records.length,
  };
};

/* ---------------- smart recommendations ---------------- */

export const generateOccupancyRecommendations = (
  records: OccupancyRecord[]
): string[] => {
  if (!records || records.length === 0) return [];

  const kpis = computeOccupancyKPIs(records);
  const sensors = analyzeSensorConditions(records);
  const recommendations: string[] = [];

  if (kpis.averageUtilization < 40) {
    recommendations.push(
      `Space utilization is low (avg ${kpis.averageUtilization}% of configurable capacity ${FACILITY_CAPACITY}). Consider consolidating workspace usage during this period.`
    );
  } else if (kpis.averageUtilization < 70) {
    recommendations.push(
      `Occupancy is moderate (avg ${kpis.averageUtilization}%). Continue monitoring space utilization.`
    );
  } else if (kpis.averageUtilization < 90) {
    recommendations.push(
      `Occupancy is high (avg ${kpis.averageUtilization}%). Consider redistributing workspace usage.`
    );
  } else {
    recommendations.push(
      `Occupancy has reached the configured capacity (${FACILITY_CAPACITY}). Immediate space balancing is recommended.`
    );
  }

  if (sensors.averageCO2 > 500) {
    recommendations.push(
      `CO2 levels are elevated (avg ${sensors.averageCO2} ppm). Check ventilation.`
    );
  }

  if (sensors.pirActivity > 0.4) {
    recommendations.push(
      `High PIR activity (${Math.round(sensors.pirActivity * 100)}% of readings active) indicates increased movement in the monitored area.`
    );
  }

  if (kpis.averageOccupancy < 1 && (sensors.averageLight > 200 || sensors.averageSound > 100)) {
    recommendations.push(
      "Low occupancy with active environmental sensors may indicate an opportunity for operational optimization (lighting / HVAC scheduling)."
    );
  }

  if (kpis.peakOccupancy >= FACILITY_CAPACITY) {
    recommendations.push(
      `Peak occupancy (${kpis.peakOccupancy}) reached the configured capacity of ${FACILITY_CAPACITY} at ${kpis.peakOccupancyTime}. Consider capping new entries during that window.`
    );
  }

  return recommendations;
};

/* ============================================================
   SENSOR ANALYTICS (M3 environmental conditions)
   All values from the real CSV sensor columns.
   ============================================================ */

export interface SensorAnalysis {
  averageTemperature: number;
  averageCO2: number;
  averageLight: number;
  averageSound: number;
  pirActivity: number; // 0..1 share of readings with any PIR triggered
}

const mean = (values: number[]): number =>
  values.length > 0 ? values.reduce((sum, v) => sum + v, 0) / values.length : 0;

export const analyzeSensorConditions = (
  records: OccupancyRecord[]
): SensorAnalysis => {
  if (!records || records.length === 0) {
    return {
      averageTemperature: 0,
      averageCO2: 0,
      averageLight: 0,
      averageSound: 0,
      pirActivity: 0,
    };
  }

  const temperatures: number[] = [];
  const lights: number[] = [];
  const sounds: number[] = [];
  const co2: number[] = [];
  let pirActive = 0;

  records.forEach((record) => {
    temperatures.push(
      mean([record.S1_Temp, record.S2_Temp, record.S3_Temp, record.S4_Temp].map(toNumber))
    );
    lights.push(
      mean([record.S1_Light, record.S2_Light, record.S3_Light, record.S4_Light].map(toNumber))
    );
    sounds.push(
      mean([record.S1_Sound, record.S2_Sound, record.S3_Sound, record.S4_Sound].map(toNumber))
    );
    co2.push(toNumber(record.S5_CO2));
    if (toNumber(record.S6_PIR) > 0 || toNumber(record.S7_PIR) > 0) pirActive += 1;
  });

  return {
    averageTemperature: Number(mean(temperatures).toFixed(1)),
    averageCO2: Math.round(mean(co2)),
    averageLight: Math.round(mean(lights)),
    averageSound: Number(mean(sounds).toFixed(2)),
    pirActivity: pirActive / records.length,
  };
};

/* ---------------- hourly sensor profile (sensor heatmap) ---------------- */

export interface SensorHeatmapCell {
  sensorId: string;
  sensorLabel: string;
  hour: string;
  value: number;
  normalized: number; // 0..1 relative to sensor max across the day
  intensity: "Low" | "Moderate" | "Medium" | "High" | "Critical";
}

export const SENSOR_COLUMNS: { id: string; label: string; unit: string }[] = [
  { id: "S1", label: "S1 Temp", unit: "°C" },
  { id: "S2", label: "S2 Temp", unit: "°C" },
  { id: "S3", label: "S3 Temp", unit: "°C" },
  { id: "S4", label: "S4 Temp", unit: "°C" },
  { id: "S1_L", label: "S1 Light", unit: "lux" },
  { id: "S2_L", label: "S2 Light", unit: "lux" },
  { id: "S3_L", label: "S3 Light", unit: "lux" },
  { id: "S4_L", label: "S4 Light", unit: "lux" },
  { id: "S1_S", label: "S1 Sound", unit: "dB" },
  { id: "S2_S", label: "S2 Sound", unit: "dB" },
  { id: "S3_S", label: "S3 Sound", unit: "dB" },
  { id: "S4_S", label: "S4 Sound", unit: "dB" },
  { id: "CO2", label: "S5 CO2", unit: "ppm" },
  { id: "PIR6", label: "S6 PIR", unit: "" },
  { id: "PIR7", label: "S7 PIR", unit: "" },
];

const sensorValue = (record: OccupancyRecord, id: string): number => {
  switch (id) {
    case "S1": return toNumber(record.S1_Temp);
    case "S2": return toNumber(record.S2_Temp);
    case "S3": return toNumber(record.S3_Temp);
    case "S4": return toNumber(record.S4_Temp);
    case "S1_L": return toNumber(record.S1_Light);
    case "S2_L": return toNumber(record.S2_Light);
    case "S3_L": return toNumber(record.S3_Light);
    case "S4_L": return toNumber(record.S4_Light);
    case "S1_S": return toNumber(record.S1_Sound);
    case "S2_S": return toNumber(record.S2_Sound);
    case "S3_S": return toNumber(record.S3_Sound);
    case "S4_S": return toNumber(record.S4_Sound);
    case "CO2": return toNumber(record.S5_CO2);
    case "PIR6": return toNumber(record.S6_PIR);
    case "PIR7": return toNumber(record.S7_PIR);
    default: return 0;
  }
};

export const buildSensorHourlyHeatmap = (
  records: OccupancyRecord[]
): Record<string, SensorHeatmapCell[]> => {
  if (!records || records.length === 0) return {};

  // accumulate sums per sensor per hour
  const sums = new Map<string, Map<number, { sum: number; count: number }>>();

  records.forEach((record) => {
    const ms = parseRecordTimestamp(record);
    if (!Number.isFinite(ms)) return;
    const hour = new Date(ms).getHours();

    SENSOR_COLUMNS.forEach(({ id }) => {
      const value = sensorValue(record, id);
      let perSensor = sums.get(id);
      if (!perSensor) {
        perSensor = new Map();
        sums.set(id, perSensor);
      }
      const bucket = perSensor.get(hour) ?? { sum: 0, count: 0 };
      bucket.sum += value;
      bucket.count += 1;
      perSensor.set(hour, bucket);
    });
  });

  // max average per sensor for normalization
  const averages = new Map<string, number[]>();
  SENSOR_COLUMNS.forEach(({ id }) => {
    const perSensor = sums.get(id);
    const row: number[] = [];
    for (let hour = 0; hour < 24; hour++) {
      const bucket = perSensor?.get(hour);
      row.push(bucket && bucket.count > 0 ? bucket.sum / bucket.count : 0);
    }
    averages.set(id, row);
  });

  const result: Record<string, SensorHeatmapCell[]> = {};

  SENSOR_COLUMNS.forEach(({ id, label }) => {
    const row = averages.get(id) ?? new Array(24).fill(0);
    const max = Math.max(...row, 1);
    result[id] = row.map((value, hour) => {
      const normalized = value / max;
      const intensity =
        normalized <= 0.2
          ? "Low"
          : normalized <= 0.4
          ? "Moderate"
          : normalized <= 0.6
          ? "Medium"
          : normalized <= 0.8
          ? "High"
          : "Critical";
      return {
        sensorId: id,
        sensorLabel: label,
        hour: hourLabel(hour),
        value: Number(value.toFixed(2)),
        normalized,
        intensity,
      };
    });
  });

  return result;
};
