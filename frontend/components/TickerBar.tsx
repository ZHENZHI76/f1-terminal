'use client';

import React, { useState, useEffect } from 'react';

interface MacroData {
    EventName: string;
    Country: string;
    NextSession: string;
    StartTimeUTC: string;
    TrackTemp: string;
    AirTemp: string;
}

export default function TickerBar() {
    const [macroData, setMacroData] = useState<MacroData | null>(null);
    const [currentTime, setCurrentTime] = useState<Date>(new Date());
    const [countdownFormatted, setCountdownFormatted] = useState<string>("00:00:00:00");
    const [isOnline, setIsOnline] = useState<boolean>(false);

    // Initial Data Fetch
    useEffect(() => {
        const fetchMacro = async () => {
            try {
                const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
                const res = await fetch(`${baseUrl}/macro/next-event`);
                if (!res.ok) throw new Error("Macro fetch failed");
                const json = await res.json();
                if (json.status === 'success') {
                    setMacroData(json.data);
                    setIsOnline(true);
                }
            } catch (err) {
                console.error("Ticker fetch error: ", err);
                setIsOnline(false);
            }
        };
        fetchMacro();

        // Refetch macro data every 5 minutes just in case
        const macroInterval = setInterval(fetchMacro, 300000);
        return () => clearInterval(macroInterval);
    }, []);

    // 1-Second clock and countdown tick
    useEffect(() => {
        const tick = setInterval(() => {
            const now = new Date();
            setCurrentTime(now);

            // Calculate countdown if we have a start time
            if (macroData?.StartTimeUTC) {
                const eventTime = new Date(macroData.StartTimeUTC).getTime();
                const diffMs = eventTime - now.getTime();

                if (diffMs > 0) {
                    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
                    const hours = Math.floor((diffMs / (1000 * 60 * 60)) % 24);
                    const minutes = Math.floor((diffMs / 1000 / 60) % 60);
                    const seconds = Math.floor((diffMs / 1000) % 60);

                    const dStr = days.toString().padStart(2, '0');
                    const hStr = hours.toString().padStart(2, '0');
                    const mStr = minutes.toString().padStart(2, '0');
                    const sStr = seconds.toString().padStart(2, '0');

                    setCountdownFormatted(`${dStr}:${hStr}:${mStr}:${sStr}`);
                } else {
                    setCountdownFormatted("RACE LIVE");
                }
            }
        }, 1000);

        return () => clearInterval(tick);
    }, [macroData]);

    const formatCurrentUTC = (d: Date) => {
        return d.toISOString().replace('.000', '').replace('T', ' ');
    };

    return (
        <div className="w-full h-8 bg-[#050505] border-b border-[#222] flex items-center px-4 overflow-hidden shadow-md fixed top-0 left-0 z-50">
            {/* System Status Indicator */}
            <div className="flex items-center space-x-2 mr-6 shrink-0">
                <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-[#00ff41] animate-pulse shadow-[0_0_8px_#00ff41]' : 'bg-[#ff2800]'} `} />
                <span className={`text-[10px] font-mono font-bold tracking-widest ${isOnline ? 'text-[#00ff41]' : 'text-[#ff2800]'}`}>
                    {isOnline ? 'SYS ONLINE' : 'SYS OFFLINE'}
                </span>
            </div>

            {/* Scrolling / Flex Ticker Tape */}
            <div className="flex-1 flex items-center space-x-6 whitespace-nowrap overflow-hidden">
                <span className="text-gray-500 font-mono text-[11px] font-light">
                    NEXT GP: <span className="text-white font-bold">{macroData?.EventName?.toUpperCase() || 'QUERYING...'} {macroData?.Country ? '📍' : ''}</span>
                </span>

                <span className="text-gray-700 font-bold">||</span>

                <span className="text-gray-500 font-mono text-[11px] font-light">
                    SESSION: <span className="text-[#0600ef] font-bold">{macroData?.NextSession || '---'}</span>
                </span>

                <span className="text-gray-700 font-bold">||</span>

                <span className="text-gray-500 font-mono text-[11px] font-light">
                    T-MINUS: <span className="text-[#ff2800] font-bold text-[12px]">{countdownFormatted}</span>
                </span>

                <span className="text-gray-700 font-bold">||</span>

                <span className="text-gray-500 font-mono text-[11px] font-light">
                    CURRENT UTC: <span className="text-gray-300 font-bold">{formatCurrentUTC(currentTime)}</span>
                </span>

                <span className="text-gray-700 font-bold">||</span>

                <span className="text-gray-500 font-mono text-[11px] font-light">
                    WEATHER: <span className="text-yellow-500 font-bold">TRACK {macroData?.TrackTemp || '--'} AIR {macroData?.AirTemp || '--'}</span>
                </span>
            </div>

            {/* Terminal Branding right aligned */}
            <div className="ml-auto shrink-0 pl-4 border-l border-[#222] flex items-center h-full">
                <span className="text-[#333] font-mono text-[10px] font-bold tracking-widest">
                    QUANT ENGINE // F1_TERMINAL
                </span>
            </div>
        </div>
    );
}
