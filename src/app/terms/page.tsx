import type { Metadata } from "next";
import Link from "next/link";
import { MarketingShell } from "@/components/marketing/MarketingShell";
import { pageMetadata } from "@/lib/site";

export const metadata: Metadata = pageMetadata(
  "Terms of service",
  "Terms governing use of Morapay websites, APIs, and related services.",
  "/terms"
);

export default function TermsPage() {
  return (
    <MarketingShell
      title="Terms of service"
      description="Last updated: April 2026. Read alongside our Privacy policy."
    >
      <p>
        These Terms govern access to Morapay websites, dashboards, APIs, and related services (the
        &quot;Services&quot;). By using the Services you agree to these Terms. If you use Morapay on behalf of a
        company, you represent that you have authority to bind that organization.
      </p>
      <h2>1. The Services</h2>
      <p>
        Morapay provides software for payments, payouts, quotes, and related workflows. We may modify features with
        reasonable notice where materially adverse. Some features depend on third-party banks, card networks,
        liquidity providers, or blockchains; we are not responsible for outages or policy changes outside our
        control.
      </p>
      <h2>2. Accounts and security</h2>
      <p>
        You must provide accurate registration information and keep credentials secure. You are responsible for
        activity under your account, including API keys and webhook endpoints. Notify us promptly of unauthorized
        use.
      </p>
      <h2>3. Compliance</h2>
      <p>
        You will use the Services only for lawful purposes and in compliance with applicable sanctions,
        anti-money-laundering, and licensing rules in your jurisdictions. We may request identity or business
        verification and may suspend activity that presents undue risk.
      </p>
      <h2>4. Fees</h2>
      <p>
        Fees are described in your order form, pricing page, or in-product disclosure at the time of the
        transaction. Taxes may apply where required. We may change standard pricing with notice to existing
        merchants as described in your agreement.
      </p>
      <h2>5. Data and privacy</h2>
      <p>
        Our collection and use of personal data is described in the{" "}
        <Link href="/privacy">Privacy policy</Link>. You will not misuse personal data obtained through the
        Services and will obtain any required consents from your customers.
      </p>
      <h2>6. Intellectual property</h2>
      <p>
        Morapay retains rights in the Services, branding, and documentation. Subject to these Terms, we grant you
        a limited, non-exclusive license to use the Services during your subscription or relationship with us.
      </p>
      <h2>7. Disclaimers</h2>
      <p>
        The Services are provided &quot;as is&quot; to the maximum extent permitted by law. We disclaim implied
        warranties where allowed. Nothing in these Terms limits liability that cannot be limited by law.
      </p>
      <h2>8. Limitation of liability</h2>
      <p>
        To the fullest extent permitted, our aggregate liability arising from the Services is capped at the fees
        you paid to Morapay for the Services in the three months preceding the claim (or fifty dollars if no fees
        applied). We are not liable for indirect or consequential damages.
      </p>
      <h2>9. Termination</h2>
      <p>
        You may stop using the Services at any time. We may suspend or terminate access for breach, risk, or legal
        requirements. Provisions that should survive (fees owed, liability limits, governing law) will survive.
      </p>
      <h2>10. Governing law</h2>
      <p>
        These Terms are governed by the laws chosen in your enterprise agreement, or otherwise by the laws of the
        jurisdiction where Morapay operates its contracting entity, without regard to conflict-of-law rules.
      </p>
      <h2>11. Contact</h2>
      <p>
        Questions about these Terms: <Link href="/contact">Contact</Link>.
      </p>
    </MarketingShell>
  );
}
