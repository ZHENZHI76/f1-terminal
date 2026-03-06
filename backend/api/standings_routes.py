from fastapi import APIRouter, HTTPException, Query
import logging
from services.standings_service import get_driver_standings, get_constructor_standings

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/standings/wdc")
def wdc_standings(year: int = Query(...)):
    """
    GET /api/v1/standings/wdc?year=2024
    World Drivers' Championship standings.
    """
    try:
        data = get_driver_standings(year)
        return {"status": "success", "data": data}
    except ValueError as ve:
        raise HTTPException(status_code=404, detail=str(ve))
    except Exception as e:
        logger.error(f"WDC standings error: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error fetching WDC standings.")


@router.get("/standings/wcc")
def wcc_standings(year: int = Query(...)):
    """
    GET /api/v1/standings/wcc?year=2024
    World Constructors' Championship standings.
    """
    try:
        data = get_constructor_standings(year)
        return {"status": "success", "data": data}
    except ValueError as ve:
        raise HTTPException(status_code=404, detail=str(ve))
    except Exception as e:
        logger.error(f"WCC standings error: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error fetching WCC standings.")
