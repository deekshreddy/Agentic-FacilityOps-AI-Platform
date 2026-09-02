import {
  Users,
  AlertTriangle,
  DoorOpen,
  Clock,
  Gauge,
  Activity,
} from "lucide-react";
import { OccupancyKPIs } from "../../services/occupancyService";
import {
  getOccupancyStatus,
  OccupancyStatusResult,
} from "../../config/occupancyThresholds";

interface Props {
  kpis: OccupancyKPIs;
}

const STATUS_BADGE: Record<OccupancyStatusResult["level"], string> = {
  Low: "bg-emerald-500/15 text-emerald-300",
  Medium: "bg-blue-500/20 text-blue-300",
  High: "bg-amber-500/25 text-amber-300",
  Critical: "bg-rose-500/30 text-rose-300",
};

export const OccupancyKPICards = ({ kpis }: Props) => {
  const overall = getOccupancyStatus(kpis.utilizationPercent);
  const isHistoricalZero =
    kpis.latestReading === 0 && kpis.latestActiveReading > 0;

  const cards = [
    {
      title: "Total Occupants",
      value: kpis.totalOccupants.toLocaleString(),
      sub: isHistoricalZero
        ? `Latest active reading · ${kpis.latestActiveReadingTime}`
        : `Latest reading · ${kpis.latestActiveReadingTime}`,
      tooltip: `Most recent dataset record with occupancy > 0. The newest chronological record reads ${kpis.latestReading} occupants (${kpis.latestReadingTime}) — historical data, not live.`,
      icon: Users,
      accent: "text-blue-400 bg-blue-500/10",
    },
    {
      title: "Average Occupancy",
      value: kpis.averageOccupancy.toFixed(2),
      sub: `≈ ${kpis.averageUtilization}% of ${kpis.facilityCapacity} capacity`,
      tooltip: "Mean of Room_Occupancy_Count across all records in the dataset.",
      icon: Activity,
      accent: "text-sky-400 bg-sky-500/10",
    },
    {
      title: "Peak Occupancy",
      value: String(kpis.peakOccupancy),
      sub: `at ${kpis.peakOccupancyTime}`,
      tooltip: `Math.max of all occupancy values in the dataset (peak utilization ${kpis.peakUtilization}%).`,
      icon: Clock,
      accent: "text-amber-400 bg-amber-500/10",
    },
    {
      title: "Available Capacity",
      value: kpis.availableCapacity.toLocaleString(),
      sub: `of ${kpis.facilityCapacity} configurable capacity`,
      tooltip: `facilityCapacity − latestActiveOccupancy = ${kpis.facilityCapacity} − ${kpis.latestActiveReading}.`,
      icon: DoorOpen,
      accent: "text-cyan-400 bg-cyan-500/10",
    },
    {
      title: "Space Utilization",
      value: `${kpis.utilizationPercent}%`,
      sub: `${kpis.activeZones} active zone(s) · avg ${kpis.averageUtilization}%`,
      tooltip: `(latestActiveOccupancy / facilityCapacity) × 100 = (${kpis.latestActiveReading} / ${kpis.facilityCapacity}) × 100.`,
      icon: Gauge,
      accent: "text-violet-400 bg-violet-500/10",
    },
    {
      title: "Overall Status",
      value: overall.level,
      sub: overall.label,
      badge: STATUS_BADGE[overall.level],
      tooltip: "Calculated from the shared 0-39 Low / 40-69 Medium / 70-89 High / 90+ Critical thresholds.",
      icon: AlertTriangle,
      accent: "text-rose-400 bg-rose-500/10",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.title}
            title={card.tooltip}
            className="group rounded-2xl border border-slate-800 bg-slate-900/60 p-4 backdrop-blur transition-colors hover:border-slate-700"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-slate-500">
                  {card.title}
                </p>
                <p className="mt-2 text-2xl font-bold text-white">
                  {card.value}
                </p>
                <p className="mt-1 truncate text-xs text-slate-400" title={card.sub}>
                  {card.sub}
                </p>
                {card.badge && (
                  <span
                    className={`mt-2 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${card.badge}`}
                  >
                    {overall.level} utilization
                  </span>
                )}
              </div>
              <div className={`shrink-0 rounded-xl p-2.5 ${card.accent}`}>
                <Icon className="h-5 w-5" />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
