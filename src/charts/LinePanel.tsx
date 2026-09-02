import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

type Props = {
  data: Array<{ timestamp: string; actual: number; predicted?: number }>;
  title: string;
  subtitle: string;
};

export const LinePanel = ({ data, title, subtitle }: Props) => {
  return (
    <div className="rounded-[32px] border border-white/10 bg-slate-950/70 p-5 shadow-soft backdrop-blur-xl">
      <div className="flex items-center justify-between gap-4 mb-6">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-slate-500">{title}</p>
          <p className="mt-2 text-xl font-semibold text-white">{subtitle}</p>
        </div>
        <div className="rounded-3xl bg-white/5 px-4 py-2 text-sm text-slate-300">This Week</div>
      </div>
      <div className="h-[320px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
            <XAxis dataKey="timestamp" tick={{ fill: '#94A3B8', fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#94A3B8', fontSize: 12 }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ background: '#111827', border: '1px solid rgba(255,255,255,.1)' }} cursor={{ stroke: '#3B82F6', strokeWidth: 2 }} />
            <Line type="monotone" dataKey="actual" stroke="#3B82F6" strokeWidth={3} dot={false} />
            <Line type="monotone" dataKey="predicted" stroke="#8B5CF6" strokeWidth={3} strokeDasharray="6 6" dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
