import type { Metadata } from "next";
import Link from "next/link";
import { MarketingShell } from "@/components/marketing/MarketingShell";
import { pageMetadata } from "@/lib/site";

export const metadata: Metadata = pageMetadata(
  "Help center",
  "Answers to common Morapay questions on payments, payouts, and accounts.",
  "/help"
);

export default function HelpPage() {
  return (
    <MarketingShell
      title="Help center"
      description="Quick answers. For account-specific issues, contact support with transaction references."
    >
      <h2>Payments</h2>
      <p>
        <strong>Why is my card declined?</strong> Issuing banks decline for fraud rules, limits, or 3DS failures.
        Retry with another method or ask the payer to contact their bank.
      </p>
      <p>
        <strong>Where is my settlement?</strong> Settlement timing depends on rail and merchant risk tier. Check
        the payout section of your dashboard for scheduled deposits.
      </p>
      <h2>Wallets and on-chain</h2>
      <p>
        <strong>Wrong network?</strong> Quotes are chain-specific. Switch your wallet to the quoted network
        before confirming.
      </p>
      <h2>Accounts</h2>
      <p>
        <strong>Verification pending</strong> — Upload clear documents and match legal names. KYB can take longer
        for complex ownership structures.
      </p>
      <p>
        Still stuck? <Link href="/contact">Contact us</Link> with timestamps and any error codes shown in the app.
      </p>
    </MarketingShell>
  );
}
