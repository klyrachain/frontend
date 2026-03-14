import Link from "next/link";

const WORKFLOW_IMAGE_PATH = "/images/workflow-screenshot.png";

export function TailoredBusinessSection() {
  return (
    <section
      className="mx-auto max-w-7xl px-[var(--g2)] py-[var(--g8)] md:px-[var(--g4)] md:py-[var(--g10)]"
      aria-labelledby="tailored-heading"
    >
      <div className="grid items-center gap-[var(--g6)] lg:grid-cols-2 lg:gap-[var(--g8)]">
        <div>
          <h2
            id="tailored-heading"
            className="text-2xl font-bold text-foreground md:text-3xl lg:text-4xl"
            style={{ marginBottom: "var(--g2)" }}
          >
            Tailored to Your Business. Built for Your Flow.
          </h2>
          <p
            className="text-base text-muted-foreground md:text-lg"
            style={{ marginBottom: "var(--g4)", lineHeight: 1.6 }}
          >
            Accelerate growth and simplify operations across use cases,
            industries, and business models.
          </p>
          <Link
            href="#"
            className="inline-flex h-10 items-center justify-center rounded-lg bg-[#1A1A1A] px-6 text-sm font-semibold text-white hover:bg-[#2A2A2A] dark:bg-white dark:text-[#1A1A1A] dark:hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            Learn More
          </Link>
        </div>
        <figure className="order-first lg:order-none">
          <img
            src={WORKFLOW_IMAGE_PATH}
            alt="Workflow builder or multi-step process interface"
            className="w-full rounded-lg border border-border shadow-md"
          />
        </figure>
      </div>
    </section>
  );
}
