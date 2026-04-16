/**
 * Shared Paystack initialize for checkout (callback uses /checkout/payment/return).
 * Maps API `code` to payer-safe copy; never trust raw `error` for display when `code` is known.
 */

export type PaystackInitializeInput = {
  email?: string;
  /** Connected EVM address (e.g. checkout ?wallet=); stored with payer email on the transaction. */
  payer_wallet?: string;
  paymentLinkId: string;
  amount?: number;
  currency?: string;
  /** Open-amount CRYPTO charge links: quoted crypto amount to settle (server validates). */
  settlement_crypto_amount?: number;
  channels?: string[];
  callbackPath?: string;
};

const GENERIC_CHECKOUT_ERROR =
  "Could not start card payment. Please try again or pay with crypto.";

function friendlyMessageForCode(code: string | undefined): string | null {
  switch (code) {
    case "PAYSTACK_PLATFORM_EMAIL_REQUIRED":
      return "Card payment isn’t available right now. Please pay with crypto or try again later.";
    case "SETTLEMENT_CRYPTO_AMOUNT_REQUIRED":
      return "This checkout couldn’t load the payment amount. Refresh the page or pay with crypto.";
    case "PAYSTACK_FIAT_QUOTE_REQUIRED":
      return "Choose a currency and amount, or pay with crypto instead.";
    case "MERCHANT_CRYPTO_PAYOUT_REQUIRED":
      return "Card payment isn’t available for this checkout. Please pay with crypto or contact the merchant.";
    case "PAYSTACK_NO_ACTIVE_CHANNEL":
      return "Card and mobile money are temporarily unavailable for this merchant. Please contact the merchant or pay with crypto.";
    case "PAYMENT_LINK_ALREADY_PAID":
      return "This payment link has already been used.";
    default:
      return null;
  }
}

export async function initializePaystackCheckout(
  input: PaystackInitializeInput
): Promise<
  | { ok: true; authorizationUrl: string }
  | { ok: false; error: string; detail?: string; code?: string }
> {
  const trimmed = input.email?.trim() ?? "";
  const origin =
    typeof window !== "undefined" ? window.location.origin : "";
  const path = input.callbackPath ?? "/checkout/payment/return";
  const callback_url = `${origin}${path.startsWith("/") ? path : `/${path}`}`;

  const res = await fetch("/api/klyra/paystack/payments/initialize", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...(trimmed ? { customer_email: trimmed } : {}),
      ...(input.payer_wallet?.trim()
        ? { payer_wallet: input.payer_wallet.trim() }
        : {}),
      payment_link_id: input.paymentLinkId,
      amount: input.amount,
      currency: input.currency,
      ...(input.settlement_crypto_amount != null &&
      Number.isFinite(input.settlement_crypto_amount) &&
      input.settlement_crypto_amount > 0
        ? { settlement_crypto_amount: input.settlement_crypto_amount }
        : {}),
      channels: input.channels,
      callback_url,
    }),
  });
  const json = (await res.json()) as {
    success?: boolean;
    data?: { authorization_url?: string };
    error?: string;
    code?: string;
    detail?: string;
  };
  if (!res.ok || json.success !== true || !json.data?.authorization_url) {
    const code =
      json.code ??
      (() => {
        const d = (json.detail ?? json.error ?? "").toLowerCase();
        return d.includes("no active channel") ? "PAYSTACK_NO_ACTIVE_CHANNEL" : undefined;
      })();

    const fromCode = friendlyMessageForCode(code);
    return {
      ok: false,
      code,
      error: fromCode ?? GENERIC_CHECKOUT_ERROR,
      detail: json.detail,
    };
  }
  return { ok: true, authorizationUrl: json.data.authorization_url };
}
