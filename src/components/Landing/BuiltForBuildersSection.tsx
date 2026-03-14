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
      className="mx-auto pt-[var(--g12)] max-w-7xl px-[var(--g2)] py-[var(--g8)] md:px-[var(--g4)] md:py-[var(--g10)]"
      aria-labelledby="built-for-builders-heading"
    >
      <h2
        id="built-for-builders-heading"
        className="text-center text-2xl font-bold text-foreground md:text-3xl lg:text-4xl md:text-[64px] lg:text-[72px]"
        style={{ marginBottom: "var(--g2)" }}
      >
        Built for Builders. 
        <br/>Optimized for Users.
      </h2>
      <p
        className="mx-auto max-w-2xl text-center text-base text-muted-foreground md:text-lg"
        style={{ marginBottom: "var(--g6)", lineHeight: 1.6 }}
      >
        The Klyra SDK abstracts the complexity of global payments.
        Onramp, offramp, and settle in any currency with one unified integration.
      </p>

      <div className="grid lg:grid-cols-2 gap-2 bg-gray-300 p-2 rounded-xl">
        <article className="flex flex-col rounded-xl border border-border w-full bg-card p-[var(--g3)] md:p-[var(--g3)]">
          <h3
            className="text-xl font-semibold text-black md:text-2xl"
            style={{ marginBottom: "var(--g1)" }}
          >
            Build how you want
          </h3>
          <p
            className="text-muted-foreground"
            style={{ marginBottom: "var(--g1)", lineHeight: 1.6 }}
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
        </article>

        <article className="flex flex-col rounded-xl border border-border w-full bg-card p-[var(--g3)] md:p-[var(--g3)]">
          <h3
            className="text-xl font-semibold text-black md:text-2xl"
            style={{ marginBottom: "var(--g1)" }}
          >
            About the API
          </h3>
          <p
            className="text-muted-foreground"
            style={{ marginBottom: "var(--g1)", lineHeight: 1.6 }}
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
