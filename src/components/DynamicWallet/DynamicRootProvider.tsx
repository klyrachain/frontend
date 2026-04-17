"use client";

import { useMemo, useState, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider, createConfig, http } from "wagmi";
import { DynamicContextProvider } from "@dynamic-labs/sdk-react-core";
import { DynamicWagmiConnector } from "@dynamic-labs/wagmi-connector";
import { klyraEvmChains } from "@/lib/dynamic/evm-chains";
import { getWalletConnectors } from "@/lib/dynamic/wallet-connectors";
import { getDynamicEnvironmentId } from "@/lib/dynamic/dynamic-app-config";

type KlyraChain = (typeof klyraEvmChains)[number];

function buildWagmiConfig() {
  const transports = klyraEvmChains.reduce(
    (acc, chain) => {
      acc[chain.id] = http();
      return acc;
    },
    {} as Record<KlyraChain["id"], ReturnType<typeof http>>
  );
  return createConfig({
    chains: [...klyraEvmChains],
    multiInjectedProviderDiscovery: false,
    transports,
  });
}

export function DynamicRootProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  const wagmiConfig = useMemo(() => buildWagmiConfig(), []);
  const environmentId = getDynamicEnvironmentId();

  if (!environmentId) {
    return (
      <WagmiProvider config={wagmiConfig}>
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      </WagmiProvider>
    );
  }

  return (
    <DynamicContextProvider
      settings={{
        environmentId,
        walletConnectors: getWalletConnectors(),
        defaultNumberOfWalletsToShow: 60,
        initialAuthenticationMode: "connect-only",
        enableConnectOnlyFallback: true,
      }}
    >
      <WagmiProvider config={wagmiConfig}>
        <QueryClientProvider client={queryClient}>
          <DynamicWagmiConnector>{children}</DynamicWagmiConnector>
        </QueryClientProvider>
      </WagmiProvider>
    </DynamicContextProvider>
  );
}
