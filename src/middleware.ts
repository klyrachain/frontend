import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const APP_PREFIXES = [
  "/app",
  "/pay",
  "/receive",
  "/checkout",
  "/business",
  "/token-playground",
];

function normalizeHost(host: string): string {
  return host.split(":")[0]?.trim().toLowerCase() ?? "";
}

function getConfiguredWebHost(): string {
  return (process.env.NEXT_PUBLIC_WEB_HOST ?? "morapay.com")
    .trim()
    .toLowerCase();
}

function getConfiguredAppHost(): string {
  return (process.env.NEXT_PUBLIC_APP_HOST ?? "app.morapay.com")
    .trim()
    .toLowerCase();
}

function isAppPath(pathname: string): boolean {
  return APP_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

export function middleware(request: NextRequest) {
  const host = normalizeHost(request.headers.get("host") ?? "");
  const pathname = request.nextUrl.pathname;
  const webHost = getConfiguredWebHost();
  const appHost = getConfiguredAppHost();

  // Keep local/dev and unknown hosts untouched.
  if (!host || (host !== webHost && host !== appHost)) {
    return NextResponse.next();
  }

  const isCurrentAppPath = isAppPath(pathname);

  if (host === webHost && isCurrentAppPath) {
    const nextUrl = request.nextUrl.clone();
    nextUrl.host = appHost;
    nextUrl.protocol = "https";
    return NextResponse.redirect(nextUrl);
  }

  if (host === appHost) {
    if (pathname === "/") {
      const nextUrl = request.nextUrl.clone();
      nextUrl.pathname = "/app";
      return NextResponse.redirect(nextUrl);
    }
    if (!isCurrentAppPath) {
      const nextUrl = request.nextUrl.clone();
      nextUrl.host = webHost;
      nextUrl.protocol = "https";
      return NextResponse.redirect(nextUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};

