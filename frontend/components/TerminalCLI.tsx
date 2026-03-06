"use client";

import React, { useState, useRef, useEffect } from "react";
import { Terminal } from "lucide-react";
import { useTerminalStore, WidgetType } from "@/store/terminalStore";
import CommandReferenceModal from "./CommandReferenceModal";

export default function TerminalCLI() {
    const [input, setInput] = useState("");
    const [isDocsOpen, setIsDocsOpen] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const addWidget = useTerminalStore((state) => state.addWidget);

    // Auto-focus the terminal to maintain a "keyboard-first" experience
    useEffect(() => {
        inputRef.current?.focus();
        const handleKeyDown = () => {
            inputRef.current?.focus();
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, []);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
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
            if (cmd === "TEL" || cmd === "PACE" || cmd === "TELEMETRY") {
                // EX: TEL 2024 BAH Q VER PER
                const args = parts.slice(1);
                addWidget('TEL', args, { x: 0, y: 0, w: 8, h: 12, minW: 3, minH: 4 }, viewMode);
            }
            else if (cmd === "MAP" && parts[1] === "SPD") {
                // EX: MAP SPD 2024 BAH Q VER
                const args = parts.slice(2);
                addWidget('MAP_SPD', args, { x: 8, y: 0, w: 4, h: 12, minW: 2, minH: 4 }, viewMode);
            }
            else if (cmd === "MAP" && parts[1] === "GEAR") {
                // EX: MAP GEAR 2024 BAH Q VER
                const args = parts.slice(2);
                addWidget('MAP_GEAR', args, { x: 8, y: 0, w: 4, h: 12, minW: 2, minH: 4 }, viewMode);
            }
            else if (cmd === "STINT") {
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
                addWidget('WEATHER', args, { x: 0, y: 0, w: 6, h: 10, minW: 2, minH: 3 }, 'raw'); // Weather defaults to raw table
            }
            else if (cmd === "MSG") {
                const args = parts.slice(1);
                addWidget('MSG', args, { x: 6, y: 0, w: 6, h: 10, minW: 2, minH: 3 }, 'raw'); // Messages defaults to raw table
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
                // PACE 2024 BAH R VER,NOR,LEC
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
            <div className="w-full bg-[#141414] border-b border-[#2a2a2a] p-2 md:p-3 flex items-center">
                <Terminal className="text-[#ff6600] w-4 h-4 md:w-5 md:h-5 mr-3 flex-shrink-0" />
                <span className="text-[#ff6600] font-mono mr-2 text-sm md:text-base font-bold">F1&gt;</span>
                <form onSubmit={handleSubmit} className="flex-1 flex">
                    <input
                        ref={inputRef}
                        type="text"
                        className="flex-1 bg-transparent text-[#e0e0e0] font-mono text-sm md:text-base uppercase outline-none placeholder-[#444] tracking-wider truncate"
                        placeholder="TYPE 'HELP' FOR COMMAND REFERENCE..."
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        spellCheck={false}
                        autoComplete="off"
                    />
                </form>
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
