'use client';

import React, { useState, useEffect } from 'react';
import { useTerminalStore, Widget } from '@/store/terminalStore';
import { X, RefreshCw } from 'lucide-react';
import TelemetryChart from './TelemetryChart';
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
                endpoint = '/api/v1/telemetry/compare';
                payload = {
                    year: parseInt(widget.params[0]),
                    prix: widget.params[1],
                    session: widget.params[2],
                    driver_a: widget.params[3],
                    driver_b: widget.params[4]
                };
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
            } else {
                throw new Error(`Widget type ${widget.type} logic missing.`);
            }
            const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
            const fetchUrl = isPost ? `${API_BASE}${endpoint}` : `${API_BASE}${queryUrl}`;

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

            // For INSIGHT, we get a text report, else we get data
            if (widget.type === 'INSIGHT') {
                setData(json.report);
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
                    <RefreshCw className="w-5 h-5 text-neon-aston-green animate-spin mb-2" />
                    <span className="text-neon-aston-green uppercase tracking-widest text-xs font-mono font-bold">
                        QUERYING QUANT ENGINE...
                    </span>
                </div>
            );
        }

        if (error) {
            return (
                <div className="flex h-full w-full flex-col justify-center px-4">
                    <span className="text-neon-ferrari-red text-xs font-mono uppercase font-bold tracking-widest border-b border-neon-ferrari-red pb-1 mb-2">
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
            case 'TEL':
                return <TelemetryChart data={data} driverA={widget.params[3]} driverB={widget.params[4]} />;
            case 'MAP_SPD':
                return <TrackMapChart data={data} driver={widget.params[3]} type="speed" />;
            case 'MAP_GEAR':
                return <TrackMapChart data={data} driver={widget.params[3]} type="gear" />;
            case 'STINT':
                return <StintAnalysisChart data={data} />;
            case 'DOM':
                return <DominanceMapChart data={data} />;
            case 'INSIGHT':
                return (
                    <div className="w-full h-full p-4 overflow-auto bg-[#0a0a0a]">
                        <pre className="text-gray-300 font-mono text-[11px] leading-relaxed whitespace-pre-wrap">
                            {data}
                        </pre>
                    </div>
                );
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
        'MSG': 'Race Control'
    };

    return (
        <div className="flex flex-col h-full bg-[#050505] border border-[#222]">
            {/* Header / Drag Handle */}
            <div className="drag-handle w-full bg-[#111] border-b border-[#333] flex justify-between items-center px-2 py-1 cursor-move select-none">
                <div className="flex space-x-2 items-baseline">
                    <span className="text-[10px] text-gray-500 uppercase tracking-widest font-mono font-bold">
                        [{widget.id.split('-')[1].slice(-4)}]
                    </span>
                    <span className="text-[11px] text-[#ccc] font-mono tracking-wider font-bold uppercase truncate max-w-[150px]">
                        {WIDGET_TITLES[widget.type] || 'WIDGET'}
                    </span>
                    <span className="text-[9px] text-[#555] font-mono truncate hidden lg:inline">
                        {widget.params.join(" ")}
                    </span>
                </div>

                <div className="flex space-x-2">
                    <button
                        onClick={(e) => { e.stopPropagation(); fetchData(); }}
                        className="text-[#666] hover:text-white transition-colors"
                        title="Refresh Query"
                    >
                        <RefreshCw className="w-3 h-3" />
                    </button>
                    <button
                        onClick={() => removeWidget(widget.id)}
                        className="text-[#666] hover:text-neon-ferrari-red transition-colors"
                        title="Close Panel"
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
