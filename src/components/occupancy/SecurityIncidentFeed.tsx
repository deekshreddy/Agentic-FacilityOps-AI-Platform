import { AlertOctagon } from "lucide-react";
import { SecurityIncident } from "../../services/securityService";

interface Props {
  incidents: SecurityIncident[];
  loading?: boolean;
}

const severityStyles: Record<
  SecurityIncident["severity"],
  { badge: string; dot: string }
> = {
  CRITICAL: {
    badge: "bg-rose-500/15 text-rose-300 border-rose-500/30",
    dot: "bg-rose-400",
  },
  HIGH: {
    badge: "bg-orange-500/15 text-orange-300 border-orange-500/30",
    dot: "bg-orange-400",
  },
  MEDIUM: {
    badge: "bg-amber-500/15 text-amber-300 border-amber-500/30",
    dot: "bg-amber-400",
  },
  LOW: {
    badge: "bg-slate-500/15 text-slate-300 border-slate-500/30",
    dot: "bg-slate-400",
  },
};

export const SecurityIncidentFeed = ({ incidents, loading }: Props) => {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertOctagon className="h-4 w-4 text-rose-400" />
          <h3 className="text-sm font-semibold text-white">
            Security Incident Feed
          </h3>
        </div>
        <span className="text-[10px] uppercase tracking-widest text-slate-500">
          {incidents.length} events
        </span>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="h-14 animate-pulse rounded-xl bg-slate-800/60"
            />
          ))}
        </div>
      ) : incidents.length === 0 ? (
        <div className="flex h-40 items-center justify-center text-sm text-slate-500">
          No security incidents detected in the dataset.
        </div>
      ) : (
        <div className="max-h-[420px] space-y-2 overflow-y-auto pr-1">
          {incidents.map((incident) => {
            const style = severityStyles[incident.severity];
            return (
              <div
                key={incident.id}
                className="rounded-xl border border-slate-800 bg-slate-900/80 p-3 transition-colors hover:border-slate-700"
              >
                <div className="flex items-center gap-2">
                  <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
                  <span
                    className={`rounded-full border px-2 py-0.5 text-[10px] font-bold tracking-wide ${style.badge}`}
                  >
                    {incident.severity}
                  </span>
                  <span className="text-xs font-medium text-slate-300">
                    {incident.type}
                  </span>
                  <span className="ml-auto font-mono text-[10px] text-slate-500">
                    {incident.sessionId}
                  </span>
                </div>
                <p className="mt-1.5 text-xs leading-relaxed text-slate-400">
                  {incident.message}
                </p>
                <div className="mt-1.5 flex gap-3 text-[10px] text-slate-500">
                  <span>Protocol: {incident.protocol}</span>
                  <span>Browser: {incident.browser}</span>
                  <span>IP rep: {incident.ipReputation.toFixed(2)}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
