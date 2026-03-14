const LOGO_IMAGE_PATH = "/images/logo.png";
const COLLABORATE_LOGO_PATH = "/images/collaborate-logo.png";

interface FeatureItem {
  title: string;
  description: string;
  imagePath: string;
  imageAlt: string;
  value?: string;
}

const FEATURES: FeatureItem[] = [
  {
    title: "Customizable",
    description: "Tailor checkout, routing rules, and branding to match your business.",
    imagePath: "/images/customizable-icon.png",
    imageAlt: "Customizable",
  },
  {
    title: "Scalable",
    value: "100+",
    description: "Handle growth with infrastructure built for high volume.",
    imagePath: "/images/scalable-icon.png",
    imageAlt: "Scalable",
  },
  {
    title: "Secure",
    value: "320",
    description: "Enterprise-grade security and compliance built in.",
    imagePath: "/images/secure-icon.png",
    imageAlt: "Secure",
  },
  {
    title: "Integrated",
    description: "Connect to your stack with pre-built integrations.",
    imagePath: "/images/integrations-icon.png",
    imageAlt: "Integrations",
  },
];

export function PaymentEngineFeatures() {
  return (
    <section
      className="mx-auto max-w-7xl px-[var(--g2)] py-[var(--g8)] md:px-[var(--g4)] md:py-[var(--g10)]"
      aria-labelledby="payment-engine-heading"
    >
      <div
        className="flex flex-col items-center text-center"
        style={{ marginBottom: "var(--g8)" }}
      >
        <img
          src={LOGO_IMAGE_PATH}
          alt=""
          width={48}
          height={48}
          className="mb-[var(--g4)] h-12 w-12 shrink-0 object-contain"
          aria-hidden
        />
        <h2
          id="payment-engine-heading"
          className="text-2xl font-bold text-foreground md:text-3xl lg:text-4xl md:text-[48px] lg:text-[48px]"
          style={{ marginBottom: "var(--g2)" }}
        >
          A Full-Stack Payment Engine
        </h2>
        <p
          className="max-w-2xl text-muted-foreground"
          style={{ lineHeight: 1.6 }}
        >
          Build your next product with a fully integrated platform.
        </p>
      </div>

      <div className="mb-[var(--g8)] grid lg:grid-cols-2 gap-2 bg-gray-300 p-2 rounded-xl">
        {FEATURES.map((feature) => (
          <article
            key={feature.title}
            className="flex flex-col rounded-xl border border-border w-full bg-card p-[var(--g3)] md:p-[var(--g3)]"
          >
            <img
              src={feature.imagePath}
              alt={feature.imageAlt}
              className="mb-[var(--g2)] h-12 w-12 shrink-0 object-contain md:h-14 md:w-14"
            />
            <h3
              className="text-xl font-semibold text-black md:text-2xl"
              style={{ marginBottom: "var(--g1)" }}
            >
              {feature.title}
            </h3>
            {feature.value !== undefined && (
              <p
                className="text-2xl font-bold text-foreground"
                style={{ marginBottom: "var(--g1)" }}
              >
                {feature.value}
              </p>
            )}
            <p
              className="text-muted-foreground"
              style={{ marginBottom: "var(--g1)", lineHeight: 1.6 }}
            >
              {feature.description}
            </p>
          </article>
        ))}
      </div>

      <figure className="flex justify-center" aria-hidden>
        <img
          src={COLLABORATE_LOGO_PATH}
          alt=""
          className="h-12 w-auto object-contain md:h-16"
        />
      </figure>
    </section>
  );
}
