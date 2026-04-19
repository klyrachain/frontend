"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { CountryFlagImg } from "@/components/flows/CountryFlagImg";

export type FlagSelectItem = {
  value: string;
  label: string;
  /** ISO 3166-1 alpha-2 for flag image */
  flagCode: string;
};

export type FlagSelectProps = {
  id: string;
  labelId?: string;
  items: FlagSelectItem[];
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  loading?: boolean;
  placeholder?: string;
  loadingPlaceholder?: string;
  className?: string;
};

export function FlagSelect({
  id,
  labelId,
  items,
  value,
  onChange,
  disabled,
  loading,
  placeholder = "Select…",
  loadingPlaceholder = "Loading…",
  className,
}: FlagSelectProps) {
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const selected = items.find((i) => i.value === value) ?? null;

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
    <div ref={rootRef} className={cn("relative", className)}>
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
          "flex h-12 w-full items-center gap-2 rounded-xl border border-input bg-card px-3 py-2 text-left text-sm text-card-foreground ring-offset-background",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          "disabled:cursor-not-allowed disabled:opacity-50"
        )}
      >
        {selected ? (
          <>
            <CountryFlagImg code={selected.flagCode} />
            <span className="min-w-0 flex-1 truncate">{selected.label}</span>
          </>
        ) : (
          <span className="min-w-0 flex-1 text-card-foreground/70">
            {loading ? loadingPlaceholder : placeholder}
          </span>
        )}
        <ChevronDown
          className={cn(
            "size-4 shrink-0 text-muted-foreground transition-transform",
            open && "rotate-180"
          )}
          aria-hidden
        />
      </button>
      {open && !disabled && !loading ? (
        <ul
          id={listId}
          role="listbox"
          aria-labelledby={labelId}
          className="absolute left-0 right-0 top-full z-50 mt-1 max-h-60 overflow-auto rounded-xl border border-border bg-card py-1 shadow-lg"
        >
          {items.map((item) => {
            const isSelected = item.value === value;
            return (
              <li key={item.value} role="none">
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
                    onChange(item.value);
                    setOpen(false);
                  }}
                >
                  <CountryFlagImg code={item.flagCode} />
                  <span className="min-w-0 flex-1">{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
