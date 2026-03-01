from fastapi import APIRouter, HTTPException
import logging
from models.requests import TelemetryRequest
from services.telemetry_service import get_driver_telemetry_comparison

logger = logging.getLogger(__name__)
router = APIRouter()

@router.post("/telemetry/compare")
def compare_telemetry(req: TelemetryRequest):
    """
    Fetch and compare fastest lap telemetry for two drivers using quant-level alignment.
    """
    try:
        data = get_driver_telemetry_comparison(
            req.year, 
            req.prix, 
            req.session, 
            req.driver_a, 
            req.driver_b
        )
        return {
            "status": "success",
            "metadata": {
                "year": req.year,
                "prix": req.prix,
                "session": req.session,
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
