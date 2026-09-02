import React from 'react';
import { useDashboardData } from '../hooks/useDashboardData';
import * as dc from '../services/dataCenterService';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';

const SustainabilityRisksPage = () => {
  const { data, loading, error } = useDashboardData();
  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;

  const waterStress = dc.distributionByField(data, 'surroundingWaterStressTier');
  const highPUE = data.filter((r) => (r.pue ?? 0) > 1.8).map((r) => ({ facilityName: r.facilityName, pue: r.pue }));
  const highWater = data
    .slice()
    .sort((a, b) => (b.dailyWaterUsageGallons ?? 0) - (a.dailyWaterUsageGallons ?? 0))
    .slice(0, 10)
    .map((r) => ({ facilityName: r.facilityName, water: r.dailyWaterUsageGallons }));

  return (
    <div>
      <h2 className="text-2xl font-semibold">Sustainability Risks</h2>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3 mt-4">
        <div className="rounded-md bg-slate-900 p-4">
          <h3 className="font-semibold">Water Stress Tier</h3>
          <div style={{ width: '100%', height: 220 }} className="mt-2">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={waterStress} dataKey="value" nameKey="name" outerRadius={80}>
                  {waterStress.map((entry, idx) => (
                    <Cell key={`cell-ws-${idx}`} fill={['#60a5fa', '#34d399', '#f472b6', '#f59e0b', '#a78bfa'][idx % 5]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-md bg-slate-900 p-4">
          <h3 className="font-semibold">High PUE Facilities (PUE &gt; 1.8)</h3>
          <ul className="mt-2 text-sm space-y-1">
            {highPUE.map((p, i) => (
              <li key={i}>{p.facilityName} — PUE: {p.pue?.toFixed(2)}</li>
            ))}
          </ul>
        </div>

        <div className="rounded-md bg-slate-900 p-4">
          <h3 className="font-semibold">High Water Usage Facilities</h3>
          <ul className="mt-2 text-sm space-y-1">
            {highWater.map((h, i) => (
              <li key={i}>{h.facilityName} — {h.water?.toLocaleString()} gallons</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default SustainabilityRisksPage;
