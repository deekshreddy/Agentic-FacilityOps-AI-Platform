import { OccupancyRecord } from "./occupancyService";

const DATASET_PATH = "/data/Occupancy_Estimation.csv";

/* ============================================================
   CSV PARSER
============================================================ */

const parseCSVLine = (line: string): string[] => {
  const result: string[] = [];
  let current = "";
  let insideQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      insideQuotes = !insideQuotes;
      continue;
    }

    if (char === "," && !insideQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }

  result.push(current.trim());

  return result;
};

/* ============================================================
   NUMBER CONVERSION
============================================================ */

const convertValue = (
  value: string,
  key: string
): string | number => {
  const cleaned = value
    .replace(/^"|"$/g, "")
    .trim();

  if (cleaned === "") {
    return "";
  }

  const numericColumns = new Set([
    "S1_Temp",
    "S2_Temp",
    "S3_Temp",
    "S4_Temp",

    "S1_Light",
    "S2_Light",
    "S3_Light",
    "S4_Light",

    "S1_Sound",
    "S2_Sound",
    "S3_Sound",
    "S4_Sound",

    "S5_CO2",
    "S5_CO2_Slope",

    "S6_PIR",
    "S7_PIR",

    "Room_Occupancy_Count",
  ]);

  if (numericColumns.has(key)) {
    const number = Number(cleaned);

    return Number.isFinite(number)
      ? number
      : 0;
  }

  return cleaned;
};

/* ============================================================
   NORMALIZE HEADER
============================================================ */

const normalizeHeader = (
  header: string
): string => {
  return header
    .replace(/^\uFEFF/, "")
    .replace(/^"|"$/g, "")
    .trim();
};

/* ============================================================
   LOAD OCCUPANCY DATA
============================================================ */

export const loadOccupancyData =
  async (): Promise<OccupancyRecord[]> => {
    const response = await fetch(DATASET_PATH, {
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(
        `Unable to load occupancy dataset: ${response.status}`
      );
    }

    const text = await response.text();

    if (!text.trim()) {
      throw new Error(
        "Occupancy CSV is empty."
      );
    }

    const lines = text
      .replace(/\r/g, "")
      .split("\n")
      .filter((line) => line.trim() !== "");

    if (lines.length < 2) {
      throw new Error(
        "Occupancy CSV contains no data rows."
      );
    }

    /* ========================================================
       HEADER
    ======================================================== */

    const headers = parseCSVLine(lines[0])
      .map(normalizeHeader);

    if (
      !headers.includes(
        "Room_Occupancy_Count"
      )
    ) {
      throw new Error(
        "Room_Occupancy_Count column was not found in the occupancy CSV."
      );
    }

    /* ========================================================
       RECORDS
    ======================================================== */

    const records: OccupancyRecord[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]);

      if (values.length === 0) {
        continue;
      }

      const record: OccupancyRecord = {};

      headers.forEach((header, index) => {
        record[header] = convertValue(
          values[index] ?? "",
          header
        );
      });

      /* Ignore completely empty rows */
      const occupancyValue =
        record.Room_Occupancy_Count;

      const hasData =
        record.Date ||
        record.Time ||
        occupancyValue !== undefined;

      if (hasData) {
        records.push(record);
      }
    }

    /* ========================================================
       VALIDATION
    ======================================================== */

    if (records.length === 0) {
      throw new Error(
        "No valid occupancy records were found."
      );
    }

    console.log(
      "Occupancy dataset loaded:",
      records.length,
      "records"
    );

    console.log(
      "Occupancy columns:",
      Object.keys(records[0])
    );

    console.log(
      "First occupancy values:",
      records
        .slice(0, 10)
        .map(
          (record) =>
            record.Room_Occupancy_Count
        )
    );

    return records;
  };