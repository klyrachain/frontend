/**
 * Backend base URL for Next.js Route Handlers that proxy to the API server.
 * Requires explicit env. Never fall back to a fixed remote host (e.g. no default
 * *.vercel.app URL): a missing env must 503 so deploys fail loud, not silent.
 */
export function getBackendBaseUrl(): string | null {
  const a = process.env.BACKEND_API_URL?.trim().replace(/\/$/, "");
  const b = process.env.NEXT_PUBLIC_SQUID_API_BASE_URL?.trim().replace(/\/$/, "");
  return a || b || null;
}

/** Shown when Next BFF cannot reach the integration API (Node backend). */
export const BACKEND_API_CONFIGURE_HINT =
  "Set BACKEND_API_URL or NEXT_PUBLIC_SQUID_API_BASE_URL to your Morapay API server (integration layer).";
