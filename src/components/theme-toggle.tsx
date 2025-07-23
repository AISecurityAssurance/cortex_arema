// src/components/theme-toggle.tsx
"use client";

import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";
import { cn } from "@/lib/utils";

export function ThemeToggle() {
    const [dark, setDark] = useState(false);

    useEffect(() => {
        const html = document.documentElement;
        if (dark) html.classList.add("dark");
        else html.classList.remove("dark");
    }, [dark]);

    return (
        <div className="fixed top-4 right-6 z-50">
            <button
                aria-label="Toggle dark mode"
                onClick={() => setDark((d) => !d)}
                className={cn(
                    "rounded-full p-2 border bg-card shadow transition-colors",
                    "hover:bg-muted/50 focus:outline-none"
                )}
            >
                <span className="relative flex items-center justify-center w-6 h-6">
                    <Sun
                        className={cn(
                            "absolute transition-all duration-300",
                            dark ? "opacity-0 scale-75 rotate-90" : "opacity-100 scale-100 rotate-0"
                        )}
                        size={22}
                    />
                    <Moon
                        className={cn(
                            "absolute transition-all duration-300",
                            dark ? "opacity-100 scale-100 rotate-0" : "opacity-0 scale-75 -rotate-90"
                        )}
                        size={22}
                    />
                </span>
            </button>
        </div>
    );
}
