from fastapi import APIRouter, HTTPException, Query
import logging
from services.gap_service import get_race_gap_analysis

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/gap")
def race_gap(
    year: int = Query(...),
    prix: str = Query(...),
    session: str = Query(default="R"),
    driver_a: str = Query(...),
    driver_b: str = Query(...)
):
    """
    GET /api/v1/gap?year=2025&prix=AUS&session=R&driver_a=VER&driver_b=NOR
    Returns lap-by-lap gap analysis between two drivers.
    """
    try:
        data = get_race_gap_analysis(year, prix, session, driver_a, driver_b)
        return {"status": "success", "data": data}
    except ValueError as ve:
        raise HTTPException(status_code=404, detail=str(ve))
    except Exception as e:
        logger.error(f"Gap analysis error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Gap analysis error: {str(e)}")
