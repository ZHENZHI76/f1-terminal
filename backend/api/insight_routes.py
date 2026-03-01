from fastapi import APIRouter, HTTPException
import logging
from models.requests import TelemetryRequest
from services.llm_insight import generate_deepseek_insight

logger = logging.getLogger(__name__)
router = APIRouter()

@router.post("/insight/generate")
async def generate_insight(req: TelemetryRequest):
    """
    Generate DeepSeek V3 quantitative strategy insight report.
    """
    try:
        report = await generate_deepseek_insight(
            req.year, 
            req.prix, 
            req.session, 
            req.driver_a, 
            req.driver_b
        )
        return {
            "status": "success",
            "report": report
        }
    except ValueError as ve:
        raise HTTPException(status_code=404, detail=str(ve))
    except Exception as e:
        logger.error(f"API Error in generate_insight: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error generating AI insight.")
