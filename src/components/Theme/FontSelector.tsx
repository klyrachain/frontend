"use client";

import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setSansFontId, setMonoFontId } from "@/store/slices/themeSlice";
import type { SansFontId, MonoFontId } from "@/types/font";
import { SANS_FONT_PRESETS, MONO_FONT_PRESETS } from "@/config/fontPresets";
import { Button } from "@/components/ui/button";

export function FontSelector() {
  const dispatch = useAppDispatch();
  const sansFontId = useAppSelector((s) => s.theme.sansFontId);
  const monoFontId = useAppSelector((s) => s.theme.monoFontId);

  return (
    <nav
      className="flex flex-wrap items-center gap-4 p-4 rounded-lg border border-border bg-card"
      aria-label="Font options"
    >
      <section aria-labelledby="sans-font-label">
        <h2 id="sans-font-label" className="text-sm font-medium text-muted-foreground mb-2">
          UI font
        </h2>
        <ul className="flex flex-wrap gap-2">
          {SANS_FONT_PRESETS.map((preset) => (
            <li key={preset.id}>
              <Button
                type="button"
                variant={sansFontId === preset.id ? "default" : "outline"}
                size="sm"
                onClick={() => dispatch(setSansFontId(preset.id as SansFontId))}
                aria-pressed={sansFontId === preset.id}
                title={preset.description}
              >
                {preset.label}
              </Button>
            </li>
          ))}
        </ul>
      </section>
      <section aria-labelledby="mono-font-label">
        <h2 id="mono-font-label" className="text-sm font-medium text-muted-foreground mb-2">
          Monospace (addresses, code)
        </h2>
        <ul className="flex flex-wrap gap-2">
          {MONO_FONT_PRESETS.map((preset) => (
            <li key={preset.id}>
              <Button
                type="button"
                variant={monoFontId === preset.id ? "secondary" : "ghost"}
                size="sm"
                onClick={() => dispatch(setMonoFontId(preset.id as MonoFontId))}
                aria-pressed={monoFontId === preset.id}
                title={preset.description}
              >
                {preset.label}
              </Button>
            </li>
          ))}
        </ul>
      </section>
    </nav>
  );
}
