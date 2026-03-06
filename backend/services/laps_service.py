import os
import fastf1
import logging
from utils.converters import safe_int, safe_float, td_to_str, td_to_seconds
from utils.gp_codes import resolve_gp_name

logger = logging.getLogger(__name__)

CACHE_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "f1_cache")
os.makedirs(CACHE_DIR, exist_ok=True)
fastf1.Cache.enable_cache(CACHE_DIR)


def get_lap_table(year: int, grand_prix: str, session_type: str,
                  driver: str | None = None) -> dict:
    """
    Extract full lap-by-lap table with all available columns:
    LapTime, S1/S2/S3, Compound, TyreLife, TrackStatus, IsAccurate,
    Position, PitIn/PitOut, Stint, IsPersonalBest, Deleted.
    
    If driver is specified, returns only that driver's laps.
    Otherwise returns all drivers (limited to top fields for payload size).
    """
    try:
        logger.info(f"Lap table: {year} {grand_prix} ({session_type})" + (f" Driver: {driver}" if driver else ""))
        session = fastf1.get_session(year, resolve_gp_name(grand_prix), session_type)
        session.load(laps=True, telemetry=False, weather=False, messages=False)

        laps = session.laps
        if driver:
            laps = laps.pick_drivers(driver)

        if laps.empty:
            raise ValueError(f"No laps found")

        output = []
        for _, lap in laps.iterrows():
            entry = {
                "LapNumber": safe_int(lap.get("LapNumber")),
                "Driver": str(lap.get("Driver", "")),
                "Team": str(lap.get("Team", "")),
                "LapTime": td_to_str(lap.get("LapTime")),
                "LapTimeSec": td_to_seconds(lap.get("LapTime")),
                "S1": td_to_str(lap.get("Sector1Time")),
                "S2": td_to_str(lap.get("Sector2Time")),
                "S3": td_to_str(lap.get("Sector3Time")),
                "S1Sec": td_to_seconds(lap.get("Sector1Time")),
                "S2Sec": td_to_seconds(lap.get("Sector2Time")),
                "S3Sec": td_to_seconds(lap.get("Sector3Time")),
                "Compound": str(lap.get("Compound", "UNKNOWN")),
                "TyreLife": safe_int(lap.get("TyreLife")),
                "Stint": safe_int(lap.get("Stint")),
                "Position": safe_int(lap.get("Position")),
                "TrackStatus": str(lap.get("TrackStatus", "")),
                "IsAccurate": bool(lap.get("IsAccurate", False)),
                "IsPersonalBest": bool(lap.get("IsPersonalBest", False)),
                "Deleted": bool(lap.get("Deleted", False)),
                "DeletedReason": str(lap.get("DeletedReason", "")),
                "SpeedI1": safe_float(lap.get("SpeedI1")),
                "SpeedI2": safe_float(lap.get("SpeedI2")),
                "SpeedFL": safe_float(lap.get("SpeedFL")),
                "SpeedST": safe_float(lap.get("SpeedST")),
                "FreshTyre": bool(lap.get("FreshTyre", False)),
                "PitIn": td_to_str(lap.get("PitInTime")) is not None,
                "PitOut": td_to_str(lap.get("PitOutTime")) is not None,
            }
            output.append(entry)

        # Sort by LapNumber (then Driver for multi-driver)
        output.sort(key=lambda x: (x.get("Driver", ""), x.get("LapNumber") or 0))

        logger.info(f"Lap table extracted: {len(output)} laps")
        return {
            "laps": output,
            "total_laps": len(output),
            "drivers": sorted(list(set(l["Driver"] for l in output)))
        }

    except Exception as e:
        logger.error(f"Lap table extraction failed: {str(e)}")
        raise
