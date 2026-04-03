import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { GasPolicyPublic } from "@/types/gas-policy.types";

type GasPolicyEnvelope = { gasPolicy: GasPolicyPublic };

export const gasApi = createApi({
  reducerPath: "gasApi",
  baseQuery: fetchBaseQuery({
    baseUrl: "",
    prepareHeaders: (headers) => {
      headers.set("Accept", "application/json");
      return headers;
    },
  }),
  tagTypes: ["GasPolicy"],
  endpoints: (builder) => ({
    getGasPolicyByPaymentLinkId: builder.query<GasPolicyPublic, string>({
      query: (paymentLinkId) =>
        `/api/core/public/gas-policy?paymentLinkId=${encodeURIComponent(paymentLinkId)}`,
      transformResponse: (raw: unknown): GasPolicyPublic => {
        const o = raw as { success?: boolean; data?: GasPolicyEnvelope };
        const gp = o?.data?.gasPolicy;
        if (!gp) {
          throw new Error("Invalid gas policy response");
        }
        return gp;
      },
      providesTags: (_r, _e, id) => [{ type: "GasPolicy", id }],
    }),
  }),
});

export const { useGetGasPolicyByPaymentLinkIdQuery } = gasApi;
