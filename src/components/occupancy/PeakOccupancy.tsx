import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from "recharts";
import { Clock, CalendarDays, TrendingUp, TrendingDown, Activity, Crown } from "lucide-react";
import { PeakOccupancyAnalysis, PeakPeriod } from "../../services/occupancyService";

interface Props {
  peak: PeakOccupancyAnalysis;
  peakPeriods: PeakPeriod[];
  facilityCapacity: number;
}

const stats = (peak: PeakOccupancyAnalysis, peakZone: string) => [
  { icon: TrendingUp, label: "Peak Occupancy", value: `${peak.highestOccupancy} people` },
  { icon: CalendarDays, label: "Peak Date", value: peak.peakDay },
  { icon: Clock, label: "Peak Hour", value: peak.peakHour },
  { icon: Crown, label: "Busiest Zone (at peak)", value: peakZone },
  { icon: TrendingDown, label: "Lowest", value: `${peak.lowestOccupancy} people` },
  { icon: Activity, label: "Average", value: `${peak.averageOccupancy} people` },
];

export const PeakOccupancy = ({ peak, peakPeriods, facilityCapacity }: Props) => {
  const maxHour = peak.hourProfile.reduce(
    (best, p) => (p.occupancy > best.occupancy ? p : best),
    { hour: "", occupancy: 0 }
  );

  const peakZone =
    peakPeriods.length > 0
      ? peakPeriods[0].zone !== "—"
        ? peakPeriods[0].zone
        : "—"
      : "—";

  const peakUtilization =
    facilityCapacity > 0
      ? ((peak.highestOccupancy / facilityCapacity) * 100).toFixed(1)
      : "0";

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
      <div className="mb-5 flex items-center gap-3">
        <div className="rounded-xl bg-violet-500/15 p-2.5">
          <Clock className="h-5 w-5 text-violet-400" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-white">Peak Occupancy Periods</h2>
          <p className="text-xs text-slate-400">Average occupancy per hour of day</p>
        </div>
      </div>

      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
        {stats(peak, peakZone).map((s) => (
          <div key={s.label} className="rounded-xl border border-slate-800/80 bg-slate-950/40 p-3">
            <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-slate-500">
              <s.icon className="h-3.5 w-3.5" /> {s.label}
            </div>
            <p className="mt-1 truncate text-sm font-semibold text-white">{s.value}</p>
          </div>
        ))}
      </div>

      {peak.hourProfile.length === 0 ? (
        <div className="flex h-40 items-center justify-center text-sm text-slate-500">
          No timestamped occupancy data available.
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={peak.hourProfile}>
            <XAxis dataKey="hour" stroke="#64748b" fontSize={10} interval={1} />
            <YAxis stroke="#64748b" fontSize={10} width={28} />
            <Tooltip
              cursor={{ fill: "rgba(148,163,184,0.08)" }}
              contentStyle={{
                backgroundColor: "#0f172a",
                border: "1px solid #334155",
                borderRadius: 12,
                color: "#e2e8f0",
              }}
            />
            <Bar dataKey="occupancy" name="Avg occupancy" radius={[4, 4, 0, 0]}>
              {peak.hourProfile.map((p) => (
                <Cell key={p.hour} fill={p.hour === maxHour.hour ? "#a78bfa" : "#4f46e5"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
      {peakPeriods.length > 0 && (
        <div className="mt-5">
          <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
            <Crown className="h-3.5 w-3.5 text-amber-400" /> Top {peakPeriods.length} busiest periods
          </p>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-[10px] uppercase tracking-wider text-slate-500">
                  <th className="pb-2 pr-3 font-medium">#</th>
                  <th className="pb-2 pr-3 font-medium">Date</th>
                  <th className="pb-2 pr-3 font-medium">Time</th>
                  <th className="pb-2 pr-3 text-right font-medium">Occupancy</th>
                  <th className="pb-2 pr-3 text-right font-medium">Utilization</th>
                  <th className="pb-2 pr-3 font-medium">Busiest Zone</th>
                  <th className="pb-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {peakPeriods.map((p, i) => (
                  <tr key={`${p.date}-${p.time}-${i}`} className="border-b border-slate-800/50 last:border-0">
                    <td className="py-2 pr-3 font-bold text-slate-500">{i + 1}</td>
                    <td className="py-2 pr-3 text-slate-300">{p.date}</td>
                    <td className="py-2 pr-3 text-slate-300">{p.time}</td>
                    <td className="py-2 pr-3 text-right font-semibold text-white">{p.occupancy}</td>
                    <td className="py-2 pr-3 text-right text-amber-300">{p.utilization}%</td>
                    <td className="py-2 pr-3 text-slate-300">{p.zone}</td>
                    <td className="py-2">{p.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <p className="mt-3 text-[11px] text-slate-500">
        Peak utilization: {peakUtilization}% of configured facility capacity ({facilityCapacity}).
      </p>
    </div>
  );
};
