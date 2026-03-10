from pydantic import BaseModel, ConfigDict
from typing import Optional

class BaseF1Request(BaseModel):
    year: int
    prix: str
    session: str

class TelemetryRequest(BaseF1Request):
    driver_a: str
    driver_b: Optional[str] = None
    lap_number: Optional[int] = None  # None = fastest, int = specific lap
    
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "year": 2024,
                "prix": "BAH",
                "session": "Q",
                "driver_a": "VER",
                "driver_b": "LEC",
                "lap_number": None
            }
        }
    )

class StintRequest(BaseF1Request):
    driver_a: str
    driver_b: Optional[str] = None

class TrackMapRequest(BaseF1Request):
    driver: str

class DominanceRequest(BaseF1Request):
    driver_a: str
    driver_b: str

class MultiTelemetryRequest(BaseF1Request):
    drivers: list[str]  # 1-6 driver codes, e.g. ["VER", "NOR", "LEC"]
    lap_number: Optional[int] = None  # None = fastest, int = specific lap

