export const PAYMENT_LINK_SHARE_INFO = [
  {
    title: "What happens next?",
    subtitle:
      "Your payer opens the link, chooses how to pay, and funds route to the wallet you specified. You’ll get notified when payment completes.",
  },
  {
    title: "Is the link single-use?",
    subtitle:
      "You can share the same link until the requested amount is paid, depending on your Morapay settings. Check your dashboard for status.",
  },
  {
    title: "Need help?",
    subtitle:
      "Visit the Help Center or contact support from your Morapay account if something doesn’t look right.",
  },
] as const;

export const PAYMENT_LINK_NEXT_STEPS = [
  {
    title: "Share the link",
    subtitle: "Send it by WhatsApp, email, or any channel your payer prefers.",
  },
  {
    title: "Wait for payment",
    subtitle: "They complete checkout; you keep the receive address you entered.",
  },
  {
    title: "Track in Morapay",
    subtitle: "Open your activity feed to see confirmations and history.",
  },
] as const;

export function buildReceiveShareMessage(link: string, amount: string, symbol: string): string {
  return `Please pay ${amount} ${symbol} using this Morapay link:\n\n${link}`;
}
