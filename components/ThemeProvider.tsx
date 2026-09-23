"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

export type ThemeName =
  | "warm"
  | "azure"
  | "finance"
  | "executive"
  | "dark"
  | "midnight-orange";

export type ThemeOption = {
  id: ThemeName;
  name: string;
  description: string;
};

export const THEMES: ThemeOption[] = [
  {
    id: "warm",
    name: "ZEIT Warm",
    description: "Warm off-white with friendly orange accents",
  },
  {
    id: "azure",
    name: "Azure",
    description: "Clean Microsoft-inspired enterprise blue",
  },
  {
    id: "finance",
    name: "Finance Green",
    description: "Fresh and trustworthy finance workspace",
  },
  {
    id: "executive",
    name: "Executive Purple",
    description: "Premium and elegant executive workspace",
  },
  {
    id: "dark",
    name: "Dark Premium",
    description: "Modern dark workspace with cool highlights",
  },
  {
    id: "midnight-orange",
    name: "Midnight Orange",
    description: "Dark workspace with warm light-orange accents",
  },
];

const STORAGE_KEY = "zeit-csp-theme";
const DEFAULT_THEME: ThemeName = "warm";

type ThemeContextValue = {
  theme: ThemeName;
  setTheme: (theme: ThemeName) => void;
  themes: ThemeOption[];
};

const ThemeContext = createContext<ThemeContextValue | undefined>(
  undefined
);

function isThemeName(value: string): value is ThemeName {
  return THEMES.some((theme) => theme.id === value);
}

export default function ThemeProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [theme, setThemeState] =
    useState<ThemeName>(DEFAULT_THEME);

  useEffect(() => {
    try {
      const storedTheme =
        window.localStorage.getItem(STORAGE_KEY);

      if (storedTheme && isThemeName(storedTheme)) {
        setThemeState(storedTheme);
      }
    } catch (error) {
      console.error(
        "Unable to load saved theme:",
        error
      );
    }
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;

    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        theme
      );
    } catch (error) {
      console.error(
        "Unable to save selected theme:",
        error
      );
    }
  }, [theme]);

  function setTheme(nextTheme: ThemeName) {
    if (!isThemeName(nextTheme)) {
      return;
    }

    setThemeState(nextTheme);
  }

  return (
    <ThemeContext.Provider
      value={{
        theme,
        setTheme,
        themes: THEMES,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error(
      "useTheme must be used inside ThemeProvider"
    );
  }

  return context;
}