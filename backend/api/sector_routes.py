from fastapi import APIRouter, HTTPException
import logging
from models.requests import TelemetryRequest
from services.sector_service import get_sector_comparison

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/sectors/compare")
def sector_compare(req: TelemetryRequest):
    """
    POST /api/v1/sectors/compare
    Compare sector times and speed traps between two drivers.
    """
    try:
        data = get_sector_comparison(
            req.year, req.prix, req.session,
            req.driver_a, req.driver_b
        )
        return {"status": "success", "data": data}
    except ValueError as ve:
        raise HTTPException(status_code=404, detail=str(ve))
    except Exception as e:
        logger.error(f"Sector API error: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error in sector analysis.")
