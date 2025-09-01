"use client";

import { FlashbarProvider } from "@/contexts/FlashbarContext";
import { CloudscapeThemeProvider } from "@/contexts/CloudscapeThemeContext";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <CloudscapeThemeProvider>
      <FlashbarProvider>{children}</FlashbarProvider>
    </CloudscapeThemeProvider>
  );
}