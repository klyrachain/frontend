const COLLABORATE_ICON_PATH = "/images/collaborate-icon.png";

export function CollaborateCTA() {
  return (
    <section
      className="mx-auto max-w-7xl px-[var(--g2)] py-[var(--g6)] md:px-[var(--g4)] md:py-[var(--g8)]"
      aria-labelledby="collaborate-heading"
    >
      <div className="flex flex-col items-center text-center">
        <span
          className="text-xs font-medium uppercase tracking-wider text-muted-foreground"
          style={{ marginBottom: "var(--g1)" }}
        >
          For
        </span>
        <h2
          id="collaborate-heading"
          className="flex flex-wrap items-center justify-center gap-2 text-3xl font-bold md:text-4xl lg:text-5xl"
        >
          <span className="text-orange-500">C</span>
          <span className="text-red-500">o</span>
          <span className="text-blue-500">l</span>
          <span className="text-blue-600">l</span>
          <span className="text-green-600">a</span>
          <span className="text-orange-500">b</span>
          <span className="text-red-500">o</span>
          <span className="text-blue-500">r</span>
          <span className="text-green-600">a</span>
          <span className="text-orange-500">t</span>
          <span className="text-blue-600">e</span>
          <img
            src={COLLABORATE_ICON_PATH}
            alt=""
            width={32}
            height={32}
            className="inline-block h-8 w-8 shrink-0"
            aria-hidden
          />
        </h2>
        <p
          className="mt-[var(--g2)] max-w-xl text-sm text-muted-foreground"
          style={{ lineHeight: 1.5 }}
        >
          Bring your team and tools together on one platform.
        </p>
      </div>
    </section>
  );
}
