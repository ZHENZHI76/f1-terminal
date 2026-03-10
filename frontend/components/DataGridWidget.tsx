import React from 'react';

interface DataGridWidgetProps {
    data: any[];
}

export default function DataGridWidget({ data }: DataGridWidgetProps) {
    // Robust null-safety: handle null, undefined, non-array, empty array
    if (!data) {
        return (
            <div className="w-full h-full flex items-center justify-center text-[#ff2800] bg-[#1a0505] border border-dashed border-[#ff2800] font-mono text-xs uppercase font-bold tracking-widest">
                [!] NO DATA RECEIVED
            </div>
        );
    }

    // If data is an object (not array), try to display it as a key-value table
    if (!Array.isArray(data)) {
        const entries = Object.entries(data).filter(([, v]) => v !== null && v !== undefined);
        if (entries.length === 0) {
            return (
                <div className="w-full h-full flex items-center justify-center text-[#ff2800] bg-[#1a0505] border border-dashed border-[#ff2800] font-mono text-xs uppercase font-bold tracking-widest">
                    [!] EMPTY DATA OBJECT
                </div>
            );
        }
        // Render nested object as formatted JSON grid
        const flatRows = entries.map(([key, val]) => ({
            field: key,
            value: typeof val === 'object' ? JSON.stringify(val) : String(val),
        }));
        return (
            <div className="w-full h-full overflow-auto bg-[#050505]">
                <table className="w-full text-left border-collapse font-mono text-[10px] md:text-xs">
                    <thead className="sticky top-0 bg-[#111] border-b border-[#333] z-10 shadow-md">
                        <tr>
                            <th className="py-2 px-3 text-gray-400 font-bold uppercase tracking-wider whitespace-nowrap">FIELD</th>
                            <th className="py-2 px-3 text-gray-400 font-bold uppercase tracking-wider whitespace-nowrap">VALUE</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[#222]">
                        {flatRows.map((row, i) => (
                            <tr key={i} className="hover:bg-[#1a1a1a] transition-colors">
                                <td className="py-1.5 px-3 whitespace-nowrap text-[#ff6600] font-bold">{row.field}</td>
                                <td className="py-1.5 px-3 whitespace-pre-wrap text-gray-300 max-w-[600px] break-all">{row.value}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    }

    if (data.length === 0) {
        return (
            <div className="w-full h-full flex items-center justify-center text-[#ff2800] bg-[#1a0505] border border-dashed border-[#ff2800] font-mono text-xs uppercase font-bold tracking-widest">
                [!] NO DATA OR EMPTY ARRAY
            </div>
        );
    }

    // Extract dynamic headers from the first object (with null safety)
    const firstItem = data[0];
    if (!firstItem || typeof firstItem !== 'object') {
        return (
            <div className="w-full h-full flex items-center justify-center text-[#ff2800] bg-[#1a0505] border border-dashed border-[#ff2800] font-mono text-xs uppercase font-bold tracking-widest">
                [!] INVALID DATA FORMAT
            </div>
        );
    }
    const headers = Object.keys(firstItem);

    return (
        <div className="w-full h-full overflow-auto bg-[#050505]">
            <table className="w-full text-left border-collapse font-mono text-[10px] md:text-xs">
                <thead className="sticky top-0 bg-[#111] border-b border-[#333] z-10 shadow-md">
                    <tr>
                        {headers.map((header) => (
                            <th
                                key={header}
                                className="py-2 px-3 text-gray-400 font-bold uppercase tracking-wider whitespace-nowrap"
                            >
                                {header}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-[#222]">
                    {data.map((row, rowIndex) => (
                        <tr
                            key={rowIndex}
                            className="hover:bg-[#1a1a1a] transition-colors"
                        >
                            {headers.map((header) => {
                                const val = row[header];
                                let displayVal = val;
                                let colorClass = "text-gray-300";

                                // Custom Formatting Rules
                                if (typeof val === 'boolean') {
                                    displayVal = val ? 'TRUE' : 'FALSE';
                                    colorClass = val ? 'text-[#00ff41] font-bold' : 'text-[#ff2800] font-bold';
                                } else if (val === null || val === undefined || val === 'N/A') {
                                    displayVal = 'N/A';
                                    colorClass = 'text-gray-600';
                                } else if (typeof val === 'number') {
                                    // Slight diming for numbers to distinguish from string fields
                                    displayVal = val.toLocaleString(undefined, { maximumFractionDigits: 4 });
                                    colorClass = 'text-gray-400';
                                }

                                return (
                                    <td
                                        key={`${rowIndex}-${header}`}
                                        className={`py-1.5 px-3 whitespace-nowrap ${colorClass}`}
                                    >
                                        {displayVal}
                                    </td>
                                );
                            })}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
