import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Wallet,
  PiggyBank,
  Gauge,
  Scale,
  TrendingDown,
  Percent,
  Zap,
  Wrench,
  Shield,
  Users,
  Truck,
  HeartPulse,
  AlertTriangle,
  Lightbulb,
  FileText,
  LineChart as LineChartIcon,
  CheckCircle2,
  Activity,
  Building2,
  Bot,
} from 'lucide-react';
import { KpiCard } from '../components/kpi/KpiCard';
import { DonutChart } from '../charts/DonutChart';
import { LinePanel } from '../charts/LinePanel';
import { BarPanel } from '../charts/BarPanel';
import { MiniSparkline } from '../charts/MiniSparkline';
import {
  loadCostData,
  loadCrossAgentSources,
  buildCrossAgentSummary,
  getCostMetrics,
  getCostDistribution,
  getMonthlyCostTrend,
  getSavingsByCategory,
  getVendorUtilization,
  getFacilityCostComparison,
  getBudgetComplianceStatus,
  generateCostRecommendations,
  calculateFacilityHealth,
  detectCostAnomalies,
  buildCostForecast,
  generateFacilityIntelligence,
  formatCurrency,
  formatPercent,
} from '../services/costOptimizationService';
import type {
  CostRecord,
  CrossAgentSources,
  CrossAgentSummary,
  CostMetrics,
  BudgetCompliance,
  FacilityHealth,
} from '../services/costOptimizationService';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

const COST_COLORS = ['#3B82F6', '#F59E0B', '#10B981', '#8B5CF6', '#06B6D4'];

/* ---------------- small building blocks ---------------- */

const Panel = ({
  title,
  subtitle,
  children,
  className = '',
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 18 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.35 }}
    className={`rounded-[32px] border border-white/10 bg-slate-950/70 p-5 shadow-soft backdrop-blur-xl ${className}`}
  >
    <div className="mb-5">
      <p className="text-sm uppercase tracking-[0.3em] text-slate-500">{title}</p>
      {subtitle && <p className="mt-2 text-xl font-semibold text-white">{subtitle}</p>}
    </div>
    {children}
  </motion.div>
);

const Sparkline = ({ values, color }: { values: number[]; color: string }) => (
  <MiniSparkline
    color={color}
    data={values.map((v, i) => ({ timestamp: String(i), value: Number.isFinite(v) ? v : 0 }))}
  />
);

const HealthClass = (c: FacilityHealth['classification']): string =>
  c === 'Excellent'
    ? 'text-emerald-400'
    : c === 'Good'
      ? 'text-blue-400'
      : c === 'Moderate'
        ? 'text-amber-400'
        : c === 'Poor'
          ? 'text-orange-400'
          : 'text-red-400';

export const CostOptimizationPage = () => {
  const [records, setRecords] = useState<CostRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sources, setSources] = useState<CrossAgentSources | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await loadCostData();
        if (!data || data.length === 0) {
          throw new Error('No M4 cost records available in the dataset.');
        }
        if (!cancelled) setRecords(data);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Error loading M4 cost data.');
          setRecords([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    loadCrossAgentSources()
      .then((s) => {
        if (!cancelled) setSources(s);
      })
      .catch(() => {
        if (!cancelled)
          setSources({ energyTotalUsage: null, maintenance: null, occupancy: null, security: null });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  /* ---------------- derived analytics (all from CSV) ---------------- */

  const hasData = records.length > 0;
  const metrics: CostMetrics | null = useMemo(
    () => (hasData ? getCostMetrics(records) : null),
    [records, hasData]
  );
  const distribution = useMemo(() => (hasData ? getCostDistribution(records) : []), [records, hasData]);
  const monthly = useMemo(() => (hasData ? getMonthlyCostTrend(records) : []), [records, hasData]);
  const savings = useMemo(() => (hasData ? getSavingsByCategory(records) : []), [records, hasData]);
  const vendor = useMemo(() => (hasData ? getVendorUtilization(records) : null), [records, hasData]);
  const facilities = useMemo(() => (hasData ? getFacilityCostComparison(records) : []), [records, hasData]);
  const compliance: BudgetCompliance | null = useMemo(
    () => (hasData ? getBudgetComplianceStatus(records) : null),
    [records, hasData]
  );
  const recommendations = useMemo(
    () => (hasData ? generateCostRecommendations(records) : []),
    [records, hasData]
  );
  const anomalies = useMemo(() => (hasData ? detectCostAnomalies(records) : []), [records, hasData]);
  const forecast = useMemo(() => (hasData ? buildCostForecast(records) : []), [records, hasData]);
  const crossAgent: CrossAgentSummary = useMemo(
    () => buildCrossAgentSummary(sources ?? { energyTotalUsage: null, maintenance: null, occupancy: null, security: null }),
    [sources]
  );
  const health: FacilityHealth | null = useMemo(
    () =>
      hasData && sources
        ? calculateFacilityHealth(sources, records)
        : null,
    [records, sources, hasData]
  );
  const report = useMemo(
    () => (hasData && sources ? generateFacilityIntelligence(records, sources) : null),
    [records, sources, hasData]
  );

  const largestCategory =
    distribution.length > 0
      ? [...distribution].sort((a, b) => b.value - a.value)[0]
      : null;
  const largestShare =
    largestCategory && metrics && metrics.totalCost > 0
      ? (largestCategory.value / metrics.totalCost) * 100
      : 0;

  const monthlyCostSpark = monthly.map((m) => m.cost);
  const monthlyBudgetSpark = monthly.map((m) => m.budget);
  const monthlySavingsSpark = monthly.map((m) => m.savings);

  /* ---------------- states ---------------- */

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0B1120]">
        <div className="flex flex-col items-center gap-4 text-slate-300">
          <Activity className="h-8 w-8 animate-pulse text-blue-400" />
          <p className="text-lg font-medium">Loading M4 cost intelligence…</p>
        </div>
      </div>
    );
  }

  if (error && !hasData) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0B1120] p-6">
        <div className="max-w-lg rounded-[32px] border border-red-500/30 bg-red-500/5 p-8 text-center">
          <AlertTriangle className="mx-auto h-10 w-10 text-red-400" />
          <h2 className="mt-4 text-xl font-semibold text-white">Error loading M4 cost data</h2>
          <p className="mt-3 text-sm text-slate-300">{error}</p>
          <p className="mt-2 text-xs text-slate-500">
            Verify that public/data/m4_cost_data.csv exists and contains the required columns.
          </p>
        </div>
      </div>
    );
  }

  if (!hasData || !metrics || !compliance) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0B1120] p-6">
        <div className="max-w-lg rounded-[32px] border border-amber-500/30 bg-amber-500/5 p-8 text-center">
          <AlertTriangle className="mx-auto h-10 w-10 text-amber-400" />
          <h2 className="mt-4 text-xl font-semibold text-white">No data available</h2>
          <p className="mt-3 text-sm text-slate-300">
            The M4 dataset loaded but contains no usable cost records.
          </p>
        </div>
      </div>
    );
  }

  /* ---------------- dashboard ---------------- */

  return (
    <div className="min-h-screen bg-[#0B1120] px-4 py-6 text-slate-200 md:px-8">
      {/* HEADER */}
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-blue-400">Milestone 4</p>
          <h1 className="mt-2 text-2xl font-bold text-white md:text-3xl">
            M4 — Cost Optimization &amp; Enterprise Intelligence
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-400">
            Cross-agent financial intelligence, budget optimization and facility decision support.
          </p>
        </div>
        <div className="flex items-center gap-2 self-start rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-300">
          <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
          M4 Cost Intelligence Connected
        </div>
      </div>

      {/* TOP KPI ROW */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <KpiCard
          title="Total Operational Cost"
          value={formatCurrency(metrics.totalCost)}
          trend={`${metrics.recordCount} records · ${metrics.facilityCount} facilities`}
          icon={<Wallet className="h-5 w-5" />}
          sparkline={<Sparkline values={monthlyCostSpark} color="#3B82F6" />}
          accentClass="bg-blue-500/10 text-blue-200"
        />
        <KpiCard
          title="Total Budget"
          value={formatCurrency(metrics.totalBudget)}
          trend="Configured budget across all facilities"
          icon={<PiggyBank className="h-5 w-5" />}
          sparkline={<Sparkline values={monthlyBudgetSpark} color="#8B5CF6" />}
          accentClass="bg-purple-500/10 text-purple-200"
        />
        <KpiCard
          title="Budget Utilization"
          value={formatPercent(metrics.budgetUtilization)}
          trend={`Status: ${metrics.budgetStatus}`}
          icon={<Gauge className="h-5 w-5" />}
          sparkline={<Sparkline values={monthlyCostSpark} color="#F59E0B" />}
          accentClass="bg-amber-500/10 text-amber-200"
        />
        <KpiCard
          title="Budget Variance"
          value={formatCurrency(metrics.budgetVariance)}
          trend={metrics.budgetVariance >= 0 ? 'Under budget (positive)' : 'Over budget (negative)'}
          icon={<Scale className="h-5 w-5" />}
          sparkline={<Sparkline values={monthly.map((m) => m.budget - m.cost)} color="#10B981" />}
          accentClass="bg-emerald-500/10 text-emerald-200"
        />
        <KpiCard
          title="Potential Savings"
          value={formatCurrency(metrics.totalSavingsOpportunity)}
          trend="Identified savings opportunities"
          icon={<TrendingDown className="h-5 w-5" />}
          sparkline={<Sparkline values={monthlySavingsSpark} color="#10B981" />}
          accentClass="bg-emerald-500/10 text-emerald-200"
        />
        <KpiCard
          title="Projected Savings ROI"
          value={formatPercent(metrics.projectedSavingsRoi)}
          trend="Savings ÷ Total Cost — projected, not accounting ROI"
          icon={<Percent className="h-5 w-5" />}
          sparkline={<Sparkline values={monthlyCostSpark} color="#8B5CF6" />}
          accentClass="bg-purple-500/10 text-purple-200"
        />
      </div>

      {/* SECOND KPI ROW */}
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <KpiCard
          title="Energy Cost"
          value={formatCurrency(metrics.energyCost)}
          trend={formatPercent((metrics.energyCost / Math.max(1, metrics.totalCost)) * 100) + ' of total'}
          icon={<Zap className="h-5 w-5" />}
          sparkline={<Sparkline values={monthlyCostSpark} color="#3B82F6" />}
          accentClass="bg-blue-500/10 text-blue-200"
        />
        <KpiCard
          title="Maintenance Cost"
          value={formatCurrency(metrics.maintenanceCost)}
          trend={formatPercent((metrics.maintenanceCost / Math.max(1, metrics.totalCost)) * 100) + ' of total'}
          icon={<Wrench className="h-5 w-5" />}
          sparkline={<Sparkline values={monthlyCostSpark} color="#F59E0B" />}
          accentClass="bg-amber-500/10 text-amber-200"
        />
        <KpiCard
          title="Security Cost"
          value={formatCurrency(metrics.securityCost)}
          trend={formatPercent((metrics.securityCost / Math.max(1, metrics.totalCost)) * 100) + ' of total'}
          icon={<Shield className="h-5 w-5" />}
          sparkline={<Sparkline values={monthlyCostSpark} color="#10B981" />}
          accentClass="bg-emerald-500/10 text-emerald-200"
        />
        <KpiCard
          title="Vendor Cost"
          value={formatCurrency(metrics.vendorCost)}
          trend={`Vendor Cost Utilization: ${formatPercent(metrics.vendorCostShare)}`}
          icon={<Truck className="h-5 w-5" />}
          sparkline={<Sparkline values={monthlyCostSpark} color="#8B5CF6" />}
          accentClass="bg-purple-500/10 text-purple-200"
        />
        <KpiCard
          title="Occupancy Cost"
          value={formatCurrency(metrics.occupancyCost)}
          trend={formatPercent((metrics.occupancyCost / Math.max(1, metrics.totalCost)) * 100) + ' of total'}
          icon={<Users className="h-5 w-5" />}
          sparkline={<Sparkline values={monthlyCostSpark} color="#06B6D4" />}
          accentClass="bg-cyan-500/10 text-cyan-200"
        />
        <KpiCard
          title="Facility Health Score"
          value={health ? `${health.score.toFixed(0)} / 100` : '—'}
          trend={health ? health.classification : 'Waiting for cross-agent data…'}
          icon={<HeartPulse className="h-5 w-5" />}
          sparkline={<Sparkline values={monthlyCostSpark} color="#10B981" />}
          accentClass="bg-emerald-500/10 text-emerald-200"
        />
      </div>

      {/* COST ANALYSIS */}
      <div className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="xl:col-span-2">
          {distribution.length > 0 ? (
            <DonutChart
              data={distribution}
              colors={COST_COLORS}
              centerLabel={`Total operational cost: ${formatCurrency(metrics.totalCost)}`}
              subtitle="Cost Distribution"
            />
          ) : (
            <Panel title="Distribution" subtitle="Cost Distribution">
              <p className="py-12 text-center text-sm text-slate-400">No cost category data available.</p>
            </Panel>
          )}
        </div>
        <Panel title="Cost Summary" subtitle="Largest Cost Category">
          {largestCategory ? (
            <div className="space-y-4">
              <div className="rounded-2xl border border-blue-500/30 bg-blue-500/10 p-4">
                <p className="text-xs uppercase tracking-[0.25em] text-blue-300">Largest Cost Category</p>
                <p className="mt-1 text-2xl font-semibold text-white">{largestCategory.name}</p>
                <p className="mt-1 text-sm text-blue-200">
                  {formatPercent(largestShare)} of total operational cost
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Total Cost</p>
                <p className="mt-1 text-xl font-semibold text-white">{formatCurrency(metrics.totalCost)}</p>
              </div>
              <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4">
                <p className="text-xs uppercase tracking-[0.25em] text-emerald-300">Potential Savings</p>
                <p className="mt-1 text-xl font-semibold text-emerald-300">
                  {formatCurrency(metrics.totalSavingsOpportunity)}
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  Projected cost after savings: {formatCurrency(metrics.projectedCostAfterSavings)}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-400">No cost distribution available.</p>
          )}
        </Panel>
      </div>

      {/* BUDGET ANALYSIS */}
      <div className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="xl:col-span-2">
          {monthly.length > 0 ? (
            <LinePanel
              title="Budget Analysis"
              subtitle="Monthly Cost vs Budget"
              data={monthly.map((m) => ({ timestamp: m.month, actual: m.cost, predicted: m.budget }))}
            />
          ) : (
            <Panel title="Budget Analysis" subtitle="Monthly Cost vs Budget">
              <p className="py-12 text-center text-sm text-slate-400">No monthly trend data available.</p>
            </Panel>
          )}
        </div>
        <Panel title="Budget Compliance" subtitle={compliance.status}>
          <div className={`rounded-2xl border p-4 ${compliance.color}`}>
            <p className="text-xs uppercase tracking-[0.25em]">Compliance Status</p>
            <p className="mt-1 text-2xl font-semibold">{compliance.status}</p>
          </div>
          <div className="mt-4 space-y-3">
            {[
              { label: 'Budget', value: formatCurrency(compliance.budget) },
              { label: 'Actual Cost', value: formatCurrency(compliance.actual) },
              {
                label: 'Variance',
                value: `${formatCurrency(compliance.variance)} ${
                  compliance.variance >= 0 ? '(under)' : '(over)'
                }`,
              },
              { label: 'Utilization', value: formatPercent(compliance.utilization) },
            ].map((row) => (
              <div
                key={row.label}
                className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
              >
                <span className="text-sm text-slate-400">{row.label}</span>
                <span className="text-sm font-semibold text-white">{row.value}</span>
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs text-slate-500">
            UNDER &lt; 90% · NEAR 90–100% · OVER &gt; 100% budget utilization.
          </p>
        </Panel>
      </div>

      {/* FACILITY COMPARISON */}
      {facilities.length > 0 && (
        <div className="mt-6">
          <BarPanel
            title="Facility Intelligence"
            subtitle="Total Cost by Facility"
            data={facilities.map((f) => ({ name: f.facility_name, value: f.total_cost }))}
          />
        </div>
      )}

      {/* SAVINGS OPPORTUNITIES */}
      <div className="mt-6">
        <div className="mb-3 flex items-center gap-2">
          <TrendingDown className="h-5 w-5 text-emerald-400" />
          <h2 className="text-lg font-semibold text-white">Savings Opportunities</h2>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {savings.map((s) => (
            <motion.div
              key={s.title}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
              className="rounded-[32px] border border-white/10 bg-slate-950/70 p-5 shadow-soft backdrop-blur-xl"
            >
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">{s.title}</p>
              <p className="mt-3 text-2xl font-semibold text-emerald-300">
                {formatCurrency(s.savings)}
              </p>
              <div className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between text-slate-400">
                  <span>Current Cost</span>
                  <span className="text-white">{formatCurrency(s.currentCost)}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Projected Cost</span>
                  <span className="text-white">{formatCurrency(s.projectedCost)}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Savings %</span>
                  <span className="text-emerald-300">{formatPercent(s.savingsPercent)}</span>
                </div>
              </div>
              <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-white/5">
                <div
                  className="h-full rounded-full bg-emerald-500/70"
                  style={{ width: `${Math.min(100, Math.max(0, s.savingsPercent))}%` }}
                />
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* VENDOR ANALYSIS */}
      {vendor && (
        <div className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-3">
          <div className="xl:col-span-2">
            <Panel title="Vendor Analysis" subtitle="Vendor Cost Utilization">
              <p className="mb-4 text-xs text-slate-500">
                Vendor cost is used as the utilization proxy. The dataset does not contain vendor
                names, SLAs, contract utilization or vendor quality scores — no vendor performance
                is claimed.
              </p>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="rounded-2xl border border-purple-500/30 bg-purple-500/10 p-4">
                  <p className="text-xs uppercase tracking-[0.25em] text-purple-300">Vendor Cost</p>
                  <p className="mt-1 text-xl font-semibold text-white">{formatCurrency(vendor.vendorCost)}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Total Operational Cost</p>
                  <p className="mt-1 text-xl font-semibold text-white">{formatCurrency(vendor.totalCost)}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Vendor Cost %</p>
                  <p className="mt-1 text-xl font-semibold text-white">{formatPercent(vendor.share)}</p>
                </div>
              </div>
              <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
                <span className="mr-2 font-semibold text-purple-300">Recommendation:</span>
                {vendor.recommendation}
              </div>
            </Panel>
          </div>
          <Panel title="Resource Allocation" subtitle="Cost Share by Category">
            <div className="space-y-3">
              {distribution.map((d) => {
                const share = metrics.totalCost > 0 ? (d.value / metrics.totalCost) * 100 : 0;
                return (
                  <div key={d.name}>
                    <div className="mb-1 flex justify-between text-sm">
                      <span className="text-slate-400">{d.name}</span>
                      <span className="text-white">{formatPercent(share)}</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-white/5">
                      <div
                        className="h-full rounded-full bg-blue-500/70"
                        style={{ width: `${Math.min(100, Math.max(0, share))}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </Panel>
        </div>
      )}

      {/* CROSS-AGENT INTELLIGENCE */}
      <div className="mt-6">
        <div className="mb-3 flex items-center gap-2">
          <Bot className="h-5 w-5 text-blue-400" />
          <h2 className="text-lg font-semibold text-white">Cross-Agent Facility Intelligence</h2>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { name: 'Energy Agent', icon: <Zap className="h-5 w-5" />, data: crossAgent.energy, accent: 'text-blue-300' },
            { name: 'Maintenance Agent', icon: <Wrench className="h-5 w-5" />, data: crossAgent.maintenance, accent: 'text-amber-300' },
            { name: 'Occupancy Agent', icon: <Users className="h-5 w-5" />, data: crossAgent.occupancy, accent: 'text-emerald-300' },
            { name: 'Security Agent', icon: <Shield className="h-5 w-5" />, data: crossAgent.security, accent: 'text-purple-300' },
          ].map((agent) => (
            <motion.div
              key={agent.name}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
              className="rounded-[32px] border border-white/10 bg-slate-950/70 p-5 shadow-soft backdrop-blur-xl"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-white/5 p-3">{agent.icon}</div>
                  <p className="font-semibold text-white">{agent.name}</p>
                </div>
                {agent.data.available ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-amber-400" />
                )}
              </div>
              <p className="mt-4 text-xs uppercase tracking-[0.25em] text-slate-500">{agent.data.label}</p>
              <p className={`mt-2 text-sm font-medium ${agent.data.available ? agent.accent : 'text-slate-500'}`}>
                {agent.data.value}
              </p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* FACILITY HEALTH */}
      {health && (
        <div className="mt-6">
          <Panel title="Facility Health" subtitle="Composite Operational Score">
            <p className="mb-4 text-xs text-slate-500">
              Composite operational score generated from available project metrics (M1 energy, M2
              maintenance, M3 occupancy/security and M4 budget compliance). Unavailable sources
              have their weight redistributed — the score is never NaN.
            </p>
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <div className="flex flex-col items-center justify-center rounded-3xl border border-white/10 bg-white/5 p-6">
                <div className="relative flex h-40 w-40 items-center justify-center rounded-full border-4 border-blue-500/30 bg-blue-500/5">
                  <div className="text-center">
                    <p className="text-4xl font-bold text-white">{health.score.toFixed(0)}</p>
                    <p className="text-xs text-slate-400">/ 100</p>
                  </div>
                </div>
                <p className={`mt-4 text-lg font-semibold ${HealthClass(health.classification)}`}>
                  {health.classification}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  90+ Excellent · 75–89 Good · 60–74 Moderate · 40–59 Poor · &lt;40 Critical
                </p>
              </div>
              <div className="space-y-3 lg:col-span-2">
                {health.contributions.map((c) => (
                  <div key={c.source} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-white">{c.source}</span>
                      <span className="text-slate-400">
                        {c.available ? (
                          <>
                            {c.score.toFixed(0)} / 100 · weight {formatPercent(c.weight * 100)}
                          </>
                        ) : (
                          <span className="text-amber-400">Unavailable — weight redistributed</span>
                        )}
                      </span>
                    </div>
                    <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-white/5">
                      <div
                        className={`h-full rounded-full ${
                          c.score >= 75 ? 'bg-emerald-500/70' : c.score >= 50 ? 'bg-amber-500/70' : 'bg-red-500/70'
                        }`}
                        style={{ width: `${Math.min(100, Math.max(0, c.available ? c.score : 0))}%` }}
                      />
                    </div>
                    <p className="mt-2 text-xs text-slate-500">{c.detail}</p>
                  </div>
                ))}
              </div>
            </div>
          </Panel>
        </div>
      )}

      {/* COST ANOMALIES */}
      <div className="mt-6">
        <Panel title="Operational Anomaly Detection" subtitle="Cost Anomalies">
          <p className="mb-4 text-xs text-slate-500">
            Monthly operational cost compared with the average monthly cost. Anomalies flag when a
            month exceeds ±20% of the average — no anomaly records are fabricated.
          </p>
          {anomalies.length === 0 ? (
            <div className="flex items-center gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-300">
              <CheckCircle2 className="h-5 w-5" />
              No significant cost anomalies detected.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="text-xs uppercase tracking-[0.2em] text-slate-500">
                    <th className="px-3 py-3">Month</th>
                    <th className="px-3 py-3">Facility</th>
                    <th className="px-3 py-3">Actual Cost</th>
                    <th className="px-3 py-3">Average Cost</th>
                    <th className="px-3 py-3">Deviation</th>
                    <th className="px-3 py-3">Severity</th>
                  </tr>
                </thead>
                <tbody>
                  {anomalies.map((a) => (
                    <tr key={`${a.month}-${a.facility}`} className="border-t border-white/5">
                      <td className="px-3 py-3 text-white">{a.month}</td>
                      <td className="px-3 py-3 text-slate-300">{a.facility}</td>
                      <td className="px-3 py-3 text-white">{formatCurrency(a.actualCost)}</td>
                      <td className="px-3 py-3 text-slate-300">{formatCurrency(a.averageCost)}</td>
                      <td className={`px-3 py-3 font-medium ${a.deviationPct > 0 ? 'text-red-400' : 'text-blue-400'}`}>
                        {a.deviationPct > 0 ? '+' : ''}
                        {a.deviationPct.toFixed(1)}%
                      </td>
                      <td className="px-3 py-3">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            a.severity === 'Critical'
                              ? 'bg-red-500/10 text-red-300'
                              : 'bg-amber-500/10 text-amber-300'
                          }`}
                        >
                          {a.severity}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      </div>

      {/* FORECAST */}
      <div className="mt-6">
        {forecast.length > 0 ? (
          <div className="rounded-[32px] border border-white/10 bg-slate-950/70 p-5 shadow-soft backdrop-blur-xl">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Forecasting</p>
                <p className="mt-2 text-xl font-semibold text-white">Operational Cost Forecast</p>
              </div>
              <div className="flex items-center gap-4 text-xs text-slate-400">
                <span className="flex items-center gap-2">
                  <span className="h-1 w-6 rounded-full bg-blue-500" /> Historical Cost
                </span>
                <span className="flex items-center gap-2">
                  <span className="h-1 w-6 rounded-full bg-purple-400" /> Forecast Cost
                </span>
              </div>
            </div>
            <div className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={forecast}>
                  <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                  <XAxis dataKey="label" tick={{ fill: '#94A3B8', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#94A3B8', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ background: '#111827', border: '1px solid rgba(255,255,255,.1)' }}
                    formatter={(value: number | string) => formatCurrency(Number(value))}
                  />
                  <Line
                    type="monotone"
                    dataKey="actual"
                    stroke="#3B82F6"
                    strokeWidth={3}
                    dot={false}
                    connectNulls={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="predicted"
                    stroke="#8B5CF6"
                    strokeWidth={3}
                    strokeDasharray="6 6"
                    dot
                    connectNulls={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <p className="mt-4 text-xs text-slate-500">
              Forecast based on historical operational cost trend (3-month moving average).
              Estimated based on historical cost trend — not a guaranteed projection.
            </p>
          </div>
        ) : (
          <Panel title="Forecasting" subtitle="Operational Cost Forecast">
            <p className="text-sm text-slate-400">Not enough monthly history to produce a forecast.</p>
          </Panel>
        )}
      </div>

      {/* AI RECOMMENDATIONS */}
      <div className="mt-6">
        <div className="mb-3 flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-amber-400" />
          <h2 className="text-lg font-semibold text-white">Cost Optimization Agent Recommendations</h2>
        </div>
        {recommendations.length === 0 ? (
          <Panel title="Recommendations" subtitle="Cost Optimization Agent">
            <p className="text-sm text-slate-400">No recommendations available for the current dataset.</p>
          </Panel>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {recommendations.map((r, i) => (
              <motion.div
                key={`${r.title}-${i}`}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35 }}
                className={`rounded-[24px] border p-5 ${
                  r.severity === 'critical'
                    ? 'border-red-500/30 bg-red-500/5'
                    : r.severity === 'warning'
                    ? 'border-amber-500/30 bg-amber-500/5'
                    : r.severity === 'success'
                    ? 'border-emerald-500/30 bg-emerald-500/5'
                    : 'border-blue-500/30 bg-blue-500/5'
                }`}
              >
                <div className="flex items-center gap-2">
                  {r.severity === 'critical' ? (
                    <AlertTriangle className="h-4 w-4 text-red-400" />
                  ) : r.severity === 'warning' ? (
                    <AlertTriangle className="h-4 w-4 text-amber-400" />
                  ) : r.severity === 'success' ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  ) : (
                    <LineChartIcon className="h-4 w-4 text-blue-400" />
                  )}
                  <p className="font-semibold text-white">{r.title}</p>
                </div>
                <p className="mt-2 text-sm text-slate-300">{r.message}</p>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* FACILITY INTELLIGENCE REPORT */}
      {report && (
        <div className="mt-6 mb-10">
          <Panel title="Executive Summary" subtitle="Facility Intelligence Report">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-slate-500">
                  <Building2 className="h-4 w-4" /> Overall Health
                </p>
                <p className={`mt-2 text-2xl font-semibold ${HealthClass(report.overallHealth.classification)}`}>
                  {report.overallHealth.score.toFixed(0)} / 100 · {report.overallHealth.classification}
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-slate-500">
                  <Gauge className="h-4 w-4" /> Budget Status
                </p>
                <p className={`mt-2 text-2xl font-semibold ${
                  report.budgetStatus.status === 'OVER BUDGET'
                    ? 'text-red-400'
                    : report.budgetStatus.status === 'NEAR BUDGET'
                    ? 'text-amber-400'
                    : 'text-emerald-400'
                }`}>
                  {report.budgetStatus.status}
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  Utilization {formatPercent(report.budgetStatus.utilization)} · Variance{' '}
                  {formatCurrency(report.budgetStatus.variance)}
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-slate-500">
                  <TrendingDown className="h-4 w-4" /> Largest Cost Driver
                </p>
                <p className="mt-2 text-2xl font-semibold text-white">{report.largestCostDriver}</p>
                <p className="mt-1 text-xs text-slate-400">
                  {formatPercent(report.largestCostDriverShare)} of total operational cost
                </p>
              </div>
              <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-4">
                <p className="flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-emerald-300">
                  <PiggyBank className="h-4 w-4" /> Potential Savings
                </p>
                <p className="mt-2 text-2xl font-semibold text-emerald-300">
                  {formatCurrency(report.potentialSavings)}
                </p>
              </div>
              <div className="rounded-2xl border border-purple-500/30 bg-purple-500/5 p-4">
                <p className="flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-purple-300">
                  <Percent className="h-4 w-4" /> Projected ROI
                </p>
                <p className="mt-2 text-2xl font-semibold text-purple-300">
                  {formatPercent(report.projectedRoi)}
                </p>
                <p className="mt-1 text-xs text-slate-400">Projected Savings ROI (savings ÷ cost)</p>
              </div>
              <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4">
                <p className="flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-amber-300">
                  <AlertTriangle className="h-4 w-4" /> Major Anomaly
                </p>
                <p className="mt-2 text-sm text-slate-300">{report.majorAnomaly}</p>
              </div>
              <div className="rounded-2xl border border-blue-500/30 bg-blue-500/5 p-4 md:col-span-2 xl:col-span-3">
                <p className="flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-blue-300">
                  <FileText className="h-4 w-4" /> Top Recommendation
                </p>
                <p className="mt-2 text-sm text-slate-300">{report.topRecommendation}</p>
              </div>
            </div>
            <p className="mt-5 text-xs text-slate-500">
              All values on this dashboard are calculated dynamically from
              public/data/m4_cost_data.csv and the existing M1/M2/M3 project datasets — no
              hardcoded or placeholder KPIs.
            </p>
          </Panel>
        </div>
      )}
    </div>
  );
};

export default CostOptimizationPage;
