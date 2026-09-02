import { Minimize2 } from "lucide-react";
import { UnderutilizedZone } from "../../services/occupancyService";

interface Props {
  zones: UnderutilizedZone[];
}

export const UnderutilizedSpaces = ({ zones }: Props) => {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur">
      <div className="mb-4 flex items-center gap-2">
        <div className="rounded-lg bg-emerald-500/15 p-2">
          <Minimize2 className="h-4 w-4 text-emerald-400" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-white">
            Underutilized Spaces
          </h3>
          <p className="text-[11px] text-slate-500">
            Zones averaging below 40% utilization in the selected period
          </p>
        </div>
      </div>

      {zones.length === 0 ? (
        <p className="py-6 text-center text-sm text-slate-500">
          No underutilized zones — all zones average 40% utilization or above.
        </p>
      ) : (
        <div className="space-y-2.5">
          {zones.map((zone) => (
            <div
              key={zone.zoneId}
              className="rounded-xl border border-slate-800 bg-slate-950/40 p-3"
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
                    avg {zone.avgOccupancy} / {zone.capacity} occupants
                  </p>
                </div>
                <span className="text-lg font-bold text-emerald-300">
                  {zone.utilization}%
                </span>
              </div>
              <p className="mt-1.5 text-xs text-slate-400">{zone.action}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
