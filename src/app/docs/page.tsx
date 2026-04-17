import type { Metadata } from "next";
import Link from "next/link";
import { MarketingShell } from "@/components/marketing/MarketingShell";
import { pageMetadata } from "@/lib/site";

export const metadata: Metadata = pageMetadata(
  "Documentation",
  "Morapay documentation: APIs, webhooks, verification, and operations.",
  "/docs"
);

export default function DocsPage() {
  return (
    <MarketingShell
      title="Documentation"
      description="Central index for integration and operations. Content tracks the current production API version."
    >
      <h2>Get started</h2>
      <ol>
        <li>Create a merchant workspace and obtain API keys.</li>
        <li>Configure webhook URLs and signing secrets.</li>
        <li>Run a sandbox payment before enabling live volume.</li>
      </ol>
      <h2>Topics</h2>
      <ul>
        <li>
          <Link href="/developers/api">API reference overview</Link>
        </li>
        <li>
          <Link href="/developers/sdks">SDKs and samples</Link>
        </li>
        <li>
          <Link href="/guides">How-to guides</Link>
        </li>
        <li>
          <Link href="/help">Help center</Link>
        </li>
      </ul>
      <p>
        For contract-specific annexes (SLA, DPA, subprocessors), request them from{" "}
        <Link href="/contact">Contact</Link> after an NDA where required.
      </p>
    </MarketingShell>
  );
}
