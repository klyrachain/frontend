import type { GasPolicyPublic } from "@/types/gas-policy.types";

export type PublicCommercePaymentLink = {
  id: string;
  businessId?: string;
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
  gasPolicy?: GasPolicyPublic;
  gasReportToken?: string;
  isOneTime?: boolean;
  isPaid?: boolean;
  paidAt?: string | null;
  alreadyPaidVerifiedByConnectedWallet?: boolean;
};
