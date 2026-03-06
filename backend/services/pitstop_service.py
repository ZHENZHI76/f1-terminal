import os
import fastf1
import logging
import math
from utils.gp_codes import resolve_gp_name

logger = logging.getLogger(__name__)

CACHE_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "f1_cache")
os.makedirs(CACHE_DIR, exist_ok=True)
fastf1.Cache.enable_cache(CACHE_DIR)


def get_pitstop_analysis(year: int, grand_prix: str, session_type: str, driver: str | None = None) -> dict:
    """
    Extract pit stop data from laps: PitInTime, PitOutTime → compute stop duration.
    If driver is specified, returns that driver's stops. Otherwise, returns all drivers.
    """
    try:
        logger.info(f"Pit stop analysis: {year} {grand_prix} ({session_type})" + (f" Driver: {driver}" if driver else ""))
        session = fastf1.get_session(year, resolve_gp_name(grand_prix), session_type)
        session.load(laps=True, telemetry=False, weather=False, messages=False)

        laps = session.laps
        if driver:
            laps = laps.pick_drivers(driver)

        if laps.empty:
            raise ValueError(f"No laps data found")

        # Find laps with pit activity
        pit_in_laps = laps[laps['PitInTime'].notna()].copy()
        pit_out_laps = laps[laps['PitOutTime'].notna()].copy()

        stops = []

        # For each pit-in event, find the corresponding pit-out
        for _, pit_in_lap in pit_in_laps.iterrows():
            drv = str(pit_in_lap['Driver'])
            lap_num = pit_in_lap['LapNumber']
            pit_in_time = pit_in_lap['PitInTime']
            stint = pit_in_lap.get('Stint')
            compound_before = str(pit_in_lap.get('Compound', 'UNKNOWN'))

            # Find the corresponding out-lap (next lap for this driver)
            next_laps = pit_out_laps[
                (pit_out_laps['Driver'] == drv) &
                (pit_out_laps['LapNumber'] > lap_num)
            ].sort_values('LapNumber')

            pit_duration = None
            compound_after = compound_before

            if not next_laps.empty:
                out_lap = next_laps.iloc[0]
                pit_out_time = out_lap['PitOutTime']
                compound_after = str(out_lap.get('Compound', 'UNKNOWN'))

                if pit_in_time is not None and pit_out_time is not None:
                    try:
                        duration = (pit_out_time - pit_in_time).total_seconds()
                        if 0 < duration < 120:  # Sanity check: pit stop should be < 2 minutes
                            pit_duration = round(duration, 2)
                    except Exception:
                        pass

            stops.append({
                "driver": drv,
                "team": str(pit_in_lap.get('Team', '')),
                "lap": _safe_int(lap_num),
                "stint": _safe_int(stint),
                "duration_sec": pit_duration,
                "compound_before": compound_before,
                "compound_after": compound_after,
                "tyre_life_at_stop": _safe_int(pit_in_lap.get('TyreLife')),
            })

        # Sort by lap number
        stops.sort(key=lambda x: (x["driver"], x["lap"] or 0))

        # Summary: number of stops per driver
        driver_stops = {}
        for s in stops:
            d = s["driver"]
            if d not in driver_stops:
                driver_stops[d] = {"count": 0, "total_time": 0.0}
            driver_stops[d]["count"] += 1
            if s["duration_sec"] is not None:
                driver_stops[d]["total_time"] += s["duration_sec"]

        summary = [
            {"driver": d, "stops": v["count"], "total_pit_time": round(v["total_time"], 2)}
            for d, v in sorted(driver_stops.items())
        ]

        logger.info(f"Pit stop analysis: {len(stops)} stops across {len(driver_stops)} drivers")

        return {
            "stops": stops,
            "summary": summary
        }

    except Exception as e:
        logger.error(f"Pit stop analysis failed: {str(e)}")
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
