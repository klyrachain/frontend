import type { Metadata } from "next";
import { BusinessSigninFlow } from "@/components/Business/BusinessSigninFlow";

export const metadata: Metadata = {
  title: "Business sign in | Morapay",
  description:
    "Sign in to your business account with email, passkey, magic link, or Google.",
};

export default function BusinessSigninPage() {
  return <BusinessSigninFlow />;
}
