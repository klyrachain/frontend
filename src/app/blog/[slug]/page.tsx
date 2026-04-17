import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BLOG_POSTS, getPostBySlug } from "@/data/marketing/blog-posts";
import { MarketingShell } from "@/components/marketing/MarketingShell";
import { pageMetadata } from "@/lib/site";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return BLOG_POSTS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return { title: "Not found" };
  return pageMetadata(post.title, post.excerpt, `/blog/${post.slug}`);
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();

  return (
    <MarketingShell
      title={post.title}
      breadcrumbs={[{ label: "Blog", href: "/blog" }]}
    >
      <p className="text-sm text-muted-foreground">{post.date}</p>
      <p className="text-sm text-muted-foreground">
        <Link href="/blog" className="text-primary underline underline-offset-4">
          ← All posts
        </Link>
      </p>
      {post.sections.map((sec, i) => (
        <section key={i} className="space-y-3">
          {sec.heading ? <h2>{sec.heading}</h2> : null}
          {sec.paragraphs.map((p, j) => (
            <p key={j}>{p}</p>
          ))}
        </section>
      ))}
    </MarketingShell>
  );
}
