import os
import json
import logging
from openai import AsyncOpenAI
from services.telemetry_service import get_driver_telemetry_comparison

logger = logging.getLogger(__name__)

# Initialize DeepSeek API Client (OpenAI-compatible)
DEEPSEEK_API_KEY = os.getenv("DEEPSEEK_API_KEY", "")
DEEPSEEK_BASE_URL = "https://api.deepseek.com"

client = AsyncOpenAI(api_key=DEEPSEEK_API_KEY, base_url=DEEPSEEK_BASE_URL)


def aggregate_telemetry_for_llm(data: list[dict], driver_a: str, driver_b: str) -> dict:
    """
    Dimensionality Reduction: Aggregates massive telemetry ticks into a concise statistical summary.
    This structured JSON avoids Token overflow while preserving quant-level race dynamics.
    Now includes RPM and DRS metrics for deepseek-reasoner's deeper analytical reasoning.
    """
    if not data:
        return {}

    # Extract core telemetry arrays
    speeds_a = [d.get("A_Spd", 0) or 0 for d in data]
    speeds_b = [d.get("B_Spd", 0) or 0 for d in data]
    rpms_a = [d.get("A_RPM", 0) or 0 for d in data]
    rpms_b = [d.get("B_RPM", 0) or 0 for d in data]
    throttles_a = [d.get("A_Thr", 0) or 0 for d in data]
    throttles_b = [d.get("B_Thr", 0) or 0 for d in data]
    brakes_a = [d.get("A_Brk", 0) or 0 for d in data]
    brakes_b = [d.get("B_Brk", 0) or 0 for d in data]
    gears_a = [d.get("A_Gear", 0) or 0 for d in data]
    gears_b = [d.get("B_Gear", 0) or 0 for d in data]
    drs_a = [d.get("A_DRS", 0) or 0 for d in data]
    drs_b = [d.get("B_DRS", 0) or 0 for d in data]
    deltas = [d.get("Delta", 0) or 0 for d in data]

    n = len(data)
    if n == 0:
        return {}

    # Speed statistics
    max_speed_a = max(speeds_a)
    max_speed_b = max(speeds_b)
    avg_speed_a = sum(speeds_a) / n
    avg_speed_b = sum(speeds_b) / n
    min_speed_a = min(speeds_a)
    min_speed_b = min(speeds_b)

    # RPM statistics
    max_rpm_a = max(rpms_a)
    max_rpm_b = max(rpms_b)
    avg_rpm_a = sum(rpms_a) / n
    avg_rpm_b = sum(rpms_b) / n

    # Throttle & Brake percentages
    full_thr_a = sum(1 for t in throttles_a if t >= 99) / n
    full_thr_b = sum(1 for t in throttles_b if t >= 99) / n
    braking_a = sum(1 for b in brakes_a if b > 0) / n
    braking_b = sum(1 for b in brakes_b if b > 0) / n
    coasting_a = sum(1 for i in range(n) if throttles_a[i] < 99 and brakes_a[i] == 0) / n
    coasting_b = sum(1 for i in range(n) if throttles_b[i] < 99 and brakes_b[i] == 0) / n

    # DRS usage percentage (DRS > 10 typically means open)
    drs_open_a = sum(1 for d in drs_a if d >= 10) / n
    drs_open_b = sum(1 for d in drs_b if d >= 10) / n

    # Average gear (indicates how much of the track is spent in high gears)
    avg_gear_a = sum(gears_a) / n
    avg_gear_b = sum(gears_b) / n

    # Delta analysis
    final_delta = deltas[-1] if deltas else 0
    max_advantage_a = min(deltas)  # Most negative = A furthest ahead
    max_advantage_b = max(deltas)  # Most positive = B furthest ahead

    # Find distance of max advantage
    dist_max_adv_a = data[deltas.index(max_advantage_a)].get("D", 0) if deltas else 0
    dist_max_adv_b = data[deltas.index(max_advantage_b)].get("D", 0) if deltas else 0

    return {
        "speed": {
            "max": {driver_a: round(max_speed_a, 1), driver_b: round(max_speed_b, 1)},
            "avg": {driver_a: round(avg_speed_a, 1), driver_b: round(avg_speed_b, 1)},
            "min_cornering": {driver_a: round(min_speed_a, 1), driver_b: round(min_speed_b, 1)},
            "top_speed_advantage": driver_a if max_speed_a > max_speed_b else driver_b,
            "top_speed_delta_kmh": round(abs(max_speed_a - max_speed_b), 1)
        },
        "rpm": {
            "max": {driver_a: round(max_rpm_a), driver_b: round(max_rpm_b)},
            "avg": {driver_a: round(avg_rpm_a), driver_b: round(avg_rpm_b)}
        },
        "pedal_inputs": {
            "full_throttle_pct": {driver_a: round(full_thr_a * 100, 1), driver_b: round(full_thr_b * 100, 1)},
            "braking_pct": {driver_a: round(braking_a * 100, 1), driver_b: round(braking_b * 100, 1)},
            "coasting_pct": {driver_a: round(coasting_a * 100, 1), driver_b: round(coasting_b * 100, 1)}
        },
        "aero_drs": {
            "drs_open_pct": {driver_a: round(drs_open_a * 100, 1), driver_b: round(drs_open_b * 100, 1)}
        },
        "gearing": {
            "avg_gear": {driver_a: round(avg_gear_a, 2), driver_b: round(avg_gear_b, 2)}
        },
        "delta_time": {
            "final_gap_seconds": round(final_delta, 4),
            "leader": driver_a if final_delta < 0 else driver_b,
            "max_advantage_a_at_m": round(dist_max_adv_a),
            "max_advantage_b_at_m": round(dist_max_adv_b),
            "max_gap_a_seconds": round(abs(max_advantage_a), 4),
            "max_gap_b_seconds": round(abs(max_advantage_b), 4)
        },
        "style_inference": {
            "late_braker": driver_a if braking_a < braking_b else driver_b,
            "better_traction": driver_a if full_thr_a > full_thr_b else driver_b,
            "higher_min_speed": driver_a if min_speed_a > min_speed_b else driver_b
        }
    }


async def generate_deepseek_insight(year: int, grand_prix: str, session_type: str, driver_a: str, driver_b: str) -> dict:
    """
    Full DeepSeek-Reasoner pipeline:
    1. Fetch raw telemetry from the SciPy interpolation engine
    2. Run dimensionality reduction to compact JSON summary
    3. Submit to deepseek-reasoner for deep chain-of-thought analysis
    4. Return both reasoning_content (thinking process) and content (final report)
    """
    # 1. Fetch raw telemetry
    raw_data = get_driver_telemetry_comparison(year, grand_prix, session_type, driver_a, driver_b)

    # 2. Dimensionality reduction
    summary = aggregate_telemetry_for_llm(raw_data, driver_a, driver_b)
    summary_json = json.dumps(summary, indent=2, ensure_ascii=False)

    # 3. Build the prompt (deepseek-reasoner does NOT support system role)
    user_prompt = f"""你是一位顶级 F1 车队的首席数据策略师，拥有量化金融和赛车工程的双重背景。

请基于以下通过量化引擎提取的遥测聚合数据，出具一份极其专业、数据驱动的赛事速度对比深度研报。

## 赛事上下文
- 赛季: {year}
- 大奖赛: {grand_prix}
- 场次: {session_type}
- 对比: {driver_a} vs {driver_b}

## 量化遥测聚合摘要
```json
{summary_json}
```

## 研报要求
1. **宏观赛段分析**：基于速度差和油门/刹车占比，推断出直道段 vs 技术弯角段的相对优势。
2. **底盘调校推断**：根据极速、尾速差异和平均档位，推断下压力/阻力配置倾向。
3. **驾驶风格解码**：分析刹车占比、滑行占比和弯心最低速度，推断晚刹 V 型入弯 vs 高弯速 U 型入弯风格差异。
4. **DRS 与引擎利用率**：结合 DRS 开启占比和 RPM 数据，分析动力单元和空气动力学的交互效应。
5. **关键距离点分析**：基于 Delta Time 的最大优势距离点，精准定位赛道上的胜负手区间。
6. **策略建议**：给出可执行的工程建议（如翼片角度微调、刹车平衡调整方向）。

请使用 Markdown 格式输出，排版紧凑精炼，体现投行研报的专业气质。标题体系使用 ##/###。
关键数据必须内嵌引用，不要泛泛而谈。"""

    if not DEEPSEEK_API_KEY:
        return {
            "reasoning": None,
            "report": f"**⚠️ LLM Engine Offline**: `DEEPSEEK_API_KEY` environment variable is not set.\n\n"
                       f"### Aggregation Backup (Raw JSON)\n```json\n{summary_json}\n```\n\n"
                       f"*Set the API key and redeploy to activate DeepSeek-Reasoner.*"
        }

    try:
        logger.info(f"[INSIGHT] Submitting to DeepSeek-Reasoner: {driver_a} vs {driver_b} @ {year} {grand_prix} {session_type}")

        response = await client.chat.completions.create(
            model="deepseek-reasoner",
            messages=[
                {"role": "user", "content": user_prompt}
            ],
            max_tokens=4096
            # NOTE: deepseek-reasoner does NOT accept temperature or system role
        )

        choice = response.choices[0]

        # deepseek-reasoner returns reasoning_content (chain-of-thought) + content (final answer)
        reasoning = getattr(choice.message, 'reasoning_content', None) or ""
        report = choice.message.content or "No insight generated."

        logger.info(f"[INSIGHT] DeepSeek-Reasoner response received. Reasoning: {len(reasoning)} chars, Report: {len(report)} chars.")

        return {
            "reasoning": reasoning,
            "report": report
        }

    except Exception as e:
        logger.error(f"[INSIGHT] DeepSeek-Reasoner generation failed: {str(e)}")
        return {
            "reasoning": None,
            "report": f"**Error generating LLM insight**: {str(e)}\n\n"
                       f"### Aggregation Backup\n```json\n{summary_json}\n```"
        }
