"""
Grand Prix Code Disambiguation Map
FastF1's fuzzy matching can resolve ambiguous codes incorrectly:
  - 'AUS' → Austin (US GP) instead of Australia
  - 'MON' → Monza instead of Monaco
  
This map converts F1 Terminal's canonical GP codes to unambiguous full names
that FastF1 can resolve correctly.
"""

GP_CODE_MAP: dict[str, str] = {
    # Primary 3-letter codes used in F1 Terminal
    "BAH": "Bahrain",
    "SAU": "Saudi Arabia",
    "AUS": "Australia",
    "JPN": "Japan",
    "CHN": "China",
    "MIA": "Miami",
    "EMI": "Emilia Romagna",
    "MON": "Monaco",
    "ESP": "Spain",
    "CAN": "Canada",
    "AUT": "Austria",
    "GBR": "Great Britain",
    "HUN": "Hungary",
    "BEL": "Belgium",
    "NED": "Netherlands",
    "ITA": "Italy",          # Monza
    "AZE": "Azerbaijan",
    "SIN": "Singapore",
    "USA": "United States",   # Austin COTA
    "MEX": "Mexico",
    "BRA": "Brazil",
    "LAS": "Las Vegas",
    "QAT": "Qatar",
    "ABU": "Abu Dhabi",
    "SPA": "Belgium",         # Spa-Francorchamps alias
    "POR": "Portugal",
    "TUR": "Turkey",
    # Extended aliases
    "BAHRAIN": "Bahrain",
    "JEDDAH": "Saudi Arabia",
    "MELBOURNE": "Australia",
    "SUZUKA": "Japan",
    "SHANGHAI": "China",
    "IMOLA": "Emilia Romagna",
    "MONACO": "Monaco",
    "BARCELONA": "Spain",
    "MONTREAL": "Canada",
    "SPIELBERG": "Austria",
    "SILVERSTONE": "Great Britain",
    "BUDAPEST": "Hungary",
    "FRANCORCHAMPS": "Belgium",
    "ZANDVOORT": "Netherlands",
    "MONZA": "Italy",
    "BAKU": "Azerbaijan",
    "MARINA BAY": "Singapore",
    "AUSTIN": "United States",
    "INTERLAGOS": "Brazil",
    "LUSAIL": "Qatar",
    "YAS MARINA": "Abu Dhabi",
}


def resolve_gp_name(user_input: str) -> str:
    """
    Resolve a user-provided GP identifier to an unambiguous name for FastF1.
    If found in the map, returns the canonical name.
    Otherwise, passes through as-is (FastF1 will try fuzzy matching).
    """
    key = user_input.strip().upper()
    if key in GP_CODE_MAP:
        return GP_CODE_MAP[key]
    return user_input
