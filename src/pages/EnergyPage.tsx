import React, { useMemo } from 'react';
import {
  Bolt,
  Activity,
  DollarSign,
  HeartPulse,
} from 'lucide-react';

import { useEnergyData } from '../hooks/useEnergyData';
import * as dc from '../services/dataCenterService';
import { KpiCard } from '../components/kpi/KpiCard';

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
} from 'recharts';

const CHART_COLORS = [
  '#60a5fa',
  '#34d399',
  '#f472b6',
  '#f59e0b',
  '#a78bfa',
];

/* ============================================================
   HELPERS
============================================================ */

const getValue = (
  record: any,
  ...keys: string[]
): any => {
  for (const key of keys) {
    if (
      record?.[key] !== undefined &&
      record?.[key] !== null &&
      record?.[key] !== ''
    ) {
      return record[key];
    }
  }

  return undefined;
};

const getNumber = (
  record: any,
  ...keys: string[]
): number => {
  const value = getValue(record, ...keys);
  const number = Number(value);

  return Number.isFinite(number) ? number : 0;
};

/* ============================================================
   ENERGY PAGE
============================================================ */

const EnergyPage = () => {
  const {
    data,
    loading,
    error,
  } = useEnergyData();

  /* ==========================================================
     CALCULATIONS
  ========================================================== */

  const computed = useMemo(() => {
    const totalElectricityUsage =
      dc.totalElectricityUsage(data) ?? 0;

    const averagePUE =
      dc.averagePUE(data) ?? 0;

    const totalWaterUsage =
      dc.totalWaterUsage(data) ?? 0;

    const averageCapacity =
      dc.averageCapacity(data) ?? 0;

    const totalFacilities =
      dc.totalFacilities(data) ?? 0;

    /* --------------------------------------------------------
       ELECTRICITY ANALYSIS
    -------------------------------------------------------- */

    const electricityValues = data
      .map((record) =>
        getNumber(
          record,
          'Daily_Electricity_Usage_MWh',
          'dailyElectricityUsageMwh',
          'dailyElectricityUsageMWh'
        )
      )
      .filter((value) => value > 0);

    const electricityAverage =
      electricityValues.length > 0
        ? electricityValues.reduce(
            (sum, value) => sum + value,
            0
          ) / electricityValues.length
        : 0;

    const highEnergy = data.filter((record) => {
      const electricity = getNumber(
        record,
        'Daily_Electricity_Usage_MWh',
        'dailyElectricityUsageMwh',
        'dailyElectricityUsageMWh'
      );

      return (
        electricity > electricityAverage * 1.2
      );
    });

    /* --------------------------------------------------------
       PUE ANALYSIS
    -------------------------------------------------------- */

    const inefficientFacilities = data.filter(
      (record) =>
        getNumber(
          record,
          'PUE',
          'pue'
        ) > 1.5
    );

    /* --------------------------------------------------------
       WATER STRESS
    -------------------------------------------------------- */

    const waterRiskFacilities = data.filter(
      (record) =>
        String(
          getValue(
            record,
            'Surrounding_Water_Stress_Tier',
            'surroundingWaterStressTier'
          ) ?? ''
        )
          .toLowerCase()
          .includes('high')
    );

    /* --------------------------------------------------------
       ENERGY INSIGHTS
    -------------------------------------------------------- */

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
        'All monitored facilities are currently operating within normal efficiency ranges.'
      );
    }

    /* --------------------------------------------------------
       M1 CHART DATA
    -------------------------------------------------------- */

    const electricityByYear =
      dc.trendByYear(
        data,
        'dailyElectricityUsageMwh'
      );

    const waterByYear =
      dc.trendByYear(
        data,
        'dailyWaterUsageGallons'
      );

    const pueTrend =
      dc.trendByYear(
        data,
        'pue'
      );

    const capacityByFacility =
      dc.capacityByFacility(data);

    const facilityTypeDist =
      dc.distributionByField(
        data,
        'facilityType'
      );

    const coolingDist =
      dc.distributionByField(
        data,
        'coolingSystemType'
      );

    const waterStress =
      dc.distributionByField(
        data,
        'surroundingWaterStressTier'
      );

    const countryDist =
      dc.distributionByField(
        data,
        'country'
      );

    const cityDist =
      dc.distributionByField(
        data,
        'city'
      );

    return {
      totalElectricityUsage,
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
    };
  }, [data]);

  /* ==========================================================
     LOADING
  ========================================================== */

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center text-slate-300">
        Loading Energy Intelligence data...
      </div>
    );
  }

  /* ==========================================================
     ERROR
  ========================================================== */

  if (error) {
    return (
      <div className="rounded-xl bg-red-500/10 p-6 text-red-400">
        Error loading energy dataset.
      </div>
    );
  }

  /* ==========================================================
     PAGE
  ========================================================== */

  return (
    <div className="space-y-8">

      {/* ======================================================
          HEADER
      ====================================================== */}

      <div>
        <h1 className="text-3xl font-bold text-white">
          Energy Intelligence
        </h1>

        <p className="mt-1 text-slate-400">
          Energy monitoring, efficiency analysis and facility
          resource intelligence.
        </p>

        <p className="mt-2 text-xs text-slate-500">
          Facility records: {data.length}
        </p>
      </div>

      {/* ======================================================
          M1 KPI CARDS
      ====================================================== */}

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-5">

        <KpiCard
          title="Total Facilities"
          value={`${computed.totalFacilities}`}
          trend=""
          icon={<Bolt className="h-5 w-5" />}
          sparkline={<div />}
          accentClass="bg-blue-500/10 text-blue-200"
        />

        <KpiCard
          title="Average PUE"
          value={computed.averagePUE.toFixed(2)}
          trend=""
          icon={<Activity className="h-5 w-5" />}
          sparkline={<div />}
          accentClass="bg-emerald-500/10 text-emerald-200"
        />

        <KpiCard
          title="Electricity Usage"
          value={`${computed.totalElectricityUsage.toFixed(2)} MWh`}
          trend=""
          icon={<Bolt className="h-5 w-5" />}
          sparkline={<div />}
          accentClass="bg-amber-500/10 text-amber-200"
        />

        <KpiCard
          title="Water Usage"
          value={`${computed.totalWaterUsage.toLocaleString()} gal`}
          trend=""
          icon={<DollarSign className="h-5 w-5" />}
          sparkline={<div />}
          accentClass="bg-violet-500/10 text-violet-200"
        />

        <KpiCard
          title="Average Capacity"
          value={`${computed.averageCapacity.toFixed(2)} MW`}
          trend=""
          icon={<HeartPulse className="h-5 w-5" />}
          sparkline={<div />}
          accentClass="bg-slate-700/10 text-slate-100"
        />

      </div>

      {/* ======================================================
          M1 ENERGY ALERTS
      ====================================================== */}

      <div className="grid gap-5 md:grid-cols-3">

        <MetricCard
          title="High Energy Facilities"
          value={computed.highEnergy.length}
          color="text-amber-400"
          description="Consuming significantly above average."
        />

        <MetricCard
          title="Inefficient Facilities"
          value={computed.inefficientFacilities.length}
          color="text-red-400"
          description="Facilities with PUE above 1.5."
        />

        <MetricCard
          title="Water Risk Facilities"
          value={computed.waterRiskFacilities.length}
          color="text-blue-400"
          description="Located in high water-stress regions."
        />

      </div>

      {/* ======================================================
          ENERGY AGENT INSIGHTS
      ====================================================== */}

      <div className="rounded-xl bg-slate-900 p-5">

        <h3 className="text-lg font-semibold text-white">
          🤖 Energy Agent Insights
        </h3>

        <div className="mt-4 space-y-3">

          {computed.energyInsights.map(
            (insight, index) => (
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

      {/* ======================================================
          M1 ENERGY CHARTS
      ====================================================== */}

      <div className="grid gap-6 xl:grid-cols-2">

        <ChartCard
          title="Electricity Usage by Year"
          type="line"
          data={computed.electricityByYear}
        />

        <ChartCard
          title="Water Usage by Year"
          type="line"
          data={computed.waterByYear}
        />

        <ChartCard
          title="PUE Trend"
          type="line"
          data={computed.pueTrend}
        />

        <ChartCard
          title="Capacity by Facility"
          type="bar"
          data={computed.capacityByFacility}
        />

      </div>

      {/* ======================================================
          M1 DISTRIBUTIONS
      ====================================================== */}

      <div className="grid gap-6 xl:grid-cols-3">

        <DistributionChart
          title="Facility Type Distribution"
          data={computed.facilityTypeDist}
          prefix="facility"
        />

        <DistributionChart
          title="Cooling System Distribution"
          data={computed.coolingDist}
          prefix="cooling"
        />

        <DistributionChart
          title="Water Stress Tier"
          data={computed.waterStress}
          prefix="water"
        />

      </div>

      {/* ======================================================
          COUNTRY + CITY
      ====================================================== */}

      <div className="grid gap-6 lg:grid-cols-2">

        <DistributionChart
          title="Country Distribution"
          data={computed.countryDist}
          prefix="country"
        />

        <DistributionChart
          title="City Distribution"
          data={computed.cityDist}
          prefix="city"
        />

      </div>

    </div>
  );
};

export default EnergyPage;

/* ============================================================
   METRIC CARD
============================================================ */

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
        className={`mt-3 text-3xl font-bold ${color}`}
      >
        {value}
      </p>

      <p className="mt-2 text-sm text-slate-500">
        {description}
      </p>

    </div>
  );
};

/* ============================================================
   CHART CARD
============================================================ */

type ChartCardProps = {
  title: string;
  type: 'line' | 'bar';
  data: any[];
};

const ChartCard = ({
  title,
  type,
  data,
}: ChartCardProps) => {
  return (
    <div className="rounded-xl bg-slate-900 p-4">

      <h3 className="text-lg font-semibold text-white">
        {title}
      </h3>

      <div className="mt-2 h-[260px] w-full">

        {data.length === 0 ? (

          <div className="flex h-full items-center justify-center text-sm text-slate-500">
            No data available.
          </div>

        ) : (

          <ResponsiveContainer
            width="100%"
            height="100%"
          >

            {type === 'line' ? (

              <LineChart data={data}>

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

              <BarChart data={data}>

                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#1f2937"
                />

                <XAxis
                  dataKey="name"
                  stroke="#9CA3AF"
                  interval={0}
                  angle={-30}
                  textAnchor="end"
                  height={70}
                />

                <YAxis
                  stroke="#9CA3AF"
                />

                <Tooltip />

                <Bar
                  dataKey="value"
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

/* ============================================================
   DISTRIBUTION CHART
============================================================ */

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
  return (
    <div className="rounded-xl bg-slate-900 p-4">

      <h3 className="text-lg font-semibold text-white">
        {title}
      </h3>

      <div className="mt-2 h-[240px] w-full">

        {data.length === 0 ? (

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
                data={data}
                dataKey="value"
                nameKey="name"
                outerRadius={80}
              >

                {data.map((_, index) => (
                  <Cell
                    key={`${prefix}-${index}`}
                    fill={
                      CHART_COLORS[
                        index % CHART_COLORS.length
                      ]
                    }
                  />
                ))}

              </Pie>

              <Tooltip />

            </PieChart>

          </ResponsiveContainer>

        )}

      </div>

    </div>
  );
};