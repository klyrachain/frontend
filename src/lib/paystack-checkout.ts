/**
 * Shared Paystack initialize for checkout (callback verification uses /checkout/paystack/return).
 */

export type PaystackInitializeInput = {
  email: string;
  paymentLinkId: string;
  callbackPath?: string;
};

export async function initializePaystackCheckout(
  input: PaystackInitializeInput
): Promise<{ ok: true; authorizationUrl: string } | { ok: false; error: string }> {
  const trimmed = input.email.trim();
  if (!trimmed.includes("@")) {
    return { ok: false, error: "Enter a valid email." };
  }
  const origin =
    typeof window !== "undefined" ? window.location.origin : "";
  const path = input.callbackPath ?? "/checkout/paystack/return";
  const callback_url = `${origin}${path.startsWith("/") ? path : `/${path}`}`;

  const res = await fetch("/api/klyra/paystack/payments/initialize", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: trimmed,
      payment_link_id: input.paymentLinkId,
      callback_url,
    }),
  });
  const json = (await res.json()) as {
    success?: boolean;
    data?: { authorization_url?: string };
    error?: string;
  };
  if (!res.ok || json.success !== true || !json.data?.authorization_url) {
    return {
      ok: false,
      error: json.error ?? "Could not start payment.",
    };
  }
  return { ok: true, authorizationUrl: json.data.authorization_url };
}
