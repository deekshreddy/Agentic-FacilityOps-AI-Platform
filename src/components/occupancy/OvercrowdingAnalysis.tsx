import { AlertTriangle } from "lucide-react";
import { OvercrowdingAlert } from "../../services/occupancyService";
import { ZoneMetrics } from "../../services/occupancyService";

interface Props {
  alerts: OvercrowdingAlert[];
  zones: ZoneMetrics[];
}

const BADGE: Record<string, string> = {
  CRITICAL: "bg-rose-500/15 text-rose-300 border-rose-500/30",
  HIGH: "bg-orange-500/15 text-orange-300 border-orange-500/30",
  MEDIUM: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  LOW: "bg-sky-500/15 text-sky-300 border-sky-500/30",
};

export const OvercrowdingAnalysis = ({ alerts, zones }: Props) => {
  const critical = zones.filter((z) => z.status === "Critical");
  const high = zones.filter((z) => z.status === "High");
  const medium = zones.filter((z) => z.status === "Medium");
  const low = zones.filter((z) => z.status === "Low");

  const buckets = [
    { label: "Critical", zones: critical, badge: "bg-rose-500/15 text-rose-300" },
    { label: "High", zones: high, badge: "bg-orange-500/15 text-orange-300" },
    { label: "Medium", zones: medium, badge: "bg-blue-500/15 text-blue-300" },
    { label: "Low", zones: low, badge: "bg-emerald-500/15 text-emerald-300" },
  ];

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
      <div className="mb-5 flex items-center gap-3">
        <div className="rounded-xl bg-rose-500/15 p-2.5">
          <AlertTriangle className="h-5 w-5 text-rose-400" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-white">Overcrowding Analysis</h2>
          <p className="text-xs text-slate-400">Zones classified by occupancy / capacity — Low 0–39% · Medium 40–69% · High 70–89% · Critical 90%+</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {buckets.map((b) => (
          <div key={b.label} className="rounded-xl border border-slate-800/80 bg-slate-950/40 p-4">
            <div className="flex items-center justify-between">
              <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${b.badge}`}>
                {b.label}
              </span>
              <span className="text-2xl font-bold text-white">{b.zones.length}</span>
            </div>
            <div className="mt-3 space-y-1">
              {b.zones.length === 0 ? (
                <p className="text-xs text-slate-600">No zones</p>
              ) : (
                b.zones.slice(0, 4).map((z) => (
                  <p key={z.zoneId} className="truncate text-xs text-slate-400">
                    {z.zoneName} · {z.utilization}%
                  </p>
                ))
              )}
            </div>
          </div>
        ))}
      </div>

      {alerts.length > 0 && (
        <div className="mt-5 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Active overcrowding alerts ({alerts.length})
          </p>
          {alerts.slice(0, 4).map((a) => (
            <div
              key={a.id}
              className={`flex items-center justify-between rounded-xl border p-3 text-xs ${BADGE[a.severity]}`}
            >
              <span>{a.message}</span>
              <span className="ml-4 shrink-0 opacity-80">{a.timestamp}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
