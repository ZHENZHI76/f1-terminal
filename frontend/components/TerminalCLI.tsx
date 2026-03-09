"use client";

import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { Terminal } from "lucide-react";
import { useTerminalStore, WidgetType } from "@/store/terminalStore";
import CommandReferenceModal from "./CommandReferenceModal";
import { COMMAND_REGISTRY } from "@/config/commands";

// ─── Autocomplete Data ──────────────────────────────────────────────────────
const COMMANDS = COMMAND_REGISTRY.map(c => c.command.split(' / ')[0].split(' ')[0]).filter((v, i, a) => a.indexOf(v) === i);
const ALL_COMMANDS = [...COMMANDS, "MAP SPD", "MAP GEAR", "HELP", "DOCS", "?", "CLEAR", "CLS", "RESET"];

const SESSION_CODES = ["FP1", "FP2", "FP3", "Q", "R", "S", "SQ", "SS"];

const GP_CODES = [
    "BAH", "SAU", "AUS", "JPN", "CHN", "MIA", "EMI", "MON", "CAN", "ESP",
    "AUT", "GBR", "HUN", "BEL", "NED", "ITA", "AZE", "SGP", "USA", "MEX",
    "BRA", "LAS", "QAT", "ABU",
];

const DRIVER_CODES = [
    "VER", "NOR", "LEC", "PIA", "SAI", "HAM", "RUS", "PER", "ALO", "STR",
    "GAS", "OCO", "TSU", "HUL", "MAG", "ALB", "BEA", "LAW", "ANT", "DOO",
    "HAD", "BOR", "COL", "DRU",
];

// Commands that accept multi-driver (comma-separated)
const MULTI_DRIVER_CMDS = ["TEL", "PACE", "TELEMETRY"];
const YEAR_PATTERN = /^20\d{2}$/;

// Determine what to suggest based on current token position
type SuggestionType = 'command' | 'year' | 'gp' | 'session' | 'driver' | 'flag' | 'none';

function getTokenContext(tokens: string[], cmd: string): SuggestionType {
    // No tokens yet → suggest command
    if (tokens.length === 0) return 'command';
    if (tokens.length === 1 && !cmd) return 'command';

    const resolved = cmd.toUpperCase();

    // MAP is a 2-token command
    if (resolved === 'MAP') {
        if (tokens.length <= 2) return 'command'; // "MAP" → suggest "SPD" or "GEAR"
        if (tokens.length === 3) return 'year';
        if (tokens.length === 4) return 'gp';
        if (tokens.length === 5) return 'session';
        return 'driver';
    }

    // System commands with no args
    if (['HELP', 'DOCS', '?', 'CLEAR', 'CLS', 'RESET'].includes(resolved)) return 'none';

    // Most commands: CMD YEAR GP SESS DRIVER...
    if (['SCHEDULE', 'CAL'].includes(resolved)) return 'none';
    if (['WDC', 'WCC'].includes(resolved)) {
        return tokens.length <= 2 ? 'year' : 'none';
    }
    if (['QUAL'].includes(resolved)) {
        if (tokens.length <= 2) return 'year';
        if (tokens.length === 3) return 'gp';
        return 'none';
    }

    // Standard: CMD YEAR GP SESS [DRIVER...]
    if (tokens.length <= 2) return 'year';
    if (tokens.length === 3) return 'gp';
    if (tokens.length === 4) return 'session';
    return 'driver';
}

function getSuggestions(inputValue: string): string[] {
    const upper = inputValue.toUpperCase().trimStart();
    const tokens = upper.split(/\s+/);
    const currentToken = tokens[tokens.length - 1] || '';
    const cmd = tokens[0] || '';
    const ctx = getTokenContext(tokens, cmd);

    // If we're typing a comma-separated list (multi-driver)
    if (ctx === 'driver' && currentToken.includes(',')) {
        const parts = currentToken.split(',');
        const lastPart = parts[parts.length - 1];
        const prefix = parts.slice(0, -1).join(',') + ',';
        const usedDrivers = parts.slice(0, -1).map(d => d.trim().toUpperCase());
        return DRIVER_CODES
            .filter(d => !usedDrivers.includes(d) && d.startsWith(lastPart))
            .slice(0, 8)
            .map(d => prefix + d);
    }

    switch (ctx) {
        case 'command':
            if (!currentToken) return ALL_COMMANDS.slice(0, 10);
            // If user typed "MAP", show subcommands
            if (currentToken === 'MAP' && tokens.length === 1) return ["MAP SPD", "MAP GEAR"];
            return ALL_COMMANDS.filter(c => c.startsWith(currentToken)).slice(0, 10);
        case 'year': {
            const cy = new Date().getFullYear();
            const years = [cy, cy - 1, cy - 2, cy - 3].map(String);
            return years.filter(y => y.startsWith(currentToken)).slice(0, 5);
        }
        case 'gp':
            if (!currentToken) return GP_CODES.slice(0, 10);
            return GP_CODES.filter(g => g.startsWith(currentToken)).slice(0, 10);
        case 'session':
            if (!currentToken) return SESSION_CODES;
            return SESSION_CODES.filter(s => s.startsWith(currentToken));
        case 'driver':
            if (!currentToken) return DRIVER_CODES.slice(0, 10);
            return DRIVER_CODES.filter(d => d.startsWith(currentToken)).slice(0, 10);
        case 'flag':
            return ['-R'];
        default:
            return [];
    }
}

export default function TerminalCLI() {
    const [input, setInput] = useState("");
    const [isDocsOpen, setIsDocsOpen] = useState(false);
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [selectedIdx, setSelectedIdx] = useState(-1);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const suggestionsRef = useRef<HTMLDivElement>(null);
    const addWidget = useTerminalStore((state) => state.addWidget);

    // Auto-focus
    useEffect(() => {
        inputRef.current?.focus();
        const handleKeyDown = (e: KeyboardEvent) => {
            // Don't steal focus when docs modal is open
            if (!isDocsOpen) inputRef.current?.focus();
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isDocsOpen]);

    // Compute suggestions on input change
    useEffect(() => {
        if (!input.trim()) {
            setSuggestions([]);
            setShowSuggestions(false);
            return;
        }
        const sugs = getSuggestions(input);
        setSuggestions(sugs);
        setSelectedIdx(-1);
        setShowSuggestions(sugs.length > 0);
    }, [input]);

    // Get context hint text
    const contextHint = useMemo(() => {
        const upper = input.toUpperCase().trimStart();
        const tokens = upper.split(/\s+/);
        const cmd = tokens[0] || '';
        const ctx = getTokenContext(tokens, cmd);
        const hints: Record<string, string> = {
            command: 'COMMAND',
            year: 'YEAR',
            gp: 'GP CODE',
            session: 'SESSION',
            driver: MULTI_DRIVER_CMDS.includes(cmd) ? 'DRIVER(S) — comma-separated' : 'DRIVER',
            flag: 'FLAG',
            none: '',
        };
        return hints[ctx] || '';
    }, [input]);

    const applySuggestion = useCallback((suggestion: string) => {
        const upper = input.toUpperCase().trimStart();
        const tokens = upper.split(/\s+/);
        const currentToken = tokens[tokens.length - 1] || '';
        const cmd = tokens[0] || '';
        const ctx = getTokenContext(tokens, cmd);

        // For comma-separated drivers, replace only the last comma segment
        if (ctx === 'driver' && currentToken.includes(',')) {
            const prefix = input.slice(0, input.length - currentToken.length);
            setInput(prefix + suggestion + ' ');
        }
        // For commands, replace the entire input if it's the first token
        else if (ctx === 'command') {
            setInput(suggestion + ' ');
        }
        // For everything else, replace the last token
        else {
            const prefix = input.slice(0, input.length - currentToken.length);
            setInput(prefix + suggestion + ' ');
        }

        setShowSuggestions(false);
        setSelectedIdx(-1);
        inputRef.current?.focus();
    }, [input]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        // TAB completion
        if (e.key === 'Tab') {
            e.preventDefault();
            if (suggestions.length > 0) {
                const idx = selectedIdx >= 0 ? selectedIdx : 0;
                applySuggestion(suggestions[idx]);
            }
            return;
        }

        // Arrow navigation in suggestions
        if (e.key === 'ArrowDown' && showSuggestions) {
            e.preventDefault();
            setSelectedIdx(prev => Math.min(prev + 1, suggestions.length - 1));
            return;
        }
        if (e.key === 'ArrowUp' && showSuggestions) {
            e.preventDefault();
            setSelectedIdx(prev => Math.max(prev - 1, -1));
            return;
        }

        // Escape closes suggestions
        if (e.key === 'Escape') {
            setShowSuggestions(false);
            setSelectedIdx(-1);
            return;
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setShowSuggestions(false);

        const trimmed = input.trim().toUpperCase();
        if (!trimmed) return;

        if (['HELP', 'DOCS', '?'].includes(trimmed)) {
            setIsDocsOpen(true);
            setInput("");
            return;
        }

        if (['CLEAR', 'CLS', 'RESET'].includes(trimmed)) {
            useTerminalStore.getState().clearAll();
            setInput("");
            return;
        }

        const originalParts = trimmed.split(/\s+/);
        const hasRawFlag = originalParts.includes('-R') || originalParts.includes('--RAW');
        const parts = originalParts.filter(p => p !== '-R' && p !== '--RAW');
        const cmd = parts[0];

        const viewMode = hasRawFlag ? 'raw' : 'chart';

        try {
            if (cmd === "TEL" || cmd === "TELEMETRY") {
                // TEL 2026 AUS Q VER NOR — or — TEL 2026 AUS Q VER,NOR,LEC,HAM
                const args = parts.slice(1);
                addWidget('TEL', args, { x: 0, y: 0, w: 8, h: 12, minW: 3, minH: 4 }, viewMode);
            }
            else if (cmd === "MAP" && parts[1] === "SPD") {
                const args = parts.slice(2);
                addWidget('MAP_SPD', args, { x: 8, y: 0, w: 4, h: 12, minW: 2, minH: 4 }, viewMode);
            }
            else if (cmd === "MAP" && parts[1] === "GEAR") {
                const args = parts.slice(2);
                addWidget('MAP_GEAR', args, { x: 8, y: 0, w: 4, h: 12, minW: 2, minH: 4 }, viewMode);
            }
            else if (cmd === "STINT" || cmd === "STRAT") {
                const args = parts.slice(1);
                addWidget('STINT', args, { x: 0, y: 0, w: 8, h: 10, minW: 3, minH: 3 }, viewMode);
            }
            else if (cmd === "DOM") {
                const args = parts.slice(1);
                addWidget('DOM', args, { x: 0, y: 0, w: 6, h: 12, minW: 3, minH: 4 }, viewMode);
            }
            else if (cmd === "INSIGHT") {
                const args = parts.slice(1);
                addWidget('INSIGHT', args, { x: 0, y: 0, w: 6, h: 14, minW: 3, minH: 4 }, viewMode);
            }
            else if (cmd === "WEATHER") {
                const args = parts.slice(1);
                addWidget('WEATHER', args, { x: 0, y: 0, w: 6, h: 10, minW: 2, minH: 3 }, 'raw');
            }
            else if (cmd === "MSG") {
                const args = parts.slice(1);
                addWidget('MSG', args, { x: 6, y: 0, w: 6, h: 10, minW: 2, minH: 3 }, 'raw');
            }
            else if (cmd === "RES") {
                const args = parts.slice(1);
                addWidget('RES', args, { x: 0, y: 0, w: 12, h: 12, minW: 4, minH: 4 }, 'raw');
            }
            else if (cmd === "SEC") {
                const args = parts.slice(1);
                addWidget('SEC', args, { x: 0, y: 0, w: 6, h: 10, minW: 3, minH: 4 }, viewMode);
            }
            else if (cmd === "DRIVERS") {
                const args = parts.slice(1);
                addWidget('DRIVERS', args, { x: 0, y: 0, w: 6, h: 10, minW: 2, minH: 3 }, 'raw');
            }
            else if (cmd === "QUAL") {
                const args = parts.slice(1);
                addWidget('QUAL', args, { x: 0, y: 0, w: 12, h: 14, minW: 4, minH: 5 }, 'raw');
            }
            else if (cmd === "POS") {
                const args = parts.slice(1);
                addWidget('POS', args, { x: 0, y: 0, w: 12, h: 12, minW: 4, minH: 4 }, 'raw');
            }
            else if (cmd === "PITSTOP" || cmd === "PIT") {
                const args = parts.slice(1);
                addWidget('PITSTOP', args, { x: 0, y: 0, w: 8, h: 10, minW: 3, minH: 4 }, 'raw');
            }
            else if (cmd === "WDC") {
                const args = parts.slice(1);
                addWidget('WDC', args, { x: 0, y: 0, w: 8, h: 12, minW: 3, minH: 4 }, 'raw');
            }
            else if (cmd === "WCC") {
                const args = parts.slice(1);
                addWidget('WCC', args, { x: 0, y: 0, w: 8, h: 10, minW: 3, minH: 4 }, 'raw');
            }
            else if (cmd === "LAPS") {
                const args = parts.slice(1);
                addWidget('LAPS', args, { x: 0, y: 0, w: 12, h: 14, minW: 4, minH: 5 }, 'raw');
            }
            else if (cmd === "SCHEDULE" || cmd === "CAL") {
                const args = parts.slice(1);
                addWidget('SCHEDULE', args, { x: 0, y: 0, w: 10, h: 12, minW: 4, minH: 4 }, 'raw');
            }
            else if (cmd === "PACE") {
                const args = parts.slice(1);
                addWidget('PACE', args, { x: 0, y: 0, w: 12, h: 12, minW: 6, minH: 5 }, 'raw');
            }
            else if (cmd === "CIRCUIT") {
                const args = parts.slice(1);
                addWidget('CIRCUIT', args, { x: 0, y: 0, w: 8, h: 10, minW: 3, minH: 4 }, 'raw');
            }
            else {
                console.warn(`[TERMINAL] Unknown command: ${cmd}`);
            }
        } catch (e) {
            console.error("Command parsing failed:", e);
        }

        setInput("");
    };

    return (
        <div className="flex flex-col flex-none w-full sticky top-0 z-50">
            <div className="w-full bg-[#141414] border-b border-[#2a2a2a] p-2 md:p-3 flex items-center relative">
                <Terminal className="text-[#ff6600] w-4 h-4 md:w-5 md:h-5 mr-3 flex-shrink-0" />
                <span className="text-[#ff6600] font-mono mr-2 text-sm md:text-base font-bold">F1&gt;</span>
                <form onSubmit={handleSubmit} className="flex-1 flex relative">
                    <input
                        ref={inputRef}
                        type="text"
                        className="flex-1 bg-transparent text-[#e0e0e0] font-mono text-sm md:text-base uppercase outline-none placeholder-[#444] tracking-wider truncate"
                        placeholder="TYPE 'HELP' FOR COMMAND REFERENCE..."
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        spellCheck={false}
                        autoComplete="off"
                    />
                    {/* Context hint badge */}
                    {contextHint && input.trim() && (
                        <span className="absolute right-0 top-1/2 -translate-y-1/2 text-[9px] text-[#555] bg-[#1a1a1a] border border-[#333] px-1.5 py-0.5 font-mono tracking-wider">
                            {contextHint} ↹
                        </span>
                    )}
                </form>

                {/* Autocomplete Dropdown */}
                {showSuggestions && suggestions.length > 0 && (
                    <div
                        ref={suggestionsRef}
                        className="absolute left-0 right-0 top-full bg-[#141414] border border-[#333] border-t-0 shadow-lg z-[60] max-h-[200px] overflow-y-auto"
                    >
                        {suggestions.map((sug, i) => (
                            <button
                                key={i}
                                className={`w-full text-left px-4 py-1.5 text-[12px] font-mono tracking-wider flex items-center justify-between transition-colors ${i === selectedIdx
                                        ? 'bg-[#ff6600] text-black'
                                        : 'text-[#ccc] hover:bg-[#1a1a1a]'
                                    }`}
                                onClick={() => applySuggestion(sug)}
                                onMouseEnter={() => setSelectedIdx(i)}
                            >
                                <span className="font-bold">{sug}</span>
                                <span className={`text-[9px] tracking-widest ${i === selectedIdx ? 'text-black/60' : 'text-[#555]'
                                    }`}>
                                    TAB
                                </span>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Status Bar */}
            <div className="w-full bg-[#1a1a1a] text-[#666] px-3 py-1 text-[10px] md:text-xs font-mono uppercase tracking-wider flex justify-between border-b border-[#222]">
                <div className="truncate">SYSTEM <span className="text-[#33cc66]">ONLINE</span> | CACHE <span className="text-[#33cc66]">SECURED</span> | QUANT ENGINE <span className="text-[#ff6600]">V3.8.1</span></div>
                <div className="hidden sm:block shrink-0 ml-4 text-[#444]">WORKSPACE · LIVE</div>
            </div>

            <CommandReferenceModal
                isOpen={isDocsOpen}
                onClose={() => setIsDocsOpen(false)}
                onFillCommand={(cmd) => setInput(cmd)}
            />
        </div>
    );
}
