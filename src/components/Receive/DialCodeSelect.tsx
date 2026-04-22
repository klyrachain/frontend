"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { ChevronDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { CountryFlagImg } from "@/components/flows/CountryFlagImg";
import { Input } from "@/components/ui/input";
import type { DialCountry } from "@/lib/phone-dial-codes";

export type DialCodeSelectProps = {
  id: string;
  labelId?: string;
  items: DialCountry[];
  valueIso: string;
  onChangeIso: (iso: string) => void;
  disabled?: boolean;
  loading?: boolean;
  errorText?: string | null;
  variant?: "default" | "flow";
};

export function DialCodeSelect({
  id,
  labelId,
  items,
  valueIso,
  onChangeIso,
  disabled,
  loading,
  errorText,
  variant = "flow",
}: DialCodeSelectProps) {
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const selected = items.find((i) => i.iso === valueIso) ?? null;

  const filtered = useMemo(() => {
    const n = q.trim().toLowerCase();
    if (!n) return items;
    return items.filter((row) => {
      const dialDigits = row.dial.replace(/\D/g, "");
      return (
        row.name.toLowerCase().includes(n) ||
        row.iso.toLowerCase().includes(n) ||
        row.dial.includes(n) ||
        dialDigits.includes(n.replace(/\D/g, ""))
      );
    });
  }, [items, q]);

  useEffect(() => {
    if (!open) return;
    setQ("");
    const t = window.setTimeout(() => searchRef.current?.focus(), 0);
    return () => window.clearTimeout(t);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      const el = rootRef.current;
      if (el && !el.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (disabled || loading) return;
      if (e.key === "Escape") {
        setOpen(false);
        return;
      }
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    },
    [disabled, loading]
  );

  return (
    <div ref={rootRef} className="relative min-w-0 shrink-0 basis-46">
      <button
        type="button"
        id={id}
        aria-labelledby={labelId}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        disabled={disabled || loading}
        onClick={() => !disabled && !loading && setOpen((o) => !o)}
        onKeyDown={handleKeyDown}
        className={cn(
          "flex min-h-12 w-full items-center gap-2 text-left text-sm text-card-foreground",
          variant === "flow"
            ? "rounded-lg border border-input/80 bg-card/40 px-2 py-2 transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            : "rounded-xl border border-input bg-card px-3 py-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          "disabled:cursor-not-allowed disabled:opacity-50"
        )}
      >
        {selected ? (
          <>
            <CountryFlagImg code={selected.iso} />
            <span className="min-w-0 flex-1 truncate font-medium tabular-nums">{selected.dial}</span>
          </>
        ) : (
          <span className="min-w-0 flex-1 truncate text-card-foreground/70">
            {loading ? "Loading…" : errorText ?? "Code"}
          </span>
        )}
        <ChevronDown
          className={cn("size-4 shrink-0 text-muted-foreground transition-transform", open && "rotate-180")}
          aria-hidden
        />
      </button>
      {open && !disabled && !loading ? (
        <div
          id={listId}
          role="listbox"
          aria-labelledby={labelId}
          className="absolute left-0 right-0 top-full z-50 mt-1 flex max-h-72 min-w-[min(100vw-2rem,20rem)] flex-col overflow-hidden rounded-xl border border-border bg-card shadow-lg sm:min-w-[20rem]"
        >
          <div className="border-b border-border p-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                ref={searchRef}
                type="search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search country or code…"
                className="h-9 pl-8"
                aria-label="Search countries"
              />
            </div>
          </div>
          <ul className="max-h-52 overflow-auto py-1" role="none">
            {filtered.length === 0 ? (
              <li className="px-3 py-2 text-sm text-muted-foreground">No matches</li>
            ) : (
              filtered.map((item) => {
                const isSelected = item.iso === valueIso;
                return (
                  <li key={item.iso} role="none">
                    <button
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      className={cn(
                        "flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-card-foreground",
                        "hover:bg-muted/80 focus:bg-muted/80 focus:outline-none",
                        isSelected && "bg-muted/50"
                      )}
                      onClick={() => {
                        onChangeIso(item.iso);
                        setOpen(false);
                      }}
                    >
                      <CountryFlagImg code={item.iso} />
                      <span className="min-w-0 flex-1 truncate">{item.name}</span>
                      <span className="shrink-0 tabular-nums text-muted-foreground">{item.dial}</span>
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
