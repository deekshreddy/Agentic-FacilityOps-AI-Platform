import { ShieldAlert, ShieldCheck } from "lucide-react";
import { SecurityAgentReport } from "../../agents/securityAgent";
import { SecurityKpiCard } from "./SecurityKpiCard";

interface Props {
  report: SecurityAgentReport | null;
  loading?: boolean;
}

export const SecurityRiskPanel = ({ report, loading }: Props) => {
  if (loading || !report) {
    return (
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="h-24 animate-pulse rounded-2xl bg-slate-800/60"
          />
        ))}
      </div>
    );
  }

  const { analysis } = report;
  const riskColor =
    analysis.riskLevel === "CRITICAL"
      ? "text-rose-400"
      : analysis.riskLevel === "HIGH"
        ? "text-orange-400"
        : analysis.riskLevel === "MEDIUM"
          ? "text-amber-400"
          : "text-emerald-400";

  return (
    <div className="space-y-4">
      {/* KPI row */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <SecurityKpiCard
          icon={ShieldAlert}
          label="Detected Attacks"
          value={analysis.detectedAttacks.toLocaleString()}
          sub={`${analysis.attackRate}% attack rate`}
          accent="text-rose-400"
        />
        <SecurityKpiCard
          icon={ShieldAlert}
          label="Suspicious Sessions"
          value={analysis.suspiciousSessions.toLocaleString()}
          sub={`${analysis.unusualTimeCount} unusual-time`}
          accent="text-amber-400"
        />
        <SecurityKpiCard
          icon={ShieldCheck}
          label="Failed Logins"
          value={analysis.failedLoginAttempts.toLocaleString()}
          sub={`avg IP reputation ${analysis.averageIpReputation}`}
          accent="text-cyan-400"
        />
        <SecurityKpiCard
          icon={ShieldCheck}
          label="Risk Level"
          value={analysis.riskLevel}
          sub={`score ${analysis.securityScore}/100`}
          accent={riskColor}
        />
      </div>

      {/* Distribution bars */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur">
        <h3 className="mb-3 text-sm font-semibold text-white">
          Threat Indicators
        </h3>
        <div className="space-y-3">
          {report.threatMix.map((item) => {
            const max = Math.max(
              ...report.threatMix.map((t) => t.value),
              1
            );
            const pct = Math.round((item.value / max) * 100);
            return (
              <div key={item.name}>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="text-slate-300">{item.name}</span>
                  <span className="font-mono text-slate-500">
                    {item.value.toLocaleString()}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-800">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-blue-500 to-rose-500 transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {analysis.protocolDistribution.map((p) => (
            <span
              key={p.name}
              className="rounded-full border border-slate-700 bg-slate-800/60 px-2.5 py-1 text-[10px] text-slate-300"
            >
              {p.name}: {p.value.toLocaleString()} sessions
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};
