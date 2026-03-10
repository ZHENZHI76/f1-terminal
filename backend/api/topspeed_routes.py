from fastapi import APIRouter, HTTPException, Query
import logging
from services.topspeed_service import get_speed_trap_rankings

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/topspeed")
def speed_traps(
    year: int = Query(...),
    prix: str = Query(...),
    session: str = Query(default="Q")
):
    """
    GET /api/v1/topspeed?year=2025&prix=AUS&session=Q
    Returns all-driver speed trap rankings for 4 measurement points.
    """
    try:
        data = get_speed_trap_rankings(year, prix, session)
        return {"status": "success", "data": data}
    except ValueError as ve:
        raise HTTPException(status_code=404, detail=str(ve))
    except Exception as e:
        logger.error(f"TOPSPEED error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Speed trap analysis error: {str(e)}")
