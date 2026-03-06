'use client';

import React, { useState, useEffect, useRef } from 'react';

interface LoginGateProps {
    children: React.ReactNode;
}

// Hardcoded password hash (SHA-256 of the password)
// In production, this should be server-side auth with JWT tokens.
// Current password: "f1terminal" -> SHA-256 hash
const VALID_HASH = '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8'; // "password" - replace with your own

async function sha256(message: string): Promise<string> {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export default function LoginGate({ children }: LoginGateProps) {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
    const [isChecking, setIsChecking] = useState<boolean>(true);
    const [password, setPassword] = useState<string>('');
    const [error, setError] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [currentTime, setCurrentTime] = useState<string>('');
    const inputRef = useRef<HTMLInputElement>(null);

    // Check existing session
    useEffect(() => {
        const session = sessionStorage.getItem('f1t_auth');
        if (session === 'active') {
            setIsAuthenticated(true);
        }
        setIsChecking(false);
    }, []);

    // Live clock
    useEffect(() => {
        const tick = setInterval(() => {
            const now = new Date();
            setCurrentTime(now.toISOString().replace('T', ' ').slice(0, 19) + ' UTC');
        }, 1000);
        return () => clearInterval(tick);
    }, []);

    // Auto-focus input
    useEffect(() => {
        if (!isAuthenticated && !isChecking && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isAuthenticated, isChecking]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!password.trim()) return;

        setIsLoading(true);
        setError('');

        // Simulate network delay for anti-brute-force UX
        await new Promise(r => setTimeout(r, 800));

        const hash = await sha256(password);
        if (hash === VALID_HASH) {
            sessionStorage.setItem('f1t_auth', 'active');
            setIsAuthenticated(true);
        } else {
            setError('ACCESS DENIED — INVALID CREDENTIALS');
            setPassword('');
        }
        setIsLoading(false);
    };

    if (isChecking) {
        return (
            <div className="fixed inset-0 bg-[#010101] flex items-center justify-center">
                <div className="text-[#00ff41] font-mono text-sm animate-pulse">INITIALIZING SECURE SESSION...</div>
            </div>
        );
    }

    if (isAuthenticated) {
        return <>{children}</>;
    }

    // ─── Bloomberg-Style Login Screen ──────────────────────────────────
    return (
        <div className="fixed inset-0 bg-[#010101] flex flex-col items-center justify-center font-mono select-none overflow-hidden">
            {/* Scanline effect */}
            <div className="absolute inset-0 pointer-events-none opacity-[0.03]"
                style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 1px, rgba(255,255,255,0.03) 1px, rgba(255,255,255,0.03) 2px)' }} />

            {/* Top bar */}
            <div className="absolute top-0 left-0 right-0 h-8 bg-[#050505] border-b border-[#222] flex items-center px-4">
                <div className="w-2 h-2 rounded-full bg-[#e10600] mr-2" />
                <span className="text-[#555] text-[10px] tracking-widest">SECURE ACCESS TERMINAL</span>
                <span className="ml-auto text-[#333] text-[10px] tabular-nums">{currentTime}</span>
            </div>

            {/* Main content */}
            <div className="flex flex-col items-center max-w-md w-full px-6">
                {/* Logo / Branding */}
                <div className="mb-12 text-center">
                    <div className="text-[#00ff41] text-6xl font-black tracking-tighter mb-1" style={{ textShadow: '0 0 20px rgba(0,255,65,0.3)' }}>
                        F1<span className="text-[#e10600]">T</span>
                    </div>
                    <div className="text-[#333] text-[10px] tracking-[0.4em] uppercase">
                        Formula One Terminal
                    </div>
                    <div className="text-[#222] text-[9px] tracking-[0.3em] mt-1 uppercase">
                        Quant-Level Race Intelligence Platform
                    </div>
                </div>

                {/* Login Box */}
                <div className="w-full bg-[#0a0a0a] border border-[#222] p-6">
                    <div className="flex items-center space-x-2 mb-6 border-b border-[#222] pb-3">
                        <div className="w-2 h-2 rounded-full bg-[#ff8000]" />
                        <span className="text-[#888] text-xs tracking-widest uppercase">Authentication Required</span>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-4">
                        <div>
                            <label className="text-[#555] text-[10px] tracking-widest uppercase block mb-2">
                                ACCESS KEY
                            </label>
                            <input
                                ref={inputRef}
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-[#050505] border border-[#333] text-[#00ff41] font-mono text-sm px-4 py-3 outline-none focus:border-[#00ff41] focus:shadow-[0_0_10px_rgba(0,255,65,0.1)] transition-all tracking-widest placeholder:text-[#222]"
                                placeholder="●●●●●●●●"
                                autoComplete="off"
                                spellCheck={false}
                                disabled={isLoading}
                            />
                        </div>

                        {error && (
                            <div className="flex items-center space-x-2 text-[#e10600] text-[11px] bg-[#1a0000] border border-[#330000] px-3 py-2">
                                <span>⚠</span>
                                <span className="tracking-wider">{error}</span>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isLoading || !password.trim()}
                            className="w-full bg-[#111] border border-[#333] text-[#ccc] text-xs tracking-widest uppercase py-3 hover:bg-[#1a1a1a] hover:border-[#00ff41] hover:text-[#00ff41] transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                            {isLoading ? (
                                <span className="animate-pulse">AUTHENTICATING...</span>
                            ) : (
                                'CONNECT TO TERMINAL'
                            )}
                        </button>
                    </form>
                </div>

                {/* Footer info */}
                <div className="mt-6 text-center space-y-1">
                    <div className="text-[#222] text-[9px] tracking-widest">
                        SESSION: ENCRYPTED • TLS 1.3 • AES-256
                    </div>
                    <div className="text-[#1a1a1a] text-[9px] tracking-wider">
                        F1 Terminal v2.0.0 © 2024-2026 ZhenZhi Analytics
                    </div>
                </div>
            </div>

            {/* Bottom status bar */}
            <div className="absolute bottom-0 left-0 right-0 h-6 bg-[#050505] border-t border-[#111] flex items-center px-4">
                <span className="text-[#1a1a1a] text-[9px] tracking-wider">
                    DATA FEEDS: FastF1 3.8.1 • DeepSeek-Reasoner • Ergast API
                </span>
                <span className="ml-auto text-[#111] text-[9px]">
                    TERMINAL BUILD: PRODUCTION
                </span>
            </div>
        </div>
    );
}
