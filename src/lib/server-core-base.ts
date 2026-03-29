/**
 * Core API base for server-side proxies (no trailing slash).
 */
export function getCoreBaseUrl(): string | null {
  const raw =
    process.env.NEXT_PUBLIC_CORE_URL?.trim() ||
    process.env.CORE_URL?.trim() ||
    "";
  if (!raw) return null;
  return raw.replace(/\/+$/, "");
}
