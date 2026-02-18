"use client";

import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  setThemeMode,
  setGradientThemeId,
  setDensity,
} from "@/store/slices/themeSlice";
import type { ThemeMode, GradientThemeId, DensityScale } from "@/types/theme";
import { Button } from "@/components/ui/button";

const THEME_MODE_OPTIONS: { value: ThemeMode; label: string }[] = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "system", label: "System" },
];

const GRADIENT_OPTIONS: { value: GradientThemeId; label: string }[] = [
  { value: "default", label: "Default" },
  { value: "ocean", label: "Ocean" },
  { value: "forest", label: "Forest" },
  { value: "sunset", label: "Sunset" },
  { value: "minimal", label: "Minimal" },
  { value: "vision", label: "Vision" },
];

const DENSITY_OPTIONS: { value: DensityScale; label: string }[] = [
  { value: "compact", label: "Compact" },
  { value: "normal", label: "Normal" },
  { value: "comfortable", label: "Comfortable" },
];

export function ThemeSelector() {
  const dispatch = useAppDispatch();
  const themeMode = useAppSelector((s) => s.theme.themeMode);
  const gradientThemeId = useAppSelector((s) => s.theme.gradientThemeId);
  const density = useAppSelector((s) => s.theme.density);

  return (
    <nav
      className="flex flex-wrap items-center gap-4 p-4 rounded-lg border border-border bg-card"
      aria-label="Theme and style options"
    >
      <section aria-labelledby="theme-mode-label">
        <span id="theme-mode-label" className="sr-only">
          Color theme mode
        </span>
        <ul className="flex gap-2">
          {THEME_MODE_OPTIONS.map((opt) => (
            <li key={opt.value}>
              <Button
                type="button"
                variant={themeMode === opt.value ? "default" : "outline"}
                size="sm"
                onClick={() => dispatch(setThemeMode(opt.value))}
                aria-pressed={themeMode === opt.value}
              >
                {opt.label}
              </Button>
            </li>
          ))}
        </ul>
      </section>
      <section aria-labelledby="gradient-label">
        <span id="gradient-label" className="sr-only">
          Background gradient
        </span>
        <ul className="flex flex-wrap gap-2">
          {GRADIENT_OPTIONS.map((opt) => (
            <li key={opt.value}>
              <Button
                type="button"
                variant={gradientThemeId === opt.value ? "default" : "outline"}
                size="sm"
                onClick={() => dispatch(setGradientThemeId(opt.value))}
                aria-pressed={gradientThemeId === opt.value}
              >
                {opt.label}
              </Button>
            </li>
          ))}
        </ul>
      </section>
      <section aria-labelledby="density-label">
        <span id="density-label" className="sr-only">
          UI density
        </span>
        <ul className="flex gap-2">
          {DENSITY_OPTIONS.map((opt) => (
            <li key={opt.value}>
              <Button
                type="button"
                variant={density === opt.value ? "secondary" : "ghost"}
                size="sm"
                onClick={() => dispatch(setDensity(opt.value))}
                aria-pressed={density === opt.value}
              >
                {opt.label}
              </Button>
            </li>
          ))}
        </ul>
      </section>
    </nav>
  );
}
