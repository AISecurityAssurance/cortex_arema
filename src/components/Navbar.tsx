"use client";

import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";
import { cn } from "@/lib/utils";

export function Navbar() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const html = document.documentElement;
    html.classList.toggle("dark", dark);
  }, [dark]);

  return (
    <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
        <h1 className="text-lg font-semibold tracking-tight">Cortex Arena</h1>
        <button
          aria-label="Toggle dark mode"
          onClick={() => setDark((prev) => !prev)}
          className={cn(
            "rounded-full p-2 border bg-card shadow hover:bg-muted/50 transition-colors"
          )}
        >
          <span className="relative flex items-center justify-center w-6 h-6">
            <Sun
              className={cn(
                "absolute transition-all duration-300",
                dark ? "opacity-0 scale-75 rotate-90" : "opacity-100 scale-100"
              )}
              size={22}
            />
            <Moon
              className={cn(
                "absolute transition-all duration-300",
                dark ? "opacity-100 scale-100" : "opacity-0 scale-75 -rotate-90"
              )}
              size={22}
            />
          </span>
        </button>
      </div>
    </header>
  );
}
