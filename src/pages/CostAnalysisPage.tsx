import React from 'react';
import { useDashboardData } from '../hooks/useDashboardData';
import * as dc from '../services/dataCenterService';

const CostAnalysisPage = () => {
  const { data, loading, error } = useDashboardData();
  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;

  // Estimation: assume energy cost $0.05 per kWh -> MWh to kWh multiply by 1000
  const energyMWh = dc.totalElectricityUsage(data) ?? 0;
  const energyCost = energyMWh * 1000 * 0.05;
  const waterGallons = dc.totalWaterUsage(data) ?? 0;
  const waterCost = waterGallons * 0.001; // placeholder per gallon
  const totalOperational = energyCost + waterCost;

  return (
    <div>
      <h2 className="text-2xl font-semibold">Cost Analysis</h2>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3 mt-4">
        <div className="rounded-md bg-slate-900 p-4">Estimated Energy Cost: ${energyCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
        <div className="rounded-md bg-slate-900 p-4">Estimated Water Cost: ${waterCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
        <div className="rounded-md bg-slate-900 p-4">Estimated Total Operational Cost: ${totalOperational.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
      </div>
    </div>
  );
};

export default CostAnalysisPage;
