import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';

type Props = {
  data: Array<{ name: string; value: number }>;
  colors: string[];
  centerLabel: string;
  subtitle?: string;
};

export const DonutChart = ({ data, colors, centerLabel, subtitle }: Props) => {
  return (
    <div className="rounded-[32px] border border-white/10 bg-slate-950/70 p-5 shadow-soft backdrop-blur-xl">
      <div className="mb-5 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Distribution</p>
          <p className="mt-2 text-xl font-semibold text-white">{subtitle}</p>
        </div>
        <div className="rounded-3xl bg-white/5 px-4 py-2 text-sm text-slate-300">This Month</div>
      </div>
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" innerRadius={72} outerRadius={110} paddingAngle={4}>
              {data.map((entry, index) => (
                <Cell key={entry.name} fill={colors[index % colors.length]} />
              ))}
            </Pie>
            <Tooltip contentStyle={{ background: '#111827', border: '1px solid rgba(255,255,255,.1)' }} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-4 text-center text-sm text-slate-400">{centerLabel}</div>
    </div>
  );
};
