const ANALYTICS_DASHBOARD_IMAGE_PATH = "/images/analytics-dashboard-screenshot.png";

export function InsightsSection() {
  return (
    <section
      className="mx-auto max-w-7xl px-[var(--g2)] py-[var(--g8)] md:px-[var(--g4)] md:py-[var(--g10)]"
      aria-labelledby="insights-heading"
    >
      <h2
        id="insights-heading"
        className="text-center text-2xl font-bold text-foreground md:text-3xl lg:text-4xl"
        style={{ marginBottom: "var(--g2)" }}
      >
        Insights That Drive Conversion.
      </h2>
      <p
        className="mx-auto max-w-2xl text-center text-base text-muted-foreground md:text-lg"
        style={{ marginBottom: "var(--g8)", lineHeight: 1.6 }}
      >
        Use data to make informed decisions and optimize your business for
        growth.
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
