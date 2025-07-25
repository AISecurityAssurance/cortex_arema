"use client";

import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";
import { cn } from "@/lib/utils";

export function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  return (
    <button
      aria-label="Toggle dark mode"
      onClick={() => setDark((prev) => !prev)}
      className="rounded-full p-2 border bg-card shadow hover:bg-muted/50"
    >
      <span className="relative w-6 h-6 flex items-center justify-center">
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
  );
}
