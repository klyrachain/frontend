import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AppErrorPanel } from "@/components/feedback/app-error-panel";
import { PaintedBackground } from "@/components/Landing/Paintedbackground";
import { presentationByKey } from "@/lib/app-error-presentation";

export default function NotFound() {
  const presentation = presentationByKey("page_not_found");

  return (
    <div className="app-premium-ui landing-page relative min-h-screen bg-transparent text-foreground">
      <PaintedBackground />
      <div className="relative z-20">
        <main
          className="flex min-h-screen flex-col items-center justify-center px-2 py-12 app-premium-ui"
          aria-label="Page not found"
        >
          <article className="glass-card w-full max-w-lg overflow-visible p-4 py-6 shadow-2xl">
            <header className="mb-4 flex items-center justify-center pb-3">
              <h1 className="text-xl font-semibold text-card-foreground text-center">Page not found</h1>
            </header>

            {presentation ? <AppErrorPanel presentation={presentation} /> : null}

            <div className="mt-4 flex justify-center">
              <Button asChild>
                <Link href="/">Back to home</Link>
              </Button>
            </div>

            {/* <footer className="mt-8 pt-4 text-center text-xs text-muted-foreground">
              Powered by Morapay
            </footer> */}
          </article>
        </main>
      </div>
    </div>
  );
}
