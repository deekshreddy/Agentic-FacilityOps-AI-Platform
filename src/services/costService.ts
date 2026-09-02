import { FacilityRecord } from '../types';
import { sumValues } from '../utils/dataUtils';

export const calculateMonthlyCost = (records: FacilityRecord[]) => {
  return sumValues(records, 'energyCost') + sumValues(records, 'maintenanceCost') + sumValues(records, 'waterCost') + sumValues(records, 'otherCost');
};

export const buildCostBreakdown = (records: FacilityRecord[]) => {
  return [
    { name: 'Energy', value: sumValues(records, 'energyCost') },
    { name: 'Maintenance', value: sumValues(records, 'maintenanceCost') },
    { name: 'Water', value: sumValues(records, 'waterCost') },
    { name: 'Other', value: sumValues(records, 'otherCost') },
  ];
};
