import React, { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';

export interface DominanceMapProps {
    data: {
        driver_a: string;
        driver_b: string;
        pct_a: number;
        pct_b: number;
        nodes: { X: number; Y: number; Dominator: string }[];
    } | null;
}

export default function DominanceMapChart({ data }: DominanceMapProps) {
    const option = useMemo(() => {
        if (!data || !data.nodes || data.nodes.length === 0) return {};

        const { driver_a, driver_b, pct_a, pct_b, nodes } = data;

        // Separate points into A and B series based on the computed 'Dominator' label
        const seriesA = nodes.filter(n => n.Dominator === driver_a).map(n => [n.X, n.Y]);
        const seriesB = nodes.filter(n => n.Dominator === driver_b).map(n => [n.X, n.Y]);

        return {
            backgroundColor: 'transparent',
            animation: false,
            title: [
                {
                    text: `MINI-SECTOR DOMINANCE MAP`,
                    left: 'center',
                    textStyle: { color: '#ccc', fontFamily: 'monospace', fontSize: 13, fontWeight: 'bold', letterSpacing: 1 },
                    top: 10
                },
                {
                    text: `${driver_a}: ${pct_a.toFixed(1)}% | ${driver_b}: ${pct_b.toFixed(1)}%`,
                    left: 'center',
                    textStyle: { color: '#888', fontFamily: 'monospace', fontSize: 11 },
                    top: 28
                }
            ],
            legend: {
                data: [driver_a, driver_b],
                bottom: 10,
                textStyle: { color: '#ccc', fontFamily: 'monospace', fontSize: 11 }
            },
            grid: {
                left: '2%',
                right: '2%',
                top: '15%',
                bottom: '15%'
            },
            xAxis: {
                type: 'value',
                show: false, // Absolutely essential for track map realism
                scale: true
            },
            yAxis: {
                type: 'value',
                show: false,
                scale: true
            },
            series: [
                {
                    name: driver_a,
                    type: 'scatter',
                    symbolSize: 6,
                    itemStyle: { color: '#ff2800' }, // Hardcoded Ferrari Red for Driver A MVP
                    data: seriesA
                },
                {
                    name: driver_b,
                    type: 'scatter',
                    symbolSize: 6,
                    itemStyle: { color: '#00ffff' }, // Hardcoded Neon Cyan for Driver B MVP
                    data: seriesB
                }
            ]
        };
    }, [data]);

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
