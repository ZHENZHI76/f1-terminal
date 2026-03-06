export interface CommandDefinition {
    command: string;
    description: string;
    args: string[];
    example: string;
    examples?: string[];     // Multiple examples for discoverability
    category: string;
    supportsRaw: boolean;
    notes?: string;          // Additional usage notes
}

// ─── Session Type Glossary ──────────────────────────────────────────────────
export interface GlossaryEntry {
    abbr: string;
    full: string;
    description: string;
}

export const SESSION_GLOSSARY: GlossaryEntry[] = [
    { abbr: "FP1", full: "Free Practice 1", description: "First practice session. Teams validate setup choices, run aero rakes, and collect tyre data." },
    { abbr: "FP2", full: "Free Practice 2", description: "Second practice session. High-fuel race simulation runs and long-run pace analysis." },
    { abbr: "FP3", full: "Free Practice 3", description: "Third practice session (conventional weekends only). Final low-fuel qualifying preparation." },
    { abbr: "Q", full: "Qualifying", description: "Full qualifying session (Q1→Q2→Q3 knockout). Use the QUAL command for per-segment splits." },
    { abbr: "S", full: "Sprint Race", description: "Short-format race (~100km). Available on Sprint weekends only." },
    { abbr: "SS", full: "Sprint Shootout", description: "Sprint qualifying format (2023). Three knockout segments for Sprint grid positions." },
    { abbr: "SQ", full: "Sprint Qualifying", description: "Sprint qualifying format (2024+). Replaced Sprint Shootout designation." },
    { abbr: "R", full: "Race", description: "The main Grand Prix race. Full distance (~305km / 2 hours)." },
];

export const GP_GLOSSARY: GlossaryEntry[] = [
    { abbr: "BAH", full: "Bahrain", description: "Bahrain International Circuit, Sakhir" },
    { abbr: "SAU", full: "Saudi Arabia", description: "Jeddah Corniche Circuit" },
    { abbr: "AUS", full: "Australia", description: "Albert Park Circuit, Melbourne" },
    { abbr: "JPN", full: "Japan", description: "Suzuka International Racing Course" },
    { abbr: "CHN", full: "China", description: "Shanghai International Circuit" },
    { abbr: "MIA", full: "Miami", description: "Miami International Autodrome" },
    { abbr: "EMI", full: "Emilia Romagna", description: "Autodromo Enzo e Dino Ferrari, Imola" },
    { abbr: "MON", full: "Monaco", description: "Circuit de Monaco, Monte Carlo" },
    { abbr: "CAN", full: "Canada", description: "Circuit Gilles Villeneuve, Montreal" },
    { abbr: "ESP", full: "Spain", description: "Circuit de Barcelona-Catalunya" },
    { abbr: "AUT", full: "Austria", description: "Red Bull Ring, Spielberg" },
    { abbr: "GBR", full: "Great Britain", description: "Silverstone Circuit" },
    { abbr: "HUN", full: "Hungary", description: "Hungaroring, Budapest" },
    { abbr: "BEL", full: "Belgium", description: "Circuit de Spa-Francorchamps" },
    { abbr: "NED", full: "Netherlands", description: "Circuit Zandvoort" },
    { abbr: "ITA", full: "Italy", description: "Autodromo Nazionale Monza" },
    { abbr: "AZE", full: "Azerbaijan", description: "Baku City Circuit" },
    { abbr: "SGP", full: "Singapore", description: "Marina Bay Street Circuit" },
    { abbr: "USA", full: "United States", description: "Circuit of the Americas, Austin" },
    { abbr: "MEX", full: "Mexico", description: "Autódromo Hermanos Rodríguez" },
    { abbr: "BRA", full: "Brazil / São Paulo", description: "Autódromo José Carlos Pace, Interlagos" },
    { abbr: "LAS", full: "Las Vegas", description: "Las Vegas Strip Circuit" },
    { abbr: "QAT", full: "Qatar", description: "Lusail International Circuit" },
    { abbr: "ABU", full: "Abu Dhabi", description: "Yas Marina Circuit" },
];

export const DRIVER_GLOSSARY: GlossaryEntry[] = [
    { abbr: "VER", full: "Max Verstappen", description: "Red Bull Racing" },
    { abbr: "NOR", full: "Lando Norris", description: "McLaren" },
    { abbr: "LEC", full: "Charles Leclerc", description: "Ferrari" },
    { abbr: "PIA", full: "Oscar Piastri", description: "McLaren" },
    { abbr: "SAI", full: "Carlos Sainz", description: "Williams" },
    { abbr: "HAM", full: "Lewis Hamilton", description: "Ferrari" },
    { abbr: "RUS", full: "George Russell", description: "Mercedes" },
    { abbr: "PER", full: "Sergio Pérez", description: "Red Bull Racing" },
    { abbr: "ALO", full: "Fernando Alonso", description: "Aston Martin" },
    { abbr: "STR", full: "Lance Stroll", description: "Aston Martin" },
    { abbr: "GAS", full: "Pierre Gasly", description: "Alpine" },
    { abbr: "OCO", full: "Esteban Ocon", description: "Haas" },
    { abbr: "TSU", full: "Yuki Tsunoda", description: "RB (VCARB)" },
    { abbr: "HUL", full: "Nico Hülkenberg", description: "Stake/Sauber" },
    { abbr: "MAG", full: "Kevin Magnussen", description: "Haas" },
    { abbr: "ALB", full: "Alexander Albon", description: "Williams" },
    { abbr: "BEA", full: "Oliver Bearman", description: "Haas" },
    { abbr: "LAW", full: "Liam Lawson", description: "RB (VCARB)" },
    { abbr: "ANT", full: "Andrea Kimi Antonelli", description: "Mercedes" },
    { abbr: "DOO", full: "Jack Doohan", description: "Alpine" },
];

export const SYSTEM_GLOSSARY: GlossaryEntry[] = [
    { abbr: "YEAR", full: "Season Year", description: "4-digit season year, e.g. 2024, 2023. FastF1 supports 2018 onwards for telemetry." },
    { abbr: "GP", full: "Grand Prix", description: "Grand Prix identifier. Use 3-letter country code (BAH, MON, GBR) or full name (Bahrain, Monaco)." },
    { abbr: "SESS", full: "Session Type", description: "Session identifier: FP1, FP2, FP3, Q, S, SS, SQ, R. See Session Reference tab for details." },
    { abbr: "DRIVER", full: "Driver Code", description: "3-letter driver abbreviation: VER, HAM, NOR, LEC, etc. See Driver Reference tab for full list." },
    { abbr: "-R / --RAW", full: "Raw Data Mode", description: "Append this flag to output raw tabular data instead of the default chart visualization." },
];

// ─── Command Definitions ────────────────────────────────────────────────────
export const COMMAND_REGISTRY: CommandDefinition[] = [
    {
        command: "TEL",
        description: "High-frequency telemetry comparator. Overlays Speed, Throttle, Brake, RPM, nGear, DRS traces on distance-aligned axes. Computes ΔT (delta time) between two drivers. Works with any session type.",
        args: ["YEAR", "GP", "SESS", "DRIVER_A", "[DRIVER_B]"],
        example: "TEL 2024 BAH Q VER LEC",
        examples: [
            "TEL 2024 BAH Q VER LEC",
            "TEL 2024 BAH FP1 NOR",
            "TEL 2024 BAH R HAM VER",
        ],
        category: "QUANTITATIVE TELEMETRY",
        supportsRaw: true,
        notes: "SESS accepts FP1/FP2/FP3/Q/S/SS/SQ/R. Omit DRIVER_B for single-driver mode. Use -R flag for raw data table.",
    },
    {
        command: "SEC",
        description: "Sector time comparator. Extracts Sector 1/2/3 split times and 4 speed traps (Intermediate 1, Intermediate 2, Finish Line, Longest Straight) from fastest laps. Computes per-sector delta and advantage labels.",
        args: ["YEAR", "GP", "SESS", "DRIVER_A", "DRIVER_B"],
        example: "SEC 2024 BAH Q VER LEC",
        examples: [
            "SEC 2024 BAH Q VER LEC",
            "SEC 2024 MON FP2 NOR PIA",
        ],
        category: "QUANTITATIVE TELEMETRY",
        supportsRaw: false,
        notes: "Deltas: negative = DRIVER_A faster (green). Includes tyre compound and tyre life context.",
    },
    {
        command: "DOM",
        description: "Mini-sector dominance map. Divides the track into 25 equidistant micro-sectors, computes average speed per sector for each driver, then colors the geo-spatial XY track map by sector ownership.",
        args: ["YEAR", "GP", "SESS", "DRIVER_A", "DRIVER_B"],
        example: "DOM 2024 BAH R VER PER",
        category: "QUANTITATIVE TELEMETRY",
        supportsRaw: false,
    },
    {
        command: "MAP SPD",
        description: "Geo-spatial velocity cartography. Plots the full track trajectory from XY telemetry, color-coded by continuous speed values (blue→red gradient). Useful for identifying braking zones and apex speeds.",
        args: ["YEAR", "GP", "SESS", "DRIVER"],
        example: "MAP SPD 2024 BAH Q VER",
        examples: [
            "MAP SPD 2024 BAH Q VER",
            "MAP SPD 2024 MON FP3 LEC",
        ],
        category: "QUANTITATIVE TELEMETRY",
        supportsRaw: false,
    },
    {
        command: "MAP GEAR",
        description: "Discrete transmission mapping. Colors XY track coordinates by the active gear (nGear 1-8). Reveals gear selection patterns, downshift points, and traction zones.",
        args: ["YEAR", "GP", "SESS", "DRIVER"],
        example: "MAP GEAR 2024 BAH Q VER",
        category: "QUANTITATIVE TELEMETRY",
        supportsRaw: false,
    },

    // ── Strategy & Race Ops ─────────────────────────────────────────────
    {
        command: "STRAT / STINT",
        description: "Tyre degradation modeler. Extracts clean racing laps (green flag, no in/out laps via pick_wo_box), fits linear regression per stint to compute degradation coefficient α (seconds/lap). Scatter plot + trendline per compound.",
        args: ["YEAR", "GP", "SESS", "DRIVER"],
        example: "STINT 2024 BAH R VER",
        examples: [
            "STINT 2024 BAH R VER",
            "STINT 2024 GBR R HAM",
        ],
        category: "STRATEGY & RACE OPS",
        supportsRaw: false,
        notes: "Data is sanitized via pick_wo_box() + pick_track_status('1') + pick_accurate(). Stints with <3 laps are skipped.",
    },
    {
        command: "INSIGHT",
        description: "DeepSeek-Reasoner AI pipeline. Aggregates telemetry, sector times, speed traps, and stint data into a structured JSON summary, then generates an investment-bank-grade race engineering report with chain-of-thought reasoning.",
        args: ["YEAR", "GP", "SESS", "DRIVER_A", "DRIVER_B"],
        example: "INSIGHT 2024 BAH Q VER LEC",
        category: "STRATEGY & RACE OPS",
        supportsRaw: false,
        notes: "Powered by DeepSeek-Reasoner. Reasoning chain is collapsible. Processing may take 30-60 seconds.",
    },
    {
        command: "POS",
        description: "Race position tracker. Extracts lap-by-lap Position data for all drivers in a race session. Includes starting grid overlay. Essential for visualizing overtakes, undercuts, and safety car shuffles.",
        args: ["YEAR", "GP", "[SESS]"],
        example: "POS 2024 BAH R",
        examples: [
            "POS 2024 BAH R",
            "POS 2024 BAH S",
        ],
        category: "STRATEGY & RACE OPS",
        supportsRaw: false,
        notes: "SESS defaults to R (Race). Also works with S (Sprint).",
    },
    {
        command: "PITSTOP / PIT",
        description: "Pit stop strategy analysis. Computes stop durations from PitInTime→PitOutTime, tracks compound changes (e.g. MEDIUM→HARD), and summarizes total pit time per driver. Useful for undercut/overcut window analysis.",
        args: ["YEAR", "GP", "[SESS]", "[DRIVER]"],
        example: "PITSTOP 2024 BAH R",
        examples: [
            "PITSTOP 2024 BAH R",
            "PIT 2024 BAH R VER",
            "PITSTOP 2024 BAH S",
        ],
        category: "STRATEGY & RACE OPS",
        supportsRaw: false,
        notes: "Omit DRIVER to see all drivers. SESS defaults to R. PIT is an alias for PITSTOP.",
    },

    // ── Standings & Results ─────────────────────────────────────────────
    {
        command: "RES",
        description: "Session results table. Extracts official classification: finishing position, grid position (delta arrows), Q1/Q2/Q3 times (qualifying), race time, points, DNF status, team name, and team color accent.",
        args: ["YEAR", "GP", "SESS"],
        example: "RES 2024 BAH Q",
        examples: [
            "RES 2024 BAH Q",
            "RES 2024 BAH R",
            "RES 2024 BAH FP1",
            "RES 2024 BAH S",
        ],
        category: "STANDINGS & RESULTS",
        supportsRaw: false,
        notes: "Works with ALL session types: FP1-FP3, Q, S, SS, SQ, R. Qualifying results include Q1/Q2/Q3 columns.",
    },
    {
        command: "QUAL",
        description: "Qualifying breakdown. Uses FastF1 split_qualifying_sessions() to separate Q1, Q2, and Q3 segments. Shows best lap time, compound, tyre life, and elimination order per segment. Detects deleted laps.",
        args: ["YEAR", "GP"],
        example: "QUAL 2024 BAH",
        category: "STANDINGS & RESULTS",
        supportsRaw: false,
        notes: "Session is always Q (automatically set). For Sprint Qualifying use RES with SQ/SS.",
    },
    {
        command: "WDC",
        description: "World Drivers' Championship standings from the Ergast/Jolpica historical API. Shows classified position, total points, wins, and nationality for all drivers in a season.",
        args: ["YEAR"],
        example: "WDC 2024",
        examples: [
            "WDC 2024",
            "WDC 2023",
        ],
        category: "STANDINGS & RESULTS",
        supportsRaw: false,
        notes: "Historical data available from 1950 onwards.",
    },
    {
        command: "WCC",
        description: "World Constructors' Championship standings from the Ergast/Jolpica historical API. Team position, total points, and wins for all constructors in a season.",
        args: ["YEAR"],
        example: "WCC 2024",
        category: "STANDINGS & RESULTS",
        supportsRaw: false,
        notes: "WCC data available from 1958 onwards.",
    },

    // ── Data Tables ──────────────────────────────────────────────────────
    {
        command: "LAPS",
        description: "Full lap-by-lap table for a session. Shows LapTime, S1/S2/S3, Compound, TyreLife, TrackStatus, Position, Speed Traps, PitIn/Out flags, Deleted status, and PersonalBest markers. Optionally filter by a single driver.",
        args: ["YEAR", "GP", "SESS", "[DRIVER]"],
        example: "LAPS 2024 BAH R VER",
        examples: [
            "LAPS 2024 BAH R VER",
            "LAPS 2024 BAH R",
            "LAPS 2024 BAH Q NOR",
            "LAPS 2024 BAH FP2 HAM",
        ],
        category: "DATA TABLES",
        supportsRaw: true,
        notes: "Omit DRIVER to see all drivers. Supports all session types: FP1/FP2/FP3/Q/S/SQ/R. Includes IsAccurate flag for timing validation.",
    },
    {
        command: "SCHEDULE",
        description: "Full season calendar. Shows every event round, Grand Prix name, country, location, format (conventional/sprint/testing), and all session dates in UTC.",
        args: [],
        example: "SCHEDULE",
        examples: [
            "SCHEDULE",
            "CAL",
        ],
        category: "DATA TABLES",
        supportsRaw: true,
        notes: "Alias: CAL. Shows current year schedule automatically. Sprint weekends are marked.",
    },

    // ── Race Analysis ───────────────────────────────────────────────────
    {
        command: "PACE",
        description: "Multi-driver race pace overlay. Compares stint degradation curves across 2-6 drivers with fuel-corrected tyre degradation slopes (TyreDegSlope), R² confidence, and compound tracking. Essential for FP2 race sim analysis and post-race debrief.",
        args: ["YEAR", "GP", "SESS", "DRIVER1,DRIVER2,..."],
        example: "PACE 2024 BAH R VER,NOR,LEC",
        examples: [
            "PACE 2024 BAH R VER,NOR,LEC",
            "PACE 2024 BAH FP2 VER,HAM,NOR,PIA",
            "PACE 2024 GBR R HAM,RUS",
        ],
        category: "RACE ANALYSIS",
        supportsRaw: true,
        notes: "Drivers are comma-separated (no spaces). Max 6 drivers. Each driver's trendline includes R², slope, and fuel correction.",
    },
    {
        command: "CIRCUIT",
        description: "Circuit metadata and corner map. Extracts corner numbers, letters, XY positions, distances, angles, marshal lights, marshal sectors, track rotation, and circuit length from FastF1 CircuitInfo.",
        args: ["YEAR", "GP", "[SESS]"],
        example: "CIRCUIT 2024 BAH",
        examples: [
            "CIRCUIT 2024 BAH",
            "CIRCUIT 2024 MON R",
            "CIRCUIT 2024 SPA Q",
        ],
        category: "RACE ANALYSIS",
        supportsRaw: true,
        notes: "SESS defaults to R. Corner data includes Number, Letter (L/R), Distance (m), and Angle (°). Used to annotate TEL and MAP overlays.",
    },

    // ── Macro Environment ───────────────────────────────────────────────
    {
        command: "WEATHER",
        description: "Meteorology timeline. Outputs chronological track temperature, air temperature, humidity, pressure, wind speed/direction, and rainfall status. Sourced from official F1 weather stations.",
        args: ["YEAR", "GP", "SESS"],
        example: "WEATHER 2024 BAH R",
        examples: [
            "WEATHER 2024 BAH R",
            "WEATHER 2024 GBR FP2",
        ],
        category: "MACRO ENVIRONMENT",
        supportsRaw: true,
        notes: "Always rendered in raw table format. Works with all session types.",
    },
    {
        command: "MSG",
        description: "FIA Race Control event log. Extracts all official messages: flags (yellow/red/VSC/SC), penalties, track status changes, DRS zones, car retirements, and investigation notices.",
        args: ["YEAR", "GP", "SESS"],
        example: "MSG 2024 BAH R",
        category: "MACRO ENVIRONMENT",
        supportsRaw: true,
        notes: "Always rendered in raw table format. Essential for understanding race incidents timeline.",
    },

    // ── System ──────────────────────────────────────────────────────────
    {
        command: "DRIVERS",
        description: "Session participant grid. Lists all drivers entered in a specific session with 3-letter abbreviation, car number, full name, team name, and team color hex code. Use this to discover valid driver codes.",
        args: ["YEAR", "GP", "SESS"],
        example: "DRIVERS 2024 BAH Q",
        category: "SYSTEM",
        supportsRaw: false,
    },
    {
        command: "CLEAR / CLS / RESET",
        description: "Purge all active widgets from the workspace and clear the persisted layout from localStorage. The workspace resets to a blank state.",
        args: [],
        example: "CLEAR",
        category: "SYSTEM",
        supportsRaw: false,
    },
    {
        command: "HELP / DOCS / ?",
        description: "Open this command reference matrix. Browse all available commands, session glossary, and GP/driver code reference tables.",
        args: [],
        example: "HELP",
        category: "SYSTEM",
        supportsRaw: false,
    },
];
