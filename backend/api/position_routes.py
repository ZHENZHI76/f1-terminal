from fastapi import APIRouter, HTTPException, Query
import logging
from services.position_service import get_position_chart

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/position/chart")
def position_chart(
    year: int = Query(...),
    prix: str = Query(...),
    session: str = Query(default="R")
):
    """
    GET /api/v1/position/chart?year=2024&prix=BAH&session=R
    Returns lap-by-lap position data for all drivers.
    """
    try:
        data = get_position_chart(year, prix, session)
        return {"status": "success", "data": data}
    except ValueError as ve:
        raise HTTPException(status_code=404, detail=str(ve))
    except Exception as e:
        logger.error(f"Position chart error: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error in position chart.")
