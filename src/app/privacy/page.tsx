import type { Metadata } from "next";
import Link from "next/link";
import { MarketingShell } from "@/components/marketing/MarketingShell";
import { pageMetadata } from "@/lib/site";

export const metadata: Metadata = pageMetadata(
  "Privacy policy",
  "How Morapay collects, uses, and protects personal data across our websites and services.",
  "/privacy"
);

export default function PrivacyPage() {
  return (
    <MarketingShell
      title="Privacy policy"
      description="Last updated: April 2026. Describes processing for morapay.com and related applications."
    >
      <p>
        This policy explains how Morapay (&quot;we&quot;, &quot;us&quot;) handles personal data when you visit our
        sites, use our dashboards or APIs, or interact with payment flows we power. If you are in the EEA/UK, we
        identify our roles (controller vs. processor) in agreements with business customers where applicable.
      </p>
      <h2>1. Data we collect</h2>
      <ul>
        <li>
          <strong>Account</strong> — name, email, phone, company details, and credentials you provide.
        </li>
        <li>
          <strong>Transactions</strong> — amounts, currencies, timestamps, counterparties, and technical metadata
          needed to process and reconcile payments.
        </li>
        <li>
          <strong>Verification</strong> — identity documents and checks performed with vendors for KYC/KYB as
          required by law and risk policy.
        </li>
        <li>
          <strong>Technical</strong> — IP address, device identifiers, cookies, and logs for security and
          debugging.
        </li>
      </ul>
      <h2>2. How we use data</h2>
      <p>We process data to provide and improve the Services, comply with law, prevent fraud, and support you.</p>
      <h2>3. Legal bases (where GDPR applies)</h2>
      <p>
        Depending on context we rely on contract, legitimate interests (such as fraud prevention and product
        analytics), legal obligation, or consent where required.
      </p>
      <h2>4. Sharing</h2>
      <p>
        We share data with payment partners, verification providers, cloud hosting, and analytics vendors under
        contracts that limit use to service delivery. We may disclose information if required by law or to protect
        rights and safety.
      </p>
      <h2>5. Retention</h2>
      <p>
        We keep data as long as needed for the purposes above, including statutory retention for financial
        records, then delete or anonymize it according to our retention schedule.
      </p>
      <h2>6. Security</h2>
      <p>
        We use administrative, technical, and organizational measures appropriate to risk. No method of
        transmission over the Internet is completely secure.
      </p>
      <h2>7. Your rights</h2>
      <p>
        Depending on your location, you may have rights to access, rectify, delete, restrict, or port your data,
        and to object to certain processing. Contact us to exercise rights; you may also lodge a complaint with a
        supervisory authority.
      </p>
      <h2>8. International transfers</h2>
      <p>
        Where we transfer data across borders we use appropriate safeguards such as standard contractual clauses
        where required.
      </p>
      <h2>9. Children</h2>
      <p>Our Services are not directed at children under 16.</p>
      <h2>10. Changes</h2>
      <p>
        We will post updates here and adjust the &quot;Last updated&quot; date. Continued use after changes means
        acceptance where permitted by law.
      </p>
      <h2>11. Contact</h2>
      <p>
        Privacy questions: <Link href="/contact">Contact</Link> or your account representative.
      </p>
    </MarketingShell>
  );
}
