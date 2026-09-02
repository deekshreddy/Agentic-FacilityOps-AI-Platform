import React from 'react';
import { useDashboardData } from '../hooks/useDashboardData';
import * as dc from '../services/dataCenterService';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';

const CoolingAnalyticsPage = () => {
  const { data, loading, error } = useDashboardData();
  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;

  const coolingDist = dc.distributionByField(data, 'coolingSystemType');
  const avgPUE = dc.averagePUE(data) ?? 0;
  const avgCapacity = dc.averageCapacity(data) ?? 0;

  return (
    <div>
      <h2 className="text-2xl font-semibold">Cooling Analytics</h2>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3 mt-4">
        <div className="rounded-md bg-slate-900 p-4">Average PUE: {avgPUE.toFixed(2)}</div>
        <div className="rounded-md bg-slate-900 p-4">Average Capacity (MW): {avgCapacity.toFixed(2)}</div>
        <div className="rounded-md bg-slate-900 p-4">
          <h3 className="font-semibold">Cooling System Distribution</h3>
          <div style={{ width: '100%', height: 220 }} className="mt-2">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={coolingDist} dataKey="value" nameKey="name" outerRadius={80} fill="#8884d8">
                  {coolingDist.map((entry, idx) => (
                    <Cell key={`cell-${idx}`} fill={['#60a5fa', '#34d399', '#f472b6', '#f59e0b', '#a78bfa'][idx % 5]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CoolingAnalyticsPage;
