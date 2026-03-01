import React from 'react';

interface DataGridWidgetProps {
    data: any[];
}

export default function DataGridWidget({ data }: DataGridWidgetProps) {
    if (!data || data.length === 0) {
        return (
            <div className="w-full h-full flex items-center justify-center text-[#ff2800] bg-[#1a0505] border border-dashed border-[#ff2800] font-mono text-xs uppercase font-bold tracking-widest">
                [!] NO DATA OR EMPTY ARRAY
            </div>
        );
    }

    // Extract dynamic headers from the first object
    const headers = Object.keys(data[0]);

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
