import React from 'react';
import { useDashboardData } from '../hooks/useDashboardData';

const FacilitiesPage = () => {
  const { data, loading, error } = useDashboardData();
  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div>
      <h2 className="text-2xl font-semibold">Facilities</h2>
      <table className="mt-4 w-full table-auto">
        <thead>
          <tr className="text-left text-sm text-slate-400">
            <th>Facility</th>
            <th>Country</th>
            <th>Owner</th>
            <th>Capacity (MW)</th>
            <th>PUE</th>
          </tr>
        </thead>
        <tbody>
          {data.map((d) => (
            <tr key={d.facilityId || d.facilityName} className="border-t border-white/5">
              <td className="py-2">{d.facilityName}</td>
              <td>{d.country}</td>
              <td>{d.ownerCompany}</td>
              <td>{(d.estimatedCapacityMw ?? 0).toFixed(2)}</td>
              <td>{(d.pue ?? 0).toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default FacilitiesPage;
