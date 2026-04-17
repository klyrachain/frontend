import type { Metadata } from "next";
import Link from "next/link";
import { MarketingShell } from "@/components/marketing/MarketingShell";
import { pageMetadata } from "@/lib/site";

export const metadata: Metadata = pageMetadata(
  "API overview",
  "Morapay HTTP APIs for quotes, checkout, merchant operations, and webhooks.",
  "/developers/api"
);

export default function DevelopersApiPage() {
  return (
    <MarketingShell
      title="API overview"
      description="Server-to-server JSON APIs. Authenticate with your issued keys; never expose secrets in client bundles."
      breadcrumbs={[{ label: "Developers", href: "/developers/api" }]}
    >
      <h2>Core capabilities</h2>
      <ul>
        <li>
          <strong>Quotes</strong> — Route and price swaps or cross-border transfers before creating a user-facing
          transaction.
        </li>
        <li>
          <strong>Commerce</strong> — Payment links, hosted checkout, and order state for digital and physical
          goods.
        </li>
        <li>
          <strong>Merchant</strong> — Balances, payouts, fee schedules, and webhook endpoints for your
          integration.
        </li>
      </ul>
      <h2>Webhooks</h2>
      <p>
        Register HTTPS endpoints in the dashboard. Payloads are signed so you can verify origin. Design handlers
        to be idempotent using provider reference IDs.
      </p>
      <h2>Environments</h2>
      <p>
        Use sandbox keys for integration tests; production keys are scoped to your live merchant profile. Rotate
        keys from the dashboard without downtime when dual-signing is enabled.
      </p>
      <p>
        <Link href="/docs">Documentation hub</Link> links to detailed request and response schemas maintained with
        each release.
      </p>
    </MarketingShell>
  );
}
