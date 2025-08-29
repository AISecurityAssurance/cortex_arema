"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { applyMode, Mode, applyDensity, Density } from "@cloudscape-design/global-styles";

type Theme = 'light' | 'dark';

interface CloudscapeThemeContextType {
  mode: Mode;
  theme: Theme; // For backward compatibility
  density: Density;
  toggleMode: () => void;
  toggleTheme: () => void; // For backward compatibility
  setTheme: (theme: Theme) => void; // For backward compatibility
  setDensity: (density: Density) => void;
}

const CloudscapeThemeContext = createContext<CloudscapeThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = "theme"; // Use the same key as old ThemeProvider
const DENSITY_STORAGE_KEY = "cortex-arena-density";

export function CloudscapeThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<Mode>(Mode.Light);
  const [theme, setThemeState] = useState<Theme>('light');
  const [density, setDensityState] = useState<Density>(Density.Comfortable);
  const [mounted, setMounted] = useState(false);

  // Initialize theme from localStorage and existing theme preference
  useEffect(() => {
    setMounted(true);
    // Check existing theme preference
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY) as Theme | null;
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    const initialTheme = savedTheme || systemTheme;
    const savedDensity = localStorage.getItem(DENSITY_STORAGE_KEY);

    // Set both theme and mode
    const initialMode = initialTheme === "dark" ? Mode.Dark : Mode.Light;
    const initialDensity = savedDensity ? (savedDensity as Density) : Density.Comfortable;

    setMode(initialMode);
    setThemeState(initialTheme);
    setDensityState(initialDensity);
    
    // Apply the modes to the document
    applyMode(initialMode);
    applyDensity(initialDensity);

    // Also update the data-theme attribute for backward compatibility
    document.documentElement.setAttribute("data-theme", initialTheme);
  }, []);

  // Sync theme changes to localStorage and DOM
  useEffect(() => {
    if (mounted) {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
      document.documentElement.setAttribute('data-theme', theme);
    }
  }, [theme, mounted]);

  const toggleMode = () => {
    const newMode = mode === Mode.Light ? Mode.Dark : Mode.Light;
    const newTheme = newMode === Mode.Dark ? 'dark' : 'light';
    
    setMode(newMode);
    setThemeState(newTheme);
    applyMode(newMode);
    
    // Save to localStorage
    localStorage.setItem(THEME_STORAGE_KEY, newTheme);
    
    // Update data-theme attribute for backward compatibility
    document.documentElement.setAttribute("data-theme", newTheme);
  };

  const toggleTheme = toggleMode; // Alias for backward compatibility

  const setTheme = (newTheme: Theme) => {
    const newMode = newTheme === 'dark' ? Mode.Dark : Mode.Light;
    
    setThemeState(newTheme);
    setMode(newMode);
    applyMode(newMode);
    
    localStorage.setItem(THEME_STORAGE_KEY, newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
  };

  const setDensity = (newDensity: Density) => {
    setDensityState(newDensity);
    applyDensity(newDensity);
    localStorage.setItem(DENSITY_STORAGE_KEY, newDensity);
  };

  return (
    <CloudscapeThemeContext.Provider value={{ 
      mode, 
      theme, 
      density, 
      toggleMode, 
      toggleTheme, 
      setTheme, 
      setDensity 
    }}>
      {children}
    </CloudscapeThemeContext.Provider>
  );
}

export function useCloudscapeTheme() {
  const context = useContext(CloudscapeThemeContext);
  if (context === undefined) {
    throw new Error("useCloudscapeTheme must be used within a CloudscapeThemeProvider");
  }
  return context;
}

// Backward compatibility export
export function useTheme() {
  const context = useContext(CloudscapeThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a CloudscapeThemeProvider");
  }
  // Return only the backward-compatible parts
  return {
    theme: context.theme,
    toggleTheme: context.toggleTheme,
    setTheme: context.setTheme
  };
}