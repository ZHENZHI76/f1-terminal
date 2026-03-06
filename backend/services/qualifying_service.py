import os
import fastf1
import logging
import math

logger = logging.getLogger(__name__)

CACHE_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "f1_cache")
os.makedirs(CACHE_DIR, exist_ok=True)
fastf1.Cache.enable_cache(CACHE_DIR)


def get_qualifying_splits(year: int, grand_prix: str) -> dict:
    """
    Split qualifying session into Q1/Q2/Q3 segments using FastF1's
    split_qualifying_sessions(). Returns best lap times per driver per segment.
    """
    try:
        logger.info(f"Qualifying split analysis: {year} {grand_prix}")
        session = fastf1.get_session(year, grand_prix, 'Q')
        session.load(laps=True, telemetry=False, weather=False, messages=False)

        q1, q2, q3 = session.laps.split_qualifying_sessions()

        def extract_segment(laps_df, segment_name: str) -> list[dict]:
            """Extract best lap per driver in a qualifying segment."""
            if laps_df.empty:
                return []

            drivers = laps_df['Driver'].unique()
            results = []

            for drv in drivers:
                drv_laps = laps_df[laps_df['Driver'] == drv]
                # pick_not_deleted to exclude track-limits violations
                valid = drv_laps.pick_not_deleted() if hasattr(drv_laps, 'pick_not_deleted') else drv_laps
                if valid.empty:
                    # Driver had all laps deleted — use original best
                    best = drv_laps.pick_fastest()
                else:
                    best = valid.pick_fastest()

                if best.empty:
                    continue

                lap_time = best.get("LapTime")
                results.append({
                    "driver": str(best.get("Driver", "")),
                    "team": str(best.get("Team", "")),
                    "lap_time_sec": round(lap_time.total_seconds(), 4) if lap_time is not None and not _is_nat(lap_time) else None,
                    "lap_time_str": _format_laptime(lap_time),
                    "compound": str(best.get("Compound", "UNKNOWN")),
                    "tyre_life": _safe_int(best.get("TyreLife")),
                    "deleted": bool(best.get("Deleted", False)),
                    "segment": segment_name,
                })

            # Sort by lap time (fastest first)
            results.sort(key=lambda x: x["lap_time_sec"] if x["lap_time_sec"] is not None else 9999)
            return results

        q1_data = extract_segment(q1, "Q1")
        q2_data = extract_segment(q2, "Q2")
        q3_data = extract_segment(q3, "Q3")

        logger.info(f"Qualifying splits: Q1={len(q1_data)} Q2={len(q2_data)} Q3={len(q3_data)} drivers")

        return {
            "q1": q1_data,
            "q2": q2_data,
            "q3": q3_data,
            "summary": {
                "q1_drivers": len(q1_data),
                "q2_drivers": len(q2_data),
                "q3_drivers": len(q3_data),
            }
        }

    except Exception as e:
        logger.error(f"Qualifying split analysis failed: {str(e)}")
        raise


def _format_laptime(td) -> str | None:
    import pandas as pd
    if td is None or pd.isna(td):
        return None
    total = td.total_seconds()
    m = int(total // 60)
    s = total % 60
    return f"{m}:{s:06.3f}"


def _safe_int(val) -> int | None:
    if val is None:
        return None
    try:
        if math.isnan(float(val)):
            return None
        return int(val)
    except (ValueError, TypeError):
        return None


def _is_nat(val) -> bool:
    import pandas as pd
    try:
        return pd.isna(val)
    except (ValueError, TypeError):
        return False
