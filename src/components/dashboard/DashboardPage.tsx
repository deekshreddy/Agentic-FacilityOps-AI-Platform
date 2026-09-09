import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Bell,
  Building2,
  CheckCircle2,
  DollarSign,
  Gauge,
  HeartPulse,
  Shield,
  TrendingUp,
  Users,
  Wrench,
  Zap,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { KpiCard } from "../kpi/KpiCard";
import { useDashboardData } from "../../hooks/useDashboardData";
import { useMaintenanceData } from "../../hooks/useMaintenanceData";
import { useOccupancyData } from "../../hooks/useOccupancyData";
import { useSecurityData } from "../../hooks/useSecurityData";
import * as dc from "../../services/dataCenterService";
import {
  calculateFacilityHealth,
  formatCurrency,
  formatPercent,
  getCostMetrics,
  getMonthlyCostTrend,
  loadCostData,
  loadCrossAgentSources,
} from "../../services/costOptimizationService";
import {
  buildMachineRecords,
  calculateAverageMachineHealth,
  failureRate,
  generateAlerts,
} from "../../services/maintenanceServiceImpl";

const CHART_COLORS = ["#60a5fa", "#34d399", "#fbbf24", "#f87171", "#a78bfa"];

const numberOrNull = (value: unknown): number | null => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const getHealthStatus = (score: number): "Excellent" | "Good" | "Warning" | "Critical" => {
  if (score >= 90) return "Excellent";
  if (score >= 75) return "Good";
  if (score >= 60) return "Warning";
  return "Critical";
};

const getStatusClass = (status: string) => {
  const palette: Record<string, string> = {
    Excellent: "border-emerald-500/30 bg-emerald-500/10 text-emerald-200",
    Good: "border-emerald-500/30 bg-emerald-500/10 text-emerald-200",
    Warning: "border-amber-500/30 bg-amber-500/10 text-amber-200",
    Critical: "border-red-500/30 bg-red-500/10 text-red-200",
    Healthy: "border-emerald-500/30 bg-emerald-500/10 text-emerald-200",
    Normal: "border-emerald-500/30 bg-emerald-500/10 text-emerald-200",
    Attention: "border-amber-500/30 bg-amber-500/10 text-amber-200",
    High: "border-amber-500/30 bg-amber-500/10 text-amber-200",
    Medium: "border-sky-500/30 bg-sky-500/10 text-sky-200",
    Low: "border-slate-500/30 bg-slate-500/10 text-slate-200",
    INFO: "border-sky-500/30 bg-sky-500/10 text-sky-200",
    WARNING: "border-amber-500/30 bg-amber-500/10 text-amber-200",
    CRITICAL: "border-red-500/30 bg-red-500/10 text-red-200",
    "N/A": "border-slate-600 bg-slate-800/60 text-slate-200",
  };

  return palette[status] ?? palette["N/A"];
};

const getMilestoneHealth = (score: number) => {
  const status = getHealthStatus(score);
  return {
    score,
    status,
    statusClass: getStatusClass(status),
  };
};

const safeFixed = (value: number | null, digits = 1) => {
  if (value === null || Number.isNaN(value)) return "N/A";
  return `${value.toFixed(digits)}`;
};

export const DashboardPage = () => {
  const navigate = useNavigate();
  const dashboardResult = useDashboardData();
  const maintenanceResult = useMaintenanceData();
  const occupancyResult = useOccupancyData();
  const securityResult = useSecurityData();

  const [costRecords, setCostRecords] = useState<any[]>([]);
  const [crossAgentSources, setCrossAgentSources] = useState<any>(null);
  const [costLoading, setCostLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const load = async () => {
      setCostLoading(true);
      try {
        const [cost, sources] = await Promise.allSettled([loadCostData(), loadCrossAgentSources()]);

        if (!active) return;

        if (cost.status === "fulfilled") setCostRecords(cost.value);
        else setCostRecords([]);

        if (sources.status === "fulfilled") setCrossAgentSources(sources.value);
        else setCrossAgentSources(null);
      } catch {
        if (!active) return;
        setCostRecords([]);
        setCrossAgentSources(null);
      } finally {
        if (active) setCostLoading(false);
      }
    };

    void load();

    return () => {
      active = false;
    };
  }, []);

  const energyRecords = Array.isArray(dashboardResult?.data) ? dashboardResult.data : [];
  const maintenanceRecords = Array.isArray(maintenanceResult?.data) ? maintenanceResult.data : [];
  const occupancyKpis = occupancyResult?.kpis ?? {
    averageOccupancy: 0,
    averageUtilization: 0,
    latestActiveReading: 0,
    utilizationPercent: 0,
    peakOccupancy: 0,
    facilityCapacity: 0,
  };
  const securityAnalysis = securityResult?.report?.analysis ?? null;
  const securitySummary = securityResult?.report?.summary ?? "No security summary available.";

  const loading = Boolean(
    dashboardResult?.loading || maintenanceResult?.loading || occupancyResult?.loading || securityResult?.loading || costLoading
  );

  const error = dashboardResult?.error || maintenanceResult?.error || occupancyResult?.error || securityResult?.error;

  const machineRecords = useMemo(() => {
    if (!maintenanceRecords.length) return [] as any[];

    const normalized = maintenanceRecords.map((record: any) => ({
      ...record,
      productId:
        record?.productId ??
        record?.product_id ??
        record?.Product_ID ??
        record?.ProductID ??
        record?.["Product ID"],
      machineType: record?.machineType ?? record?.Type ?? record?.type,
      airTemp: numberOrNull(record?.airTemp ?? record?.air_temp ?? record?.["Air temperature [K]"]) ?? 0,
      processTemp: numberOrNull(record?.processTemp ?? record?.process_temp ?? record?.["Process temperature [K]"]) ?? 0,
      speed: numberOrNull(record?.speed ?? record?.rotational_speed ?? record?.["Rotational speed [rpm]"]) ?? 0,
      torque: numberOrNull(record?.torque ?? record?.["Torque [Nm]"]) ?? 0,
      toolWear: numberOrNull(record?.toolWear ?? record?.tool_wear ?? record?.["Tool wear [min]"]) ?? 0,
      target: record?.target ?? record?.machine_failure ?? record?.["Machine failure"] ?? 0,
      targetReal: record?.targetReal ?? record?.target_real ?? 0,
    }));

    return buildMachineRecords(normalized);
  }, [maintenanceRecords]);

  const avgMachineHealth = useMemo(() => {
    if (!machineRecords.length) return null;
    return calculateAverageMachineHealth(machineRecords);
  }, [machineRecords]);

  const failureRateValue = useMemo(() => {
    if (!machineRecords.length) return null;
    return failureRate(machineRecords);
  }, [machineRecords]);

  const maintenanceAlerts = useMemo(() => {
    if (!machineRecords.length) return [] as any[];
    return generateAlerts(machineRecords).slice(0, 4);
  }, [machineRecords]);

  const criticalMachines = useMemo(
    () => machineRecords.filter((machine: any) => machine.healthStatus === "Critical").length,
    [machineRecords]
  );
  const warningMachines = useMemo(
    () => machineRecords.filter((machine: any) => machine.healthStatus === "Warning").length,
    [machineRecords]
  );
  const healthyMachines = useMemo(
    () => machineRecords.filter((machine: any) => machine.healthStatus === "Healthy").length,
    [machineRecords]
  );

  const totalEnergyUsage = dc.totalElectricityUsage(energyRecords) || null;
  const averagePUE = dc.averagePUE(energyRecords) || null;
  const averageCapacity = dc.averageCapacity(energyRecords) || null;

  const costMetrics = useMemo(() => {
    if (!costRecords.length) return null;
    return getCostMetrics(costRecords);
  }, [costRecords]);

  const facilityHealth = useMemo(() => {
    if (!costRecords.length || !crossAgentSources) return null;
    return calculateFacilityHealth(crossAgentSources, costRecords);
  }, [costRecords, crossAgentSources]);

  const facilityHealthScore = facilityHealth?.score ??
    (costMetrics && crossAgentSources
      ? Math.min(
          100,
          Math.max(
            0,
            (Number(crossAgentSources?.maintenance?.averageHealth ?? 0) * 0.3 +
              (100 - (costMetrics.budgetUtilization || 0)) * 0.2 +
              (100 - (occupancyKpis.utilizationPercent || 0)) * 0.2 +
              (securityAnalysis?.securityScore ?? 0) * 0.2 +
              (crossAgentSources?.energyTotalUsage ? 80 : 0) * 0.1) /
              1
          )
        )
      : null);

  const energyTrend = useMemo(() => {
    const raw = dc.trendByYear(energyRecords, "dailyElectricityUsageMwh") ?? [];
    return raw.slice(-6).map((point: any) => ({
      label: String(point.timestamp ?? "N/A"),
      usage: Number(point.value ?? 0),
    }));
  }, [energyRecords]);

  const costTrend = useMemo(() => {
    if (!costRecords.length) return [];
    return getMonthlyCostTrend(costRecords).slice(-6).map((point: any) => ({
      month: point.month,
      actual: Number(point.cost ?? 0),
      optimized: Math.max(0, Number(point.cost ?? 0) - Number(point.savings ?? 0)),
    }));
  }, [costRecords]);

  const securityMix = useMemo(() => {
    const threatMix = securityResult?.report?.threatMix ?? [];
    return threatMix.length ? threatMix : [{ name: "Security events", value: 1 }];
  }, [securityResult]);

  const maintenanceDonut = useMemo(() => {
    const total = Math.max(1, healthyMachines + warningMachines + criticalMachines);
    return [
      { name: "Healthy", value: (healthyMachines / total) * 100 },
      { name: "Warning", value: (warningMachines / total) * 100 },
      { name: "Critical", value: (criticalMachines / total) * 100 },
    ];
  }, [healthyMachines, warningMachines, criticalMachines]);

  const backendStatus = useMemo(() => {
    const connected = !Boolean(error) || Boolean(costMetrics || crossAgentSources || securityAnalysis || avgMachineHealth !== null);
    return {
      connected,
      statusText: connected ? "Connected" : "Unavailable",
      lastUpdated: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      monitorText: crossAgentSources || securityAnalysis ? "Active" : "Standby",
    };
  }, [error, costMetrics, crossAgentSources, securityAnalysis, avgMachineHealth]);

  const priorityAlerts = useMemo(() => {
    const alerts: any[] = [];

    if (securityAnalysis) {
      const incident = securityResult?.report?.topIncidents?.[0];
      if (incident) {
        alerts.push({
          agent: "Security Agent",
          alert: incident.message ?? "High-risk network behavior detected",
          severity: incident.severity,
          metric: "Security risk",
          action: "/security",
        });
      }
    }

    if (maintenanceAlerts.length) {
      maintenanceAlerts.forEach((alert: any) => {
        alerts.push({
          agent: "Maintenance Agent",
          alert: alert.message ?? alert.reason ?? "Maintenance attention required",
          severity: String(alert.severity ?? "WARNING").toUpperCase(),
          metric: "Machine health",
          action: "/maintenance",
        });
      });
    }

    if (occupancyResult?.overcrowding?.length) {
      occupancyResult.overcrowding.forEach((item: any) => {
        alerts.push({
          agent: "Occupancy Agent",
          alert: item.message ?? "Space utilization is elevated",
          severity: item.severity ?? "HIGH",
          metric: "Occupancy",
          action: "/occupancy",
        });
      });
    }

    if (costMetrics && costMetrics.budgetUtilization > 90) {
      alerts.push({
        agent: "Cost Optimization Agent",
        alert: "Budget utilization is near the limit",
        severity: "WARNING",
        metric: "Cost control",
        action: "/cost-optimization",
      });
    }

    return alerts.sort((a, b) => {
      const rank: Record<string, number> = { CRITICAL: 4, HIGH: 3, WARNING: 2, INFO: 1 };
      return (rank[b.severity] ?? 0) - (rank[a.severity] ?? 0);
    });
  }, [securityAnalysis, securityResult, maintenanceAlerts, occupancyResult, costMetrics]);

  const recommendations = useMemo(() => {
    const items: any[] = [];

    if (avgMachineHealth !== null && avgMachineHealth < 80) {
      items.push({
        severity: "WARNING",
        milestone: "M2",
        recommendation: "Several machines require preventive maintenance attention.",
        reason: `Average machine health is ${safeFixed(avgMachineHealth)}% with ${criticalMachines} critical assets in the current fleet.`,
        action: "/maintenance",
      });
    }

    if (occupancyKpis.utilizationPercent > 70) {
      items.push({
        severity: "HIGH",
        milestone: "M3",
        recommendation: "Space allocation should be rebalanced to reduce occupancy pressure.",
        reason: `Current utilization is ${safeFixed(occupancyKpis.utilizationPercent)}% and the latest active occupancy reading is ${occupancyKpis.latestActiveReading}.`,
        action: "/occupancy",
      });
    }

    if (securityAnalysis && securityAnalysis.riskLevel !== "LOW") {
      items.push({
        severity: securityAnalysis.riskLevel === "CRITICAL" ? "CRITICAL" : "WARNING",
        milestone: "M3",
        recommendation: "Security controls should be reviewed for recent high-risk access patterns.",
        reason: `${securityAnalysis.detectedAttacks} attack events detected across ${securityAnalysis.totalSessions} sessions, with a risk level of ${securityAnalysis.riskLevel}.`,
        action: "/security",
      });
    }

    if (costMetrics && costMetrics.totalSavingsOpportunity > 0) {
      items.push({
        severity: "INFO",
        milestone: "M4",
        recommendation: "Cost optimization opportunity remains available across vendor and operating spend.",
        reason: `Total savings opportunity is ${formatCurrency(costMetrics.totalSavingsOpportunity)} based on the current operating dataset.`,
        action: "/cost-optimization",
      });
    }

    if (totalEnergyUsage !== null && averagePUE !== null && averagePUE > 1.4) {
      items.push({
        severity: "WARNING",
        milestone: "M1",
        recommendation: "Energy efficiency requires attention during high-usage periods.",
        reason: `Current energy demand is ${safeFixed(totalEnergyUsage, 1)} MWh and average PUE is ${safeFixed(averagePUE, 2)}.`,
        action: "/energy",
      });
    }

    return items.slice(0, 5);
  }, [avgMachineHealth, criticalMachines, occupancyKpis, securityAnalysis, costMetrics, totalEnergyUsage, averagePUE]);

  const milestoneHealthCards = [
    {
      title: "M1 Energy",
      score: totalEnergyUsage !== null && averagePUE !== null ? Math.min(100, Math.max(40, 100 - ((averagePUE - 1) * 100))) : 0,
      status: totalEnergyUsage !== null && averagePUE !== null ? getHealthStatus(Math.min(100, Math.max(40, 100 - ((averagePUE - 1) * 100)))) : "N/A",
      insight: averagePUE !== null ? `Average PUE ${safeFixed(averagePUE, 2)} indicates current efficiency performance.` : "Energy dataset unavailable.",
      route: "/energy",
    },
    {
      title: "M2 Maintenance",
      score: avgMachineHealth !== null ? avgMachineHealth : 0,
      status: avgMachineHealth !== null ? getHealthStatus(avgMachineHealth) : "N/A",
      insight: avgMachineHealth !== null ? `Average health ${safeFixed(avgMachineHealth)}% across monitored assets.` : "Maintenance data unavailable.",
      route: "/maintenance",
    },
    {
      title: "M3 Occupancy & Security",
      score: securityAnalysis && occupancyKpis.averageUtilization !== null
        ? Math.min(100, Math.max(0, (securityAnalysis.securityScore + (100 - occupancyKpis.averageUtilization)) / 2))
        : 0,
      status: securityAnalysis && occupancyKpis.averageUtilization !== null ? getHealthStatus(Math.min(100, Math.max(0, (securityAnalysis.securityScore + (100 - occupancyKpis.averageUtilization)) / 2))) : "N/A",
      insight: securityAnalysis ? `${securityAnalysis.riskLevel} risk posture with ${securityAnalysis.detectedAttacks} detected attacks.` : "Occupancy and security signals unavailable.",
      route: "/security",
    },
    {
      title: "M4 Cost Optimization",
      score: costMetrics ? Math.min(100, Math.max(0, 100 - costMetrics.budgetUtilization)) : 0,
      status: costMetrics ? getHealthStatus(Math.min(100, Math.max(0, 100 - costMetrics.budgetUtilization))) : "N/A",
      insight: costMetrics ? `Budget utilization is ${formatPercent(costMetrics.budgetUtilization)}; ${formatCurrency(costMetrics.totalSavingsOpportunity)} savings opportunity identified.` : "Cost data unavailable.",
      route: "/cost-optimization",
    },
  ];

  const quickActions = [
    { label: "Energy Monitoring", path: "/energy" },
    { label: "Predictive Maintenance", path: "/maintenance" },
    { label: "Occupancy Analytics", path: "/occupancy" },
    { label: "Security Monitoring", path: "/security" },
    { label: "Cost Optimization", path: "/cost-optimization" },
  ];

  return (
    <div className="min-h-screen bg-[#0b1120] px-4 py-6 text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {(loading || error) && (
          <div className={`rounded-xl border p-3 text-sm ${error ? "border-amber-500/30 bg-amber-500/10 text-amber-100" : "border-slate-700 bg-slate-900/75 text-slate-300"}`}>
            {loading ? "Loading dashboard data..." : "Some dashboard data is unavailable. Available sections are still shown."}
          </div>
        )}
        <motion.header
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="rounded-2xl border border-slate-700/80 bg-slate-900/75 p-5 shadow-[0_16px_40px_rgba(15,23,42,0.45)] backdrop-blur-sm"
        >
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-[0.28em] text-blue-300">Executive overview</p>
              <h1 className="mt-2 text-2xl font-bold text-white md:text-3xl">FacilityOps AI</h1>
              <p className="mt-1 text-sm text-slate-400">AI-Powered Smart Facility Intelligence &amp; Operations</p>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-sm text-slate-300">
              <span className="rounded-full border border-slate-700 bg-slate-800/80 px-3 py-1.5">Facility Status <span className="ml-1 text-emerald-300">● Operational</span></span>
              <span className="rounded-full border border-slate-700 bg-slate-800/80 px-3 py-1.5">AI Monitoring <span className="ml-1 text-emerald-300">● {backendStatus.monitorText}</span></span>
              <span className="rounded-full border border-slate-700 bg-slate-800/80 px-3 py-1.5">Backend <span className="ml-1 text-emerald-300">● {backendStatus.statusText}</span></span>
              <span className="rounded-full border border-slate-700 bg-slate-800/80 px-3 py-1.5">Last Update <span className="ml-1 text-slate-200">{backendStatus.lastUpdated}</span></span>
              <button className="rounded-full border border-slate-600 bg-slate-800/80 p-2.5 text-slate-200 hover:border-slate-500 hover:text-white" aria-label="Notifications">
                <Bell className="h-4 w-4" />
              </button>
            </div>
          </div>
        </motion.header>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
          <KpiCard
            title="Facility Health Score"
            value={facilityHealthScore !== null ? `${Math.round(facilityHealthScore)}%` : "N/A"}
            trend={facilityHealth ? `Status ${facilityHealth.classification}` : "Live score pending"}
            icon={<Gauge className="h-5 w-5" />}
            sparkline={<div className="h-full w-full rounded-lg bg-gradient-to-r from-emerald-500/10 via-cyan-500/10 to-transparent" />}
            accentClass="bg-emerald-500/10 text-emerald-200"
          />
          <KpiCard
            title="Energy Efficiency"
            value={averagePUE !== null ? `${averagePUE.toFixed(2)}` : "N/A"}
            trend={totalEnergyUsage !== null ? `${totalEnergyUsage.toFixed(1)} MWh` : "Energy data unavailable"}
            icon={<Zap className="h-5 w-5" />}
            sparkline={<div className="h-full w-full rounded-lg bg-gradient-to-r from-blue-500/10 via-sky-500/10 to-transparent" />}
            accentClass="bg-blue-500/10 text-blue-200"
          />
          <KpiCard
            title="Machine Health"
            value={avgMachineHealth !== null ? `${avgMachineHealth.toFixed(1)}%` : "N/A"}
            trend={machineRecords.length ? `${healthyMachines} healthy / ${criticalMachines} critical` : "Maintenance API unavailable"}
            icon={<HeartPulse className="h-5 w-5" />}
            sparkline={<div className="h-full w-full rounded-lg bg-gradient-to-r from-emerald-500/10 via-green-500/10 to-transparent" />}
            accentClass="bg-emerald-500/10 text-emerald-200"
          />
          <KpiCard
            title="Occupancy"
            value={occupancyKpis.latestActiveReading ? `${occupancyKpis.latestActiveReading}` : "N/A"}
            trend={occupancyKpis.utilizationPercent ? `Utilization ${occupancyKpis.utilizationPercent.toFixed(0)}%` : "No occupancy signal"}
            icon={<Users className="h-5 w-5" />}
            sparkline={<div className="h-full w-full rounded-lg bg-gradient-to-r from-violet-500/10 via-purple-500/10 to-transparent" />}
            accentClass="bg-violet-500/10 text-violet-200"
          />
          <KpiCard
            title="Security Risk"
            value={securityAnalysis ? `${securityAnalysis.riskLevel}` : "N/A"}
            trend={securityAnalysis ? `${securityAnalysis.detectedAttacks} detected attacks` : "Security data unavailable"}
            icon={<Shield className="h-5 w-5" />}
            sparkline={<div className="h-full w-full rounded-lg bg-gradient-to-r from-sky-500/10 via-indigo-500/10 to-transparent" />}
            accentClass="bg-sky-500/10 text-sky-200"
          />
          <KpiCard
            title="Cost Savings Opportunity"
            value={costMetrics ? formatCurrency(costMetrics.totalSavingsOpportunity) : "N/A"}
            trend={costMetrics ? `ROI ${formatPercent(costMetrics.projectedSavingsRoi)}` : "Cost data unavailable"}
            icon={<DollarSign className="h-5 w-5" />}
            sparkline={<div className="h-full w-full rounded-lg bg-gradient-to-r from-amber-500/10 via-yellow-500/10 to-transparent" />}
            accentClass="bg-amber-500/10 text-amber-200"
          />
        </section>

        <section className="grid gap-6 xl:grid-cols-2">
          <div className="rounded-2xl border border-slate-700/80 bg-slate-900/75 p-5">
            <p className="text-[11px] uppercase tracking-[0.26em] text-slate-400">AI Operations Overview</p>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <MilestoneCard
                milestone="M1"
                title="Energy Intelligence"
                description="Monitor energy consumption, efficiency and operational energy patterns."
                metrics={[
                  { label: "Energy consumption", value: totalEnergyUsage !== null ? `${totalEnergyUsage.toFixed(1)} MWh` : "N/A" },
                  { label: "Average PUE", value: averagePUE !== null ? averagePUE.toFixed(2) : "N/A" },
                  { label: "Status", value: totalEnergyUsage !== null ? "Operational" : "Unavailable" },
                ]}
                actionLabel="View Energy"
                actionPath="/energy"
              />
              <MilestoneCard
                milestone="M2"
                title="Predictive Maintenance"
                description="Monitor equipment health, failure risk and maintenance requirements."
                metrics={[
                  { label: "Total machines", value: machineRecords.length ? String(machineRecords.length) : "N/A" },
                  { label: "Healthy", value: machineRecords.length ? String(healthyMachines) : "N/A" },
                  { label: "Warning", value: machineRecords.length ? String(warningMachines) : "N/A" },
                  { label: "Critical", value: machineRecords.length ? String(criticalMachines) : "N/A" },
                  { label: "Failure rate", value: failureRateValue !== null ? `${failureRateValue.toFixed(1)}%` : "N/A" },
                ]}
                actionLabel="View Maintenance"
                actionPath="/maintenance"
              />
              <MilestoneCard
                milestone="M3"
                title="Occupancy & Security Intelligence"
                description="Analyze occupancy patterns, space utilization and security threats."
                metrics={[
                  { label: "Current occupancy", value: occupancyKpis.latestActiveReading ? String(occupancyKpis.latestActiveReading) : "N/A" },
                  { label: "Utilization", value: occupancyKpis.utilizationPercent ? `${occupancyKpis.utilizationPercent.toFixed(0)}%` : "N/A" },
                  { label: "Security alerts", value: securityAnalysis ? String(securityAnalysis.detectedAttacks) : "N/A" },
                  { label: "High-risk events", value: securityAnalysis ? String(securityAnalysis.criticalIncidents) : "N/A" },
                ]}
                actionLabel="View Occupancy"
                actionPath="/occupancy"
                secondaryActionLabel="View Security"
                secondaryActionPath="/security"
              />
              <MilestoneCard
                milestone="M4"
                title="Cost Optimization"
                description="Analyze operational costs, identify savings opportunities and optimize resources."
                metrics={[
                  { label: "Total operational cost", value: costMetrics ? formatCurrency(costMetrics.totalCost) : "N/A" },
                  { label: "Potential savings", value: costMetrics ? formatCurrency(costMetrics.totalSavingsOpportunity) : "N/A" },
                  { label: "Budget utilization", value: costMetrics ? formatPercent(costMetrics.budgetUtilization) : "N/A" },
                  { label: "ROI opportunity", value: costMetrics ? formatPercent(costMetrics.projectedSavingsRoi) : "N/A" },
                ]}
                actionLabel="View Cost Optimization"
                actionPath="/cost-optimization"
              />
            </div>
          </div>

          <div className="rounded-2xl border border-slate-700/80 bg-slate-900/75 p-5">
            <p className="text-[11px] uppercase tracking-[0.26em] text-slate-400">Overall Facility Health</p>
            <div className="mt-5 flex flex-col items-center justify-center gap-6">
              <div className="relative h-48 w-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: "Health", value: facilityHealthScore ?? 0 },
                        { name: "Remaining", value: Math.max(0, 100 - (facilityHealthScore ?? 0)) },
                      ]}
                      dataKey="value"
                      innerRadius={54}
                      outerRadius={72}
                      startAngle={90}
                      endAngle={-270}
                      stroke="rgba(15,23,42,0.4)"
                    >
                      <Cell fill="#34d399" />
                      <Cell fill="#1e293b" />
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-bold text-white">{facilityHealthScore !== null ? `${Math.round(facilityHealthScore)}%` : "N/A"}</span>
                  <span className="text-xs uppercase tracking-[0.18em] text-slate-400">Facility Health</span>
                </div>
              </div>
              <div className="w-full rounded-xl border border-slate-700 bg-slate-950/50 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-300">Status</span>
                  <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${getStatusClass(facilityHealth ? facilityHealth.classification : getHealthStatus(facilityHealthScore ?? 0))}`}>
                    {facilityHealth ? facilityHealth.classification : facilityHealthScore !== null ? getHealthStatus(facilityHealthScore) : "N/A"}
                  </span>
                </div>
                <div className="mt-4 space-y-3">
                  {facilityHealth?.contributions?.length ? (
                    facilityHealth.contributions.map((item: any) => (
                      <div key={item.source}>
                        <div className="mb-1 flex items-center justify-between text-xs text-slate-300">
                          <span>{item.source}</span>
                          <span>{Math.round(item.score)}%</span>
                        </div>
                        <div className="h-2 rounded-full bg-slate-800">
                          <div className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-sky-400 to-violet-400" style={{ width: `${Math.min(100, Math.max(0, item.score))}%` }} />
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-slate-400">Suite of milestone signals is still loading or unavailable.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-700/80 bg-slate-900/75 p-5">
          <p className="text-[11px] uppercase tracking-[0.26em] text-slate-400">Milestone Health</p>
          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {milestoneHealthCards.map((card) => {
              const status = card.status === "N/A" ? "N/A" : card.status;
              return (
                <button key={card.title} onClick={() => navigate(card.route)} className="rounded-2xl border border-slate-700 bg-slate-950/50 p-4 text-left transition hover:border-slate-500">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-semibold text-white">{card.title}</span>
                    <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${getStatusClass(status)}`}>{status === "N/A" ? "N/A" : status}</span>
                  </div>
                  <div className="mt-5 text-2xl font-bold text-white">{card.score ? `${Math.round(card.score)}%` : "N/A"}</div>
                  <div className="mt-3 h-2 rounded-full bg-slate-800">
                    <div className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-500" style={{ width: card.score ? `${Math.min(100, Math.max(0, card.score))}%` : "0%" }} />
                  </div>
                  <p className="mt-3 text-xs text-slate-300">{card.insight}</p>
                </button>
              );
            })}
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-2">
          <div className="rounded-2xl border border-slate-700/80 bg-slate-900/75 p-5">
            <p className="text-[11px] uppercase tracking-[0.26em] text-slate-400">Energy Intelligence</p>
            {energyTrend.length ? (
              <div className="mt-5 h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={energyTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="label" stroke="#94a3b8" tick={{ fontSize: 10 }} />
                    <YAxis stroke="#94a3b8" tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Bar dataKey="usage" radius={[6, 6, 0, 0]} fill="#60a5fa" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="mt-5 text-sm text-slate-400">Energy data unavailable</p>
            )}
          </div>

          <div className="rounded-2xl border border-slate-700/80 bg-slate-900/75 p-5">
            <div className="flex items-center justify-between gap-3">
              <p className="text-[11px] uppercase tracking-[0.26em] text-slate-400">Predictive Maintenance</p>
              <button onClick={() => navigate("/maintenance")} className="inline-flex items-center gap-1 text-xs font-medium text-blue-300 hover:text-blue-200">View Maintenance <ArrowRight className="h-3.5 w-3.5" /></button>
            </div>
            <div className="mt-4 grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={maintenanceDonut} dataKey="value" innerRadius={38} outerRadius={62} paddingAngle={3} stroke="rgba(15,23,42,0.6)">
                      {maintenanceDonut.map((entry, index) => (
                        <Cell key={entry.name} fill={["#34d399", "#fbbf24", "#f87171"][index]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-3">
                <div className="rounded-xl border border-slate-700 bg-slate-950/50 p-3">
                  <div className="text-xs uppercase tracking-[0.2em] text-slate-400">Healthy</div>
                  <div className="mt-1 text-2xl font-semibold text-white">{machineRecords.length ? healthyMachines : "N/A"}</div>
                </div>
                <div className="rounded-xl border border-slate-700 bg-slate-950/50 p-3">
                  <div className="text-xs uppercase tracking-[0.2em] text-slate-400">Warning</div>
                  <div className="mt-1 text-2xl font-semibold text-white">{machineRecords.length ? warningMachines : "N/A"}</div>
                </div>
                <div className="rounded-xl border border-slate-700 bg-slate-950/50 p-3">
                  <div className="text-xs uppercase tracking-[0.2em] text-slate-400">Critical</div>
                  <div className="mt-1 text-2xl font-semibold text-white">{machineRecords.length ? criticalMachines : "N/A"}</div>
                </div>
              </div>
            </div>
            <div className="mt-5">
              <div className="mb-2 text-xs uppercase tracking-[0.2em] text-slate-400">Top maintenance risks</div>
              <div className="space-y-2">
                {maintenanceAlerts.length ? maintenanceAlerts.map((alert: any, index: number) => (
                  <div key={`${alert.machineId ?? "machine"}-${index}`} className="flex items-start justify-between gap-3 rounded-xl border border-slate-700 bg-slate-950/50 p-3">
                    <div>
                      <div className="text-sm font-medium text-white">{alert.machineId ?? "Machine"}</div>
                      <div className="mt-1 text-xs text-slate-300">{alert.message ?? alert.reason ?? "Maintenance attention required."}</div>
                    </div>
                    <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${getStatusClass(alert.severity ?? "WARNING")}`}>{alert.severity ?? "WARNING"}</span>
                  </div>
                )) : <p className="text-sm text-slate-400">No active maintenance alerts.</p>}
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-2">
          <div className="rounded-2xl border border-slate-700/80 bg-slate-900/75 p-5">
            <p className="text-[11px] uppercase tracking-[0.26em] text-slate-400">Occupancy Intelligence</p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <InfoChip label="Current occupancy" value={occupancyKpis.latestActiveReading ? String(occupancyKpis.latestActiveReading) : "N/A"} />
              <InfoChip label="Average occupancy" value={occupancyKpis.averageOccupancy ? `${occupancyKpis.averageOccupancy.toFixed(1)}` : "N/A"} />
              <InfoChip label="Peak occupancy" value={occupancyKpis.peakOccupancy ? String(occupancyKpis.peakOccupancy) : "N/A"} />
              <InfoChip label="Utilization %" value={occupancyKpis.utilizationPercent ? `${occupancyKpis.utilizationPercent.toFixed(0)}%` : "N/A"} />
            </div>
            <div className="mt-4 rounded-xl border border-slate-700 bg-slate-950/50 p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-300">Status</span>
                <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${getStatusClass(getOccupancyStatusLabel(occupancyKpis.utilizationPercent))}`}>
                  {occupancyKpis.utilizationPercent ? getOccupancyStatusLabel(occupancyKpis.utilizationPercent) : "N/A"}
                </span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-700/80 bg-slate-900/75 p-5">
            <p className="text-[11px] uppercase tracking-[0.26em] text-slate-400">Security Intelligence</p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <InfoChip label="Total events" value={securityAnalysis ? String(securityAnalysis.totalSessions) : "N/A"} />
              <InfoChip label="Attack detected" value={securityAnalysis ? String(securityAnalysis.detectedAttacks) : "N/A"} />
              <InfoChip label="Risk %" value={securityAnalysis ? `${securityAnalysis.attackRate}%` : "N/A"} />
              <InfoChip label="Risk status" value={securityAnalysis ? securityAnalysis.riskLevel : "N/A"} />
            </div>
            <div className="mt-4 rounded-xl border border-slate-700 bg-slate-950/50 p-3">
              <div className="mb-3 text-xs uppercase tracking-[0.2em] text-slate-400">Recent critical events</div>
              {securityResult?.report?.topIncidents?.length ? (
                <div className="space-y-2">
                  {securityResult.report.topIncidents.slice(0, 3).map((incident: any, index: number) => (
                    <div key={`${incident.sessionId ?? "session"}-${index}`} className="flex items-center justify-between gap-3 text-sm text-slate-300">
                      <span>{incident.sessionId ?? "Session"}</span>
                      <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${getStatusClass(incident.severity ?? "INFO")}`}>{incident.severity ?? "INFO"}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-400">No recent critical events.</p>
              )}
            </div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-2">
          <div className="rounded-2xl border border-slate-700/80 bg-slate-900/75 p-5">
            <p className="text-[11px] uppercase tracking-[0.26em] text-slate-400">Cost Optimization</p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <InfoChip label="Total cost" value={costMetrics ? formatCurrency(costMetrics.totalCost) : "N/A"} />
              <InfoChip label="Potential savings" value={costMetrics ? formatCurrency(costMetrics.totalSavingsOpportunity) : "N/A"} />
              <InfoChip label="Savings %" value={costMetrics ? formatPercent(costMetrics.projectedSavingsRoi) : "N/A"} />
              <InfoChip label="Budget utilization" value={costMetrics ? formatPercent(costMetrics.budgetUtilization) : "N/A"} />
            </div>
            {costTrend.length ? (
              <div className="mt-5 h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={costTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="month" stroke="#94a3b8" tick={{ fontSize: 10 }} />
                    <YAxis stroke="#94a3b8" tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Bar dataKey="actual" fill="#60a5fa" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="optimized" fill="#34d399" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="mt-5 text-sm text-slate-400">Cost data unavailable</p>
            )}
          </div>

          <div className="rounded-2xl border border-slate-700/80 bg-slate-900/75 p-5">
            <p className="text-[11px] uppercase tracking-[0.26em] text-slate-400">AI Executive Recommendations</p>
            <div className="mt-5 space-y-3">
              {recommendations.length ? recommendations.map((item: any, index: number) => (
                <div key={`${item.milestone}-${index}`} className="rounded-xl border border-slate-700 bg-slate-950/50 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${getStatusClass(item.severity)}`}>{item.severity}</span>
                    <span className="text-[10px] uppercase tracking-[0.2em] text-slate-400">{item.milestone}</span>
                  </div>
                  <div className="mt-2 text-sm font-semibold text-white">{item.recommendation}</div>
                  <div className="mt-1 text-xs text-slate-300">{item.reason}</div>
                  <button onClick={() => navigate(item.action)} className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-blue-300 hover:text-blue-200">Open {item.milestone === "M1" ? "Energy" : item.milestone === "M2" ? "Maintenance" : item.milestone === "M3" ? "Operations" : "Cost"} <ArrowRight className="h-3.5 w-3.5" /></button>
                </div>
              )) : <p className="text-sm text-slate-400">No recommendations available.</p>}
            </div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-2xl border border-slate-700/80 bg-slate-900/75 p-5">
            <p className="text-[11px] uppercase tracking-[0.26em] text-slate-400">AI Agent Activity</p>
            <div className="mt-5 space-y-3">
              <AgentRow title="Energy Agent" detail={totalEnergyUsage !== null ? `Energy consumption analyzed` : "Energy data not loaded yet"} timestamp="Recent activity" />
              <AgentRow title="Maintenance Agent" detail={machineRecords.length ? `${criticalMachines} critical machines detected` : "Maintenance signals unavailable"} timestamp="Recent activity" />
              <AgentRow title="Occupancy Agent" detail={occupancyKpis.latestActiveReading ? `Latest occupancy reading ${occupancyKpis.latestActiveReading}` : "Occupancy signal pending"} timestamp="Recent activity" />
              <AgentRow title="Security Agent" detail={securityAnalysis ? `${securityAnalysis.detectedAttacks} security events analyzed` : "Security signal pending"} timestamp="Recent activity" />
              <AgentRow title="Cost Optimization Agent" detail={costMetrics ? `${formatCurrency(costMetrics.totalSavingsOpportunity)} savings opportunity identified` : "Cost signal pending"} timestamp="Recent activity" />
            </div>
          </div>

          <div className="rounded-2xl border border-slate-700/80 bg-slate-900/75 p-5">
            <p className="text-[11px] uppercase tracking-[0.26em] text-slate-400">Priority Alerts</p>
            <div className="mt-5 space-y-3">
              {priorityAlerts.length ? priorityAlerts.map((alert: any, index: number) => (
                <div key={`${alert.agent}-${index}`} className="rounded-xl border border-slate-700 bg-slate-950/50 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium text-white">{alert.agent}</span>
                    <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${getStatusClass(alert.severity)}`}>{alert.severity}</span>
                  </div>
                  <div className="mt-2 text-sm text-slate-200">{alert.alert}</div>
                  <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
                    <span>{alert.metric}</span>
                    <button onClick={() => navigate(alert.action)} className="inline-flex items-center gap-1 text-blue-300 hover:text-blue-200">Open <ArrowRight className="h-3 w-3" /></button>
                  </div>
                </div>
              )) : <p className="text-sm text-slate-400">No priority alerts.</p>}
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-700/80 bg-slate-900/75 p-5">
          <p className="text-[11px] uppercase tracking-[0.26em] text-slate-400">Facility Performance Overview</p>
          <div className="mt-5 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[
                { name: "Energy", value: totalEnergyUsage !== null && averagePUE !== null ? Math.min(100, Math.max(0, 100 - ((averagePUE - 1) * 90))) : 0 },
                { name: "Maintenance", value: avgMachineHealth !== null ? avgMachineHealth : 0 },
                { name: "Occupancy", value: occupancyKpis.utilizationPercent ? Math.min(100, Math.max(0, 100 - occupancyKpis.utilizationPercent)) : 0 },
                { name: "Security", value: securityAnalysis ? securityAnalysis.securityScore : 0 },
                { name: "Cost", value: costMetrics ? Math.min(100, Math.max(0, 100 - costMetrics.budgetUtilization)) : 0 },
              ]}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="name" stroke="#94a3b8" tick={{ fontSize: 10 }} />
                <YAxis stroke="#94a3b8" tick={{ fontSize: 10 }} domain={[0, 100]} />
                <Tooltip />
                <Bar dataKey="value" radius={[8, 8, 0, 0]} fill="#34d399" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-700/80 bg-slate-900/75 p-5">
          <p className="text-[11px] uppercase tracking-[0.26em] text-slate-400">Quick Actions</p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            {quickActions.map((action) => (
              <button key={action.label} onClick={() => navigate(action.path)} className="flex items-center justify-between rounded-xl border border-slate-700 bg-slate-950/50 px-4 py-3 text-left text-sm font-medium text-slate-200 transition hover:border-blue-500/50 hover:bg-slate-800">
                <span>{action.label}</span>
                <ArrowRight className="h-4 w-4 text-blue-300" />
              </button>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

type MilestoneCardProps = {
  milestone: string;
  title: string;
  description: string;
  metrics: Array<{ label: string; value: string }>;
  actionLabel: string;
  actionPath: string;
  secondaryActionLabel?: string;
  secondaryActionPath?: string;
};

const MilestoneCard = ({ milestone, title, description, metrics, actionLabel, actionPath, secondaryActionLabel, secondaryActionPath }: MilestoneCardProps) => {
  const navigate = useNavigate();

  return (
    <div className="rounded-2xl border border-slate-700 bg-slate-950/50 p-4">
      <div className="flex items-center justify-between gap-3">
        <span className="text-[10px] uppercase tracking-[0.22em] text-blue-300">{milestone}</span>
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/10 text-blue-200">
          {milestone === "M1" ? <Zap className="h-4 w-4" /> : milestone === "M2" ? <Wrench className="h-4 w-4" /> : milestone === "M3" ? <Activity className="h-4 w-4" /> : <DollarSign className="h-4 w-4" />}
        </span>
      </div>
      <h3 className="mt-3 text-lg font-semibold text-white">{title}</h3>
      <p className="mt-2 text-sm text-slate-300">{description}</p>
      <div className="mt-4 space-y-2">
        {metrics.map((metric, index) => (
          <div key={`${metric.label}-${index}`} className="flex items-center justify-between gap-3 text-sm text-slate-300">
            <span>{metric.label}</span>
            <span className="font-medium text-white">{metric.value}</span>
          </div>
        ))}
      </div>
      <div className="mt-5 flex flex-wrap gap-2">
        <button onClick={() => navigate(actionPath)} className="inline-flex items-center gap-2 rounded-xl bg-blue-500/15 px-3 py-2 text-xs font-semibold text-blue-200 hover:bg-blue-500/20">{actionLabel}<ArrowRight className="h-3.5 w-3.5" /></button>
        {secondaryActionLabel && secondaryActionPath && (
          <button onClick={() => navigate(secondaryActionPath)} className="inline-flex items-center gap-2 rounded-xl border border-slate-600 bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-200 hover:border-slate-500">{secondaryActionLabel}<ArrowRight className="h-3.5 w-3.5" /></button>
        )}
      </div>
    </div>
  );
};

const InfoChip = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-xl border border-slate-700 bg-slate-950/50 p-3">
    <div className="text-[10px] uppercase tracking-[0.18em] text-slate-400">{label}</div>
    <div className="mt-2 text-xl font-semibold text-white">{value}</div>
  </div>
);

const AgentRow = ({ title, detail, timestamp }: { title: string; detail: string; timestamp: string }) => (
  <div className="flex items-start justify-between gap-3 rounded-xl border border-slate-700 bg-slate-950/50 p-3">
    <div className="flex items-start gap-3">
      <span className="mt-0.5 rounded-full bg-emerald-500/10 p-2 text-emerald-200">
        <CheckCircle2 className="h-3.5 w-3.5" />
      </span>
      <div>
        <div className="text-sm font-medium text-white">{title}</div>
        <div className="mt-1 text-xs text-slate-300">{detail}</div>
      </div>
    </div>
    <div className="text-[10px] uppercase tracking-[0.18em] text-slate-400">{timestamp}</div>
  </div>
);

const getOccupancyStatusLabel = (utilization?: number) => {
  if (utilization === undefined || utilization === null || Number.isNaN(utilization)) return "N/A";
  if (utilization >= 85) return "Critical";
  if (utilization >= 65) return "Warning";
  if (utilization >= 40) return "Normal";
  return "Healthy";
};
