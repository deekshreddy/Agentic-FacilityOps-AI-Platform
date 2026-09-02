import React from 'react';
import { useDashboardData } from '../hooks/useDashboardData';
import * as dc from '../services/dataCenterService';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';

const FacilityAnalyticsPage = () => {
  const { data, loading, error } = useDashboardData();
  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;

  const typeDist = dc.distributionByField(data, 'facilityType');
  const countryDist = dc.distributionByField(data, 'country');
  const cityDist = dc.distributionByField(data, 'city');

  return (
    <div>
      <h2 className="text-2xl font-semibold">Facility Analytics</h2>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3 mt-4">
        <div className="rounded-md bg-slate-900 p-4">
          <h3 className="font-semibold">Facility Types</h3>
          <div style={{ width: '100%', height: 220 }} className="mt-2">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={typeDist} dataKey="value" nameKey="name" outerRadius={80}>
                  {typeDist.map((entry, idx) => (
                    <Cell key={`cell-${idx}`} fill={['#60a5fa', '#34d399', '#f472b6', '#f59e0b', '#a78bfa'][idx % 5]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="rounded-md bg-slate-900 p-4">
          <h3 className="font-semibold">Countries</h3>
          <div style={{ width: '100%', height: 220 }} className="mt-2">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={countryDist} dataKey="value" nameKey="name" outerRadius={80}>
                  {countryDist.map((entry, idx) => (
                    <Cell key={`cell-country-${idx}`} fill={['#60a5fa', '#34d399', '#f472b6', '#f59e0b', '#a78bfa'][idx % 5]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="rounded-md bg-slate-900 p-4">
          <h3 className="font-semibold">Cities</h3>
          <div style={{ width: '100%', height: 220 }} className="mt-2">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={cityDist} dataKey="value" nameKey="name" outerRadius={80}>
                  {cityDist.map((entry, idx) => (
                    <Cell key={`cell-city-${idx}`} fill={['#60a5fa', '#34d399', '#f472b6', '#f59e0b', '#a78bfa'][idx % 5]} />
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

export default FacilityAnalyticsPage;
