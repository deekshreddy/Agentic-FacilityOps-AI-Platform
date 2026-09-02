import { Brain, ArrowUpRight, ArrowDownRight, ShieldAlert } from "lucide-react";
import { AiSpaceInsight } from "../../services/occupancyService";

interface Props {
  insight: AiSpaceInsight | null;
}

const RISK_STYLE: Record<string, string> = {
  Low: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  Medium: "bg-blue-500/15 text-blue-300 border-blue-500/30",
  High: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  Critical: "bg-rose-500/15 text-rose-300 border-rose-500/30",
};

export const OccupancyInsightCard = ({ insight }: Props) => {
  if (!insight) {
    return (
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 text-slate-400">
        No occupancy data available to generate an AI insight.
      </div>
    );
  }

  const stats = [
    { label: "Current Utilization", value: `${insight.currentUtilization}%` },
    { label: "Average Utilization", value: `${insight.averageUtilization}%` },
    { label: "Peak Utilization", value: `${insight.peakUtilization}%` },
    {
      label: "Highest Zone",
      value: insight.highestZone,
      sub: `${insight.highestZoneUtilization}% avg`,
    },
    {
      label: "Lowest Zone",
      value: insight.lowestZone,
      sub: `${insight.lowestZoneUtilization}% avg`,
    },
    {
      label: "Available Capacity",
      value: `${insight.availableCapacity} of ${insight.availableCapacity + insight.latestActiveReading}`,
      sub: "configurable capacity",
    },
    { label: "Overcrowding Risk", value: insight.overcrowdingRisk },
  ];

  return (
    <div className="relative overflow-hidden rounded-2xl border border-blue-500/25 bg-gradient-to-br from-blue-950/60 via-slate-900/80 to-slate-900/60 p-6">
      <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl" />

      <div className="mb-5 flex items-center gap-3">
        <div className="rounded-xl bg-blue-500/15 p-2.5">
          <Brain className="h-5 w-5 text-blue-400" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-white">AI Space Utilization Insight</h2>
          <p className="text-xs text-slate-400">Generated from the live occupancy dataset</p>
        </div>
        <span
          className={`ml-auto rounded-full border px-3 py-1 text-xs font-semibold ${
            RISK_STYLE[insight.overcrowdingRisk]
          }`}
        >
          {insight.overcrowdingRisk} risk
        </span>
      </div>

      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4 xl:grid-cols-7">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-3">
            <p className="text-[11px] uppercase tracking-wider text-slate-500">{s.label}</p>
            <p className="mt-1 truncate text-sm font-semibold text-white">{s.value}</p>
            {s.sub && <p className="text-xs text-slate-500">{s.sub}</p>}
          </div>
        ))}
      </div>

      <div className="flex items-start gap-3 rounded-xl border border-blue-500/20 bg-blue-500/5 p-4">
        <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-blue-400" />
        <div>
          <p className="text-sm font-medium text-blue-300">AI Recommendation</p>
          <p className="mt-1 text-sm leading-relaxed text-slate-300">{insight.recommendation}</p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-4 text-xs text-slate-500">
        <span className="flex items-center gap-1">
          <ArrowUpRight className="h-3.5 w-3.5 text-emerald-400" /> Last active: {insight.latestActiveReading} occupants at {insight.latestActiveReadingTime}
        </span>
        <span className="flex items-center gap-1">
          <ArrowDownRight className="h-3.5 w-3.5 text-sky-400" /> Peak: {insight.peakOccupancy} at {insight.peakOccupancyTime}
        </span>
        <span>
          Average: {insight.averageOccupancy} occupants across {insight.totalRecords.toLocaleString()} records
        </span>
      </div>
    </div>
  );
};
