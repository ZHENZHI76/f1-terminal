import os
import fastf1
import polars as pl
import numpy as np
from scipy.stats import linregress
import logging

logger = logging.getLogger(__name__)

CACHE_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "f1_cache")
os.makedirs(CACHE_DIR, exist_ok=True)
fastf1.Cache.enable_cache(CACHE_DIR)

def get_stint_analysis(year: int, grand_prix: str, session_type: str, driver: str) -> dict:
    """
    Quant-Level Stint Analysis:
    Loads a session, extracts laps for a specific driver.
    Performs rigorous sanitization (drop in/out laps, SC/VSC, outliers).
    Calculates degradation via linear regression per stint.
    """
    try:
        logger.info(f"Initiating FastF1 Stint Analysis fetch for {year} {grand_prix} ({session_type}) Driver: {driver}")
        session = fastf1.get_session(year, grand_prix, session_type)
        session.load(telemetry=False, laps=True, weather=False)
        
        # 1. Load laps for driver
        laps = session.laps.pick_driver(driver)
        
        if laps.empty:
            raise ValueError(f"No laps found for {driver} in {year} {grand_prix} {session_type}")

        # 2. Strict Data Sanitization
        # Drop in-laps and out-laps
        valid_laps = laps.loc[(laps['PitOutTime'].isnull()) & (laps['PitInTime'].isnull())].copy()
        
        # Drop yellow flags, VSC, SC (TrackStatus must be '1', or '1' and '2', we will use '1' for purely green flag conditions)
        # However, track status might contain multiple string digits. Let's just pick accurate laps usually determined by fastf1 'is_accurate'
        valid_laps = valid_laps[valid_laps['IsAccurate'] == True].copy()
        
        if valid_laps.empty:
            raise ValueError(f"No valid racing laps found for {driver} after sanitization.")

        # 3. Feature Engineering
        valid_laps['LapTime_sec'] = valid_laps['LapTime'].dt.total_seconds()
        
        # Calculate stint average and remove 107% outliers
        stint_avg = valid_laps['LapTime_sec'].mean()
        valid_laps = valid_laps[valid_laps['LapTime_sec'] <= stint_avg * 1.07]

        # Convert to Polars for clean processing and structuring
        df = pl.from_pandas(valid_laps[['LapNumber', 'Stint', 'Compound', 'TyreLife', 'LapTime_sec']])

        scatter_points = []
        trendlines = []

        # 4. Linear Regression Fitting per Stint
        stints = df.get_column("Stint").unique().to_list()
        
        for stint in sorted(stints):
            stint_df = df.filter(pl.col("Stint") == stint)
            if stint_df.height < 3:
                continue # Skip stints too short for meaningful regression
            
            x = stint_df.get_column("TyreLife").to_numpy()
            y = stint_df.get_column("LapTime_sec").to_numpy()
            compound = stint_df.get_column("Compound").to_list()[0]
            
            # Scatter points
            for i in range(len(x)):
                scatter_points.append({
                    "Stint": int(stint),
                    "TyreLife": int(x[i]),
                    "LapTime": float(y[i]),
                    "Compound": compound
                })
                
            # Linear Regression
            slope, intercept, r_value, p_value, std_err = linregress(x, y)
            trendlines.append({
                "Stint": int(stint),
                "Compound": compound,
                "Slope": float(slope),      # Degradation per lap in seconds
                "Intercept": float(intercept),
                "StartX": int(x.min()),
                "EndX": int(x.max())
            })

        logger.info(f"Stint analysis complete for {driver}. Extracted {len(trendlines)} valid stints.")

        return {
            "driver": driver,
            "scatter_points": scatter_points,
            "trendlines": trendlines
        }

    except Exception as e:
        logger.error(f"Stint analysis failed: {str(e)}")
        raise
