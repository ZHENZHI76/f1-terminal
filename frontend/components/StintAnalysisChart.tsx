import React, { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';

export interface StintDataPoint {
    Stint: number;
    TyreLife: number;
    LapTime: number;
    Compound: string;
}

export interface TrendlineData {
    Stint: number;
    Compound: string;
    Slope: number;
    Intercept: number;
    StartX: number;
    EndX: number;
}

export interface StintAnalysisProps {
    data: {
        driver: string;
        scatter_points: StintDataPoint[];
        trendlines: TrendlineData[];
    } | null;
}

const COMPOUND_COLORS: Record<string, string> = {
    'SOFT': '#ff2800',    // Red
    'MEDIUM': '#f5d000',  // Yellow
    'HARD': '#ffffff',    // White
    'INTERMEDIATE': '#39b54a', // Green
    'WET': '#00a3e0'      // Blue
};

export default function StintAnalysisChart({ data }: StintAnalysisProps) {
    const option = useMemo(() => {
        if (!data || !data.scatter_points || data.scatter_points.length === 0) return {};

        const series: any[] = [];

        // Group scatter points by Compound for legend/coloring
        const compounds = [...new Set(data.scatter_points.map(p => p.Compound))];

        compounds.forEach(comp => {
            const points = data.scatter_points.filter(p => p.Compound === comp);
            series.push({
                name: `${comp} Laps`,
                type: 'scatter',
                symbolSize: 6,
                itemStyle: {
                    color: COMPOUND_COLORS[comp.toUpperCase()] || '#888',
                    opacity: 0.8
                },
                data: points.map(p => [p.TyreLife, p.LapTime])
            });
        });

        // Add trendlines
        if (data.trendlines) {
            data.trendlines.forEach((tl, index) => {
                const startY = tl.Slope * tl.StartX + tl.Intercept;
                const endY = tl.Slope * tl.EndX + tl.Intercept;

                // Generate a human-readable degradation label
                const degPerLap = (tl.Slope).toFixed(3);

                series.push({
                    name: `Stint ${tl.Stint} Trend`,
                    type: 'line',
                    showSymbol: false,
                    data: [
                        [tl.StartX, startY],
                        [tl.EndX, endY]
                    ],
                    lineStyle: {
                        color: COMPOUND_COLORS[tl.Compound.toUpperCase()] || '#cfcfcf',
                        width: 2,
                        type: 'dashed'
                    },
                    tooltip: {
                        formatter: () => `Degradation: ${degPerLap}s / lap`
                    }
                });
            });
        }

        return {
            backgroundColor: 'transparent',
            animation: false,
            title: {
                text: `${data.driver} Long Run Pace & Tyre Degradation`,
                left: 'center',
                textStyle: { color: '#ccc', fontFamily: 'monospace', fontSize: 14, fontWeight: 'normal' },
                top: 10
            },
            tooltip: {
                trigger: 'item',
                backgroundColor: 'rgba(17, 17, 17, 0.9)',
                borderColor: '#333',
                textStyle: { color: '#ccc', fontFamily: 'monospace', fontSize: 12 },
                formatter: function (params: any) {
                    if (params.seriesType === 'scatter') {
                        return `Tyre Life: ${params.value[0]}<br/>Lap Time: ${params.value[1].toFixed(3)}s`;
                    }
                    return params.seriesName;
                }
            },
            legend: {
                bottom: 10,
                textStyle: { color: '#888', fontFamily: 'monospace' },
                data: compounds.map(c => `${c} Laps`) // Only show scatter legend
            },
            grid: {
                left: '8%',
                right: '5%',
                top: '15%',
                bottom: '15%'
            },
            xAxis: {
                type: 'value',
                name: 'TYRE LIFE (LAPS)',
                nameLocation: 'middle',
                nameGap: 25,
                nameTextStyle: { color: '#555', fontFamily: 'monospace' },
                axisLine: { lineStyle: { color: '#333' } },
                axisLabel: { color: '#888', fontFamily: 'monospace' },
                splitLine: { show: true, lineStyle: { color: '#1a1a1a' } }
            },
            yAxis: {
                type: 'value',
                name: 'LAP TIME (S)',
                nameLocation: 'middle',
                nameGap: 40,
                nameTextStyle: { color: '#555', fontFamily: 'monospace' },
                axisLine: { lineStyle: { color: '#333' } },
                axisLabel: {
                    color: '#888',
                    fontFamily: 'monospace',
                    formatter: (value: number) => value.toFixed(1)
                },
                splitLine: { show: true, lineStyle: { color: '#1a1a1a' } },
                scale: true // Auto-scale Y axis based on min/max
            },
            series: series
        };
    }, [data]);

    if (!data) {
        return (
            <div className="w-full h-full flex items-center justify-center text-[#333] font-mono text-xs">
                &lt; NO STINT DATA LOADED &gt;
            </div>
        );
    }

    return (
        <ReactECharts
            option={option}
            style={{ height: '100%', width: '100%' }}
            notMerge={true}
            lazyUpdate={true}
            theme="dark"
        />
    );
}
