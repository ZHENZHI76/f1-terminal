from fastapi import APIRouter, HTTPException, Query
import logging
from services.tyre_service import get_compound_analysis

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/tyre")
def compound_analysis(
    year: int = Query(...),
    prix: str = Query(...),
    session: str = Query(default="R")
):
    """
    GET /api/v1/tyre?year=2025&prix=AUS&session=R
    Returns per-compound performance analysis with degradation and crossovers.
    """
    try:
        data = get_compound_analysis(year, prix, session)
        return {"status": "success", "data": data}
    except ValueError as ve:
        raise HTTPException(status_code=404, detail=str(ve))
    except Exception as e:
        logger.error(f"TYRE error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Compound analysis error: {str(e)}")
