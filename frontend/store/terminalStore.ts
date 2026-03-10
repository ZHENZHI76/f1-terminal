import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type WidgetType = 'TEL' | 'MAP_SPD' | 'MAP_GEAR' | 'STRAT' | 'STINT' | 'GG' | 'DOM' | 'INSIGHT' | 'WEATHER' | 'MSG' | 'RES' | 'SEC' | 'DRIVERS' | 'QUAL' | 'POS' | 'PITSTOP' | 'WDC' | 'WCC' | 'LAPS' | 'SCHEDULE' | 'PACE' | 'CIRCUIT' | 'GAP' | 'TOPSPEED' | 'TYRE' | 'H2H';

export interface WidgetLayout {
    i: string;
    x: number;
    y: number;
    w: number;
    h: number;
    minW?: number;
    minH?: number;
}

export interface Widget {
    id: string;         // Unique ID for the widget instance
    type: WidgetType;   // Determines the component to render
    params: string[];   // Raw parameters parsed from CLI 
    layout: WidgetLayout;
    viewMode?: 'chart' | 'raw'; // Used to polymorphic dispatch to DataGridWidget
}

interface TerminalState {
    widgets: Widget[];
    addWidget: (type: WidgetType, params: string[], defaultLayout: Omit<WidgetLayout, 'i'>, viewMode?: 'chart' | 'raw') => void;
    removeWidget: (id: string) => void;
    updateLayout: (newLayout: WidgetLayout[]) => void;
    clearAll: () => void;
}

export const useTerminalStore = create<TerminalState>()(
    persist(
        (set) => ({
            widgets: [],

            addWidget: (type, params, defaultLayout, viewMode) => set((state) => {
                const id = `${type}-${Date.now()}`;
                const newWidget: Widget = {
                    id,
                    type,
                    params,
                    layout: { ...defaultLayout, i: id },
                    viewMode
                };
                return { widgets: [...state.widgets, newWidget] };
            }),

            removeWidget: (id) => set((state) => ({
                widgets: state.widgets.filter(w => w.id !== id)
            })),

            updateLayout: (newLayout) => set((state) => {
                const updatedWidgets = state.widgets.map(widget => {
                    const runtimeLayout = newLayout.find(l => l.i === widget.id);
                    if (runtimeLayout) {
                        return { ...widget, layout: runtimeLayout };
                    }
                    return widget;
                });
                return { widgets: updatedWidgets };
            }),

            clearAll: () => set({ widgets: [] })
        }),
        {
            name: 'f1-terminal-workspace',  // localStorage key
            version: 1,                     // Schema version for future migrations
            partialize: (state) => ({
                // Only persist widget definitions, NOT store functions
                widgets: state.widgets
            }),
        }
    )
);
