import type { Metadata } from "next";
import Link from "next/link";
import { MarketingShell } from "@/components/marketing/MarketingShell";
import { pageMetadata } from "@/lib/site";

export const metadata: Metadata = pageMetadata(
  "Pricing",
  "Morapay pricing is built around transparent fees per transaction and optional platform services.",
  "/pricing"
);

export default function PricingPage() {
  return (
    <MarketingShell
      title="Pricing"
      description="Exact rates depend on corridor, volume, and verification tier. Below is how we structure commercial terms."
    >
      <h2>Pay-ins and checkout</h2>
      <p>
        Card and local payment methods are priced as a percentage plus a small fixed fee per successful charge.
        Cross-border routes may include an FX margin disclosed at quote time.
      </p>
      <h2>Payouts and settlement</h2>
      <p>
        Fiat payouts to bank accounts or mobile money are billed per transfer or as part of a monthly minimum
        for high-volume merchants. On-chain settlement uses network fees pass-through plus platform fee where
        applicable.
      </p>
      <h2>Platform and compliance</h2>
      <p>
        Advanced KYB, dedicated support, and custom integrations are quoted after scoping. Starter businesses use
        self-serve verification and standard SLAs.
      </p>
      <p>
        <Link href="/contact">Contact sales</Link> with your expected monthly volume and markets for a tailored
        quote.
      </p>
    </MarketingShell>
  );
}
