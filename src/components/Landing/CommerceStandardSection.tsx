import { LaunchAppButton } from "./LaunchAppButton";

const LOGO_IMAGE_PATH = "/images/logo.png";

export function CommerceStandardSection() {
  return (
    <section
      className="mx-auto max-w-7xl px-[var(--g2)] py-[var(--g8)] md:px-[var(--g4)] md:py-[var(--g10)]"
      aria-labelledby="commerce-standard-heading"
    >
      <div className="flex flex-col items-center text-center">
        <img
          src={LOGO_IMAGE_PATH}
          alt=""
          width={48}
          height={48}
          className="mb-[var(--g3)] h-12 w-12 shrink-0 object-contain"
          aria-hidden
        />
        <h2
          id="commerce-standard-heading"
          className="text-2xl font-bold text-foreground md:text-3xl lg:text-4xl"
          style={{ marginBottom: "var(--g2)" }}
        >
          Defining the New Standard for Commerce.
        </h2>
        <p
          className="mx-auto max-w-2xl text-muted-foreground"
          style={{ marginBottom: "var(--g4)", lineHeight: 1.6 }}
        >
          Accelerate growth and simplify operations across use cases,
          industries, and business models.
        </p>
        <LaunchAppButton>Learn More</LaunchAppButton>
      </div>
    </section>
  );
}
