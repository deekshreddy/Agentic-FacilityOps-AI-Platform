import React from 'react';
import { useDashboardData } from '../hooks/useDashboardData';

const AlertsPage = () => {
  const { data, loading, error } = useDashboardData();
  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;

  const alerts: { title: string; facilityName?: string }[] = [];
  data.forEach((r) => {
    if ((r.pue ?? 0) > 1.8) alerts.push({ title: `High PUE: ${r.pue}`, facilityName: r.facilityName });
    if ((r.dailyWaterUsageGallons ?? 0) > 100000) alerts.push({ title: `High Water Usage: ${r.dailyWaterUsageGallons}`, facilityName: r.facilityName });
    if ((r.estimatedCapacityMw ?? 0) > 50) alerts.push({ title: `High Capacity: ${r.estimatedCapacityMw}`, facilityName: r.facilityName });
  });

  return (
    <div>
      <h2 className="text-2xl font-semibold">Alerts</h2>
      <ul className="mt-4 space-y-2">
        {alerts.map((a, i) => (
          <li key={i} className="rounded bg-slate-900 p-3">{a.title} {a.facilityName ? `— ${a.facilityName}` : ''}</li>
        ))}
        {alerts.length === 0 && <li className="rounded bg-slate-900 p-3">No alerts</li>}
      </ul>
    </div>
  );
};

export default AlertsPage;
