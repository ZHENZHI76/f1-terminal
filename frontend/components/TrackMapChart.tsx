import React, { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';

export interface TrackMapProps {
    data: number[][] | null; // [[X, Y, Speed_or_Gear], [X2, Y2, ...]]
    driver: string;
    type?: 'speed' | 'gear';
}

export default function TrackMapChart({ data, driver, type = 'speed' }: TrackMapProps) {
    const option = useMemo(() => {
        if (!data || data.length === 0) return {};

        // Define distinct palettes for Map modes
        const speedColors = ['#ff2800', '#f5d000', '#00ff00', '#00ffff']; // Ferrari Red -> Neon Blue
        const gearColors = ['#222', '#555', '#888', '#aaa', '#ccc', '#fff', '#f0f', '#0ff']; // Greys -> Magenta -> Cyan

        const isSpeed = type === 'speed';

        return {
            backgroundColor: 'transparent',
            animation: false,
            title: {
                text: `${driver} TRACK SPEED HEATMAP`,
                left: 'center',
                textStyle: { color: '#ccc', fontFamily: 'monospace', fontSize: 14, fontWeight: 'normal', letterSpacing: 2 },
                top: 10
            },
            tooltip: {
                trigger: 'item',
                backgroundColor: 'rgba(17, 17, 17, 0.9)',
                borderColor: '#333',
                textStyle: { color: '#ccc', fontFamily: 'monospace', fontSize: 12 },
                formatter: function (params: any) {
                    const value = params.value[2];
                    return isSpeed ? `Speed: ${value.toFixed(1)} km/h` : `Gear: ${Math.round(value)}`;
                }
            },
            grid: {
                left: '5%',
                right: '5%',
                top: '15%',
                bottom: '10%'
            },
            xAxis: {
                type: 'value',
                show: false, // Hide absolute GPS coordinates
                scale: true
            },
            yAxis: {
                type: 'value',
                show: false, // Hide absolute GPS coordinates
                scale: true
            },
            visualMap: {
                type: isSpeed ? 'continuous' : 'piecewise',
                dimension: 2,
                min: isSpeed ? 70 : 1,
                max: isSpeed ? 330 : 8,
                inRange: {
                    color: isSpeed ? speedColors : gearColors
                },
                text: [isSpeed ? 'HIGH' : 'G8', isSpeed ? 'LOW' : 'G1'],
                splitNumber: isSpeed ? undefined : 8,
                textStyle: { color: '#888', fontFamily: 'monospace', fontSize: 10 },
                itemHeight: 120,
                itemWidth: 10,
                right: 20,
                top: 'center',
                calculable: true
            },
            series: [
                {
                    name: 'Track Heatmap',
                    type: 'scatter',
                    symbolSize: 4,     // Very small dense dots
                    itemStyle: {
                        opacity: 0.8
                    },
                    data: data
                }
            ]
        };
    }, [data, driver]);

    if (!data) {
        return (
            <div className="w-full h-full flex items-center justify-center text-[#333] font-mono text-xs">
                &lt; NO SPATIAL DATA LOADED &gt;
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
