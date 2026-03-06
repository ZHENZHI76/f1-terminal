import fastf1
import polars as pl
import numpy as np
import logging
from services.circuit_info_service import get_circuit_info

logger = logging.getLogger(__name__)


def get_track_map_telemetry(year: int, grand_prix: str, session_type: str,
                            driver: str, map_type: str = 'speed') -> dict:
    """
    Quant-Level Data Extraction:
    Extracts X, Y coordinates with a Z-axis (Speed/nGear), plus corner annotations
    and circuit metadata from CircuitInfo for overlay rendering.
    
    Returns dict with:
      - track_data: [[x, y, z], ...] for heatmap rendering
      - corners: [{number, letter, x, y, distance, angle}] for annotation overlay
      - rotation: float for optimal rendering angle
      - circuit_length: float in meters
    """
    try:
        logger.info(f"Extracting Geospatial Track Map telemetry for {driver} in {year} {grand_prix} ({session_type})")
        session = fastf1.get_session(year, grand_prix, session_type)
        session.load(telemetry=True, laps=True, weather=False)
        
        lap = session.laps.pick_drivers(driver).pick_fastest()
        if lap.empty:
            raise ValueError(f"Could not find valid fastest lap for {driver} in {year} {grand_prix}")
            
        # Get raw telemetry preserving positional coordinates
        tel = lap.get_telemetry()
        
        target_col = 'Speed' if map_type.lower() == 'speed' else 'nGear'
        
        # We need X, Y, Distance, and target col mapping for ECharts
        cols_needed = ['X', 'Y', 'Distance', target_col]
        available = [c for c in cols_needed if c in tel.columns]
        df = pl.from_pandas(tel[available].copy())
        
        # Drop rows where GPS coordinates or target field are missing
        df = df.drop_nulls().fill_nan(None).drop_nulls()
        
        # Convert into nested list of float values [x, y, z]
        track_map_data = []
        for row in df.iter_rows():
            vals = [row[df.columns.index(c)] for c in ['X', 'Y', target_col]]
            if all(v is not None for v in vals):
                track_map_data.append([float(vals[0]), float(vals[1]), float(vals[2])])
                   
        # ─── Circuit Info overlay ──────────────────────────────────────
        corners = []
        rotation = 0.0
        circuit_length = 0.0
        try:
            ci = get_circuit_info(year, grand_prix, session_type)
            corners = ci.get("corners", [])
            rotation = ci.get("rotation", 0.0)
            circuit_length = ci.get("circuit_length", 0.0)
        except Exception as ce:
            logger.warning(f"CircuitInfo overlay failed (non-fatal): {ce}")

        logger.info(f"Generated track map array. Total Nodes: {len(track_map_data)}, Corners: {len(corners)}")
        
        return {
            "track_data": track_map_data,
            "corners": corners,
            "rotation": rotation,
            "circuit_length": circuit_length,
        }
        
    except Exception as e:
        logger.error(f"Track map calculation failed: {str(e)}")
        raise
