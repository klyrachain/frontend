export type BlogPost = {
  slug: string;
  title: string;
  date: string;
  excerpt: string;
  sections: { heading?: string; paragraphs: string[] }[];
};

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: "stablecoins-and-settlement",
    title: "Why stablecoins matter for cross-border settlement",
    date: "2026-03-12",
    excerpt:
      "How dollar-backed assets reduce friction for merchants and payers when traditional rails are slow or costly.",
    sections: [
      {
        paragraphs: [
          "Cross-border commerce often stalls on correspondent banking delays, opaque FX spreads, and limited traceability. Stablecoins on public networks give businesses a way to settle in familiar dollar units while retaining on-chain auditability.",
          "Morapay focuses on compliant flows: verified counterparties, clear fee disclosure, and integration with fiat off-ramps where you operate.",
        ],
      },
      {
        heading: "Operational checklist",
        paragraphs: [
          "Define who holds compliance responsibility (you vs. platform vs. partner bank).",
          "Map treasury: where funds sit pre- and post-settlement.",
          "Test failure paths: network congestion, provider downtime, and manual review.",
        ],
      },
      {
        paragraphs: ["We will expand this series with implementation notes from live corridors as they roll out."],
      },
    ],
  },
  {
    slug: "merchant-webhooks-you-actually-need",
    title: "Merchant webhooks you should wire first",
    date: "2026-02-28",
    excerpt:
      "Payment confirmed, payout sent, refund created — the three events most teams need before building custom analytics.",
    sections: [
      {
        paragraphs: [
          "Most integration issues come from missing idempotency or from treating webhooks as the only source of truth.",
        ],
      },
      {
        heading: "Start with these three",
        paragraphs: [
          "Payment confirmed — drive order fulfilment; store provider references.",
          "Payout or settlement — reconcile treasury and customer balances.",
          "Refund — adjust accounting and notify the payer.",
        ],
      },
      {
        paragraphs: [
          "Morapay exposes signed webhook deliveries with replay protection. Add inventory or risk events once your core reconciliation is solid.",
        ],
      },
    ],
  },
  {
    slug: "kyc-kyb-without-blocking-checkout",
    title: "KYC and KYB without blocking checkout",
    date: "2026-01-20",
    excerpt:
      "Separate person verification from business verification so legitimate buyers are not turned away at the cart.",
    sections: [
      {
        paragraphs: [
          "High-friction verification at checkout increases abandonment. A practical split is: person (KYC) for regulated actions and higher limits, and business (KYB) for merchant of record, settlement accounts, and treasury limits — often completed after first value.",
        ],
      },
      {
        paragraphs: [
          "Morapay lets you stage verification: connect a wallet or pay first, then complete KYB from the business dashboard when you need higher limits or additional rails.",
        ],
      },
    ],
  },
];

export function getPostBySlug(slug: string): BlogPost | undefined {
  return BLOG_POSTS.find((p) => p.slug === slug);
}
