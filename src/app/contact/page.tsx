import type { Metadata } from "next";
import { ContactForm } from "@/components/marketing/ContactForm";
import { MarketingShell } from "@/components/marketing/MarketingShell";
import { pageMetadata } from "@/lib/site";

export const metadata: Metadata = pageMetadata(
  "Contact",
  "Reach the Morapay team for sales, support, partnerships, or compliance questions.",
  "/contact"
);

export default function ContactPage() {
  return (
    <MarketingShell
      title="Contact"
      description="We route messages to the right team. You will receive a short confirmation email after submission."
    >
      <ContactForm />
    </MarketingShell>
  );
}
