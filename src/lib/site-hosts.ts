const DEFAULT_WEB_HOST = "morapay.com";
const DEFAULT_APP_HOST = "app.morapay.com";

function normalizeHost(host: string | undefined): string {
  return (host ?? "").trim().toLowerCase();
}

export function getWebHost(): string {
  return normalizeHost(process.env.NEXT_PUBLIC_WEB_HOST) || DEFAULT_WEB_HOST;
}

export function getAppHost(): string {
  return normalizeHost(process.env.NEXT_PUBLIC_APP_HOST) || DEFAULT_APP_HOST;
}

export function getAppBaseUrl(): string {
  return `https://${getAppHost()}`;
}

export function toAppUrl(path: string = "/app"): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${getAppBaseUrl()}${normalizedPath}`;
}

