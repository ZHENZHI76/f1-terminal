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

def get_driver_telemetry_comparison(year: int, grand_prix: str, session_type: str, driver_a: str, driver_b: Optional[str] = None) -> list[dict]:
    """
    Quant-Level Data Modeling:
    Load a session, extract fastest lap telemetry.
    If driver_b is provided, aligns their telemetry based on Distance using interpolation in Polars 
    and calculates speed delta between them.
    If single driver, extracts baseline metrics.
    """
    try:
        # 使用 FastF1 加载 Session
        logger.info(f"Initiating FastF1 data fetch for {year} {grand_prix} ({session_type})... (This may take a while on first run)")
        session = fastf1.get_session(year, grand_prix, session_type)
        session.load(telemetry=True, laps=True, weather=False)
        logger.info(f"Successfully loaded FastF1 cache/session for {year} {grand_prix}.")
        
        # 获取第一位车手在指定 Session（如 'Q'）中的最快圈 (Fastest Lap)
        lap_a = session.laps.pick_driver(driver_a).pick_fastest()
        if lap_a.empty:
            raise ValueError(f"Could not find valid fastest lap for {driver_a} in {year} {grand_prix}")

        cols = ['Time', 'Distance', 'Speed', 'Throttle', 'Brake', 'nGear']

        if not driver_b:
            # 单车手 Baseline 模式 (无插值、无Delta计算)
            logger.info(f"Extracting baseline telemetry for single driver: {driver_a}")
            tel_a = lap_a.get_telemetry()[cols]
            df_a = pl.from_pandas(tel_a.copy()).fill_nan(0).fill_null(0)
            
            baseline_df = pl.DataFrame({
                "D": df_a.get_column("Distance").to_numpy(),
                "A_Spd": df_a.get_column("Speed").to_numpy(),
                "A_Thr": df_a.get_column("Throttle").to_numpy(),
                "A_Brk": df_a.get_column("Brake").to_numpy(),
                "A_Gear": df_a.get_column("nGear").to_numpy()
            }).drop_nulls().fill_nan(None)
            
            return baseline_df.to_dicts()

        # 双车手对比模式
        lap_b = session.laps.pick_driver(driver_b).pick_fastest()
        if lap_b.empty:
            raise ValueError(f"Could not find valid fastest lap for {driver_b} in {year} {grand_prix}")
        
        # 提取包含 Time, Distance, Speed, Throttle, Brake, nGear 的遥测数据
        cols = ['Time', 'Distance', 'Speed', 'Throttle', 'Brake', 'nGear']
        tel_a = lap_a.get_telemetry()[cols]
        tel_b = lap_b.get_telemetry()[cols]
        
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
        throttle_a_uq = df_a.get_column("Throttle").to_numpy()[uq_idx_a]
        brake_a_uq = df_a.get_column("Brake").to_numpy()[uq_idx_a]
        gear_a_uq = df_a.get_column("nGear").to_numpy()[uq_idx_a]
        
        dist_b_uq = dist_b[uq_idx_b]
        time_b_uq = df_b.get_column("Time").to_numpy()[uq_idx_b]
        speed_b_uq = df_b.get_column("Speed").to_numpy()[uq_idx_b]
        throttle_b_uq = df_b.get_column("Throttle").to_numpy()[uq_idx_b]
        brake_b_uq = df_b.get_column("Brake").to_numpy()[uq_idx_b]
        gear_b_uq = df_b.get_column("nGear").to_numpy()[uq_idx_b]
        
        # 2. SciPy 一维插值
        interp_a_time = interp1d(dist_a_uq, time_a_uq, kind='linear', bounds_error=False, fill_value="extrapolate")
        interp_a_speed = interp1d(dist_a_uq, speed_a_uq, kind='linear', bounds_error=False, fill_value="extrapolate")
        interp_a_thr = interp1d(dist_a_uq, throttle_a_uq, kind='linear', bounds_error=False, fill_value="extrapolate")
        interp_a_brk = interp1d(dist_a_uq, brake_a_uq, kind='nearest', bounds_error=False, fill_value="extrapolate")
        interp_a_gear = interp1d(dist_a_uq, gear_a_uq, kind='nearest', bounds_error=False, fill_value="extrapolate")
        
        interp_b_time = interp1d(dist_b_uq, time_b_uq, kind='linear', bounds_error=False, fill_value="extrapolate")
        interp_b_speed = interp1d(dist_b_uq, speed_b_uq, kind='linear', bounds_error=False, fill_value="extrapolate")
        interp_b_thr = interp1d(dist_b_uq, throttle_b_uq, kind='linear', bounds_error=False, fill_value="extrapolate")
        interp_b_brk = interp1d(dist_b_uq, brake_b_uq, kind='nearest', bounds_error=False, fill_value="extrapolate")
        interp_b_gear = interp1d(dist_b_uq, gear_b_uq, kind='nearest', bounds_error=False, fill_value="extrapolate")
        
        time_a_aligned = interp_a_time(ref_distance)
        time_b_aligned = interp_b_time(ref_distance)
        
        # 3. 计算 Delta Time
        delta_time = time_a_aligned - time_b_aligned
        
        # 4. 清理与输出: 扁平的 JSON 列表
        aligned_df = pl.DataFrame({
            "D": ref_distance,
            "A_Spd": interp_a_speed(ref_distance),
            "B_Spd": interp_b_speed(ref_distance),
            "A_Thr": interp_a_thr(ref_distance),
            "B_Thr": interp_b_thr(ref_distance),
            "A_Brk": interp_a_brk(ref_distance),
            "B_Brk": interp_b_brk(ref_distance),
            "A_Gear": interp_a_gear(ref_distance),
            "B_Gear": interp_b_gear(ref_distance),
            "Delta": delta_time,
        })
        
        # FastF1/Polars 在 JSON 序列化时不支持 NaN，故需处理为 None (在此强制 drop_nulls 保障纯净数据)
        aligned_df = aligned_df.drop_nulls().fill_nan(None)
        
        logger.info(f"Successfully extracted Polars DataFrame. Shape: ({aligned_df.height} rows, {aligned_df.width} columns)")
        logger.info(f"Interpolation & Quant Alignment complete for {driver_a} vs {driver_b}.")

        # 返回 JSON 兼容的 List[Dict]
        return aligned_df.to_dicts()

    except Exception as e:
        logger.error(f"Telemetry comparison calculation failed: {str(e)}")
        raise
