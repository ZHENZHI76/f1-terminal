import os
import fastf1
import logging
from utils.gp_codes import resolve_gp_name

logger = logging.getLogger(__name__)

CACHE_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "f1_cache")
os.makedirs(CACHE_DIR, exist_ok=True)
fastf1.Cache.enable_cache(CACHE_DIR)


def _fix_color(raw: str) -> str:
    """Ensure TeamColor has # prefix for CSS usage."""
    if not raw:
        return "#666666"
    raw = str(raw).strip()
    return raw if raw.startswith('#') else f'#{raw}'


def get_session_results(year: int, grand_prix: str, session_type: str) -> list[dict]:
    """
    Extract session results: positions, Q1/Q2/Q3 times, grid positions,
    team colors, points, status, and driver metadata.
    """
    try:
        logger.info(f"Fetching session results for {year} {grand_prix} ({session_type})")
        session = fastf1.get_session(year, resolve_gp_name(grand_prix), session_type)
        session.load(laps=False, telemetry=False, weather=False, messages=False)

        results = session.results

        if results.empty:
            raise ValueError(f"No results found for {year} {grand_prix} {session_type}")

        output = []
        for _, row in results.iterrows():
            entry = {
                "Position": _safe_int(row.get("Position")),
                "GridPosition": _safe_int(row.get("GridPosition")),
                "ClassifiedPosition": str(row.get("ClassifiedPosition", "")),
                "Abbreviation": row.get("Abbreviation", ""),
                "FullName": row.get("FullName", ""),
                "DriverNumber": str(row.get("DriverNumber", "")),
                "TeamName": row.get("TeamName", ""),
                "TeamColor": _fix_color(row.get("TeamColor", "")),
                "Points": _safe_float(row.get("Points")),
                "Status": str(row.get("Status", "")),
                "Q1": _td_to_str(row.get("Q1")),
                "Q2": _td_to_str(row.get("Q2")),
                "Q3": _td_to_str(row.get("Q3")),
                "Time": _td_to_str(row.get("Time")),
                "Laps": _safe_int(row.get("Laps")),
            }
            output.append(entry)

        # Sort by position (NaN positions go to end)
        output.sort(key=lambda x: x["Position"] if x["Position"] is not None else 999)

        logger.info(f"Session results extracted: {len(output)} drivers.")
        return output

    except Exception as e:
        logger.error(f"Session results extraction failed: {str(e)}")
        raise


def get_driver_list(year: int, grand_prix: str, session_type: str) -> list[dict]:
    """
    Extract compact driver listing: abbreviation, number, team, team color.
    """
    try:
        session = fastf1.get_session(year, resolve_gp_name(grand_prix), session_type)
        session.load(laps=False, telemetry=False, weather=False, messages=False)

        results = session.results
        drivers = []

        for _, row in results.iterrows():
            drivers.append({
                "Abbreviation": row.get("Abbreviation", ""),
                "DriverNumber": str(row.get("DriverNumber", "")),
                "FullName": row.get("FullName", ""),
                "TeamName": row.get("TeamName", ""),
                "TeamColor": _fix_color(row.get("TeamColor", "")),
            })

        return drivers

    except Exception as e:
        logger.error(f"Driver list extraction failed: {str(e)}")
        raise


def _safe_int(val) -> int | None:
    """Convert to int safely, returning None for NaN/None."""
    import math
    if val is None:
        return None
    try:
        if math.isnan(float(val)):
            return None
        return int(val)
    except (ValueError, TypeError):
        return None


def _safe_float(val) -> float | None:
    """Convert to float safely, returning None for NaN/None."""
    import math
    if val is None:
        return None
    try:
        f = float(val)
        if math.isnan(f):
            return None
        return round(f, 1)
    except (ValueError, TypeError):
        return None


def _td_to_str(val) -> str | None:
    """Convert Timedelta to formatted string (e.g., '1:28.256')."""
    import pandas as pd
    if val is None or pd.isna(val):
        return None
    try:
        total_seconds = val.total_seconds()
        minutes = int(total_seconds // 60)
        seconds = total_seconds % 60
        return f"{minutes}:{seconds:06.3f}"
    except (AttributeError, TypeError):
        return None
