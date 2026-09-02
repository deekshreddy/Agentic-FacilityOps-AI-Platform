import React from 'react';
import { KpiCard } from '../components/kpi/KpiCard';

const DevicesPage = () => {
  return (
    <div className="space-y-6">
      <section className="rounded-[32px] border border-white/10 bg-slate-950/60 p-6 shadow-soft backdrop-blur-xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Devices</h1>
            <p className="text-sm text-slate-400">Inventory and health status of connected devices.</p>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <KpiCard title="Total Devices" value="1,342" trend="+3%" icon={<div />} sparkline={<div />} />
        <KpiCard title="Online Devices" value="1,289" trend="+1%" icon={<div />} sparkline={<div />} />
        <KpiCard title="Offline Devices" value="53" trend="-1" icon={<div />} sparkline={<div />} />

        <div className="col-span-1 md:col-span-3 rounded-xl border border-white/5 bg-white/3 p-4">
          <h3 className="text-lg font-semibold">Recent Device Alerts</h3>
          <div className="mt-3 grid gap-3">
            <div className="rounded-md bg-white/5 p-3">Device: Temperature sensor offline (Rack 3)</div>
            <div className="rounded-md bg-white/5 p-3">Device: UPS reported battery cycle</div>
            <div className="rounded-md bg-white/5 p-3">Device: Network switch high CPU</div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default DevicesPage;
