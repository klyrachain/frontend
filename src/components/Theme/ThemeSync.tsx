"use client";

import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setResolvedTheme } from "@/store/slices/themeSlice";
import { BASE_STYLE_TOKENS, DENSITY_SCALE_MULTIPLIERS } from "@/config/styleTokens";
import type { ResolvedTheme } from "@/types/theme";

const MEDIA_QUERY = "(prefers-color-scheme: dark)";

function getSystemTheme(): ResolvedTheme {
  if (typeof window === "undefined") return "light";
  return window.matchMedia(MEDIA_QUERY).matches ? "dark" : "light";
}

function px(value: number, mult: number): string {
  return `${Math.round(value * mult)}px`;
}

export function ThemeSync() {
  const dispatch = useAppDispatch();
  const themeMode = useAppSelector((s) => s.theme.themeMode);
  const resolvedTheme = useAppSelector((s) => s.theme.resolvedTheme);
  const density = useAppSelector((s) => s.theme.density);
  const sansFontId = useAppSelector((s) => s.theme.sansFontId);
  const monoFontId = useAppSelector((s) => s.theme.monoFontId);

  useEffect(() => {
    const resolved: ResolvedTheme =
      themeMode === "system" ? getSystemTheme() : themeMode;
    dispatch(setResolvedTheme(resolved));
  }, [themeMode, dispatch]);

  useEffect(() => {
    const root = document.documentElement;
    if (resolvedTheme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [resolvedTheme]);

  useEffect(() => {
    if (themeMode !== "system") return;
    const mql = window.matchMedia(MEDIA_QUERY);
    const handle = () => dispatch(setResolvedTheme(getSystemTheme()));
    mql.addEventListener("change", handle);
    return () => mql.removeEventListener("change", handle);
  }, [themeMode, dispatch]);

  useEffect(() => {
    const root = document.documentElement;
    const mult = DENSITY_SCALE_MULTIPLIERS[density] ?? 1;
    const { components } = BASE_STYLE_TOKENS;
    root.style.setProperty("--space-1", px(4, mult));
    root.style.setProperty("--space-2", px(8, mult));
    root.style.setProperty("--space-3", px(12, mult));
    root.style.setProperty("--space-4", px(16, mult));
    root.style.setProperty("--space-6", px(24, mult));
    root.style.setProperty("--space-8", px(32, mult));
    root.style.setProperty("--space-12", px(48, mult));
    root.style.setProperty(
      "--button-height-sm",
      px(Number.parseInt(components.buttonHeightSm, 10), mult)
    );
    root.style.setProperty(
      "--button-height-md",
      px(Number.parseInt(components.buttonHeightMd, 10), mult)
    );
    root.style.setProperty(
      "--button-height-lg",
      px(Number.parseInt(components.buttonHeightLg, 10), mult)
    );
    root.style.setProperty(
      "--input-height",
      px(Number.parseInt(components.inputHeight, 10), mult)
    );
  }, [density]);

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-sans-font", sansFontId);
    root.setAttribute("data-mono-font", monoFontId);
  }, [sansFontId, monoFontId]);

  return null;
}
