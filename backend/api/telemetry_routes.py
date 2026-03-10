from fastapi import APIRouter, HTTPException
import logging
from models.requests import TelemetryRequest, MultiTelemetryRequest
from services.telemetry_service import get_driver_telemetry_comparison
from services.multi_telemetry_service import get_multi_driver_telemetry

logger = logging.getLogger(__name__)
router = APIRouter()

@router.post("/telemetry/compare")
def compare_telemetry(req: TelemetryRequest):
    """
    Legacy 2-driver telemetry comparison endpoint.
    """
    try:
        result = get_driver_telemetry_comparison(
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
                "data_points": len(result.get("telemetry", []))
            },
            "lap_meta": result.get("meta", {}),
            "data": result.get("telemetry", []),
            "corners": result.get("corners", [])
        }
    except ValueError as ve:
        raise HTTPException(status_code=404, detail=str(ve))
    except Exception as e:
        logger.error(f"API Error in compare_telemetry: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Telemetry processing error: {str(e)}")


@router.post("/telemetry/multi")
def multi_telemetry(req: MultiTelemetryRequest):
    """
    Multi-driver telemetry overlay (1-6 drivers).
    Returns per-driver telemetry traces aligned on a common distance axis.
    """
    try:
        result = get_multi_driver_telemetry(
            req.year,
            req.prix,
            req.session,
            req.drivers
        )
        return {
            "status": "success",
            "metadata": {
                "year": req.year,
                "prix": req.prix,
                "session": req.session,
                "drivers": [d["code"] for d in result["drivers"]],
                "distance_points": result["distance_points"],
            },
            "data": result["drivers"],
            "corners": result.get("corners", [])
        }
    except ValueError as ve:
        raise HTTPException(status_code=404, detail=str(ve))
    except Exception as e:
        logger.error(f"API Error in multi_telemetry: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Multi-driver telemetry error: {str(e)}")
