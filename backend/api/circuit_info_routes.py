from fastapi import APIRouter, HTTPException, Query
import logging
from services.circuit_info_service import get_circuit_info

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/circuit-info")
def circuit_info(
    year: int = Query(...),
    prix: str = Query(...),
    session: str = Query(default="R")
):
    """
    GET /api/v1/circuit-info?year=2024&prix=BAH&session=R
    Returns full circuit metadata: corners, marshal lights/sectors, rotation, circuit length.
    """
    try:
        data = get_circuit_info(year, prix, session)
        return {"status": "success", "data": data}
    except ValueError as ve:
        raise HTTPException(status_code=404, detail=str(ve))
    except Exception as e:
        logger.error(f"CircuitInfo API error: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error in circuit info extraction.")
