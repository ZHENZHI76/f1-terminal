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
        checkResponsive();
        window.addEventListener('resize', checkResponsive);
        setTimeout(checkResponsive, 100);
        return () => window.removeEventListener('resize', checkResponsive);
    }, []);

    const handleLayoutChange = (newLayout: any) => {
        updateLayout(newLayout);
    };

    return (
        <div id="grid-workspace-container" className="w-full h-full bloomberg-grid-bg overflow-auto">
            {/* Workspace Status Bar */}
            <div className="sticky top-0 z-30 bg-[#050505]/90 backdrop-blur-sm border-b border-[#1a1a1a] px-3 py-1 flex justify-between items-center">
                <div className="text-[10px] font-mono tracking-wider">
                    <span className="text-[#333]">WORKSPACE</span>
                    <span className="text-[#00ff41] ml-2">●</span>
                    <span className="text-[#555] ml-1">LIVE</span>
                    <span className="text-[#222] mx-3">|</span>
                    <span className="text-[#333]">PANELS:</span>
                    <span className="text-[#ccc] font-bold ml-1">{widgets.length}</span>
                </div>
                <div className="text-[9px] text-[#333] font-mono tracking-wider hidden sm:block">
                    DRAG HEADER TO MOVE · EDGES TO RESIZE
                </div>
            </div>

            {/* Layout Engine */}
            <div className="p-1">
                <Responsive
                    className="layout"
                    width={containerWidth}
                    layouts={{ lg: widgets.map(w => w.layout as any) }}
                    breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
                    cols={{ lg: 12, md: 10, sm: 6, xs: 2, xxs: 1 }}
                    rowHeight={30}
                    onLayoutChange={handleLayoutChange}
                    // @ts-ignore
                    draggableHandle=".drag-handle"
                    isDraggable={!isMobile}
                    isResizable={!isMobile}
                    compactType="vertical"
                    preventCollision={false}
                    margin={[6, 6]}
                    containerPadding={[4, 4]}
                    resizeHandles={['s', 'e', 'se', 'sw', 'w']}
                    useCSSTransforms={true}
                >
                    {widgets.map(widget => (
                        <div key={widget.id}>
                            <div className="w-full h-full">
                                <WidgetContainer widget={widget} />
                            </div>
                        </div>
                    ))}
                </Responsive>
            </div>
        </div>
    );
}
