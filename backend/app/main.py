from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routes import maintenance
from app.routes import occupancy


app = FastAPI(
    title="FacilityOps AI Platform API",
    description="Backend API for Energy Intelligence, Predictive Maintenance, and Occupancy Intelligence",
    version="1.0.0",
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        # Local frontend
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:4173",
        "http://127.0.0.1:4173",
        "http://localhost:4174",
        "http://127.0.0.1:4174",
        "http://localhost:4175",
        "http://127.0.0.1:4175",

        # Deployed frontend
        "https://agentic-facilityops-ai-platform-1-vz9w.onrender.com",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return {
        "message": "FacilityOps AI Platform API is running",
        "status": "online"
    }


@app.get("/api/health")
def health():
    return {
        "status": "healthy"
    }


# M2 - Predictive Maintenance
app.include_router(maintenance.router)

# M3 - Occupancy Intelligence
app.include_router(occupancy.router)