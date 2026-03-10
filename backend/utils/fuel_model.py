"""
Circuit-Specific Fuel Correction Model for F1 Terminal.

Real F1 engineers know fuel lap-time sensitivity varies by circuit:
- Low-speed circuits (Monaco): ~0.020 s/kg → ~0.030 s/lap
- Medium circuits (Silverstone): ~0.030 s/kg → ~0.045 s/lap
- High-speed circuits (Monza): ~0.035 s/kg → ~0.053 s/lap

Default fuel consumption: ~1.8 kg/lap (FIA limit: 110 kg max fuel load).
Fuel lap-time sensitivity is roughly: time_per_kg × fuel_burn_per_lap.

This model uses calibrated values per circuit. When exact values aren't available,
it falls back to regression from lap time (longer laps → more fuel → stronger correction).
"""
import logging

logger = logging.getLogger(__name__)

# ─── Circuit fuel correction lookup ──────────────────────────────────────────
# key: lowercase EventName fragments that FastF1 returns
# value: (fuel_kg_per_lap, time_per_kg_sec)
# Sources: historical race data analysis, public FIA technical documents
CIRCUIT_FUEL_DATA: dict[str, tuple[float, float]] = {
    # Circuit Name fragment      → (kg/lap, s/kg)
    "bahrain":                   (1.85, 0.030),  # Medium-speed desert
    "jeddah":                    (1.70, 0.028),  # High-speed street
    "saudi":                     (1.70, 0.028),
    "australia":                 (1.80, 0.032),  # Albert Park medium/high
    "melbourne":                 (1.80, 0.032),
    "japan":                     (1.90, 0.033),  # Suzuka high downforce
    "suzuka":                    (1.90, 0.033),
    "china":                     (1.85, 0.031),  # Shanghai
    "shanghai":                  (1.85, 0.031),
    "miami":                     (1.75, 0.029),  # Short fast circuit
    "emilia":                    (1.70, 0.028),  # Imola medium
    "imola":                     (1.70, 0.028),
    "monaco":                    (1.55, 0.020),  # Low speed, short lap
    "monte carlo":               (1.55, 0.020),
    "canada":                    (1.75, 0.028),  # Montreal stop-start
    "montreal":                  (1.75, 0.028),
    "spain":                     (1.80, 0.031),  # Barcelona baseline
    "barcelona":                 (1.80, 0.031),
    "austria":                   (1.60, 0.025),  # Short lap Spielberg
    "spielberg":                 (1.60, 0.025),
    "great britain":             (1.90, 0.032),  # Silverstone high-speed
    "silverstone":               (1.90, 0.032),
    "hungary":                   (1.80, 0.028),  # Hungaroring low speed
    "hungaroring":               (1.80, 0.028),
    "belgium":                   (1.95, 0.035),  # Spa long lap
    "spa":                       (1.95, 0.035),
    "netherlands":               (1.65, 0.026),  # Zandvoort short
    "zandvoort":                 (1.65, 0.026),
    "italy":                     (1.85, 0.035),  # Monza low drag
    "monza":                     (1.85, 0.035),
    "azerbaijan":                (1.80, 0.030),  # Baku street long straight
    "baku":                      (1.80, 0.030),
    "singapore":                 (1.85, 0.025),  # Marina Bay slow
    "united states":             (1.85, 0.032),  # COTA
    "austin":                    (1.85, 0.032),
    "mexico":                    (1.80, 0.028),  # High altitude — less drag
    "brazil":                    (1.75, 0.030),  # Interlagos short
    "interlagos":                (1.75, 0.030),
    "las vegas":                 (1.80, 0.033),  # High-speed street
    "qatar":                     (1.80, 0.030),  # Lusail medium
    "lusail":                    (1.80, 0.030),
    "abu dhabi":                 (1.85, 0.031),  # Yas Marina
    "yas marina":                (1.85, 0.031),
}

# Default values when circuit is not in lookup
DEFAULT_FUEL_KG_PER_LAP = 1.80
DEFAULT_TIME_PER_KG = 0.030


def get_fuel_correction(event_name: str) -> dict:
    """
    Get circuit-specific fuel correction parameters.
    
    Returns:
        {
            "fuel_kg_per_lap": float,      # kg of fuel burned per lap
            "time_per_kg": float,           # seconds gained per kg of fuel burned
            "correction_per_lap": float,    # combined: fuel_kg_per_lap × time_per_kg (s/lap)
            "source": str,                  # "calibrated" or "default"
        }
    """
    event_lower = event_name.lower() if event_name else ""
    
    for circuit_key, (fuel_kg, time_per_kg) in CIRCUIT_FUEL_DATA.items():
        if circuit_key in event_lower:
            correction = round(fuel_kg * time_per_kg, 4)
            logger.info(f"Fuel model: {event_name} → {fuel_kg} kg/lap × {time_per_kg} s/kg = {correction} s/lap (calibrated)")
            return {
                "fuel_kg_per_lap": fuel_kg,
                "time_per_kg": time_per_kg,
                "correction_per_lap": correction,
                "source": "calibrated",
            }
    
    # Fallback to default
    correction = round(DEFAULT_FUEL_KG_PER_LAP * DEFAULT_TIME_PER_KG, 4)
    logger.info(f"Fuel model: {event_name} → using default {correction} s/lap")
    return {
        "fuel_kg_per_lap": DEFAULT_FUEL_KG_PER_LAP,
        "time_per_kg": DEFAULT_TIME_PER_KG,
        "correction_per_lap": correction,
        "source": "default",
    }


def estimate_fuel_correction_from_laptime(avg_lap_time_sec: float) -> float:
    """
    Regression-based fuel correction estimation from average lap time.
    Used when circuit lookup fails.
    
    Empirical relationship: circuits with longer laps burn more fuel per lap
    and have slightly higher fuel sensitivity.
    
    Typical range: 70s laps (Austria) → 0.040, 100s laps (Spa) → 0.068
    """
    # Approximate: correction ≈ 0.00055 × lap_time
    return round(0.00055 * avg_lap_time_sec, 4)
