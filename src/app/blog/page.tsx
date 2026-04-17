import type { Metadata } from "next";
import Link from "next/link";
import { BLOG_POSTS } from "@/data/marketing/blog-posts";
import { MarketingShell } from "@/components/marketing/MarketingShell";
import { pageMetadata } from "@/lib/site";

export const metadata: Metadata = pageMetadata(
  "Blog",
  "Product notes on payments, settlement, and integration for Morapay merchants.",
  "/blog"
);

export default function BlogIndexPage() {
  return (
    <MarketingShell
      title="Blog"
      description="Updates on rails, compliance, and building with Morapay."
      breadcrumbs={[{ label: "Blog", href: "/blog" }]}
    >
      <ul className="!mt-0 space-y-6 !list-none !pl-0">
        {BLOG_POSTS.map((post) => (
          <li key={post.slug} className="rounded-lg border border-border p-4">
            <p className="text-xs text-muted-foreground">{post.date}</p>
            <h2 className="!mt-2 !text-lg">
              <Link href={`/blog/${post.slug}`} className="text-foreground no-underline hover:underline">
                {post.title}
              </Link>
            </h2>
            <p className="!mt-2 text-muted-foreground">{post.excerpt}</p>
            <Link href={`/blog/${post.slug}`} className="!mt-2 inline-block text-sm font-medium">
              Read
            </Link>
          </li>
        ))}
      </ul>
    </MarketingShell>
  );
}
