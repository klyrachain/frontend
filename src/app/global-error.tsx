"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import "./globals.css";
import { logClientErrorToServer } from "@/lib/client-error-log-client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const loggedKey = useRef<string | null>(null);

  useEffect(() => {
    const key = `${error.message}:${error.digest ?? ""}`;
    if (loggedKey.current === key) return;
    loggedKey.current = key;
    logClientErrorToServer({
      message: error.message,
      digest: error.digest,
      stack: error.stack,
    });
  }, [error]);

  return (
    <html lang="en">
      <body className="antialiased bg-background text-foreground">
        <main
          className="flex min-h-screen items-center justify-center px-4 py-12"
          role="alert"
        >
          <section className="w-full max-w-md rounded-2xl border border-border/80 bg-card/85 p-8 text-center shadow-lg backdrop-blur-md">
            <h1 className="text-xl font-semibold tracking-tight">Something went wrong</h1>
            <p className="mt-3 text-sm text-muted-foreground">
              An unexpected error occurred. You can try again or return home.
            </p>
            <div className="mt-8 flex flex-col gap-2 sm:flex-row sm:justify-center">
              <Button type="button" onClick={() => reset()}>
                Try again
              </Button>
              <Button variant="outline" asChild>
                <Link href="/">Back to home</Link>
              </Button>
            </div>
          </section>
        </main>
      </body>
    </html>
  );
}
