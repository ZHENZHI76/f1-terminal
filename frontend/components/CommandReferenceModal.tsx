import React, { useEffect, useState } from 'react';
import { COMMAND_REGISTRY } from '@/config/commands';

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

    const handleQuickFill = (example: string) => {
        onFillCommand(example);
        onClose();
    };

    const categories = Array.from(new Set(COMMAND_REGISTRY.map(c => c.category)));

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

                    <div className="space-y-6 md:space-y-8">
                        {categories.map((cat, idx) => (
                            <div key={idx} className="bg-[#0a0a0a] border border-[#222] p-4 rounded-sm">
                                <h3 className="text-neon-williams-blue font-bold tracking-widest uppercase mb-4 text-xs border-b border-[#333] pb-2">
                                    // {cat}
                                </h3>
                                <div className="space-y-3">
                                    {COMMAND_REGISTRY.filter(c => c.category === cat).map((c, i) => (
                                        <div key={i} className="md:grid md:grid-cols-12 md:gap-4 items-start hover:bg-[#151515] p-2 transition-colors duration-150 border-l-2 border-transparent hover:border-neon-mclaren-papaya">
                                            <div className="col-span-3 mb-1 md:mb-0 break-words flex flex-col">
                                                <span className="text-[#00ff41] text-xs font-bold leading-tight">{c.command} {c.args.join(" ")}</span>
                                                {c.supportsRaw && (
                                                    <span className="text-[10px] text-neon-aston-green mt-1 bg-[#111] w-max px-1 border border-[#222]">[-R / --RAW] SUPPORTED</span>
                                                )}
                                            </div>
                                            <div className="col-span-6 text-xs text-[#888] mb-3 md:mb-0 pr-4 leading-relaxed">
                                                {c.description}
                                            </div>
                                            <div className="col-span-3">
                                                <button
                                                    onClick={() => handleQuickFill(c.example)}
                                                    className="w-full text-left bg-[#111] hover:bg-[#222] border border-[#333] hover:border-neon-mclaren-papaya text-[#ccc] hover:text-white px-3 py-2 transition-all rounded-sm text-[11px] font-bold tracking-wide flex justify-between items-center group shadow-sm"
                                                    title="Click to auto-fill into terminal"
                                                >
                                                    <span className="truncate mr-2">&gt; {c.example}</span>
                                                    <span className="opacity-0 group-hover:opacity-100 text-neon-mclaren-papaya transition-opacity">EXEC</span>
                                                </button>
                                            </div>
                                        </div>
                                    ))}
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
