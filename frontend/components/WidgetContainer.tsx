'use client';

import React, { useState, useEffect } from 'react';
import { useTerminalStore, Widget } from '@/store/terminalStore';
import { API_BASE_URL } from '@/lib/api';
import { X, RefreshCw } from 'lucide-react';
import TelemetryChart from './TelemetryChart';
import MultiTelemetryChart from './MultiTelemetryChart';
import TrackMapChart from './TrackMapChart';
import StintAnalysisChart from './StintAnalysisChart';
import DominanceMapChart from './DominanceMapChart';
import DataGridWidget from './DataGridWidget';

export default function WidgetContainer({ widget }: { widget: Widget }) {
    const removeWidget = useTerminalStore((state) => state.removeWidget);

    const [data, setData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchData = async () => {
        setIsLoading(true);
        setError(null);
        try {
            // We dispatch based on Widget Type mappings
            let endpoint = '';
            let payload = {};
            let isPost = true;
            let queryUrl = '';

            if (widget.viewMode === 'raw') {
                isPost = false;
                let dataset = 'telemetry';
                if (widget.type === 'WEATHER') dataset = 'weather';
                else if (widget.type === 'MSG') dataset = 'messages';

                const year = widget.params[0];
                const prix = widget.params[1];
                const session = widget.params[2];
                let driverQuery = '';
                if (widget.params[3] && widget.type !== 'WEATHER' && widget.type !== 'MSG') {
                    driverQuery = `&driver=${widget.params[3]}`;
                }

                queryUrl = `/api/v1/data/${dataset}?year=${year}&prix=${prix}&session=${session}${driverQuery}`;
            } else if (widget.type === 'TEL') {
                // Multi-driver detection: comma-separated or 3+ space-separated drivers
                const year = parseInt(widget.params[0]);
                const prix = widget.params[1];
                const session = widget.params[2];
                const driverArgs = widget.params.slice(3);

                // Parse drivers: could be "VER,NOR,LEC" (comma) or "VER NOR LEC" (space)
                let drivers: string[] = [];
                for (const arg of driverArgs) {
                    if (arg.includes(',')) {
                        drivers.push(...arg.split(',').map(d => d.trim()).filter(Boolean));
                    } else if (arg.length === 3 && /^[A-Z]{3}$/.test(arg)) {
                        drivers.push(arg);
                    }
                }

                if (drivers.length <= 2 && !driverArgs.some(a => a.includes(','))) {
                    // Legacy 2-driver comparison mode
                    endpoint = '/api/v1/telemetry/compare';
                    payload = { year, prix, session, driver_a: drivers[0], driver_b: drivers[1] };
                } else {
                    // Multi-driver overlay mode (1-6 drivers)
                    endpoint = '/api/v1/telemetry/multi';
                    payload = { year, prix, session, drivers };
                }
            } else if (widget.type === 'MAP_SPD') {
                endpoint = '/api/v1/track-map/speed';
                payload = {
                    year: parseInt(widget.params[0]),
                    prix: widget.params[1],
                    session: widget.params[2],
                    driver: widget.params[3]
                };
            } else if (widget.type === 'STINT') {
                endpoint = '/api/v1/strategy/stints';
                payload = {
                    year: parseInt(widget.params[0]),
                    prix: widget.params[1],
                    session: widget.params[2],
                    driver_a: widget.params[3]
                };
            } else if (widget.type === 'MAP_GEAR') {
                endpoint = '/api/v1/track-map/gear';
                payload = {
                    year: parseInt(widget.params[0]),
                    prix: widget.params[1],
                    session: widget.params[2],
                    driver: widget.params[3]
                };
            } else if (widget.type === 'DOM') {
                endpoint = '/api/v1/dominance/map';
                payload = {
                    year: parseInt(widget.params[0]),
                    prix: widget.params[1],
                    session: widget.params[2],
                    driver_a: widget.params[3],
                    driver_b: widget.params[4]
                };
            } else if (widget.type === 'INSIGHT') {
                endpoint = '/api/v1/insight/generate';
                payload = {
                    year: parseInt(widget.params[0]),
                    prix: widget.params[1],
                    session: widget.params[2],
                    driver_a: widget.params[3],
                    driver_b: widget.params[4]
                };
            } else if (widget.type === 'RES') {
                isPost = false;
                const year = widget.params[0];
                const prix = widget.params[1];
                const session = widget.params[2];
                queryUrl = `/api/v1/results?year=${year}&prix=${prix}&session=${session}`;
            } else if (widget.type === 'DRIVERS') {
                isPost = false;
                const year = widget.params[0];
                const prix = widget.params[1];
                const session = widget.params[2];
                queryUrl = `/api/v1/drivers?year=${year}&prix=${prix}&session=${session}`;
            } else if (widget.type === 'SEC') {
                endpoint = '/api/v1/sectors/compare';
                payload = {
                    year: parseInt(widget.params[0]),
                    prix: widget.params[1],
                    session: widget.params[2],
                    driver_a: widget.params[3],
                    driver_b: widget.params[4]
                };
            } else if (widget.type === 'QUAL') {
                isPost = false;
                const year = widget.params[0];
                const prix = widget.params[1];
                queryUrl = `/api/v1/qualifying/splits?year=${year}&prix=${prix}`;
            } else if (widget.type === 'POS') {
                isPost = false;
                const year = widget.params[0];
                const prix = widget.params[1];
                const sess = widget.params[2] || 'R';
                queryUrl = `/api/v1/position/chart?year=${year}&prix=${prix}&session=${sess}`;
            } else if (widget.type === 'PITSTOP') {
                isPost = false;
                const year = widget.params[0];
                const prix = widget.params[1];
                const sess = widget.params[2] || 'R';
                const driverParam = widget.params[3] ? `&driver=${widget.params[3]}` : '';
                queryUrl = `/api/v1/pitstops?year=${year}&prix=${prix}&session=${sess}${driverParam}`;
            } else if (widget.type === 'WDC') {
                isPost = false;
                const year = widget.params[0];
                queryUrl = `/api/v1/standings/wdc?year=${year}`;
            } else if (widget.type === 'WCC') {
                isPost = false;
                const year = widget.params[0];
                queryUrl = `/api/v1/standings/wcc?year=${year}`;
            } else if (widget.type === 'LAPS') {
                isPost = false;
                const year = widget.params[0];
                const prix = widget.params[1];
                const sess = widget.params[2] || 'R';
                const driverParam = widget.params[3] ? `&driver=${widget.params[3]}` : '';
                queryUrl = `/api/v1/laps?year=${year}&prix=${prix}&session=${sess}${driverParam}`;
            } else if (widget.type === 'SCHEDULE') {
                isPost = false;
                queryUrl = '/api/v1/macro/schedule';
            } else if (widget.type === 'PACE') {
                // PACE 2024 BAH R VER,NOR,LEC
                isPost = false;
                const year = widget.params[0];
                const prix = widget.params[1];
                const sess = widget.params[2] || 'R';
                const drivers = widget.params[3] || '';
                queryUrl = `/api/v1/pace?year=${year}&prix=${prix}&session=${sess}&drivers=${drivers}`;
            } else if (widget.type === 'CIRCUIT') {
                isPost = false;
                const year = widget.params[0];
                const prix = widget.params[1];
                const sess = widget.params[2] || 'R';
                queryUrl = `/api/v1/circuit-info?year=${year}&prix=${prix}&session=${sess}`;
            } else {
                throw new Error(`Widget type ${widget.type} logic missing.`);
            }

            const fetchUrl = isPost ? `${API_BASE_URL}${endpoint}` : `${API_BASE_URL}${queryUrl}`;

            const fetchInit: RequestInit = isPost
                ? {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                }
                : {
                    method: "GET"
                };

            const response = await fetch(fetchUrl, fetchInit);

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.detail || `HTTP ${response.status}`);
            }

            const json = await response.json();

            // For INSIGHT, we get reasoning + report structure
            if (widget.type === 'INSIGHT') {
                setData({ reasoning: json.reasoning, report: json.report });
            } else {
                setData(json.data);
            }

        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [widget.id]);

    // Render logic delegation
    const renderWidgetContent = () => {
        if (isLoading) {
            return (
                <div className="flex h-full w-full flex-col justify-center items-center text-center">
                    <RefreshCw className="w-5 h-5 text-[#ff6600] animate-spin mb-2" />
                    <span className="text-[#ff6600] uppercase tracking-widest text-xs font-mono font-bold">
                        QUERYING QUANT ENGINE...
                    </span>
                </div>
            );
        }

        if (error) {
            return (
                <div className="flex h-full w-full flex-col justify-center px-4">
                    <span className="text-[#cc3333] text-xs font-mono uppercase font-bold tracking-widest border-b border-[#cc3333] pb-1 mb-2">
                        [!] DATA PIPELINE FAILURE
                    </span>
                    <p className="text-[#ff5555] text-xs font-mono break-all font-light">
                        {error}
                    </p>
                </div>
            );
        }

        if (widget.viewMode === 'raw') {
            return <DataGridWidget data={data} />;
        }

        switch (widget.type) {
            case 'TEL': {
                // Detect multi-driver format: data is an array with .code + .telemetry
                const isMulti = Array.isArray(data) && data.length > 0 && data[0]?.code;
                if (isMulti) {
                    return <MultiTelemetryChart drivers={data} />;
                }
                return <TelemetryChart data={data} driverA={widget.params[3]} driverB={widget.params[4]} />;
            }
            case 'MAP_SPD':
                return <TrackMapChart data={data} driver={widget.params[3]} type="speed" />;
            case 'MAP_GEAR':
                return <TrackMapChart data={data} driver={widget.params[3]} type="gear" />;
            case 'STINT':
                return <StintAnalysisChart data={data} />;
            case 'DOM':
                return <DominanceMapChart data={data} />;
            case 'INSIGHT': {
                const insightData = data as { reasoning?: string; report?: string };
                return (
                    <div className="w-full h-full overflow-auto bg-[#0a0a0a] font-mono text-[11px] leading-relaxed">
                        {/* DeepSeek-Reasoner Chain-of-Thought */}
                        {insightData.reasoning && (
                            <details className="border-b border-[#222] mb-0">
                                <summary className="cursor-pointer px-4 py-2 bg-[#111] text-[#666] hover:text-[#999] uppercase tracking-widest text-[10px] font-bold select-none">
                                    ⚡ DEEPSEEK-REASONER CHAIN-OF-THOUGHT ({insightData.reasoning.length.toLocaleString()} chars)
                                </summary>
                                <div className="px-4 py-3 bg-[#080808] border-l-2 border-[#333] max-h-[40vh] overflow-auto">
                                    <pre className="text-[#555] whitespace-pre-wrap text-[10px] leading-relaxed">
                                        {insightData.reasoning}
                                    </pre>
                                </div>
                            </details>
                        )}
                        {/* Final Strategy Report */}
                        <div className="px-4 py-3">
                            <div className="text-[#00ff41] uppercase tracking-[0.2em] text-[10px] font-bold mb-3 border-b border-[#1a1a1a] pb-2">
                                ◆ QUANT STRATEGY DESK — DEEPSEEK-REASONER OUTPUT
                            </div>
                            <pre className="text-gray-300 whitespace-pre-wrap leading-relaxed">
                                {insightData.report || 'No report generated.'}
                            </pre>
                        </div>
                    </div>
                );
            }
            case 'SEC': {
                const secData = data as {
                    driver_a: { driver: string; s1: number | null; s2: number | null; s3: number | null; lap_time: number | null; speed_i1: number | null; speed_i2: number | null; speed_fl: number | null; speed_st: number | null; compound: string; tyre_life: number | null };
                    driver_b: { driver: string; s1: number | null; s2: number | null; s3: number | null; lap_time: number | null; speed_i1: number | null; speed_i2: number | null; speed_fl: number | null; speed_st: number | null; compound: string; tyre_life: number | null };
                    deltas: Record<string, number | null>;
                    sector_advantages: Record<string, string | null>;
                };
                if (!secData?.driver_a) return <span className="text-gray-500 font-mono text-xs p-4">No sector data</span>;
                const fmtTime = (s: number | null) => s !== null ? s.toFixed(3) + 's' : '—';
                const deltaColor = (d: number | null) => d === null ? 'text-gray-500' : d < 0 ? 'text-green-400' : d > 0 ? 'text-red-400' : 'text-gray-400';
                const deltaSign = (d: number | null) => d === null ? '—' : d > 0 ? `+${d.toFixed(3)}` : d.toFixed(3);
                return (
                    <div className="w-full h-full overflow-auto bg-[#0a0a0a] font-mono text-[11px] p-3">
                        <div className="text-[#00ff41] uppercase tracking-[0.15em] text-[10px] font-bold mb-3 border-b border-[#222] pb-2">
                            ◆ SECTOR ANALYSIS — {secData.driver_a.driver} vs {secData.driver_b.driver}
                        </div>
                        <table className="w-full text-[11px]">
                            <thead>
                                <tr className="text-[#666] uppercase tracking-wider text-[9px] border-b border-[#222]">
                                    <th className="py-1 text-left">Metric</th>
                                    <th className="py-1 text-right">{secData.driver_a.driver}</th>
                                    <th className="py-1 text-right">{secData.driver_b.driver}</th>
                                    <th className="py-1 text-right">Delta</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(['s1', 's2', 's3', 'lap_time'] as const).map(key => {
                                    const label = key === 'lap_time' ? 'LAP' : key.toUpperCase();
                                    const dk = `delta_${key}`;
                                    return (
                                        <tr key={key} className="border-b border-[#111] hover:bg-[#111]">
                                            <td className="py-1.5 text-[#888] font-bold">{label}</td>
                                            <td className="py-1.5 text-right text-gray-300">{fmtTime(secData.driver_a[key])}</td>
                                            <td className="py-1.5 text-right text-gray-300">{fmtTime(secData.driver_b[key])}</td>
                                            <td className={`py-1.5 text-right font-bold ${deltaColor(secData.deltas[dk])}`}>{deltaSign(secData.deltas[dk])}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                        <div className="mt-4 text-[#00ff41] uppercase tracking-[0.15em] text-[10px] font-bold mb-2 border-b border-[#222] pb-2">
                            ◆ SPEED TRAPS (km/h)
                        </div>
                        <table className="w-full text-[11px]">
                            <thead>
                                <tr className="text-[#666] uppercase tracking-wider text-[9px] border-b border-[#222]">
                                    <th className="py-1 text-left">Trap</th>
                                    <th className="py-1 text-right">{secData.driver_a.driver}</th>
                                    <th className="py-1 text-right">{secData.driver_b.driver}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(['speed_i1', 'speed_i2', 'speed_fl', 'speed_st'] as const).map(key => {
                                    const labels: Record<string, string> = { speed_i1: 'INT 1', speed_i2: 'INT 2', speed_fl: 'FINISH', speed_st: 'STRAIGHT' };
                                    const va = secData.driver_a[key];
                                    const vb = secData.driver_b[key];
                                    const faster = va !== null && vb !== null ? (va > vb ? 'a' : va < vb ? 'b' : 'tie') : 'tie';
                                    return (
                                        <tr key={key} className="border-b border-[#111] hover:bg-[#111]">
                                            <td className="py-1.5 text-[#888] font-bold">{labels[key]}</td>
                                            <td className={`py-1.5 text-right ${faster === 'a' ? 'text-green-400 font-bold' : 'text-gray-300'}`}>{va ?? '—'}</td>
                                            <td className={`py-1.5 text-right ${faster === 'b' ? 'text-green-400 font-bold' : 'text-gray-300'}`}>{vb ?? '—'}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                        <div className="mt-3 flex gap-4 text-[10px] text-[#555]">
                            <span>{secData.driver_a.driver}: {secData.driver_a.compound} (Life: {secData.driver_a.tyre_life ?? '?'})</span>
                            <span>{secData.driver_b.driver}: {secData.driver_b.compound} (Life: {secData.driver_b.tyre_life ?? '?'})</span>
                        </div>
                    </div>
                );
            }
            default:
                return <span className="text-gray-500 font-mono text-xs text-center p-4">Unsupported Widget Type</span>;
        }
    };

    // Label Map
    const WIDGET_TITLES: Record<string, string> = {
        'TEL': 'Telemetry Compare',
        'MAP_SPD': 'Speed Map',
        'MAP_GEAR': 'Gear Map',
        'STINT': 'Pace / Deg',
        'DOM': 'Micro-Sector Dom',
        'INSIGHT': 'AI Insight',
        'WEATHER': 'Weather Logs',
        'MSG': 'Race Control',
        'RES': 'Session Results',
        'SEC': 'Sector Analysis',
        'DRIVERS': 'Driver Grid',
        'QUAL': 'Qualifying Splits',
        'POS': 'Position Chart',
        'PITSTOP': 'Pit Strategy',
        'WDC': 'WDC Standings',
        'WCC': 'WCC Standings',
        'LAPS': 'Lap Table',
        'SCHEDULE': 'Season Calendar',
        'PACE': 'Multi-Driver Pace',
        'CIRCUIT': 'Circuit Info',
    };

    // Build data source label like Bloomberg: "2024 BAH Q · VER vs NOR"
    const buildSource = () => {
        const p = widget.params;
        const parts: string[] = [];
        if (p[0]) parts.push(p[0]); // year
        if (p[1]) parts.push(p[1]); // GP
        if (p[2]) parts.push(p[2]); // session
        const source = parts.join(' ');
        const drivers = p.slice(3).filter(Boolean).join(' vs ');
        if (drivers) return `${source} · ${drivers}`;
        return source;
    };

    return (
        <div className="flex flex-col h-full bg-[#101010] border border-[#2a2a2a]">
            {/* Header / Drag Handle — Bloomberg style */}
            <div className="drag-handle w-full bg-[#1a1a1a] border-b border-[#2a2a2a] flex justify-between items-center px-2.5 py-1.5 cursor-move select-none">
                <div className="flex items-center space-x-2 overflow-hidden min-w-0">
                    <span className="text-[11px] text-[#ff6600] font-mono font-bold uppercase tracking-wide shrink-0">
                        {WIDGET_TITLES[widget.type] || widget.type}
                    </span>
                    <span className="text-[10px] text-[#777] font-mono truncate">
                        {buildSource()}
                    </span>
                </div>

                <div className="flex items-center space-x-1.5 shrink-0 ml-2">
                    <button
                        onClick={(e) => { e.stopPropagation(); fetchData(); }}
                        className="text-[#555] hover:text-[#ff6600] transition-colors p-0.5"
                        title="Refresh"
                    >
                        <RefreshCw className="w-3 h-3" />
                    </button>
                    <button
                        onClick={() => removeWidget(widget.id)}
                        className="text-[#555] hover:text-[#cc3333] transition-colors p-0.5"
                        title="Close"
                    >
                        <X className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-hidden relative">
                {renderWidgetContent()}
            </div>
        </div>
    );
}
