import type { Metadata } from "next";
import Link from "next/link";
import { MarketingShell } from "@/components/marketing/MarketingShell";
import { pageMetadata } from "@/lib/site";

export const metadata: Metadata = pageMetadata(
  "Guides",
  "Step-by-step Morapay guides for checkout, payouts, and webhooks.",
  "/guides"
);

export default function GuidesPage() {
  return (
    <MarketingShell
      title="Guides"
      description="Practical walkthroughs. Supplement with your own runbooks for internal compliance."
    >
      <h2>Featured flows</h2>
      <ul>
        <li>
          <strong>First live payment</strong> — Create a payment link, complete a test card charge, reconcile in
          the dashboard, then flip to production keys.
        </li>
        <li>
          <strong>Webhook hardening</strong> — Verify signatures, store raw payloads for disputes, replay safely
          with idempotency keys.
        </li>
        <li>
          <strong>Payout cutover</strong> — Validate bank or mobile-money details in sandbox, then schedule live
          payouts with caps per day.
        </li>
      </ul>
      <p>
        Articles on the <Link href="/blog">blog</Link> go deeper on settlement and verification strategy.
      </p>
    </MarketingShell>
  );
}
