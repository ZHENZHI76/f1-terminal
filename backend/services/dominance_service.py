import fastf1
import polars as pl
import numpy as np
import logging

logger = logging.getLogger(__name__)

def get_dominance_map(year: int, grand_prix: str, session_type: str, driver_a: str, driver_b: str) -> dict:
    """
    Quant-Level Data Extraction: Mini-sector Dominance.
    We separate the entire track into 25 micro-sectors.
    Returns the X, Y coordinates stained with the fastest driver's label.
    """
    try:
        logger.info(f"Extracting Geospatial Dominance telemetry for {driver_a} vs {driver_b} in {year} {grand_prix}")
        session = fastf1.get_session(year, grand_prix, session_type)
        session.load(telemetry=True, laps=True, weather=False)
        
        lap_a = session.laps.pick_driver(driver_a).pick_fastest()
        lap_b = session.laps.pick_driver(driver_b).pick_fastest()
        
        if lap_a.empty or lap_b.empty:
            raise ValueError(f"Could not find valid fastest laps for {driver_a} or {driver_b}")
            
        # Extract base telemetry 
        tel_a = lap_a.get_telemetry()
        tel_b = lap_b.get_telemetry()
        
        dist_a = tel_a['Distance'].values
        speed_a = tel_a['Speed'].values
        
        dist_b = tel_b['Distance'].values
        speed_b = tel_b['Speed'].values

        # 25 Bins Spatial Binning
        max_dist = max(np.max(dist_a), np.max(dist_b))
        num_sectors = 25
        sector_length = max_dist / num_sectors

        sector_dominators = [] 

        for i in range(num_sectors):
            start = i * sector_length
            end = (i + 1) * sector_length

            # Calculate average speed of A and B within the localized distance bin
            mask_a = (dist_a >= start) & (dist_a < end)
            avg_a = np.mean(speed_a[mask_a]) if np.any(mask_a) else 0

            mask_b = (dist_b >= start) & (dist_b < end)
            avg_b = np.mean(speed_b[mask_b]) if np.any(mask_b) else 0

            # Tag the prevailing label
            if avg_a >= avg_b:
                sector_dominators.append(driver_a)
            else:
                sector_dominators.append(driver_b)

        # Geospatial Map Matching 
        # Using Driver A's coordinates as the base path stencil
        df = pl.from_pandas(tel_a[['Distance', 'X', 'Y']].copy()).drop_nulls()
        
        output_nodes = []
        count_a = 0
        count_b = 0
        
        for row in df.iter_rows():
            d, x, y = row
            sector_idx = int(d // sector_length)
            if sector_idx >= num_sectors:
                sector_idx = num_sectors - 1
            
            dominator = sector_dominators[sector_idx]
            if dominator == driver_a:
                count_a += 1
            else:
                count_b += 1
                
            output_nodes.append({
                "X": float(x),
                "Y": float(y),
                "Dominator": dominator
            })
            
        total = count_a + count_b
        pct_a = (count_a / total * 100) if total > 0 else 50
        pct_b = (count_b / total * 100) if total > 0 else 50
        
        logger.info(f"Generated mini-sector dominance map. {driver_a}: {pct_a:.1f}% vs {driver_b}: {pct_b:.1f}%")
        
        return {
            "driver_a": driver_a,
            "driver_b": driver_b,
            "pct_a": pct_a,
            "pct_b": pct_b,
            "nodes": output_nodes
        }
        
    except Exception as e:
        logger.error(f"Dominance calculation failed: {str(e)}")
        raise
