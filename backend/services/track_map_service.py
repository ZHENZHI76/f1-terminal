import fastf1
import polars as pl
import logging

logger = logging.getLogger(__name__)

def get_track_map_telemetry(year: int, grand_prix: str, session_type: str, driver: str, map_type: str = 'speed') -> list[list[float]]:
    """
    Quant-Level Data Extraction:
    Extracts the X, Y coordinates and a specified Z-axis dimension (Speed or nGear) for the fastest lap of a specific driver.
    """
    try:
        logger.info(f"Extracting Geospatial Track Map telemetry for {driver} in {year} {grand_prix} ({session_type})")
        session = fastf1.get_session(year, grand_prix, session_type)
        session.load(telemetry=True, laps=True, weather=False)
        
        lap = session.laps.pick_driver(driver).pick_fastest()
        if lap.empty:
            raise ValueError(f"Could not find valid fastest lap for {driver} in {year} {grand_prix}")
            
        # Get raw telemetry preserving positional coordinates
        tel = lap.get_telemetry()
        
        target_col = 'Speed' if map_type.lower() == 'speed' else 'nGear'
        
        # We need X, Y, and target col mapping for ECharts
        df = pl.from_pandas(tel[['X', 'Y', target_col]].copy())
        
        # Drop rows where GPS coordinates or target field are missing
        df = df.drop_nulls().fill_nan(None).drop_nulls()
        
        # Convert into nested list of float values
        track_map_data = []
        for row in df.iter_rows():
             if all(v is not None for v in row):
                  track_map_data.append([float(row[0]), float(row[1]), float(row[2])])
                  
        logger.info(f"Generated track map array. Total Nodes: {len(track_map_data)}")
        return track_map_data
        
    except Exception as e:
        logger.error(f"Track map calculation failed: {str(e)}")
        raise
