from fastapi import APIRouter, HTTPException, Query
import logging
from services.results_service import get_session_results, get_driver_list

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/results")
def session_results(
    year: int = Query(...),
    prix: str = Query(...),
    session: str = Query(...)
):
    """
    GET /api/v1/results?year=2024&prix=BAH&session=Q
    Returns session results: positions, Q1/Q2/Q3, grid, points, status, team colors.
    """
    try:
        data = get_session_results(year, prix, session)
        return {"status": "success", "data": data}
    except ValueError as ve:
        raise HTTPException(status_code=404, detail=str(ve))
    except Exception as e:
        logger.error(f"Results API error: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error fetching session results.")


@router.get("/drivers")
def driver_list(
    year: int = Query(...),
    prix: str = Query(...),
    session: str = Query(...)
):
    """
    GET /api/v1/drivers?year=2024&prix=BAH&session=Q
    Returns compact driver listing: abbreviation, number, team, team color.
    """
    try:
        data = get_driver_list(year, prix, session)
        return {"status": "success", "data": data}
    except ValueError as ve:
        raise HTTPException(status_code=404, detail=str(ve))
    except Exception as e:
        logger.error(f"Drivers API error: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error fetching driver list.")
