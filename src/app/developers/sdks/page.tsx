import type { Metadata } from "next";
import Link from "next/link";
import { MarketingShell } from "@/components/marketing/MarketingShell";
import { pageMetadata } from "@/lib/site";

export const metadata: Metadata = pageMetadata(
  "SDKs",
  "Client and server helpers for Morapay: TypeScript, React, and wallet connectivity.",
  "/developers/sdks"
);

export default function DevelopersSdksPage() {
  return (
    <MarketingShell
      title="SDKs"
      description="Prefer official packages for auth, typing, and stable upgrade paths."
      breadcrumbs={[{ label: "Developers", href: "/developers/api" }]}
    >
      <h2>TypeScript and Node</h2>
      <p>
        Use typed REST clients generated from our OpenAPI descriptions where available. Server-side code should
        hold API keys; browser code should call your backend which proxies to Morapay.
      </p>
      <h2>React and wallets</h2>
      <p>
        The consumer app uses Dynamic for multi-chain wallet connection alongside wagmi for EVM. Configure
        connectors and enabled chains in both the Dynamic dashboard and your deployment environment.
      </p>
      <h2>Mobile</h2>
      <p>
        Deep links and universal links for wallet apps follow standard provider patterns. Test on real devices;
        simulators often lack wallet apps installed.
      </p>
      <p>
        See <Link href="/guides">Guides</Link> for end-to-end examples.
      </p>
    </MarketingShell>
  );
}
