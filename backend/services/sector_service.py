import os
import fastf1
import logging
import math
from utils.gp_codes import resolve_gp_name

logger = logging.getLogger(__name__)

CACHE_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "f1_cache")
os.makedirs(CACHE_DIR, exist_ok=True)
fastf1.Cache.enable_cache(CACHE_DIR)


def get_sector_comparison(year: int, grand_prix: str, session_type: str,
                          driver_a: str, driver_b: str) -> dict:
    """
    Extract sector times and speed trap data for fastest laps of two drivers.
    Uses Sector1Time, Sector2Time, Sector3Time, SpeedI1, SpeedI2, SpeedFL, SpeedST.
    """
    try:
        logger.info(f"Sector analysis: {driver_a} vs {driver_b} @ {year} {grand_prix} ({session_type})")
        session = fastf1.get_session(year, resolve_gp_name(grand_prix), session_type)
        session.load(laps=True, telemetry=False, weather=False, messages=False)

        lap_a = session.laps.pick_drivers(driver_a).pick_fastest()
        lap_b = session.laps.pick_drivers(driver_b).pick_fastest()

        if lap_a is None or (hasattr(lap_a, 'empty') and lap_a.empty):
            raise ValueError(f"No fastest lap found for {driver_a}")
        if lap_b is None or (hasattr(lap_b, 'empty') and lap_b.empty):
            raise ValueError(f"No fastest lap found for {driver_b}")

        def extract_sectors(lap, driver: str) -> dict:
            return {
                "driver": driver,
                "lap_time": _td_seconds(lap.get("LapTime")),
                "s1": _td_seconds(lap.get("Sector1Time")),
                "s2": _td_seconds(lap.get("Sector2Time")),
                "s3": _td_seconds(lap.get("Sector3Time")),
                "speed_i1": _safe_float(lap.get("SpeedI1")),
                "speed_i2": _safe_float(lap.get("SpeedI2")),
                "speed_fl": _safe_float(lap.get("SpeedFL")),
                "speed_st": _safe_float(lap.get("SpeedST")),
                "compound": str(lap.get("Compound", "UNKNOWN")),
                "tyre_life": _safe_int(lap.get("TyreLife")),
            }

        data_a = extract_sectors(lap_a, driver_a)
        data_b = extract_sectors(lap_b, driver_b)

        # Compute deltas (A - B, negative means A is faster)
        deltas = {}
        for key in ["s1", "s2", "s3", "lap_time"]:
            va = data_a.get(key)
            vb = data_b.get(key)
            if va is not None and vb is not None:
                deltas[f"delta_{key}"] = round(va - vb, 4)
            else:
                deltas[f"delta_{key}"] = None

        # Sector advantage labels
        sector_advantages = {}
        for i, key in enumerate(["s1", "s2", "s3"], 1):
            va = data_a.get(key)
            vb = data_b.get(key)
            if va is not None and vb is not None:
                sector_advantages[f"s{i}_advantage"] = driver_a if va < vb else driver_b
            else:
                sector_advantages[f"s{i}_advantage"] = None

        logger.info(f"Sector analysis complete: {driver_a} vs {driver_b}")

        return {
            "driver_a": data_a,
            "driver_b": data_b,
            "deltas": deltas,
            "sector_advantages": sector_advantages,
        }

    except Exception as e:
        logger.error(f"Sector analysis failed: {str(e)}")
        raise


def _td_seconds(val) -> float | None:
    """Convert Timedelta to seconds."""
    import pandas as pd
    if val is None or pd.isna(val):
        return None
    try:
        return round(val.total_seconds(), 4)
    except (AttributeError, TypeError):
        return None


def _safe_float(val) -> float | None:
    if val is None:
        return None
    try:
        f = float(val)
        if math.isnan(f):
            return None
        return round(f, 1)
    except (ValueError, TypeError):
        return None


def _safe_int(val) -> int | None:
    if val is None:
        return None
    try:
        if math.isnan(float(val)):
            return None
        return int(val)
    except (ValueError, TypeError):
        return None
