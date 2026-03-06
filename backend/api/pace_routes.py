from fastapi import APIRouter, HTTPException, Query
import logging
from services.pace_service import get_multi_driver_pace

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/pace")
def multi_driver_pace(
    year: int = Query(...),
    prix: str = Query(...),
    session: str = Query(default="R"),
    drivers: str = Query(..., description="Comma-separated driver codes, e.g. VER,NOR,LEC")
):
    """
    GET /api/v1/pace?year=2024&prix=BAH&session=R&drivers=VER,NOR,LEC
    Multi-driver race pace comparison with degradation curves.
    """
    try:
        driver_list = [d.strip().upper() for d in drivers.split(",") if d.strip()]
        if len(driver_list) < 1:
            raise ValueError("At least 1 driver code required")
        if len(driver_list) > 6:
            raise ValueError("Maximum 6 drivers for pace comparison")

        data = get_multi_driver_pace(year, prix, session, driver_list)
        return {"status": "success", "data": data}
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        logger.error(f"Pace API error: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error in pace analysis.")
