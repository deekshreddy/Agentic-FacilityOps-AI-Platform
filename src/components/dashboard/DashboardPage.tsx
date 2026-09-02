import { useMemo } from "react";

import {
  Bolt,
  Activity,
  DollarSign,
  HeartPulse,
  Wrench,
} from "lucide-react";

import { KpiCard } from "../../components/kpi/KpiCard";

import { useDashboardData } from "../../hooks/useDashboardData";
import { useMaintenanceData } from "../../hooks/useMaintenanceData";

import {
  buildMachineRecords,
  generateAlerts,
  buildMaintenanceSchedule,
  failureRate,
} from "../../services/maintenanceServiceImpl";

import * as dc from "../../services/dataCenterService";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from "recharts";

const CHART_COLORS = [
  "#60a5fa",
  "#34d399",
  "#f472b6",
  "#f59e0b",
  "#a78bfa",
];

export const DashboardPage = () => {
  const dashboardResult = useDashboardData();
  const maintenanceResult = useMaintenanceData();

  /*
   * ============================================================
   * DATA
   * ============================================================
   */

  const data = Array.isArray(dashboardResult?.data)
    ? dashboardResult.data
    : [];

  const maintenanceData = Array.isArray(
    maintenanceResult?.data
  )
    ? maintenanceResult.data
    : [];

  const loading = Boolean(
    dashboardResult?.loading
  );

  const maintenanceLoading = Boolean(
    maintenanceResult?.loading
  );

  const error = dashboardResult?.error;

  const maintenanceError =
    maintenanceResult?.error;

  /*
   * ============================================================
   * CALCULATIONS
   * ============================================================
   */

  const computed = useMemo(() => {
    /*
     * ==========================================================
     * M1 - ENERGY INTELLIGENCE
     * ==========================================================
     */

    const totalEnergyUsage =
      dc.totalElectricityUsage(data) || 0;

    const averagePUE =
      dc.averagePUE(data) || 0;

    const totalWaterUsage =
      dc.totalWaterUsage(data) || 0;

    const averageCapacity =
      dc.averageCapacity(data) || 0;

    const totalFacilities =
      dc.totalFacilities(data) || 0;

    /*
     * ==========================================================
     * ELECTRICITY
     * ==========================================================
     */

    const electricityValues =
      data
        .map((record: any) =>
          Number(
            record?.Daily_Electricity_Usage_MWh ??
              record?.dailyElectricityUsageMwh ??
              record?.daily_electricity_usage_mwh ??
              0
          )
        )
        .filter(
          (value: number) =>
            Number.isFinite(value) &&
            value > 0
        );

    const electricityAverage =
      electricityValues.length > 0
        ? electricityValues.reduce(
            (sum, value) =>
              sum + value,
            0
          ) / electricityValues.length
        : 0;

    /*
     * ==========================================================
     * HIGH ENERGY
     * ==========================================================
     */

    const highEnergy =
      data.filter((record: any) => {
        const electricity =
          Number(
            record?.Daily_Electricity_Usage_MWh ??
              record?.dailyElectricityUsageMwh ??
              record?.daily_electricity_usage_mwh ??
              0
          );

        return (
          electricity >
          electricityAverage * 1.2
        );
      });

    /*
     * ==========================================================
     * INEFFICIENT FACILITIES
     * ==========================================================
     */

    const inefficientFacilities =
      data.filter((record: any) => {
        const pue =
          Number(
            record?.PUE ??
              record?.pue ??
              0
          );

        return pue > 1.5;
      });

    /*
     * ==========================================================
     * WATER RISK
     * ==========================================================
     */

    const waterRiskFacilities =
      data.filter((record: any) => {
        const stress = String(
          record?.Surrounding_Water_Stress_Tier ??
            record?.surroundingWaterStressTier ??
            record?.surrounding_water_stress_tier ??
            ""
        ).toLowerCase();

        return stress.includes("high");
      });

    /*
     * ==========================================================
     * ENERGY INSIGHTS
     * ==========================================================
     */

    const energyInsights: string[] = [];

    if (highEnergy.length > 0) {
      energyInsights.push(
        `${highEnergy.length} facilities are consuming significantly higher electricity than average.`
      );
    }

    if (inefficientFacilities.length > 0) {
      energyInsights.push(
        `${inefficientFacilities.length} facilities have a PUE above 1.5 and may require efficiency optimization.`
      );
    }

    if (waterRiskFacilities.length > 0) {
      energyInsights.push(
        `${waterRiskFacilities.length} facilities are located in high water-stress regions.`
      );
    }

    if (energyInsights.length === 0) {
      energyInsights.push(
        "All monitored facilities are currently operating within normal efficiency ranges."
      );
    }

    /*
     * ==========================================================
     * M1 CHART DATA
     * ==========================================================
     */

    let electricityByYear: any[] = [];
    let waterByYear: any[] = [];
    let pueTrend: any[] = [];
    let capacityByFacility: any[] = [];
    let facilityTypeDist: any[] = [];
    let coolingDist: any[] = [];
    let waterStress: any[] = [];
    let countryDist: any[] = [];
    let cityDist: any[] = [];

    try {
      electricityByYear =
        dc.trendByYear(
          data,
          "dailyElectricityUsageMwh"
        ) || [];
    } catch {
      electricityByYear = [];
    }

    try {
      waterByYear =
        dc.trendByYear(
          data,
          "dailyWaterUsageGallons"
        ) || [];
    } catch {
      waterByYear = [];
    }

    try {
      pueTrend =
        dc.trendByYear(
          data,
          "pue"
        ) || [];
    } catch {
      pueTrend = [];
    }

    try {
      capacityByFacility =
        dc.capacityByFacility(
          data
        ) || [];
    } catch {
      capacityByFacility = [];
    }

    try {
      facilityTypeDist =
        dc.distributionByField(
          data,
          "facilityType"
        ) || [];
    } catch {
      facilityTypeDist = [];
    }

    try {
      coolingDist =
        dc.distributionByField(
          data,
          "coolingSystemType"
        ) || [];
    } catch {
      coolingDist = [];
    }

    try {
      waterStress =
        dc.distributionByField(
          data,
          "surroundingWaterStressTier"
        ) || [];
    } catch {
      waterStress = [];
    }

    try {
      countryDist =
        dc.distributionByField(
          data,
          "country"
        ) || [];
    } catch {
      countryDist = [];
    }

    try {
      cityDist =
        dc.distributionByField(
          data,
          "city"
        ) || [];
    } catch {
      cityDist = [];
    }

    /*
     * ==========================================================
     * M2 - PREDICTIVE MAINTENANCE
     *
     * IMPORTANT:
     * The dashboard now uses maintenanceServiceImpl.ts.
     * This makes Dashboard and Maintenance use the same
     * health/risk calculation.
     * ==========================================================
     */

    /*
     * Convert CSV-normalized records into the field names
     * expected by maintenanceServiceImpl.ts.
     */

    const machineInputData =
      maintenanceData.map(
        (record: any) => ({
          ...record,

          productId:
            record?.productId ??
            record?.product_id ??
            record?.Product_ID ??
            record?.ProductID ??
            record?.["Product ID"],

          machineType:
            record?.machineType ??
            record?.Type ??
            record?.type,

          airTemp:
            Number(
              record?.airTemp ??
                record?.air_temp ??
                record?.["Air temperature [K]"] ??
                0
            ),

          processTemp:
            Number(
              record?.processTemp ??
                record?.process_temp ??
                record?.[
                  "Process temperature [K]"
                ] ??
                0
            ),

          speed:
            Number(
              record?.speed ??
                record?.rotational_speed ??
                record?.[
                  "Rotational speed [rpm]"
                ] ??
                0
            ),

          torque:
            Number(
              record?.torque ??
                record?.["Torque [Nm]"] ??
                0
            ),

          toolWear:
            Number(
              record?.toolWear ??
                record?.tool_wear ??
                record?.["Tool wear [min]"] ??
                0
            ),

          target:
            record?.target ??
            record?.machine_failure ??
            record?.["Machine failure"] ??
            0,

          targetReal:
            record?.targetReal ??
            record?.target_real ??
            0,
        })
      );

    /*
     * Build machine records using the SAME implementation
     * used by the predictive maintenance module.
     */

    const machineRecords =
      buildMachineRecords(
        machineInputData as any
      );

    /*
     * ==========================================================
     * M2 COUNTS
     * ==========================================================
     */

    const totalMachines =
      machineRecords.length;

    const healthyMachines =
      machineRecords.filter(
        (machine: any) =>
          machine.healthStatus ===
          "Healthy"
      );

    const warningMachines =
      machineRecords.filter(
        (machine: any) =>
          machine.healthStatus ===
          "Warning"
      );

    const criticalMachines =
      machineRecords.filter(
        (machine: any) =>
          machine.healthStatus ===
          "Critical"
      );

    /*
     * ==========================================================
     * ACTUAL FAILURE
     * ==========================================================
     */

    const failureRecords =
      machineRecords.filter(
        (machine: any) =>
          Boolean(
            machine.observedFailure
          )
      );

    /*
     * ==========================================================
     * AVERAGE MACHINE HEALTH
     * ==========================================================
     */

    const avgMachineHealth =
      totalMachines > 0
        ? machineRecords.reduce(
            (
              sum: number,
              machine: any
            ) =>
              sum +
              Number(
                machine.healthScore ??
                  0
              ),
            0
          ) / totalMachines
        : 0;

    /*
     * ==========================================================
     * FAILURE RATE
     * ==========================================================
     */

    const machineFailureRate =
      failureRate(
        machineRecords as any
      );

    /*
     * ==========================================================
     * MAINTENANCE ALERTS
     * ==========================================================
     */

    const maintenanceAlerts =
      generateAlerts(
        machineRecords as any
      );

    /*
     * ==========================================================
     * MAINTENANCE SCHEDULE
     * ==========================================================
     */

    const maintenanceSchedule =
      buildMaintenanceSchedule(
        machineRecords as any
      );

    /*
     * ==========================================================
     * MACHINE STATUS DISTRIBUTION
     * ==========================================================
     */

    const machineStatusDistribution = [
      {
        name: "Healthy",
        value:
          healthyMachines.length,
      },
      {
        name: "Warning",
        value:
          warningMachines.length,
      },
      {
        name: "Critical",
        value:
          criticalMachines.length,
      },
    ];

    /*
     * ==========================================================
     * FAILURE DISTRIBUTION
     * ==========================================================
     */

    const failureDistribution = [
      {
        name: "Normal",
        value:
          Math.max(
            0,
            totalMachines -
              failureRecords.length
          ),
      },
      {
        name: "Failure",
        value:
          failureRecords.length,
      },
    ];

    /*
     * ==========================================================
     * MACHINE HEALTH DATA
     * ==========================================================
     */

    const machineHealthData =
      machineRecords.map(
        (
          record: any,
          index: number
        ) => ({
          name:
            record?.productId ??
            record?.product_id ??
            record?.Product_ID ??
            `Machine ${index + 1}`,

          health:
            Number(
              record?.healthScore ?? 0
            ),
        })
      );

    /*
     * ==========================================================
     * TOOL WEAR
     * ==========================================================
     */

    const toolWearData =
      machineRecords.map(
        (
          record: any,
          index: number
        ) => ({
          name:
            record?.productId ??
            record?.product_id ??
            record?.Product_ID ??
            `Machine ${index + 1}`,

          value:
            Number(
              record?.toolWear ??
                record?.tool_wear ??
                0
            ),
        })
      );

    /*
     * ==========================================================
     * TORQUE
     * ==========================================================
     */

    const torqueData =
      machineRecords.map(
        (
          record: any,
          index: number
        ) => ({
          name:
            record?.productId ??
            record?.product_id ??
            record?.Product_ID ??
            `Machine ${index + 1}`,

          value:
            Number(
              record?.torque ?? 0
            ),
        })
      );

    /*
     * ==========================================================
     * PREDICTED RISK
     * ==========================================================
     */

    const predictedRiskData =
      machineRecords.map(
        (
          record: any,
          index: number
        ) => ({
          name:
            record?.productId ??
            record?.product_id ??
            record?.Product_ID ??
            `Machine ${index + 1}`,

          value:
            Number(
              record?.predictedRisk ??
                0
            ),
        })
      );

    /*
     * ==========================================================
     * RECOMMENDATIONS
     *
     * These are generated directly from the same machine
     * records used for Dashboard KPIs.
     * ==========================================================
     */

    const maintenanceRecommendations: string[] =
      [];

    if (criticalMachines.length > 0) {
      maintenanceRecommendations.push(
        `${criticalMachines.length} machines are in critical condition and require immediate inspection.`
      );
    }

    if (failureRecords.length > 0) {
      maintenanceRecommendations.push(
        `${failureRecords.length} machines have actual failure indicators and require investigation.`
      );
    }

    if (warningMachines.length > 0) {
      maintenanceRecommendations.push(
        `${warningMachines.length} machines are showing warning conditions and should be monitored.`
      );
    }

    const highWearMachines =
      machineRecords.filter(
        (machine: any) =>
          Number(
            machine?.toolWear ?? 0
          ) > 70
      ).length;

    if (highWearMachines > 0) {
      maintenanceRecommendations.push(
        `${highWearMachines} machines have high tool wear and should be inspected.`
      );
    }

    if (
      maintenanceRecommendations.length ===
      0
    ) {
      maintenanceRecommendations.push(
        `${healthyMachines.length} machines are currently operating within the healthy range.`
      );
    }

    /*
     * ==========================================================
     * RETURN
     * ==========================================================
     */

    return {
      /*
       * M1
       */
      totalEnergyUsage,
      averagePUE,
      totalWaterUsage,
      averageCapacity,
      totalFacilities,

      highEnergy,
      inefficientFacilities,
      waterRiskFacilities,
      energyInsights,

      electricityByYear,
      waterByYear,
      pueTrend,
      capacityByFacility,

      facilityTypeDist,
      coolingDist,
      waterStress,
      countryDist,
      cityDist,

      /*
       * M2
       */
      totalMachines,

      avgMachineHealth,

      healthyMachines,
      warningMachines,
      criticalMachines,

      failureRecords,

      machineFailureRate,

      maintenanceAlerts,

      maintenanceSchedule,

      maintenanceRecommendations,

      machineStatusDistribution,

      failureDistribution,

      machineHealthData,

      toolWearData,

      torqueData,

      predictedRiskData,

      machineRecords,
    };
  }, [
    data,
    maintenanceData,
  ]);

  /*
   * ============================================================
   * LOADING
   * ============================================================
   */

  if (
    loading ||
    maintenanceLoading
  ) {
    return (
      <div className="flex min-h-[500px] items-center justify-center">
        <div className="text-center">

          <div className="text-xl font-semibold text-white">
            Loading FacilityOps datasets...
          </div>

          <div className="mt-2 text-sm text-slate-400">
            Loading energy and maintenance data
          </div>

        </div>
      </div>
    );
  }

  /*
   * ============================================================
   * ERROR
   * ============================================================
   */

  if (error) {
    return (
      <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-6">

        <h2 className="text-lg font-semibold text-red-400">
          Facility dataset error
        </h2>

        <p className="mt-2 text-sm text-red-300">
          {String(error)}
        </p>

      </div>
    );
  }

  if (maintenanceError) {
    return (
      <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-6">

        <h2 className="text-lg font-semibold text-red-400">
          Maintenance dataset error
        </h2>

        <p className="mt-2 text-sm text-red-300">
          {String(maintenanceError)}
        </p>

      </div>
    );
  }

  /*
   * ============================================================
   * PAGE
   * ============================================================
   */

  return (
    <div className="space-y-10">

      {/* ======================================================
          HEADER
      ====================================================== */}

      <div>

        <h1 className="text-3xl font-bold text-white">
          FacilityOps AI Dashboard
        </h1>

        <p className="mt-1 text-slate-400">
          Unified Energy Intelligence and Predictive Maintenance Platform
        </p>

        <p className="mt-2 text-xs text-slate-500">
          Facility records:{" "}
          {data.length}
          {" | "}
          Machine records:{" "}
          {maintenanceData.length}
        </p>

      </div>

      {/* ======================================================
          M1
      ====================================================== */}

      <section>

        <h2 className="text-2xl font-bold text-white">
          M1 — Energy Intelligence
        </h2>

        <p className="mt-1 text-sm text-slate-400">
          Energy monitoring, efficiency analysis and facility resource intelligence.
        </p>

        {/* M1 KPI */}

        <div className="mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-5">

          <KpiCard
            title="Total Facilities"
            value={String(
              computed.totalFacilities
            )}
            trend=""
            icon={
              <Bolt className="h-5 w-5" />
            }
            sparkline={<div />}
            accentClass="bg-blue-500/10 text-blue-200"
          />

          <KpiCard
            title="Average PUE"
            value={
              computed.averagePUE.toFixed(2)
            }
            trend=""
            icon={
              <Activity className="h-5 w-5" />
            }
            sparkline={<div />}
            accentClass="bg-emerald-500/10 text-emerald-200"
          />

          <KpiCard
            title="Electricity Usage"
            value={
              computed.totalEnergyUsage.toFixed(
                2
              ) +
              " MWh"
            }
            trend=""
            icon={
              <Bolt className="h-5 w-5" />
            }
            sparkline={<div />}
            accentClass="bg-amber-500/10 text-amber-200"
          />

          <KpiCard
            title="Water Usage"
            value={
              computed.totalWaterUsage.toLocaleString() +
              " gal"
            }
            trend=""
            icon={
              <DollarSign className="h-5 w-5" />
            }
            sparkline={<div />}
            accentClass="bg-violet-500/10 text-violet-200"
          />

          <KpiCard
            title="Average Capacity"
            value={
              computed.averageCapacity.toFixed(
                2
              ) +
              " MW"
            }
            trend=""
            icon={
              <HeartPulse className="h-5 w-5" />
            }
            sparkline={<div />}
            accentClass="bg-slate-700/10 text-slate-100"
          />

        </div>

        {/* M1 ALERTS */}

        <div className="mt-6 grid gap-5 md:grid-cols-3">

          <MetricCard
            title="High Energy Facilities"
            value={
              computed.highEnergy.length
            }
            color="text-amber-400"
            description="Consuming significantly above average."
          />

          <MetricCard
            title="Inefficient Facilities"
            value={
              computed.inefficientFacilities.length
            }
            color="text-red-400"
            description="Facilities with PUE above 1.5."
          />

          <MetricCard
            title="Water Risk Facilities"
            value={
              computed.waterRiskFacilities.length
            }
            color="text-blue-400"
            description="Located in high water-stress regions."
          />

        </div>

        {/* M1 INSIGHTS */}

        <div className="mt-6 rounded-xl bg-slate-900 p-5">

          <h3 className="text-lg font-semibold text-white">
            Energy Agent Insights
          </h3>

          <div className="mt-4 space-y-3">

            {computed.energyInsights.map(
              (
                insight,
                index
              ) => (
                <div
                  key={index}
                  className="rounded-lg bg-slate-800 p-4 text-sm text-slate-300"
                >
                  {insight}
                </div>
              )
            )}

          </div>

        </div>

        {/* M1 CHARTS */}

        <div className="mt-6 grid gap-6 xl:grid-cols-2">

          <ChartCard
            title="Electricity Usage by Year"
            type="line"
            data={
              computed.electricityByYear
            }
          />

          <ChartCard
            title="Water Usage by Year"
            type="line"
            data={
              computed.waterByYear
            }
          />

          <ChartCard
            title="PUE Trend"
            type="line"
            data={
              computed.pueTrend
            }
          />

          <ChartCard
            title="Capacity by Facility"
            type="bar"
            data={
              computed.capacityByFacility
            }
          />

        </div>

        {/* M1 DISTRIBUTIONS */}

        <div className="mt-6 grid gap-6 xl:grid-cols-3">

          <DistributionChart
            title="Facility Type Distribution"
            data={
              computed.facilityTypeDist
            }
            prefix="facility"
          />

          <DistributionChart
            title="Cooling System Distribution"
            data={
              computed.coolingDist
            }
            prefix="cooling"
          />

          <DistributionChart
            title="Water Stress Tier"
            data={
              computed.waterStress
            }
            prefix="water"
          />

        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">

          <DistributionChart
            title="Country Distribution"
            data={
              computed.countryDist
            }
            prefix="country"
          />

          <DistributionChart
            title="City Distribution"
            data={
              computed.cityDist
            }
            prefix="city"
          />

        </div>

      </section>

      {/* ======================================================
          M2
      ====================================================== */}

      <section>

        <h2 className="text-2xl font-bold text-white">
          M2 — Predictive Maintenance
        </h2>

        <p className="mt-1 text-sm text-slate-400">
          Machine health monitoring, failure risk detection and preventive maintenance.
        </p>

        {/* ==================================================
            M2 KPI
        ================================================== */}

        <div className="mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-6">

          <MetricCard
            title="Total Machines"
            value={
              computed.totalMachines
            }
            color="text-white"
            description="All maintenance records loaded."
          />

          <MetricCard
            title="Healthy Machines"
            value={
              computed.healthyMachines.length
            }
            color="text-emerald-400"
            description="Machines with health score ≥ 90."
          />

          <MetricCard
            title="Warning Machines"
            value={
              computed.warningMachines.length
            }
            color="text-amber-400"
            description="Machines with health score from 70 to 89."
          />

          <MetricCard
            title="Critical Machines"
            value={
              computed.criticalMachines.length
            }
            color="text-red-400"
            description="Machines with health score below 70."
          />

          <MetricCard
            title="Failure Records"
            value={
              computed.failureRecords.length
            }
            color="text-red-500"
            description="Records with observed failure."
          />

          <MetricCard
            title="Average Machine Health"
            value={
              computed.avgMachineHealth.toFixed(
                1
              ) +
              "%"
            }
            color="text-blue-400"
            description="Average health score across all machines."
          />

        </div>

        {/* ==================================================
            FAILURE RATE
        ================================================== */}

        <div className="mt-6 grid gap-5 md:grid-cols-3">

          <MetricCard
            title="Failure Rate"
            value={
              computed.machineFailureRate +
              "%"
            }
            color="text-red-400"
            description="Percentage of machines with observed failure."
          />

          <MetricCard
            title="Maintenance Required"
            value={
              computed.maintenanceSchedule.length
            }
            color="text-amber-400"
            description="Machines requiring scheduled maintenance."
          />

          <MetricCard
            title="Active Alerts"
            value={
              computed.maintenanceAlerts.length
            }
            color="text-orange-400"
            description="Generated predictive maintenance alerts."
          />

        </div>

        {/* ==================================================
            M2 DISTRIBUTION
        ================================================== */}

        <div className="mt-6 grid gap-6 xl:grid-cols-2">

          <DistributionChart
            title="Machine Health Status — All Records"
            data={
              computed.machineStatusDistribution
            }
            prefix="machine-health"
          />

          <DistributionChart
            title="Actual Failure Distribution"
            data={
              computed.failureDistribution
            }
            prefix="machine-failure"
          />

        </div>

        {/* ==================================================
            MACHINE HEALTH
        ================================================== */}

        <div className="mt-6">

          <ChartCard
            title="Machine Health by Product — All Records"
            type="bar"
            data={
              computed.machineHealthData
            }
          />

        </div>

        {/* ==================================================
            SENSOR DATA
        ================================================== */}

        <div className="mt-6 grid gap-6 xl:grid-cols-2">

          <ChartCard
            title="Tool Wear by Machine — All Records"
            type="bar"
            data={
              computed.toolWearData
            }
          />

          <ChartCard
            title="Torque by Machine — All Records"
            type="bar"
            data={
              computed.torqueData
            }
          />

        </div>

        {/* ==================================================
            PREDICTED RISK
        ================================================== */}

        <div className="mt-6">

          <ChartCard
            title="Predicted Failure Risk by Machine"
            type="bar"
            data={
              computed.predictedRiskData
            }
          />

        </div>

        {/* ==================================================
            MAINTENANCE ALERTS
        ================================================== */}

        <div className="mt-6 rounded-xl bg-slate-900 p-5">

          <div className="flex items-center gap-3">

            <Wrench className="h-5 w-5 text-red-400" />

            <div>

              <h3 className="text-lg font-semibold text-white">
                Maintenance Agent Alerts
              </h3>

              <p className="text-sm text-slate-400">
                Machines requiring maintenance attention.
              </p>

            </div>

          </div>

          <div className="mt-4 space-y-3">

            {computed.maintenanceAlerts.length >
            0 ? (
              computed.maintenanceAlerts
                .slice(0, 15)
                .map(
                  (
                    alert: any,
                    index: number
                  ) => (
                    <div
                      key={
                        String(
                          alert.machineId ??
                            "machine"
                        ) +
                        "-" +
                        String(index)
                      }
                      className="flex flex-col gap-3 rounded-lg bg-slate-800 p-4 md:flex-row md:items-center md:justify-between"
                    >

                      <div>

                        <p className="font-medium text-white">
                          {alert.machineId}
                        </p>

                        <p className="mt-1 text-sm text-slate-400">
                          {alert.alertType}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          {alert.reason}
                        </p>

                      </div>

                      <div className="text-left md:text-right">

                        <p
                          className={
                            alert.severity ===
                            "CRITICAL"
                              ? "text-sm font-semibold text-red-400"
                              : "text-sm font-semibold text-amber-400"
                          }
                        >
                          {alert.severity}
                        </p>

                        <p className="mt-1 text-sm text-slate-300">
                          {alert.currentValue}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          {alert.recommendedAction}
                        </p>

                      </div>

                    </div>
                  )
                )
            ) : (
              <div className="rounded-lg bg-slate-800 p-4 text-slate-400">
                No maintenance alerts detected.
              </div>
            )}

          </div>

        </div>

        {/* ==================================================
            MAINTENANCE SCHEDULE
        ================================================== */}

        <div className="mt-6 rounded-xl bg-slate-900 p-5">

          <h3 className="text-lg font-semibold text-white">
            Predictive Maintenance Schedule
          </h3>

          <p className="mt-1 text-sm text-slate-400">
            Machines prioritized according to current health and predicted risk.
          </p>

          <div className="mt-4 space-y-3">

            {computed.maintenanceSchedule.length >
            0 ? (
              computed.maintenanceSchedule
                .slice(0, 15)
                .map(
                  (
                    item: any,
                    index: number
                  ) => (
                    <div
                      key={
                        String(
                          item.machineId
                        ) +
                        "-" +
                        String(index)
                      }
                      className="flex flex-col gap-3 rounded-lg bg-slate-800 p-4 md:flex-row md:items-center md:justify-between"
                    >

                      <div>

                        <p className="font-medium text-white">
                          {item.machineId}
                        </p>

                        <p className="mt-1 text-sm text-slate-400">
                          {item.recommendedMaintenance}
                        </p>

                      </div>

                      <div className="text-left md:text-right">

                        <p className="text-sm text-blue-400">
                          Health:{" "}
                          {Number(
                            item.currentHealth ??
                              0
                          ).toFixed(0)}
                          %
                        </p>

                        <p className="mt-1 text-sm text-amber-400">
                          Priority:{" "}
                          {item.priority}
                        </p>

                      </div>

                    </div>
                  )
                )
            ) : (
              <div className="rounded-lg bg-slate-800 p-4 text-slate-400">
                No maintenance currently scheduled.
              </div>
            )}

          </div>

        </div>

        {/* ==================================================
            RECOMMENDATIONS
        ================================================== */}

        <div className="mt-6 rounded-xl bg-slate-900 p-5">

          <h3 className="text-lg font-semibold text-white">
            Maintenance Agent Recommendations
          </h3>

          <p className="mt-1 text-sm text-slate-400">
            Recommended actions based on machine health, sensor conditions and failure risk.
          </p>

          <div className="mt-4 space-y-3">

            {computed.maintenanceRecommendations.map(
              (
                recommendation,
                index
              ) => (
                <div
                  key={index}
                  className="rounded-lg bg-slate-800 p-4 text-sm text-slate-300"
                >
                  {recommendation}
                </div>
              )
            )}

          </div>

        </div>

      </section>

    </div>
  );
};

/*
 * ============================================================
 * METRIC CARD
 * ============================================================
 */

type MetricCardProps = {
  title: string;
  value: number | string;
  color: string;
  description: string;
};

const MetricCard = ({
  title,
  value,
  color,
  description,
}: MetricCardProps) => {
  return (
    <div className="rounded-xl bg-slate-900 p-5">

      <h3 className="text-sm text-slate-400">
        {title}
      </h3>

      <p
        className={
          "mt-3 text-3xl font-bold " +
          color
        }
      >
        {value}
      </p>

      <p className="mt-2 text-sm text-slate-500">
        {description}
      </p>

    </div>
  );
};

/*
 * ============================================================
 * CHART CARD
 * ============================================================
 */

type ChartCardProps = {
  title: string;
  type: "line" | "bar";
  data: any[];
};

const ChartCard = ({
  title,
  type,
  data,
}: ChartCardProps) => {

  const safeData =
    Array.isArray(data)
      ? data
      : [];

  return (
    <div className="rounded-xl bg-slate-900 p-4">

      <h3 className="text-lg font-semibold text-white">
        {title}
      </h3>

      <div className="mt-2 h-[280px] w-full">

        {safeData.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-slate-500">
            No data available.
          </div>
        ) : (
          <ResponsiveContainer
            width="100%"
            height="100%"
          >

            {type === "line" ? (
              <LineChart
                data={safeData}
              >

                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#1f2937"
                />

                <XAxis
                  dataKey="timestamp"
                  stroke="#9CA3AF"
                />

                <YAxis
                  stroke="#9CA3AF"
                />

                <Tooltip />

                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#60a5fa"
                  strokeWidth={2}
                  dot={false}
                />

              </LineChart>
            ) : (
              <BarChart
                data={safeData}
              >

                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#1f2937"
                />

                <XAxis
                  dataKey="name"
                  stroke="#9CA3AF"
                  interval="preserveStartEnd"
                  angle={-45}
                  textAnchor="end"
                  height={90}
                />

                <YAxis
                  stroke="#9CA3AF"
                />

                <Tooltip />

                <Bar
                  dataKey={
                    safeData.some(
                      (item) =>
                        item?.health !==
                        undefined
                    )
                      ? "health"
                      : "value"
                  }
                  fill="#60a5fa"
                />

              </BarChart>
            )}

          </ResponsiveContainer>
        )}

      </div>

    </div>
  );
};

/*
 * ============================================================
 * DISTRIBUTION CHART
 * ============================================================
 */

type DistributionChartProps = {
  title: string;
  data: any[];
  prefix: string;
};

const DistributionChart = ({
  title,
  data,
  prefix,
}: DistributionChartProps) => {

  const safeData =
    Array.isArray(data)
      ? data
      : [];

  return (
    <div className="rounded-xl bg-slate-900 p-4">

      <h3 className="text-lg font-semibold text-white">
        {title}
      </h3>

      <div className="mt-2 h-[260px] w-full">

        {safeData.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-slate-500">
            No data available.
          </div>
        ) : (
          <ResponsiveContainer
            width="100%"
            height="100%"
          >

            <PieChart>

              <Pie
                data={safeData}
                dataKey="value"
                nameKey="name"
                outerRadius={85}
                label
              >

                {safeData.map(
                  (_, index) => (
                    <Cell
                      key={
                        prefix +
                        "-" +
                        String(index)
                      }
                      fill={
                        CHART_COLORS[
                          index %
                            CHART_COLORS.length
                        ]
                      }
                    />
                  )
                )}

              </Pie>

              <Tooltip />

            </PieChart>

          </ResponsiveContainer>
        )}

      </div>

    </div>
  );
};