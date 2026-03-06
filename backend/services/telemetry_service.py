import os
import fastf1
import polars as pl
import numpy as np
from scipy.interpolate import interp1d
import logging

# Configure basic logging formatting for the Quant Engine
logging.basicConfig(level=logging.INFO, format='%(asctime)s - [%(levelname)s] QUANT ENGINE: %(message)s')
logger = logging.getLogger(__name__)

# 1. 强制使用本地缓存文件夹 ./f1_cache
CACHE_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "f1_cache")
os.makedirs(CACHE_DIR, exist_ok=True)
fastf1.Cache.enable_cache(CACHE_DIR)

from typing import Optional
from services.circuit_info_service import get_corner_distances

def _extract_lap_meta(lap, driver: str) -> dict:
    """Extract metadata from a lap for context display."""
    import pandas as pd
    lt = lap.get("LapTime")
    s1 = lap.get("Sector1Time")
    s2 = lap.get("Sector2Time")
    s3 = lap.get("Sector3Time")
    return {
        "driver": driver,
        "lap_number": int(lap.get("LapNumber", 0)) if not pd.isna(lap.get("LapNumber", None)) else None,
        "lap_time_sec": round(lt.total_seconds(), 4) if lt is not None and not pd.isna(lt) else None,
        "lap_time_str": f"{int(lt.total_seconds()//60)}:{lt.total_seconds()%60:06.3f}" if lt is not None and not pd.isna(lt) else None,
        "s1": round(s1.total_seconds(), 3) if s1 is not None and not pd.isna(s1) else None,
        "s2": round(s2.total_seconds(), 3) if s2 is not None and not pd.isna(s2) else None,
        "s3": round(s3.total_seconds(), 3) if s3 is not None and not pd.isna(s3) else None,
        "compound": str(lap.get("Compound", "UNKNOWN")),
        "tyre_life": int(lap.get("TyreLife", 0)) if not pd.isna(lap.get("TyreLife", None)) else None,
        "is_personal_best": bool(lap.get("IsPersonalBest", False)),
        "team": str(lap.get("Team", "")),
    }


def get_driver_telemetry_comparison(year: int, grand_prix: str, session_type: str, driver_a: str, driver_b: Optional[str] = None) -> dict:
    """
    Quant-Level Data Modeling:
    Load a session, extract fastest lap telemetry.
    If driver_b is provided, aligns their telemetry based on Distance using interpolation in Polars 
    and calculates speed delta between them.
    Returns dict with 'telemetry' (list[dict]) and 'meta' (lap context for each driver).
    """
    try:
        # 使用 FastF1 加载 Session
        logger.info(f"Initiating FastF1 data fetch for {year} {grand_prix} ({session_type})... (This may take a while on first run)")
        session = fastf1.get_session(year, grand_prix, session_type)
        session.load(telemetry=True, laps=True, weather=False)
        logger.info(f"Successfully loaded FastF1 cache/session for {year} {grand_prix}.")
        
        # 获取第一位车手在指定 Session（如 'Q'）中的最快圈 (Fastest Lap)
        lap_a = session.laps.pick_drivers(driver_a).pick_fastest()
        if lap_a.empty:
            raise ValueError(f"Could not find valid fastest lap for {driver_a} in {year} {grand_prix}")

        cols = ['Time', 'Distance', 'Speed', 'Throttle', 'Brake', 'nGear', 'RPM', 'DRS']

        if not driver_b:
            # 单车手 Baseline 模式 (无插值、无Delta计算)
            logger.info(f"Extracting baseline telemetry for single driver: {driver_a}")
            tel_a = lap_a.get_telemetry()[cols]
            df_a = pl.from_pandas(tel_a.copy()).fill_nan(0).fill_null(0)
            
            baseline_df = pl.DataFrame({
                "D": df_a.get_column("Distance").to_numpy(),
                "A_Spd": df_a.get_column("Speed").to_numpy(),
                "A_RPM": df_a.get_column("RPM").to_numpy(),
                "A_Thr": df_a.get_column("Throttle").to_numpy(),
                "A_Brk": df_a.get_column("Brake").to_numpy(),
                "A_Gear": df_a.get_column("nGear").to_numpy(),
                "A_DRS": df_a.get_column("DRS").to_numpy()
            }).fill_nan(0).fill_null(0)
            
            # Extract corner markers for distance axis annotation
            try:
                corners = get_corner_distances(year, grand_prix, session_type)
            except Exception:
                corners = []

            return {
                "meta": {"driver_a": _extract_lap_meta(lap_a, driver_a)},
                "telemetry": baseline_df.to_dicts(),
                "corners": corners
            }

        # 双车手对比模式
        lap_b = session.laps.pick_drivers(driver_b).pick_fastest()
        if lap_b.empty:
            raise ValueError(f"Could not find valid fastest lap for {driver_b} in {year} {grand_prix}")
        
        # 提取包含 Time, Distance, Speed, Throttle, Brake, nGear, RPM, DRS 的遥测数据
        # 必须显式 .copy() 防止 Pandas 切片拷贝警告 (SettingWithCopyWarning) 导致数据篡改
        cols = ['Time', 'Distance', 'Speed', 'Throttle', 'Brake', 'nGear', 'RPM', 'DRS']
        tel_a = lap_a.get_telemetry()[cols].copy()
        tel_b = lap_b.get_telemetry()[cols].copy()
        
        # 将 Time (timedelta) 转换为秒 (float)，解决 Polars 类型不兼容和后续数学运算问题
        tel_a['Time'] = tel_a['Time'].dt.total_seconds()
        tel_b['Time'] = tel_b['Time'].dt.total_seconds()
        
        # 将 Pandas DataFrame 转为 Polars DataFrame 实现极致性能
        df_a = pl.from_pandas(tel_a.copy())
        df_b = pl.from_pandas(tel_b.copy())
        
        # 处理潜在的 NaN 异常值
        df_a = df_a.fill_nan(0).fill_null(0)
        df_b = df_b.fill_nan(0).fill_null(0)

        dist_a = df_a.get_column("Distance").to_numpy()
        dist_b = df_b.get_column("Distance").to_numpy()
        
        # 1. 统一坐标系：创建一个基准距离数组 ref_distance，2米采样一次
        max_dist = min(np.max(dist_a), np.max(dist_b))
        ref_distance = np.arange(0, max_dist, 2.0)
        
        # 移除重复项以确保插值成功
        _, uq_idx_a = np.unique(dist_a, return_index=True)
        uq_idx_a = np.sort(uq_idx_a)
        _, uq_idx_b = np.unique(dist_b, return_index=True)
        uq_idx_b = np.sort(uq_idx_b)

        dist_a_uq = dist_a[uq_idx_a]
        time_a_uq = df_a.get_column("Time").to_numpy()[uq_idx_a]
        speed_a_uq = df_a.get_column("Speed").to_numpy()[uq_idx_a]
        rpm_a_uq = df_a.get_column("RPM").to_numpy()[uq_idx_a]
        throttle_a_uq = df_a.get_column("Throttle").to_numpy()[uq_idx_a]
        brake_a_uq = df_a.get_column("Brake").to_numpy()[uq_idx_a]
        gear_a_uq = df_a.get_column("nGear").to_numpy()[uq_idx_a]
        drs_a_uq = df_a.get_column("DRS").to_numpy()[uq_idx_a]
        
        dist_b_uq = dist_b[uq_idx_b]
        time_b_uq = df_b.get_column("Time").to_numpy()[uq_idx_b]
        speed_b_uq = df_b.get_column("Speed").to_numpy()[uq_idx_b]
        rpm_b_uq = df_b.get_column("RPM").to_numpy()[uq_idx_b]
        throttle_b_uq = df_b.get_column("Throttle").to_numpy()[uq_idx_b]
        brake_b_uq = df_b.get_column("Brake").to_numpy()[uq_idx_b]
        gear_b_uq = df_b.get_column("nGear").to_numpy()[uq_idx_b]
        drs_b_uq = df_b.get_column("DRS").to_numpy()[uq_idx_b]
        
        # 2. SciPy 一维插值
        interp_a_time = interp1d(dist_a_uq, time_a_uq, kind='linear', bounds_error=False, fill_value="extrapolate")
        interp_a_speed = interp1d(dist_a_uq, speed_a_uq, kind='linear', bounds_error=False, fill_value="extrapolate")
        interp_a_rpm = interp1d(dist_a_uq, rpm_a_uq, kind='linear', bounds_error=False, fill_value="extrapolate")
        interp_a_thr = interp1d(dist_a_uq, throttle_a_uq, kind='linear', bounds_error=False, fill_value="extrapolate")
        interp_a_brk = interp1d(dist_a_uq, brake_a_uq, kind='nearest', bounds_error=False, fill_value="extrapolate")
        interp_a_gear = interp1d(dist_a_uq, gear_a_uq, kind='nearest', bounds_error=False, fill_value="extrapolate")
        interp_a_drs = interp1d(dist_a_uq, drs_a_uq, kind='nearest', bounds_error=False, fill_value="extrapolate")
        
        interp_b_time = interp1d(dist_b_uq, time_b_uq, kind='linear', bounds_error=False, fill_value="extrapolate")
        interp_b_speed = interp1d(dist_b_uq, speed_b_uq, kind='linear', bounds_error=False, fill_value="extrapolate")
        interp_b_rpm = interp1d(dist_b_uq, rpm_b_uq, kind='linear', bounds_error=False, fill_value="extrapolate")
        interp_b_thr = interp1d(dist_b_uq, throttle_b_uq, kind='linear', bounds_error=False, fill_value="extrapolate")
        interp_b_brk = interp1d(dist_b_uq, brake_b_uq, kind='nearest', bounds_error=False, fill_value="extrapolate")
        interp_b_gear = interp1d(dist_b_uq, gear_b_uq, kind='nearest', bounds_error=False, fill_value="extrapolate")
        interp_b_drs = interp1d(dist_b_uq, drs_b_uq, kind='nearest', bounds_error=False, fill_value="extrapolate")
        
        time_a_aligned = interp_a_time(ref_distance)
        time_b_aligned = interp_b_time(ref_distance)
        
        # 3. 计算 Delta Time
        delta_time = time_a_aligned - time_b_aligned
        
        # 4. 清理与输出: 扁平的 JSON 列表
        aligned_df = pl.DataFrame({
            "D": ref_distance,
            "A_Spd": interp_a_speed(ref_distance),
            "B_Spd": interp_b_speed(ref_distance),
            "A_RPM": interp_a_rpm(ref_distance),
            "B_RPM": interp_b_rpm(ref_distance),
            "A_Thr": interp_a_thr(ref_distance),
            "B_Thr": interp_b_thr(ref_distance),
            "A_Brk": interp_a_brk(ref_distance),
            "B_Brk": interp_b_brk(ref_distance),
            "A_Gear": interp_a_gear(ref_distance),
            "B_Gear": interp_b_gear(ref_distance),
            "A_DRS": interp_a_drs(ref_distance),
            "B_DRS": interp_b_drs(ref_distance),
            "Delta": delta_time,
        })
        
        # FastF1/Polars 在 JSON 序列化时不支持 NaN
        # 必须先用 0 或前序值填充插值产生的外插范围 (extrapolate boundaries)，防止生成 JavaScript Null 导致 ECharts 折线断裂
        aligned_df = aligned_df.fill_nan(0).fill_null(0)
        
        logger.info(f"Successfully extracted Polars DataFrame. Shape: ({aligned_df.height} rows, {aligned_df.width} columns)")
        logger.info(f"Interpolation & Quant Alignment complete for {driver_a} vs {driver_b}.")

        # Extract corner markers for distance axis annotation
        try:
            corners = get_corner_distances(year, grand_prix, session_type)
        except Exception:
            corners = []

        return {
            "meta": {
                "driver_a": _extract_lap_meta(lap_a, driver_a),
                "driver_b": _extract_lap_meta(lap_b, driver_b),
            },
            "telemetry": aligned_df.to_dicts(),
            "corners": corners
        }

    except Exception as e:
        logger.error(f"Telemetry comparison calculation failed: {str(e)}")
        raise
