'use client';

import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '@/lib/api';

interface MacroData {
    EventName: string;
    Country: string;
    Location: string;
    Round: number;
    NextSession: string;
    EventFormat: string;
    StartTimeUTC: string;
    StartTimeFormatted: string;
    TrackTemp: string;
    AirTemp: string;
    Humidity: string;
    Rainfall: boolean;
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
                const res = await fetch(`${API_BASE_URL}/api/v1/macro/next-event`);
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

        // Refetch every 5 minutes
        const macroInterval = setInterval(fetchMacro, 300000);
        return () => clearInterval(macroInterval);
    }, []);

    // 1-Second clock and countdown tick
    useEffect(() => {
        const tick = setInterval(() => {
            const now = new Date();
            setCurrentTime(now);

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

                    setCountdownFormatted(`${dStr}D ${hStr}:${mStr}:${sStr}`);
                } else {
                    setCountdownFormatted("SESSION LIVE");
                }
            }
        }, 1000);

        return () => clearInterval(tick);
    }, [macroData]);

    const formatCurrentUTC = (d: Date) => {
        return d.toISOString().replace('.000', '').replace('T', ' ').slice(0, -1);
    };

    // Session type color coding
    const getSessionColor = (session: string) => {
        if (!session) return 'text-[#888]';
        const s = session.toUpperCase();
        if (s === 'RACE') return 'text-[#ff6600]';
        if (s.includes('QUALIFYING') || s.includes('QUAL')) return 'text-[#ff9900]';
        if (s.includes('SPRINT')) return 'text-[#3399cc]';
        if (s.includes('PRACTICE') || s.includes('FP')) return 'text-[#33cc66]';
        return 'text-[#ccc]';
    };

    // Weather emoji
    const getWeatherIcon = () => {
        if (macroData?.Rainfall) return '🌧️';
        return '☀️';
    };

    return (
        <div className="w-full h-8 bg-[#0e0e0e] border-b border-[#222] flex items-center px-4 overflow-hidden fixed top-0 left-0 z-50">
            {/* Status */}
            <div className="flex items-center space-x-2 mr-4 shrink-0">
                <div className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-[#33cc66]' : 'bg-[#cc3333]'} `} />
                <span className={`text-[10px] font-mono font-bold tracking-widest ${isOnline ? 'text-[#33cc66]' : 'text-[#cc3333]'}`}>
                    {isOnline ? 'LIVE' : 'OFFLINE'}
                </span>
            </div>

            {/* Ticker Tape */}
            <div className="flex-1 flex items-center space-x-4 whitespace-nowrap overflow-hidden">
                {/* Event + Round */}
                <span className="text-gray-500 font-mono text-[11px] font-light hidden lg:inline">
                    {macroData?.Round ? `R${macroData.Round}` : ''}{' '}
                    <span className="text-white font-bold">{macroData?.EventName?.toUpperCase() || 'QUERYING...'}</span>
                    {macroData?.Location && macroData?.Location !== 'N/A' && (
                        <span className="text-[#555] ml-1">📍{macroData.Location}</span>
                    )}
                </span>

                {/* Mobile: shorter event name */}
                <span className="text-white font-mono text-[11px] font-bold lg:hidden">
                    {macroData?.EventName?.toUpperCase() || '...'}
                </span>

                <span className="text-gray-700 font-bold">│</span>

                {/* Next Session */}
                <span className="text-gray-500 font-mono text-[11px] font-light">
                    NEXT: <span className={`font-bold ${getSessionColor(macroData?.NextSession || '')}`}>
                        {macroData?.NextSession || '---'}
                    </span>
                </span>

                <span className="text-gray-700 font-bold">│</span>

                {/* Countdown */}
                <span className="text-[#666] font-mono text-[11px] font-light">
                    T- <span className="text-[#ff6600] font-bold text-[12px] tabular-nums">{countdownFormatted}</span>
                </span>

                <span className="text-gray-700 font-bold hidden md:inline">│</span>

                {/* Weather */}
                <span className="text-gray-500 font-mono text-[11px] font-light hidden md:inline">
                    {getWeatherIcon()}{' '}
                    <span className="text-[#ff9900] font-bold">
                        T:{macroData?.TrackTemp || '--'}
                    </span>
                    <span className="text-[#555] mx-1">/</span>
                    <span className="text-[#999] font-bold">
                        A:{macroData?.AirTemp || '--'}
                    </span>
                    {macroData?.Humidity && macroData.Humidity !== 'N/A' && (
                        <>
                            <span className="text-gray-500 mx-1">/</span>
                            <span className="text-[#888]">💧{macroData.Humidity}</span>
                        </>
                    )}
                </span>

                <span className="text-gray-700 font-bold hidden xl:inline">│</span>

                {/* UTC Clock */}
                <span className="text-gray-500 font-mono text-[11px] font-light hidden xl:inline">
                    UTC <span className="text-gray-300 font-bold tabular-nums">{formatCurrentUTC(currentTime)}</span>
                </span>
            </div>

            {/* Terminal Branding right aligned */}
            <div className="ml-auto shrink-0 pl-4 border-l border-[#222] flex items-center h-full">
                <span className="text-[#333] font-mono text-[10px] font-bold tracking-widest hidden md:inline">
                    F1 TERMINAL
                </span>
                <span className="text-[#333] font-mono text-[10px] font-bold tracking-widest md:hidden">
                    F1T
                </span>
            </div>
        </div>
    );
}
