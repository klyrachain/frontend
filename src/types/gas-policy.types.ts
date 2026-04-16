/** Mirrors Core `GasPolicyPublic` from GET /api/public/gas-policy and payment link payload. */
export type GasPolicyPublic = {
  businessId: string;
  platformSponsorshipEnabled: boolean;
  businessSponsorshipEnabled: boolean;
  sufficientBalance: boolean;
  prepaidBalanceUsd: string;
  reservedUsd: string;
  availableUsd: string;
  maxUsdPerTx: string | null;
  effectiveSponsorship: boolean;
};
