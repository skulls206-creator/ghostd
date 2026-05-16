import { useState, useEffect, useCallback } from "react";

export interface ThemeDefinition {
  id: string;
  name: string;
  preview: { bg: string; primary: string; accent: string };
  vars: Record<string, string>;
}

export const THEMES: ThemeDefinition[] = [
  {
    id: "obsidian",
    name: "Obsidian",
    preview: { bg: "#0b0b0f", primary: "#06B6D4", accent: "#1a1a24" },
    vars: {
      "--background": "240 14% 5%",
      "--foreground": "210 20% 92%",
      "--card": "240 12% 7%",
      "--card-foreground": "210 20% 92%",
      "--popover": "240 12% 9%",
      "--popover-foreground": "210 20% 92%",
      "--border": "240 8% 12%",
      "--input": "240 8% 12%",
      "--primary": "188 97% 43%",
      "--primary-foreground": "240 14% 5%",
      "--accent": "240 10% 11%",
      "--accent-foreground": "210 20% 92%",
      "--success": "142 71% 45%",
      "--success-foreground": "240 14% 5%",
      "--danger": "0 84% 60%",
      "--danger-foreground": "210 20% 92%",
      "--muted": "240 10% 9%",
      "--muted-foreground": "215 12% 50%",
    },
  },
  {
    id: "midnight",
    name: "Midnight Blue",
    preview: { bg: "#0a0e1a", primary: "#6366F1", accent: "#1e1b4b" },
    vars: {
      "--background": "230 33% 7%",
      "--foreground": "220 20% 92%",
      "--card": "230 28% 9%",
      "--card-foreground": "220 20% 92%",
      "--popover": "230 28% 11%",
      "--popover-foreground": "220 20% 92%",
      "--border": "230 20% 14%",
      "--input": "230 20% 14%",
      "--primary": "239 84% 67%",
      "--primary-foreground": "0 0% 100%",
      "--accent": "240 30% 14%",
      "--accent-foreground": "220 20% 92%",
      "--success": "160 84% 39%",
      "--success-foreground": "0 0% 100%",
      "--danger": "0 72% 51%",
      "--danger-foreground": "0 0% 100%",
      "--muted": "230 20% 11%",
      "--muted-foreground": "225 12% 50%",
    },
  },
  {
    id: "emerald",
    name: "Emerald Dark",
    preview: { bg: "#0a0f0d", primary: "#10B981", accent: "#064e3b" },
    vars: {
      "--background": "150 20% 5%",
      "--foreground": "150 10% 92%",
      "--card": "150 15% 7%",
      "--card-foreground": "150 10% 92%",
      "--popover": "150 15% 9%",
      "--popover-foreground": "150 10% 92%",
      "--border": "150 10% 13%",
      "--input": "150 10% 13%",
      "--primary": "160 84% 39%",
      "--primary-foreground": "150 20% 5%",
      "--accent": "150 15% 12%",
      "--accent-foreground": "150 10% 92%",
      "--success": "142 71% 45%",
      "--success-foreground": "150 20% 5%",
      "--danger": "0 84% 60%",
      "--danger-foreground": "150 10% 92%",
      "--muted": "150 12% 9%",
      "--muted-foreground": "150 8% 48%",
    },
  },
  {
    id: "amber",
    name: "Amber Terminal",
    preview: { bg: "#0f0d08", primary: "#F59E0B", accent: "#451a03" },
    vars: {
      "--background": "40 30% 4%",
      "--foreground": "40 15% 90%",
      "--card": "40 20% 6%",
      "--card-foreground": "40 15% 90%",
      "--popover": "40 20% 8%",
      "--popover-foreground": "40 15% 90%",
      "--border": "40 12% 12%",
      "--input": "40 12% 12%",
      "--primary": "38 92% 50%",
      "--primary-foreground": "40 30% 4%",
      "--accent": "40 15% 11%",
      "--accent-foreground": "40 15% 90%",
      "--success": "142 71% 45%",
      "--success-foreground": "40 30% 4%",
      "--danger": "0 84% 60%",
      "--danger-foreground": "40 15% 90%",
      "--muted": "40 12% 8%",
      "--muted-foreground": "40 10% 48%",
    },
  },
  {
    id: "rose",
    name: "Rose Noir",
    preview: { bg: "#0f0a0c", primary: "#F43F5E", accent: "#4c0519" },
    vars: {
      "--background": "340 20% 5%",
      "--foreground": "340 10% 92%",
      "--card": "340 15% 7%",
      "--card-foreground": "340 10% 92%",
      "--popover": "340 15% 9%",
      "--popover-foreground": "340 10% 92%",
      "--border": "340 10% 13%",
      "--input": "340 10% 13%",
      "--primary": "347 77% 50%",
      "--primary-foreground": "0 0% 100%",
      "--accent": "340 15% 12%",
      "--accent-foreground": "340 10% 92%",
      "--success": "142 71% 45%",
      "--success-foreground": "340 20% 5%",
      "--danger": "0 84% 60%",
      "--danger-foreground": "340 10% 92%",
      "--muted": "340 12% 9%",
      "--muted-foreground": "340 8% 48%",
    },
  },
  {
    id: "arctic",
    name: "Arctic Steel",
    preview: { bg: "#0c0e12", primary: "#38BDF8", accent: "#0c4a6e" },
    vars: {
      "--background": "215 18% 6%",
      "--foreground": "210 15% 93%",
      "--card": "215 15% 8%",
      "--card-foreground": "210 15% 93%",
      "--popover": "215 15% 10%",
      "--popover-foreground": "210 15% 93%",
      "--border": "215 10% 14%",
      "--input": "215 10% 14%",
      "--primary": "199 89% 48%",
      "--primary-foreground": "215 18% 6%",
      "--accent": "215 15% 13%",
      "--accent-foreground": "210 15% 93%",
      "--success": "160 84% 39%",
      "--success-foreground": "215 18% 6%",
      "--danger": "0 72% 51%",
      "--danger-foreground": "210 15% 93%",
      "--muted": "215 12% 10%",
      "--muted-foreground": "215 10% 50%",
    },
  },
  {
    id: "daylight",
    name: "Daylight",
    preview: { bg: "#f5f7fa", primary: "#0891b2", accent: "#e8ecf2" },
    vars: {
      "--background": "216 33% 97%",
      "--foreground": "220 25% 14%",
      "--card": "0 0% 100%",
      "--card-foreground": "220 25% 14%",
      "--popover": "0 0% 100%",
      "--popover-foreground": "220 25% 14%",
      "--border": "220 15% 88%",
      "--input": "220 15% 88%",
      "--primary": "192 91% 36%",
      "--primary-foreground": "0 0% 100%",
      "--accent": "220 20% 93%",
      "--accent-foreground": "220 25% 14%",
      "--success": "142 60% 35%",
      "--success-foreground": "0 0% 100%",
      "--danger": "0 72% 48%",
      "--danger-foreground": "0 0% 100%",
      "--muted": "220 20% 94%",
      "--muted-foreground": "220 12% 46%",
    },
  },
];

const THEME_KEY = "crp_theme";

export function useTheme() {
  const [themeId, setThemeId] = useState<string>(() => {
    try { return localStorage.getItem(THEME_KEY) || "obsidian"; } catch { return "obsidian"; }
  });

  const currentTheme = THEMES.find(t => t.id === themeId) || THEMES[0]!;

  const applyTheme = useCallback((theme: ThemeDefinition) => {
    const root = document.documentElement;
    Object.entries(theme.vars).forEach(([key, value]) => {
      root.style.setProperty(key, value);
    });
  }, []);

  useEffect(() => {
    applyTheme(currentTheme);
    try { localStorage.setItem(THEME_KEY, currentTheme.id); } catch {}
  }, [currentTheme, applyTheme]);

  const setTheme = useCallback((id: string) => {
    setThemeId(id);
  }, []);

  return { themeId, currentTheme, setTheme, themes: THEMES };
}
