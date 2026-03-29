export type PublicCommercePaymentLink = {
  id: string;
  publicCode: string;
  title: string;
  amount: string | null;
  currency: string;
  businessName: string;
  slug: string;
  description: string | null;
  type: "open" | "fixed";
  linkKind: "commerce";
  chargeKind?: string;
};
