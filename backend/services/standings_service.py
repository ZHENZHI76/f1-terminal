import os
import fastf1
from fastf1.ergast import Ergast
import logging
import math

logger = logging.getLogger(__name__)

CACHE_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "f1_cache")
os.makedirs(CACHE_DIR, exist_ok=True)
fastf1.Cache.enable_cache(CACHE_DIR)

ergast = Ergast()


def get_driver_standings(year: int) -> dict:
    """
    Fetch World Drivers' Championship standings for a given season via Ergast/Jolpica API.
    """
    try:
        logger.info(f"Fetching WDC standings for {year}")
        result = ergast.get_driver_standings(season=year, result_type='pandas')

        df = result.content[0]  # ErgastMultiResponse → first content DataFrame

        standings = []
        for _, row in df.iterrows():
            standings.append({
                "position": _safe_int(row.get("position")),
                "points": _safe_float(row.get("points")),
                "wins": _safe_int(row.get("wins")),
                "driver_id": str(row.get("driverId", "")),
                "given_name": str(row.get("givenName", "")),
                "family_name": str(row.get("familyName", "")),
                "constructor": str(row.get("constructorNames", "")),
                "nationality": str(row.get("driverNationality", "")),
            })

        standings.sort(key=lambda x: x["position"] if x["position"] else 999)
        logger.info(f"WDC standings: {len(standings)} drivers for {year}")
        return {"year": year, "type": "WDC", "standings": standings}

    except Exception as e:
        logger.error(f"WDC standings fetch failed: {str(e)}")
        raise


def get_constructor_standings(year: int) -> dict:
    """
    Fetch World Constructors' Championship standings for a given season via Ergast/Jolpica API.
    """
    try:
        logger.info(f"Fetching WCC standings for {year}")
        result = ergast.get_constructor_standings(season=year, result_type='pandas')

        df = result.content[0]

        standings = []
        for _, row in df.iterrows():
            standings.append({
                "position": _safe_int(row.get("position")),
                "points": _safe_float(row.get("points")),
                "wins": _safe_int(row.get("wins")),
                "constructor_id": str(row.get("constructorId", "")),
                "constructor_name": str(row.get("constructorName", "")),
                "nationality": str(row.get("constructorNationality", "")),
            })

        standings.sort(key=lambda x: x["position"] if x["position"] else 999)
        logger.info(f"WCC standings: {len(standings)} constructors for {year}")
        return {"year": year, "type": "WCC", "standings": standings}

    except Exception as e:
        logger.error(f"WCC standings fetch failed: {str(e)}")
        raise


def _safe_int(val) -> int | None:
    if val is None:
        return None
    try:
        if math.isnan(float(val)):
            return None
        return int(val)
    except (ValueError, TypeError):
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
