export interface CommandDefinition {
    command: string;
    description: string;
    args: string[];
    example: string;
    category: string;
    supportsRaw: boolean;
}

export const COMMAND_REGISTRY: CommandDefinition[] = [
    {
        command: "TEL",
        description: "High-frequency telemetry comparator. Computes Delta $\Delta T$, 3D G-Forces (Lon, Lat, Vert), and component maps.",
        args: ["YEAR", "GP", "SESS", "DRIVER_A", "[DRIVER_B]"],
        example: "TEL 2024 BAH Q VER LEC",
        category: "QUANTITATIVE TELEMETRY",
        supportsRaw: true,
    },
    {
        command: "DOM",
        description: "Mini-Sector Dominance Maps. Generates spatial ownership scatter plots segmented into 25 distance grids.",
        args: ["YEAR", "GP", "SESS", "DRIVER_A", "DRIVER_B"],
        example: "DOM 2024 BAH R VER PER",
        category: "QUANTITATIVE TELEMETRY",
        supportsRaw: false,
    },
    {
        command: "STRAT / STINT",
        description: "Tyre Degradation Modeling. Calculates pace decay co-efficients ($\alpha$) using linear regression over fuel-adjusted stint windows.",
        args: ["YEAR", "GP", "SESS", "DRIVER"],
        example: "STINT 2024 BAH R VER",
        category: "STRATEGY & RACE OPS",
        supportsRaw: false,
    },
    {
        command: "MAP SPD",
        description: "Geo-spatial velocity cartography. Plots continuous track trajectories bounded by velocity gradients.",
        args: ["YEAR", "GP", "SESS", "DRIVER"],
        example: "MAP SPD 2024 BAH Q VER",
        category: "QUANTITATIVE TELEMETRY",
        supportsRaw: false,
    },
    {
        command: "MAP GEAR",
        description: "Discrete transmission mapping. Colors tracking coordinates by active nominal nGear states.",
        args: ["YEAR", "GP", "SESS", "DRIVER"],
        example: "MAP GEAR 2024 BAH Q VER",
        category: "QUANTITATIVE TELEMETRY",
        supportsRaw: false,
    },
    {
        command: "WEATHER",
        description: "Native meteorology logs. Outputs chronological track-temp, air-temp, and humidity vectors.",
        args: ["YEAR", "GP", "SESS"],
        example: "WEATHER 2024 BAH R",
        category: "MACRO ENVIRONMENT",
        supportsRaw: true,
    },
    {
        command: "MSG",
        description: "FIA Race Control Event Logs. Extracts raw marshal sector flags, penalties, and track status deltas.",
        args: ["YEAR", "GP", "SESS"],
        example: "MSG 2024 BAH R",
        category: "MACRO ENVIRONMENT",
        supportsRaw: true,
    },
    {
        command: "INSIGHT",
        description: "DeepSeek V3 API pipeline. Synthesizes underlying telemetry JSONs into cohesive Wall Street grade race engineering reports.",
        args: ["YEAR", "GP", "SESS", "DRIVER_A", "DRIVER_B"],
        example: "INSIGHT 2024 BAH Q VER LEC",
        category: "STRATEGY & RACE OPS",
        supportsRaw: false,
    }
];
