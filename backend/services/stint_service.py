import os
import fastf1
import polars as pl
import numpy as np
from scipy.stats import linregress
import logging
from utils.gp_codes import resolve_gp_name

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
        session = fastf1.get_session(year, resolve_gp_name(grand_prix), session_type)
        session.load(telemetry=False, laps=True, weather=False)
        
        # 1. Load laps for driver
        laps = session.laps.pick_drivers(driver)
        
        if laps.empty:
            raise ValueError(f"No laps found for {driver} in {year} {grand_prix} {session_type}")

        # 2. Strict Data Sanitization using FastF1 built-in methods
        # pick_wo_box: Remove in-laps and out-laps
        # pick_track_status('1'): Only green flag laps
        # pick_accurate: Timing sync validation
        valid_laps = laps.pick_wo_box().pick_track_status('1', how='any').pick_accurate().copy()
        
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
                
            # Linear Regression: T_lap = T_base + α·L + f(W_f)
            slope, intercept, r_value, p_value, std_err = linregress(x, y)
            
            # Fuel correction: ~1.8 kg/lap burn × ~0.015 s/kg ≈ 0.027 s/lap lighter
            FUEL_CORRECTION_PER_LAP = 0.027
            # Pure tyre degradation = raw slope + fuel gain (since fuel makes car faster over time)
            tyre_deg_slope = slope + FUEL_CORRECTION_PER_LAP
            
            trendlines.append({
                "Stint": int(stint),
                "Compound": compound,
                "Slope": float(slope),             # Raw degradation (incl. fuel effect)
                "TyreDegSlope": float(tyre_deg_slope),  # Pure tyre deg (fuel-corrected)
                "FuelCorrPerLap": FUEL_CORRECTION_PER_LAP,
                "Intercept": float(intercept),
                "R2": round(float(r_value ** 2), 4),
                "PValue": float(p_value),
                "StdErr": float(std_err),
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
