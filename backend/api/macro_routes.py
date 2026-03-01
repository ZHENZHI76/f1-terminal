from fastapi import APIRouter, HTTPException
import logging
from datetime import datetime, timezone
import fastf1

logger = logging.getLogger(__name__)
router = APIRouter()

@router.get("/macro/next-event")
def get_next_event():
    """
    Fetch the next upcoming Formula 1 event from the official FastF1 schedule.
    """
    try:
        current_year = datetime.now().year
        # Returns a Pandas DataFrame of all events in the given year
        schedule = fastf1.get_event_schedule(current_year)
        
        # Get current UTC time to find the next valid event
        now_utc = datetime.now(timezone.utc)
        
        next_event = None
        next_session_name = None
        next_session_date = None
        
        # FastF1 schema contains multiple session columns:
        # Session1DateUtc, Session2DateUtc, Session3DateUtc, Session4DateUtc, Session5DateUtc
        # Session5 is typically the Race.
        
        for index, event in schedule.iterrows():
            # Skip testing events (RoundNumber 0) if necessary, but FastF1 usually starts at 1
            if event['EventFormat'] == 'testing':
                continue
                
            # Check Session5 (Race) Date UTC
            try:
                race_date_utc = event['Session5DateUtc']
                # FastF1 returns aware datetime objects or pandas timestamps
                if race_date_utc.tzinfo is None:
                    race_date_utc = race_date_utc.replace(tzinfo=timezone.utc)
                    
                if race_date_utc > now_utc:
                    next_event = event
                    # We default to the Race as the primary "Next Session" to countdown to
                    next_session_name = "RACE"
                    next_session_date = race_date_utc.isoformat()
                    break
            except Exception as e:
                logger.warning(f"Could not parse Session5DateUtc for event {event['EventName']}: {e}")
                continue
                
        if next_event is None:
             return {
                "status": "success",
                "data": {
                    "EventName": "SEASON CONCLUDED",
                    "Country": "N/A",
                    "NextSession": "N/A",
                    "StartTimeUTC": now_utc.replace(year=now_utc.year + 1, month=3, day=1).isoformat(), # mock to next year
                    "TrackTemp": "N/A",
                    "AirTemp": "N/A"
                }
            }

        return {
            "status": "success",
            "data": {
                "EventName": next_event['EventName'],
                "Country": next_event['Country'],
                "NextSession": next_session_name,
                "StartTimeUTC": next_session_date,
                "TrackTemp": "SIMULATING", # Real-time telemetry connection to weather is complex before event
                "AirTemp": "28°C" # Static mock for the Bloomberg aesthetic until live weekend
            }
        }
            
    except Exception as e:
        logger.error(f"API Error in macro next-event fetch: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error connecting to macro schedule.")
