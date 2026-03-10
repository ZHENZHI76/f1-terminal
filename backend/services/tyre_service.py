"""
Tyre Compound Performance Comparison Service.

Engineers need to compare compound performance to determine:
1. Which compound offers the best pace window
2. Degradation rates per compound (how many laps before crossover)
3. Optimal stint length per compound for race strategy
4. Compound ranking for this specific circuit

Algorithm:
  For each compound, collect all green-flag clean laps across all drivers.
  Compute:
    - Median pace (robust to outliers)
    - Degradation (linear regression slope across TyreLife)
    - Optimal stint length (where deg makes lap too slow vs. fresh next compound)
    - Crossover lap (when compound A becomes slower than compound B)
"""
import os
import fastf1
import numpy as np
from scipy.stats import linregress
import logging
import math
from utils.gp_codes import resolve_gp_name

logger = logging.getLogger(__name__)

CACHE_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "f1_cache")
os.makedirs(CACHE_DIR, exist_ok=True)
fastf1.Cache.enable_cache(CACHE_DIR)

# Standard Pirelli compound ordering (fastest to slowest expected pace)
COMPOUND_ORDER = {"SOFT": 0, "MEDIUM": 1, "HARD": 2, "INTERMEDIATE": 3, "WET": 4}


def get_compound_analysis(year: int, grand_prix: str, session_type: str) -> dict:
    """
    Aggregate compound performance across all drivers in a session.
    
    Returns:
      - compounds: [{compound, median_pace, deg_slope, optimal_stint, lap_count, driver_count}]
      - crossovers: [{pair, crossover_lap, description}]
      - scatter: [{driver, compound, tyre_life, lap_time, stint}]
    """
    try:
        logger.info(f"TYRE: {year} {grand_prix} ({session_type})")
        session = fastf1.get_session(year, resolve_gp_name(grand_prix), session_type)
        session.load(laps=True, telemetry=False, weather=False, messages=False)

        # Collect all clean laps
        all_laps = session.laps.copy()

        # Progressive sanitization
        try:
            clean = all_laps.pick_wo_box().pick_track_status('1', how='any').pick_accurate()
        except Exception:
            try:
                clean = all_laps.pick_wo_box().pick_accurate()
            except Exception:
                clean = all_laps.pick_wo_box() if hasattr(all_laps, 'pick_wo_box') else all_laps

        if clean.empty:
            clean = all_laps

        clean = clean.copy()
        clean['LapTime_sec'] = clean['LapTime'].dt.total_seconds()

        # Remove extreme outliers (107% of global mean)
        global_mean = clean['LapTime_sec'].mean()
        clean = clean[clean['LapTime_sec'] <= global_mean * 1.07]

        # Group by compound
        compounds_data = {}
        compound_scatter = []

        for compound in clean['Compound'].unique():
            comp_laps = clean[clean['Compound'] == compound]
            if len(comp_laps) < 3:
                continue

            import pandas as pd
            tyre_lives = comp_laps['TyreLife'].dropna().values.astype(float)
            lap_times = comp_laps['LapTime_sec'].values.astype(float)

            median_pace = float(np.median(lap_times))
            mean_pace = float(np.mean(lap_times))

            # Linear regression: LapTime = intercept + slope × TyreLife
            deg_slope = 0.0
            deg_intercept = median_pace
            r2 = 0.0
            if len(tyre_lives) >= 3 and np.std(tyre_lives) > 0:
                try:
                    slope, intercept, r_value, _, _ = linregress(tyre_lives, lap_times)
                    deg_slope = float(slope)
                    deg_intercept = float(intercept)
                    r2 = float(r_value ** 2)
                except Exception:
                    pass

            # Optimal stint = laps where predicted time stays under a threshold
            # Threshold = fresh median + 1.0s (typical acceptable window)
            optimal_stint = 0
            if deg_slope > 0.001:
                # Solve: intercept + slope * L = intercept + 1.0
                optimal_stint = int(min(1.0 / deg_slope, 60))
            elif deg_slope <= 0.001:
                optimal_stint = 50  # Compound barely degrades — run it long

            # Unique drivers who used this compound
            driver_count = len(comp_laps['Driver'].unique())

            compounds_data[str(compound)] = {
                "compound": str(compound),
                "median_pace": round(median_pace, 3),
                "mean_pace": round(mean_pace, 3),
                "deg_slope": round(deg_slope, 5),
                "deg_intercept": round(deg_intercept, 3),
                "r2": round(r2, 4),
                "optimal_stint": optimal_stint,
                "lap_count": len(comp_laps),
                "driver_count": driver_count,
                "max_tyre_life": int(tyre_lives.max()) if len(tyre_lives) > 0 else 0,
            }

            # Build scatter data
            for _, row in comp_laps.iterrows():
                tl = row.get('TyreLife')
                lt = row.get('LapTime_sec')
                if tl is not None and not pd.isna(tl):
                    compound_scatter.append({
                        "driver": str(row.get('Driver', '')),
                        "compound": str(compound),
                        "tyre_life": int(tl),
                        "lap_time": round(float(lt), 3),
                        "stint": int(row.get('Stint', 0)) if not pd.isna(row.get('Stint', 0)) else 0,
                    })

        # Compute crossover points between compounds
        crossovers = []
        sorted_compounds = sorted(compounds_data.values(),
                                   key=lambda x: COMPOUND_ORDER.get(x["compound"], 99))

        for i in range(len(sorted_compounds)):
            for j in range(i + 1, len(sorted_compounds)):
                c1 = sorted_compounds[i]  # Faster compound (lower order)
                c2 = sorted_compounds[j]  # Slower compound (higher order)

                if c1["deg_slope"] > c2["deg_slope"] + 0.001:
                    # c1 degrades faster — find lap where c1 becomes slower than c2
                    # c1_time(L) = c1_intercept + c1_slope * L
                    # c2_time(L) = c2_intercept + c2_slope * L
                    # crossover: c1_time(L) = c2_time(L)
                    slope_diff = c1["deg_slope"] - c2["deg_slope"]
                    if slope_diff > 0.0001:
                        cross_lap = (c2["deg_intercept"] - c1["deg_intercept"]) / slope_diff
                        if 1 <= cross_lap <= 60:
                            crossovers.append({
                                "pair": f"{c1['compound']} → {c2['compound']}",
                                "crossover_lap": round(cross_lap, 1),
                                "description": f"{c1['compound']} becomes slower than {c2['compound']} after ~{int(cross_lap)} laps of tyre life",
                            })

        logger.info(f"TYRE complete: {len(compounds_data)} compounds, {len(crossovers)} crossovers")

        return {
            "compounds": list(compounds_data.values()),
            "crossovers": crossovers,
            "scatter": compound_scatter,
            "total_laps_analyzed": len(compound_scatter),
        }

    except Exception as e:
        logger.error(f"Compound analysis failed: {str(e)}")
        raise
