"""
Speed Trap Analysis Service — All-Driver Speed Rankings.

Engineers use speed traps to assess:
1. Power unit performance advantage (ST main straight)
2. Drag/downforce config trade-offs (I1 vs ST delta)
3. DRS effectiveness (speed differential through DRS zones)
4. Sector-specific car characteristics (corner exit traction → I2 speed)

FastF1 provides 4 speed readings per lap:
  SpeedI1: Intermediate 1 (sector 1 → sector 2 transition)
  SpeedI2: Intermediate 2 (sector 2 → sector 3 transition)
  SpeedFL: Finish Line crossing speed
  SpeedST: Speed Trap (main straight, highest V_max measurement)
"""
import os
import fastf1
import logging
import pandas as pd
import math
from utils.gp_codes import resolve_gp_name

logger = logging.getLogger(__name__)

CACHE_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "f1_cache")
os.makedirs(CACHE_DIR, exist_ok=True)
fastf1.Cache.enable_cache(CACHE_DIR)


def _fix_color(raw) -> str:
    if not raw:
        return "#666666"
    raw = str(raw).strip()
    return raw if raw.startswith('#') else f'#{raw}'


def _safe_float(val) -> float | None:
    if val is None:
        return None
    try:
        f = float(val)
        return None if math.isnan(f) else round(f, 1)
    except (ValueError, TypeError):
        return None


def get_speed_trap_rankings(year: int, grand_prix: str, session_type: str) -> dict:
    """
    All-driver speed trap rankings for a session.
    
    Returns:
      - rankings: per speed trap (SpeedI1, SpeedI2, SpeedFL, SpeedST)
      - each: [{driver, team, color, speed, gap_to_fastest, rank}]
      - session_max: absolute fastest for each trap
    """
    try:
        logger.info(f"TOPSPEED: {year} {grand_prix} ({session_type})")
        session = fastf1.get_session(year, resolve_gp_name(grand_prix), session_type)
        session.load(laps=True, telemetry=False, weather=False, messages=False)

        SPEED_COLS = ['SpeedI1', 'SpeedI2', 'SpeedFL', 'SpeedST']
        
        # For each driver, get their fastest lap and extract speed trap values
        drivers = session.laps['Driver'].unique()
        driver_data = []

        for drv in drivers:
            drv_laps = session.laps.pick_drivers(drv)
            if drv_laps.empty:
                continue

            # Get max speed per trap across ALL laps (not just fastest lap)
            speeds = {}
            for col in SPEED_COLS:
                if col in drv_laps.columns:
                    valid = drv_laps[col].dropna()
                    if not valid.empty:
                        speeds[col] = float(valid.max())
                    else:
                        speeds[col] = None
                else:
                    speeds[col] = None

            # Get team info
            team = ""
            color = "#666666"
            try:
                results = session.results
                r = results[results['Abbreviation'] == str(drv)]
                if not r.empty:
                    team = str(r.iloc[0].get('TeamName', ''))
                    color = _fix_color(r.iloc[0].get('TeamColor', ''))
            except Exception:
                pass

            driver_data.append({
                "driver": str(drv),
                "team": team,
                "color": color,
                "speeds": speeds,
            })

        if not driver_data:
            raise ValueError(f"No speed trap data found for {year} {grand_prix}")

        # Build per-trap rankings
        rankings = {}
        session_max = {}

        for col in SPEED_COLS:
            trap_label = {
                'SpeedI1': 'I1 (Intermediate 1)',
                'SpeedI2': 'I2 (Intermediate 2)',
                'SpeedFL': 'FL (Finish Line)',
                'SpeedST': 'ST (Speed Trap)',
            }.get(col, col)

            entries = []
            for dd in driver_data:
                s = dd["speeds"].get(col)
                if s is not None:
                    entries.append({
                        "driver": dd["driver"],
                        "team": dd["team"],
                        "color": dd["color"],
                        "speed_kph": s,
                    })

            entries.sort(key=lambda x: x["speed_kph"], reverse=True)

            # Add rank and gap
            if entries:
                fastest = entries[0]["speed_kph"]
                session_max[col] = fastest
                for i, e in enumerate(entries):
                    e["rank"] = i + 1
                    e["gap_to_fastest"] = round(e["speed_kph"] - fastest, 1)

            rankings[col] = {
                "label": trap_label,
                "entries": entries,
            }

        logger.info(f"TOPSPEED complete: {len(driver_data)} drivers, 4 traps")

        return {
            "rankings": rankings,
            "session_max": session_max,
            "total_drivers": len(driver_data),
        }

    except Exception as e:
        logger.error(f"Speed trap analysis failed: {str(e)}")
        raise
