"""
Circuit Information Service — FastF1 CircuitInfo Integration
Extracts corner numbers, positions, distances, angles, marshal sectors,
and rotation data for any session's circuit.
"""
import fastf1
import numpy as np
import pandas as pd
import logging

logger = logging.getLogger(__name__)


def get_circuit_info(year: int, grand_prix: str, session_type: str) -> dict:
    """
    Extract complete circuit metadata using FastF1's get_circuit_info().
    Returns:
      - corners: [{number, letter, distance, angle, x, y}]
      - marshal_lights: [{distance, x, y}]
      - marshal_sectors: [{distance, x, y}]
      - rotation: float (track rotation in degrees for rendering)
      - circuit_length: float (meters)
    """
    try:
        logger.info(f"CircuitInfo: {year} {grand_prix} ({session_type})")
        session = fastf1.get_session(year, grand_prix, session_type)
        session.load(laps=True, telemetry=True, weather=False, messages=False)

        circuit_info = session.get_circuit_info()

        # ─── Corners ────────────────────────────────────────────────────
        corners = []
        if hasattr(circuit_info, 'corners') and circuit_info.corners is not None:
            for _, row in circuit_info.corners.iterrows():
                corners.append({
                    "number": int(row.get("Number", 0)) if not pd.isna(row.get("Number")) else 0,
                    "letter": str(row.get("Letter", "")),
                    "distance": float(row.get("Distance", 0)) if not pd.isna(row.get("Distance")) else 0,
                    "angle": float(row.get("Angle", 0)) if not pd.isna(row.get("Angle")) else 0,
                    "x": float(row.get("X", 0)) if not pd.isna(row.get("X")) else 0,
                    "y": float(row.get("Y", 0)) if not pd.isna(row.get("Y")) else 0,
                })

        # ─── Marshal Lights ─────────────────────────────────────────────
        marshal_lights = []
        if hasattr(circuit_info, 'marshal_lights') and circuit_info.marshal_lights is not None:
            for _, row in circuit_info.marshal_lights.iterrows():
                marshal_lights.append({
                    "distance": float(row.get("Distance", 0)) if not pd.isna(row.get("Distance")) else 0,
                    "x": float(row.get("X", 0)) if not pd.isna(row.get("X")) else 0,
                    "y": float(row.get("Y", 0)) if not pd.isna(row.get("Y")) else 0,
                })

        # ─── Marshal Sectors ────────────────────────────────────────────
        marshal_sectors = []
        if hasattr(circuit_info, 'marshal_sectors') and circuit_info.marshal_sectors is not None:
            for _, row in circuit_info.marshal_sectors.iterrows():
                marshal_sectors.append({
                    "distance": float(row.get("Distance", 0)) if not pd.isna(row.get("Distance")) else 0,
                    "x": float(row.get("X", 0)) if not pd.isna(row.get("X")) else 0,
                    "y": float(row.get("Y", 0)) if not pd.isna(row.get("Y")) else 0,
                })

        # ─── Rotation ──────────────────────────────────────────────────
        rotation = float(circuit_info.rotation) if hasattr(circuit_info, 'rotation') else 0.0

        # ─── Circuit Length (from lap telemetry) ────────────────────────
        circuit_length = 0.0
        try:
            fastest_lap = session.laps.pick_fastest()
            if not fastest_lap.empty:
                tel = fastest_lap.get_telemetry()
                if 'Distance' in tel.columns and len(tel) > 0:
                    circuit_length = float(tel['Distance'].max())
        except Exception:
            pass

        logger.info(f"CircuitInfo extracted: {len(corners)} corners, {len(marshal_lights)} lights, rotation={rotation:.1f}°")

        return {
            "corners": corners,
            "marshal_lights": marshal_lights,
            "marshal_sectors": marshal_sectors,
            "rotation": rotation,
            "circuit_length": round(circuit_length, 1),
            "total_corners": len(corners),
        }

    except Exception as e:
        logger.error(f"CircuitInfo extraction failed: {str(e)}")
        raise


def get_corner_distances(year: int, grand_prix: str, session_type: str) -> list[dict]:
    """
    Lightweight extraction: just corner numbers and their distances.
    Used to annotate the TEL distance axis with corner markers.
    """
    info = get_circuit_info(year, grand_prix, session_type)
    return info.get("corners", [])
