from fastapi import APIRouter, HTTPException
import logging
from models.requests import DominanceRequest
from services.dominance_service import get_dominance_map

logger = logging.getLogger(__name__)
router = APIRouter()

@router.post("/dominance/map")
def get_dominance_map_route(req: DominanceRequest):
    """
    Extracts high-resolution XY coordinates classified spatially into 25 bins by fastest driver.
    """
    try:
        data = get_dominance_map(
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
