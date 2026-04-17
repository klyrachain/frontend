import Link from "next/link";
import type { ReactNode } from "react";

type Breadcrumb = { label: string; href: string };

export function MarketingShell({
  title,
  description,
  breadcrumbs,
  children,
}: {
  title: string;
  description?: string;
  breadcrumbs?: Breadcrumb[];
  children: ReactNode;
}) {
  return (
    <div className="min-h-[70vh] bg-background">
      <div className="mx-auto max-w-3xl px-4 py-12 sm:py-16">
        <nav className="text-sm text-muted-foreground" aria-label="Breadcrumb">
          <Link href="/" className="underline-offset-4 hover:text-foreground hover:underline">
            Home
          </Link>
          {breadcrumbs?.map((b) => (
            <span key={b.href}>
              {" "}
              /{" "}
              <Link href={b.href} className="underline-offset-4 hover:text-foreground hover:underline">
                {b.label}
              </Link>
            </span>
          ))}
        </nav>
        <header className="mt-6 border-b border-border pb-6">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">{title}</h1>
          {description ? (
            <p className="mt-3 max-w-2xl text-base leading-relaxed text-muted-foreground">{description}</p>
          ) : null}
        </header>
        <div className="mt-8 space-y-6 text-[15px] leading-relaxed text-foreground [&_h2]:mt-10 [&_h2]:scroll-mt-20 [&_h2]:text-xl [&_h2]:font-semibold [&_h3]:mt-6 [&_h3]:text-base [&_h3]:font-semibold [&_ul]:list-disc [&_ul]:pl-5 [&_li]:mt-1 [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-4">
          {children}
        </div>
      </div>
    </div>
  );
}
