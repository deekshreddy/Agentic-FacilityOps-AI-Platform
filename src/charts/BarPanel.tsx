import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

type Props = {
  data: Array<{ name: string; value: number }>;
  title: string;
  subtitle: string;
};

export const BarPanel = ({ data, title, subtitle }: Props) => {
  return (
    <div className="rounded-[32px] border border-white/10 bg-slate-950/70 p-5 shadow-soft backdrop-blur-xl">
      <div className="mb-6">
        <p className="text-sm uppercase tracking-[0.3em] text-slate-500">{title}</p>
        <p className="mt-2 text-xl font-semibold text-white">{subtitle}</p>
      </div>
      <div className="h-[320px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ left: -12, right: -12 }}>
            <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis dataKey="name" tick={{ fill: '#94A3B8', fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#94A3B8', fontSize: 12 }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ background: '#111827', border: '1px solid rgba(255,255,255,.1)' }} />
            <Bar dataKey="value" fill="#3B82F6" radius={[12, 12, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
