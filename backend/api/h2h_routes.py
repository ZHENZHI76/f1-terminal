from fastapi import APIRouter, HTTPException, Query
import logging
from services.h2h_service import get_h2h_comparison

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/h2h")
def head_to_head(
    year: int = Query(...),
    driver_a: str = Query(...),
    driver_b: str = Query(...)
):
    """
    GET /api/v1/h2h?year=2025&driver_a=VER&driver_b=PER
    Returns season-wide head-to-head qualifying and race comparison.
    """
    try:
        data = get_h2h_comparison(year, driver_a, driver_b)
        return {"status": "success", "data": data}
    except ValueError as ve:
        raise HTTPException(status_code=404, detail=str(ve))
    except Exception as e:
        logger.error(f"H2H error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"H2H analysis error: {str(e)}")
