// ============================================================
// DATA CENTER SERVICE - M1 ENERGY INTELLIGENCE
// ============================================================

const getNumber = (
  record: any,
  ...keys: string[]
): number => {
  for (const key of keys) {
    const value = Number(record?.[key]);

    if (Number.isFinite(value)) {
      return value;
    }
  }

  return 0;
};

// ============================================================
// TOTAL ELECTRICITY
// ============================================================

export const totalElectricityUsage = (
  records: any[]
): number => {
  return records.reduce((total, record) => {
    return (
      total +
      getNumber(
        record,
        'Daily_Electricity_Usage_MWh',
        'dailyElectricityUsageMwh',
        'dailyElectricityUsageMWh'
      )
    );
  }, 0);
};

// ============================================================
// AVERAGE PUE
// ============================================================

export const averagePUE = (
  records: any[]
): number => {
  const values = records
    .map((record) =>
      getNumber(record, 'PUE', 'pue')
    )
    .filter((value) => value > 0);

  if (values.length === 0) {
    return 0;
  }

  return (
    values.reduce(
      (sum, value) => sum + value,
      0
    ) / values.length
  );
};

// ============================================================
// TOTAL WATER
// ============================================================

export const totalWaterUsage = (
  records: any[]
): number => {
  return records.reduce((total, record) => {
    return (
      total +
      getNumber(
        record,
        'Daily_Water_Usage_Gallons',
        'dailyWaterUsageGallons'
      )
    );
  }, 0);
};

// ============================================================
// AVERAGE CAPACITY
// ============================================================

export const averageCapacity = (
  records: any[]
): number => {
  const values = records
    .map((record) =>
      getNumber(
        record,
        'Estimated_Capacity_MW',
        'estimatedCapacityMw',
        'estimatedCapacityMW'
      )
    )
    .filter((value) => value > 0);

  if (values.length === 0) {
    return 0;
  }

  return (
    values.reduce(
      (sum, value) => sum + value,
      0
    ) / values.length
  );
};

// ============================================================
// TOTAL FACILITIES
// ============================================================

export const totalFacilities = (
  records: any[]
): number => {
  const ids = new Set(
    records
      .map(
        (record) =>
          record.Facility_ID ??
          record.facilityId ??
          record.Facility_Name ??
          record.facilityName
      )
      .filter(Boolean)
  );

  return ids.size;
};

// ============================================================
// YEARLY TREND
// ============================================================

export const trendByYear = (
  records: any[],
  field: string
) => {
  const grouped: Record<string, number> = {};

  records.forEach((record) => {
    const year = String(
      record.Year ??
        record.year ??
        'Unknown'
    );

    let value = 0;

    if (
      field === 'dailyElectricityUsageMwh'
    ) {
      value = getNumber(
        record,
        'Daily_Electricity_Usage_MWh',
        'dailyElectricityUsageMwh',
        'dailyElectricityUsageMWh'
      );
    } else if (
      field === 'dailyWaterUsageGallons'
    ) {
      value = getNumber(
        record,
        'Daily_Water_Usage_Gallons',
        'dailyWaterUsageGallons'
      );
    } else if (field === 'pue') {
      value = getNumber(
        record,
        'PUE',
        'pue'
      );
    } else {
      value = getNumber(record, field);
    }

    grouped[year] =
      (grouped[year] || 0) + value;
  });

  return Object.entries(grouped)
    .map(([timestamp, value]) => ({
      timestamp,
      value,
    }))
    .sort(
      (a, b) =>
        Number(a.timestamp) -
        Number(b.timestamp)
    );
};

// ============================================================
// CAPACITY BY FACILITY
// ============================================================

export const capacityByFacility = (
  records: any[]
) => {
  return records
    .map((record) => ({
      name:
        record.Facility_Name ??
        record.facilityName ??
        record.Facility_ID ??
        record.facilityId ??
        'Unknown',

      value: getNumber(
        record,
        'Estimated_Capacity_MW',
        'estimatedCapacityMw',
        'estimatedCapacityMW'
      ),
    }))
    .filter((item) => item.value > 0)
    .slice(0, 20);
};

// ============================================================
// DISTRIBUTIONS
// ============================================================

export const distributionByField = (
  records: any[],
  field: string
) => {
  const counts: Record<string, number> = {};

  records.forEach((record) => {
    let value: any;

    switch (field) {
      case 'facilityType':
        value =
          record.Facility_Type ??
          record.facilityType;
        break;

      case 'coolingSystemType':
        value =
          record.Cooling_System_Type ??
          record.coolingSystemType;
        break;

      case 'surroundingWaterStressTier':
        value =
          record.Surrounding_Water_Stress_Tier ??
          record.surroundingWaterStressTier;
        break;

      case 'country':
        value =
          record.Country ??
          record.country;
        break;

      case 'city':
        value =
          record.City ??
          record.city;
        break;

      default:
        value = record[field];
    }

    const name =
      String(value ?? 'Unknown').trim();

    counts[name] =
      (counts[name] || 0) + 1;
  });

  return Object.entries(counts)
    .map(([name, value]) => ({
      name,
      value,
    }))
    .sort(
      (a, b) => b.value - a.value
    )
    .slice(0, 10);
};

// ============================================================
// ENERGY ANALYSIS
// ============================================================

export const getHighEnergyFacilities = (
  records: any[]
) => {
  if (!records.length) return [];

  const values = records.map((record) =>
    getNumber(
      record,
      'Daily_Electricity_Usage_MWh',
      'dailyElectricityUsageMwh',
      'dailyElectricityUsageMWh'
    )
  );

  const average =
    values.reduce(
      (sum, value) => sum + value,
      0
    ) / values.length;

  return records.filter((record) => {
    const usage = getNumber(
      record,
      'Daily_Electricity_Usage_MWh',
      'dailyElectricityUsageMwh',
      'dailyElectricityUsageMWh'
    );

    return usage > average * 1.2;
  });
};

export const getInefficientFacilities = (
  records: any[]
) => {
  return records.filter((record) => {
    return (
      getNumber(record, 'PUE', 'pue') >
      1.5
    );
  });
};

export const getWaterRiskFacilities = (
  records: any[]
) => {
  return records.filter((record) => {
    const value =
      record.Surrounding_Water_Stress_Tier ??
      record.surroundingWaterStressTier ??
      '';

    return String(value)
      .toLowerCase()
      .includes('high');
  });
};

export const generateEnergyInsights = (
  records: any[]
): string[] => {
  const highEnergy =
    getHighEnergyFacilities(records);

  const inefficient =
    getInefficientFacilities(records);

  const waterRisk =
    getWaterRiskFacilities(records);

  const insights: string[] = [];

  if (highEnergy.length > 0) {
    insights.push(
      `${highEnergy.length} facilities are consuming significantly higher electricity than average.`
    );
  }

  if (inefficient.length > 0) {
    insights.push(
      `${inefficient.length} facilities have a PUE above 1.5 and may require efficiency optimization.`
    );
  }

  if (waterRisk.length > 0) {
    insights.push(
      `${waterRisk.length} facilities are located in high water-stress regions.`
    );
  }

  if (insights.length === 0) {
    insights.push(
      'All monitored facilities are currently operating within normal efficiency ranges.'
    );
  }

  return insights;
};