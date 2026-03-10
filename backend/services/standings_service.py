import os
import fastf1
from fastf1.ergast import Ergast
import logging
import math

logger = logging.getLogger(__name__)

CACHE_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "f1_cache")
os.makedirs(CACHE_DIR, exist_ok=True)
fastf1.Cache.enable_cache(CACHE_DIR)


def get_driver_standings(year: int) -> dict:
    """
    Fetch World Drivers' Championship standings for a given season via Ergast/Jolpica API.
    Includes robust error handling for API timeouts and empty responses.
    """
    try:
        logger.info(f"Fetching WDC standings for {year}")
        ergast = Ergast()
        result = ergast.get_driver_standings(season=year, result_type='pandas')

        if result is None or not hasattr(result, 'content') or len(result.content) == 0:
            raise ValueError(f"No WDC standings data returned for {year}. The season may not have started yet.")

        df = result.content[0]

        if df.empty:
            raise ValueError(f"Empty WDC standings for {year}. Data may not be available yet.")

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

    except ValueError:
        raise
    except Exception as e:
        logger.error(f"WDC standings fetch failed: {str(e)}")
        raise ValueError(f"Failed to fetch WDC standings for {year}: {str(e)}")


def get_constructor_standings(year: int) -> dict:
    """
    Fetch World Constructors' Championship standings for a given season via Ergast/Jolpica API.
    Includes robust error handling for API timeouts and empty responses.
    """
    try:
        logger.info(f"Fetching WCC standings for {year}")
        ergast = Ergast()
        result = ergast.get_constructor_standings(season=year, result_type='pandas')

        if result is None or not hasattr(result, 'content') or len(result.content) == 0:
            raise ValueError(f"No WCC standings data returned for {year}. The season may not have started yet.")

        df = result.content[0]

        if df.empty:
            raise ValueError(f"Empty WCC standings for {year}. Data may not be available yet.")

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

    except ValueError:
        raise
    except Exception as e:
        logger.error(f"WCC standings fetch failed: {str(e)}")
        raise ValueError(f"Failed to fetch WCC standings for {year}: {str(e)}")


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
