/* ============================================================
   M3 OCCUPANCY INTELLIGENCE AGENT
   Consumes calculated dataset analytics (NO fabricated text)
   and produces: summary, warnings, insights, peak analysis,
   space optimization recommendations.
   ============================================================ */

import {
  OccupancyRecord,
  OccupancyKPIs,
  ZoneMetrics,
  OvercrowdingAlert,
  buildZoneMetrics,
  computeOccupancyKPIs,
  detectOvercrowding,
} from "../services/occupancyService";
import { UTILIZATION_THRESHOLDS } from "../config/occupancyThresholds";

export interface AgentInsight {
  kind: "SUMMARY" | "RISK" | "INSIGHT" | "RECOMMENDATION" | "PEAK";
  message: string;
}

export interface OccupancyAgentResult {
  kpis: OccupancyKPIs;
  zones: ZoneMetrics[];
  alerts: OvercrowdingAlert[];
  insights: AgentInsight[];
  generatedAt: string;
}

export const runOccupancyAgent = (
  records: OccupancyRecord[]
): OccupancyAgentResult => {
  const kpis = computeOccupancyKPIs(records);
  const zones = buildZoneMetrics(records);
  const alerts = detectOvercrowding(records);
  const insights: AgentInsight[] = [];

  if (records.length === 0) {
    return {
      kpis,
      zones,
      alerts,
      insights: [
        {
          kind: "SUMMARY",
          message:
            "No occupancy records available. Load the occupancy dataset to generate insights.",
        },
      ],
      generatedAt: new Date().toISOString(),
    };
  }

  /* ---- SUMMARY ---- */
  insights.push({
    kind: "SUMMARY",
    message: `Across ${records.length.toLocaleString()} monitored readings, the facility is currently hosting ${kpis.totalOccupants} occupants with ${kpis.utilizationPercent}% overall space utilization and ${kpis.availableCapacity} seats available.`,
  });

  /* ---- PEAK ---- */
  insights.push({
    kind: "PEAK",
    message: `Peak occupancy of ${kpis.peakOccupancy} people was recorded at ${kpis.peakOccupancyTime}.`,
  });

  /* ---- RISK (from real overcrowding detection) ---- */
  const critical = alerts.filter(
    (a) => a.severity === "CRITICAL" || a.severity === "HIGH"
  );
  if (critical.length > 0) {
    insights.push({
      kind: "RISK",
      message: `${critical.length} zone(s) at critical/high load: ${critical
        .map((a) => `${a.zone} (${a.utilization}%)`)
        .join(", ")}. Immediate redistribution advised.`,
    });
  } else if (alerts.length > 0) {
    insights.push({
      kind: "RISK",
      message: `Elevated but manageable load detected in ${alerts
        .map((a) => a.zone)
        .join(", ")}.`,
    });
  } else {
    insights.push({
      kind: "RISK",
      message:
        "No zone is above the configured overcrowding warning threshold.",
    });
  }

  /* ---- INSIGHT: busiest vs quietest zone ---- */
  if (zones.length >= 2) {
    const sorted = [...zones].sort((a, b) => b.utilization - a.utilization);
    const busiest = sorted[0];
    const quietest = sorted[sorted.length - 1];
    insights.push({
      kind: "INSIGHT",
      message: `${busiest.zoneName} has the highest utilization (${busiest.utilization}%, avg ${busiest.avgUtilization}% across the day) while ${quietest.zoneName} is the least used (${quietest.utilization}%).`,
    });
  }

  /* ---- RECOMMENDATIONS (derived from metrics) ---- */
  const underutilized = zones.filter((z) => z.status === "Low");
  const overloaded = zones.filter(
    (z) => z.status === "High" || z.status === "Critical"
  );

  if (overloaded.length > 0 && underutilized.length > 0) {
    insights.push({
      kind: "RECOMMENDATION",
      message: `Redistribute occupants from ${overloaded
        .map((z) => z.zoneName)
        .join(", ")} to available capacity in ${underutilized
          .map((z) => z.zoneName)
          .join(", ")}.`,
    });
  }

  underutilized.forEach((zone) => {
    insights.push({
      kind: "RECOMMENDATION",
      message: `${zone.zoneName} (${zone.floor}) is underutilized at ${zone.utilization}% — consider relocating activities or consolidating teams here.`,
    });
  });

  overloaded.forEach((zone) => {
    insights.push({
      kind: "RECOMMENDATION",
      message: `${zone.zoneName} is approaching capacity (${zone.utilization}%, peak ${zone.peakOccupancy} at ${zone.peakHour}). Prepare overflow space or cap new entries during peak hours.`,
    });
  });

  /* floor-level peak identification */
  const floorLoad = new Map<string, number>();
  zones.forEach((z) => {
    floorLoad.set(z.floor, (floorLoad.get(z.floor) ?? 0) + z.occupancy);
  });
  const busiestFloor = [...floorLoad.entries()].sort(
    (a, b) => b[1] - a[1]
  )[0];
  if (busiestFloor) {
    insights.push({
      kind: "INSIGHT",
      message: `${busiestFloor[0]} carries the highest current load (${busiestFloor[1]} occupants).`,
    });
  }

  return {
    kpis,
    zones,
    alerts,
    insights,
    generatedAt: new Date().toISOString(),
  };
};
