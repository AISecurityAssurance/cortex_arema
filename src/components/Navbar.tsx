"use client";

import { AppDrawer } from "@/components/Drawer";

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <AppDrawer />
          <h1 className="text-lg font-semibold tracking-tight">Cortex Arena</h1>
        </div>
      </div>
    </header>
  );
}
