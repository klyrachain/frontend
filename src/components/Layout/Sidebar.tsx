"use client";

import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setActiveTab } from "@/store/slices/navigationSlice";
import type { TabId } from "@/types/navigation";
import { TAB_CONFIG } from "@/config/navigation";
import { cn } from "@/lib/utils";
import { Wallet, ArrowRightLeft, RefreshCw, Gift } from "lucide-react";

const TAB_ICONS: Record<TabId, React.ComponentType<{ className?: string }>> = {
  add: Wallet,
  transfer: ArrowRightLeft,
  swap: RefreshCw,
  claim: Gift,
};

export function Sidebar() {
  const dispatch = useAppDispatch();
  const activeTabId = useAppSelector((s) => s.navigation.activeTabId);

  return (
    // <aside
    //   className={cn(
    //     "flex w-64 h-[calc(90vh-4rem)] flex-col rounded-2xl justify-between border border-white/20 bg-transparent py-4 backdrop-blur-sm"
    //   )}
    //   aria-label="Main navigation"
    // >
    <nav className="flex flex-col gap-1 p-2 pt-8" aria-label="Tabs">
      {TAB_CONFIG.map((tab) => {
        const Icon = TAB_ICONS[tab.id];
        const isActive = activeTabId === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => dispatch(setActiveTab(tab.id))}
            className={cn(
              "flex items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium transition-all duration-200",
              isActive
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-white/10 hover:text-foreground dark:hover:bg-white/5"
            )}
            aria-current={isActive ? "page" : undefined}
          >
            {Icon != null && <Icon className="size-5 shrink-0" />}
            <span>{tab.label}</span>
          </button>
        );
      })}
    </nav>
    // </aside>
  );
}
