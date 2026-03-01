import { create } from 'zustand';

export type WidgetType = 'TEL' | 'MAP_SPD' | 'MAP_GEAR' | 'STRAT' | 'STINT' | 'GG' | 'DOM' | 'INSIGHT';

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
}

interface TerminalState {
    widgets: Widget[];
    addWidget: (type: WidgetType, params: string[], defaultLayout: Omit<WidgetLayout, 'i'>) => void;
    removeWidget: (id: string) => void;
    updateLayout: (newLayout: WidgetLayout[]) => void;
    clearAll: () => void;
}

export const useTerminalStore = create<TerminalState>((set) => ({
    widgets: [],

    addWidget: (type, params, defaultLayout) => set((state) => {
        const id = `${type}-${Date.now()}`; // Generate unique collision-free ID
        const newWidget: Widget = {
            id,
            type,
            params,
            layout: { ...defaultLayout, i: id }
        };
        return { widgets: [...state.widgets, newWidget] };
    }),

    removeWidget: (id) => set((state) => ({
        widgets: state.widgets.filter(w => w.id !== id)
    })),

    updateLayout: (newLayout) => set((state) => {
        // Map the new incoming RGL layout array onto our widgets state
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
}));
