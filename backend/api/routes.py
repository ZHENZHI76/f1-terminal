from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, ConfigDict
from services.telemetry_service import get_driver_telemetry_comparison
from services.llm_insight import generate_deepseek_insight
from services.stint_service import get_stint_analysis
from services.track_map_service import get_track_map_telemetry
from services.dominance_service import get_dominance_map
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1", tags=["telemetry"])

from typing import Optional

class TelemetryCompareRequest(BaseModel):
    year: int
    grand_prix: str
    session_type: str = 'Q'
    driver_a: str
    driver_b: Optional[str] = None
    
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "year": 2023,
                "grand_prix": "Miami",
                "session_type": "Q",
                "driver_a": "VER",
                "driver_b": "PER"
            }
        }
    )

class StintAnalysisRequest(BaseModel):
    year: int
    grand_prix: str
    session_type: str = 'R'
    driver: str

class TrackMapRequest(BaseModel):
    year: int
    grand_prix: str
    session_type: str = 'Q'
    driver: str

class DominanceRequest(BaseModel):
    year: int
    grand_prix: str
    session_type: str = 'Q'
    driver_a: str
    driver_b: str

@router.post("/compare-telemetry")
def compare_telemetry(req: TelemetryCompareRequest):
    """
    Fetch and compare fastest lap telemetry for two drivers using quant-level alignment.
    """
    try:
        data = get_driver_telemetry_comparison(
            req.year, 
            req.grand_prix, 
            req.session_type, 
            req.driver_a, 
            req.driver_b
        )
        return {
            "status": "success",
            "metadata": {
                "year": req.year,
                "grand_prix": req.grand_prix,
                "session_type": req.session_type,
                "driver_a": req.driver_a,
                "driver_b": req.driver_b,
                "data_points": len(data)
            },
            "data": data
        }
    except ValueError as ve:
        raise HTTPException(status_code=404, detail=str(ve))
    except Exception as e:
        logger.error(f"API Error in compare_telemetry: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error processing telemetry.")

@router.post("/generate-insight")
async def generate_insight(req: TelemetryCompareRequest):
    """
    Generate DeepSeek V3 quantitative strategy insight report.
    """
    try:
        report = await generate_deepseek_insight(
            req.year, 
            req.grand_prix, 
            req.session_type, 
            req.driver_a, 
            req.driver_b
        )
        return {
            "status": "success",
            "report": report
        }
    except ValueError as ve:
        raise HTTPException(status_code=404, detail=str(ve))
    except Exception as e:
        logger.error(f"API Error in generate_insight: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error generating AI insight.")

@router.post("/stint-analysis")
def get_stints(req: StintAnalysisRequest):
    """
    Quantitative Stint Analysis endpoint. Calculates long run pace and tyre degradation.
    """
    try:
        data = get_stint_analysis(
            req.year,
            req.grand_prix,
            req.session_type,
            req.driver
        )
        return {
            "status": "success",
            "metadata": {
                "year": req.year,
                "grand_prix": req.grand_prix,
                "session_type": req.session_type,
                "driver": req.driver
            },
            "data": data
        }
    except ValueError as ve:
        raise HTTPException(status_code=404, detail=str(ve))
    except Exception as e:
        logger.error(f"API Error in stint_analysis: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error executing Quant Stint processing.")

@router.post("/track-map/speed")
def get_track_map_speed(req: TrackMapRequest):
    """
    Extracts high-resolution XY coordinates paired with Speed to render track geospatial heatmaps.
    """
    try:
        data = get_track_map_telemetry(
            req.year,
            req.grand_prix,
            req.session_type,
            req.driver,
            map_type='speed'
        )
        return {
            "status": "success",
            "metadata": {
                "year": req.year,
                "grand_prix": req.grand_prix,
                "session_type": req.session_type,
                "driver": req.driver,
                "map_type": "speed",
                "nodes": len(data)
            },
            "data": data
        }
    except ValueError as ve:
        raise HTTPException(status_code=404, detail=str(ve))
    except Exception as e:
        logger.error(f"API Error in track_map_speed: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error executing Track Map spatial extraction.")

@router.post("/track-map/gear")
def get_track_map_gear(req: TrackMapRequest):
    """
    Extracts high-resolution XY coordinates paired with nGear to render transmission telemetry.
    """
    try:
        data = get_track_map_telemetry(
            req.year,
            req.grand_prix,
            req.session_type,
            req.driver,
            map_type='gear'
        )
        return {
            "status": "success",
            "metadata": {
                "year": req.year,
                "grand_prix": req.grand_prix,
                "session_type": req.session_type,
                "driver": req.driver,
                "map_type": "gear",
                "nodes": len(data)
            },
            "data": data
        }
    except ValueError as ve:
        raise HTTPException(status_code=404, detail=str(ve))
    except Exception as e:
        logger.error(f"API Error in track_map_gear: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error executing Gear Map spatial extraction.")

@router.post("/dominance/map")
def get_dominance_map_route(req: DominanceRequest):
    """
    Extracts high-resolution XY coordinates classified spatially into 25 bins by fastest driver.
    """
    try:
        data = get_dominance_map(
            req.year,
            req.grand_prix,
            req.session_type,
            req.driver_a,
            req.driver_b
        )
        return {
            "status": "success",
            "metadata": {
                "year": req.year,
                "grand_prix": req.grand_prix,
                "session_type": req.session_type,
                "driver_a": req.driver_a,
                "driver_b": req.driver_b,
                "pct_a": data["pct_a"],
                "pct_b": data["pct_b"]
            },
            "data": data
        }
    except ValueError as ve:
        raise HTTPException(status_code=404, detail=str(ve))
    except Exception as e:
        logger.error(f"API Error in dominance_map: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error executing mini-sector dominance.")
