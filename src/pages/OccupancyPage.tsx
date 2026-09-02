import { useMemo, useState } from "react";
import {
  Users,
  RefreshCw,
  Plus,
  Bot,
  Building2,
  Layers,
} from "lucide-react";

import { useOccupancyData } from "../hooks/useOccupancyData";
import { OccupancyKPICards } from "../components/occupancy/OccupancyKPICards";
import { OccupancyInsightCard } from "../components/occupancy/OccupancyInsightCard";
import { OccupancyTrendChart } from "../components/occupancy/OccupancyTrendChart";
import { OccupancyHeatmap } from "../components/occupancy/OccupancyHeatmap";
import { ZoneUtilization } from "../components/occupancy/ZoneUtilization";
import { ZoneRanking } from "../components/occupancy/ZoneRanking";
import { UnderutilizedSpaces } from "../components/occupancy/UnderutilizedSpaces";
import { StatusDistribution } from "../components/occupancy/StatusDistribution";
import { OvercrowdingAnalysis } from "../components/occupancy/OvercrowdingAnalysis";
import { PeakOccupancy } from "../components/occupancy/PeakOccupancy";
import { OccupancyRecommendations } from "../components/occupancy/OccupancyRecommendations";
import { SensorAnalytics } from "../components/occupancy/SensorAnalytics";
import { OccupancyForecast } from "../components/occupancy/OccupancyForecast";

import {
  getPeakOccupancy,
  generateOccupancyRecommendations,
} from "../services/occupancyService";

import {
  OCCUPANCY_FLOORS,
  OCCUPANCY_ZONES,
  ALL_ZONES_ID,
  ALL_FLOORS_ID,
  FACILITY_CAPACITY,
} from "../config/occupancyThresholds";

/* ============================================================
   PAGE
============================================================ */

const OccupancyPage = () => {
  const {
    records,
    filteredRecords,
    loading,
    error,
    filters,
    setFilters,
    reload,
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
  } = useOccupancyData();

  const [runningAgent, setRunningAgent] = useState(false);

  /* derived analytics — computed from the loaded dataset */
  const recommendations = useMemo(
    () => generateOccupancyRecommendations(filteredRecords),
    [filteredRecords]
  );

  /* zone filters applied to zone cards */
  const filteredZones = useMemo(() => {
    let list = zones;
    if (filters.floor !== ALL_FLOORS_ID) {
      const floor = OCCUPANCY_FLOORS.find((f) => f.id === filters.floor);
      list = list.filter((z) => floor?.zones.includes(z.zoneId));
    }
    if (filters.zone !== ALL_ZONES_ID) {
      list = list.filter((z) => z.zoneId === filters.zone);
    }
    if (filters.status !== "All") {
      list = list.filter((z) => z.status === filters.status);
    }
    return list;
  }, [zones, filters.floor, filters.zone, filters.status]);

  const runSpaceAgent = () => {
    setRunningAgent(true);
    setTimeout(() => setRunningAgent(false), 1200);
  };

  const selectClass =
    "rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-200 outline-none focus:border-blue-500";

  /* ============================================================
     LOADING / ERROR
  ============================================================ */

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-white">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-400" />
          <p className="text-sm text-slate-400">Loading occupancy dataset…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-6">
        <h1 className="text-2xl font-bold text-rose-300">Occupancy Dataset Error</h1>
        <p className="mt-2 text-sm text-slate-300">{error}</p>
        <button
          onClick={reload}
          className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500"
        >
          Retry
        </button>
      </div>
    );
  }

  /* ============================================================
     LAYOUT
  ============================================================ */

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-center">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-blue-500/30 bg-blue-500/10">
            <Users className="h-7 w-7 text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white md:text-3xl">
              Occupancy Analytics
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-slate-400">
              Automated space density optimization, overcrowding detection, utilization
              analysis, and occupancy forecasting.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() =>
              setFilters({ ...filters, zone: ALL_ZONES_ID, floor: ALL_FLOORS_ID })
            }
            className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm font-medium text-slate-200 hover:border-slate-500"
          >
            <Plus className="h-4 w-4" /> Add Zone
          </button>
          <button
            onClick={reload}
            className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm font-medium text-slate-200 hover:border-slate-500"
          >
            <RefreshCw className="h-4 w-4" /> Refresh
          </button>
          <button
            onClick={runSpaceAgent}
            disabled={runningAgent}
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold hover:bg-blue-500 disabled:opacity-60"
          >
            <Bot className={`h-4 w-4 ${runningAgent ? "animate-pulse" : ""}`} />
            {runningAgent ? "Agent running…" : "Run Space Agent"}
          </button>
        </div>
      </div>

      {/* FILTER BAR */}
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-800 bg-slate-900/50 p-4">
        <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
          <Layers className="h-4 w-4" /> Filters
        </span>

        <select
          value={filters.floor}
          onChange={(e) =>
            setFilters({ ...filters, floor: e.target.value, zone: ALL_ZONES_ID })
          }
          className={selectClass}
        >
          <option value={ALL_FLOORS_ID}>All Floors</option>
          {OCCUPANCY_FLOORS.map((f) => (
            <option key={f.id} value={f.id}>
              {f.name}
            </option>
          ))}
        </select>

        <select
          value={filters.zone}
          onChange={(e) => setFilters({ ...filters, zone: e.target.value })}
          className={selectClass}
        >
          <option value={ALL_ZONES_ID}>All Zones</option>
          {OCCUPANCY_ZONES.map((z) => (
            <option key={z.id} value={z.id}>
              {z.name} · {z.floor}
            </option>
          ))}
        </select>

        <select
          value={filters.status}
          onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          className={selectClass}
        >
          {["All", "Low", "Medium", "High", "Critical"].map((s) => (
            <option key={s} value={s}>
              Status: {s}
            </option>
          ))}
        </select>

        <select
          value={filters.dateRangeDays ?? ""}
          onChange={(e) =>
            setFilters({
              ...filters,
              dateRangeDays:
                e.target.value === "" ? null : Number(e.target.value),
            })
          }
          className={selectClass}
        >
          <option value="">All Dates</option>
          <option value="7">Last 7 Days</option>
          <option value="14">Last 14 Days</option>
        </select>

        <span className="ml-auto text-xs text-slate-500">
          {filteredRecords.length.toLocaleString()} of {records.length.toLocaleString()} records ·{" "}
          {filters.granularity} trend
        </span>
      </div>

      {/* KPI CARDS */}
      <OccupancyKPICards kpis={kpis} />

      {/* AI INSIGHT */}
      <OccupancyInsightCard insight={insight} />

      {/* ENVIRONMENTAL CONDITIONS */}
      <SensorAnalytics sensors={sensors} />

      {/* TREND + OVERCROWDING */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <OccupancyTrendChart
            trend={trend}
            forecast={forecast}
            filters={filters}
            onFiltersChange={setFilters}
          />
        </div>
        <OvercrowdingAnalysis alerts={overcrowding} zones={zones} />
      </div>

      {/* HEATMAP */}
      <OccupancyHeatmap matrix={heatmapMatrix} />

      {/* ZONE UTILIZATION CARDS */}
      <div>
        <div className="mb-4 flex items-center gap-3">
          <div className="rounded-xl bg-cyan-500/15 p-2.5">
            <Building2 className="h-5 w-5 text-cyan-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Zone Utilization</h2>
            <p className="text-xs text-slate-400">Latest active occupancy per monitored zone</p>
          </div>
        </div>
        {filteredZones.length === 0 ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-8 text-center text-sm text-slate-500">
            No zones match the selected filters.
          </div>
        ) : (
          <ZoneUtilization zones={filteredZones} />
        )}
      </div>

      {/* PEAK + RECOMMENDATIONS */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <PeakOccupancy
            peak={peak}
            peakPeriods={peakPeriods}
            facilityCapacity={FACILITY_CAPACITY}
          />
        </div>
        <OccupancyRecommendations recommendations={recommendations} />
      </div>

      {/* ZONE RANKING + STATUS DISTRIBUTION */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <ZoneRanking zones={filteredZones} />
        </div>
        <StatusDistribution
          distribution={statusDistribution}
          totalRecords={filteredRecords.length}
        />
      </div>

      {/* UNDERUTILIZED SPACES */}
      <UnderutilizedSpaces zones={underutilized} />

      {/* FORECAST */}
      <OccupancyForecast forecast={forecast} />

      {/* DATASET FOOTER */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5 text-xs text-slate-500">
        Source dataset:{" "}
        <span className="font-semibold text-slate-300">Occupancy_Estimation.csv</span> — true
        occupancy from <code className="text-blue-400">Room_Occupancy_Count</code>; per-zone values
        are deterministic sensor-weighted estimates (light / sound / PIR share of the true total).
        Capacities are configurable reference values.
      </div>
    </div>
  );
};

export default OccupancyPage;
