import { useCallback, useEffect, useMemo, useState } from "react";
import { loadOccupancyData } from "../services/occupancyDataService";
import {
  OccupancyRecord,
  computeOccupancyKPIs,
  buildZoneMetrics,
  buildHourlyZoneMatrix,
  detectOvercrowding,
  buildOccupancyTrend,
  forecastOccupancy,
  getPeakOccupancy,
  calculateStatusDistribution,
  calculatePeakPeriods,
  getUnderutilizedZones,
  generateSpaceInsight,
  analyzeSensorConditions,
  sortRecordsChronologically,
  TrendGranularity,
} from "../services/occupancyService";
import {
  FACILITY_CAPACITY,
  getUtilizationStatus,
  ALL_ZONES_ID,
  ALL_FLOORS_ID,
} from "../config/occupancyThresholds";

export interface OccupancyFilters {
  granularity: TrendGranularity;
  zone: string;
  floor: string;
  /** number of days back from the dataset's latest date; null = all */
  dateRangeDays: number | null;
  status: string;
}

export const useOccupancyData = () => {
  const [records, setRecords] = useState<OccupancyRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<OccupancyFilters>({
    granularity: "hourly",
    zone: ALL_ZONES_ID,
    floor: ALL_FLOORS_ID,
    dateRangeDays: null,
    status: "All",
  });

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = sortRecordsChronologically(await loadOccupancyData());
      setRecords(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load occupancy dataset."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  /* ------- single filtered dataset used by ALL analytics ------- */
  const filteredRecords = useMemo(() => {
    if (!records.length) return records;

    let out = records;

    // date range: N days back from the dataset's latest timestamp
    if (filters.dateRangeDays !== null) {
      const toTime = (r: OccupancyRecord) => {
        const ms = new Date(
          `${String(r.Date ?? "").replace(/\//g, "-")}T${String(r.Time ?? "")}`
        ).getTime();
        return Number.isFinite(ms) ? ms : NaN;
      };
      const times = records.map(toTime).filter((t) => Number.isFinite(t));
      if (times.length > 0) {
        const cutoff = Math.max(...times) - filters.dateRangeDays * 86400000;
        out = out.filter((r) => {
          const t = toTime(r);
          return Number.isFinite(t) && t >= cutoff;
        });
      }
    }

    // status filter — record-level facility utilization via shared classifier
    if (filters.status !== "All") {
      out = out.filter((r) => {
        const occ = Number(r.Room_Occupancy_Count) || 0;
        const util =
          FACILITY_CAPACITY > 0 ? (occ / FACILITY_CAPACITY) * 100 : 0;
        return getUtilizationStatus(util) === filters.status;
      });
    }

    return out;
  }, [records, filters.dateRangeDays, filters.status]);

  /* derived analytics — always computed from the same filtered records */
  const kpis = computeOccupancyKPIs(filteredRecords);
  const zones = buildZoneMetrics(filteredRecords);
  const heatmapMatrix = buildHourlyZoneMatrix(filteredRecords);
  const overcrowding = detectOvercrowding(filteredRecords);
  const trend = buildOccupancyTrend(
    filteredRecords,
    filters.granularity,
    filters.zone,
    filters.floor
  );
  const forecast = forecastOccupancy(filteredRecords);
  const peak = getPeakOccupancy(filteredRecords);
  const statusDistribution = calculateStatusDistribution(filteredRecords);
  const peakPeriods = calculatePeakPeriods(filteredRecords);
  const underutilized = getUnderutilizedZones(filteredRecords);
  const insight = generateSpaceInsight(filteredRecords);
  const sensors = analyzeSensorConditions(filteredRecords);

  return {
    records,
    filteredRecords,
    loading,
    error,
    filters,
    setFilters,
    reload: load,
    kpis,
    zones,
    heatmapMatrix,
    overcrowding,
    trend,
    forecast,
    peak,
    statusDistribution,
    peakPeriods,
    underutilized,
    insight,
    sensors,
  };
};
