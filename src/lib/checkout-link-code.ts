/** True if `code` looks like a payment-request linkId (hex), not a commerce slug. */
export function isRequestLinkIdHex(code: string): boolean {
  return /^[0-9a-f]{16,64}$/i.test(code.trim());
}
