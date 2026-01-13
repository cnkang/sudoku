"use client";

import type { ReactNode } from "react";
import { ThemeContext, useTheme } from "@/hooks/useTheme";

interface ThemeProviderProps {
  children: ReactNode;
}

/**
 * Theme Provider Component
 * Provides theme context to all child components
 */
export default function ThemeProvider({ children }: ThemeProviderProps) {
  const themeValue = useTheme();

  return (
    <ThemeContext.Provider value={themeValue}>{children}</ThemeContext.Provider>
  );
}
