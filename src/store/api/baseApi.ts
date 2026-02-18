import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const baseUrl =
  typeof window !== "undefined"
    ? (process.env.NEXT_PUBLIC_API_BASE_URL ?? "/api")
    : process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000/api";

export const baseApi = createApi({
  reducerPath: "api",
  baseQuery: fetchBaseQuery({
    baseUrl,
    prepareHeaders: (headers) => {
      headers.set("Content-Type", "application/json");
      return headers;
    },
  }),
  tagTypes: [],
  endpoints: () => ({}),
});
