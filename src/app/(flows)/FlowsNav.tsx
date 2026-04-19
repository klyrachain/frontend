"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const FLOWS = [
  { href: "/app", label: "App" },
  { href: "/pay", label: "Pay" },
  { href: "/receive", label: "Receive" },
] as const;

export function FlowsNav() {
  const pathname = usePathname();
  return (
    <nav
      className="sticky top-4 z-30 mx-auto flex w-fit max-w-full shrink-0 gap-1 rounded-xl border border-border bg-card/90 p-1 shadow-sm backdrop-blur-md supports-[backdrop-filter]:bg-card/75"
      aria-label="App flows"
    >
      {FLOWS.map(({ href, label }) => {
        const isActive = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "rounded-lg px-4 py-2 text-sm font-medium transition-colors",
              isActive
                ? "bg-primary text-primary-foreground shadow-sm"
                : "border border-transparent bg-transparent text-card-foreground/90 hover:border-border hover:bg-muted/70 hover:text-card-foreground"
            )}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
