"use client";

import { useEffect, useRef, useState } from "react";
import {
  THEMES,
  useTheme,
  type ThemeName,
} from "@/components/ThemeProvider";

const themeVisuals: Record<
  ThemeName,
  {
    preview: string;
    accent: string;
    surface: string;
    text: string;
  }
> = {
  warm: {
    preview: "linear-gradient(135deg, #fffaf2 0%, #f59e0b 100%)",
    accent: "#f59e0b",
    surface: "#fffaf2",
    text: "#7c4a12",
  },

  azure: {
    preview: "linear-gradient(135deg, #f1f7ff 0%, #3b82f6 100%)",
    accent: "#3b82f6",
    surface: "#f5f9ff",
    text: "#1d4ed8",
  },

  finance: {
    preview: "linear-gradient(135deg, #f1fcf7 0%, #10b981 100%)",
    accent: "#10b981",
    surface: "#f4fcf8",
    text: "#047857",
  },

  executive: {
    preview: "linear-gradient(135deg, #faf7ff 0%, #8b5cf6 100%)",
    accent: "#8b5cf6",
    surface: "#faf8ff",
    text: "#6d28d9",
  },

  dark: {
    preview: "linear-gradient(135deg, #172337 0%, #38bdf8 100%)",
    accent: "#38bdf8",
    surface: "#111a2c",
    text: "#e0f2fe",
  },

  "midnight-orange": {
    preview:
      "linear-gradient(135deg, #16130f 0%, #ffb35c 100%)",
    accent: "#ffb35c",
    surface: "#211b15",
    text: "#ffd9aa",
  },
};

export default function ThemeSelector() {
  const { theme, setTheme, themes } = useTheme();

  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );
    };
  }, []);

  const activeTheme =
    themes.find((item) => item.id === theme) ?? THEMES[0];

  function handleThemeChange(nextTheme: ThemeName) {
    setTheme(nextTheme);
    setOpen(false);
  }

  return (
    <div ref={menuRef} className="relative">
      {/* Theme Button */}
      <button
        type="button"
        aria-label="Change theme"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="zeit-theme-trigger group"
      >
        <span
          className="zeit-theme-trigger-icon flex h-7 w-7 items-center justify-center rounded-lg"
          style={{
            background: themeVisuals[theme].surface,
            color: themeVisuals[theme].accent,
          }}
        >
          <PaletteIcon />
        </span>

        <span className="hidden text-xs font-extrabold tracking-tight sm:block">
          Theme
        </span>

        <ChevronIcon open={open} />
      </button>

      {/* Theme Menu */}
      {open && (
        <div className="zeit-theme-menu">
          <div className="px-3 pb-3 pt-2">
            <div className="flex items-center gap-3">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-xl"
                style={{
                  background: themeVisuals[theme].surface,
                  color: themeVisuals[theme].accent,
                }}
              >
                <PaletteIcon width={20} height={20} />
              </div>

              <div>
                <p className="text-sm font-extrabold text-slate-900">
                  Workspace Theme
                </p>

                <p className="mt-0.5 text-[11px] font-medium text-slate-500">
                  Choose the style that feels right for you
                </p>
              </div>
            </div>
          </div>

          <div className="mb-2 h-px bg-slate-100" />

          <div className="space-y-1.5">
            {themes.map((item) => {
              const selected = item.id === theme;
              const visual = themeVisuals[item.id];

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() =>
                    handleThemeChange(item.id)
                  }
                  className={`zeit-theme-option ${
                    selected
                      ? "zeit-theme-option-active"
                      : ""
                  }`}
                >
                  {/* Theme Preview */}
                  <span
                    className="relative flex h-12 w-[58px] shrink-0 overflow-hidden rounded-xl border border-white shadow-sm"
                    style={{
                      background: visual.preview,
                    }}
                  >
                    <span
                      className="absolute left-2 top-2 h-2 w-7 rounded-full opacity-90"
                      style={{
                        backgroundColor: visual.accent,
                      }}
                    />

                    <span
                      className="absolute bottom-2 left-2 h-5 w-4 rounded-md opacity-80"
                      style={{
                        backgroundColor: visual.surface,
                      }}
                    />

                    <span className="absolute bottom-2 left-7 h-5 w-4 rounded-md bg-white/80" />

                    <span
                      className="absolute bottom-2 right-2 h-5 w-3 rounded-md opacity-75"
                      style={{
                        backgroundColor: visual.accent,
                      }}
                    />
                  </span>

                  {/* Theme Information */}
                  <span className="min-w-0 flex-1 text-left">
                    <span className="flex items-center gap-2">
                      <span className="text-sm font-extrabold text-slate-900">
                        {item.name}
                      </span>

                      {selected && (
                        <span
                          className="rounded-full px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider"
                          style={{
                            backgroundColor: visual.surface,
                            color: visual.text,
                          }}
                        >
                          Active
                        </span>
                      )}
                    </span>

                    <span className="mt-1 block text-[11px] leading-4 text-slate-500">
                      {item.description}
                    </span>
                  </span>

                  {/* Selected Check */}
                  {selected && (
                    <span
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-white shadow-sm"
                      style={{
                        backgroundColor: visual.accent,
                      }}
                    >
                      <CheckIcon />
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="mt-2 border-t border-slate-100 px-3 pb-1 pt-3">
            <p className="text-center text-[10px] font-medium text-slate-400">
              Your preference is saved automatically
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function PaletteIcon({
  width = 18,
  height = 18,
}: {
  width?: number;
  height?: number;
}) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" />
      <circle cx="8" cy="10" r="1" />
      <circle cx="12" cy="7" r="1" />
      <circle cx="16" cy="10" r="1" />
      <path d="M20 13.5c-.7-.5-1.5-.7-2.3-.4-1.2.4-1.5 1.7-1.1 2.7.3.8-.2 1.7-1.1 1.9-.8.2-1.6-.1-2-.8" />
    </svg>
  );
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={`transition-transform duration-200 ${
        open ? "rotate-180" : ""
      }`}
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}