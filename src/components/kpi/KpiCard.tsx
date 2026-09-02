import { motion } from 'framer-motion';
import { ReactNode } from 'react';

type Props = {
  title: string;
  value: string;
  trend: string;
  icon: ReactNode;
  sparkline: ReactNode;
  accentClass?: string;
};

export const KpiCard = ({ title, value, trend, icon, sparkline, accentClass = 'bg-blue-500/10 text-blue-200' }: Props) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className={`rounded-[32px] border border-white/10 bg-slate-950/70 p-5 shadow-soft backdrop-blur-xl ${accentClass}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-slate-500">{title}</p>
          <p className="mt-3 text-3xl font-semibold text-white">{value}</p>
        </div>
        <div className="rounded-2xl bg-white/5 p-3 text-slate-200">{icon}</div>
      </div>
      <div className="mt-6 flex items-center justify-between gap-3 text-sm text-slate-400">
        <span>{trend}</span>
        <div className="h-12 w-24">{sparkline}</div>
      </div>
    </motion.div>
  );
};
