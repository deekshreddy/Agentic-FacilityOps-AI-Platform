import React from 'react';
import { useDashboardData } from '../hooks/useDashboardData';
import { FacilityRecord } from '../types';

const ReportsPage = () => {
  const { data, loading, error } = useDashboardData();
  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;

  const exportCsv = () => {
    const headers = Object.keys(data[0] || {});
    const rows = data.map((r) => headers.map((h) => (r as any)[h] ?? '').join(','));
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'facility_export.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadFacilitySummary = (rec: FacilityRecord) => {
    const content = JSON.stringify(rec, null, 2);
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${rec.facilityId || rec.facilityName}_summary.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <h2 className="text-2xl font-semibold">Reports</h2>
      <div className="mt-4 flex gap-3">
        <button onClick={exportCsv} className="rounded bg-blue-600 px-4 py-2">Export CSV</button>
      </div>
      <div className="mt-6">
        <h3 className="font-semibold">Facilities</h3>
        <ul className="mt-2 space-y-2">
          {data.map((d) => (
            <li key={d.facilityId || d.facilityName} className="rounded bg-slate-900 p-3 flex items-center justify-between">
              <div>
                <div className="font-semibold">{d.facilityName}</div>
                <div className="text-sm text-slate-400">{d.city}, {d.country}</div>
              </div>
              <div>
                <button onClick={() => downloadFacilitySummary(d)} className="rounded bg-white/5 px-3 py-1">Download Summary</button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default ReportsPage;
