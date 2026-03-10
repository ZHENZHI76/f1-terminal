"""
Multi-Driver Race Pace Analysis Service
Compares stint degradation across 2-4 drivers simultaneously.
Essential for FP2 race simulation analysis and post-race pace debrief.
"""
import os
import fastf1
import numpy as np
from scipy.stats import linregress
import logging
from utils.converters import safe_int
from utils.gp_codes import resolve_gp_name

logger = logging.getLogger(__name__)

CACHE_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "f1_cache")
os.makedirs(CACHE_DIR, exist_ok=True)
fastf1.Cache.enable_cache(CACHE_DIR)


def _fix_color(raw) -> str:
    """Ensure TeamColor has # prefix."""
    if not raw:
        return "#666666"
    raw = str(raw).strip()
    return raw if raw.startswith('#') else f'#{raw}'


def get_multi_driver_pace(year: int, grand_prix: str, session_type: str,
                          drivers: list[str]) -> dict:
    """
    Race pace comparison across multiple drivers.
    For each driver:
      1. Load all racing laps (green flag, no box laps)
      2. Group by stint
      3. Fit linear regression per stint (with fuel correction)
      4. Return scatter points + trendlines
    
    Enables overlay chart showing all drivers' degradation curves.
    """
    try:
        logger.info(f"Multi-driver pace: {', '.join(drivers)} @ {year} {grand_prix} ({session_type})")
        session = fastf1.get_session(year, resolve_gp_name(grand_prix), session_type)
        session.load(laps=True, telemetry=False, weather=False, messages=False)

        FUEL_CORRECTION_PER_LAP = 0.027  # ~1.8 kg/lap × ~0.015 s/kg

        all_drivers_data = []

        for driver in drivers:
            laps = session.laps.pick_drivers(driver)
            if laps.empty:
                logger.warning(f"No laps for {driver}, skipping")
                continue

            # Progressive sanitization fallback
            valid = None
            try:
                candidate = laps.pick_wo_box().pick_track_status('1', how='any').pick_accurate().copy()
                if not candidate.empty and len(candidate) >= 3:
                    valid = candidate
            except Exception:
                pass
            
            if valid is None:
                try:
                    candidate = laps.pick_wo_box().pick_accurate().copy()
                    if not candidate.empty and len(candidate) >= 3:
                        valid = candidate
                except Exception:
                    pass
            
            if valid is None:
                try:
                    candidate = laps.pick_wo_box().copy()
                    if not candidate.empty:
                        valid = candidate
                except Exception:
                    pass
            
            if valid is None:
                valid = laps.copy()

            if valid.empty:
                continue

            valid['LapTime_sec'] = valid['LapTime'].dt.total_seconds()
            # Remove extreme outliers (107% of mean)
            lap_avg = valid['LapTime_sec'].mean()
            valid = valid[valid['LapTime_sec'] <= lap_avg * 1.07]

            # Get driver team and color
            team = str(valid.iloc[0].get('Team', ''))
            team_color = ""
            try:
                results = session.results
                drv_result = results[results['Abbreviation'] == driver]
                if not drv_result.empty:
                    team_color = _fix_color(drv_result.iloc[0].get('TeamColor', ''))
            except Exception:
                pass

            scatter = []
            trendlines = []

            stints = sorted(valid['Stint'].unique().tolist())
            for stint in stints:
                stint_laps = valid[valid['Stint'] == stint]
                if len(stint_laps) < 3:
                    continue

                x = stint_laps['TyreLife'].values.astype(float)
                y = stint_laps['LapTime_sec'].values.astype(float)
                compound = str(stint_laps.iloc[0].get('Compound', 'UNKNOWN'))

                for i in range(len(x)):
                    scatter.append({
                        "TyreLife": int(x[i]),
                        "LapTime": float(y[i]),
                        "LapNumber": safe_int(stint_laps.iloc[i].get('LapNumber')),
                        "Compound": compound,
                        "Stint": int(stint),
                    })

                slope, intercept, r_value, p_value, std_err = linregress(x, y)
                tyre_deg_slope = slope + FUEL_CORRECTION_PER_LAP

                trendlines.append({
                    "Stint": int(stint),
                    "Compound": compound,
                    "Slope": round(float(slope), 5),
                    "TyreDegSlope": round(float(tyre_deg_slope), 5),
                    "Intercept": round(float(intercept), 4),
                    "R2": round(float(r_value ** 2), 4),
                    "StartX": int(x.min()),
                    "EndX": int(x.max()),
                })

            all_drivers_data.append({
                "driver": driver,
                "team": team,
                "team_color": team_color,
                "scatter": scatter,
                "trendlines": trendlines,
                "total_laps": len(scatter),
            })

        logger.info(f"Multi-driver pace analysis complete: {len(all_drivers_data)} drivers processed")

        return {
            "drivers": all_drivers_data,
            "fuel_correction_per_lap": FUEL_CORRECTION_PER_LAP,
        }

    except Exception as e:
        logger.error(f"Multi-driver pace analysis failed: {str(e)}")
        raise
