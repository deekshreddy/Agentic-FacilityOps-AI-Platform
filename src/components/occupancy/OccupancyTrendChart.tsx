import { useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import { TrendingUp } from "lucide-react";
import { TrendPoint, ForecastPoint, TrendGranularity } from "../../services/occupancyService";
import {
  OCCUPANCY_ZONES,
  OCCUPANCY_FLOORS,
  ALL_ZONES_ID,
  ALL_FLOORS_ID,
  getOccupancyStatus,
  FACILITY_CAPACITY,
} from "../../config/occupancyThresholds";
import { OccupancyFilters } from "../../hooks/useOccupancyData";

/* custom tooltip: Date/Time · Occupancy · Utilization · Status */
const TrendTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload || payload.length === 0) return null;
  const point = payload.find((p: any) => p.dataKey === "occupancy" || p.dataKey === "actual");
  const occupancy = point?.value ?? 0;
  const utilization =
    FACILITY_CAPACITY > 0
      ? Number(((occupancy / FACILITY_CAPACITY) * 100).toFixed(1))
      : 0;
  const status = getOccupancyStatus(utilization);
  const isForecast = payload.some((p: any) => p.dataKey === "forecast");

  return (
    <div className="rounded-xl border border-slate-700 bg-slate-950/95 px-3 py-2 text-xs shadow-xl">
      <p className="font-semibold text-white">{label}</p>
      <div className="mt-1 space-y-0.5 text-slate-300">
        <p>
          Occupancy: <span className="font-semibold text-white">{occupancy}</span>
        </p>
        <p>
          Utilization: <span className="font-semibold text-white">{utilization}%</span>
        </p>
        <p>
          Status:{" "}
          <span className={`font-semibold ${
            status.level === "Critical"
              ? "text-rose-400"
              : status.level === "High"
              ? "text-amber-400"
              : status.level === "Medium"
              ? "text-blue-300"
              : "text-emerald-400"
          }`}>
            {status.level}
          </span>
        </p>
        {isForecast && <p className="text-violet-300">Forecast point</p>}
      </div>
    </div>
  );
};

interface Props {
  trend: TrendPoint[];
  forecast: ForecastPoint[];
  filters: OccupancyFilters;
  onFiltersChange: (filters: OccupancyFilters) => void;
}

const selectClass =
  "rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1.5 text-xs text-slate-200 outline-none focus:border-blue-500";

export const OccupancyTrendChart = ({
  trend,
  forecast,
  filters,
  onFiltersChange,
}: Props) => {
  const forecastData = useMemo(() => {
    const base = trend.map((p) => ({
      label: p.label,
      actual: p.occupancy,
      forecast: null as number | null,
    }));
    const tail = forecast
      .filter((f) => f.type === "forecast")
      .map((f) => ({
        label: f.label,
        actual: null as number | null,
        forecast: f.occupancy,
      }));
    return [...base, ...tail];
  }, [trend, forecast]);

  const showForecast = filters.granularity === "hourly";

  const stats = useMemo(() => {
    if (trend.length === 0) return null;
    const avg = trend.reduce((s, p) => s + p.occupancy, 0) / trend.length;
    const peakPoint = trend.reduce((best, p) =>
      p.occupancy > best.occupancy ? p : best
    );
    return {
      average: Number(avg.toFixed(2)),
      averageLine: Number(avg.toFixed(2)),
      peak: peakPoint.occupancy,
      peakLabel: peakPoint.label,
    };
  }, [trend]);

  const chartData = useMemo(() => {
    if (!stats) return [];
    return trend.map((p) => ({
      ...p,
      average: stats.averageLine,
    }));
  }, [trend, stats]);

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-blue-400" />
          <h3 className="text-sm font-semibold text-white">
            Occupancy Trend
          </h3>
          <span className="rounded-full bg-blue-500/10 px-2 py-0.5 text-[10px] font-medium text-blue-300">
            {filters.granularity.toUpperCase()}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            className={selectClass}
            value={filters.granularity}
            onChange={(e) =>
              onFiltersChange({
                ...filters,
                granularity: e.target.value as TrendGranularity,
              })
            }
          >
            <option value="hourly">Hourly</option>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
          </select>

          <select
            className={selectClass}
            value={filters.floor}
            onChange={(e) =>
              onFiltersChange({
                ...filters,
                floor: e.target.value,
                zone: ALL_ZONES_ID,
              })
            }
          >
            <option value={ALL_FLOORS_ID}>All Floors</option>
            {OCCUPANCY_FLOORS.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>

          <select
            className={selectClass}
            value={filters.zone}
            onChange={(e) =>
              onFiltersChange({ ...filters, zone: e.target.value })
            }
          >
            <option value={ALL_ZONES_ID}>All Zones</option>
            {OCCUPANCY_ZONES.map((z) => (
              <option key={z.id} value={z.id}>
                {z.name} ({z.floor})
              </option>
            ))}
          </select>
        </div>
      </div>

      {trend.length === 0 ? (
        <div className="flex h-56 items-center justify-center text-sm text-slate-500">
          No occupancy data available for the selected filters.
        </div>
      ) : (
        <>
          {stats && (
            <div className="mb-3 flex flex-wrap items-center gap-4 text-xs text-slate-400">
              <span>
                Average: <span className="font-semibold text-blue-300">{stats.average}</span>
              </span>
              <span>
                Peak: <span className="font-semibold text-amber-300">{stats.peak}</span>
                {stats.peakLabel && (
                  <span className="text-slate-500"> @ {stats.peakLabel}</span>
                )}
              </span>
            </div>
          )}
          {showForecast ? (
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={forecastData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="label" stroke="#64748b" fontSize={11} />
            <YAxis stroke="#64748b" fontSize={11} />
            <Tooltip content={<TrendTooltip />} />
            <Line
              type="monotone"
              dataKey="actual"
              name="Actual occupancy"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={false}
              connectNulls={false}
            />
            <Line
              type="monotone"
              dataKey="forecast"
              name="Forecast"
              stroke="#a78bfa"
              strokeWidth={2}
              strokeDasharray="6 4"
              dot={false}
              connectNulls
            />
            <Line
              type="monotone"
              dataKey="average"
              name="Average"
              stroke="#34d399"
              strokeWidth={1.5}
              strokeDasharray="4 4"
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="occGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.4} />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="label" stroke="#64748b" fontSize={11} />
            <YAxis stroke="#64748b" fontSize={11} />
            <Tooltip content={<TrendTooltip />} />
            <Area
              type="monotone"
              dataKey="occupancy"
              name="Occupancy"
              stroke="#3b82f6"
              strokeWidth={2}
              fill="url(#occGrad)"
            />
            <Line
              type="monotone"
              dataKey="average"
              name="Average"
              stroke="#34d399"
              strokeWidth={1.5}
              strokeDasharray="4 4"
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
        </>
      )}
    </div>
  );
};
