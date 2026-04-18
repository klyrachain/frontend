"use client";

/**
 * Opt-in runtime view of wallets Dynamic registered after dashboard + wallet-book + install filters.
 * Set NEXT_PUBLIC_DYNAMIC_DEBUG_WALLETS=true in frontend/.env, open the app, use the panel (bottom-right).
 */

import { useContext, useMemo, useState } from "react";
import { DynamicContext } from "@dynamic-labs/sdk-react-core";

function enabledFromEnv(): boolean {
  return (
    typeof process !== "undefined" &&
    process.env.NEXT_PUBLIC_DYNAMIC_DEBUG_WALLETS === "true"
  );
}

export function DynamicDebugWalletList() {
  const [open, setOpen] = useState(false);
  const ctx = useContext(DynamicContext);

  const rows = useMemo(() => {
    const opts = ctx?.walletConnectorOptions;
    if (!opts?.length) return [];
    return opts.map((o) => ({
      key: o.key,
      name: o.name,
      installed: o.isInstalledOnBrowser,
      chains: (o.walletConnector.supportedChains ?? []).join(", "),
    }));
  }, [ctx?.walletConnectorOptions]);

  const enabledChains = useMemo(() => {
    const chains = ctx?.projectSettings?.chains;
    if (!Array.isArray(chains)) return [];
    return chains
      .filter((c: { enabled?: boolean }) => c.enabled)
      .map((c: { name?: string }) => String(c.name ?? ""))
      .filter(Boolean);
  }, [ctx?.projectSettings?.chains]);

  if (!enabledFromEnv() || !ctx) {
    return null;
  }

  return (
    <div className="pointer-events-auto fixed bottom-2 right-2 z-9999 max-w-md text-xs">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="rounded-md border border-amber-500/60 bg-zinc-950/95 px-2 py-1 font-medium text-amber-200 shadow-lg"
      >
        Dynamic wallets ({rows.length}) {open ? "▾" : "▸"}
      </button>
      {open ? (
        <div className="mt-1 max-h-[min(70vh,28rem)] overflow-auto rounded-md border border-white/10 bg-zinc-950/95 p-2 text-zinc-200 shadow-xl">
          <p className="mb-2 text-[0.65rem] leading-snug text-zinc-400">
            These are <span className="text-zinc-300">walletConnectorOptions</span> after Dynamic&apos;s
            filters. If a connector (e.g. Lobstr) is missing here, it was never instantiated. If it
            appears here but not in the modal search, the UI may be grouping or limiting results. Many
            injected wallets only pass the &quot;installed&quot; gate when the extension reports
            connected — see Dynamic <code className="text-zinc-500">filterWalletsForPlatform</code> +
            wallet-book <code className="text-zinc-500">showOnlyIfInstalled</code>.
          </p>
          <p className="mb-2 font-mono text-[0.65rem] text-emerald-300/90">
            Enabled dashboard chains: {enabledChains.length ? enabledChains.join(", ") : "(loading or none)"}
          </p>
          <table className="w-full border-collapse text-left font-mono text-[0.65rem]">
            <thead>
              <tr className="border-b border-white/10 text-zinc-500">
                <th className="py-1 pr-2">key</th>
                <th className="py-1 pr-2">name</th>
                <th className="py-1 pr-2">installed</th>
                <th className="py-1">chains</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.key} className="border-b border-white/5 align-top">
                  <td className="py-1 pr-2 text-amber-100/90">{r.key}</td>
                  <td className="py-1 pr-2">{r.name}</td>
                  <td className="py-1 pr-2">{r.installed ? "yes" : "no"}</td>
                  <td className="py-1 text-zinc-400">{r.chains || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {rows.length === 0 ? (
            <p className="mt-2 text-zinc-500">No connectors yet (SDK still loading or misconfigured).</p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
