from pydantic import BaseModel, ConfigDict
from typing import Optional

class BaseF1Request(BaseModel):
    year: int
    prix: str
    session: str

class TelemetryRequest(BaseF1Request):
    driver_a: str
    driver_b: Optional[str] = None
    
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "year": 2024,
                "prix": "BAH",
                "session": "Q",
                "driver_a": "VER",
                "driver_b": "LEC"
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
