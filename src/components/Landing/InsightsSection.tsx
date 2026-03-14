const ANALYTICS_DASHBOARD_IMAGE_PATH = "/images/analytics-dashboard-screenshot.png";

export function InsightsSection() {
  return (
    <section
      className="mx-auto max-w-7xl px-[var(--g2)] py-[var(--g8)] md:px-[var(--g4)] md:py-[var(--g10)]"
      aria-labelledby="insights-heading"
    >
      <h2
        id="insights-heading"
        className="text-center font-bold text-foreground text-3xl md:text-3xl lg:text-4xl md:text-[48px] lg:text-[48px]"
        style={{ marginBottom: "var(--g2)" }}
      >
        Insights That Drive <br/>Conversion.
      </h2>
      {/* <p
        className="mx-auto max-w-lg text-center text-muted-foreground text-base md:text-lg"
        style={{ marginBottom: "var(--g8)", lineHeight: 1.6 }}
      > */}
      <p
          className="mx-auto max-w-xl text-muted-foreground text-base md:text-lg"
          style={{ marginBottom: "var(--g8)", lineHeight: 1.4 }}
        >
        Deep dive into your payment data. Understand drop-off points in your <br/>
         onramp flow and optimize your checkout to maximize revenue. 
      </p>
      <figure>
        <img
          src={ANALYTICS_DASHBOARD_IMAGE_PATH}
          alt="Analytics and reporting dashboard with charts and tables"
          className="w-full rounded-lg border border-border shadow-lg"
        />
      </figure>
    </section>
  );
}
