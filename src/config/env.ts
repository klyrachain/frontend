/**
 * Business portal frontend configuration.
 *
 * - **NEXT_PUBLIC_BUSINESS_API_URL** — API origin (browser + Google OAuth redirect).
 * - **BUSINESS_API_URL** (optional, server only) — Proxy target; use in Docker when
 *   the browser URL differs from where Next.js should call the API.
 *
 * Backend uses separately: BUSINESS_PORTAL_JWT_SECRET, GOOGLE_OAUTH_*,
 * BUSINESS_SIGNUP_LANDING_URL, etc.
 */

function trimTrailingSlash(url: string): string {
  return url.replace(/\/+$/, "");
}

const DEFAULT_BUSINESS_API = "http://localhost:4000";

export const env = {
  /**
   * Core API origin (no trailing slash). Public so the browser can call auth endpoints.
   */
  businessApiOrigin: trimTrailingSlash(
    process.env.NEXT_PUBLIC_BUSINESS_API_URL ?? DEFAULT_BUSINESS_API
  ),
} as const;
