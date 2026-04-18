"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { initializePaystackCheckout } from "@/lib/paystack-checkout";

type CheckoutFiatPaystackSectionProps = {
  payPageId: string;
  disabled?: boolean;
};

export function CheckoutFiatPaystackSection({
  payPageId,
  disabled = false,
}: CheckoutFiatPaystackSectionProps) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startPaystack = async () => {
    const trimmed = email.trim();
    setLoading(true);
    setError(null);
    try {
      const result = await initializePaystackCheckout({
        ...(trimmed ? { email: trimmed } : {}),
        paymentLinkId: payPageId,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      window.location.href = result.authorizationUrl;
    } catch {
      setError("Could not start card payment.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section
      className="mt-4 space-y-2 rounded-lg border border-white/10 bg-white/5 p-3 text-left"
      aria-label="Pay with card or mobile money"
    >
      <p className="text-center text-xs font-medium text-muted-foreground">
        Pay with fiat
      </p>
      <Input
        type="email"
        name="payer-email"
        autoComplete="email"
        placeholder="user@email.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        disabled={disabled || loading}
        className="border-white/15 bg-background/40"
      />
      {error ? (
        <p className="text-xs text-destructive" role="alert">
          {error}
        </p>
      ) : null}
      <Button
        type="button"
        size="lg"
        className="w-full rounded-xl py-5"
        disabled={disabled || loading}
        onClick={() => void startPaystack()}
      >
        {loading ? "Redirecting…" : "Pay with card / mobile money"}
      </Button>
    </section>
  );
}
