import React, { useEffect, useMemo, useState } from "react";
import { KpiCard } from "../components/kpi/KpiCard";
import { DonutChart } from "../charts/DonutChart";
import { LinePanel } from "../charts/LinePanel";
import { BarPanel } from "../charts/BarPanel";

const API_BASE = "https://agentic-facilityops-ai-platform-9219.onrender.com";

interface BackendRecord {
  product_id?: string;
  Product_ID?: string;
  Type?: string;
  type?: string;

  air_temp?: number | string;
  process_temp?: number | string;
  speed?: number | string;
  rotational_speed?: number | string;
  torque?: number | string;
  tool_wear?: number | string;

  target_real?: number | string;
  target?: number | string;

  [key: string]: any;
}

type HealthStatus = "Healthy" | "Warning" | "Critical";

interface Machine {
  productId: string;
  machineType: string;

  airTemp: number;
  processTemp: number;
  speed: number;
  torque: number;
  toolWear: number;

  targetReal: number;
  target: number;

  healthScore: number;
  healthStatus: HealthStatus;
  predictedRisk: number;
  observedFailure: boolean;
}

interface Alert {
  machineId: string;
  alertType: string;
  severity: "CRITICAL" | "WARNING";
  reason: string;
}

/* ============================================================
   NUMBER HELPER
============================================================ */

const numberValue = (value: any): number => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

/* ============================================================
   NORMALIZE BACKEND RECORD
============================================================ */

const normalizeRecord = (row: BackendRecord): BackendRecord => {
  const get = (...keys: string[]) => {
    for (const key of keys) {
      if (
        row[key] !== undefined &&
        row[key] !== null &&
        row[key] !== ""
      ) {
        return row[key];
      }
    }

    return 0;
  };

  return {
    ...row,

    product_id: get(
      "product_id",
      "Product_ID",
      "Product ID",
      "productId"
    ),

    Type: get(
      "Type",
      "type"
    ),

    air_temp: get(
      "air_temp",
      "Air temperature [K]",
      "Air Temperature [K]",
      "Air_temperature"
    ),

    process_temp: get(
      "process_temp",
      "Process temperature [K]",
      "Process Temperature [K]",
      "Process_temperature"
    ),

    speed: get(
      "speed",
      "rotational_speed",
      "Rotational speed [rpm]"
    ),

    torque: get(
      "torque",
      "Torque [Nm]",
      "Torque"
    ),

    tool_wear: get(
      "tool_wear",
      "Tool wear [min]",
      "Tool Wear [min]",
      "Tool_wear"
    ),

    target_real: get(
      "target_real",
      "Target_Real"
    ),

    target: get(
      "target",
      "Target"
    ),
  };
};

/* ============================================================
   MACHINE HEALTH SCORE
   DATASET-AWARE VERSION
============================================================ */

const computeHealthScore = (
  row: BackendRecord
): number => {
  const airTemp = numberValue(row.air_temp);
  const processTemp = numberValue(row.process_temp);
  const speed = numberValue(row.speed);
  const torque = numberValue(row.torque);
  const toolWear = numberValue(row.tool_wear);

  const observedFailure =
    numberValue(row.target_real) === 1;

  /*
    AI4I/Spectra-style dataset temperatures are
    generally around 295–310 Kelvin.

    Instead of treating 300K as an abnormal 150K,
    calculate deviation from a normal operating range.
  */

  let temperaturePenalty = 0;

  if (airTemp > 0) {
    if (airTemp > 305) {
      temperaturePenalty += Math.min(
        15,
        (airTemp - 305) * 3
      );
    }

    if (airTemp < 295) {
      temperaturePenalty += Math.min(
        10,
        (295 - airTemp) * 2
      );
    }
  }

  if (processTemp > 0) {
    if (processTemp > 315) {
      temperaturePenalty += Math.min(
        20,
        (processTemp - 315) * 2
      );
    }

    if (processTemp < 300) {
      temperaturePenalty += Math.min(
        10,
        (300 - processTemp) * 2
      );
    }
  }

  /* ==========================================================
     TOOL WEAR
  ========================================================== */

  let toolWearPenalty = 0;

  if (toolWear > 50) {
    toolWearPenalty += Math.min(
      20,
      ((toolWear - 50) / 150) * 20
    );
  }

  if (toolWear > 150) {
    toolWearPenalty += 10;
  }

  /* ==========================================================
     SPEED
  ========================================================== */

  let speedPenalty = 0;

  /*
    Typical rotational speed is approximately
    1000–3000 rpm.

    Penalize only extreme values.
  */

  if (speed > 0) {
    if (speed < 1000) {
      speedPenalty += Math.min(
        10,
        (1000 - speed) / 100
      );
    }

    if (speed > 3000) {
      speedPenalty += Math.min(
        10,
        (speed - 3000) / 100
      );
    }
  }

  /* ==========================================================
     TORQUE
  ========================================================== */

  let torquePenalty = 0;

  if (torque > 0) {
    if (torque > 60) {
      torquePenalty += Math.min(
        15,
        (torque - 60) / 4
      );
    }

    if (torque < 10) {
      torquePenalty += Math.min(
        5,
        (10 - torque) / 2
      );
    }
  }

  /* ==========================================================
     FINAL SCORE
  ========================================================== */

  let score =
    100 -
    temperaturePenalty -
    toolWearPenalty -
    speedPenalty -
    torquePenalty;

  /*
    Actual recorded failure is the strongest signal.
    It should always make the machine Critical.
  */

  if (observedFailure) {
    score = Math.min(
      score,
      40
    );
  }

  return Math.max(
    0,
    Math.min(
      100,
      Math.round(score)
    )
  );
};

/* ============================================================
   HEALTH STATUS
============================================================ */

const classifyHealth = (
  score: number,
  observedFailure: boolean
): HealthStatus => {
  if (observedFailure) {
    return "Critical";
  }

  if (score >= 80) {
    return "Healthy";
  }

  if (score >= 60) {
    return "Warning";
  }

  return "Critical";
};

/* ============================================================
   PREDICTED RISK
============================================================ */

const computePredictedRisk = (
  row: BackendRecord
): number => {
  const toolWear = numberValue(
    row.tool_wear
  );

  const processTemp = numberValue(
    row.process_temp
  );

  const airTemp = numberValue(
    row.air_temp
  );

  const torque = numberValue(
    row.torque
  );

  const targetReal =
    numberValue(row.target_real);

  let risk = 0;

  /* Tool wear */

  if (toolWear > 0) {
    risk += Math.min(
      45,
      (toolWear / 200) * 45
    );
  }

  /* Process temperature */

  if (processTemp > 315) {
    risk += Math.min(
      20,
      (processTemp - 315) * 2
    );
  }

  /* Air temperature */

  if (airTemp > 305) {
    risk += Math.min(
      10,
      (airTemp - 305) * 2
    );
  }

  /* Torque */

  if (torque > 60) {
    risk += Math.min(
      15,
      (torque - 60) / 3
    );
  }

  /* Actual failure */

  if (targetReal === 1) {
    risk = 100;
  }

  return Math.round(
    Math.min(
      100,
      risk
    )
  );
};

/* ============================================================
   CONVERT RECORD
============================================================ */

const convertRecord = (
  originalRow: BackendRecord
): Machine => {
  const row =
    normalizeRecord(
      originalRow
    );

  const observedFailure =
    numberValue(
      row.target_real
    ) === 1;

  const healthScore =
    computeHealthScore(row);

  const predictedRisk =
    computePredictedRisk(row);

  return {
    productId: String(
      row.product_id ||
        "Unknown"
    ),

    machineType: String(
      row.Type ||
        "Unknown"
    ),

    airTemp: numberValue(
      row.air_temp
    ),

    processTemp: numberValue(
      row.process_temp
    ),

    speed: numberValue(
      row.speed
    ),

    torque: numberValue(
      row.torque
    ),

    toolWear: numberValue(
      row.tool_wear
    ),

    targetReal: numberValue(
      row.target_real
    ),

    target: numberValue(
      row.target
    ),

    healthScore,

    healthStatus:
      classifyHealth(
        healthScore,
        observedFailure
      ),

    predictedRisk,

    observedFailure,
  };
};

/* ============================================================
   MAINTENANCE PAGE
============================================================ */

const MaintenancePage = () => {
  const [
    records,
    setRecords,
  ] = useState<BackendRecord[]>([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");

  const [
    typeFilter,
    setTypeFilter,
  ] = useState("All");

  const [
    statusFilter,
    setStatusFilter,
  ] = useState("All");

  const [
    search,
    setSearch,
  ] = useState("");

  /* ==========================================================
     LOAD DATA
  ========================================================== */

  useEffect(() => {
    let cancelled = false;

    const loadData = async () => {
      try {
        setLoading(true);
        setError("");

        const response =
          await fetch(
            `${API_BASE}/api/maintenance/`,
            {
              cache: "no-store",
            }
          );

        if (!response.ok) {
          throw new Error(
            `Maintenance API failed: ${response.status}`
          );
        }

        /* Guard: never parse an HTML error page as JSON */
        const contentType = response.headers.get("content-type") ?? "";
        if (!contentType.includes("application/json")) {
          throw new Error(
            `Maintenance API returned non-JSON response (${contentType || "unknown type"}). Is the backend running at ${API_BASE}?`
          );
        }

        const result =
          await response.json();

        console.log(
          "RAW MAINTENANCE DATA:",
          result
        );

        const rows =
          Array.isArray(result)
            ? result
            : Array.isArray(
                result.records
              )
            ? result.records
            : [];

        if (!cancelled) {
          setRecords(rows);

          console.log(
            `M2 records loaded: ${rows.length}`
          );
        }
      } catch (err: any) {
        console.error(
          "Maintenance API error:",
          err
        );

        if (!cancelled) {
          setError(
            err?.message ||
              "Unable to load maintenance data."
          );

          setRecords([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      cancelled = true;
    };
  }, []);

  /* ==========================================================
     BUILD MACHINES
  ========================================================== */

  const machines =
    useMemo(() => {
      return records.map(
        convertRecord
      );
    }, [records]);

  /* ==========================================================
     KPI CALCULATIONS
  ========================================================== */

  const total =
    machines.length;

  const healthy =
    machines.filter(
      (machine) =>
        machine.healthStatus ===
        "Healthy"
    ).length;

  const warning =
    machines.filter(
      (machine) =>
        machine.healthStatus ===
        "Warning"
    ).length;

  const critical =
    machines.filter(
      (machine) =>
        machine.healthStatus ===
        "Critical"
    ).length;

  const failures =
    machines.filter(
      (machine) =>
        machine.observedFailure
    ).length;

  const averageHealth =
    total > 0
      ? machines.reduce(
          (sum, machine) =>
            sum +
            machine.healthScore,
          0
        ) / total
      : 0;

  const maintenanceRequired =
    warning + critical;

  /* ==========================================================
     ALERTS
  ========================================================== */

  const alerts =
    useMemo<Alert[]>(() => {
      const result: Alert[] = [];

      machines.forEach(
        (machine) => {
          const id =
            machine.productId;

          /*
            Critical machine
          */

          if (
            machine.healthStatus ===
            "Critical"
          ) {
            result.push({
              machineId: id,
              alertType:
                "Critical Equipment Health",
              severity:
                "CRITICAL",
              reason:
                `Health score ${machine.healthScore}%`,
            });
          }

          /*
            Warning machine
          */

          else if (
            machine.healthStatus ===
            "Warning"
          ) {
            result.push({
              machineId: id,
              alertType:
                "Equipment Health Warning",
              severity:
                "WARNING",
              reason:
                `Health score ${machine.healthScore}%`,
            });
          }

          /*
            High tool wear
          */

          if (
            machine.toolWear >=
            150
          ) {
            result.push({
              machineId: id,
              alertType:
                "High Tool Wear",
              severity:
                "CRITICAL",
              reason:
                `Tool wear ${machine.toolWear}`,
            });
          }

          else if (
            machine.toolWear >=
            100
          ) {
            result.push({
              machineId: id,
              alertType:
                "Increasing Tool Wear",
              severity:
                "WARNING",
              reason:
                `Tool wear ${machine.toolWear}`,
            });
          }

          /*
            High temperature
          */

          if (
            machine.processTemp >=
            315
          ) {
            result.push({
              machineId: id,
              alertType:
                "High Process Temperature",
              severity:
                "CRITICAL",
              reason:
                `Process temperature ${machine.processTemp} K`,
            });
          }

          else if (
            machine.processTemp >=
            310
          ) {
            result.push({
              machineId: id,
              alertType:
                "Elevated Process Temperature",
              severity:
                "WARNING",
              reason:
                `Process temperature ${machine.processTemp} K`,
            });
          }

          /*
            Actual failure
          */

          if (
            machine.observedFailure
          ) {
            result.push({
              machineId: id,
              alertType:
                "Observed Failure",
              severity:
                "CRITICAL",
              reason:
                "Recorded failure event detected in dataset",
            });
          }

          /*
            Predicted risk
          */

          if (
            machine.predictedRisk >=
            75 &&
            !machine.observedFailure
          ) {
            result.push({
              machineId: id,
              alertType:
                "High Predicted Failure Risk",
              severity:
                "CRITICAL",
              reason:
                `Predicted risk ${machine.predictedRisk}%`,
            });
          }

          else if (
            machine.predictedRisk >=
            50 &&
            !machine.observedFailure
          ) {
            result.push({
              machineId: id,
              alertType:
                "Elevated Predicted Failure Risk",
              severity:
                "WARNING",
              reason:
                `Predicted risk ${machine.predictedRisk}%`,
            });
          }
        }
      );

      return result;
    }, [machines]);

  /* ==========================================================
     MACHINE TYPES
  ========================================================== */

  const machineTypes =
    useMemo(() => {
      return Array.from(
        new Set(
          machines.map(
            (machine) =>
              machine.machineType
          )
        )
      );
    }, [machines]);

  /* ==========================================================
     FILTERED MACHINES
  ========================================================== */

  const filteredMachines =
    useMemo(() => {
      const searchValue =
        search
          .toLowerCase()
          .trim();

      return machines.filter(
        (machine) => {
          if (
            typeFilter !==
              "All" &&
            machine.machineType !==
              typeFilter
          ) {
            return false;
          }

          if (
            statusFilter !==
              "All" &&
            machine.healthStatus !==
              statusFilter
          ) {
            return false;
          }

          if (
            searchValue &&
            !machine.productId
              .toLowerCase()
              .includes(
                searchValue
              )
          ) {
            return false;
          }

          return true;
        }
      );
    }, [
      machines,
      typeFilter,
      statusFilter,
      search,
    ]);

  /* ==========================================================
     MACHINE TYPE DATA
  ========================================================== */

  const byType =
    useMemo(() => {
      const counts: Record<
        string,
        number
      > = {};

      machines.forEach(
        (machine) => {
          const type =
            machine.machineType ||
            "Unknown";

          counts[type] =
            (counts[type] || 0) +
            1;
        }
      );

      return Object.entries(
        counts
      ).map(
        ([name, value]) => ({
          name,
          value,
        })
      );
    }, [machines]);

  /* ==========================================================
     FAILURE RATE
  ========================================================== */

  const failureRate =
    total > 0
      ? (
          (failures /
            total) *
          100
        ).toFixed(2)
      : "0.00";

  /* ==========================================================
     TOOL WEAR
  ========================================================== */

  const toolWearData =
    useMemo(() => {
      return machines
        .slice()
        .sort(
          (a, b) =>
            b.toolWear -
            a.toolWear
        )
        .slice(0, 20)
        .map(
          (machine) => ({
            name:
              machine.productId,
            value:
              machine.toolWear,
          })
        );
    }, [machines]);

  /* ==========================================================
     TEMPERATURE
  ========================================================== */

  const temperatureData =
    useMemo(() => {
      return machines
        .slice(0, 50)
        .map(
          (
            machine,
            index
          ) => ({
            timestamp:
              String(
                index + 1
              ),
            actual:
              machine.processTemp,
          })
        );
    }, [machines]);

  /* ==========================================================
     HIGHEST TOOL WEAR
  ========================================================== */

  const highestToolWear =
    useMemo(() => {
      return machines
        .slice()
        .sort(
          (a, b) =>
            b.toolWear -
            a.toolWear
        )
        .slice(0, 3)
        .map(
          (machine) =>
            machine.productId
        )
        .join(", ");
    }, [machines]);

  /* ==========================================================
     LOADING
  ========================================================== */

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-lg text-slate-400">
          Loading maintenance data...
        </div>
      </div>
    );
  }

  /* ==========================================================
     ERROR
  ========================================================== */

  if (error) {
    return (
      <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-6">
        <h2 className="text-xl font-semibold text-rose-400">
          Maintenance Backend Error
        </h2>

        <p className="mt-2 text-slate-300">
          {error}
        </p>

        <p className="mt-4 text-sm text-slate-400">
          Make sure FastAPI is running at:
        </p>

        <code className="mt-2 block rounded bg-black/30 p-3 text-sm text-slate-300">
          https://agentic-facilityops-ai-platform-9219.onrender.com
        </code>
      </div>
    );
  }

  /* ==========================================================
     UI
  ========================================================== */

  return (
    <div className="space-y-6">

      {/* HEADER */}

      <section className="rounded-[32px] border border-white/10 bg-slate-950/60 p-6 shadow-soft backdrop-blur-xl">

        <h1 className="text-2xl font-semibold text-white">
          M2 — Predictive Maintenance
        </h1>

        <p className="text-sm text-slate-400">
          Machine health monitoring, failure risk detection and preventive maintenance.
        </p>

        <p className="mt-2 text-xs text-emerald-400">
          Connected to FastAPI maintenance backend
        </p>

      </section>

      {/* KPI ROW */}

      <section className="grid gap-6 xl:grid-cols-6">

        <KpiCard
          title="Total Machines"
          value={total.toLocaleString()}
          trend=""
          icon={<div />}
          sparkline={<div />}
          accentClass="bg-blue-500/10 text-blue-200"
        />

        <KpiCard
          title="Healthy Machines"
          value={healthy.toLocaleString()}
          trend=""
          icon={<div />}
          sparkline={<div />}
          accentClass="bg-emerald-500/10 text-emerald-200"
        />

        <KpiCard
          title="Warning Machines"
          value={warning.toLocaleString()}
          trend=""
          icon={<div />}
          sparkline={<div />}
          accentClass="bg-amber-500/10 text-amber-200"
        />

        <KpiCard
          title="Critical Machines"
          value={critical.toLocaleString()}
          trend=""
          icon={<div />}
          sparkline={<div />}
          accentClass="bg-rose-500/10 text-rose-200"
        />

        <KpiCard
          title="Failure Records"
          value={failures.toLocaleString()}
          trend=""
          icon={<div />}
          sparkline={<div />}
          accentClass="bg-red-500/10 text-red-200"
        />

        <KpiCard
          title="Average Machine Health"
          value={`${averageHealth.toFixed(
            1
          )}%`}
          trend=""
          icon={<div />}
          sparkline={<div />}
          accentClass="bg-violet-500/10 text-violet-200"
        />

      </section>

      {/* SECOND KPI ROW */}

      <section className="grid gap-6 lg:grid-cols-3">

        <KpiCard
          title="Failure Rate"
          value={`${failureRate}%`}
          trend=""
          icon={<div />}
          sparkline={<div />}
          accentClass="bg-rose-500/10 text-rose-200"
        />

        <KpiCard
          title="Maintenance Required"
          value={maintenanceRequired.toLocaleString()}
          trend=""
          icon={<div />}
          sparkline={<div />}
          accentClass="bg-amber-500/10 text-amber-200"
        />

        <KpiCard
          title="Active Alerts"
          value={alerts.length.toLocaleString()}
          trend=""
          icon={<div />}
          sparkline={<div />}
          accentClass="bg-orange-500/10 text-orange-200"
        />

      </section>

      {/* HEALTH + FAILURE */}

      <section className="grid gap-6 lg:grid-cols-2">

        <div>
          <DonutChart
            data={[
              {
                name: "Healthy",
                value: healthy,
              },
              {
                name: "Warning",
                value: warning,
              },
              {
                name: "Critical",
                value: critical,
              },
            ]}
            colors={[
              "#10b981",
              "#f59e0b",
              "#ef4444",
            ]}
            centerLabel={`${Math.round(
              (healthy /
                Math.max(
                  1,
                  total
                )) *
                100
            )}% Healthy`}
            subtitle="Machine Health Status — All Records"
          />
        </div>

        <div>
          <DonutChart
            data={[
              {
                name: "Failure",
                value: failures,
              },
              {
                name: "No Failure",
                value: Math.max(
                  0,
                  total -
                    failures
                ),
              },
            ]}
            colors={[
              "#ef4444",
              "#334155",
            ]}
            centerLabel={`${failureRate}%`}
            subtitle="Actual Failure Distribution"
          />
        </div>

      </section>

      {/* MACHINE TYPES + AGENT */}

      <section className="grid gap-6 lg:grid-cols-3">

        <div className="lg:col-span-2">
          <BarPanel
            data={byType}
            title="Machines by Type"
            subtitle="Count by machine type"
          />
        </div>

        <div className="rounded-[32px] border border-white/10 bg-slate-950/70 p-5">

          <p className="text-sm uppercase tracking-[0.3em] text-slate-500">
            Maintenance Agent
          </p>

          <h3 className="mt-2 text-xl font-semibold text-white">
            Operational Insights
          </h3>

          <div className="mt-4 space-y-3 text-sm text-slate-300">

            <div>
              Machines requiring attention:{" "}
              <strong className="text-amber-400">
                {maintenanceRequired.toLocaleString()}
              </strong>
            </div>

            <div>
              Warning machines:{" "}
              <strong className="text-amber-400">
                {warning.toLocaleString()}
              </strong>
            </div>

            <div>
              Critical machines:{" "}
              <strong className="text-rose-400">
                {critical.toLocaleString()}
              </strong>
            </div>

            <div>
              Failure rate:{" "}
              <strong className="text-white">
                {failureRate}%
              </strong>
            </div>

            <div>
              Highest tool-wear machines:{" "}
              <strong className="text-white">
                {highestToolWear ||
                  "None"}
              </strong>
            </div>

          </div>
        </div>

      </section>

      {/* EQUIPMENT + ALERTS */}

      <section className="grid gap-6 lg:grid-cols-3">

        <div className="lg:col-span-2 rounded-xl border border-white/5 bg-white/3 p-4">

          <div className="flex flex-wrap items-center justify-between gap-3">

            <h3 className="text-lg font-semibold text-white">
              Equipment List
            </h3>

            <div className="flex flex-wrap gap-2">

              <select
                value={typeFilter}
                onChange={(e) =>
                  setTypeFilter(
                    e.target.value
                  )
                }
                className="rounded bg-white/5 px-3 py-2 text-white"
              >
                <option value="All">
                  All
                </option>

                {machineTypes.map(
                  (type) => (
                    <option
                      key={type}
                      value={type}
                    >
                      {type}
                    </option>
                  )
                )}
              </select>

              <select
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(
                    e.target.value
                  )
                }
                className="rounded bg-white/5 px-3 py-2 text-white"
              >
                <option value="All">
                  All
                </option>

                <option value="Healthy">
                  Healthy
                </option>

                <option value="Warning">
                  Warning
                </option>

                <option value="Critical">
                  Critical
                </option>
              </select>

              <input
                value={search}
                onChange={(e) =>
                  setSearch(
                    e.target.value
                  )
                }
                placeholder="Search Machine ID"
                className="rounded bg-white/5 px-3 py-2 text-white placeholder:text-slate-500"
              />

            </div>

          </div>

          <div className="mt-4 grid gap-3">

            {filteredMachines
              .slice(0, 100)
              .map(
                (machine) => (
                  <div
                    key={`${machine.productId}-${machine.machineType}`}
                    className="flex items-center justify-between rounded-md bg-white/5 p-3"
                  >

                    <div>
                      <div className="text-sm text-slate-300">
                        {machine.productId}
                      </div>

                      <div className="font-semibold text-white">
                        Type:{" "}
                        {machine.machineType}
                      </div>
                    </div>

                    <div className="text-right">

                      <div className="text-white">
                        Health:{" "}
                        {machine.healthScore}%
                      </div>

                      <div
                        className={
                          machine.healthStatus ===
                          "Critical"
                            ? "text-sm text-rose-400"
                            : machine.healthStatus ===
                              "Warning"
                            ? "text-sm text-amber-400"
                            : "text-sm text-emerald-400"
                        }
                      >
                        {
                          machine.healthStatus
                        }
                      </div>

                    </div>

                  </div>
                )
              )}

            {filteredMachines.length ===
              0 && (
                <div className="rounded-md bg-white/5 p-6 text-center text-sm text-slate-400">
                  No machines match the selected filters.
                </div>
              )}

          </div>

        </div>

        {/* ALERTS */}

        <div className="rounded-xl border border-white/5 bg-white/3 p-4">

          <h3 className="text-lg font-semibold text-white">
            Recent Alerts
          </h3>

          <div className="mt-3 space-y-2">

            {alerts.length ===
              0 && (
                <div className="rounded-md bg-white/5 p-4 text-sm text-slate-400">
                  No alerts detected.
                </div>
              )}

            {alerts
              .slice(0, 10)
              .map(
                (
                  alert,
                  index
                ) => (
                  <div
                    key={`${alert.machineId}-${index}`}
                    className={`rounded-md p-3 ${
                      alert.severity ===
                      "CRITICAL"
                        ? "bg-rose-600/20"
                        : "bg-amber-500/10"
                    }`}
                  >

                    <div className="flex items-center justify-between">

                      <div>

                        <div className="text-sm text-slate-300">
                          {
                            alert.machineId
                          }
                        </div>

                        <div className="font-semibold text-white">
                          {
                            alert.alertType
                          }
                        </div>

                      </div>

                      <div
                        className={
                          alert.severity ===
                          "CRITICAL"
                            ? "text-sm text-rose-400"
                            : "text-sm text-amber-400"
                        }
                      >
                        {
                          alert.severity
                        }
                      </div>

                    </div>

                    <div className="mt-2 text-sm text-slate-400">
                      {alert.reason}
                    </div>

                  </div>
                )
              )}

          </div>

        </div>

      </section>

      {/* TEMPERATURE + TOOL WEAR */}

      <section className="grid gap-6 lg:grid-cols-3">

        <div className="lg:col-span-2">

          <LinePanel
            data={
              temperatureData
            }
            title="Temperature Trend"
            subtitle="Process temperature from maintenance records"
          />

        </div>

        <div>

          <BarPanel
            data={toolWearData}
            title="Tool Wear Analysis"
            subtitle="Highest tool-wear machines"
          />

        </div>

      </section>

      {/* BACKEND STATUS */}

      <section className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5">

        <div className="flex flex-wrap items-center justify-between gap-4">

          <div>

            <h3 className="font-semibold text-emerald-400">
              Maintenance Backend Connected
            </h3>

            <p className="mt-1 text-sm text-slate-400">
              M2 dashboard metrics are calculated from the maintenance records and health rules.
            </p>

          </div>

          <div className="text-sm text-slate-300">

            <span className="text-emerald-400">
              ●
            </span>{" "}

            {records.length.toLocaleString()}{" "}
            records loaded

          </div>

        </div>

      </section>

    </div>
  );
};

export default MaintenancePage;
