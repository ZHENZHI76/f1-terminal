"""
Multi-Driver Telemetry Overlay Service
Supports 1-6 drivers with distance-aligned telemetry traces.
Each driver's data is independently interpolated onto a common distance axis.
"""
import os
import fastf1
import polars as pl
import numpy as np
from scipy.interpolate import interp1d
import logging
import pandas as pd

logging.basicConfig(level=logging.INFO, format='%(asctime)s - [%(levelname)s] QUANT ENGINE: %(message)s')
logger = logging.getLogger(__name__)

CACHE_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "f1_cache")
os.makedirs(CACHE_DIR, exist_ok=True)
fastf1.Cache.enable_cache(CACHE_DIR)

from utils.gp_codes import resolve_gp_name
from services.circuit_info_service import get_corner_distances

# ─── F1 2024/2025 canonical team colors ─────────────────────────────────────
TEAM_COLORS = {
    "Red Bull Racing": "#3671C6", "McLaren": "#FF8000", "Ferrari": "#E8002D",
    "Mercedes": "#27F4D2", "Aston Martin": "#229971", "Alpine": "#FF87BC",
    "Williams": "#64C4FF", "RB": "#6692FF", "Haas F1 Team": "#B6BABD",
    "Kick Sauber": "#52E252", "Sauber": "#52E252",
}

# Lighter palette fallback for multi-driver overlays
OVERLAY_COLORS = [
    "#FF6600", "#3399CC", "#CC3333", "#33CC66", "#FF9900", "#9966FF",
    "#FF3366", "#00CCCC", "#FFCC00", "#66FF66",
]


def _extract_lap_meta(lap, driver: str) -> dict:
    """Extract metadata from a lap for context display."""
    lt = lap.get("LapTime")
    s1, s2, s3 = lap.get("Sector1Time"), lap.get("Sector2Time"), lap.get("Sector3Time")
    team = str(lap.get("Team", ""))
    return {
        "driver": driver,
        "lap_number": int(lap.get("LapNumber", 0)) if not pd.isna(lap.get("LapNumber", None)) else None,
        "lap_time_sec": round(lt.total_seconds(), 4) if lt is not None and not pd.isna(lt) else None,
        "lap_time_str": f"{int(lt.total_seconds()//60)}:{lt.total_seconds()%60:06.3f}" if lt is not None and not pd.isna(lt) else None,
        "s1": round(s1.total_seconds(), 3) if s1 is not None and not pd.isna(s1) else None,
        "s2": round(s2.total_seconds(), 3) if s2 is not None and not pd.isna(s2) else None,
        "s3": round(s3.total_seconds(), 3) if s3 is not None and not pd.isna(s3) else None,
        "compound": str(lap.get("Compound", "UNKNOWN")),
        "tyre_life": int(lap.get("TyreLife", 0)) if not pd.isna(lap.get("TyreLife", None)) else None,
        "team": team,
        "team_color": TEAM_COLORS.get(team, ""),
    }


def _interpolate_driver(df: pl.DataFrame, ref_distance: np.ndarray) -> dict:
    """Interpolate a single driver's telemetry onto the reference distance axis."""
    dist = df.get_column("Distance").to_numpy()
    _, uq_idx = np.unique(dist, return_index=True)
    uq_idx = np.sort(uq_idx)
    d = dist[uq_idx]

    def _interp(col, kind='linear'):
        vals = df.get_column(col).to_numpy()[uq_idx]
        return interp1d(d, vals, kind=kind, bounds_error=False, fill_value="extrapolate")(ref_distance)

    return {
        "Speed": _interp("Speed"),
        "Throttle": _interp("Throttle"),
        "Brake": _interp("Brake", "nearest"),
        "nGear": _interp("nGear", "nearest"),
        "RPM": _interp("RPM"),
        "DRS": _interp("DRS", "nearest"),
        "Time": _interp("Time"),
    }


def get_multi_driver_telemetry(year: int, grand_prix: str, session_type: str, drivers: list[str]) -> dict:
    """
    Multi-driver telemetry overlay.
    Returns:
      - drivers[]: array of {code, meta, color, telemetry: [{D, Speed, Throttle, Brake, nGear, RPM, DRS}]}
      - corners: corner markers for distance axis
      - ref_distance: common distance axis length
    """
    if not drivers or len(drivers) > 6:
        raise ValueError("Provide 1-6 driver codes.")

    gp = resolve_gp_name(grand_prix)
    logger.info(f"Multi-driver TEL: {year} {gp} ({session_type}) — {','.join(drivers)}")
    session = fastf1.get_session(year, gp, session_type)
    session.load(telemetry=True, laps=True, weather=False)

    cols = ['Time', 'Distance', 'Speed', 'Throttle', 'Brake', 'nGear', 'RPM', 'DRS']

    # Extract each driver's fastest lap telemetry
    driver_data = []
    for drv in drivers:
        lap = session.laps.pick_drivers(drv).pick_fastest()
        if lap is None or (hasattr(lap, 'empty') and lap.empty):
            logger.warning(f"No fastest lap for {drv}, skipping")
            continue
        tel = lap.get_telemetry()[cols].copy()
        tel['Time'] = tel['Time'].dt.total_seconds()
        df = pl.from_pandas(tel).fill_nan(0).fill_null(0)
        driver_data.append({
            "code": drv,
            "lap": lap,
            "df": df,
            "max_dist": df.get_column("Distance").max(),
        })

    if not driver_data:
        raise ValueError(f"No valid telemetry found for any driver in {year} {grand_prix}")

    # Common distance axis: minimum of all drivers' max distances, 2m sampling
    max_dist = min(d["max_dist"] for d in driver_data)
    ref_distance = np.arange(0, max_dist, 2.0)

    # Build output per driver
    result_drivers = []
    for i, dd in enumerate(driver_data):
        interp = _interpolate_driver(dd["df"], ref_distance)
        meta = _extract_lap_meta(dd["lap"], dd["code"])
        color = meta.get("team_color") or OVERLAY_COLORS[i % len(OVERLAY_COLORS)]

        # Build per-driver telemetry array
        tel_points = []
        for j in range(len(ref_distance)):
            tel_points.append({
                "D": round(float(ref_distance[j]), 1),
                "Speed": round(float(interp["Speed"][j]), 1),
                "Throttle": round(float(interp["Throttle"][j]), 1),
                "Brake": round(float(interp["Brake"][j]), 1),
                "nGear": int(interp["nGear"][j]),
                "RPM": round(float(interp["RPM"][j]), 0),
                "DRS": int(interp["DRS"][j]),
            })

        result_drivers.append({
            "code": dd["code"],
            "meta": meta,
            "color": color,
            "telemetry": tel_points,
        })

    # Corner markers
    try:
        corners = get_corner_distances(year, grand_prix, session_type)
    except Exception:
        corners = []

    logger.info(f"Multi-driver TEL complete: {len(result_drivers)} drivers, {len(ref_distance)} distance points")

    return {
        "drivers": result_drivers,
        "corners": corners,
        "distance_points": len(ref_distance),
    }
