import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main
      className="min-h-screen flex items-center justify-center bg-zinc-900 "
      role="main"
      aria-label="Page not found"
    >
      <section
        className="w-full h-full rounded-2xl bg-white p-12 sm:p-16 text-center overflow-hidden bg-white"
        aria-labelledby="not-found-heading"
      >
        <div
          className="absolute inset-0 w-full h-full opacity-[0.03]"
          style={{
            backgroundImage: `
              linear-gradient(to right, #a1a1aa 1px, transparent 1px),
              linear-gradient(to bottom, #a1a1aa 1px, transparent 1px)
            `,
            backgroundSize: "24px 24px",
          }}
          aria-hidden
        />
        <div className="relative flex flex-col items-center gap-6 w-full h-full ">
          <h1
            id="not-found-heading"
            className="text-[4rem] sm:text-[6rem] font-bold text-zinc-800 tracking-tight select-none"
            style={{
              textShadow:
                "0 1px 0 rgba(255,255,255,0.8), 0 2px 4px rgba(0,0,0,0.06)",
            }}
          >
            404
          </h1>
          <p className="text-zinc-500 text-base sm:text-lg">
            Page not found.{" "}
            <Button variant="link" size="sm" className="p-0 h-auto text-base" asChild>
              <Link href="/" className="text-zinc-700 hover:text-zinc-900 font-medium underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 rounded">
                Go back
              </Link>
            </Button>
          </p>
        </div>
      </section>
    </main>
  );
}
