import type { MetadataRoute } from "next";
import { BLOG_POSTS } from "@/data/marketing/blog-posts";
import { getSiteUrl } from "@/lib/site";

const STATIC_PATHS = [
  "/",
  "/about",
  "/pricing",
  "/contact",
  "/privacy",
  "/terms",
  "/help",
  "/docs",
  "/guides",
  "/blog",
  "/developers/api",
  "/developers/sdks",
  "/business",
  "/business/signin",
  "/business/signup",
] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const base = getSiteUrl().origin;
  const lastModified = new Date();

  const staticEntries: MetadataRoute.Sitemap = STATIC_PATHS.map((path) => ({
    url: `${base}${path === "/" ? "" : path}`,
    lastModified,
    changeFrequency: path === "/" ? "weekly" : "monthly",
    priority: path === "/" ? 1 : 0.7,
  }));

  const blogEntries: MetadataRoute.Sitemap = BLOG_POSTS.map((post) => ({
    url: `${base}/blog/${post.slug}`,
    lastModified: new Date(post.date),
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  return [...staticEntries, ...blogEntries];
}
