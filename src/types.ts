export type FacilityRecord = {
  // Data Center Sustainability fields (mapped from CSV)
  year?: string | number;
  facilityId?: string;
  facilityName?: string;
  ownerCompany?: string;
  city?: string;
  country?: string;
  facilityType?: string;
  estimatedCapacityMw?: number;
  pue?: number;
  coolingSystemType?: string;
  wueLPerKwh?: number;
  dailyElectricityUsageMwh?: number;
  dailyWaterUsageGallons?: number;
  surroundingWaterStressTier?: string;
  // backwards-compat: keep some generic fields as optional
  timestamp?: string;
  building?: string;
  floor?: string;
  room?: string;
  deviceId?: string;
  energyUsage?: number;
  energyCost?: number;
  maintenanceCost?: number;
  waterCost?: number;
  otherCost?: number;
};

export type MachineRecord = {
  productId?: string;
  machineType?: string;
  airTemp?: number;
  processTemp?: number;
  speed?: number;
  torque?: number;
  toolWear?: number;
  targetReal?: number;
  target?: number | string;
  observedFailure?: boolean;
  healthScore?: number;
  healthStatus?: 'Healthy' | 'Warning' | 'Critical';
  predictedRisk?: number;
  riskLevel?: 'Healthy' | 'Warning' | 'Critical' | 'High' | 'Medium' | 'Low';
};

export type MaintenanceAlert = {
  machineId: string;
  alertType: string;
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  reason: string;
  currentValue: string;
  recommendedAction: string;
};

export type MaintenanceScheduleItem = {
  machineId: string;
  currentHealth: number;
  riskLevel: 'Healthy' | 'Warning' | 'Critical' | 'High' | 'Medium' | 'Low';
  recommendedMaintenance: string;
  priority: 'Critical' | 'High' | 'Medium' | 'Low';
};
