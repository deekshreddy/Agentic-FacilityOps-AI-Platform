import { Trophy } from "lucide-react";
import { ZoneMetrics } from "../../services/occupancyService";
import { UtilizationStatus } from "../../config/occupancyThresholds";

interface Props {
  zones: ZoneMetrics[];
}

const STATUS_BADGE: Record<UtilizationStatus, string> = {
  Low: "bg-emerald-500/15 text-emerald-300",
  Medium: "bg-blue-500/20 text-blue-300",
  High: "bg-amber-500/25 text-amber-300",
  Critical: "bg-rose-500/30 text-rose-300",
};

const BAR_COLOR: Record<UtilizationStatus, string> = {
  Low: "bg-emerald-500",
  Medium: "bg-blue-500",
  High: "bg-amber-500",
  Critical: "bg-rose-500",
};

const RANK_STYLE = [
  "bg-amber-500/20 text-amber-300",
  "bg-slate-500/20 text-slate-300",
  "bg-orange-500/15 text-orange-300",
];

export const ZoneRanking = ({ zones }: Props) => {
  const ranked = [...zones].sort((a, b) => b.avgUtilization - a.avgUtilization);

  if (ranked.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 text-sm text-slate-500">
        No occupancy records available for the selected filters.
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur">
      <div className="mb-4 flex items-center gap-2">
        <Trophy className="h-4 w-4 text-violet-400" />
        <h3 className="text-sm font-semibold text-white">
          Zone Utilization Ranking
        </h3>
        <span className="text-[10px] uppercase tracking-wider text-slate-500">
          sorted by average utilization
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-xs">
          <thead>
            <tr className="border-b border-slate-800 text-[10px] uppercase tracking-wider text-slate-500">
              <th className="pb-2 pr-3 font-medium">Rank</th>
              <th className="pb-2 pr-3 font-medium">Zone</th>
              <th className="pb-2 pr-3 font-medium">Floor</th>
              <th className="pb-2 pr-3 text-right font-medium">Avg Occupancy</th>
              <th className="pb-2 pr-3 text-right font-medium">Peak</th>
              <th className="pb-2 pr-3 text-right font-medium">Capacity</th>
              <th className="pb-2 pr-3 font-medium">Utilization</th>
              <th className="pb-2 pr-3 font-medium">Status</th>
              <th className="pb-2 text-right font-medium">Available</th>
            </tr>
          </thead>
          <tbody>
            {ranked.map((zone, index) => (
              <tr
                key={zone.zoneId}
                className="border-b border-slate-800/50 last:border-0 hover:bg-slate-800/30"
              >
                <td className="py-2.5 pr-3">
                  <span
                    className={`inline-flex h-6 w-6 items-center justify-center rounded-lg text-[11px] font-bold ${RANK_STYLE[index] ?? "bg-slate-800/60 text-slate-400"
                      }`}
                  >
                    {index + 1}
                  </span>
                </td>
                <td className="py-2.5 pr-3 font-semibold text-white">
                  {zone.zoneName}
                </td>
                <td className="py-2.5 pr-3 text-slate-400">{zone.floor}</td>
                <td className="py-2.5 pr-3 text-right text-slate-300">
                  {zone.avgOccupancy}
                </td>
                <td className="py-2.5 pr-3 text-right text-slate-300">
                  {zone.peakOccupancy}
                </td>
                <td className="py-2.5 pr-3 text-right text-slate-400">
                  {zone.capacity}
                </td>
                <td className="py-2.5 pr-3">
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-20 overflow-hidden rounded-full bg-slate-800">
                      <div
                        className={`h-full rounded-full ${BAR_COLOR[zone.status]}`}
                        style={{
                          width: `${Math.min(100, zone.avgUtilization)}%`,
                        }}
                      />
                    </div>
                    <span className="font-semibold text-slate-200">
                      {zone.avgUtilization}%
                    </span>
                  </div>
                </td>
                <td className="py-2.5 pr-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${STATUS_BADGE[zone.status]}`}
                  >
                    {zone.status}
                  </span>
                </td>
                <td className="py-2.5 text-right font-medium text-emerald-300">
                  {Math.max(0, zone.capacity - zone.avgOccupancy).toFixed(1)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
