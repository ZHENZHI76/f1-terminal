from fastapi import APIRouter, HTTPException, Query
from typing import Optional
import logging
from services.pitstop_service import get_pitstop_analysis

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/pitstops")
def pitstops(
    year: int = Query(...),
    prix: str = Query(...),
    session: str = Query(default="R"),
    driver: Optional[str] = Query(default=None)
):
    """
    GET /api/v1/pitstops?year=2024&prix=BAH&session=R&driver=VER
    Returns pit stop data. If driver is omitted, returns all drivers.
    """
    try:
        data = get_pitstop_analysis(year, prix, session, driver)
        return {"status": "success", "data": data}
    except ValueError as ve:
        raise HTTPException(status_code=404, detail=str(ve))
    except Exception as e:
        logger.error(f"Pitstop API error: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error in pitstop analysis.")
