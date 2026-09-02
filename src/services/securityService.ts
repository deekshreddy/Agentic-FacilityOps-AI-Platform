/* ============================================================
   SECURITY SERVICE — Milestone 3
   REAL DATASET: public/data/cybersecurity_intrusion_data.csv
   COLUMNS (verified):
   session_id, network_packet_size, protocol_type,
   login_attempts, session_duration, encryption_used,
   ip_reputation_score, failed_logins, browser_type,
   unusual_time_access, attack_detected
   ============================================================ */

export interface SecurityRecord {
  session_id?: string;
  network_packet_size?: string | number;
  protocol_type?: string;
  login_attempts?: string | number;
  session_duration?: string | number;
  encryption_used?: string;
  ip_reputation_score?: string | number;
  failed_logins?: string | number;
  browser_type?: string;
  unusual_time_access?: string | number;
  attack_detected?: string | number;
  [key: string]: string | number | undefined;
}

const DATASET_PATH = "/data/cybersecurity_intrusion_data.csv";

const toNum = (v: unknown): number => {
  const n = typeof v === "number" ? v : Number(String(v ?? "").trim());
  return Number.isFinite(n) ? n : 0;
};

const isTruthyFlag = (v: unknown): boolean => {
  const s = String(v ?? "").trim().toLowerCase();
  return s === "1" || s === "true" || s === "yes";
};

/* ------------------------------------------------------------
   LOADER
------------------------------------------------------------ */

export const loadSecurityData = async (): Promise<SecurityRecord[]> => {
  const response = await fetch(DATASET_PATH, { cache: "no-store" });

  if (!response.ok) {
    throw new Error(
      `Unable to load security dataset: ${response.status}`
    );
  }

  const text = await response.text();

  if (!text.trim()) {
    throw new Error("Security CSV is empty.");
  }

  const lines = text
    .replace(/\r/g, "")
    .split("\n")
    .filter((l) => l.trim() !== "");

  if (lines.length < 2) {
    throw new Error("Security CSV contains no data rows.");
  }

  const headers = lines[0].split(",").map((h) =>
    h.replace(/^\uFEFF/, "").replace(/^"|"$/g, "").trim()
  );

  if (!headers.includes("attack_detected")) {
    throw new Error(
      "attack_detected column not found in the security CSV."
    );
  }

  const records: SecurityRecord[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(",").map((v) => v.trim());
    const record: SecurityRecord = {};
    let hasData = false;

    headers.forEach((header, idx) => {
      const raw = values[idx] ?? "";
      if (raw !== "") hasData = true;

      const numeric = [
        "network_packet_size",
        "login_attempts",
        "session_duration",
        "ip_reputation_score",
        "failed_logins",
        "unusual_time_access",
        "attack_detected",
      ];

      record[header] = numeric.includes(header)
        ? toNum(raw)
        : raw.replace(/^"|"$/g, "");
    });

    if (hasData) records.push(record);
  }

  if (records.length === 0) {
    throw new Error("No valid security records were found.");
  }

  return records;
};

/* ------------------------------------------------------------
   RISK SCORING (per session, data-derived)
------------------------------------------------------------ */

export type Severity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export interface SecurityIncident {
  id: string;
  sessionId: string;
  severity: Severity;
  type: string;
  message: string;
  protocol: string;
  browser: string;
  failedLogins: number;
  ipReputation: number;
  unusualTime: boolean;
}

const sessionRisk = (r: SecurityRecord): number => {
  let risk = 0;
  risk += Math.min(30, toNum(r.failed_logins) * 8);
  risk += Math.min(20, toNum(r.login_attempts) * 2);
  const rep = toNum(r.ip_reputation_score);
  if (rep < 0.2) risk += 25;
  else if (rep < 0.35) risk += 12;
  if (isTruthyFlag(r.unusual_time_access)) risk += 15;
  if (isTruthyFlag(r.attack_detected)) risk += 25;
  return Math.min(100, risk);
};

export const getRiskLevel = (
  attackRate: number,
  avgReputation: number
): Severity => {
  if (attackRate >= 60 || avgReputation < 0.2) return "CRITICAL";
  if (attackRate >= 45) return "HIGH";
  if (attackRate >= 25) return "MEDIUM";
  return "LOW";
};

/* ------------------------------------------------------------
   MAIN ANALYSIS
------------------------------------------------------------ */

export interface SecurityAnalysis {
  totalSessions: number;
  detectedAttacks: number;
  suspiciousSessions: number;
  failedLoginAttempts: number;
  averageIpReputation: number;
  attackRate: number;
  criticalIncidents: number;
  riskLevel: Severity;
  securityScore: number;
  unusualTimeCount: number;
  encryptedShare: number;
  protocolDistribution: Array<{ name: string; value: number }>;
  browserDistribution: Array<{ name: string; value: number }>;
  incidents: SecurityIncident[];
  recommendations: string[];
}

export const analyzeSecurity = (
  records: SecurityRecord[]
): SecurityAnalysis => {
  const totalSessions = records.length;

  if (totalSessions === 0) {
    return {
      totalSessions: 0,
      detectedAttacks: 0,
      suspiciousSessions: 0,
      failedLoginAttempts: 0,
      averageIpReputation: 0,
      attackRate: 0,
      criticalIncidents: 0,
      riskLevel: "LOW",
      securityScore: 100,
      unusualTimeCount: 0,
      encryptedShare: 0,
      protocolDistribution: [],
      browserDistribution: [],
      incidents: [],
      recommendations: ["No security data available."],
    };
  }

  const attacks = records.filter((r) => isTruthyFlag(r.attack_detected));
  const unusual = records.filter((r) => isTruthyFlag(r.unusual_time_access));
  const lowRep = records.filter((r) => toNum(r.ip_reputation_score) < 0.2);
  const heavyFailed = records.filter((r) => toNum(r.failed_logins) >= 3);

  const suspiciousSet = new Set<string>();
  lowRep.forEach((r) => r.session_id && suspiciousSet.add(String(r.session_id)));
  heavyFailed.forEach((r) =>
    r.session_id && suspiciousSet.add(String(r.session_id))
  );
  unusual.forEach((r) =>
    r.session_id && suspiciousSet.add(String(r.session_id))
  );

  const failedLoginAttempts = records.reduce(
    (sum, r) => sum + toNum(r.failed_logins),
    0
  );

  const averageIpReputation = Number(
    (
      records.reduce((s, r) => s + toNum(r.ip_reputation_score), 0) /
      totalSessions
    ).toFixed(3)
  );

  const attackRate = Number(
    ((attacks.length / totalSessions) * 100).toFixed(1)
  );

  const riskLevel = getRiskLevel(attackRate, averageIpReputation);

  const securityScore = Math.max(0, Math.round(100 - attackRate));

  const countBy = (key: "protocol_type" | "browser_type") => {
    const map = new Map<string, number>();
    records.forEach((r) => {
      const v = String(r[key] ?? "Unknown");
      map.set(v, (map.get(v) ?? 0) + 1);
    });
    return Array.from(map.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  };

  /* ---------------- INCIDENT FEED (from real rows) ---------------- */

  const incidents: SecurityIncident[] = [];

  records.forEach((r) => {
    const sid = String(r.session_id ?? "unknown");
    const failed = toNum(r.failed_logins);
    const rep = toNum(r.ip_reputation_score);
    const unusualTime = isTruthyFlag(r.unusual_time_access);
    const attacked = isTruthyFlag(r.attack_detected);

    if (attacked && failed >= 3 && rep < 0.2) {
      incidents.push({
        id: `${sid}-crit`,
        sessionId: sid,
        severity: "CRITICAL",
        type: "Brute-force pattern",
        message: `${sid}: attack detected with ${failed} failed logins and IP reputation ${rep.toFixed(2)}.`,
        protocol: String(r.protocol_type ?? "—"),
        browser: String(r.browser_type ?? "—"),
        failedLogins: failed,
        ipReputation: rep,
        unusualTime,
      });
      return;
    }
    if (attacked && rep < 0.2) {
      incidents.push({
        id: `${sid}-high`,
        sessionId: sid,
        severity: "HIGH",
        type: "Attack + bad IP",
        message: `${sid}: detected attack from low-reputation IP (${rep.toFixed(2)}).`,
        protocol: String(r.protocol_type ?? "—"),
        browser: String(r.browser_type ?? "—"),
        failedLogins: failed,
        ipReputation: rep,
        unusualTime,
      });
      return;
    }
    if (failed >= 3) {
      incidents.push({
        id: `${sid}-med-f`,
        sessionId: sid,
        severity: "MEDIUM",
        type: "Failed logins",
        message: `${sid}: ${failed} failed login attempts detected.`,
        protocol: String(r.protocol_type ?? "—"),
        browser: String(r.browser_type ?? "—"),
        failedLogins: failed,
        ipReputation: rep,
        unusualTime,
      });
      return;
    }
    if (unusualTime) {
      incidents.push({
        id: `${sid}-med-t`,
        sessionId: sid,
        severity: "MEDIUM",
        type: "Unusual access time",
        message: `${sid}: access at an unusual time of day.`,
        protocol: String(r.protocol_type ?? "—"),
        browser: String(r.browser_type ?? "—"),
        failedLogins: failed,
        ipReputation: rep,
        unusualTime,
      });
      return;
    }
    if (rep < 0.12) {
      incidents.push({
        id: `${sid}-low`,
        sessionId: sid,
        severity: "LOW",
        type: "Weak IP reputation",
        message: `${sid}: IP reputation below trust threshold (${rep.toFixed(2)}).`,
        protocol: String(r.protocol_type ?? "—"),
        browser: String(r.browser_type ?? "—"),
        failedLogins: failed,
        ipReputation: rep,
        unusualTime,
      });
    }
  });

  const rank: Record<Severity, number> = {
    CRITICAL: 0,
    HIGH: 1,
    MEDIUM: 2,
    LOW: 3,
  };
  incidents.sort((a, b) => rank[a.severity] - rank[b.severity]);

  const criticalIncidents = incidents.filter(
    (i) => i.severity === "CRITICAL"
  ).length;

  /* ---------------- RECOMMENDATIONS ---------------- */

  const recommendations: string[] = [];

  if (heavyFailed.length > 0) {
    recommendations.push(
      `${heavyFailed.length} session(s) show 3+ failed logins — enforce account lockout / MFA.`
    );
  }
  if (lowRep.length > 0) {
    recommendations.push(
      `${lowRep.length} session(s) originate from low-reputation IPs (score < 0.20) — review firewall rules.`
    );
  }
  if (unusual.length > 0) {
    recommendations.push(
      `${unusual.length} session(s) accessed at unusual hours — enable off-hours alerting.`
    );
  }
  if (attackRate >= 25) {
    recommendations.push(
      `Attack rate is ${attackRate}% — tighten network monitoring for ${countBy("protocol_type")[0]?.name ?? "top"} protocol traffic.`
    );
  }
  if (recommendations.length === 0) {
    recommendations.push(
      "Security posture is stable — continue routine monitoring."
    );
  }

  return {
    totalSessions,
    detectedAttacks: attacks.length,
    suspiciousSessions: suspiciousSet.size,
    failedLoginAttempts,
    averageIpReputation,
    attackRate,
    criticalIncidents,
    riskLevel,
    securityScore,
    unusualTimeCount: unusual.length,
    encryptedShare: Number(
      (
        (records.filter((r) => {
          const e = String(r.encryption_used ?? "None").toUpperCase();
          return e === "AES" || e === "DES";
        }).length /
          totalSessions) *
        100
      ).toFixed(1)
    ),
    protocolDistribution: countBy("protocol_type"),
    browserDistribution: countBy("browser_type"),
    incidents: incidents.slice(0, 50),
    recommendations,
  };
};
