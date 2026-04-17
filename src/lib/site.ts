import type { Metadata } from "next";

/** Canonical site origin for SEO (set in production). */
export function getSiteUrl(): URL {
  const raw =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "") ||
    "http://localhost:3000";
  return new URL(raw.endsWith("/") ? raw.slice(0, -1) : raw);
}

export function siteOpenGraph(): NonNullable<Metadata["openGraph"]> {
  const url = getSiteUrl();
  return {
    type: "website",
    locale: "en_US",
    url: url.toString(),
    siteName: "Morapay",
  };
}

export function pageMetadata(title: string, description: string, path = ""): Metadata {
  const site = getSiteUrl();
  const pathname = path === "" || path === "/" ? "/" : path.startsWith("/") ? path : `/${path}`;
  const url = new URL(pathname, site);
  return {
    title,
    description,
    alternates: { canonical: url.toString() },
    openGraph: {
      ...siteOpenGraph(),
      title,
      description,
      url: url.toString(),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}
