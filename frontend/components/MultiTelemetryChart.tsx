import React, { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';

interface DriverTrace {
    code: string;
    color: string;
    meta: {
        driver: string;
        lap_time_str?: string;
        compound?: string;
        team?: string;
        team_color?: string;
    };
    telemetry: { D: number; Speed: number; Throttle: number; Brake: number; nGear: number; RPM: number; DRS: number }[];
}

interface MultiTelemetryChartProps {
    drivers: DriverTrace[];
}

export default function MultiTelemetryChart({ drivers }: MultiTelemetryChartProps) {
    const option = useMemo(() => {
        if (!drivers || drivers.length === 0) return {};

        const xAxisCommon = {
            type: 'value' as const,
            min: 'dataMin',
            max: 'dataMax',
            axisLine: { lineStyle: { color: '#333' } },
            splitLine: { show: true, lineStyle: { color: '#1a1a1a' } },
        };

        // 5 grids: Speed, RPM, Throttle, Brake, Gear
        const grids = [
            { left: '6%', right: '4%', top: '4%', height: '32%' },   // Speed
            { left: '6%', right: '4%', top: '40%', height: '16%' },  // RPM
            { left: '6%', right: '4%', top: '60%', height: '12%' },  // Throttle
            { left: '6%', right: '4%', top: '76%', height: '8%' },   // Brake
            { left: '6%', right: '4%', top: '88%', height: '8%' },   // Gear
        ];

        const xAxes = grids.map((_, i) => ({
            ...xAxisCommon,
            gridIndex: i,
            axisLabel: i === grids.length - 1
                ? { color: '#888', fontFamily: 'monospace', fontSize: 10 }
                : { show: false },
        }));

        const yAxisNames = ['KM/H', 'RPM', 'THR', 'BRK', 'GEAR'];
        const yAxes = grids.map((_, i) => ({
            type: 'value' as const,
            gridIndex: i,
            name: yAxisNames[i],
            nameLocation: 'middle' as const,
            nameGap: 30,
            nameTextStyle: { color: '#555', fontFamily: 'monospace', fontSize: 10 },
            axisLabel: i <= 1 ? { color: '#888', fontSize: 10 } : { show: false },
            splitLine: { show: true, lineStyle: { color: '#1a1a1a' } },
            ...(i === 2 ? { max: 100, min: 0 } : {}),
            ...(i === 3 ? { max: 1, min: 0 } : {}),
            ...(i === 4 ? { max: 8, min: 0, interval: 2 } : {}),
            ...(i <= 1 ? { min: 'dataMin' } : {}),
        }));

        // Build series: for each driver × each channel
        const channels: { key: string; gridIdx: number; step?: string }[] = [
            { key: 'Speed', gridIdx: 0 },
            { key: 'RPM', gridIdx: 1 },
            { key: 'Throttle', gridIdx: 2 },
            { key: 'Brake', gridIdx: 3, step: 'end' },
            { key: 'nGear', gridIdx: 4, step: 'end' },
        ];

        const series: any[] = [];
        for (const drv of drivers) {
            const color = drv.color || '#ff6600';
            for (const ch of channels) {
                const data = drv.telemetry.map(p => [p.D, (p as any)[ch.key]]);
                series.push({
                    name: `${drv.code} ${ch.key}`,
                    type: 'line',
                    xAxisIndex: ch.gridIdx,
                    yAxisIndex: ch.gridIdx,
                    data,
                    showSymbol: false,
                    sampling: 'lttb',
                    lineStyle: { color, width: 1.5 },
                    itemStyle: { color },
                    ...(ch.step ? { step: ch.step } : {}),
                });
            }
        }

        return {
            backgroundColor: 'transparent',
            animation: false,
            tooltip: {
                trigger: 'axis',
                axisPointer: { type: 'cross', animation: false, snap: true, label: { backgroundColor: '#333' } },
                backgroundColor: 'rgba(17, 17, 17, 0.9)',
                borderColor: '#333',
                textStyle: { color: '#ccc', fontFamily: 'monospace', fontSize: 10 },
            },
            legend: {
                show: true,
                top: 0,
                right: '5%',
                textStyle: { color: '#888', fontFamily: 'monospace', fontSize: 10 },
                data: drivers.map(d => ({
                    name: `${d.code} Speed`,
                    icon: 'roundRect',
                    itemStyle: { color: d.color || '#ff6600' },
                })),
                formatter: (name: string) => name.replace(' Speed', ''),
            },
            axisPointer: { link: [{ xAxisIndex: 'all' }], snap: true },
            dataZoom: [
                { type: 'inside', xAxisIndex: [0, 1, 2, 3, 4] },
            ],
            grid: grids,
            xAxis: xAxes,
            yAxis: yAxes,
            series,
        };
    }, [drivers]);

    if (!drivers || drivers.length === 0) {
        return (
            <div className="w-full h-full flex items-center justify-center text-[#cc3333] bg-[#1a0505] border border-dashed border-[#cc3333] font-mono text-xs uppercase font-bold tracking-widest">
                [!] NO MULTI-DRIVER TELEMETRY DATA
            </div>
        );
    }

    // Driver legend bar
    return (
        <div className="flex flex-col h-full">
            {/* Driver Legend Strip */}
            <div className="flex items-center gap-3 px-3 py-1.5 bg-[#0e0e0e] border-b border-[#222] flex-wrap">
                {drivers.map(d => (
                    <div key={d.code} className="flex items-center gap-1.5 text-[10px] font-mono">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color || '#ff6600' }} />
                        <span className="text-[#ccc] font-bold">{d.code}</span>
                        <span className="text-[#555]">{d.meta.team}</span>
                        {d.meta.lap_time_str && (
                            <span className="text-[#777]">{d.meta.lap_time_str}</span>
                        )}
                        {d.meta.compound && (
                            <span className="text-[#555] bg-[#1a1a1a] px-1 border border-[#222]">{d.meta.compound}</span>
                        )}
                    </div>
                ))}
            </div>

            {/* Chart */}
            <div className="flex-1 min-h-0">
                <ReactECharts
                    option={option}
                    style={{ height: '100%', width: '100%' }}
                    notMerge={true}
                    lazyUpdate={true}
                    theme="dark"
                />
            </div>
        </div>
    );
}
