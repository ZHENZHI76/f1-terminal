"""
Head-to-Head Teammate Comparison Service.

Engineers and analysts use H2H to:
1. Evaluate driver performance vs. teammate (same car)
2. Track qualifying pace trends across a season
3. Identify which driver is extracting more from the car
4. Compare race pace consistency (std deviation of lap times)

Uses Ergast/Jolpica API for season-wide results.
"""
import os
import fastf1
from fastf1.ergast import Ergast
import logging
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


def get_h2h_comparison(year: int, driver_a: str, driver_b: str) -> dict:
    """
    Season-wide head-to-head comparison between two drivers.
    Focuses on qualifying and race results across all GPs.
    
    Returns:
      - qualifying: {wins_a, wins_b, rounds: [{gp, pos_a, pos_b, delta, winner}]}
      - race: {wins_a, wins_b, rounds: [{gp, pos_a, pos_b, winner}]}
      - stats: {avg_quali_delta, consistency}
    """
    try:
        logger.info(f"H2H: {year} {driver_a} vs {driver_b}")
        
        # Get season event schedule
        schedule = fastf1.get_event_schedule(year, include_testing=False)
        
        quali_rounds = []
        race_rounds = []
        quali_wins_a = 0
        quali_wins_b = 0
        race_wins_a = 0
        race_wins_b = 0
        quali_deltas = []

        team = ""
        color_a = "#666666"
        color_b = "#666666"

        for _, event in schedule.iterrows():
            event_name = str(event.get('EventName', ''))
            round_number = event.get('RoundNumber', 0)
            
            # Skip pre-season and future events
            if round_number <= 0:
                continue
            
            try:
                session = fastf1.get_session(year, event_name, 'Q')
                session.load(laps=True, telemetry=False, weather=False, messages=False)
            except Exception:
                continue

            drv_a_laps = session.laps.pick_drivers(driver_a)
            drv_b_laps = session.laps.pick_drivers(driver_b)

            if drv_a_laps.empty or drv_b_laps.empty:
                continue

            # Get team info from first found event
            if not team:
                try:
                    results = session.results
                    r_a = results[results['Abbreviation'] == driver_a]
                    r_b = results[results['Abbreviation'] == driver_b]
                    if not r_a.empty:
                        team = str(r_a.iloc[0].get('TeamName', ''))
                        color_a = _fix_color(r_a.iloc[0].get('TeamColor', ''))
                    if not r_b.empty:
                        color_b = _fix_color(r_b.iloc[0].get('TeamColor', ''))
                except Exception:
                    pass

            # Qualifying comparison
            fast_a = drv_a_laps.pick_fastest()
            fast_b = drv_b_laps.pick_fastest()

            import pandas as pd
            if fast_a is not None and fast_b is not None:
                lt_a = fast_a.get('LapTime')
                lt_b = fast_b.get('LapTime')
                if lt_a is not None and lt_b is not None and not pd.isna(lt_a) and not pd.isna(lt_b):
                    time_a = lt_a.total_seconds()
                    time_b = lt_b.total_seconds()
                    delta = time_a - time_b  # positive = A slower
                    winner = driver_a if delta < 0 else driver_b

                    if delta < 0:
                        quali_wins_a += 1
                    else:
                        quali_wins_b += 1

                    quali_deltas.append(delta)

                    # Get qualifying positions from results
                    pos_a = pos_b = None
                    try:
                        results = session.results
                        r_a = results[results['Abbreviation'] == driver_a]
                        r_b = results[results['Abbreviation'] == driver_b]
                        if not r_a.empty and not pd.isna(r_a.iloc[0].get('Position')):
                            pos_a = int(r_a.iloc[0]['Position'])
                        if not r_b.empty and not pd.isna(r_b.iloc[0].get('Position')):
                            pos_b = int(r_b.iloc[0]['Position'])
                    except Exception:
                        pass

                    quali_rounds.append({
                        "gp": event_name,
                        "round": int(round_number),
                        "time_a": round(time_a, 4),
                        "time_b": round(time_b, 4),
                        "delta": round(delta, 4),
                        "pos_a": pos_a,
                        "pos_b": pos_b,
                        "winner": winner,
                    })

            # Race comparison (try loading race session)
            try:
                race = fastf1.get_session(year, event_name, 'R')
                race.load(laps=False, telemetry=False, weather=False, messages=False)
                race_results = race.results

                r_a = race_results[race_results['Abbreviation'] == driver_a]
                r_b = race_results[race_results['Abbreviation'] == driver_b]

                if not r_a.empty and not r_b.empty:
                    pos_a_r = r_a.iloc[0].get('Position')
                    pos_b_r = r_b.iloc[0].get('Position')
                    
                    if pos_a_r is not None and not pd.isna(pos_a_r) and pos_b_r is not None and not pd.isna(pos_b_r):
                        pos_a_r = int(pos_a_r)
                        pos_b_r = int(pos_b_r)
                        winner_r = driver_a if pos_a_r < pos_b_r else driver_b

                        if pos_a_r < pos_b_r:
                            race_wins_a += 1
                        else:
                            race_wins_b += 1

                        race_rounds.append({
                            "gp": event_name,
                            "round": int(round_number),
                            "pos_a": pos_a_r,
                            "pos_b": pos_b_r,
                            "winner": winner_r,
                        })
            except Exception:
                pass

        if not quali_rounds and not race_rounds:
            raise ValueError(f"No H2H data found for {driver_a} vs {driver_b} in {year}")

        # Stats
        import numpy as np
        avg_delta = float(np.mean(quali_deltas)) if quali_deltas else 0.0
        median_delta = float(np.median(quali_deltas)) if quali_deltas else 0.0

        return {
            "year": year,
            "driver_a": {"code": driver_a, "team": team, "color": color_a},
            "driver_b": {"code": driver_b, "team": team, "color": color_b},
            "qualifying": {
                "wins_a": quali_wins_a,
                "wins_b": quali_wins_b,
                "rounds": quali_rounds,
                "total_rounds": len(quali_rounds),
            },
            "race": {
                "wins_a": race_wins_a,
                "wins_b": race_wins_b,
                "rounds": race_rounds,
                "total_rounds": len(race_rounds),
            },
            "stats": {
                "avg_quali_delta": round(avg_delta, 4),
                "median_quali_delta": round(median_delta, 4),
            },
        }

    except ValueError:
        raise
    except Exception as e:
        logger.error(f"H2H comparison failed: {str(e)}")
        raise ValueError(f"H2H analysis failed: {str(e)}")
