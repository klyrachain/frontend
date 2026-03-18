import type { Metadata } from "next";
import { Suspense } from "react";
import { BusinessSignupFlow } from "@/components/Business/BusinessSignupFlow";
import { Loader2 } from "lucide-react";

export const metadata: Metadata = {
  title: "Business signup | Morapay",
  description:
    "Create a business account in minutes. Start in sandbox; add legal and banking details when you go live.",
};

function SignupLoadingFallback() {
  return (
    <main
      className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-zinc-50 text-zinc-600"
      aria-busy="true"
      aria-label="Loading signup"
    >
      <Loader2 className="size-8 shrink-0 animate-spin" aria-hidden />
      <span className="sr-only">Loading signup</span>
    </main>
  );
}

export default function BusinessSignupPage() {
  return (
    <Suspense fallback={<SignupLoadingFallback />}>
      <BusinessSignupFlow />
    </Suspense>
  );
}
