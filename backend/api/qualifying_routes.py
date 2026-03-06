from fastapi import APIRouter, HTTPException, Query
import logging
from services.qualifying_service import get_qualifying_splits

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/qualifying/splits")
def qualifying_splits(
    year: int = Query(...),
    prix: str = Query(...)
):
    """
    GET /api/v1/qualifying/splits?year=2024&prix=BAH
    Returns Q1/Q2/Q3 breakdown with best lap per driver per segment.
    """
    try:
        data = get_qualifying_splits(year, prix)
        return {"status": "success", "data": data}
    except ValueError as ve:
        raise HTTPException(status_code=404, detail=str(ve))
    except Exception as e:
        logger.error(f"Qualifying splits error: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error in qualifying analysis.")
