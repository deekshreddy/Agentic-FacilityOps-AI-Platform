import { LucideIcon } from "lucide-react";

interface Props {
  icon: LucideIcon;
  label: string;
  value: string | number;
  sub?: string;
  accent?: string;
}

export const SecurityKpiCard = ({
  icon: Icon,
  label,
  value,
  sub,
  accent = "text-cyan-400",
}: Props) => (
  <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 backdrop-blur">
    <div className="flex items-center justify-between">
      <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">
        {label}
      </span>
      <Icon className={`h-4 w-4 ${accent}`} />
    </div>
    <p className="mt-2 text-2xl font-bold text-white">{value}</p>
    {sub && <p className="mt-0.5 text-[11px] text-slate-500">{sub}</p>}
  </div>
);
