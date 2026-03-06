from fastapi import APIRouter, HTTPException, Query
from typing import Optional
import logging
from services.laps_service import get_lap_table

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/laps")
def laps_table(
    year: int = Query(...),
    prix: str = Query(...),
    session: str = Query(...),
    driver: Optional[str] = Query(default=None)
):
    """
    GET /api/v1/laps?year=2024&prix=BAH&session=R&driver=VER
    Full lap-by-lap table. Omit driver for all drivers.
    """
    try:
        data = get_lap_table(year, prix, session, driver)
        return {"status": "success", "data": data}
    except ValueError as ve:
        raise HTTPException(status_code=404, detail=str(ve))
    except Exception as e:
        logger.error(f"Laps API error: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error in lap table extraction.")
