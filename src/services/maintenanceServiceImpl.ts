// ============================================================
// FACILITYOPS AI - PREDICTIVE MAINTENANCE SERVICE
// AI4I / SPECTRA MAINTENANCE DATA
// ============================================================

import {
  MachineRecord,
  MaintenanceAlert,
  MaintenanceScheduleItem,
} from "../types";

import {
  groupBy,
} from "../utils/dataUtils";

// ============================================================
// TYPES
// ============================================================

type MachineStatus =
  | "Healthy"
  | "Warning"
  | "Critical";

// ============================================================
// HELPERS
// ============================================================

const getNumber = (
  machine: MachineRecord,
  ...keys: string[]
): number => {
  for (const key of keys) {
    const value = (machine as any)?.[key];

    if (
      value !== undefined &&
      value !== null &&
      value !== ""
    ) {
      const number = Number(value);

      if (Number.isFinite(number)) {
        return number;
      }
    }
  }

  return 0;
};

const getValue = (
  machine: MachineRecord,
  ...keys: string[]
): any => {
  for (const key of keys) {
    const value = (machine as any)?.[key];

    if (
      value !== undefined &&
      value !== null &&
      value !== ""
    ) {
      return value;
    }
  }

  return undefined;
};

// ============================================================
// MACHINE ID
// ============================================================

export const getMachineId = (
  machine: MachineRecord,
  index?: number
): string => {
  const id = getValue(
    machine,
    "product_id",
    "productId",
    "Product_ID",
    "ProductID",
    "Product ID",
    "machineId",
    "machine_id"
  );

  if (id !== undefined) {
    return String(id);
  }

  return `Machine ${(index ?? 0) + 1}`;
};

// ============================================================
// FAILURE DETECTION
// ============================================================

export const isFailure = (
  machine: MachineRecord
): boolean => {
  const values = [
    getValue(
      machine,
      "target",
      "Target",
      "machine_failure",
      "Machine Failure",
      "Machine_failure",
      "machineFailure"
    ),

    getValue(
      machine,
      "target_real",
      "Target_real",
      "targetReal"
    ),
  ];

  return values.some((value) => {
    if (typeof value === "boolean") {
      return value;
    }

    const text = String(value ?? "")
      .trim()
      .toLowerCase();

    return (
      text === "1" ||
      text === "true" ||
      text === "yes" ||
      text === "failure" ||
      text === "failed"
    );
  });
};

// ============================================================
// HEALTH SCORE
// ============================================================
//
// Health starts at 100.
//
// Penalties are based on:
// - Tool wear
// - Torque
// - Temperature difference
// - Rotational speed
// - Actual failure
//
// This is intentionally transparent and rule-based so the
// dashboard values can be explained to a mentor/reviewer.
// ============================================================

export const computeHealthScore = (
  machine: MachineRecord
): number => {

  const airTemp = getNumber(
    machine,
    "airTemp",
    "air_temp",
    "Air temperature [K]",
    "Air Temperature [K]",
    "Air_temperature"
  );

  const processTemp = getNumber(
    machine,
    "processTemp",
    "process_temp",
    "Process temperature [K]",
    "Process Temperature [K]",
    "Process_temperature"
  );

  const speed = getNumber(
    machine,
    "speed",
    "rotational_speed",
    "rotationalSpeed",
    "Rotational speed [rpm]",
    "Rotational Speed [rpm]",
    "RPM"
  );

  const torque = getNumber(
    machine,
    "torque",
    "Torque [Nm]",
    "Torque"
  );

  const toolWear = getNumber(
    machine,
    "toolWear",
    "tool_wear",
    "Tool wear [min]",
    "Tool Wear [min]",
    "Tool_wear"
  );

  let health = 100;

  // ==========================================================
  // TOOL WEAR
  // AI4I typical range: approximately 0 - 253 minutes
  // ==========================================================

  if (toolWear >= 220) {
    health -= 35;
  } else if (toolWear >= 190) {
    health -= 25;
  } else if (toolWear >= 160) {
    health -= 15;
  } else if (toolWear >= 130) {
    health -= 8;
  }

  // ==========================================================
  // TORQUE
  // ==========================================================

  if (torque >= 65) {
    health -= 30;
  } else if (torque >= 55) {
    health -= 20;
  } else if (torque >= 48) {
    health -= 10;
  } else if (torque >= 42) {
    health -= 5;
  }

  // ==========================================================
  // TEMPERATURE DIFFERENCE
  // ==========================================================

  if (
    airTemp > 0 &&
    processTemp > 0
  ) {
    const difference = Math.abs(
      processTemp - airTemp
    );

    if (difference >= 15) {
      health -= 20;
    } else if (difference >= 12) {
      health -= 15;
    } else if (difference >= 10) {
      health -= 8;
    } else if (difference >= 8) {
      health -= 4;
    }
  }

  // ==========================================================
  // ROTATIONAL SPEED
  // ==========================================================

  if (speed > 0) {

    if (
      speed >= 2200 ||
      speed <= 1100
    ) {
      health -= 20;
    } else if (
      speed >= 2000 ||
      speed <= 1300
    ) {
      health -= 10;
    } else if (
      speed >= 1850 ||
      speed <= 1400
    ) {
      health -= 5;
    }
  }

  // ==========================================================
  // ACTUAL FAILURE
  // ==========================================================

  if (isFailure(machine)) {
    health -= 35;
  }

  return Math.max(
    0,
    Math.min(
      100,
      Math.round(health)
    )
  );
};

// ============================================================
// HEALTH CLASSIFICATION
// ============================================================
//
// IMPORTANT:
// These thresholds are the same thresholds used by the
// dashboard maintenance calculations.
//
// Healthy  >= 75
// Warning  45 - 74
// Critical < 45
//
// Actual failure is ALWAYS Critical.
// ============================================================

export const classifyHealth = (
  score: number,
  machine?: MachineRecord
): MachineStatus => {

  if (
    machine &&
    isFailure(machine)
  ) {
    return "Critical";
  }

  if (score < 45) {
    return "Critical";
  }

  if (score < 75) {
    return "Warning";
  }

  return "Healthy";
};

// ============================================================
// PREDICTED FAILURE RISK
// ============================================================

export const computePredictedRisk = (
  machine: MachineRecord
): number => {

  const toolWear = getNumber(
    machine,
    "toolWear",
    "tool_wear",
    "Tool wear [min]",
    "Tool Wear [min]",
    "Tool_wear"
  );

  const torque = getNumber(
    machine,
    "torque",
    "Torque [Nm]",
    "Torque"
  );

  const airTemp = getNumber(
    machine,
    "airTemp",
    "air_temp",
    "Air temperature [K]",
    "Air Temperature [K]",
    "Air_temperature"
  );

  const processTemp = getNumber(
    machine,
    "processTemp",
    "process_temp",
    "Process temperature [K]",
    "Process Temperature [K]",
    "Process_temperature"
  );

  const speed = getNumber(
    machine,
    "speed",
    "rotational_speed",
    "rotationalSpeed",
    "Rotational speed [rpm]",
    "Rotational Speed [rpm]",
    "RPM"
  );

  let risk = 0;

  // ==========================================================
  // TOOL WEAR CONTRIBUTION
  // ==========================================================

  if (toolWear >= 220) {
    risk += 40;
  } else if (toolWear >= 190) {
    risk += 30;
  } else if (toolWear >= 160) {
    risk += 20;
  } else if (toolWear >= 130) {
    risk += 10;
  }

  // ==========================================================
  // TORQUE CONTRIBUTION
  // ==========================================================

  if (torque >= 65) {
    risk += 30;
  } else if (torque >= 55) {
    risk += 20;
  } else if (torque >= 48) {
    risk += 10;
  }

  // ==========================================================
  // TEMPERATURE CONTRIBUTION
  // ==========================================================

  if (
    airTemp > 0 &&
    processTemp > 0
  ) {
    const difference = Math.abs(
      processTemp - airTemp
    );

    if (difference >= 15) {
      risk += 20;
    } else if (difference >= 12) {
      risk += 15;
    } else if (difference >= 10) {
      risk += 10;
    } else if (difference >= 8) {
      risk += 5;
    }
  }

  // ==========================================================
  // SPEED CONTRIBUTION
  // ==========================================================

  if (speed > 0) {

    if (
      speed >= 2200 ||
      speed <= 1100
    ) {
      risk += 15;
    } else if (
      speed >= 2000 ||
      speed <= 1300
    ) {
      risk += 8;
    }
  }

  // ==========================================================
  // ACTUAL FAILURE
  // ==========================================================

  if (isFailure(machine)) {
    risk = Math.max(
      risk,
      95
    );
  }

  return Math.max(
    0,
    Math.min(
      100,
      Math.round(risk)
    )
  );
};

// ============================================================
// RISK LEVEL
// ============================================================

export const getRiskLevel = (
  risk: number
): "Low" | "Medium" | "High" => {

  if (risk >= 75) {
    return "High";
  }

  if (risk >= 50) {
    return "Medium";
  }

  return "Low";
};

// ============================================================
// BUILD MACHINE RECORDS
// ============================================================

export const buildMachineRecords = (
  items: MachineRecord[]
): MachineRecord[] => {

  return items.map(
    (machine, index) => {

      const healthScore =
        computeHealthScore(
          machine
        );

      const healthStatus =
        classifyHealth(
          healthScore,
          machine
        );

      const predictedRisk =
        computePredictedRisk(
          machine
        );

      const riskLevel =
        getRiskLevel(
          predictedRisk
        );

      return {
        ...machine,

        machineId:
          getMachineId(
            machine,
            index
          ),

        healthScore,

        healthStatus,

        predictedRisk,

        riskLevel,

        observedFailure:
          isFailure(machine),
      } as MachineRecord;
    }
  );
};

// ============================================================
// FILTER HELPERS
// ============================================================

export const getHealthyMachines = (
  machines: MachineRecord[]
): MachineRecord[] => {

  return machines.filter(
    (machine) =>
      classifyHealth(
        computeHealthScore(machine),
        machine
      ) === "Healthy"
  );
};

export const getWarningMachines = (
  machines: MachineRecord[]
): MachineRecord[] => {

  return machines.filter(
    (machine) =>
      classifyHealth(
        computeHealthScore(machine),
        machine
      ) === "Warning"
  );
};

export const getCriticalMachines = (
  machines: MachineRecord[]
): MachineRecord[] => {

  return machines.filter(
    (machine) =>
      classifyHealth(
        computeHealthScore(machine),
        machine
      ) === "Critical"
  );
};

// ============================================================
// AVERAGE HEALTH
// ============================================================

export const calculateAverageMachineHealth = (
  machines: MachineRecord[]
): number => {

  if (
    !machines ||
    machines.length === 0
  ) {
    return 0;
  }

  const total =
    machines.reduce(
      (
        sum,
        machine
      ) =>
        sum +
        computeHealthScore(
          machine
        ),
      0
    );

  return (
    total /
    machines.length
  );
};

// ============================================================
// FAILURE RECORDS
// ============================================================

export const getFailureRecords = (
  machines: MachineRecord[]
): MachineRecord[] => {

  return machines.filter(
    (machine) =>
      isFailure(machine)
  );
};

// ============================================================
// MAINTENANCE ALERT TYPE
// ============================================================

export type FacilityMaintenanceAlert =
  MaintenanceAlert & {
    machineId: string;
    alertType: string;
    severity:
      | "CRITICAL"
      | "WARNING";
    reason: string;
    currentValue: string;
    recommendedAction: string;
  };

// ============================================================
// ALERT GENERATION
// ============================================================

export const generateAlerts = (
  machines: MachineRecord[]
): MaintenanceAlert[] => {

  const alerts: any[] = [];

  machines.forEach(
    (machine, index) => {

      const machineId =
        getMachineId(
          machine,
          index
        );

      const healthScore =
        computeHealthScore(
          machine
        );

      const predictedRisk =
        computePredictedRisk(
          machine
        );

      const toolWear =
        getNumber(
          machine,
          "toolWear",
          "tool_wear",
          "Tool wear [min]",
          "Tool Wear [min]",
          "Tool_wear"
        );

      const torque =
        getNumber(
          machine,
          "torque",
          "Torque [Nm]",
          "Torque"
        );

      const airTemp =
        getNumber(
          machine,
          "airTemp",
          "air_temp",
          "Air temperature [K]",
          "Air Temperature [K]",
          "Air_temperature"
        );

      const processTemp =
        getNumber(
          machine,
          "processTemp",
          "process_temp",
          "Process temperature [K]",
          "Process Temperature [K]",
          "Process_temperature"
        );

      // ========================================================
      // ACTUAL FAILURE
      // ========================================================

      if (
        isFailure(machine)
      ) {
        alerts.push({
          machineId,
          productId: machineId,
          alertType:
            "Observed Failure",
          severity: "CRITICAL",
          risk: "High",
          reason:
            "Dataset indicates a recorded machine failure.",
          currentValue:
            "Failure indicator = 1",
          recommendedAction:
            "Immediate inspection and root-cause analysis.",
          health:
            healthScore,
          message:
            "Actual machine failure detected. Immediate inspection required.",
        });

        return;
      }

      // ========================================================
      // CRITICAL HEALTH
      // ========================================================

      if (
        healthScore < 45
      ) {
        alerts.push({
          machineId,
          productId: machineId,
          alertType:
            "Critical Equipment Health",
          severity: "CRITICAL",
          risk: "High",
          reason:
            `Health score ${healthScore}% is below the critical threshold.`,
          currentValue:
            `Health ${healthScore}%`,
          recommendedAction:
            "Immediate inspection and preventive maintenance.",
          health:
            healthScore,
          message:
            "Critical machine condition detected. Immediate maintenance required.",
        });

        return;
      }

      // ========================================================
      // HIGH TOOL WEAR
      // ========================================================

      if (
        toolWear >= 220
      ) {
        alerts.push({
          machineId,
          productId: machineId,
          alertType:
            "Very High Tool Wear",
          severity: "CRITICAL",
          risk: "High",
          reason:
            `Tool wear is ${toolWear} minutes.`,
          currentValue:
            `Tool wear ${toolWear} min`,
          recommendedAction:
            "Inspect and replace the tool if required.",
          health:
            healthScore,
          message:
            "Very high tool wear detected. Component inspection required.",
        });
      }

      // ========================================================
      // HIGH TORQUE
      // ========================================================

      if (
        torque >= 65
      ) {
        alerts.push({
          machineId,
          productId: machineId,
          alertType:
            "Very High Torque",
          severity: "CRITICAL",
          risk: "High",
          reason:
            `Torque is ${torque} Nm.`,
          currentValue:
            `Torque ${torque} Nm`,
          recommendedAction:
            "Inspect the mechanical system for excessive stress.",
          health:
            healthScore,
          message:
            "Very high torque detected. Mechanical inspection required.",
        });
      }

      // ========================================================
      // TEMPERATURE
      // ========================================================

      if (
        airTemp > 0 &&
        processTemp > 0
      ) {

        const difference =
          Math.abs(
            processTemp -
            airTemp
          );

        if (
          difference >= 15
        ) {
          alerts.push({
            machineId,
            productId: machineId,
            alertType:
              "Abnormal Temperature Difference",
            severity: "WARNING",
            risk: "Medium",
            reason:
              `Temperature difference is ${difference.toFixed(
                1
              )} K.`,
            currentValue:
              `Air ${airTemp} K / Process ${processTemp} K`,
            recommendedAction:
              "Inspect cooling and process temperature controls.",
            health:
              healthScore,
            message:
              "Abnormal temperature difference detected. Cooling inspection recommended.",
          });
        }
      }

      // ========================================================
      // PREDICTED HIGH RISK
      // ========================================================

      if (
        predictedRisk >= 75
      ) {
        alerts.push({
          machineId,
          productId: machineId,
          alertType:
            "High Predicted Failure Risk",
          severity: "CRITICAL",
          risk: "High",
          reason:
            `Predicted failure risk is ${predictedRisk}%.`,
          currentValue:
            `Risk ${predictedRisk}%`,
          recommendedAction:
            "Prioritize this machine for preventive maintenance.",
          health:
            healthScore,
          message:
            "High predicted failure risk detected. Preventive maintenance is recommended.",
        });
      } else if (
        predictedRisk >= 50
      ) {
        alerts.push({
          machineId,
          productId: machineId,
          alertType:
            "Elevated Predicted Failure Risk",
          severity: "WARNING",
          risk: "Medium",
          reason:
            `Predicted failure risk is ${predictedRisk}%.`,
          currentValue:
            `Risk ${predictedRisk}%`,
          recommendedAction:
            "Schedule preventive maintenance monitoring.",
          health:
            healthScore,
          message:
            "Machine has elevated failure risk and should be monitored.",
        });
      }

      // ========================================================
      // WARNING HEALTH
      // ========================================================

      if (
        healthScore >= 45 &&
        healthScore < 75
      ) {
        alerts.push({
          machineId,
          productId: machineId,
          alertType:
            "Equipment Health Warning",
          severity: "WARNING",
          risk: "Medium",
          reason:
            `Health score ${healthScore}% is below the healthy threshold.`,
          currentValue:
            `Health ${healthScore}%`,
          recommendedAction:
            "Schedule preventive maintenance monitoring.",
          health:
            healthScore,
          message:
            "Machine condition requires preventive maintenance monitoring.",
        });
      }
    }
  );

  // Lowest health first
  alerts.sort(
    (a, b) =>
      Number(a.health ?? 100) -
      Number(b.health ?? 100)
  );

  return alerts as MaintenanceAlert[];
};

// ============================================================
// DASHBOARD ALERT FORMAT
// ============================================================
//
// This function provides the format expected by your
// DashboardPage.tsx:
//
// alert.productId
// alert.message
// alert.risk
// alert.health
// ============================================================

export const getMaintenanceAlerts = (
  machines: MachineRecord[]
): any[] => {

  return generateAlerts(
    machines
  ).map(
    (alert: any) => ({
      productId:
        alert.productId ??
        alert.machineId ??
        "Unknown",

      health:
        Number(
          alert.health ?? 0
        ),

      risk:
        alert.risk ??
        (
          alert.severity ===
          "CRITICAL"
            ? "High"
            : "Medium"
        ),

      message:
        alert.message ??
        alert.reason ??
        "Maintenance attention required.",

      alertType:
        alert.alertType,

      severity:
        alert.severity,

      recommendedAction:
        alert.recommendedAction,
    })
  );
};

// ============================================================
// RECOMMENDATIONS
// ============================================================

export const generateMaintenanceRecommendations = (
  machines: MachineRecord[]
): string[] => {

  if (
    !machines ||
    machines.length === 0
  ) {
    return [
      "No maintenance records are currently available.",
    ];
  }

  const healthy =
    getHealthyMachines(
      machines
    ).length;

  const warning =
    getWarningMachines(
      machines
    ).length;

  const critical =
    getCriticalMachines(
      machines
    ).length;

  const failures =
    getFailureRecords(
      machines
    ).length;

  const highWear =
    machines.filter(
      (machine) =>
        getNumber(
          machine,
          "toolWear",
          "tool_wear",
          "Tool wear [min]",
          "Tool Wear [min]",
          "Tool_wear"
        ) >= 180
    ).length;

  const highTorque =
    machines.filter(
      (machine) =>
        getNumber(
          machine,
          "torque",
          "Torque [Nm]",
          "Torque"
        ) >= 55
    ).length;

  const recommendations: string[] = [];

  // ==========================================================
  // CRITICAL
  // ==========================================================

  if (
    critical > 0
  ) {
    recommendations.push(
      `${critical} machines are in critical condition and require immediate inspection.`
    );
  }

  // ==========================================================
  // ACTUAL FAILURES
  // ==========================================================

  if (
    failures > 0
  ) {
    recommendations.push(
      `${failures} machines have actual failure indicators and require investigation.`
    );
  }

  // ==========================================================
  // WARNING
  // ==========================================================

  if (
    warning > 0
  ) {
    recommendations.push(
      `${warning} machines are showing warning conditions and should be monitored.`
    );
  }

  // ==========================================================
  // TOOL WEAR
  // ==========================================================

  if (
    highWear > 0
  ) {
    recommendations.push(
      `${highWear} machines have high tool wear and should be inspected for possible tool replacement.`
    );
  }

  // ==========================================================
  // TORQUE
  // ==========================================================

  if (
    highTorque > 0
  ) {
    recommendations.push(
      `${highTorque} machines have elevated torque and should be checked for mechanical stress.`
    );
  }

  // ==========================================================
  // NORMAL
  // ==========================================================

  if (
    recommendations.length === 0
  ) {
    recommendations.push(
      `${healthy} machines are currently operating within the healthy range.`
    );
  }

  return recommendations;
};

// ============================================================
// MAINTENANCE SCHEDULE
// ============================================================

export const buildMaintenanceSchedule = (
  machines: MachineRecord[]
): MaintenanceScheduleItem[] => {

  return machines
    .map(
      (machine, index) => {

        const healthScore =
          computeHealthScore(
            machine
          );

        const predictedRisk =
          computePredictedRisk(
            machine
          );

        return {
          machineId:
            getMachineId(
              machine,
              index
            ),

          currentHealth:
            healthScore,

          riskLevel:
            getRiskLevel(
              predictedRisk
            ),

          recommendedMaintenance:
            isFailure(machine)
              ? "Immediate Inspection"
              : getNumber(
                  machine,
                  "toolWear",
                  "tool_wear",
                  "Tool wear [min]",
                  "Tool Wear [min]",
                  "Tool_wear"
                ) >= 220
              ? "Tool Replacement"
              : predictedRisk >= 75
              ? "Immediate Inspection"
              : healthScore < 75
              ? "Preventive Maintenance"
              : "Routine Monitoring",

          priority:
            healthScore < 45 ||
            isFailure(machine)
              ? "Critical"
              : healthScore < 75
              ? "High"
              : "Medium",
        } as MaintenanceScheduleItem;
      }
    )
    .filter(
      (item) =>
        Number(
          item.currentHealth
        ) < 90
    )
    .sort(
      (a, b) =>
        Number(
          a.currentHealth
        ) -
        Number(
          b.currentHealth
        )
    );
};

// ============================================================
// AGGREGATE BY MACHINE TYPE
// ============================================================

export const aggregateByType = (
  machines: MachineRecord[]
) => {

  const grouped = groupBy(
    machines as any as Record<string, unknown>[],
    (m) => String(m["machineType"] ?? "Unknown")
  );

  return Object.entries(
    grouped
  ).map(
    ([type, items]) => ({
      name:
        type ||
        "Unknown",

      value:
        items.length,
    })
  );
};

// ============================================================
// FAILURE RATE
// ============================================================

export const failureRate = (
  machines: MachineRecord[]
): number => {

  if (
    !machines ||
    machines.length === 0
  ) {
    return 0;
  }

  const observed =
    machines.filter(
      (machine) =>
        isFailure(machine)
    ).length;

  return Math.round(
    (
      observed /
      machines.length
    ) *
      100
  );
};

// ============================================================
// HEALTH DISTRIBUTION
// ============================================================

export const healthDistribution = (
  machines: MachineRecord[]
) => {

  const healthy =
    getHealthyMachines(
      machines
    ).length;

  const warning =
    getWarningMachines(
      machines
    ).length;

  const critical =
    getCriticalMachines(
      machines
    ).length;

  return [
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
  ];
};

// ============================================================
// SUMMARY
// ============================================================

export const getMaintenanceSummary = (
  machines: MachineRecord[]
) => {

  const total =
    machines.length;

  const healthy =
    getHealthyMachines(
      machines
    ).length;

  const warning =
    getWarningMachines(
      machines
    ).length;

  const critical =
    getCriticalMachines(
      machines
    ).length;

  const failures =
    getFailureRecords(
      machines
    ).length;

  const averageHealth =
    calculateAverageMachineHealth(
      machines
    );

  const failurePercentage =
    total > 0
      ? Math.round(
          (
            failures /
            total
          ) *
            100
        )
      : 0;

  return {
    totalMachines: total,
    healthyMachines: healthy,
    warningMachines: warning,
    criticalMachines: critical,
    failureRecords: failures,
    averageMachineHealth:
      Number(
        averageHealth.toFixed(1)
      ),
    failureRate:
      failurePercentage,
  };
};