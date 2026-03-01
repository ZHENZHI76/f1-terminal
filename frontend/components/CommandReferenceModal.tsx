import React, { useEffect, useState } from 'react';

interface CommandReferenceModalProps {
    isOpen: boolean;
    onClose: () => void;
    onFillCommand: (cmd: string) => void;
}

export default function CommandReferenceModal({ isOpen, onClose, onFillCommand }: CommandReferenceModalProps) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        if (isOpen) {
            window.addEventListener('keydown', handleKeyDown);
        }
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    if (!mounted || !isOpen) return null;

    const commands = [
        {
            cmd: "TEL <YEAR> <GP> <SESS> <DRV_A> [DRV_B]",
            desc: "High-frequency telemetry comparison. Displays Speed, Throttle, Brake, Gear, and Delta Time.",
            example: "TEL 2024 BAH Q VER LEC"
        },
        {
            cmd: "MAP SPD <YEAR> <GP> <SESS> <DRV>",
            desc: "Geospatial Track Speed Map. Plots the driver's fastest lap GPS coordinates with speed gradient.",
            example: "MAP SPD 2024 BAH Q VER"
        },
        {
            cmd: "MAP GEAR <YEAR> <GP> <SESS> <DRV>",
            desc: "Geospatial Track Gear Map. Plots GPS coordinates overlaid with transmission geartracking.",
            example: "MAP GEAR 2024 BAH Q VER"
        },
        {
            cmd: "STINT <YEAR> <GP> <SESS> <DRV>",
            desc: "Quant long-run pace & tyre degradation using linear regression lap filtering.",
            example: "STINT 2024 BAH R VER"
        },
        {
            cmd: "DOM <YEAR> <GP> <SESS> <DRV_A> <DRV_B>",
            desc: "Mini-Sector Dominance Map. Maps track to 25 chunks to measure localized aerodynamic/power setup superiority.",
            example: "DOM 2024 BAH Q VER LEC"
        },
        {
            cmd: "INSIGHT <YEAR> <GP> <SESS> <DRV_A> <DRV_B>",
            desc: "DeepSeek V3 LLM Automated Strategy Insight generation based on telemetry variance.",
            example: "INSIGHT 2024 BAH Q VER LEC"
        }
    ];

    const handleQuickFill = (example: string) => {
        onFillCommand(example);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-black/90 backdrop-blur-sm">
            <div className="w-full max-w-4xl bg-[#111] border border-[#333] shadow-2xl overflow-hidden font-mono flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="flex justify-between items-center p-4 border-b border-[#333] bg-[#0a0a0a]">
                    <div className="flex items-center space-x-3">
                        <div className="w-3 h-3 rounded-full bg-neon-mercedes-silver animate-pulse"></div>
                        <h2 className="text-[#ccc] text-sm md:text-base font-bold tracking-widest shrink-0 uppercase">F1 Terminal Matrix</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-neon-ferrari-red hover:text-white border border-neon-ferrari-red px-3 py-1 text-xs transition-colors shrink-0"
                    >
                        [ ESC ] CLOSE
                    </button>
                </div>

                {/* Content */}
                <div className="overflow-y-auto p-4 md:p-6 text-[#aaa]">
                    <p className="mb-6 text-xs md:text-sm leading-relaxed max-w-2xl opacity-80">
                        Welcome to the lapLens precision UI. This Bloomberg-terminal inspired environment is entirely driven by CLI commands.
                        Click on any example below to Quick Fill the terminal array.
                    </p>

                    <div className="hidden md:grid grid-cols-12 gap-4 pb-2 border-b border-[#333] mb-4 text-[#555] font-bold text-xs uppercase tracking-wider">
                        <div className="col-span-3">Syntax Matrix</div>
                        <div className="col-span-6">Vector Description</div>
                        <div className="col-span-3">Execution</div>
                    </div>

                    <div className="space-y-4 md:space-y-0">
                        {commands.map((c, i) => (
                            <div key={i} className="md:grid md:grid-cols-12 md:gap-4 md:py-4 border-b border-[#222] pb-4 md:pb-0 items-start hover:bg-[#1a1a1a] transition-colors rounded md:px-2">
                                <div className="col-span-3 text-[#00ff00] text-xs font-bold mb-1 md:mb-0 break-words">
                                    {c.cmd}
                                </div>
                                <div className="col-span-6 text-xs text-[#888] mb-3 md:mb-0 pr-4">
                                    {c.desc}
                                </div>
                                <div className="col-span-3">
                                    <button
                                        onClick={() => handleQuickFill(c.example)}
                                        className="w-full text-left bg-[#222] hover:bg-[#333] border border-[#444] hover:border-neon-mclaren-papaya text-[#ccc] hover:text-neon-mclaren-papaya px-3 py-2 text-xs transition-colors rounded whitespace-nowrap overflow-hidden text-ellipsis"
                                    >
                                        &gt; {c.example}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-3 border-t border-[#333] bg-[#0a0a0a] text-[#555] text-[10px] text-center flex justify-between">
                    <span>STATUS: DATA LINK ACTIVE</span>
                    <span>Q-ENGINE: v3.8.1 (FastF1)</span>
                </div>
            </div>
        </div>
    );
}
