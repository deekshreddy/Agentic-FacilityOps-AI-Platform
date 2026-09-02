// ============================================================
// FACILITYOPS AI - UNIFIED MAINTENANCE SERVICE
// SINGLE SOURCE OF TRUTH FOR M2 DASHBOARD + MAINTENANCE PAGE
// ============================================================

export type MaintenanceRecord = {
  [key: string]: any;

  product_id?: string;
  Product_ID?: string;
  ProductID?: string;
  productId?: string;
  Type?: string;

  air_temp?: number | string;
  process_temp?: number | string;

  speed?: number | string;
  rotational_speed?: number | string;
  rotationalSpeed?: number | string;

  torque?: number | string;

  tool_wear?: number | string;
  toolWear?: number | string;

  target?: number | string | boolean;
  target_real?: number | string | boolean;

  machine_failure?: number | string | boolean;
};

// ============================================================
// HELPERS
// ============================================================

const getValue = (
  record: MaintenanceRecord,
  ...keys: string[]
): any => {
  for (const key of keys) {
    const value = record?.[key];

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

const getNumber = (
  record: MaintenanceRecord,
  ...keys: string[]
): number => {
  const value = getValue(record, ...keys);
  const number = Number(value);

  return Number.isFinite(number) ? number : 0;
};

// ============================================================
// MACHINE ID
// ============================================================

export const getProductId = (
  record: MaintenanceRecord,
  index?: number
): string => {
  const value = getValue(
    record,
    "product_id",
    "Product_ID",
    "ProductID",
    "Product ID",
    "productId"
  );

  if (
    value !== undefined &&
    value !== null &&
    String(value).trim() !== ""
  ) {
    return String(value);
  }

  return `Machine ${(index ?? 0) + 1}`;
};

// ============================================================
// FAILURE DETECTION
// ============================================================

export const isFailure = (
  record: MaintenanceRecord
): boolean => {
  const values = [
    getValue(
      record,
      "target",
      "Target",
      "machine_failure",
      "Machine_failure",
      "Machine Failure",
      "machineFailure"
    ),

    getValue(
      record,
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
// MACHINE HEALTH
// ============================================================

export const calculateMachineHealth = (
  record: MaintenanceRecord
): number => {
  const airTemp = getNumber(
    record,
    "air_temp",
    "Air temperature [K]",
    "Air_temperature",
    "airTemp"
  );

  const processTemp = getNumber(
    record,
    "process_temp",
    "Process temperature [K]",
    "Process_temperature",
    "processTemp"
  );

  const speed = getNumber(
    record,
    "speed",
    "Rotational speed [rpm]",
    "Rotational Speed [rpm]",
    "rotational_speed",
    "rotationalSpeed",
    "RPM"
  );

  const torque = getNumber(
    record,
    "torque",
    "Torque [Nm]",
    "Torque"
  );

  const toolWear = getNumber(
    record,
    "tool_wear",
    "Tool wear [min]",
    "Tool Wear [min]",
    "Tool_wear",
    "toolWear"
  );

  // ----------------------------------------------------------
  // Start with perfect health
  // ----------------------------------------------------------

  let health = 100;

  // ----------------------------------------------------------
  // TOOL WEAR
  // AI4I range approximately 0 - 253
  // ----------------------------------------------------------

  if (toolWear >= 220) {
    health -= 35;
  } else if (toolWear >= 190) {
    health -= 25;
  } else if (toolWear >= 160) {
    health -= 15;
  } else if (toolWear >= 130) {
    health -= 8;
  }

  // ----------------------------------------------------------
  // TORQUE
  // ----------------------------------------------------------

  if (torque >= 65) {
    health -= 30;
  } else if (torque >= 55) {
    health -= 20;
  } else if (torque >= 48) {
    health -= 10;
  } else if (torque >= 42) {
    health -= 5;
  }

  // ----------------------------------------------------------
  // TEMPERATURE DIFFERENCE
  // ----------------------------------------------------------

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

  // ----------------------------------------------------------
  // ROTATIONAL SPEED
  // ----------------------------------------------------------

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

  // ----------------------------------------------------------
  // ACTUAL FAILURE
  // ----------------------------------------------------------

  if (isFailure(record)) {
    health -= 35;
  }

  return Math.max(
    0,
    Math.min(100, health)
  );
};

// ============================================================
// MACHINE STATUS
// IMPORTANT:
// SAME THRESHOLDS USED EVERYWHERE
//
// Healthy  >= 90
// Warning  >= 70 and < 90
// Critical < 70
// ============================================================

export type MachineStatus =
  | "Healthy"
  | "Warning"
  | "Critical";

export const getMachineStatus = (
  health: number,
  record?: MaintenanceRecord
): MachineStatus => {

  // Actual recorded failure is always critical.
  if (
    record &&
    isFailure(record)
  ) {
    return "Critical";
  }

  if (health >= 90) {
    return "Healthy";
  }

  if (health >= 70) {
    return "Warning";
  }

  return "Critical";
};

// ============================================================
// HEALTHY MACHINES
// ============================================================

export const getHealthyMachines = (
  records: MaintenanceRecord[]
): MaintenanceRecord[] => {
  return records.filter(
    (record) =>
      getMachineStatus(
        calculateMachineHealth(record),
        record
      ) === "Healthy"
  );
};

// ============================================================
// WARNING MACHINES
// ============================================================

export const getWarningMachines = (
  records: MaintenanceRecord[]
): MaintenanceRecord[] => {
  return records.filter(
    (record) =>
      getMachineStatus(
        calculateMachineHealth(record),
        record
      ) === "Warning"
  );
};

// ============================================================
// CRITICAL MACHINES
// ============================================================

export const getCriticalMachines = (
  records: MaintenanceRecord[]
): MaintenanceRecord[] => {
  return records.filter(
    (record) =>
      getMachineStatus(
        calculateMachineHealth(record),
        record
      ) === "Critical"
  );
};

// ============================================================
// AVERAGE MACHINE HEALTH
// ============================================================

export const calculateAverageMachineHealth = (
  records: MaintenanceRecord[]
): number => {

  if (
    !Array.isArray(records) ||
    records.length === 0
  ) {
    return 0;
  }

  const total = records.reduce(
    (sum, record) =>
      sum +
      calculateMachineHealth(record),
    0
  );

  return total / records.length;
};

// ============================================================
// FAILURE RECORDS
// ============================================================

export const getFailureRecords = (
  records: MaintenanceRecord[]
): MaintenanceRecord[] => {
  return records.filter(
    (record) =>
      isFailure(record)
  );
};

// ============================================================
// MAINTENANCE ALERT
// ============================================================

export type MaintenanceAlert = {
  productId: string;
  health: number;
  risk: "High" | "Medium";
  message: string;
};

// ============================================================
// MAINTENANCE ALERTS
// ============================================================

export const getMaintenanceAlerts = (
  records: MaintenanceRecord[]
): MaintenanceAlert[] => {

  if (
    !Array.isArray(records)
  ) {
    return [];
  }

  return records
    .map(
      (record, index) => {

        const health =
          calculateMachineHealth(
            record
          );

        const status =
          getMachineStatus(
            health,
            record
          );

        const productId =
          getProductId(
            record,
            index
          );

        const toolWear =
          getNumber(
            record,
            "tool_wear",
            "Tool wear [min]",
            "Tool Wear [min]",
            "Tool_wear",
            "toolWear"
          );

        const torque =
          getNumber(
            record,
            "torque",
            "Torque [Nm]",
            "Torque"
          );

        let message =
          "Machine operating normally.";

        // ------------------------------------------------------
        // FAILURE
        // ------------------------------------------------------

        if (
          isFailure(record)
        ) {
          message =
            "Actual machine failure detected. Immediate inspection required.";
        }

        // ------------------------------------------------------
        // CRITICAL HEALTH
        // ------------------------------------------------------

        else if (
          health < 70
        ) {
          message =
            "Critical machine condition detected. Immediate maintenance required.";
        }

        // ------------------------------------------------------
        // HIGH TOOL WEAR
        // ------------------------------------------------------

        else if (
          toolWear >= 220
        ) {
          message =
            "Very high tool wear detected. Component inspection required.";
        }

        // ------------------------------------------------------
        // HIGH TORQUE
        // ------------------------------------------------------

        else if (
          torque >= 65
        ) {
          message =
            "Very high torque detected. Mechanical inspection required.";
        }

        // ------------------------------------------------------
        // WARNING
        // ------------------------------------------------------

        else if (
          status === "Warning"
        ) {
          message =
            "Machine condition requires preventive maintenance monitoring.";
        }

        // ------------------------------------------------------
        // HEALTHY MACHINES DO NOT GENERATE ALERTS
        // ------------------------------------------------------

        if (
          status === "Healthy"
        ) {
          return null;
        }

        return {
          productId,
          health,
          risk:
            status === "Critical"
              ? "High"
              : "Medium",
          message,
        };
      }
    )
    .filter(
      (
        alert
      ): alert is MaintenanceAlert =>
        alert !== null
    )
    .sort(
      (a, b) =>
        a.health - b.health
    );
};

// ============================================================
// MAINTENANCE REQUIRED
// ============================================================

export const getMaintenanceRequired = (
  records: MaintenanceRecord[]
): MaintenanceRecord[] => {

  return records.filter(
    (record) =>
      getMachineStatus(
        calculateMachineHealth(record),
        record
      ) !== "Healthy"
  );
};

// ============================================================
// PREDICTED RISK
// ============================================================

export const calculatePredictedRisk = (
  record: MaintenanceRecord
): number => {

  const health =
    calculateMachineHealth(record);

  if (
    isFailure(record)
  ) {
    return 100;
  }

  return Math.max(
    0,
    Math.min(
      100,
      Math.round(100 - health)
    )
  );
};

// ============================================================
// RECOMMENDATIONS
// ============================================================

export const generateMaintenanceRecommendations = (
  records: MaintenanceRecord[]
): string[] => {

  if (
    !records ||
    records.length === 0
  ) {
    return [
      "No maintenance records are currently available."
    ];
  }

  const healthy =
    getHealthyMachines(records).length;

  const warning =
    getWarningMachines(records).length;

  const critical =
    getCriticalMachines(records).length;

  const failures =
    getFailureRecords(records).length;

  const highWear =
    records.filter(
      (record) =>
        getNumber(
          record,
          "tool_wear",
          "Tool wear [min]",
          "Tool Wear [min]",
          "Tool_wear",
          "toolWear"
        ) >= 180
    ).length;

  const highTorque =
    records.filter(
      (record) =>
        getNumber(
          record,
          "torque",
          "Torque [Nm]",
          "Torque"
        ) >= 55
    ).length;

  const recommendations: string[] = [];

  if (
    critical > 0
  ) {
    recommendations.push(
      `${critical} machines are in critical condition and require immediate inspection.`
    );
  }

  if (
    failures > 0
  ) {
    recommendations.push(
      `${failures} machines have actual failure indicators and require investigation.`
    );
  }

  if (
    warning > 0
  ) {
    recommendations.push(
      `${warning} machines are showing warning conditions and should be monitored.`
    );
  }

  if (
    highWear > 0
  ) {
    recommendations.push(
      `${highWear} machines have high tool wear and should be inspected.`
    );
  }

  if (
    highTorque > 0
  ) {
    recommendations.push(
      `${highTorque} machines have elevated torque and should be checked for mechanical stress.`
    );
  }

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
// SUMMARY
// USEFUL FOR DASHBOARD + MAINTENANCE PAGE
// ============================================================

export const getMaintenanceSummary = (
  records: MaintenanceRecord[]
) => {

  const safeRecords =
    Array.isArray(records)
      ? records
      : [];

  const totalMachines =
    safeRecords.length;

  const healthyMachines =
    getHealthyMachines(
      safeRecords
    );

  const warningMachines =
    getWarningMachines(
      safeRecords
    );

  const criticalMachines =
    getCriticalMachines(
      safeRecords
    );

  const failureRecords =
    getFailureRecords(
      safeRecords
    );

  const maintenanceRequired =
    getMaintenanceRequired(
      safeRecords
    );

  const maintenanceAlerts =
    getMaintenanceAlerts(
      safeRecords
    );

  const averageMachineHealth =
    calculateAverageMachineHealth(
      safeRecords
    );

  const failureRate =
    totalMachines > 0
      ? (
          failureRecords.length /
          totalMachines
        ) *
        100
      : 0;

  return {
    totalMachines,

    healthyMachines:
      healthyMachines.length,

    warningMachines:
      warningMachines.length,

    criticalMachines:
      criticalMachines.length,

    failureRecords:
      failureRecords.length,

    maintenanceRequired:
      maintenanceRequired.length,

    activeAlerts:
      maintenanceAlerts.length,

    averageMachineHealth,

    failureRate,

    maintenanceAlerts,
  };
};