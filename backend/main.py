from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import fastf1
import os

from api import (
    telemetry_routes,
    strategy_routes,
    insight_routes,
    track_map_routes,
    dominance_routes,
    macro_routes,
    universal_data_routes,
    results_routes,
    sector_routes,
    qualifying_routes,
    position_routes,
    pitstop_routes,
    standings_routes,
    laps_routes,
    circuit_info_routes,
    pace_routes
)
# Initialize cache path for FastF1
CACHE_DIR = os.path.join(os.path.dirname(__file__), "f1_cache")
os.makedirs(CACHE_DIR, exist_ok=True)
fastf1.Cache.enable_cache(CACHE_DIR)

app = FastAPI(title="F1 Terminal API", description="High-performance backend for F1 Bloomberg Terminal")

# Configure CORS for frontend access
# In production, set CORS_ORIGINS env var to your domain(s), comma-separated.
# Example: CORS_ORIGINS=https://f1.shuoguo.org,https://f1-api.shuoguo.org
_default_origins = "http://localhost:3000,http://127.0.0.1:3000"
_cors_origins = os.environ.get("CORS_ORIGINS", _default_origins).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in _cors_origins],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Connect Telemetry and Quant routes with /api/v1 prefix
app.include_router(telemetry_routes.router, prefix="/api/v1", tags=["telemetry"])
app.include_router(strategy_routes.router, prefix="/api/v1", tags=["strategy"])
app.include_router(insight_routes.router, prefix="/api/v1", tags=["insight"])
app.include_router(track_map_routes.router, prefix="/api/v1", tags=["track-map"])
app.include_router(dominance_routes.router, prefix="/api/v1", tags=["dominance"])
app.include_router(macro_routes.router, prefix="/api/v1", tags=["macro"])
app.include_router(universal_data_routes.router, prefix="/api/v1", tags=["data-gateway"])
app.include_router(results_routes.router, prefix="/api/v1", tags=["results"])
app.include_router(sector_routes.router, prefix="/api/v1", tags=["sectors"])
app.include_router(qualifying_routes.router, prefix="/api/v1", tags=["qualifying"])
app.include_router(position_routes.router, prefix="/api/v1", tags=["position"])
app.include_router(pitstop_routes.router, prefix="/api/v1", tags=["pitstops"])
app.include_router(standings_routes.router, prefix="/api/v1", tags=["standings"])
app.include_router(laps_routes.router, prefix="/api/v1", tags=["laps"])
app.include_router(circuit_info_routes.router, prefix="/api/v1", tags=["circuit-info"])
app.include_router(pace_routes.router, prefix="/api/v1", tags=["pace"])

@app.get("/")
def read_root():
    return {"message": "Welcome to F1 Terminal API"}

@app.get("/health")
def health_check():
    # Server health probe 2
    return {"status": "healthy"}
