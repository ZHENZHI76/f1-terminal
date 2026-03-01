"use client";

import React, { useState, useEffect } from "react";
import { Responsive, Layout } from "react-grid-layout";
import { useTerminalStore } from "@/store/terminalStore";
import WidgetContainer from "./WidgetContainer";

export default function GridWorkspace() {
    const { widgets, updateLayout } = useTerminalStore();
    const [isMobile, setIsMobile] = useState(false);
    const [containerWidth, setContainerWidth] = useState(1200);

    useEffect(() => {
        const checkResponsive = () => {
            setIsMobile(window.innerWidth < 768);
            const el = document.getElementById("grid-workspace-container");
            if (el) {
                setContainerWidth(el.clientWidth);
            } else {
                setContainerWidth(window.innerWidth);
            }
        };
        // Initial check
        checkResponsive();
        window.addEventListener('resize', checkResponsive);
        setTimeout(checkResponsive, 100); // safety catch after mount
        return () => window.removeEventListener('resize', checkResponsive);
    }, []);

    const handleLayoutChange = (newLayout: any) => {
        updateLayout(newLayout);
    };

    return (
        <div id="grid-workspace-container" className="w-full h-full p-2 overflow-auto"
            style={{
                backgroundColor: '#050505',
                backgroundImage: 'radial-gradient(circle, #1a1a1a 1px, transparent 1px)',
                backgroundSize: '24px 24px'
            }}
        >
            {/* 
        Container for react-grid-layout setup.
        We handle width manually via ResizeObserver loop.
      */}
            <div className="text-gray-600 text-xs mb-2 font-mono ml-2">
                <span className="text-neon-ferrari-red">ZUSTAND WORKSPACE:</span> ONLINE
                <span className="ml-4 text-[#888]">
                    ACTIVE WIDGETS: <span className="text-neon-mercedes-silver font-bold">{widgets.length}</span>
                </span>
            </div>

            <Responsive
                className="layout"
                width={containerWidth}
                layouts={{ lg: widgets.map(w => w.layout as any) }}
                breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
                cols={{ lg: 12, md: 10, sm: 6, xs: 2, xxs: 1 }}
                rowHeight={30}
                onLayoutChange={handleLayoutChange}
                // @ts-ignore - mismatch in community types for draggableHandle
                draggableHandle=".drag-handle"
                isDraggable={!isMobile}
                isResizable={!isMobile}
                compactType={null}
                preventCollision={false}
                resizeHandles={['s', 'w', 'e', 'n', 'sw', 'nw', 'se', 'ne']}
                margin={[8, 8]}
            >
                {widgets.map(widget => (
                    <div key={widget.id} className="react-grid-item">
                        {/* On mobile devices, force 100% width if react-grid-layout doesn't collapse optimally */}
                        <div className="w-full h-full">
                            <WidgetContainer widget={widget} />
                        </div>
                    </div>
                ))}
            </Responsive>
        </div>
    );
}
