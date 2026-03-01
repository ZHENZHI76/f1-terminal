import React, { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';

export interface TelemetryDataPoint {
    D: number;
    Delta: number;
    A_Spd: number;
    B_Spd: number;
    A_Thr: number;
    B_Thr: number;
    A_Brk: number;
    B_Brk: number;
    A_Gear: number;
    B_Gear: number;
}

interface TelemetryChartProps {
    data: TelemetryDataPoint[];
    driverA: string;
    driverB: string;
    colorA?: string;
    colorB?: string;
}

export default function TelemetryChart({ data, driverA, driverB, colorA = '#ff2800', colorB = '#0600ef' }: TelemetryChartProps) {

    const option = useMemo(() => {
        if (!data || data.length === 0) return {};

        console.log("[TelemetryChart] Raw data received. Length:", data.length);
        if (data.length > 0) {
            console.log("[TelemetryChart] Sample Data Point 0:", data[0]);
        }

        const distances = data.map(d => d.D);
        const speedA = data.map(d => d.A_Spd);
        const throttleA = data.map(d => d.A_Thr);
        const brakeA = data.map(d => d.A_Brk);
        const gearA = data.map(d => d.A_Gear);

        // Check for Baseline single-driver mode vs Compare mode
        const isSingleDriver = data[0] && data[0].Delta === undefined;

        const speedB = isSingleDriver ? [] : data.map(d => d.B_Spd);
        const throttleB = isSingleDriver ? [] : data.map(d => d.B_Thr);
        const brakeB = isSingleDriver ? [] : data.map(d => d.B_Brk);
        const gearB = isSingleDriver ? [] : data.map(d => d.B_Gear);
        const deltaT = isSingleDriver ? [] : data.map(d => d.Delta);

        return {
            backgroundColor: 'transparent',
            animation: false,
            tooltip: {
                trigger: 'axis',
                axisPointer: { type: 'cross', animation: false, snap: true, label: { backgroundColor: '#333' } },
                backgroundColor: 'rgba(17, 17, 17, 0.9)',
                borderColor: '#333',
                textStyle: { color: '#ccc', fontFamily: 'monospace', fontSize: 10 }
            },
            legend: { show: false },
            axisPointer: { link: [{ xAxisIndex: 'all' }], snap: true },
            dataZoom: [
                { type: 'inside', xAxisIndex: isSingleDriver ? [0, 1, 2, 3] : [0, 1, 2, 3, 4] },
            ],
            visualMap: isSingleDriver ? undefined : {
                type: 'piecewise',
                show: false,
                seriesIndex: 0,
                pieces: [
                    { min: 0, color: colorB }, // If Delta > 0, A is slower (A falls behind B), so B color is on top
                    { max: 0, color: colorA }  // If Delta < 0, A is faster (A pulls ahead), show A color on bottom
                ]
            },
            grid: isSingleDriver ? [
                { left: '6%', right: '4%', top: '5%', height: '50%' }, // Speed
                { left: '6%', right: '4%', top: '60%', height: '15%' }, // Throttle
                { left: '6%', right: '4%', top: '78%', height: '8%' },  // Brake
                { left: '6%', right: '4%', top: '88%', height: '8%' }   // Gear
            ] : [
                { left: '6%', right: '4%', top: '5%', height: '18%' }, // Delta
                { left: '6%', right: '4%', top: '25%', height: '35%' }, // Speed
                { left: '6%', right: '4%', top: '63%', height: '10%' }, // Throttle
                { left: '6%', right: '4%', top: '75%', height: '8%' },  // Brake
                { left: '6%', right: '4%', top: '85%', height: '8%' }   // Gear
            ],
            xAxis: isSingleDriver ? [
                { type: 'category', data: distances, gridIndex: 0, axisLine: { lineStyle: { color: '#333' } }, axisLabel: { show: false }, splitLine: { show: true, lineStyle: { color: '#1a1a1a' } } },
                { type: 'category', data: distances, gridIndex: 1, axisLine: { lineStyle: { color: '#333' } }, axisLabel: { show: false }, splitLine: { show: true, lineStyle: { color: '#1a1a1a' } } },
                { type: 'category', data: distances, gridIndex: 2, axisLine: { lineStyle: { color: '#333' } }, axisLabel: { show: false }, splitLine: { show: true, lineStyle: { color: '#1a1a1a' } } },
                { type: 'category', data: distances, gridIndex: 3, axisLine: { lineStyle: { color: '#333' } }, axisLabel: { color: '#888', fontFamily: 'monospace', fontSize: 10 }, splitLine: { show: true, lineStyle: { color: '#1a1a1a' } } }
            ] : [
                { type: 'category', data: distances, gridIndex: 0, axisLine: { lineStyle: { color: '#333' } }, axisLabel: { show: false }, splitLine: { show: true, lineStyle: { color: '#1a1a1a' } } },
                { type: 'category', data: distances, gridIndex: 1, axisLine: { lineStyle: { color: '#333' } }, axisLabel: { show: false }, splitLine: { show: true, lineStyle: { color: '#1a1a1a' } } },
                { type: 'category', data: distances, gridIndex: 2, axisLine: { lineStyle: { color: '#333' } }, axisLabel: { show: false }, splitLine: { show: true, lineStyle: { color: '#1a1a1a' } } },
                { type: 'category', data: distances, gridIndex: 3, axisLine: { lineStyle: { color: '#333' } }, axisLabel: { show: false }, splitLine: { show: true, lineStyle: { color: '#1a1a1a' } } },
                { type: 'category', data: distances, gridIndex: 4, axisLine: { lineStyle: { color: '#333' } }, axisLabel: { color: '#888', fontFamily: 'monospace', fontSize: 10 }, splitLine: { show: true, lineStyle: { color: '#1a1a1a' } } }
            ],
            yAxis: isSingleDriver ? [
                { type: 'value', gridIndex: 0, name: 'KM/H', nameLocation: 'middle', nameGap: 30, nameTextStyle: { color: '#555', fontFamily: 'monospace', fontSize: 10 }, axisLabel: { color: '#888', fontSize: 10 }, splitLine: { show: true, lineStyle: { color: '#1a1a1a' } }, min: 'dataMin' },
                { type: 'value', gridIndex: 1, name: 'THR', nameLocation: 'middle', nameGap: 30, nameTextStyle: { color: '#555', fontFamily: 'monospace', fontSize: 10 }, axisLabel: { show: false }, splitLine: { show: true, lineStyle: { color: '#1a1a1a' } }, max: 100, min: 0 },
                { type: 'value', gridIndex: 2, name: 'BRK', nameLocation: 'middle', nameGap: 30, nameTextStyle: { color: '#555', fontFamily: 'monospace', fontSize: 10 }, axisLabel: { show: false }, splitLine: { show: true, lineStyle: { color: '#1a1a1a' } }, max: 1, min: 0 },
                { type: 'value', gridIndex: 3, name: 'GEAR', nameLocation: 'middle', nameGap: 30, nameTextStyle: { color: '#555', fontFamily: 'monospace', fontSize: 10 }, axisLabel: { color: '#888', fontSize: 10 }, splitLine: { show: true, lineStyle: { color: '#1a1a1a' } }, max: 8, min: 0, interval: 2 }
            ] : [
                { type: 'value', gridIndex: 0, name: 'ΔT (s)', nameLocation: 'middle', nameGap: 30, nameTextStyle: { color: '#555', fontFamily: 'monospace', fontSize: 10 }, axisLabel: { color: '#888', fontSize: 10 }, splitLine: { show: true, lineStyle: { color: '#1a1a1a' } } },
                { type: 'value', gridIndex: 1, name: 'KM/H', nameLocation: 'middle', nameGap: 30, nameTextStyle: { color: '#555', fontFamily: 'monospace', fontSize: 10 }, axisLabel: { color: '#888', fontSize: 10 }, splitLine: { show: true, lineStyle: { color: '#1a1a1a' } }, min: 'dataMin' },
                { type: 'value', gridIndex: 2, name: 'THR', nameLocation: 'middle', nameGap: 30, nameTextStyle: { color: '#555', fontFamily: 'monospace', fontSize: 10 }, axisLabel: { show: false }, splitLine: { show: true, lineStyle: { color: '#1a1a1a' } }, max: 100, min: 0 },
                { type: 'value', gridIndex: 3, name: 'BRK', nameLocation: 'middle', nameGap: 30, nameTextStyle: { color: '#555', fontFamily: 'monospace', fontSize: 10 }, axisLabel: { show: false }, splitLine: { show: true, lineStyle: { color: '#1a1a1a' } }, max: 1, min: 0 },
                { type: 'value', gridIndex: 4, name: 'GEAR', nameLocation: 'middle', nameGap: 30, nameTextStyle: { color: '#555', fontFamily: 'monospace', fontSize: 10 }, axisLabel: { color: '#888', fontSize: 10 }, splitLine: { show: true, lineStyle: { color: '#1a1a1a' } }, max: 8, min: 0, interval: 2 }
            ],
            series: isSingleDriver ? [
                { name: `${driverA} Speed`, type: 'line', xAxisIndex: 0, yAxisIndex: 0, data: speedA, showSymbol: false, sampling: 'lttb', lineStyle: { color: colorA, width: 2 }, itemStyle: { color: colorA } },
                { name: `${driverA} Throttle`, type: 'line', xAxisIndex: 1, yAxisIndex: 1, data: throttleA, showSymbol: false, sampling: 'lttb', lineStyle: { color: colorA, width: 1 }, areaStyle: { color: colorA, opacity: 0.1 }, itemStyle: { color: colorA } },
                { name: `${driverA} Brake`, type: 'line', step: 'end', xAxisIndex: 2, yAxisIndex: 2, data: brakeA, showSymbol: false, sampling: 'lttb', lineStyle: { color: colorA, width: 1.5 }, itemStyle: { color: colorA } },
                { name: `${driverA} Gear`, type: 'line', step: 'end', xAxisIndex: 3, yAxisIndex: 3, data: gearA, showSymbol: false, sampling: 'lttb', lineStyle: { color: colorA, width: 1.5 }, itemStyle: { color: colorA } }
            ] : [
                // 0. Delta Time
                {
                    name: `Delta Time`, type: 'line', xAxisIndex: 0, yAxisIndex: 0, data: deltaT, showSymbol: false, sampling: 'lttb',
                    lineStyle: { width: 1.5 }, // VisualMap colors this automatically
                    itemStyle: { color: '#fff' }
                },
                // 1. Speed
                { name: `${driverA} Speed`, type: 'line', xAxisIndex: 1, yAxisIndex: 1, data: speedA, showSymbol: false, sampling: 'lttb', lineStyle: { color: colorA, width: 2 }, itemStyle: { color: colorA } },
                { name: `${driverB} Speed`, type: 'line', xAxisIndex: 1, yAxisIndex: 1, data: speedB, showSymbol: false, sampling: 'lttb', lineStyle: { color: colorB, width: 2 }, itemStyle: { color: colorB } },
                // 2. Throttle
                { name: `${driverA} Throttle`, type: 'line', xAxisIndex: 2, yAxisIndex: 2, data: throttleA, showSymbol: false, sampling: 'lttb', lineStyle: { color: colorA, width: 1 }, areaStyle: { color: colorA, opacity: 0.1 }, itemStyle: { color: colorA } },
                { name: `${driverB} Throttle`, type: 'line', xAxisIndex: 2, yAxisIndex: 2, data: throttleB, showSymbol: false, sampling: 'lttb', lineStyle: { color: colorB, width: 1 }, areaStyle: { color: colorB, opacity: 0.1 }, itemStyle: { color: colorB } },
                // 3. Brake
                { name: `${driverA} Brake`, type: 'line', step: 'end', xAxisIndex: 3, yAxisIndex: 3, data: brakeA, showSymbol: false, sampling: 'lttb', lineStyle: { color: colorA, width: 1.5 }, itemStyle: { color: colorA } },
                { name: `${driverB} Brake`, type: 'line', step: 'end', xAxisIndex: 3, yAxisIndex: 3, data: brakeB, showSymbol: false, sampling: 'lttb', lineStyle: { color: colorB, width: 1.5 }, itemStyle: { color: colorB } },
                // 4. Gear
                { name: `${driverA} Gear`, type: 'line', step: 'end', xAxisIndex: 4, yAxisIndex: 4, data: gearA, showSymbol: false, sampling: 'lttb', lineStyle: { color: colorA, width: 1.5 }, itemStyle: { color: colorA } },
                { name: `${driverB} Gear`, type: 'line', step: 'end', xAxisIndex: 4, yAxisIndex: 4, data: gearB, showSymbol: false, sampling: 'lttb', lineStyle: { color: colorB, width: 1.5 }, itemStyle: { color: colorB } }
            ]
        };
    }, [data, driverA, driverB, colorA, colorB]);

    if (!data || data.length === 0) {
        return (
            <div className="w-full h-full flex items-center justify-center text-gray-600 font-mono text-xs">
                &lt; NO TELEMETRY DATA &gt;
            </div>
        );
    }

    return (
        <ReactECharts
            option={option}
            style={{ height: '100%', width: '100%' }}
            notMerge={true}
            lazyUpdate={true}
            theme="dark" // Baseline terminal aesthetic
        />
    );
}
