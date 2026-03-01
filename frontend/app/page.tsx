"use client";

import React from "react";
import TerminalCLI from "@/components/TerminalCLI";
import GridWorkspace from "@/components/GridWorkspace";

export default function Home() {
  return (
    <main className="flex h-screen w-screen flex-col bg-black overflow-hidden font-mono antialiased">
      {/* Top CLI Input Bar */}
      <TerminalCLI />

      {/* Remaining Real Estate for Dynamic Workspaces */}
      <div className="flex-1 overflow-hidden relative border-t border-gray-900">
        <GridWorkspace />
      </div>
    </main>
  );
}
