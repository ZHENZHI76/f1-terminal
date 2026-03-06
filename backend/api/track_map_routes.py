from fastapi import APIRouter, HTTPException
import logging
from models.requests import TrackMapRequest
from services.track_map_service import get_track_map_telemetry

logger = logging.getLogger(__name__)
router = APIRouter()

@router.post("/track-map/speed")
def get_track_map_speed(req: TrackMapRequest):
    """
    Extracts high-resolution XY coordinates paired with Speed to render track geospatial heatmaps.
    Now includes corner annotations and circuit metadata for overlay rendering.
    """
    try:
        result = get_track_map_telemetry(
            req.year,
            req.prix,
            req.session,
            req.driver,
            map_type='speed'
        )
        return {
            "status": "success",
            "metadata": {
                "year": req.year,
                "prix": req.prix,
                "session": req.session,
                "driver": req.driver,
                "map_type": "speed",
                "nodes": len(result.get("track_data", [])),
                "circuit_length": result.get("circuit_length", 0),
                "rotation": result.get("rotation", 0),
            },
            "data": result.get("track_data", []),
            "corners": result.get("corners", []),
        }
    except ValueError as ve:
        raise HTTPException(status_code=404, detail=str(ve))
    except Exception as e:
        logger.error(f"API Error in track_map_speed: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error executing Track Map spatial extraction.")

@router.post("/track-map/gear")
def get_track_map_gear(req: TrackMapRequest):
    """
    Extracts high-resolution XY coordinates paired with nGear to render transmission telemetry.
    Now includes corner annotations and circuit metadata for overlay rendering.
    """
    try:
        result = get_track_map_telemetry(
            req.year,
            req.prix,
            req.session,
            req.driver,
            map_type='gear'
        )
        return {
            "status": "success",
            "metadata": {
                "year": req.year,
                "prix": req.prix,
                "session": req.session,
                "driver": req.driver,
                "map_type": "gear",
                "nodes": len(result.get("track_data", [])),
                "circuit_length": result.get("circuit_length", 0),
                "rotation": result.get("rotation", 0),
            },
            "data": result.get("track_data", []),
            "corners": result.get("corners", []),
        }
    except ValueError as ve:
        raise HTTPException(status_code=404, detail=str(ve))
    except Exception as e:
        logger.error(f"API Error in track_map_gear: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error executing Gear Map spatial extraction.")
