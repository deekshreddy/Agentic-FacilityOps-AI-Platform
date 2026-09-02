import { Lightbulb, CheckCircle2 } from "lucide-react";

interface Props {
  recommendations: string[];
}

export const OccupancyRecommendations = ({ recommendations }: Props) => (
  <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
    <div className="mb-5 flex items-center gap-3">
      <div className="rounded-xl bg-amber-500/15 p-2.5">
        <Lightbulb className="h-5 w-5 text-amber-400" />
      </div>
      <div>
        <h2 className="text-lg font-semibold text-white">Space Optimization Recommendations</h2>
        <p className="text-xs text-slate-400">Derived from actual zone utilization and peak analysis</p>
      </div>
    </div>

    {recommendations.length === 0 ? (
      <p className="text-sm text-slate-500">No recommendations available for the current dataset.</p>
    ) : (
      <ul className="space-y-3">
        {recommendations.map((rec, i) => (
          <li
            key={i}
            className="flex items-start gap-3 rounded-xl border border-slate-800/80 bg-slate-950/40 p-4"
          >
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" />
            <p className="text-sm leading-relaxed text-slate-300">{rec}</p>
          </li>
        ))}
      </ul>
    )}
  </div>
);
