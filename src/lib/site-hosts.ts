const DEFAULT_WEB_HOST = "morapay.com";
const DEFAULT_APP_HOST = "app.morapay.com";

/**
 * Normalizes NEXT_PUBLIC_*_HOST values: bare host (`app.morapay.com`),
 * `host:port` (`localhost:3001`), or full URL (`https://localhost:3001`).
 * Returns lowercase host with optional port, never a scheme.
 */
function normalizeHostValue(input: string | undefined): string {
  const raw = (input ?? "").trim();
  if (!raw) return "";
  try {
    const forParse = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
    const u = new URL(forParse);
    const h = u.hostname.toLowerCase();
    const p = u.port;
    return p ? `${h}:${p}` : h;
  } catch {
    return raw.toLowerCase();
  }
}

export function getWebHost(): string {
  return normalizeHostValue(process.env.NEXT_PUBLIC_WEB_HOST) || DEFAULT_WEB_HOST;
}

export function getAppHost(): string {
  return normalizeHostValue(process.env.NEXT_PUBLIC_APP_HOST) || DEFAULT_APP_HOST;
}

function isLoopbackHost(host: string): boolean {
  const base = host.split(":")[0]?.toLowerCase() ?? "";
  return (
    base === "localhost" ||
    base === "127.0.0.1" ||
    base === "::1" ||
    base === "[::1]"
  );
}

export function getAppBaseUrl(): string {
  const host = getAppHost();
  const scheme = isLoopbackHost(host) ? "http" : "https";
  return `${scheme}://${host}`;
}

export function toAppUrl(path: string = "/app"): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${getAppBaseUrl()}${normalizedPath}`;
}
