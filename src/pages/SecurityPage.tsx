import { RefreshCw } from "lucide-react";
import { useSecurityData } from "../hooks/useSecurityData";
import { SecurityRiskPanel } from "../components/occupancy/SecurityRiskPanel";
import { SecurityIncidentFeed } from "../components/occupancy/SecurityIncidentFeed";

const SecurityPage = () => {
  const { records, loading, error, report, reload } = useSecurityData();

  return (
    <div className="min-h-screen bg-slate-950 p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">
              Security Monitoring
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              Agent-driven threat detection across {records.length.toLocaleString()}{" "}
              sessions
            </p>
          </div>
          <button
            onClick={reload}
            disabled={loading}
            className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-sm text-slate-300 transition-colors hover:border-cyan-500/50 hover:text-white disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

        {error && (
          <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-300">
            {error}
          </div>
        )}

        {report && !loading && (
          <div className="rounded-2xl border border-slate-800 bg-gradient-to-r from-slate-900 via-slate-900/80 to-slate-900/40 p-5">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-cyan-500" />
              </span>
              <span className="text-xs font-semibold uppercase tracking-widest text-cyan-400">
                Security Agent
              </span>
            </div>
            <p className="mt-2 text-sm text-slate-300">{report.summary}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {report.recommendations.map((rec) => (
                <span
                  key={rec}
                  className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-[11px] text-amber-300"
                >
                  {rec}
                </span>
              ))}
            </div>
          </div>
        )}

        <SecurityRiskPanel report={report} loading={loading} />

        <SecurityIncidentFeed incidents={report?.topIncidents ?? []} loading={loading} />
      </div>
    </div>
  );
};

export default SecurityPage;
