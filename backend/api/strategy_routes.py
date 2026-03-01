from fastapi import APIRouter, HTTPException
import logging
from models.requests import StintRequest
from services.stint_service import get_stint_analysis

logger = logging.getLogger(__name__)
router = APIRouter()

@router.post("/strategy/stints")
def get_stints(req: StintRequest):
    """
    Quantitative Stint Analysis endpoint. Calculates long run pace and tyre degradation.
    """
    try:
        data = get_stint_analysis(
            req.year,
            req.prix,
            req.session,
            req.driver_a
        )
        return {
            "status": "success",
            "metadata": {
                "year": req.year,
                "prix": req.prix,
                "session": req.session,
                "driver": req.driver_a
            },
            "data": data
        }
    except ValueError as ve:
        raise HTTPException(status_code=404, detail=str(ve))
    except Exception as e:
        logger.error(f"API Error in stint_analysis: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error executing Quant Stint processing.")
