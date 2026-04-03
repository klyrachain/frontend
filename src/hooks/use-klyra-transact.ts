"use client";

import { useCallback } from "react";
import { useWalletClient } from "wagmi";
import type {
  KlyraTransactContext,
  TransactEvmInput,
  TransactEvmResult,
  SponsorSource,
} from "@/types/dynamic-wallet.types";
import type { GasPolicyPublic } from "@/types/gas-policy.types";

function resolveEffectiveSponsor(
  policy: GasPolicyPublic | undefined,
  override: boolean | undefined
): boolean {
  if (override === false) return false;
  if (override === true) return true;
  return policy?.effectiveSponsorship ?? false;
}

function resolveSponsorSource(
  policy: GasPolicyPublic | undefined,
  effective: boolean
): SponsorSource {
  if (!effective || !policy) return "none";
  const available = parseFloat(policy.availableUsd);
  if (policy.businessSponsorshipEnabled && Number.isFinite(available) && available > 0) {
    return "business";
  }
  if (policy.platformSponsorshipEnabled) return "platform";
  return "none";
}

/**
 * EVM sends (sequential). Gas sponsorship is enforced server-side when reporting usage;
 * ZeroDev / kernel batching should be wired via Dynamic dashboard + `useSmartWallets` when available.
 */
export function useKlyraTransact(ctx: KlyraTransactContext) {
  const { data: walletClient } = useWalletClient();

  const reportUsage = useCallback(
    async (input: {
      estimatedUsd: number;
      idempotencyKey: string;
      chainId: string;
      txHash?: string;
      userOpHash?: string;
      sponsorSource: "platform" | "business";
    }) => {
      const token = ctx.gasReportToken;
      if (!token) return;
      await fetch("/api/core/public/gas-usage", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Gas-Report-Token": token,
        },
        body: JSON.stringify({
          idempotencyKey: input.idempotencyKey,
          estimatedUsd: input.estimatedUsd,
          chainId: input.chainId,
          sponsorSource: input.sponsorSource,
          txHash: input.txHash,
          userOpHash: input.userOpHash,
        }),
      });
    },
    [ctx.gasReportToken]
  );

  const transactEvm = useCallback(
    async (input: TransactEvmInput): Promise<TransactEvmResult> => {
      const client = walletClient;
      if (!client) {
        return { family: "evm", ok: false, error: "Wallet not connected" };
      }
      const effective = resolveEffectiveSponsor(ctx.gasPolicy, ctx.sponsorOverride);
      const sponsorSource = resolveSponsorSource(ctx.gasPolicy, effective);

      try {
        let lastHash: `0x${string}` | undefined;
        for (const call of input.calls) {
          const hash = await client.sendTransaction({
            to: call.to,
            data: call.data,
            value: call.value ?? BigInt(0),
          });
          lastHash = hash;
        }
        if (!lastHash) {
          return { family: "evm", ok: false, error: "No calls" };
        }

        void sponsorSource;
        void effective;

        return { family: "evm", ok: true, txHash: lastHash };
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Transaction failed";
        return { family: "evm", ok: false, error: msg };
      }
    },
    [walletClient]
  );

  const reportSponsoredGas = useCallback(
    async (input: {
      estimatedUsd: number;
      idempotencyKey: string;
      chainId: string;
      txHash?: string;
      userOpHash?: string;
    }) => {
      const effective = resolveEffectiveSponsor(ctx.gasPolicy, ctx.sponsorOverride);
      const sponsorSource = resolveSponsorSource(ctx.gasPolicy, effective);
      if (sponsorSource !== "business" && sponsorSource !== "platform") return;
      await reportUsage({
        ...input,
        sponsorSource,
      });
    },
    [ctx.gasPolicy, ctx.sponsorOverride, reportUsage]
  );

  return {
    transactEvm,
    reportSponsoredGas,
    resolveEffectiveSponsor: () => resolveEffectiveSponsor(ctx.gasPolicy, ctx.sponsorOverride),
    resolveSponsorSource: () =>
      resolveSponsorSource(ctx.gasPolicy, resolveEffectiveSponsor(ctx.gasPolicy, ctx.sponsorOverride)),
  };
}
