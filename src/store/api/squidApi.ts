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
    getChains: builder.query<Chain[], { testnet?: boolean; all?: boolean } | void>({
      query: (params) => {
        const search = new URLSearchParams();
        if (params?.testnet) search.set("testnet", "1");
        if (params?.all) search.set("all", "1");
        const q = search.toString();
        return q ? `/api/squid/chains?${q}` : "/api/squid/chains";
      },
      transformResponse: (raw: SquidChainsPayload) =>
        mapSquidChainsToChains(raw),
      providesTags: ["Chains"],
    }),
    getTokens: builder.query<Token[], { testnet?: boolean; all?: boolean } | void>({
      query: (params) => {
        const search = new URLSearchParams();
        if (params?.testnet) search.set("testnet", "1");
        if (params?.all) search.set("all", "1");
        const q = search.toString();
        return q ? `/api/squid/tokens?${q}` : "/api/squid/tokens";
      },
      transformResponse: (raw: SquidTokensPayload) =>
        mapSquidTokensToTokens(raw),
      providesTags: ["Tokens"],
    }),
  }),
});

export const { useGetChainsQuery, useGetTokensQuery } = squidApi;
