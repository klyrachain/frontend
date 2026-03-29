import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { SquidChainsPayload, SquidTokensPayload } from "@/types/squidApi";
import {
  mapSquidChainsToChains,
  mapSquidTokensToTokens,
} from "@/lib/squidMappers";
import type { Chain, Token } from "@/types/token";

/**
 * Use same-origin proxy so chains/tokens are fetched via Next.js API routes
 * (app/api/squid/chains, app/api/squid/tokens), which proxy to the backend.
 * See md/backend-api.md – GET /api/squid/chains, GET /api/squid/tokens.
 */
export const squidApi = createApi({
  reducerPath: "squidApi",
  baseQuery: fetchBaseQuery({
    baseUrl: "",
    prepareHeaders: (headers) => {
      headers.set("Accept", "application/json");
      return headers;
    },
  }),
  tagTypes: ["Chains", "Tokens"],
  endpoints: (builder) => ({
    getChains: builder.query<
      Chain[],
      { testnet?: boolean; all?: boolean; chainId?: string } | void
    >({
      query: (params) => {
        const search = new URLSearchParams();
        if (params?.testnet) search.set("testnet", "1");
        if (params?.all) search.set("all", "1");
        if (params?.chainId?.trim()) search.set("chainId", params.chainId.trim());
        const q = search.toString();
        return q ? `/api/squid/chains?${q}` : "/api/squid/chains";
      },
      transformResponse: (raw: SquidChainsPayload) =>
        mapSquidChainsToChains(raw),
      providesTags: ["Chains"],
      keepUnusedDataFor: 86_400,
    }),
    getTokens: builder.query<
      Token[],
      | {
          testnet?: boolean;
          all?: boolean;
          chainId?: string;
          address?: string;
          tokenAddress?: string;
        }
      | void
    >({
      query: (params) => {
        const search = new URLSearchParams();
        if (params?.testnet) search.set("testnet", "1");
        if (params?.all) search.set("all", "1");
        if (params?.chainId?.trim()) search.set("chainId", params.chainId.trim());
        const addr = params?.address?.trim() ?? params?.tokenAddress?.trim();
        if (addr) search.set("address", addr);
        const q = search.toString();
        return q ? `/api/squid/tokens?${q}` : "/api/squid/tokens";
      },
      transformResponse: (raw: SquidTokensPayload) =>
        mapSquidTokensToTokens(raw),
      providesTags: ["Tokens"],
      keepUnusedDataFor: 86_400,
    }),
    getBalances: builder.query<
      { chainId: string; tokenAddress: string; balance: string; tokenSymbol?: string }[],
      { address: string; testnet?: boolean }
    >({
      query: ({ address, testnet }) => {
        const search = new URLSearchParams();
        search.set("address", address.trim());
        if (testnet) search.set("testnet", "1");
        return `/api/squid/balances?${search.toString()}`;
      },
      transformResponse: (raw: unknown) => {
        if (
          raw &&
          typeof raw === "object" &&
          (raw as { success?: boolean }).success === true &&
          Array.isArray((raw as { data?: unknown }).data)
        ) {
          return (raw as { data: { chainId?: string; tokenAddress?: string; balance?: string; tokenSymbol?: string }[] }).data.map(
            (x) => ({
              chainId: String(x.chainId ?? ""),
              tokenAddress: String(x.tokenAddress ?? ""),
              balance: String(x.balance ?? "0"),
              tokenSymbol: x.tokenSymbol,
            })
          );
        }
        return [];
      },
    }),
  }),
});

export const { useGetChainsQuery, useGetTokensQuery, useGetBalancesQuery } =
  squidApi;
