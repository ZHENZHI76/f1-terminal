import React, { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';

export interface TelemetryDataPoint {
    D: number;
    Delta?: number;
    A_Spd: number;
    B_Spd?: number;
    A_Thr: number;
    B_Thr?: number;
    A_Brk: number;
    B_Brk?: number;
    A_Gear: number;
    B_Gear?: number;
    A_RPM: number;
    B_RPM?: number;
    A_DRS: number;
    B_DRS?: number;
}

interface TelemetryChartProps {
    data: TelemetryDataPoint[];
    driverA: string;
    driverB?: string;
    colorA?: string;
    colorB?: string;
}

export default function TelemetryChart({ data, driverA, driverB, colorA = '#ff2800', colorB = '#0600ef' }: TelemetryChartProps) {

    const option = useMemo(() => {
        if (!data || data.length === 0) return {};

        // Check for Baseline single-driver mode vs Compare mode
        const isSingleDriver = !driverB || data[0]?.Delta === undefined;

        // Map data to explicit 2D coordinate tuples for native LTTB downsampling
        const speedA = data.map(d => [d.D, d.A_Spd]);
        const rpmA = data.map(d => [d.D, d.A_RPM]);
        const throttleA = data.map(d => [d.D, d.A_Thr]);
        const brakeA = data.map(d => [d.D, d.A_Brk]);
        const gearA = data.map(d => [d.D, d.A_Gear]);
        const drsA = data.map(d => [d.D, d.A_DRS]);

        const speedB = isSingleDriver ? [] : data.map(d => [d.D, d.B_Spd]);
        const rpmB = isSingleDriver ? [] : data.map(d => [d.D, d.B_RPM]);
        const throttleB = isSingleDriver ? [] : data.map(d => [d.D, d.B_Thr]);
        const brakeB = isSingleDriver ? [] : data.map(d => [d.D, d.B_Brk]);
        const gearB = isSingleDriver ? [] : data.map(d => [d.D, d.B_Gear]);
        const drsB = isSingleDriver ? [] : data.map(d => [d.D, d.B_DRS]);
        const deltaT = isSingleDriver ? [] : data.map(d => [d.D, d.Delta]);

        const xAxisCommon = {
            type: 'value', // Extremely critical: D is a continuous distance vector, not categorical
            min: 'dataMin',
            max: 'dataMax',
            axisLine: { lineStyle: { color: '#333' } },
            splitLine: { show: true, lineStyle: { color: '#1a1a1a' } }
        };

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
                { type: 'inside', xAxisIndex: isSingleDriver ? [0, 1, 2, 3, 4, 5] : [0, 1, 2, 3, 4, 5, 6] },
            ],
            visualMap: isSingleDriver ? undefined : {
                type: 'piecewise',
                show: false,
                seriesIndex: 0,
                dimension: 'Delta',
                pieces: [
                    { min: 0, color: colorB },
                    { max: 0, color: colorA }
                ]
            },
            grid: isSingleDriver ? [ // 6-Grid Stack for Single Driver Mode
                { left: '6%', right: '4%', top: '5%', height: '35%' }, // Speed
                { left: '6%', right: '4%', top: '44%', height: '16%' }, // RPM
                { left: '6%', right: '4%', top: '64%', height: '10%' }, // Throttle
                { left: '6%', right: '4%', top: '78%', height: '6%' },  // Brake
                { left: '6%', right: '4%', top: '88%', height: '6%' },   // Gear
                { left: '6%', right: '4%', top: '95%', height: '3%' }    // DRS
            ] : [ // 7-Grid Stack for Compare Mode
                { left: '6%', right: '4%', top: '3%', height: '12%' }, // Delta
                { left: '6%', right: '4%', top: '18%', height: '25%' }, // Speed
                { left: '6%', right: '4%', top: '46%', height: '15%' }, // RPM
                { left: '6%', right: '4%', top: '64%', height: '8%' },  // Throttle
                { left: '6%', right: '4%', top: '75%', height: '8%' },  // Brake
                { left: '6%', right: '4%', top: '85%', height: '6%' },  // Gear
                { left: '6%', right: '4%', top: '93%', height: '4%' }   // DRS
            ],
            xAxis: isSingleDriver ? [
                { ...xAxisCommon, gridIndex: 0, axisLabel: { show: false } }, // Spd
                { ...xAxisCommon, gridIndex: 1, axisLabel: { show: false } }, // Rpm
                { ...xAxisCommon, gridIndex: 2, axisLabel: { show: false } }, // Thr
                { ...xAxisCommon, gridIndex: 3, axisLabel: { show: false } }, // Brk
                { ...xAxisCommon, gridIndex: 4, axisLabel: { show: false } }, // Gear
                { ...xAxisCommon, gridIndex: 5, axisLabel: { color: '#888', fontFamily: 'monospace', fontSize: 10 } } // Drs
            ] : [
                { ...xAxisCommon, gridIndex: 0, axisLabel: { show: false } }, // Del
                { ...xAxisCommon, gridIndex: 1, axisLabel: { show: false } }, // Spd
                { ...xAxisCommon, gridIndex: 2, axisLabel: { show: false } }, // Rpm
                { ...xAxisCommon, gridIndex: 3, axisLabel: { show: false } }, // Thr
                { ...xAxisCommon, gridIndex: 4, axisLabel: { show: false } }, // Brk
                { ...xAxisCommon, gridIndex: 5, axisLabel: { show: false } }, // Gear
                { ...xAxisCommon, gridIndex: 6, axisLabel: { color: '#888', fontFamily: 'monospace', fontSize: 10 } } // Drs
            ],
            yAxis: isSingleDriver ? [
                { type: 'value', gridIndex: 0, name: 'KM/H', nameLocation: 'middle', nameGap: 30, nameTextStyle: { color: '#555', fontFamily: 'monospace', fontSize: 10 }, axisLabel: { color: '#888', fontSize: 10 }, splitLine: { show: true, lineStyle: { color: '#1a1a1a' } }, min: 'dataMin' },
                { type: 'value', gridIndex: 1, name: 'RPM', nameLocation: 'middle', nameGap: 30, nameTextStyle: { color: '#555', fontFamily: 'monospace', fontSize: 10 }, axisLabel: { color: '#888', fontSize: 10 }, splitLine: { show: true, lineStyle: { color: '#1a1a1a' } }, min: 'dataMin' },
                { type: 'value', gridIndex: 2, name: 'THR', nameLocation: 'middle', nameGap: 30, nameTextStyle: { color: '#555', fontFamily: 'monospace', fontSize: 10 }, axisLabel: { show: false }, splitLine: { show: true, lineStyle: { color: '#1a1a1a' } }, max: 100, min: 0 },
                { type: 'value', gridIndex: 3, name: 'BRK', nameLocation: 'middle', nameGap: 30, nameTextStyle: { color: '#555', fontFamily: 'monospace', fontSize: 10 }, axisLabel: { show: false }, splitLine: { show: true, lineStyle: { color: '#1a1a1a' } }, max: 1, min: 0 },
                { type: 'value', gridIndex: 4, name: 'GEAR', nameLocation: 'middle', nameGap: 30, nameTextStyle: { color: '#555', fontFamily: 'monospace', fontSize: 10 }, axisLabel: { color: '#888', fontSize: 10 }, splitLine: { show: true, lineStyle: { color: '#1a1a1a' } }, max: 8, min: 0, interval: 2 },
                { type: 'value', gridIndex: 5, name: 'DRS', nameLocation: 'middle', nameGap: 30, nameTextStyle: { color: '#555', fontFamily: 'monospace', fontSize: 10 }, axisLabel: { show: false }, splitLine: { show: true, lineStyle: { color: '#1a1a1a' } }, max: 14, min: 0 }
            ] : [
                { type: 'value', gridIndex: 0, name: 'ΔT (s)', nameLocation: 'middle', nameGap: 30, nameTextStyle: { color: '#555', fontFamily: 'monospace', fontSize: 10 }, axisLabel: { color: '#888', fontSize: 10 }, splitLine: { show: true, lineStyle: { color: '#1a1a1a' } } },
                { type: 'value', gridIndex: 1, name: 'KM/H', nameLocation: 'middle', nameGap: 30, nameTextStyle: { color: '#555', fontFamily: 'monospace', fontSize: 10 }, axisLabel: { color: '#888', fontSize: 10 }, splitLine: { show: true, lineStyle: { color: '#1a1a1a' } }, min: 'dataMin' },
                { type: 'value', gridIndex: 2, name: 'RPM', nameLocation: 'middle', nameGap: 30, nameTextStyle: { color: '#555', fontFamily: 'monospace', fontSize: 10 }, axisLabel: { color: '#888', fontSize: 10 }, splitLine: { show: true, lineStyle: { color: '#1a1a1a' } }, min: 'dataMin' },
                { type: 'value', gridIndex: 3, name: 'THR', nameLocation: 'middle', nameGap: 30, nameTextStyle: { color: '#555', fontFamily: 'monospace', fontSize: 10 }, axisLabel: { show: false }, splitLine: { show: true, lineStyle: { color: '#1a1a1a' } }, max: 100, min: 0 },
                { type: 'value', gridIndex: 4, name: 'BRK', nameLocation: 'middle', nameGap: 30, nameTextStyle: { color: '#555', fontFamily: 'monospace', fontSize: 10 }, axisLabel: { show: false }, splitLine: { show: true, lineStyle: { color: '#1a1a1a' } }, max: 1, min: 0 },
                { type: 'value', gridIndex: 5, name: 'GEAR', nameLocation: 'middle', nameGap: 30, nameTextStyle: { color: '#555', fontFamily: 'monospace', fontSize: 10 }, axisLabel: { color: '#888', fontSize: 10 }, splitLine: { show: true, lineStyle: { color: '#1a1a1a' } }, max: 8, min: 0, interval: 2 },
                { type: 'value', gridIndex: 6, name: 'DRS', nameLocation: 'middle', nameGap: 30, nameTextStyle: { color: '#555', fontFamily: 'monospace', fontSize: 10 }, axisLabel: { show: false }, splitLine: { show: true, lineStyle: { color: '#1a1a1a' } }, max: 14, min: 0 }
            ],
            // 3. Explicitly pass mapped 2D coordinate arrays
            series: isSingleDriver ? [
                { name: `${driverA} Speed`, type: 'line', xAxisIndex: 0, yAxisIndex: 0, data: speedA, showSymbol: false, sampling: 'lttb', lineStyle: { color: colorA, width: 1.5 }, itemStyle: { color: colorA } },
                { name: `${driverA} RPM`, type: 'line', xAxisIndex: 1, yAxisIndex: 1, data: rpmA, showSymbol: false, sampling: 'lttb', lineStyle: { color: colorA, width: 1.5 }, itemStyle: { color: colorA } },
                { name: `${driverA} Throttle`, type: 'line', xAxisIndex: 2, yAxisIndex: 2, data: throttleA, showSymbol: false, sampling: 'lttb', lineStyle: { color: colorA, width: 1.5 }, itemStyle: { color: colorA } },
                { name: `${driverA} Brake`, type: 'line', step: 'end', xAxisIndex: 3, yAxisIndex: 3, data: brakeA, showSymbol: false, sampling: 'lttb', lineStyle: { color: colorA, width: 1.5 }, itemStyle: { color: colorA } },
                { name: `${driverA} Gear`, type: 'line', step: 'end', xAxisIndex: 4, yAxisIndex: 4, data: gearA, showSymbol: false, sampling: 'lttb', lineStyle: { color: colorA, width: 1.5 }, itemStyle: { color: colorA } },
                { name: `${driverA} DRS`, type: 'line', step: 'end', xAxisIndex: 5, yAxisIndex: 5, data: drsA, showSymbol: false, sampling: 'lttb', lineStyle: { color: colorA, width: 1.5 }, itemStyle: { color: colorA } }
            ] : [
                // 0. Delta Time
                {
                    name: `Delta Time`, type: 'line', xAxisIndex: 0, yAxisIndex: 0, data: deltaT, showSymbol: false, sampling: 'lttb',
                    lineStyle: { width: 1.5 }, // VisualMap colors this automatically
                    itemStyle: { color: '#fff' }
                },
                // 1. Speed
                { name: `${driverA} Speed`, type: 'line', xAxisIndex: 1, yAxisIndex: 1, data: speedA, showSymbol: false, sampling: 'lttb', lineStyle: { color: colorA, width: 1.5 }, itemStyle: { color: colorA } },
                { name: `${driverB} Speed`, type: 'line', xAxisIndex: 1, yAxisIndex: 1, data: speedB, showSymbol: false, sampling: 'lttb', lineStyle: { color: colorB, width: 1.5 }, itemStyle: { color: colorB } },
                // 2. RPM
                { name: `${driverA} RPM`, type: 'line', xAxisIndex: 2, yAxisIndex: 2, data: rpmA, showSymbol: false, sampling: 'lttb', lineStyle: { color: colorA, width: 1.5 }, itemStyle: { color: colorA } },
                { name: `${driverB} RPM`, type: 'line', xAxisIndex: 2, yAxisIndex: 2, data: rpmB, showSymbol: false, sampling: 'lttb', lineStyle: { color: colorB, width: 1.5 }, itemStyle: { color: colorB } },
                // 3. Throttle
                { name: `${driverA} Throttle`, type: 'line', xAxisIndex: 3, yAxisIndex: 3, data: throttleA, showSymbol: false, sampling: 'lttb', lineStyle: { color: colorA, width: 1.5 }, itemStyle: { color: colorA } },
                { name: `${driverB} Throttle`, type: 'line', xAxisIndex: 3, yAxisIndex: 3, data: throttleB, showSymbol: false, sampling: 'lttb', lineStyle: { color: colorB, width: 1.5 }, itemStyle: { color: colorB } },
                // 4. Brake
                { name: `${driverA} Brake`, type: 'line', step: 'end', xAxisIndex: 4, yAxisIndex: 4, data: brakeA, showSymbol: false, sampling: 'lttb', lineStyle: { color: colorA, width: 1.5 }, itemStyle: { color: colorA } },
                { name: `${driverB} Brake`, type: 'line', step: 'end', xAxisIndex: 4, yAxisIndex: 4, data: brakeB, showSymbol: false, sampling: 'lttb', lineStyle: { color: colorB, width: 1.5 }, itemStyle: { color: colorB } },
                // 5. Gear
                { name: `${driverA} Gear`, type: 'line', step: 'end', xAxisIndex: 5, yAxisIndex: 5, data: gearA, showSymbol: false, sampling: 'lttb', lineStyle: { color: colorA, width: 1.5 }, itemStyle: { color: colorA } },
                { name: `${driverB} Gear`, type: 'line', step: 'end', xAxisIndex: 5, yAxisIndex: 5, data: gearB, showSymbol: false, sampling: 'lttb', lineStyle: { color: colorB, width: 1.5 }, itemStyle: { color: colorB } },
                // 6. DRS
                { name: `${driverA} DRS`, type: 'line', step: 'end', xAxisIndex: 6, yAxisIndex: 6, data: drsA, showSymbol: false, sampling: 'lttb', lineStyle: { color: colorA, width: 1.5 }, itemStyle: { color: colorA } },
                { name: `${driverB} DRS`, type: 'line', step: 'end', xAxisIndex: 6, yAxisIndex: 6, data: drsB, showSymbol: false, sampling: 'lttb', lineStyle: { color: colorB, width: 1.5 }, itemStyle: { color: colorB } }
            ]
        };
    }, [data, driverA, driverB, colorA, colorB]);

    // 1. 强力防御空对象渲染
    if (!data || data.length === 0) {
        return (
            <div className="w-full h-full flex items-center justify-center text-[#ff2800] bg-[#1a0505] border border-dashed border-[#ff2800] font-mono text-xs uppercase font-bold tracking-widest">
                [!] NO TELEMETRY DATA OR INVALID PAYLOAD
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
