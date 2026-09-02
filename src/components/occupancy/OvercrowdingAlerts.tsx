import { ShieldAlert } from "lucide-react";
import { OvercrowdingAlert } from "../../services/occupancyService";

interface Props {
  alerts: OvercrowdingAlert[];
}

const SEVERITY_STYLE: Record<string, string> = {
  CRITICAL: "bg-rose-500/15 text-rose-300 border-rose-500/30",
  HIGH: "bg-orange-500/15 text-orange-300 border-orange-500/30",
  MEDIUM: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  LOW: "bg-sky-500/15 text-sky-300 border-sky-500/30",
};

export const OvercrowdingAlerts = ({ alerts }: Props) => (
  <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur">
    <div className="mb-4 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <ShieldAlert className="h-4 w-4 text-amber-400" />
        <h3 className="text-sm font-semibold text-white">
          Overcrowding Detection
        </h3>
      </div>
      <span
        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${alerts.length > 0
            ? "bg-rose-500/15 text-rose-300"
            : "bg-emerald-500/15 text-emerald-300"
          }`}
      >
        {alerts.length} active alert{alerts.length === 1 ? "" : "s"}
      </span>
    </div>

    {alerts.length === 0 ? (
      <p className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3 text-xs text-emerald-300">
        All zones are operating within safe occupancy thresholds.
      </p>
    ) : (
      <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
        {alerts.map((alert) => (
          <div
            key={alert.id}
            className={`rounded-xl border p-3 ${SEVERITY_STYLE[alert.severity]}`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-bold tracking-widest">
                {alert.severity}
              </span>
              <span className="text-[10px] text-slate-400">
                {alert.timestamp}
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-200">{alert.message}</p>
          </div>
        ))}
      </div>
    )}
  </div>
);
