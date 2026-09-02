/* ============================================================
   SECURITY AGENT — Milestone 3
   Consumes dataset-derived analytics from securityService and
   produces structured intelligence (no fabricated text).
   ============================================================ */

import {
  SecurityRecord,
  SecurityAnalysis,
  analyzeSecurity,
  SecurityIncident,
} from "../services/securityService";

export interface SecurityAgentReport {
  analysis: SecurityAnalysis;
  summary: string;
  risks: string[];
  recommendations: string[];
  topIncidents: SecurityIncident[];
  threatMix: Array<{ name: string; value: number }>;
}

export const runSecurityAgent = (
  records: SecurityRecord[]
): SecurityAgentReport => {
  const analysis = analyzeSecurity(records);

  const summary =
    analysis.totalSessions === 0
      ? "No security sessions available."
      : `${analysis.totalSessions.toLocaleString()} sessions analyzed — ${analysis.detectedAttacks.toLocaleString()} detected attacks (${analysis.attackRate}%), ${analysis.suspiciousSessions.toLocaleString()} suspicious sessions, average IP reputation ${analysis.averageIpReputation}. Overall risk: ${analysis.riskLevel}.`;

  const risks: string[] = [];

  if (analysis.criticalIncidents > 0) {
    risks.push(
      `${analysis.criticalIncidents} CRITICAL incident(s): brute-force patterns combining detected attacks, 3+ failed logins and low IP reputation.`
    );
  }
  if (analysis.unusualTimeCount > 0) {
    risks.push(
      `${analysis.unusualTimeCount.toLocaleString()} session(s) occurred at unusual hours — potential off-hours intrusion attempts.`
    );
  }
  if (analysis.averageIpReputation < 0.35) {
    risks.push(
      `Average IP reputation is low (${analysis.averageIpReputation}) — a large share of traffic comes from untrusted sources.`
    );
  }
  if (analysis.encryptedShare < 80) {
    risks.push(
      `Only ${analysis.encryptedShare}% of sessions use AES/DES encryption — the remainder transmit unencrypted.`
    );
  }

  if (risks.length === 0) {
    risks.push("No elevated risk indicators detected in the current dataset.");
  }

  const threatMix = [
    { name: "Detected attacks", value: analysis.detectedAttacks },
    {
      name: "Suspicious (non-attack)",
      value: Math.max(0, analysis.suspiciousSessions - analysis.detectedAttacks),
    },
    { name: "Unusual-time access", value: analysis.unusualTimeCount },
    {
      name: "Failed-login sessions",
      value: analysis.failedLoginAttempts,
    },
  ];

  return {
    analysis,
    summary,
    risks,
    recommendations: analysis.recommendations,
    topIncidents: analysis.incidents.slice(0, 8),
    threatMix,
  };
};
