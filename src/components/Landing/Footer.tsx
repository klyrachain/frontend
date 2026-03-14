import Link from "next/link";
import { LaunchAppButton } from "./LaunchAppButton";

const LOGO_IMAGE_PATH = "/images/logo.png";

const FOOTER_SECTIONS = [
  {
    heading: "Product",
    links: [
      { label: "API", href: "#" },
      { label: "SDKs", href: "#" },
      { label: "Pricing", href: "#" },
    ],
  },
  {
    heading: "Company",
    links: [
      { label: "About Us", href: "#" },
      { label: "Careers", href: "#" },
      { label: "Blog", href: "#" },
    ],
  },
  {
    heading: "Resources",
    links: [
      { label: "Documentation", href: "#" },
      { label: "Guides", href: "#" },
      { label: "Blog", href: "#" },
    ],
  },
  {
    heading: "Support",
    links: [
      { label: "Help Center", href: "#" },
      { label: "Contact", href: "#" },
    ],
  },
] as const;

export function Footer() {
  return (
    <footer
      className="bg-[#1A1A1A] text-white dark:bg-foreground w-[calc(100vw-2rem)] rounded-xl flex justify-center items-center m-auto"
      role="contentinfo"
    >
      <div className="mx-auto w-full px-[var(--g2)] py-[var(--g8)] md:px-[var(--g4)] md:py-[var(--g10)]">
        <div
          className="flex flex-col items-center text-center"
          style={{ marginBottom: "var(--g8)" }}
        >
          <img
            src={LOGO_IMAGE_PATH}
            alt=""
            width={48}
            height={48}
            className="mb-[var(--g4)] h-12 w-12 shrink-0 object-contain invert dark:invert-0"
            aria-hidden
          />
          <h2
            className="text-2xl font-bold text-white md:text-3xl"
            style={{ marginBottom: "var(--g2)" }}
          >
            Ready to Bridge the Gap?
          </h2>
          <p
            className="mx-auto max-w-xl text-white/80"
            style={{ marginBottom: "var(--g4)", marginTop: 0, lineHeight: 1.6 }}
          >
            Sign up for early access to our platform.
          </p>
          <LaunchAppButton variant="outline" href="#">
            Launch App
          </LaunchAppButton>
        </div>

        <nav
          className="grid gap-[var(--g6)] border-t border-white/20 pt-[var(--g6)] sm:grid-cols-2 md:grid-cols-4 md:gap-[var(--g8)]"
          aria-label="Footer"
        >
          {FOOTER_SECTIONS.map(({ heading, links }) => (
            <div key={heading}>
              <h3
                className="text-sm font-semibold uppercase tracking-wider text-white/90"
                style={{ marginBottom: "var(--g2)" }}
              >
                {heading}
              </h3>
              <ul
                className="flex flex-col gap-[var(--g2)]"
                style={{ paddingLeft: 0, listStyle: "none" }}
              >
                {links.map(({ label, href }) => (
                  <li key={label}>
                    <Link
                      href={href}
                      className="text-white/80 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#1A1A1A] rounded"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        <p
          className="mt-[var(--g6)] text-center text-sm text-white/60"
          style={{ marginBottom: 0 }}
        >
          © {new Date().getFullYear()} Klyra. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
