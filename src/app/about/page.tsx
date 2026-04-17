import type { Metadata } from "next";
import { MarketingShell } from "@/components/marketing/MarketingShell";
import { pageMetadata } from "@/lib/site";

export const metadata: Metadata = pageMetadata(
  "About Morapay",
  "Morapay connects fiat and digital asset settlement for businesses and consumers with a compliance-first platform.",
  "/about"
);

export default function AboutPage() {
  return (
    <MarketingShell
      title="About Morapay"
      description="We build payment infrastructure that works across borders without hiding risk or fees."
    >
      <p>
        Morapay helps merchants accept and settle value across card, bank, and on-chain rails. Our focus is
        transparent pricing, reliable webhooks, and verification flows that scale from first transaction to
        enterprise volume.
      </p>
      <h2>What we prioritize</h2>
      <ul>
        <li>Clear reconciliation: every payment and payout is traceable in your dashboard and exports.</li>
        <li>Operational safety: rate limits, signed callbacks, and audit trails for money movement.</li>
        <li>Flexible verification: person and business checks that match your risk profile.</li>
      </ul>
      <p>
        We operate with partners for banking and liquidity; Morapay is the software layer that unifies those
        relationships for your product.
      </p>
    </MarketingShell>
  );
}
