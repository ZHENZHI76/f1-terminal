"""
Race Gap Analysis Service — Paddock-Grade Inter-Driver Gap Tracking.

Engineers use gap analysis to:
1. Monitor undercut/overcut windows (gap < pit stop loss ≈ 20-25s → vulnerable)
2. Track convergence/divergence between drivers
3. Identify DRS ranges (gap < 1.0s)
4. Evaluate tyre strategy effectiveness

Algorithm:
  gap[lap] = cumulative_time_A[lap] - cumulative_time_B[lap]
  Positive gap = Driver A is behind Driver B
  Adjusts for pit stop time deltas automatically.
"""
import os
import fastf1
import numpy as np
import logging
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


def get_race_gap_analysis(year: int, grand_prix: str, session_type: str,
                          driver_a: str, driver_b: str) -> dict:
    """
    Compute lap-by-lap gap between two drivers.
    
    Returns:
      - gap_trace: [{lap, gap_sec, delta_lap, position_a, position_b}]
      - undercut_windows: laps where gap crossed pit stop threshold
      - drs_laps: laps where gap < 1.0s
      - convergence_rate: avg gap change per lap (negative = converging)
    """
    try:
        logger.info(f"GAP: {year} {grand_prix} ({session_type}) {driver_a} vs {driver_b}")
        session = fastf1.get_session(year, resolve_gp_name(grand_prix), session_type)
        session.load(laps=True, telemetry=False, weather=False, messages=False)

        laps_a = session.laps.pick_drivers(driver_a)
        laps_b = session.laps.pick_drivers(driver_b)

        if laps_a.empty:
            raise ValueError(f"No laps found for {driver_a}")
        if laps_b.empty:
            raise ValueError(f"No laps found for {driver_b}")

        # Get common lap numbers
        laps_a_nums = set(laps_a['LapNumber'].dropna().astype(int).tolist())
        laps_b_nums = set(laps_b['LapNumber'].dropna().astype(int).tolist())
        common_laps = sorted(laps_a_nums & laps_b_nums)

        if not common_laps:
            raise ValueError(f"No common laps between {driver_a} and {driver_b}")

        # Compute cumulative times
        import pandas as pd

        def get_cumtime_series(laps_df, driver: str) -> dict:
            """Returns {lap_number: cumulative_seconds}"""
            sorted_laps = laps_df.sort_values('LapNumber')
            cum = {}
            total = 0.0
            for _, lap in sorted_laps.iterrows():
                ln = lap.get('LapNumber')
                lt = lap.get('LapTime')
                if ln is None or pd.isna(ln) or lt is None or pd.isna(lt):
                    continue
                total += lt.total_seconds()
                cum[int(ln)] = total
            return cum

        cum_a = get_cumtime_series(laps_a, driver_a)
        cum_b = get_cumtime_series(laps_b, driver_b)

        # Build gap trace
        gap_trace = []
        prev_gap = None

        for lap in common_laps:
            if lap not in cum_a or lap not in cum_b:
                continue

            gap = cum_a[lap] - cum_b[lap]  # positive = A behind B
            delta_lap = (gap - prev_gap) if prev_gap is not None else 0.0

            # Get positions
            pos_a = None
            pos_b = None
            try:
                lap_a_row = laps_a[laps_a['LapNumber'] == lap]
                lap_b_row = laps_b[laps_b['LapNumber'] == lap]
                if not lap_a_row.empty and not pd.isna(lap_a_row.iloc[0].get('Position')):
                    pos_a = int(lap_a_row.iloc[0]['Position'])
                if not lap_b_row.empty and not pd.isna(lap_b_row.iloc[0].get('Position')):
                    pos_b = int(lap_b_row.iloc[0]['Position'])
            except Exception:
                pass

            gap_trace.append({
                "lap": lap,
                "gap_sec": round(gap, 3),
                "delta_lap": round(delta_lap, 3),
                "position_a": pos_a,
                "position_b": pos_b,
            })
            prev_gap = gap

        if not gap_trace:
            raise ValueError(f"Could not compute gap trace between {driver_a} and {driver_b}")

        # Analysis metrics
        gaps = [g["gap_sec"] for g in gap_trace]
        deltas = [g["delta_lap"] for g in gap_trace if g["delta_lap"] != 0]

        # DRS range detection (|gap| < 1.0s)
        drs_laps = [g["lap"] for g in gap_trace if abs(g["gap_sec"]) < 1.0]

        # Undercut window (gap between 18-28s — typical pit loss range)
        undercut_windows = [g["lap"] for g in gap_trace if 18.0 <= abs(g["gap_sec"]) <= 28.0]

        # Convergence rate (avg delta per lap in second half of race)
        mid = len(deltas) // 2
        convergence_rate = float(np.mean(deltas[mid:])) if deltas[mid:] else 0.0

        # Get team colors
        team_a, team_b = "", ""
        color_a, color_b = "#666666", "#666666"
        try:
            results = session.results
            r_a = results[results['Abbreviation'] == driver_a]
            r_b = results[results['Abbreviation'] == driver_b]
            if not r_a.empty:
                team_a = str(r_a.iloc[0].get('TeamName', ''))
                color_a = _fix_color(r_a.iloc[0].get('TeamColor', ''))
            if not r_b.empty:
                team_b = str(r_b.iloc[0].get('TeamName', ''))
                color_b = _fix_color(r_b.iloc[0].get('TeamColor', ''))
        except Exception:
            pass

        return {
            "driver_a": {"code": driver_a, "team": team_a, "color": color_a},
            "driver_b": {"code": driver_b, "team": team_b, "color": color_b},
            "gap_trace": gap_trace,
            "summary": {
                "min_gap": round(min(gaps), 3),
                "max_gap": round(max(gaps), 3),
                "final_gap": round(gaps[-1], 3),
                "avg_delta_per_lap": round(convergence_rate, 4),
                "drs_laps": len(drs_laps),
                "undercut_window_laps": len(undercut_windows),
                "total_laps": len(gap_trace),
            },
            "drs_laps": drs_laps,
            "undercut_windows": undercut_windows,
        }

    except Exception as e:
        logger.error(f"Gap analysis failed: {str(e)}")
        raise
