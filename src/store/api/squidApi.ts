import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { SquidChainsResponse, SquidTokensResponse } from "@/types/squidApi";
import {
  mapSquidChainsToChains,
  mapSquidTokensToTokens,
} from "@/lib/squidMappers";
import type { Chain, Token } from "@/types/token";

const SQUID_BASE_URL =
  process.env.NEXT_PUBLIC_SQUID_API_BASE_URL ??
  "https://backend-m7eg-mevsyou.vercel.app";

export const squidApi = createApi({
  reducerPath: "squidApi",
  baseQuery: fetchBaseQuery({
    baseUrl: SQUID_BASE_URL,
    prepareHeaders: (headers) => {
      headers.set("Accept", "application/json");
      const integratorId = process.env.NEXT_PUBLIC_SQUID_INTEGRATOR_ID;
      if (integratorId) {
        headers.set("x-integrator-id", integratorId);
      }
      return headers;
    },
  }),
  tagTypes: ["Chains", "Tokens"],
  endpoints: (builder) => ({
    getChains: builder.query<Chain[], void>({
      query: () => "/api/squid/chains",
      transformResponse: (raw: SquidChainsResponse) =>
        mapSquidChainsToChains(raw),
      providesTags: ["Chains"],
    }),
    getTokens: builder.query<Token[], void>({
      query: () => "/api/squid/tokens",
      transformResponse: (raw: SquidTokensResponse) =>
        mapSquidTokensToTokens(raw),
      providesTags: ["Tokens"],
    }),
  }),
});

export const { useGetChainsQuery, useGetTokensQuery } = squidApi;
