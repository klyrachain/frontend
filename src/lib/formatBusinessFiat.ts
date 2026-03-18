/** Display amount in the business’s charged currency (fiat-style title). */
export function formatBusinessFiatTitle(
  amount: string,
  currency: string
): string {
  const c = currency.toUpperCase();
  if (c === "USD") return `$${amount}`;
  if (c === "GHS") return `₵${amount}`;
  if (c === "EUR") return `€${amount}`;
  if (c === "GBP") return `£${amount}`;
  return `${amount} ${c}`;
}
