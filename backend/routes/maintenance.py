from fastapi import APIRouter
from services.maintenance_service import (
    load_maintenance_data,
    prepare_data,
    get_maintenance_summary,
    get_all_maintenance_records,
    get_diagnostic,
)

router = APIRouter(
    prefix="/api/maintenance",
    tags=["Maintenance"],
)


# ============================================================
# GET ALL MAINTENANCE RECORDS
# ============================================================

@router.get("/")
def get_maintenance():
    records = get_all_maintenance_records()

    return {
        "total_records": len(records),
        "records": records,
    }


# ============================================================
# MAINTENANCE SUMMARY
# ============================================================

@router.get("/summary")
def maintenance_summary():
    return get_maintenance_summary()


# ============================================================
# DIAGNOSTIC
# ============================================================

@router.get("/diagnostic")
def diagnostic():
    return get_diagnostic()


# ============================================================
# HEALTH STATUS COUNTS
# ============================================================

@router.get("/status")
def maintenance_status():

    df = prepare_data()

    healthy = int(
        (df["health_status"] == "Healthy").sum()
    )

    warning = int(
        (df["health_status"] == "Warning").sum()
    )

    critical = int(
        (df["health_status"] == "Critical").sum()
    )

    return {
        "total": len(df),
        "healthy": healthy,
        "warning": warning,
        "critical": critical,
    }


# ============================================================
# FAILURE RECORDS
# ============================================================

@router.get("/failures")
def maintenance_failures():

    df = prepare_data()

    if "target_real" in df.columns:
        failures = df[
            df["target_real"].astype(str).isin(
                ["1", "1.0", "true", "True"]
            )
        ]
    else:
        failures = df.iloc[0:0]

    failures = failures.where(
        failures.notna(),
        None
    )

    records = failures.to_dict(
        orient="records"
    )

    return {
        "total_failures": len(records),
        "records": records,
    }


# ============================================================
# HEALTHY MACHINES
# ============================================================

@router.get("/healthy")
def healthy_machines():

    df = prepare_data()

    machines = df[
        df["health_status"] == "Healthy"
    ]

    machines = machines.where(
        machines.notna(),
        None
    )

    records = machines.to_dict(
        orient="records"
    )

    return {
        "total": len(records),
        "records": records,
    }


# ============================================================
# WARNING MACHINES
# ============================================================

@router.get("/warning")
def warning_machines():

    df = prepare_data()

    machines = df[
        df["health_status"] == "Warning"
    ]

    machines = machines.where(
        machines.notna(),
        None
    )

    records = machines.to_dict(
        orient="records"
    )

    return {
        "total": len(records),
        "records": records,
    }


# ============================================================
# CRITICAL MACHINES
# ============================================================

@router.get("/critical")
def critical_machines():

    df = prepare_data()

    machines = df[
        df["health_status"] == "Critical"
    ]

    machines = machines.where(
        machines.notna(),
        None
    )

    records = machines.to_dict(
        orient="records"
    )

    return {
        "total": len(records),
        "records": records,
    }