import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { LineChart } from "lucide-react";
import { ForecastPoint } from "../../services/occupancyService";

interface Props {
  forecast: ForecastPoint[];
}

export const OccupancyForecast = ({ forecast }: Props) => (
  <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
    <div className="mb-5 flex items-center gap-3">
      <div className="rounded-xl bg-emerald-500/15 p-2.5">
        <LineChart className="h-5 w-5 text-emerald-400" />
      </div>
      <div>
        <h2 className="text-lg font-semibold text-white">Occupancy Forecast</h2>
        <p className="text-xs text-slate-400">
          Historical occupancy with a 4-hour moving-average projection
        </p>
      </div>
    </div>

    {forecast.length === 0 ? (
      <div className="flex h-48 items-center justify-center rounded-xl border border-slate-800/80 bg-slate-950/40 text-sm text-slate-500">
        Insufficient historical data for reliable forecasting.
      </div>
    ) : (
      <ResponsiveContainer width="100%" height={260}>
        <AreaChart data={forecast}>
          <defs>
            <linearGradient id="fcGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity={0.35} />
              <stop offset="100%" stopColor="#10b981" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
          <XAxis dataKey="label" stroke="#64748b" fontSize={10} interval={1} />
          <YAxis stroke="#64748b" fontSize={10} width={28} />
          <Tooltip
            contentStyle={{
              backgroundColor: "#0f172a",
              border: "1px solid #334155",
              borderRadius: 12,
              color: "#e2e8f0",
            }}
          />
          <Area
            type="monotone"
            dataKey="occupancy"
            name="Occupancy (actual + forecast)"
            stroke="#10b981"
            strokeWidth={2}
            fill="url(#fcGrad)"
          />
        </AreaChart>
      </ResponsiveContainer>
    )}

    <div className="mt-3 flex gap-5 text-xs text-slate-500">
      <span className="flex items-center gap-1.5">
        <span className="h-2 w-2 rounded-full bg-emerald-500" /> Historical + projected
      </span>
      <span>Model: 3-point moving average, 4-hour horizon</span>
    </div>
  </div>
);
