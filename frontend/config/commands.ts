export interface CommandDefinition {
    command: string;
    description: string;
    description_cn: string;
    args: string[];
    example: string;
    examples?: string[];
    category: string;
    category_cn: string;
    supportsRaw: boolean;
    notes?: string;
    notes_cn?: string;
}

// ─── Session Type Glossary ──────────────────────────────────────────────────
export interface GlossaryEntry {
    abbr: string;
    full: string;
    full_cn?: string;
    description: string;
    description_cn?: string;
    teamColor?: string;  // for drivers
}

export const SESSION_GLOSSARY: GlossaryEntry[] = [
    { abbr: "FP1", full: "Free Practice 1", full_cn: "第一次自由练习赛", description: "First practice session. Teams validate setup choices, run aero rakes, and collect tyre data.", description_cn: "首次自由练习赛。车队验证调校方案，进行空气动力学测试并收集轮胎数据。" },
    { abbr: "FP2", full: "Free Practice 2", full_cn: "第二次自由练习赛", description: "Second practice session. High-fuel race simulation runs and long-run pace analysis.", description_cn: "第二次自由练习赛。高油量比赛模拟和长跑配速分析。" },
    { abbr: "FP3", full: "Free Practice 3", full_cn: "第三次自由练习赛", description: "Third practice session (conventional weekends only). Final low-fuel qualifying preparation.", description_cn: "第三次自由练习赛（仅限传统赛制周末）。最终低油量排位赛模拟。" },
    { abbr: "Q", full: "Qualifying", full_cn: "排位赛", description: "Full qualifying session (Q1→Q2→Q3 knockout). Use the QUAL command for per-segment splits.", description_cn: "完整排位赛（Q1→Q2→Q3 淘汰制）。使用 QUAL 命令查看各阶段分段计时。" },
    { abbr: "S", full: "Sprint Race", full_cn: "冲刺赛", description: "Short-format race (~100km). Available on Sprint weekends only.", description_cn: "短距离比赛（约100公里），仅在冲刺赛周末可用。" },
    { abbr: "SS", full: "Sprint Shootout", full_cn: "冲刺决赛", description: "Sprint qualifying format (2023). Three knockout segments for Sprint grid positions.", description_cn: "冲刺赛排位格式（2023年）。三轮淘汰决定冲刺赛发车位。" },
    { abbr: "SQ", full: "Sprint Qualifying", full_cn: "冲刺排位赛", description: "Sprint qualifying format (2024+). Replaced Sprint Shootout designation.", description_cn: "冲刺赛排位格式（2024+）。取代了冲刺决赛的名称。" },
    { abbr: "R", full: "Race", full_cn: "正赛", description: "The main Grand Prix race. Full distance (~305km / 2 hours).", description_cn: "大奖赛正赛。全程约305公里/2小时。" },
];

// System parameter glossary — static
export const SYSTEM_GLOSSARY: GlossaryEntry[] = [
    { abbr: "YEAR", full: "Season Year", full_cn: "赛季年份", description: "4-digit season year, e.g. 2024, 2023. FastF1 supports 2018 onwards for telemetry.", description_cn: "4位赛季年份，如2024、2023。FastF1支持2018年以后的遥测数据。" },
    { abbr: "GP", full: "Grand Prix", full_cn: "大奖赛", description: "Grand Prix identifier. Use 3-letter country code (BAH, MON, GBR) or full name (Bahrain, Monaco).", description_cn: "大奖赛标识。使用3字母国家代码（BAH、MON、GBR）或全名（Bahrain、Monaco）。" },
    { abbr: "SESS", full: "Session Type", full_cn: "赛段类型", description: "Session identifier: FP1, FP2, FP3, Q, S, SS, SQ, R. See Session Reference tab for details.", description_cn: "赛段标识：FP1、FP2、FP3、Q、S、SS、SQ、R。详见赛程参考标签页。" },
    { abbr: "DRIVER", full: "Driver Code", full_cn: "车手代码", description: "3-letter driver abbreviation: VER, HAM, NOR, LEC, etc. See Driver Reference tab for full list.", description_cn: "3字母车手缩写：VER、HAM、NOR、LEC等。详见车手代码标签页。" },
    { abbr: "-R / --RAW", full: "Raw Data Mode", full_cn: "原始数据模式", description: "Append this flag to output raw tabular data instead of the default chart visualization.", description_cn: "追加此标志以输出原始表格数据而非默认图表。" },
];

// GP and Driver glossaries are now fetched LIVE from the backend.
// These are fallback defaults only used if the API is unavailable.
export const GP_GLOSSARY_FALLBACK: GlossaryEntry[] = [
    { abbr: "BAH", full: "Bahrain", description: "Bahrain International Circuit, Sakhir" },
    { abbr: "SAU", full: "Saudi Arabia", description: "Jeddah Corniche Circuit" },
    { abbr: "AUS", full: "Australia", description: "Albert Park Circuit, Melbourne" },
    { abbr: "JPN", full: "Japan", description: "Suzuka International Racing Course" },
    { abbr: "CHN", full: "China", description: "Shanghai International Circuit" },
    { abbr: "MIA", full: "Miami", description: "Miami International Autodrome" },
    { abbr: "MON", full: "Monaco", description: "Circuit de Monaco, Monte Carlo" },
    { abbr: "GBR", full: "Great Britain", description: "Silverstone Circuit" },
    { abbr: "ITA", full: "Italy", description: "Autodromo Nazionale Monza" },
    { abbr: "USA", full: "United States", description: "Circuit of the Americas, Austin" },
    { abbr: "ABU", full: "Abu Dhabi", description: "Yas Marina Circuit" },
];

export const DRIVER_GLOSSARY_FALLBACK: GlossaryEntry[] = [
    { abbr: "VER", full: "Max Verstappen", description: "Red Bull Racing" },
    { abbr: "NOR", full: "Lando Norris", description: "McLaren" },
    { abbr: "LEC", full: "Charles Leclerc", description: "Ferrari" },
    { abbr: "HAM", full: "Lewis Hamilton", description: "Ferrari" },
    { abbr: "RUS", full: "George Russell", description: "Mercedes" },
];

// ─── Helpers ────────────────────────────────────────────────────────────────
// Dynamic year for examples — always uses current year
const CY = new Date().getFullYear();

// ─── Command Definitions (Full Bilingual) ───────────────────────────────────
export const COMMAND_REGISTRY: CommandDefinition[] = [
    {
        command: "TEL",
        description: "High-frequency telemetry comparator. Overlays Speed, Throttle, Brake, RPM, nGear, DRS traces on distance-aligned axes. Computes ΔT (delta time) between two drivers.",
        description_cn: "高频遥测对比器。叠加速度、油门、制动、转速、档位、DRS 轨迹于距离对齐坐标轴。计算两位车手的 ΔT（时间差）。",
        args: ["YEAR", "GP", "SESS", "DRIVER_A", "[DRIVER_B]"],
        example: `TEL ${CY} AUS Q VER LEC`,
        examples: [
            `TEL ${CY} AUS Q VER LEC`,
            `TEL ${CY} AUS FP1 NOR`,
            `TEL ${CY} AUS R HAM VER`,
        ],
        category: "QUANTITATIVE TELEMETRY",
        category_cn: "量化遥测",
        supportsRaw: true,
        notes: "Accepts FP1/FP2/FP3/Q/S/SS/SQ/R. Omit DRIVER_B for single-driver mode. Append 'LAP N' to compare specific lap numbers (e.g. TEL 2025 AUS R VER LEC LAP 15). -R for raw data.",
        notes_cn: "接受 FP1/FP2/FP3/Q/S/SS/SQ/R。省略 DRIVER_B 为单车手模式。追加 'LAP N' 对比指定圈数（如 TEL 2025 AUS R VER LEC LAP 15）。-R 获取原始数据。",
    },
    {
        command: "SEC",
        description: "Sector time comparator. Extracts S1/S2/S3 split times and 4 speed traps from fastest laps. Computes per-sector delta and advantage labels.",
        description_cn: "赛段计时对比器。提取最快圈的 S1/S2/S3 分段时间及4个测速点。计算各赛段差值及优势标签。",
        args: ["YEAR", "GP", "SESS", "DRIVER_A", "DRIVER_B"],
        example: `SEC ${CY} AUS Q VER LEC`,
        examples: [
            `SEC ${CY} AUS Q VER LEC`,
            `SEC ${CY} MON FP2 NOR PIA`,
        ],
        category: "QUANTITATIVE TELEMETRY",
        category_cn: "量化遥测",
        supportsRaw: false,
        notes: "Negative delta = DRIVER_A faster (green). Includes tyre compound and life context.",
        notes_cn: "负差值 = DRIVER_A 更快（绿色）。包含轮胎配方和使用寿命信息。",
    },
    {
        command: "DOM",
        description: "Mini-sector dominance map. Divides the track into 25 micro-sectors, computes average speed per sector, colors XY track map by sector ownership.",
        description_cn: "微赛段统治力地图。将赛道分为25个微赛段，计算每段平均速度，以颜色标注 XY 赛道图的赛段归属。",
        args: ["YEAR", "GP", "SESS", "DRIVER_A", "DRIVER_B"],
        example: `DOM ${CY} AUS R VER NOR`,
        category: "QUANTITATIVE TELEMETRY",
        category_cn: "量化遥测",
        supportsRaw: false,
    },
    {
        command: "MAP SPD",
        description: "Geo-spatial velocity cartography. Plots full track trajectory from XY telemetry, color-coded by speed (blue→red gradient). Identifies braking zones and apex speeds.",
        description_cn: "地理空间速度制图。绘制完整赛道 XY 遥测轨迹，以速度（蓝→红渐变）着色。识别制动区和弯心速度。",
        args: ["YEAR", "GP", "SESS", "DRIVER"],
        example: `MAP SPD ${CY} AUS Q VER`,
        examples: [
            `MAP SPD ${CY} AUS Q VER`,
            `MAP SPD ${CY} MON FP3 LEC`,
        ],
        category: "QUANTITATIVE TELEMETRY",
        category_cn: "量化遥测",
        supportsRaw: false,
    },
    {
        command: "MAP GEAR",
        description: "Discrete transmission mapping. Colors XY track by active gear (1-8). Reveals gear selection, downshift points, and traction zones.",
        description_cn: "离散变速箱映射。以当前档位（1-8 档）着色 XY 赛道。展示换挡策略、降档点和牵引力区域。",
        args: ["YEAR", "GP", "SESS", "DRIVER"],
        example: `MAP GEAR ${CY} AUS Q VER`,
        category: "QUANTITATIVE TELEMETRY",
        category_cn: "量化遥测",
        supportsRaw: false,
    },

    // ── Strategy & Race Ops
    {
        command: "STRAT / STINT",
        description: "Tyre degradation modeler. Extracts clean laps (green flag, no pit in/out), fits linear regression per stint for degradation coefficient α (sec/lap). Scatter + trendline per compound.",
        description_cn: "轮胎衰减建模。提取干净圈速（绿旗、无进出站圈），按 stint 拟合线性回归计算衰减系数 α（秒/圈）。散点图+趋势线按配方分组。",
        args: ["YEAR", "GP", "SESS", "DRIVER"],
        example: `STINT ${CY} AUS R VER`,
        examples: [
            `STINT ${CY} AUS R VER`,
            `STINT ${CY} GBR R HAM`,
        ],
        category: "STRATEGY & RACE OPS",
        category_cn: "策略与赛事运营",
        supportsRaw: false,
        notes: "Sanitized via pick_wo_box() + pick_track_status('1') + pick_accurate(). Stints <3 laps skipped.",
        notes_cn: "通过 pick_wo_box() + pick_track_status('1') + pick_accurate() 清洗。少于3圈的 stint 被跳过。",
    },
    {
        command: "INSIGHT",
        description: "DeepSeek-Reasoner AI pipeline. Aggregates telemetry, sectors, speed traps, stint data into structured JSON, generates investment-bank-grade race engineering report.",
        description_cn: "DeepSeek-Reasoner AI 管道。将遥测、赛段、测速点、stint 数据聚合为结构化 JSON，生成投行级赛事工程研报。",
        args: ["YEAR", "GP", "SESS", "DRIVER_A", "DRIVER_B"],
        example: `INSIGHT ${CY} AUS Q VER LEC`,
        category: "STRATEGY & RACE OPS",
        category_cn: "策略与赛事运营",
        supportsRaw: false,
        notes: "Powered by DeepSeek-Reasoner. Reasoning chain is collapsible. 30-60s processing.",
        notes_cn: "由 DeepSeek-Reasoner 驱动。推理链可折叠。处理时间 30-60 秒。",
    },
    {
        command: "POS",
        description: "Race position tracker. Lap-by-lap position for all drivers, including grid overlay. Visualize overtakes, undercuts, and SC shuffles.",
        description_cn: "比赛位置追踪器。逐圈记录所有车手位置，含发车格位叠加。可视化超车、Undercut 和安全车重排。",
        args: ["YEAR", "GP", "[SESS]"],
        example: `POS ${CY} AUS R`,
        examples: [
            `POS ${CY} AUS R`,
            `POS ${CY} AUS S`,
        ],
        category: "STRATEGY & RACE OPS",
        category_cn: "策略与赛事运营",
        supportsRaw: false,
        notes: "SESS defaults to R (Race). Also works with S (Sprint).",
        notes_cn: "SESS 默认为 R（正赛）。也适用于 S（冲刺赛）。",
    },
    {
        command: "PITSTOP / PIT",
        description: "Pit stop strategy analysis. Stop durations, compound changes (e.g. MEDIUM→HARD), total pit time per driver. Undercut/overcut window analysis.",
        description_cn: "进站策略分析。停站时间、配方更换（如中性→硬胎）、每位车手总进站耗时。Undercut/Overcut 窗口分析。",
        args: ["YEAR", "GP", "[SESS]", "[DRIVER]"],
        example: `PITSTOP ${CY} AUS R`,
        examples: [
            `PITSTOP ${CY} AUS R`,
            `PIT ${CY} AUS R VER`,
        ],
        category: "STRATEGY & RACE OPS",
        category_cn: "策略与赛事运营",
        supportsRaw: false,
        notes: "Omit DRIVER for all drivers. SESS defaults to R. PIT is alias.",
        notes_cn: "省略 DRIVER 查看所有车手。SESS 默认为 R。PIT 为别名。",
    },

    // ── Standings & Results
    {
        command: "RES",
        description: "Session results table. Official classification: position, grid delta, Q1/Q2/Q3 times, race time, points, DNF status, team color accent.",
        description_cn: "赛段成绩表。官方分类结果：名次、起步位变化、Q1/Q2/Q3 成绩、比赛用时、积分、退赛状态、车队颜色标识。",
        args: ["YEAR", "GP", "SESS"],
        example: `RES ${CY} AUS Q`,
        examples: [
            `RES ${CY} AUS Q`,
            `RES ${CY} AUS R`,
            `RES ${CY} AUS FP1`,
        ],
        category: "STANDINGS & RESULTS",
        category_cn: "排名与成绩",
        supportsRaw: false,
        notes: "Works with ALL session types: FP1-FP3, Q, S, SS, SQ, R.",
        notes_cn: "适用于所有赛段类型：FP1-FP3、Q、S、SS、SQ、R。",
    },
    {
        command: "QUAL",
        description: "Qualifying breakdown. Splits Q1/Q2/Q3 segments. Best lap, compound, tyre life, elimination order per segment. Detects deleted laps.",
        description_cn: "排位赛详解。分割 Q1/Q2/Q3 阶段。每阶段最快圈、配方、轮胎寿命、淘汰顺序。检测被删除圈速。",
        args: ["YEAR", "GP"],
        example: `QUAL ${CY} AUS`,
        category: "STANDINGS & RESULTS",
        category_cn: "排名与成绩",
        supportsRaw: false,
        notes: "Session is always Q. For Sprint Qualifying use RES with SQ/SS.",
        notes_cn: "赛段固定为 Q。冲刺排位赛请使用 RES 配合 SQ/SS。",
    },
    {
        command: "WDC",
        description: "World Drivers' Championship standings. Position, points, wins, nationality for all drivers in a season.",
        description_cn: "车手世界冠军积分榜。赛季所有车手的名次、积分、获胜次数和国籍。",
        args: ["YEAR"],
        example: `WDC ${CY}`,
        examples: [
            `WDC ${CY}`,
            `WDC ${CY - 1}`,
        ],
        category: "STANDINGS & RESULTS",
        category_cn: "排名与成绩",
        supportsRaw: false,
        notes: "Historical data from 1950 onwards.",
        notes_cn: "历史数据可追溯至1950年。",
    },
    {
        command: "WCC",
        description: "World Constructors' Championship standings. Team position, total points, wins for all constructors in a season.",
        description_cn: "车队世界冠军积分榜。赛季所有车队的名次、总积分和获胜次数。",
        args: ["YEAR"],
        example: `WCC ${CY}`,
        category: "STANDINGS & RESULTS",
        category_cn: "排名与成绩",
        supportsRaw: false,
        notes: "WCC data from 1958 onwards.",
        notes_cn: "WCC 数据可追溯至1958年。",
    },

    // ── Data Tables
    {
        command: "LAPS",
        description: "Full lap-by-lap table. LapTime, S1/S2/S3, Compound, TyreLife, TrackStatus, Position, Speed Traps, Pit flags, Deleted status, PersonalBest markers.",
        description_cn: "完整逐圈数据表。圈速、S1/S2/S3、配方、胎龄、赛道状态、位置、测速点、进站标记、删除状态、个人最快标记。",
        args: ["YEAR", "GP", "SESS", "[DRIVER]"],
        example: `LAPS ${CY} AUS R VER`,
        examples: [
            `LAPS ${CY} AUS R VER`,
            `LAPS ${CY} AUS R`,
            `LAPS ${CY} AUS Q NOR`,
        ],
        category: "DATA TABLES",
        category_cn: "数据表",
        supportsRaw: true,
        notes: "Omit DRIVER for all. Supports all sessions. Includes IsAccurate flag.",
        notes_cn: "省略 DRIVER 查看全部车手。支持所有赛段类型。包含 IsAccurate 精度标志。",
    },
    {
        command: "SCHEDULE",
        description: "Full season calendar. Event round, GP name, country, location, format, all session dates in UTC.",
        description_cn: "完整赛季日历。赛事轮次、大奖赛名称、国家、地点、赛制、所有赛段的 UTC 时间。",
        args: [],
        example: "SCHEDULE",
        examples: ["SCHEDULE", "CAL"],
        category: "DATA TABLES",
        category_cn: "数据表",
        supportsRaw: true,
        notes: "Alias: CAL. Shows current year. Sprint weekends marked.",
        notes_cn: "别名：CAL。显示当前年份赛历。冲刺赛周末标注。",
    },

    // ── Race Analysis
    {
        command: "PACE",
        description: "Multi-driver race pace overlay. Compares stint degradation across 2-6 drivers with fuel-corrected TyreDegSlope, R² confidence, and compound tracking.",
        description_cn: "多车手比赛配速叠加。对比 2-6 位车手的 stint 衰减曲线，含油量修正的轮胎衰减斜率、R² 置信度和配方追踪。",
        args: ["YEAR", "GP", "SESS", "DRIVER1,DRIVER2,..."],
        example: `PACE ${CY} AUS R VER,NOR,LEC`,
        examples: [
            `PACE ${CY} AUS R VER,NOR,LEC`,
            `PACE ${CY} AUS FP2 VER,HAM,NOR,PIA`,
        ],
        category: "RACE ANALYSIS",
        category_cn: "赛事分析",
        supportsRaw: true,
        notes: "Drivers comma-separated (no spaces). Max 6. Each trendline includes R², slope, fuel correction.",
        notes_cn: "车手用逗号分隔（无空格）。最多6位。每条趋势线含 R²、斜率和油量修正。",
    },
    {
        command: "CIRCUIT",
        description: "Circuit metadata and corner map. Corner numbers, letters, XY positions, distances, angles, marshal lights/sectors, track rotation, circuit length.",
        description_cn: "赛道元数据和弯道地图。弯角编号、字母、XY 坐标、距离、角度、裁判灯/区域、赛道旋转角、赛道长度。",
        args: ["YEAR", "GP", "[SESS]"],
        example: `CIRCUIT ${CY} AUS`,
        examples: [
            `CIRCUIT ${CY} AUS`,
            `CIRCUIT ${CY} MON R`,
        ],
        category: "RACE ANALYSIS",
        category_cn: "赛事分析",
        supportsRaw: true,
        notes: "SESS defaults to R. Corner data includes Number, Letter (L/R), Distance (m), Angle (°).",
        notes_cn: "SESS 默认为 R。弯角数据含编号、字母（L/R）、距离（米）、角度（度）。",
    },

    // ── Paddock Analytics
    {
        command: "GAP",
        description: "Lap-by-lap cumulative time gap between two drivers. Tracks convergence/divergence, DRS range (<1s) laps, and undercut/overcut windows (18-28s gap).",
        description_cn: "逐圈累计时间差分析。追踪两位车手间距的收敛/发散，DRS 范围（<1秒）圈数，以及 Undercut/Overcut 窗口（18-28秒间距）。",
        args: ["YEAR", "GP", "SESS", "DRIVER_A", "DRIVER_B"],
        example: `GAP ${CY} AUS R VER NOR`,
        examples: [
            `GAP ${CY} AUS R VER NOR`,
            `GAP ${CY} GBR R HAM RUS`,
        ],
        category: "PADDOCK ANALYTICS",
        category_cn: "围场分析",
        supportsRaw: false,
        notes: "Positive gap = DRIVER_A behind DRIVER_B. Shows pit stop effects on gap evolution.",
        notes_cn: "正值 = DRIVER_A 落后 DRIVER_B。显示进站对间距演变的影响。",
    },
    {
        command: "TOPSPEED",
        description: "All-driver speed trap rankings across 4 measurement points: I1 (Intermediate 1), I2 (Intermediate 2), FL (Finish Line), ST (Speed Trap). Uses maximum speed across all laps.",
        description_cn: "全场车手4个测速点排名：I1（中间段1）、I2（中间段2）、FL（终点线）、ST（测速陷阱）。使用全部圈中最高速度。",
        args: ["YEAR", "GP", "[SESS]"],
        example: `TOPSPEED ${CY} AUS Q`,
        examples: [
            `TOPSPEED ${CY} AUS Q`,
            `TOPSPEED ${CY} MON R`,
        ],
        category: "PADDOCK ANALYTICS",
        category_cn: "围场分析",
        supportsRaw: false,
        notes: "SESS defaults to Q. High SpeedST delta indicates power unit advantage. ST vs FL delta reveals DRS effectiveness.",
        notes_cn: "SESS 默认为 Q。高 SpeedST 差值表明动力单元优势。ST 与 FL 差值反映 DRS 效果。",
    },
    {
        command: "TYRE",
        description: "Compound performance aggregation. Collects clean laps across all drivers, computes median pace, degradation slope (α), optimal stint length, and crossover points between compounds.",
        description_cn: "轮胎配方性能聚合分析。收集所有车手干净圈速，计算各配方中位速度、衰减斜率（α）、最优stint长度及配方交叉点。",
        args: ["YEAR", "GP", "[SESS]"],
        example: `TYRE ${CY} AUS R`,
        examples: [
            `TYRE ${CY} AUS R`,
            `TYRE ${CY} GBR FP2`,
        ],
        category: "PADDOCK ANALYTICS",
        category_cn: "围场分析",
        supportsRaw: false,
        notes: "SESS defaults to R. Crossover = lap where faster compound becomes slower than harder compound due to degradation.",
        notes_cn: "SESS 默认为 R。交叉点 = 由于衰减，较快配方开始慢于较硬配方的圈数。",
    },
    {
        command: "H2H",
        description: "Season-wide head-to-head teammate comparison. Qualifying win/loss record, average lap time delta, and race finishing position comparison across all GPs.",
        description_cn: "赛季队友对决分析。排位赛胜负记录、平均圈速差值、以及全赛季正赛名次对比。",
        args: ["YEAR", "DRIVER_A", "DRIVER_B"],
        example: `H2H ${CY} VER PER`,
        examples: [
            `H2H ${CY} VER PER`,
            `H2H ${CY} NOR PIA`,
        ],
        category: "PADDOCK ANALYTICS",
        category_cn: "围场分析",
        supportsRaw: false,
        notes: "Loads qualifying and race results for every GP in the season. May take 60-120s for full season analysis.",
        notes_cn: "加载赛季每站排位赛和正赛结果。完整赛季分析可能需要60-120秒。",
    },

    // ── Macro Environment
    {
        command: "WEATHER",
        description: "Meteorology timeline. Track/air temperature, humidity, pressure, wind speed/direction, and rainfall status from official F1 weather stations.",
        description_cn: "气象时间线。赛道/空气温度、湿度、气压、风速/风向和降雨状态。数据来自 F1 官方气象站。",
        args: ["YEAR", "GP", "SESS"],
        example: `WEATHER ${CY} AUS R`,
        examples: [
            `WEATHER ${CY} AUS R`,
            `WEATHER ${CY} GBR FP2`,
        ],
        category: "MACRO ENVIRONMENT",
        category_cn: "宏观环境",
        supportsRaw: true,
        notes: "Raw table format. Works with all session types.",
        notes_cn: "原始表格格式。适用于所有赛段类型。",
    },
    {
        command: "MSG",
        description: "FIA Race Control event log. Official messages: flags, penalties, track status changes, DRS zones, retirements, investigation notices.",
        description_cn: "FIA 赛事控制日志。官方消息：旗帜、处罚、赛道状态变更、DRS 区域、退赛、调查通知。",
        args: ["YEAR", "GP", "SESS"],
        example: `MSG ${CY} AUS R`,
        category: "MACRO ENVIRONMENT",
        category_cn: "宏观环境",
        supportsRaw: true,
        notes: "Raw table format. Essential for understanding race incidents.",
        notes_cn: "原始表格格式。对理解比赛事故至关重要。",
    },

    // ── System
    {
        command: "DRIVERS",
        description: "Session participant grid. All drivers entered in a session with abbreviation, car number, full name, team, and team color hex.",
        description_cn: "赛段参赛阵容。列出指定赛段的所有车手：缩写、车号、全名、车队和车队颜色代码。",
        args: ["YEAR", "GP", "SESS"],
        example: `DRIVERS ${CY} AUS Q`,
        category: "SYSTEM",
        category_cn: "系统",
        supportsRaw: false,
    },
    {
        command: "CLEAR / CLS / RESET",
        description: "Purge all active widgets. Clear persisted layout from localStorage. Workspace resets to blank.",
        description_cn: "清除所有活动面板，删除 localStorage 中持久化的布局，工作区重置为空白。",
        args: [],
        example: "CLEAR",
        category: "SYSTEM",
        category_cn: "系统",
        supportsRaw: false,
    },
    {
        command: "HELP / DOCS / ?",
        description: "Open this command reference matrix. Browse commands, session glossary, and GP/driver codes.",
        description_cn: "打开此命令参考矩阵。浏览命令、赛程术语表和大奖赛/车手代码。",
        args: [],
        example: "HELP",
        category: "SYSTEM",
        category_cn: "系统",
        supportsRaw: false,
    },
];
