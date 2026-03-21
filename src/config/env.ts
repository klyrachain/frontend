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
/** Include path if the dashboard lives under /app, etc. */
const DEFAULT_BUSINESS_DASHBOARD_URL = "http://localhost:3002/app";

export const env = {
  /**
   * Core API origin (no trailing slash). Public so the browser can call auth endpoints.
   */
  businessApiOrigin: trimTrailingSlash(
    process.env.NEXT_PUBLIC_BUSINESS_API_URL ?? DEFAULT_BUSINESS_API
  ),
  /**
   * Dashboard app URL used for login-code handoff (can include path, but no query).
   * Example: https://localhost:3002/app
   */
  businessDashboardUrl: trimTrailingSlash(
    process.env.NEXT_PUBLIC_BUSINESS_DASHBOARD_URL ??
      DEFAULT_BUSINESS_DASHBOARD_URL
  ),
} as const;
