from fastapi import APIRouter, HTTPException
import logging
from datetime import datetime, timezone
import fastf1
import pandas as pd

logger = logging.getLogger(__name__)
router = APIRouter()


# FastF1 session column mapping (Session1 through Session5)
SESSION_COLUMNS = [
    ("Session1", "Session1DateUtc"),
    ("Session2", "Session2DateUtc"),
    ("Session3", "Session3DateUtc"),
    ("Session4", "Session4DateUtc"),
    ("Session5", "Session5DateUtc"),
]


def _fetch_latest_weather() -> dict:
    """
    Attempt to fetch weather data from the most recently completed session.
    Returns dict with TrackTemp, AirTemp, Humidity, Rainfall.
    Falls back to 'N/A' if data is unavailable.
    """
    result = {"TrackTemp": "N/A", "AirTemp": "N/A", "Humidity": "N/A", "Rainfall": False}
    try:
        current_year = datetime.now().year
        schedule = fastf1.get_event_schedule(current_year)
        now_utc = datetime.now(timezone.utc)

        # Find the most recently completed event by scanning backwards
        last_completed_event = None
        last_completed_session_name = None

        for _, event in schedule.iterrows():
            for session_name_col, session_date_col in reversed(SESSION_COLUMNS):
                try:
                    s_name = event.get(session_name_col)
                    s_date = event.get(session_date_col)
                    if not s_name or s_name == '' or s_date is None or pd.isna(s_date):
                        continue
                    if hasattr(s_date, 'tzinfo') and s_date.tzinfo is None:
                        s_date = s_date.replace(tzinfo=timezone.utc)
                    if s_date < now_utc:
                        last_completed_event = event
                        last_completed_session_name = s_name
                except Exception:
                    continue

        if last_completed_event is not None and last_completed_session_name:
            try:
                session = fastf1.get_session(
                    current_year,
                    last_completed_event['EventName'],
                    last_completed_session_name
                )
                session.load(laps=False, telemetry=False, weather=True, messages=False)
                weather = session.weather_data

                if weather is not None and not weather.empty:
                    last_row = weather.iloc[-1]
                    track_temp = last_row.get('TrackTemp')
                    air_temp = last_row.get('AirTemp')
                    humidity = last_row.get('Humidity')
                    rainfall = last_row.get('Rainfall')

                    if track_temp is not None and not pd.isna(track_temp):
                        result["TrackTemp"] = f"{float(track_temp):.1f}°C"
                    if air_temp is not None and not pd.isna(air_temp):
                        result["AirTemp"] = f"{float(air_temp):.1f}°C"
                    if humidity is not None and not pd.isna(humidity):
                        result["Humidity"] = f"{float(humidity):.0f}%"
                    if rainfall is not None:
                        result["Rainfall"] = bool(rainfall)

                    logger.info(f"Weather loaded from {last_completed_event['EventName']} {last_completed_session_name}: "
                                f"Track={result['TrackTemp']}, Air={result['AirTemp']}")
            except Exception as we:
                logger.warning(f"Weather fetch failed for recent session: {we}")

    except Exception as e:
        logger.warning(f"Weather scan failed: {e}")

    return result


@router.get("/macro/next-event")
def get_next_event():
    """
    Fetch the next upcoming Formula 1 session from the official FastF1 schedule.
    Returns session-level granularity (e.g., 'Practice 1', 'Sprint Qualifying', 'Race').
    Also returns weather from the most recently completed session.
    """
    try:
        current_year = datetime.now().year
        schedule = fastf1.get_event_schedule(current_year)
        now_utc = datetime.now(timezone.utc)

        # Fetch latest weather in parallel
        weather = _fetch_latest_weather()

        # Iterate all events to find the next upcoming session
        for _, event in schedule.iterrows():
            event_format = event.get('EventFormat', 'conventional')
            round_number = int(event.get('RoundNumber', 0))

            for session_name_col, session_date_col in SESSION_COLUMNS:
                try:
                    session_name = event.get(session_name_col, None)
                    session_date = event.get(session_date_col, None)

                    if not session_name or session_name == '' or session_date is None:
                        continue
                    if pd.isna(session_date):
                        continue

                    if hasattr(session_date, 'tzinfo') and session_date.tzinfo is None:
                        session_date = session_date.replace(tzinfo=timezone.utc)

                    if session_date > now_utc:
                        # Format a human-readable local time
                        local_str = session_date.strftime("%b %d, %H:%M UTC")

                        return {
                            "status": "success",
                            "data": {
                                "EventName": event['EventName'],
                                "Country": event.get('Country', 'N/A'),
                                "Location": event.get('Location', 'N/A'),
                                "Round": round_number,
                                "NextSession": session_name.upper(),
                                "EventFormat": event_format,
                                "StartTimeUTC": session_date.isoformat(),
                                "StartTimeFormatted": local_str,
                                "TrackTemp": weather["TrackTemp"],
                                "AirTemp": weather["AirTemp"],
                                "Humidity": weather["Humidity"],
                                "Rainfall": weather["Rainfall"],
                            }
                        }
                except Exception:
                    continue

        # All sessions have passed — season concluded
        return {
            "status": "success",
            "data": {
                "EventName": "SEASON CONCLUDED",
                "Country": current_year,
                "Location": "N/A",
                "Round": 0,
                "NextSession": "OFF-SEASON",
                "EventFormat": "N/A",
                "StartTimeUTC": now_utc.replace(year=now_utc.year + 1, month=3, day=1).isoformat(),
                "StartTimeFormatted": f"MAR 01, {now_utc.year + 1}",
                "TrackTemp": weather["TrackTemp"],
                "AirTemp": weather["AirTemp"],
                "Humidity": weather["Humidity"],
                "Rainfall": weather["Rainfall"],
            }
        }

    except Exception as e:
        logger.error(f"API Error in macro next-event fetch: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error connecting to macro schedule.")


@router.get("/macro/schedule")
def get_full_schedule():
    """
    Return the complete F1 event schedule for the current year.
    Includes all event formats (conventional, sprint, testing) with all session details.
    """
    try:
        current_year = datetime.now().year
        schedule = fastf1.get_event_schedule(current_year)

        events = []
        for _, event in schedule.iterrows():
            sessions = []
            for session_name_col, session_date_col in SESSION_COLUMNS:
                s_name = event.get(session_name_col, None)
                s_date = event.get(session_date_col, None)
                if s_name and s_name != '':
                    date_str = None
                    if s_date is not None and not pd.isna(s_date):
                        if hasattr(s_date, 'tzinfo') and s_date.tzinfo is None:
                            s_date = s_date.replace(tzinfo=timezone.utc)
                        date_str = s_date.isoformat()
                    sessions.append({
                        "name": s_name,
                        "date_utc": date_str
                    })

            events.append({
                "round": int(event.get('RoundNumber', 0)),
                "name": event['EventName'],
                "country": event.get('Country', 'N/A'),
                "location": event.get('Location', 'N/A'),
                "format": event.get('EventFormat', 'conventional'),
                "sessions": sessions
            })

        return {
            "status": "success",
            "year": current_year,
            "count": len(events),
            "events": events
        }

    except Exception as e:
        logger.error(f"API Error in macro schedule fetch: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error fetching season schedule.")
