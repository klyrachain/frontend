import { LaunchAppButton } from "./LaunchAppButton";

const LOGO_IMAGE_PATH = "/images/logo.png";

export function CommerceStandardSection() {
  return (
    <section
      className="mx-auto max-w-7xl px-[var(--g2)] py-[var(--g8)] md:px-[var(--g4)] md:py-[var(--g10)] "
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
          className="text-3xl md:text-3xl lg:text-4xl md:text-[48px] lg:text-[48px] font-bold text-foreground"
          style={{ marginBottom: "var(--g2)" }}
        >
          Defining the New Standard <br/>for Commerce.
        </h2>
        <p
          className="mx-auto max-w-xl text-muted-foreground text-base md:text-lg"
          style={{ marginBottom: "var(--g4)", lineHeight: 1.4 }}
        >
          Traditional paymment rails are slow. Cryto rails are complex. 
          Klyra is the <br/> bridge. We've built a framework that treats digital assets and fiat as one
          <br/>providing a high-speed lane for global value exchange.
        </p>
        <LaunchAppButton>Learn More</LaunchAppButton>
      </div>
    </section>
  );
}
