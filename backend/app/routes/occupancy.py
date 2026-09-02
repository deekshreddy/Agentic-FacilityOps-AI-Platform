from fastapi import APIRouter


router = APIRouter(
    prefix="/api/occupancy",
    tags=["Occupancy"]
)


@router.get("/health")
def occupancy_health():
    return {
        "status": "ok",
        "agent": "Occupancy Agent"
    }