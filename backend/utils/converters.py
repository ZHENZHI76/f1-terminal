"""
Shared conversion utilities for F1 Terminal backend services.
Centralizes common type-safe conversion functions to avoid duplication.
"""
import math
import pandas as pd
from typing import Optional


def safe_int(val) -> Optional[int]:
    """Convert to int safely, returning None for NaN/None."""
    if val is None:
        return None
    try:
        if math.isnan(float(val)):
            return None
        return int(val)
    except (ValueError, TypeError):
        return None


def safe_float(val, decimals: int = 1) -> Optional[float]:
    """Convert to float safely, returning None for NaN/None."""
    if val is None:
        return None
    try:
        f = float(val)
        if math.isnan(f):
            return None
        return round(f, decimals)
    except (ValueError, TypeError):
        return None


def td_to_seconds(val) -> Optional[float]:
    """Convert Timedelta to seconds."""
    if val is None or pd.isna(val):
        return None
    try:
        return round(val.total_seconds(), 4)
    except (AttributeError, TypeError):
        return None


def td_to_str(val) -> Optional[str]:
    """Convert Timedelta to formatted string (e.g., '1:28.256')."""
    if val is None or pd.isna(val):
        return None
    try:
        total_seconds = val.total_seconds()
        minutes = int(total_seconds // 60)
        seconds = total_seconds % 60
        return f"{minutes}:{seconds:06.3f}"
    except (AttributeError, TypeError):
        return None


def is_nat(val) -> bool:
    """Check if value is NaT (Not a Time)."""
    try:
        return pd.isna(val)
    except (ValueError, TypeError):
        return False


def is_nan(val) -> bool:
    """Check if value is NaN."""
    try:
        return math.isnan(float(val))
    except (ValueError, TypeError):
        return False
