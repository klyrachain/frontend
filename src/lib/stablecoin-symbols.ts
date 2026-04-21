/** Symbols commonly treated as ≈1 USD for rough Pay-flow hints (not legal pricing). */
const USD_STABLES = new Set([
  "USDC",
  "USDT",
  "USDBC",
  "DAI",
  "BUSD",
  "FDUSD",
  "TUSD",
  "USDP",
  "GUSD",
  "USDE",
  "PYUSD",
]);

export function isUsdStablecoinSymbol(symbol: string | undefined | null): boolean {
  if (!symbol?.trim()) return false;
  return USD_STABLES.has(symbol.trim().toUpperCase());
}
