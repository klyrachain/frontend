import Link from "next/link";

const DEV_CODE_IMAGE_PATH = "/images/dev-code-screenshot.png";
const API_SCREENSHOT_1_PATH = "/images/api-screenshot-1.png";
const API_SCREENSHOT_2_PATH = "/images/api-screenshot-2.png";
const API_SCREENSHOT_3_PATH = "/images/api-screenshot-3.png";
const API_SCREENSHOT_4_PATH = "/images/api-screenshot-4.png";

const FEATURES = [
  "Full-stack",
  "Modern languages",
  "Pre-built components",
] as const;

const API_GALLERY = [
  API_SCREENSHOT_1_PATH,
  API_SCREENSHOT_2_PATH,
  API_SCREENSHOT_3_PATH,
  API_SCREENSHOT_4_PATH,
] as const;

export function BuiltForBuildersSection() {
  return (
    <section
      className="mx-auto max-w-7xl px-[var(--g2)] py-[var(--g8)] md:px-[var(--g4)] md:py-[var(--g10)]"
      aria-labelledby="built-for-builders-heading"
    >
      <h2
        id="built-for-builders-heading"
        className="text-center text-2xl font-bold text-foreground md:text-3xl lg:text-4xl"
        style={{ marginBottom: "var(--g2)" }}
      >
        Built for Builders. Optimized for Users.
      </h2>
      <p
        className="mx-auto max-w-2xl text-center text-base text-muted-foreground md:text-lg"
        style={{ marginBottom: "var(--g6)", lineHeight: 1.6 }}
      >
        Create powerful payment experiences with our API, SDKs, and no-code
        tools.
      </p>

      <div className="grid gap-[var(--g6)] lg:grid-cols-2 lg:gap-[var(--g8)]">
        <article className="flex flex-col rounded-xl border border-border bg-card p-[var(--g4)] md:p-[var(--g5)]">
          <h3
            className="text-xl font-semibold text-foreground md:text-2xl"
            style={{ marginBottom: "var(--g2)" }}
          >
            Build how you want
          </h3>
          <p
            className="text-muted-foreground"
            style={{ marginBottom: "var(--g3)", lineHeight: 1.6 }}
          >
            Use our REST API, SDKs, or no-code tools to integrate payments your
            way. Start in sandbox and go live when ready.
          </p>
          <figure
            className="mb-[var(--g4)] rounded-lg border border-border bg-muted/30 p-[var(--g3)]"
            aria-hidden
          >
            <img
              src={DEV_CODE_IMAGE_PATH}
              alt=""
              className="w-full rounded object-cover font-mono text-sm"
            />
          </figure>
          <Link
            href="#"
            className="mb-[var(--g4)] inline-flex h-10 w-fit items-center justify-center rounded-lg bg-[#1A1A1A] px-6 text-sm font-semibold text-white hover:bg-[#2A2A2A] dark:bg-white dark:text-[#1A1A1A] dark:hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            View Documentation
          </Link>
          <ul
            className="mt-auto list-none space-y-[var(--g1)] text-sm text-muted-foreground"
            style={{ paddingLeft: 0 }}
          >
            {FEATURES.map((label) => (
              <li key={label} className="flex items-center gap-[var(--g2)]">
                <span aria-hidden>✓</span>
                {label}
              </li>
            ))}
          </ul>
        </article>

        <article className="flex flex-col rounded-xl border border-border bg-card p-[var(--g4)] md:p-[var(--g5)]">
          <h3
            className="text-xl font-semibold text-foreground md:text-2xl"
            style={{ marginBottom: "var(--g2)" }}
          >
            About the API
          </h3>
          <p
            className="text-muted-foreground"
            style={{ marginBottom: "var(--g4)", lineHeight: 1.6 }}
          >
            A unified API that handles acceptance, routing, and settlement.
            Configurable flows, reporting, and compliance in one place.
          </p>
          <div className="grid grid-cols-2 gap-[var(--g2)]">
            {API_GALLERY.map((src, i) => (
              <img
                key={src}
                src={src}
                alt=""
                className="aspect-video w-full rounded-lg border border-border object-cover"
              />
            ))}
          </div>
        </article>
      </div>
    </section>
  );
}
