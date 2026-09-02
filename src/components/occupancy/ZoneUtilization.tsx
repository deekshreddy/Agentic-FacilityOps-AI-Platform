import { LayoutGrid } from "lucide-react";
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

export const ZoneUtilization = ({ zones }: Props) => {
  if (zones.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
        <h3 className="text-sm font-semibold text-white">Zone Utilization</h3>
        <p className="mt-6 text-sm text-slate-500">No zone data available.</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur">
      <div className="mb-4 flex items-center gap-2">
        <LayoutGrid className="h-4 w-4 text-blue-400" />
        <h3 className="text-sm font-semibold text-white">Zone Utilization</h3>
      </div>

      <div className="space-y-3">
        {zones.map((zone) => (
          <div
            key={zone.zoneId}
            className="rounded-xl border border-slate-800 bg-slate-950/40 p-3 transition-colors hover:border-slate-700"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-sm font-semibold text-white">
                  {zone.zoneName}
                  <span className="ml-2 text-[10px] font-medium uppercase tracking-wider text-slate-500">
                    {zone.floor}
                  </span>
                </p>
                <p className="text-xs text-slate-400">
                  {zone.occupancy} / {zone.capacity} occupants · peak{" "}
                  {zone.peakOccupancy} @ {zone.peakHour}
                </p>
              </div>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${STATUS_BADGE[zone.status]}`}
              >
                {zone.status} · {zone.utilization}%
              </span>
            </div>

            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-800">
              <div
                className={`h-full rounded-full transition-all ${BAR_COLOR[zone.status]}`}
                style={{ width: `${Math.min(100, zone.utilization)}%` }}
              />
            </div>

            <p className="mt-2 text-xs text-slate-400">
              <span className="font-medium text-slate-300">AI:</span>{" "}
              {zone.recommendation}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};
