/**
 * Native token address sentinels (Squid / 0x / LiFi). Must not be used as ERC-20 contract addresses.
 * Mirrors Core `core/src/lib/native-token.ts`.
 */

const NATIVE_ZERO = "0x0000000000000000000000000000000000000000";
const NATIVE_EEEE = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";
const NATIVE_SQUID_LOWER = "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee";

export function isNativeTokenAddress(addr: string): boolean {
  const a = addr.trim().toLowerCase();
  return (
    a === NATIVE_ZERO.toLowerCase() ||
    a === NATIVE_EEEE.toLowerCase() ||
    a === NATIVE_SQUID_LOWER
  );
}

export const NATIVE_TOKEN_SEND_BLOCKED =
  "Native chain currency cannot be sent this way from Pay. Pick the wrapped token (e.g. WETH) or another ERC-20 from the list.";
