from pathlib import Path
import pandas as pd


BASE_DIR = Path(__file__).resolve().parents[1]

DATA_DIR = BASE_DIR / "data"

CSV_PATH = DATA_DIR / "spectra_maintenance_ai4i.csv"


def load_maintenance_data():
    """
    Load the complete maintenance CSV.
    """

    if not CSV_PATH.exists():
        raise FileNotFoundError(
            f"Maintenance CSV not found at: {CSV_PATH}"
        )

    df = pd.read_csv(CSV_PATH)

    # Remove completely empty rows
    df = df.dropna(how="all")

    return df


# ============================================================
# NORMALIZE COLUMN NAMES
# ============================================================

def normalize_columns(df):
    df = df.copy()

    df.columns = (
        df.columns
        .str.strip()
        .str.lower()
        .str.replace(" ", "_")
    )

    return df


# ============================================================
# MACHINE HEALTH CALCULATION
# ============================================================

def calculate_machine_health(row):
    """
    Calculate machine health using the available
    maintenance sensor values.

    Health:
      80-100 = Healthy
      50-79  = Warning
      0-49   = Critical
    """

    score = 100.0

    # Air temperature
    if "air_temp" in row:
        try:
            air_temp = float(row["air_temp"])

            if air_temp > 310:
                score -= 20
            elif air_temp > 305:
                score -= 10
        except:
            pass

    # Process temperature
    if "process_temp" in row:
        try:
            process_temp = float(row["process_temp"])

            if process_temp > 320:
                score -= 20
            elif process_temp > 315:
                score -= 10
        except:
            pass

    # Rotational speed
    if "speed" in row:
        try:
            speed = float(row["speed"])

            if speed < 1200:
                score -= 10
            elif speed > 2000:
                score -= 10
        except:
            pass

    # Torque
    if "torque" in row:
        try:
            torque = float(row["torque"])

            if torque > 70:
                score -= 20
            elif torque > 55:
                score -= 10
        except:
            pass

    # Tool wear
    if "tool_wear" in row:
        try:
            tool_wear = float(row["tool_wear"])

            if tool_wear > 200:
                score -= 30
            elif tool_wear > 150:
                score -= 15
            elif tool_wear > 100:
                score -= 5
        except:
            pass

    # Actual failure indicator
    if "target_real" in row:
        try:
            target_real = float(row["target_real"])

            if target_real == 1:
                score -= 50
        except:
            pass

    score = max(0, min(100, score))

    return round(score, 2)


# ============================================================
# ADD HEALTH STATUS TO EVERY RECORD
# ============================================================

def prepare_data():

    df = load_maintenance_data()
    df = normalize_columns(df)

    df["machine_health"] = df.apply(
        calculate_machine_health,
        axis=1
    )

    def status(score):

        if score >= 80:
            return "Healthy"

        if score >= 50:
            return "Warning"

        return "Critical"

    df["health_status"] = df["machine_health"].apply(status)

    return df


# ============================================================
# SUMMARY
# ============================================================

def get_maintenance_summary():

    df = prepare_data()

    total = len(df)

    healthy = int(
        (df["health_status"] == "Healthy").sum()
    )

    warning = int(
        (df["health_status"] == "Warning").sum()
    )

    critical = int(
        (df["health_status"] == "Critical").sum()
    )

    failure_records = 0

    if "target_real" in df.columns:
        try:
            failure_records = int(
                pd.to_numeric(
                    df["target_real"],
                    errors="coerce"
                ).fillna(0).sum()
            )
        except:
            failure_records = 0

    average_health = round(
        float(df["machine_health"].mean()),
        2
    ) if total > 0 else 0

    return {
        "total_machines": total,
        "healthy_machines": healthy,
        "warning_machines": warning,
        "critical_machines": critical,
        "failure_records": failure_records,
        "average_machine_health": average_health
    }


# ============================================================
# ALL RECORDS
# ============================================================

def get_all_maintenance_records():

    df = prepare_data()

    # Convert NaN to None-compatible values
    df = df.where(pd.notnull(df), None)

    return df.to_dict(orient="records")


# ============================================================
# DIAGNOSTIC
# ============================================================

def get_diagnostic():

    csv_files = []

    if DATA_DIR.exists():

        csv_files = [
            file.name
            for file in DATA_DIR.glob("*.csv")
        ]

    df = None

    try:
        df = load_maintenance_data()
        records_loaded = len(df)

        sample_record = (
            df.iloc[0].where(pd.notnull(df.iloc[0]), None).to_dict()
            if records_loaded > 0
            else None
        )

    except Exception as e:

        records_loaded = 0
        sample_record = None

        return {
            "data_directory": str(DATA_DIR),
            "csv_path": str(CSV_PATH),
            "csv_files": csv_files,
            "records_loaded": records_loaded,
            "sample_record": sample_record,
            "error": str(e)
        }

    return {
        "data_directory": str(DATA_DIR),
        "csv_path": str(CSV_PATH),
        "csv_files": csv_files,
        "records_loaded": records_loaded,
        "sample_record": sample_record
    }