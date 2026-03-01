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

        const originalParts = trimmed.split(/\s+/);
        const hasRawFlag = originalParts.includes('-R') || originalParts.includes('--RAW');
        const parts = originalParts.filter(p => p !== '-R' && p !== '--RAW');
        const cmd = parts[0];

        const viewMode = hasRawFlag ? 'raw' : 'chart';

        try {
            if (cmd === "TEL" || cmd === "PACE" || cmd === "TELEMETRY") {
                // EX: TEL 2024 BAH Q VER PER
                const args = parts.slice(1);
                addWidget('TEL', args, { x: 0, y: 0, w: 8, h: 10, minW: 4, minH: 5 }, viewMode);
            }
            else if (cmd === "MAP" && parts[1] === "SPD") {
                // EX: MAP SPD 2024 BAH Q VER
                const args = parts.slice(2);
                addWidget('MAP_SPD', args, { x: 8, y: 0, w: 4, h: 10, minW: 3, minH: 8 }, viewMode);
            }
            else if (cmd === "MAP" && parts[1] === "GEAR") {
                // EX: MAP GEAR 2024 BAH Q VER
                const args = parts.slice(2);
                addWidget('MAP_GEAR', args, { x: 8, y: 0, w: 4, h: 10, minW: 3, minH: 8 }, viewMode);
            }
            else if (cmd === "STINT") {
                const args = parts.slice(1);
                addWidget('STINT', args, { x: 0, y: 10, w: 8, h: 10, minW: 4, minH: 5 }, viewMode);
            }
            else if (cmd === "DOM") {
                const args = parts.slice(1);
                addWidget('DOM', args, { x: 0, y: 10, w: 6, h: 12, minW: 4, minH: 6 }, viewMode);
            }
            else if (cmd === "INSIGHT") {
                const args = parts.slice(1);
                addWidget('INSIGHT', args, { x: 8, y: 10, w: 4, h: 20, minW: 3, minH: 5 }, viewMode);
            }
            else if (cmd === "WEATHER") {
                const args = parts.slice(1);
                addWidget('WEATHER', args, { x: 0, y: 0, w: 6, h: 10, minW: 4, minH: 5 }, 'raw'); // Weather defaults to raw table
            }
            else if (cmd === "MSG") {
                const args = parts.slice(1);
                addWidget('MSG', args, { x: 6, y: 0, w: 6, h: 10, minW: 4, minH: 5 }, 'raw'); // Messages defaults to raw table
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
        <div className="flex flex-col flex-none w-full sticky top-0 z-50 shadow-lg">
            <div className="w-full bg-[#0a0a0a] border-b border-[#333] p-2 md:p-3 flex items-center">
                <Terminal className="text-[#00ff00] w-4 h-4 md:w-5 md:h-5 mr-3 flex-shrink-0" />
                <span className="text-[#00ff00] font-mono mr-2 text-sm md:text-base opacity-70">F1&gt;</span>
                <form onSubmit={handleSubmit} className="flex-1 flex">
                    <input
                        ref={inputRef}
                        type="text"
                        className="flex-1 bg-transparent text-[#00ff00] font-mono text-sm md:text-base uppercase outline-none placeholder-[#333] tracking-wider truncate"
                        placeholder="TYPE 'HELP' FOR THE COMMAND MATRIX..."
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        spellCheck={false}
                        autoComplete="off"
                    />
                </form>
            </div>

            {/* Global Ticker Bar (Responsive text sizing) */}
            <div className="w-full bg-[#111] text-[#888] px-3 py-1 text-[10px] md:text-xs font-mono uppercase tracking-wider flex justify-between border-b border-[#222]">
                <div className="truncate">SYSTEM <span className="text-[#00ff00]">ONLINE</span> | CACHE <span className="text-[#00ff00]">SECURED</span> | QUANT ENGINE <span className="text-neon-mercedes-silver">v3.8.1</span></div>
                <div className="hidden sm:block shrink-0 ml-4 opacity-50">&lt; USE DOCS OR ? FOR SYNTAX &gt;</div>
            </div>

            <CommandReferenceModal
                isOpen={isDocsOpen}
                onClose={() => setIsDocsOpen(false)}
                onFillCommand={(cmd) => setInput(cmd)}
            />
        </div>
    );
}
