/* ============================================================
   M4 — COST OPTIMIZATION SERVICE
   FacilityOps AI Platform - Milestone 4

   Loads public/data/m4_cost_data.csv dynamically and derives
   every cost / budget / savings / ROI / health / anomaly /
   forecast metric from the dataset. No hardcoded KPI values.
   ============================================================ */

import { loadOccupancyData } from './occupancyDataService';
import { OccupancyRecord, computeOccupancyKPIs } from './occupancyService';
import { loadSecurityData, SecurityRecord, analyzeSecurity } from './securityService';
import {
  MaintenanceRecord,
  getMaintenanceAlerts,
  calculateAverageMachineHealth,
} from './maintenanceService';

/* ============================================================
   TYPES
   ============================================================ */

export interface CostRecord {
  record_id: string;
  date: string;
  facility_id: string;
  facility_name: string;
  energy_cost: number;
  maintenance_cost: number;
  security_cost: number;
  occupancy_cost: number;
  vendor_cost: number;
  operational_cost: number;
  budget: number;
  savings_target: number;
  energy_savings: number;
  maintenance_savings: number;
  vendor_savings: number;
  other_savings: number;
}

export type BudgetStatus = 'UNDER BUDGET' | 'NEAR BUDGET' | 'OVER BUDGET';

export interface CostMetrics {
  totalCost: number;
  averageOperationalCost: number;
  totalBudget: number;
  budgetVariance: number;
  budgetUtilization: number;
  budgetStatus: BudgetStatus;
  totalSavingsOpportunity: number;
  projectedCostAfterSavings: number;
  projectedSavingsRoi: number;
  energyCost: number;
  maintenanceCost: number;
  securityCost: number;
  occupancyCost: number;
  vendorCost: number;
  vendorCostShare: number;
  energySavings: number;
  maintenanceSavings: number;
  vendorSavings: number;
  otherSavings: number;
  recordCount: number;
  facilityCount: number;
}

export interface CostDistributionPoint {
  name: string;
  value: number;
}

export interface MonthlyPoint {
  month: string;
  cost: number;
  budget: number;
  savings: number;
}

export interface FacilityCostComparison {
  facility_id: string;
  facility_name: string;
  total_cost: number;
  budget: number;
  savings: number;
  utilization: number;
}

export interface BudgetCompliance {
  status: BudgetStatus;
  budget: number;
  actual: number;
  variance: number;
  utilization: number;
  color: string;
}

export interface CostAnomaly {
  month: string;
  facility: string;
  actualCost: number;
  averageCost: number;
  deviationPct: number;
  severity: 'Warning' | 'Critical';
}

export interface ForecastPoint {
  label: string;
  actual: number | null;
  predicted: number | null;
  isForecast: boolean;
}

export interface CostRecommendation {
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'critical' | 'success';
}

export interface HealthContribution {
  source: string;
  score: number;
  weight: number;
  available: boolean;
  detail: string;
}

export interface FacilityHealth {
  score: number;
  classification: 'Excellent' | 'Good' | 'Moderate' | 'Poor' | 'Critical';
  contributions: HealthContribution[];
}

export interface CrossAgentSummary {
  energy: { available: boolean; label: string; value: string };
  maintenance: { available: boolean; label: string; value: string };
  occupancy: { available: boolean; label: string; value: string };
  security: { available: boolean; label: string; value: string };
}

export interface FacilityIntelligence {
  overallHealth: FacilityHealth;
  budgetStatus: BudgetCompliance;
  largestCostDriver: string;
  largestCostDriverShare: number;
  potentialSavings: number;
  projectedRoi: number;
  majorAnomaly: string;
  topRecommendation: string;
}

const MAINTENANCE_API_URL = 'http://127.0.0.1:8000/api/maintenance/';

/* ============================================================
   SAFE NUMERIC HELPERS
   ============================================================ */

export const safeNumber = (value: unknown): number => {
  if (value === null || value === undefined || value === '') return 0;
  const parsed = Number(String(value).trim().replace(/,/g, ''));
  return Number.isFinite(parsed) ? parsed : 0;
};

const round2 = (value: number): number =>
  Number.isFinite(value) ? Math.round(value * 100) / 100 : 0;

const safeDivide = (a: number, b: number): number => {
  if (!Number.isFinite(a) || !Number.isFinite(b) || b === 0) return 0;
  const result = a / b;
  return Number.isFinite(result) ? result : 0;
};

const clamp = (value: number, min: number, max: number): number => {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
};

export const formatCurrency = (value: number): string => {
  if (!Number.isFinite(value)) return '$0';
  return `$${Math.round(value).toLocaleString()}`;
};

export const formatPercent = (value: number): string => {
  if (!Number.isFinite(value)) return '0.0%';
  return `${value.toFixed(1)}%`;
};

/* ============================================================
   CSV LOADING + PARSING
   ============================================================ */

const CSV_PATH = '/data/m4_cost_data.csv';

const REQUIRED_COLUMNS = [
  'date',
  'facility_id',
  'facility_name',
  'energy_cost',
  'maintenance_cost',
  'security_cost',
  'occupancy_cost',
  'vendor_cost',
  'operational_cost',
  'budget',
  'savings_target',
  'energy_savings',
  'maintenance_savings',
  'vendor_savings',
  'other_savings',
] as const;

const parseCSVLine = (line: string): string[] => {
  const result: string[] = [];
  let current = '';
  let insideQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      insideQuotes = !insideQuotes;
      continue;
    }
    if (char === ',' && !insideQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
};

const normalizeHeader = (header: string): string =>
  header.replace(/^\uFEFF/, '').replace(/^"|"$/g, '').trim().toLowerCase();

const looksLikeHtml = (text: string): boolean => {
  const head = text.trim().slice(0, 200).toLowerCase();
  return head.startsWith('<!doctype') || head.startsWith('<html');
};

const parseCostCsv = (text: string): CostRecord[] => {
  if (!text || !text.trim()) {
    throw new Error('M4 cost CSV is empty.');
  }
  if (looksLikeHtml(text)) {
    throw new Error(
      'M4 dataset could not be loaded. Verify that public/data/m4_cost_data.csv exists.'
    );
  }

  const lines = text.replace(/\r/g, '').split('\n').filter((l) => l.trim() !== '');
  if (lines.length < 2) {
    throw new Error('M4 cost CSV contains no data rows.');
  }

  const headers = parseCSVLine(lines[0]).map(normalizeHeader);

  const missing = REQUIRED_COLUMNS.filter((col) => !headers.includes(col));
  if (missing.length > 0) {
    throw new Error(`M4 cost CSV is missing required columns: ${missing.join(', ')}`);
  }

  const records: CostRecord[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    const raw: Record<string, string> = {};
    let hasData = false;

    headers.forEach((header, idx) => {
      const value = values[idx] ?? '';
      if (value !== '') hasData = true;
      raw[header] = value.replace(/^"|"$/g, '').trim();
    });

    if (!hasData) continue;

    const record: CostRecord = {
      record_id: raw['record_id'] ?? `R${i}`,
      date: raw['date'] ?? '',
      facility_id: raw['facility_id'] ?? '',
      facility_name: raw['facility_name'] ?? 'Unknown',
      energy_cost: safeNumber(raw['energy_cost']),
      maintenance_cost: safeNumber(raw['maintenance_cost']),
      security_cost: safeNumber(raw['security_cost']),
      occupancy_cost: safeNumber(raw['occupancy_cost']),
      vendor_cost: safeNumber(raw['vendor_cost']),
      operational_cost: safeNumber(raw['operational_cost']),
      budget: safeNumber(raw['budget']),
      savings_target: safeNumber(raw['savings_target']),
      energy_savings: safeNumber(raw['energy_savings']),
      maintenance_savings: safeNumber(raw['maintenance_savings']),
      vendor_savings: safeNumber(raw['vendor_savings']),
      other_savings: safeNumber(raw['other_savings']),
    };

    // Validate operational_cost against component costs; use dataset value as
    // authoritative. If it is 0/missing, derive it from the components.
    const componentSum =
      record.energy_cost +
      record.maintenance_cost +
      record.security_cost +
      record.occupancy_cost +
      record.vendor_cost;

    if (record.operational_cost <= 0 && componentSum > 0) {
      record.operational_cost = componentSum;
    }

    if (record.operational_cost > 0 || componentSum > 0) {
      records.push(record);
    }
  }

  if (records.length === 0) {
    throw new Error('No valid M4 cost records were found.');
  }

  return records;
};

export const loadCostData = async (): Promise<CostRecord[]> => {
  const response = await fetch(CSV_PATH, { cache: 'no-store' });
  if (!response.ok) {
    throw new Error(
      `M4 dataset could not be loaded (HTTP ${response.status}). Verify that public/data/m4_cost_data.csv exists.`
    );
  }
  const text = await response.text();
  const records = parseCostCsv(text);
  console.log(`costOptimizationService: Loaded ${records.length} M4 records`);
  return records;
};

/* ============================================================
   CORE METRICS
   ============================================================ */

export const getTotalOperationalCost = (records: CostRecord[]): number =>
  records.reduce((sum, r) => sum + r.operational_cost, 0);

export const getAverageOperationalCost = (records: CostRecord[]): number =>
  records.length > 0 ? getTotalOperationalCost(records) / records.length : 0;

export const getTotalBudget = (records: CostRecord[]): number =>
  records.reduce((sum, r) => sum + r.budget, 0);

export const getBudgetUtilization = (records: CostRecord[]): number =>
  safeDivide(getTotalOperationalCost(records), getTotalBudget(records)) * 100;

export const getBudgetVariance = (records: CostRecord[]): number =>
  getTotalBudget(records) - getTotalOperationalCost(records);

export const getEnergyCost = (records: CostRecord[]): number =>
  records.reduce((sum, r) => sum + r.energy_cost, 0);

export const getMaintenanceCost = (records: CostRecord[]): number =>
  records.reduce((sum, r) => sum + r.maintenance_cost, 0);

export const getSecurityCost = (records: CostRecord[]): number =>
  records.reduce((sum, r) => sum + r.security_cost, 0);

export const getOccupancyCost = (records: CostRecord[]): number =>
  records.reduce((sum, r) => sum + r.occupancy_cost, 0);

export const getVendorCost = (records: CostRecord[]): number =>
  records.reduce((sum, r) => sum + r.vendor_cost, 0);

export const getTotalSavingsOpportunity = (records: CostRecord[]): number =>
  records.reduce(
    (sum, r) =>
      sum + r.energy_savings + r.maintenance_savings + r.vendor_savings + r.other_savings,
    0
  );

export const calculateROI = (records: CostRecord[]): number =>
  safeDivide(getTotalSavingsOpportunity(records), getTotalOperationalCost(records)) * 100;

export const getBudgetComplianceStatus = (records: CostRecord[]): BudgetCompliance => {
  const utilization = getBudgetUtilization(records);
  const budget = getTotalBudget(records);
  const actual = getTotalOperationalCost(records);
  const variance = getBudgetVariance(records);

  let status: BudgetStatus;
  let color: string;
  if (utilization > 100) {
    status = 'OVER BUDGET';
    color = 'text-red-400 bg-red-500/10 border-red-500/30';
  } else if (utilization >= 90) {
    status = 'NEAR BUDGET';
    color = 'text-amber-400 bg-amber-500/10 border-amber-500/30';
  } else {
    status = 'UNDER BUDGET';
    color = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
  }

  return { status, budget, actual, variance, utilization, color };
};

export const getCostDistribution = (records: CostRecord[]): CostDistributionPoint[] => {
  const data = [
    { name: 'Energy', value: getEnergyCost(records) },
    { name: 'Maintenance', value: getMaintenanceCost(records) },
    { name: 'Security', value: getSecurityCost(records) },
    { name: 'Occupancy', value: getOccupancyCost(records) },
    { name: 'Vendor', value: getVendorCost(records) },
  ];
  return data.filter((d) => d.value > 0);
};

const monthKey = (date: string): string => {
  // dates look like YYYY-MM; fall back to the raw string
  const trimmed = (date ?? '').trim();
  return trimmed || 'Unknown';
};

const monthLabel = (key: string): string => {
  const match = /^(\d{4})-(\d{1,2})$/.exec(key);
  if (!match) return key;
  const d = new Date(Number(match[1]), Number(match[2]) - 1, 1);
  if (!Number.isFinite(d.getTime())) return key;
  return d.toLocaleDateString([], { month: 'short', year: '2-digit' });
};

export const getMonthlyCostTrend = (records: CostRecord[]): MonthlyPoint[] => {
  const buckets = new Map<string, { cost: number; budget: number; savings: number }>();

  records.forEach((r) => {
    const key = monthKey(r.date);
    const bucket = buckets.get(key) ?? { cost: 0, budget: 0, savings: 0 };
    bucket.cost += r.operational_cost;
    bucket.budget += r.budget;
    bucket.savings +=
      r.energy_savings + r.maintenance_savings + r.vendor_savings + r.other_savings;
    buckets.set(key, bucket);
  });

  return [...buckets.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([key, b]) => ({
      month: monthLabel(key),
      cost: round2(b.cost),
      budget: round2(b.budget),
      savings: round2(b.savings),
    }));
};

export const getMonthlyBudgetTrend = (records: CostRecord[]): MonthlyPoint[] =>
  getMonthlyCostTrend(records);

export const getSavingsByCategory = (records: CostRecord[]) => {
  const energyCost = getEnergyCost(records);
  const maintenanceCost = getMaintenanceCost(records);
  const vendorCost = getVendorCost(records);
  const totalCost = getTotalOperationalCost(records);

  const energySavings = records.reduce((s, r) => s + r.energy_savings, 0);
  const maintenanceSavings = records.reduce((s, r) => s + r.maintenance_savings, 0);
  const vendorSavings = records.reduce((s, r) => s + r.vendor_savings, 0);
  const otherSavings = records.reduce((s, r) => s + r.other_savings, 0);

  const card = (title: string, currentCost: number, savings: number) => ({
    title,
    currentCost,
    savings,
    savingsPercent: safeDivide(savings, currentCost) * 100,
    projectedCost: currentCost - savings,
  });

  return [
    card('Energy Optimization', energyCost, energySavings),
    card('Maintenance Optimization', maintenanceCost, maintenanceSavings),
    card('Vendor Optimization', vendorCost, vendorSavings),
    card(
      'Other Savings',
      totalCost - energyCost - maintenanceCost - vendorCost,
      otherSavings
    ),
  ];
};

export const getVendorUtilization = (records: CostRecord[]) => {
  const vendorCost = getVendorCost(records);
  const totalCost = getTotalOperationalCost(records);
  const share = safeDivide(vendorCost, totalCost) * 100;
  const average = records.length > 0 ? vendorCost / records.length : 0;

  const recommendation =
    vendorCost === 0
      ? 'No vendor cost recorded in the current dataset.'
      : share > 20
        ? `Vendor Cost Utilization is elevated at ${formatPercent(share)} of total operational cost. Review vendor contracts and utilization to contain expenditure.`
        : `Vendor Cost Utilization is ${formatPercent(share)} of total operational cost, which is within a reasonable range.`;

  return {
    vendorCost,
    totalCost,
    share,
    average,
    recommendation,
  };
};

export const getFacilityCostComparison = (records: CostRecord[]): FacilityCostComparison[] => {
  const buckets = new Map<
    string,
    { name: string; cost: number; budget: number; savings: number }
  >();

  records.forEach((r) => {
    const key = r.facility_id || r.facility_name || 'Unknown';
    const bucket =
      buckets.get(key) ?? { name: r.facility_name || key, cost: 0, budget: 0, savings: 0 };
    bucket.cost += r.operational_cost;
    bucket.budget += r.budget;
    bucket.savings +=
      r.energy_savings + r.maintenance_savings + r.vendor_savings + r.other_savings;
    buckets.set(key, bucket);
  });

  return [...buckets.entries()].map(([id, b]) => ({
    facility_id: id,
    facility_name: b.name,
    total_cost: round2(b.cost),
    budget: round2(b.budget),
    savings: round2(b.savings),
    utilization: round2(safeDivide(b.cost, b.budget) * 100),
  }));
};

export const getCostMetrics = (records: CostRecord[]): CostMetrics => {
  const totalCost = getTotalOperationalCost(records);
  const totalBudget = getTotalBudget(records);
  const compliance = getBudgetComplianceStatus(records);

  return {
    totalCost,
    averageOperationalCost: getAverageOperationalCost(records),
    totalBudget,
    budgetVariance: getBudgetVariance(records),
    budgetUtilization: compliance.utilization,
    budgetStatus: compliance.status,
    totalSavingsOpportunity: getTotalSavingsOpportunity(records),
    projectedCostAfterSavings: totalCost - getTotalSavingsOpportunity(records),
    projectedSavingsRoi: calculateROI(records),
    energyCost: getEnergyCost(records),
    maintenanceCost: getMaintenanceCost(records),
    securityCost: getSecurityCost(records),
    occupancyCost: getOccupancyCost(records),
    vendorCost: getVendorCost(records),
    vendorCostShare: safeDivide(getVendorCost(records), totalCost) * 100,
    energySavings: records.reduce((s, r) => s + r.energy_savings, 0),
    maintenanceSavings: records.reduce((s, r) => s + r.maintenance_savings, 0),
    vendorSavings: records.reduce((s, r) => s + r.vendor_savings, 0),
    otherSavings: records.reduce((s, r) => s + r.other_savings, 0),
    recordCount: records.length,
    facilityCount: new Set(records.map((r) => r.facility_id)).size,
  };
};

/* ============================================================
   M1 + M2 + M3 CROSS-AGENT ORCHESTRATION

   Pulls the latest available metrics from the existing M1
   (energyService dataset), M2 (maintenance backend API) and
   M3 (occupancy + security CSV datasets) and gracefully
   degrades when any source is unavailable. No metrics are
   invented.
   ============================================================ */

export interface CrossAgentSources {
  energyTotalUsage: number | null;
  maintenance: { averageHealth: number; alertCount: number; machineCount: number } | null;
  occupancy: { averageUtilization: number; peakOccupancy: number; averageOccupancy: number } | null;
  security: { totalSessions: number; attackRate: number; securityScore: number; riskLevel: string } | null;
}

const fetchMaintenanceRecords = async (): Promise<MaintenanceRecord[]> => {
  const response = await fetch(MAINTENANCE_API_URL, { cache: 'no-store' });
  if (!response.ok) {
    throw new Error(`Maintenance API returned ${response.status}`);
  }
  const contentType = response.headers.get('content-type') ?? '';
  if (!contentType.includes('application/json')) {
    throw new Error('Maintenance API returned a non-JSON response.');
  }
  const result = await response.json();
  const records = Array.isArray(result) ? result : Array.isArray(result?.records) ? result.records : [];
  return records as MaintenanceRecord[];
};

export const loadCrossAgentSources = async (): Promise<CrossAgentSources> => {
  const [energyResult, maintenanceResult, occupancyResult, securityResult] = await Promise.allSettled([
    import('./energyService').then((m) => m.getEnergyData()),
    fetchMaintenanceRecords(),
    loadOccupancyData(),
    loadSecurityData(),
  ]);

  let energyTotalUsage: number | null = null;
  if (energyResult.status === 'fulfilled' && Array.isArray(energyResult.value) && energyResult.value.length > 0) {
    const { calculateTotalEnergyUsage } = await import('./energyService');
    energyTotalUsage = calculateTotalEnergyUsage(energyResult.value);
  }

  let maintenance: CrossAgentSources['maintenance'] = null;
  if (maintenanceResult.status === 'fulfilled' && maintenanceResult.value.length > 0) {
    maintenance = {
      averageHealth: round2(calculateAverageMachineHealth(maintenanceResult.value)),
      alertCount: getMaintenanceAlerts(maintenanceResult.value).length,
      machineCount: maintenanceResult.value.length,
    };
  }

  let occupancy: CrossAgentSources['occupancy'] = null;
  if (occupancyResult.status === 'fulfilled' && occupancyResult.value.length > 0) {
    const kpis = computeOccupancyKPIs(occupancyResult.value);
    occupancy = {
      averageUtilization: kpis.averageUtilization,
      peakOccupancy: kpis.peakOccupancy,
      averageOccupancy: kpis.averageOccupancy,
    };
  }

  let security: CrossAgentSources['security'] = null;
  if (securityResult.status === 'fulfilled' && securityResult.value.length > 0) {
    const analysis = analyzeSecurity(securityResult.value as SecurityRecord[]);
    security = {
      totalSessions: analysis.totalSessions,
      attackRate: analysis.attackRate,
      securityScore: analysis.securityScore,
      riskLevel: analysis.riskLevel,
    };
  }

  return { energyTotalUsage, maintenance, occupancy, security };
};

export const buildCrossAgentSummary = (sources: CrossAgentSources): CrossAgentSummary => ({
  energy:
    sources.energyTotalUsage !== null
      ? {
        available: true,
        label: 'Total Energy Usage (M1 dataset)',
        value: `${Math.round(sources.energyTotalUsage).toLocaleString()} kWh-equivalent units`,
      }
      : { available: false, label: 'Energy metric', value: 'Energy dataset unavailable' },
  maintenance: sources.maintenance
    ? {
      available: true,
      label: 'Avg Machine Health (M2)',
      value: `${sources.maintenance.averageHealth.toFixed(1)} / 100 — ${sources.maintenance.alertCount} alerts across ${sources.maintenance.machineCount} machines`,
    }
    : { available: false, label: 'Maintenance metric', value: 'Maintenance backend unavailable' },
  occupancy: sources.occupancy
    ? {
      available: true,
      label: 'Avg Occupancy Utilization (M3)',
      value: `${sources.occupancy.averageUtilization.toFixed(1)}% — peak ${sources.occupancy.peakOccupancy} occupants`,
    }
    : { available: false, label: 'Occupancy metric', value: 'Occupancy dataset unavailable' },
  security: sources.security
    ? {
      available: true,
      label: 'Security Score (M3)',
      value: `${sources.security.securityScore}/100 — ${sources.security.attackRate}% attack rate over ${sources.security.totalSessions.toLocaleString()} sessions`,
    }
    : { available: false, label: 'Security metric', value: 'Security dataset unavailable' },
});

/* ============================================================
   FACILITY HEALTH SCORE (composite, transparent)

   Conceptual weighting:
     Energy efficiency   25%
     Maintenance health 25%
     Occupancy eff.      20%
     Security condition 20%
     Budget compliance   10%

   When a source is unavailable, its weight is redistributed
   proportionally across the available sources (never NaN).
   ============================================================ */

const classifyHealth = (score: number): FacilityHealth['classification'] => {
  if (score >= 90) return 'Excellent';
  if (score >= 75) return 'Good';
  if (score >= 60) return 'Moderate';
  if (score >= 40) return 'Poor';
  return 'Critical';
};

export const calculateFacilityHealth = (
  sources: CrossAgentSources,
  records: CostRecord[]
): FacilityHealth => {
  const raw: HealthContribution[] = [];

  // Energy efficiency — proxy: identified energy savings relative to energy cost.
  if (getEnergyCost(records) > 0) {
    const savingsShare = safeDivide(
      records.reduce((s, r) => s + r.energy_savings, 0),
      getEnergyCost(records)
    );
    raw.push({
      source: 'Energy',
      score: round2(clamp(100 - savingsShare * 100 * 2, 0, 100)),
      weight: 0.25,
      available: true,
      detail: '100% minus identified energy-savings share (higher savings potential = lower efficiency).',
    });
  } else {
    raw.push({ source: 'Energy', score: 0, weight: 0.25, available: false, detail: 'No energy cost data.' });
  }

  // Maintenance health — direct average machine health from M2 when available.
  if (sources.maintenance) {
    raw.push({
      source: 'Maintenance',
      score: round2(clamp(sources.maintenance.averageHealth, 0, 100)),
      weight: 0.25,
      available: true,
      detail: 'Average machine health computed by the M2 predictive maintenance agent.',
    });
  } else {
    const maintenanceCost = getMaintenanceCost(records);
    if (maintenanceCost > 0) {
      const savingsShare = safeDivide(
        records.reduce((s, r) => s + r.maintenance_savings, 0),
        maintenanceCost
      );
      raw.push({
        source: 'Maintenance',
        score: round2(clamp(100 - savingsShare * 100 * 2, 0, 100)),
        weight: 0.25,
        available: true,
        detail: 'M2 backend unavailable — derived from maintenance-savings share in the cost dataset.',
      });
    } else {
      raw.push({ source: 'Maintenance', score: 0, weight: 0.25, available: false, detail: 'No maintenance data.' });
    }
  }

  // Occupancy efficiency — proximity to the productive 40–80% utilization band.
  if (sources.occupancy) {
    const u = sources.occupancy.averageUtilization;
    const occupancyScore =
      u >= 40 && u <= 80 ? 100 : u < 40 ? clamp(100 - (40 - u) * 2.5, 0, 100) : clamp(100 - (u - 80) * 2.5, 0, 100);
    raw.push({
      source: 'Occupancy',
      score: round2(occupancyScore),
      weight: 0.2,
      available: true,
      detail: 'Proximity to the productive 40–80% utilization band, from M3 occupancy analytics.',
    });
  } else {
    raw.push({ source: 'Occupancy', score: 0, weight: 0.2, available: false, detail: 'No occupancy data.' });
  }

  // Security condition — M3 security score (100 - attack rate).
  if (sources.security) {
    raw.push({
      source: 'Security',
      score: round2(clamp(sources.security.securityScore, 0, 100)),
      weight: 0.2,
      available: true,
      detail: 'M3 security score derived from the detected-attack rate over all sessions.',
    });
  } else {
    raw.push({ source: 'Security', score: 0, weight: 0.2, available: false, detail: 'No security data.' });
  }

  // Budget compliance — penalizes utilization above 90%.
  const utilization = getBudgetUtilization(records);
  if (utilization > 0) {
    raw.push({
      source: 'Budget',
      score: round2(clamp(100 - Math.max(0, utilization - 90) * 2, 0, 100)),
      weight: 0.1,
      available: true,
      detail: '100% penalized by 2 points for every budget-utilization point above 90%.',
    });
  } else {
    raw.push({ source: 'Budget', score: 0, weight: 0.1, available: false, detail: 'No budget data.' });
  }

  const available = raw.filter((c) => c.available);
  const totalWeightAvailable = available.reduce((s, c) => s + c.weight, 0);

  const contributions: HealthContribution[] = raw.map((c) => ({
    ...c,
    weight: c.available && totalWeightAvailable > 0 ? c.weight / totalWeightAvailable : 0,
  }));

  const score =
    totalWeightAvailable > 0
      ? round2(available.reduce((s, c) => s + c.score * (c.weight / totalWeightAvailable), 0))
      : 0;

  return { score, classification: classifyHealth(score), contributions };
};

/* ============================================================
   OPERATIONAL ANOMALY DETECTION

   Each month's operational cost is compared with the average
   monthly cost. Flag when cost > avg × 1.20 or < avg × 0.80.
   Severity: 20–30% deviation = Warning, > 30% = Critical.
   ============================================================ */

export const detectCostAnomalies = (records: CostRecord[]): CostAnomaly[] => {
  const monthly = getMonthlyCostTrend(records);
  if (monthly.length === 0) return [];

  const average = monthly.reduce((s, m) => s + m.cost, 0) / monthly.length;
  if (!Number.isFinite(average) || average <= 0) return [];

  const anomalies: CostAnomaly[] = [];

  monthly.forEach((m) => {
    const deviationPct = round2(safeDivide(m.cost - average, average) * 100);
    const isHigh = m.cost > average * 1.2;
    const isLow = m.cost < average * 0.8;
    if (!isHigh && !isLow) return;

    const absDeviation = Math.abs(deviationPct);
    const facilityNames = [...new Set(records.filter((r) => monthLabel(monthKey(r.date)) === m.month).map((r) => r.facility_name))].join(', ');

    anomalies.push({
      month: m.month,
      facility: facilityNames || '—',
      actualCost: m.cost,
      averageCost: round2(average),
      deviationPct,
      severity: absDeviation > 30 ? 'Critical' : 'Warning',
    });
  });

  return anomalies.sort((a, b) => Math.abs(b.deviationPct) - Math.abs(a.deviationPct));
};

/* ============================================================
   OPERATIONAL COST FORECAST

   Transparent 3-month moving average over historical monthly
   cost. Clearly labeled as an estimate in the UI.
   ============================================================ */

export const buildCostForecast = (records: CostRecord[]): ForecastPoint[] => {
  const monthly = getMonthlyCostTrend(records);
  if (monthly.length === 0) return [];

  const history: ForecastPoint[] = monthly.map((m) => ({
    label: m.month,
    actual: m.cost,
    predicted: null,
    isForecast: false,
  }));

  const values = monthly.map((m) => m.cost);
  const window = Math.min(3, values.length);
  const lastValues = values.slice(-window);
  const forecastValue = round2(lastValues.reduce((s, v) => s + v, 0) / lastValues.length);

  // Build a sensible next-period label from the last month key.
  const lastKeys = [...new Set(records.map((r) => monthKey(r.date)))].sort((a, b) => a.localeCompare(b));
  let nextLabel = 'Next';
  const lastKey = lastKeys[lastKeys.length - 1];
  const match = /^(\d{4})-(\d{1,2})$/.exec(lastKey);
  if (match) {
    const next = new Date(Number(match[1]), Number(match[2]), 1);
    if (Number.isFinite(next.getTime())) {
      nextLabel = next.toLocaleDateString([], { month: 'short', year: '2-digit' });
    }
  }

  return [...history, { label: nextLabel, actual: null, predicted: forecastValue, isForecast: true }];
};

/* ============================================================
   AI RECOMMENDATIONS (dynamically generated from metrics)
   ============================================================ */

export const generateCostRecommendations = (records: CostRecord[]): CostRecommendation[] => {
  if (records.length === 0) return [];

  const recommendations: CostRecommendation[] = [];
  const distribution = getCostDistribution(records);
  const compliance = getBudgetComplianceStatus(records);
  const vendor = getVendorUtilization(records);
  const metrics = getCostMetrics(records);

  if (distribution.length > 0) {
    const largest = [...distribution].sort((a, b) => b.value - a.value)[0];
    const share = safeDivide(largest.value, metrics.totalCost) * 100;
    recommendations.push({
      title: `Largest cost driver: ${largest.name}`,
      message: `${largest.name} represents the largest operational cost category at ${formatPercent(share)} of total cost. Review ${largest.name.toLowerCase()} consumption patterns and identify efficiency opportunities.`,
      severity: 'info',
    });
  }

  if (compliance.utilization > 100) {
    recommendations.push({
      title: 'Budget exceeded',
      message: `Operational spending exceeds the configured budget by ${formatCurrency(Math.abs(compliance.variance))} (${formatPercent(compliance.utilization)} utilization). Immediate budget review is recommended.`,
      severity: 'critical',
    });
  } else if (compliance.utilization >= 90) {
    recommendations.push({
      title: 'Budget approaching limit',
      message: `Budget utilization is at ${formatPercent(compliance.utilization)}. Spending is close to the configured budget — monitor monthly costs closely.`,
      severity: 'warning',
    });
  } else {
    recommendations.push({
      title: 'Budget within limits',
      message: `Current spending remains below the configured budget (${formatPercent(compliance.utilization)} utilization). Consider reinvesting the variance of ${formatCurrency(compliance.variance)} into efficiency initiatives.`,
      severity: 'success',
    });
  }

  if (vendor.vendorCost > 0 && vendor.share > 20) {
    recommendations.push({
      title: 'Vendor expenditure elevated',
      message: vendor.recommendation,
      severity: 'warning',
    });
  }

  const maintenanceShare = safeDivide(metrics.maintenanceCost, metrics.totalCost) * 100;
  if (maintenanceShare > 20) {
    recommendations.push({
      title: 'Maintenance expenditure elevated',
      message: `Maintenance expenditure is ${formatPercent(maintenanceShare)} of total cost. Review preventive maintenance schedules and recurring equipment costs to reduce unplanned spend.`,
      severity: 'warning',
    });
  }

  const occupancyShare = safeDivide(metrics.occupancyCost, metrics.totalCost) * 100;
  if (occupancyShare > 15) {
    recommendations.push({
      title: 'Occupancy cost review',
      message: `Occupancy-related cost is ${formatPercent(occupancyShare)} of total operational cost. Improve space/resource allocation to align occupancy spending with actual utilization.`,
      severity: 'info',
    });
  }

  const securityShare = safeDivide(metrics.securityCost, metrics.totalCost) * 100;
  if (securityShare > 15) {
    recommendations.push({
      title: 'Security operating cost review',
      message: `Security operating cost is ${formatPercent(securityShare)} of total cost. Review security operating costs against the M3 risk profile to ensure spend matches exposure.`,
      severity: 'info',
    });
  }

  recommendations.push({
    title: 'Savings potential',
    message: `Identified savings opportunities total ${formatCurrency(metrics.totalSavingsOpportunity)}, a projected savings ROI of ${formatPercent(metrics.projectedSavingsRoi)}. Projected cost after savings: ${formatCurrency(metrics.projectedCostAfterSavings)}.`,
    severity: 'success',
  });

  return recommendations;
};

/* ============================================================
   FACILITY INTELLIGENCE REPORT (dynamically generated)
   ============================================================ */

export const generateFacilityIntelligence = (
  records: CostRecord[],
  sources: CrossAgentSources
): FacilityIntelligence => {
  const metrics = getCostMetrics(records);
  const compliance = getBudgetComplianceStatus(records);
  const anomalies = detectCostAnomalies(records);
  const recommendations = generateCostRecommendations(records);
  const distribution = getCostDistribution(records);

  const largest =
    distribution.length > 0
      ? [...distribution].sort((a, b) => b.value - a.value)[0]
      : null;
  const largestShare = largest ? safeDivide(largest.value, metrics.totalCost) * 100 : 0;

  const majorAnomaly = anomalies[0]
    ? `${anomalies[0].month}: ${formatCurrency(anomalies[0].actualCost)} vs ${formatCurrency(anomalies[0].averageCost)} average (${anomalies[0].severity}, ${anomalies[0].deviationPct > 0 ? '+' : ''}${anomalies[0].deviationPct}%).`
    : 'No significant cost anomalies detected.';

  const topRecommendation = recommendations[0]?.title
    ? `${recommendations[0].title} — ${recommendations[0].message}`
    : 'No recommendations available.';

  return {
    overallHealth: calculateFacilityHealth(sources, records),
    budgetStatus: compliance,
    largestCostDriver: largest ? largest.name : '—',
    largestCostDriverShare: round2(largestShare),
    potentialSavings: metrics.totalSavingsOpportunity,
    projectedRoi: metrics.projectedSavingsRoi,
    majorAnomaly,
    topRecommendation,
  };
};
