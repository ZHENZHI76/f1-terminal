import os
import logging
from openai import AsyncOpenAI
from services.telemetry_service import get_driver_telemetry_comparison

logger = logging.getLogger(__name__)

# Initialize DeepSeek V3 API Client (OpenAI-compatible)
# The API key should be provided via the DEEPSEEK_API_KEY environment variable.
DEEPSEEK_API_KEY = os.getenv("DEEPSEEK_API_KEY", "")
DEEPSEEK_BASE_URL = "https://api.deepseek.com"

client = AsyncOpenAI(api_key=DEEPSEEK_API_KEY, base_url=DEEPSEEK_BASE_URL)

def aggregate_telemetry_for_llm(data: list[dict], driver_a: str, driver_b: str) -> dict:
    """
    Dimensionality Reduction: Aggregates massive telemetry ticks into a concise statistical summary.
    This structured JSON avoids Token overflow while preserving quant-level race dynamics.
    """
    if not data:
        return {}

    # Extract speeds
    speeds_a = [d.get("A_Spd", 0) or 0 for d in data]
    speeds_b = [d.get("B_Spd", 0) or 0 for d in data]
    
    # Delta Times (Replacing delta speeds)
    deltas = [d.get("Delta", 0) or 0 for d in data]

    # Throttle / Brake
    throttles_a = [d.get("A_Thr", 0) or 0 for d in data]
    throttles_b = [d.get("B_Thr", 0) or 0 for d in data]
    brakes_a = [d.get("A_Brk", 0) or 0 for d in data]
    brakes_b = [d.get("B_Brk", 0) or 0 for d in data]
    
    # Calculations
    max_speed_a = max(speeds_a) if speeds_a else 0
    max_speed_b = max(speeds_b) if speeds_b else 0
    
    avg_speed_a = sum(speeds_a) / len(speeds_a) if speeds_a else 0
    avg_speed_b = sum(speeds_b) / len(speeds_b) if speeds_b else 0
    
    time_full_throttle_a = sum(1 for t in throttles_a if t >= 99) / len(throttles_a) if throttles_a else 0
    time_full_throttle_b = sum(1 for t in throttles_b if t >= 99) / len(throttles_b) if throttles_b else 0
    
    time_braking_a = sum(1 for b in brakes_a if b > 0) / len(brakes_a) if brakes_a else 0
    time_braking_b = sum(1 for b in brakes_b if b > 0) / len(brakes_b) if brakes_b else 0

    return {
        "Max_Speed_Delta": max_speed_a - max_speed_b,
        "Top_Speed_Advantage": driver_a if max_speed_a > max_speed_b else driver_b,
        "Average_Speed_Delta": avg_speed_a - avg_speed_b,
        "Full_Throttle_Percentage": {
            driver_a: round(time_full_throttle_a * 100, 2),
            driver_b: round(time_full_throttle_b * 100, 2)
        },
        "Braking_Percentage": {
            driver_a: round(time_braking_a * 100, 2),
            driver_b: round(time_braking_b * 100, 2)
        },
        "Driving_Style_Inference": {
            "Late_Braker": driver_a if time_braking_a < time_braking_b else driver_b,
            "Better_Traction_Exit": driver_a if time_full_throttle_a > time_full_throttle_b else driver_b
        }
    }

async def generate_deepseek_insight(year: int, grand_prix: str, session_type: str, driver_a: str, driver_b: str) -> str:
    """
    Combines the Aggregator JSON with DeepSeek V3 Prompting to output a markdown report.
    """
    # 1. Fetch raw telemetry
    raw_data = get_driver_telemetry_comparison(year, grand_prix, session_type, driver_a, driver_b)
    
    # 2. Dimensionality reduction
    summary = aggregate_telemetry_for_llm(raw_data, driver_a, driver_b)
    
    # 3. Create context prompt
    context_str = f"""
    Event context: {year} {grand_prix} Grand Prix, Session: {session_type}
    Driver Comparison: {driver_a} vs {driver_b}
    
    Telemetry Aggregation Summary:
    Max Speed Delta (A-B): {summary.get("Max_Speed_Delta", 0):.2f} km/h
    Top Speed Advantage: {summary.get("Top_Speed_Advantage", "N/A")}
    Average Speed Delta (A-B): {summary.get("Average_Speed_Delta", 0):.2f} km/h
    {driver_a} Full Throttle %: {summary.get("Full_Throttle_Percentage", {}).get(driver_a, 0)}%
    {driver_b} Full Throttle %: {summary.get("Full_Throttle_Percentage", {}).get(driver_b, 0)}%
    {driver_a} Braking %: {summary.get("Braking_Percentage", {}).get(driver_a, 0)}%
    {driver_b} Braking %: {summary.get("Braking_Percentage", {}).get(driver_b, 0)}%
    Late Braker characteristics observed: {summary.get("Driving_Style_Inference", {}).get("Late_Braker", "N/A")}
    Better throttle traction exit observed: {summary.get("Driving_Style_Inference", {}).get("Better_Traction_Exit", "N/A")}
    """

    system_prompt = """
    你是一位 F1 车队的首席策略师。请基于以下通过量化模型提取的遥测摘要数据，出具一份高度专业、数据驱动的排位赛速度对比研报。
    
    要求：
    1. 极高的数据密度，体现投行和赛道工程师的专业素养。
    2. 不要废话，直接给出宏观赛段优势分析（如直道 vs 弯角）和底盘特性推断（如下压力 / 阻力水平）。
    3. 解释两位车手的驾驶风格差异（例如谁倾向于 V 型晚刹车入弯，谁保持了更高的弯心最低速度）。
    4. 必须使用 Markdown 格式，排版要紧凑清晰。
    """

    if not DEEPSEEK_API_KEY:
        return f"**LLM Initialization Failed**: `DEEPSEEK_API_KEY` is completely missing from environment variables. \n\n### Local Aggregation Data Backup\n```json\n{summary}\n```\n\n*Please supply API key to activate DeepSeek-V3.*"

    try:
        response = await client.chat.completions.create(
            model="deepseek-chat", # This routes to V3 in the general DeepSeek API
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": context_str}
            ],
            temperature=0.3, # Keep it highly analytical and deterministic
            max_tokens=1500
        )
        return response.choices[0].message.content or "No insight generated."
    except Exception as e:
        logger.error(f"DeepSeek generation failed: {str(e)}")
        return f"**Error generating LLM insight**: {str(e)}"
