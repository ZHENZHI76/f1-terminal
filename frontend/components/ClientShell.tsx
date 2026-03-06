'use client';

import React from 'react';
import LoginGate from './LoginGate';
import TickerBar from './TickerBar';

/**
 * ClientShell wraps the entire application with:
 * 1. LoginGate → Bloomberg-style authentication barrier
 * 2. TickerBar → Top market data bar (only visible after auth)
 * This keeps layout.tsx as a pure server component.
 */
export default function ClientShell({ children }: { children: React.ReactNode }) {
    return (
        <LoginGate>
            <TickerBar />
            <div className="mt-8 h-[calc(100vh-2rem)] w-full overflow-hidden">
                {children}
            </div>
        </LoginGate>
    );
}
