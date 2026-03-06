import os
import fastf1
import logging
import math

logger = logging.getLogger(__name__)

CACHE_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "f1_cache")
os.makedirs(CACHE_DIR, exist_ok=True)
fastf1.Cache.enable_cache(CACHE_DIR)


def get_position_chart(year: int, grand_prix: str, session_type: str) -> dict:
    """
    Build lap-by-lap position data for all drivers in a race session.
    Uses the 'Position' column from Laps DataFrame.
    """
    try:
        logger.info(f"Position chart: {year} {grand_prix} ({session_type})")
        session = fastf1.get_session(year, grand_prix, session_type)
        session.load(laps=True, telemetry=False, weather=False, messages=False)

        laps = session.laps
        if laps.empty:
            raise ValueError(f"No laps data for {year} {grand_prix} {session_type}")

        drivers = sorted(laps['Driver'].unique().tolist())

        # Build position traces per driver
        traces = []
        for drv in drivers:
            drv_laps = laps[laps['Driver'] == drv].sort_values('LapNumber')
            positions = []
            for _, lap in drv_laps.iterrows():
                ln = lap.get('LapNumber')
                pos = lap.get('Position')
                if ln is not None and not _is_nan(ln) and pos is not None and not _is_nan(pos):
                    positions.append({
                        "lap": int(ln),
                        "position": int(pos)
                    })
            if positions:
                # Get team info from the laps data
                team = str(drv_laps.iloc[0].get('Team', ''))
                traces.append({
                    "driver": drv,
                    "team": team,
                    "team_color": "",  # Will be filled from results below
                    "status": "",
                    "positions": positions
                })

        # Get total laps
        total_laps = int(laps['LapNumber'].max()) if not laps['LapNumber'].empty else 0

        # Get starting grid from results
        grid = []
        try:
            results = session.results
            # Build lookup maps from results
            color_map = {}
            status_map = {}
            for _, row in results.iterrows():
                abbr = str(row.get('Abbreviation', ''))
                color_map[abbr] = str(row.get('TeamColor', ''))
                status_map[abbr] = str(row.get('Status', ''))
                gp = row.get('GridPosition')
                if gp is not None and not _is_nan(gp):
                    grid.append({
                        "driver": abbr,
                        "grid_position": int(gp),
                        "team_color": str(row.get('TeamColor', ''))
                    })
            grid.sort(key=lambda x: x["grid_position"])
            
            # Attach TeamColor and Status to traces
            for trace in traces:
                trace["team_color"] = color_map.get(trace["driver"], "")
                trace["status"] = status_map.get(trace["driver"], "")
        except Exception:
            pass

        logger.info(f"Position chart: {len(traces)} drivers, {total_laps} laps")

        return {
            "traces": traces,
            "total_laps": total_laps,
            "grid": grid,
            "drivers": drivers
        }

    except Exception as e:
        logger.error(f"Position chart failed: {str(e)}")
        raise


def _is_nan(val) -> bool:
    try:
        return math.isnan(float(val))
    except (ValueError, TypeError):
        return False
