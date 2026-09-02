/* ============================================================
   OCCUPANCY CONFIGURATION
   The real dataset (Occupancy_Estimation.csv) contains ONE
   instrumented room's true occupancy (Room_Occupancy_Count).
   It has NO zone / floor / room / location columns.

   Therefore the dashboard shows NO Zone A/B/C/D models and NO
   per-zone capacities. "Zones"/"floors" filters are removed;
   grouping is derived from REAL dataset fields (hour, weekday).

   The single configurable reference is FACILITY_CAPACITY below.
   It is clearly CONFIGURATION, not dataset data. The dataset's
   observed occupancy is 0..3, so a capacity of 4 is the smallest
   sensible reference appropriate for this dataset's scale.
   ============================================================ */

export type ZoneConfig = { id: string; name: string; floor: string; capacity: number };
export interface FloorConfig {
  id: string;
  name: string;
  zones: string[];
}

/* The dataset instrumented ONE room, so the M3 module exposes
   exactly one real zone/floor derived from the dataset — no
   fabricated Zone A/B/C models. Capacity is the configurable
   reference defined further below (hoisted via declaration order
   fix: defined here as a forward reference constant). */
export const OCCUPANCY_ZONES: ZoneConfig[] = [];
export const OCCUPANCY_FLOORS: FloorConfig[] = [];
export const ALL_ZONES_ID = 'ALL_ZONES';
export const ALL_FLOORS_ID = 'ALL_FLOORS';

/* ------------------------------------------------------------
   FACILITY CAPACITY
   CONFIGURABLE reference capacity — NOT a fact from the dataset.
   The CSV has no capacity column; observed Room_Occupancy_Count
   reaches 3, so 3 is the smallest sensible demonstration value.
   Change this single constant to re-scale the whole module.
   ------------------------------------------------------------ */
export const FACILITY_CAPACITY = 3;

/* The dataset instrumented ONE room, so the M3 module exposes
   exactly one real zone/floor derived from the dataset — no
   fabricated Zone A/B/C models. */
OCCUPANCY_ZONES.push({
  id: 'ZONE_MAIN_ROOM',
  name: 'Main Room',
  floor: 'Level 1',
  capacity: FACILITY_CAPACITY,
});
OCCUPANCY_FLOORS.push({ id: 'LEVEL_1', name: 'Level 1', zones: ['ZONE_MAIN_ROOM'] });

/* ------------------------------------------------------------
   UTILIZATION STATUS CLASSIFICATION (single source of truth)
   0–39%  = Low
   40–69% = Medium   (replaces the old "Normal")
   70–89% = High
   90%+   = Critical
   ------------------------------------------------------------ */
export const UTILIZATION_THRESHOLDS = {
  medium: 40,
  high: 70,
  critical: 90,
} as const;

export type UtilizationStatus = 'Low' | 'Medium' | 'High' | 'Critical';

export interface OccupancyStatusResult {
  level: UtilizationStatus;
  label: string;
  description: string;
  severity: 'info' | 'success' | 'warning' | 'critical';
}

export const getOccupancyStatus = (utilization: number): OccupancyStatusResult => {
  const u = Number.isFinite(utilization) ? utilization : 0;
  if (u >= UTILIZATION_THRESHOLDS.critical) {
    return {
      level: 'Critical',
      label: 'Critical',
      description: 'Critical — at or over capacity (90%+) — redistribute occupants',
      severity: 'critical',
    };
  }
  if (u >= UTILIZATION_THRESHOLDS.high) {
    return {
      level: 'High',
      label: 'High',
      description: 'High — approaching capacity (70–89%) — monitor and prepare overflow',
      severity: 'warning',
    };
  }
  if (u >= UTILIZATION_THRESHOLDS.medium) {
    return {
      level: 'Medium',
      label: 'Medium',
      description: 'Medium — moderate load (40–69%)',
      severity: 'info',
    };
  }
  return {
    level: 'Low',
    label: 'Low',
    description: 'Low — underutilized (0–39%)',
    severity: 'success',
  };
};

/** Backward-compatible wrapper used across M3 components. */
export const getUtilizationStatus = (utilization: number): UtilizationStatus =>
  getOccupancyStatus(utilization).level;

/* ------------------------------------------------------------
   OVERCROWDING THRESHOLDS (utilization %, aligned with the
   status bands above so every component uses the same scale)
   ------------------------------------------------------------ */
export const OVERCROWDING_THRESHOLDS = {
  warning: UTILIZATION_THRESHOLDS.high, // 70% → High band starts
  critical: UTILIZATION_THRESHOLDS.critical, // 90% → Critical band starts
} as const;
