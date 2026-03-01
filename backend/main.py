from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import fastf1
import os

from api.routes import router as telemetry_router

# Initialize cache path for FastF1
CACHE_DIR = os.path.join(os.path.dirname(__file__), "f1_cache")
os.makedirs(CACHE_DIR, exist_ok=True)
fastf1.Cache.enable_cache(CACHE_DIR)

app = FastAPI(title="F1 Terminal API", description="High-performance backend for F1 Bloomberg Terminal")

# Configure CORS for frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Connect Telemetry routes
app.include_router(telemetry_router)

@app.get("/")
def read_root():
    return {"message": "Welcome to F1 Terminal API"}

@app.get("/health")
def health_check():
    # Server health probe 2
    return {"status": "healthy"}
