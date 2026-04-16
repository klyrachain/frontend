import { NextRequest, NextResponse } from "next/server";
import { getBackendBaseUrl } from "@/lib/server-backend-base";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const BACKEND_BASE = getBackendBaseUrl();
  if (!BACKEND_BASE) {
    return NextResponse.json(
      {
        success: false,
        error:
          "Set BACKEND_API_URL or NEXT_PUBLIC_SQUID_API_BASE_URL (e.g. http://localhost:4001).",
        code: "BACKEND_NOT_CONFIGURED",
      },
      { status: 503 }
    );
  }

  const { searchParams } = new URL(request.url);
  const address = searchParams.get("address");
  if (!address?.trim()) {
    return NextResponse.json(
      { success: false, error: "address query parameter is required." },
      { status: 400 }
    );
  }

  const query = new URLSearchParams();
  query.set("address", address.trim());
  const chainId = searchParams.get("chainId");
  const tokenAddress = searchParams.get("tokenAddress");
  const networkIds = searchParams.get("networkIds");
  const tokenAddresses = searchParams.get("tokenAddresses");
  const testnet = searchParams.get("testnet");
  if (chainId) query.set("chainId", chainId);
  if (tokenAddress) query.set("tokenAddress", tokenAddress);
  if (networkIds) query.set("networkIds", networkIds);
  if (tokenAddresses) query.set("tokenAddresses", tokenAddresses);
  if (testnet) query.set("testnet", testnet);

  const url = `${BACKEND_BASE}/api/squid/balances?${query.toString()}`;
  try {
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return NextResponse.json(
        typeof data === "object" && data && "error" in data
          ? data
          : { success: false, error: "Balances fetch failed" },
        { status: res.status >= 400 ? res.status : 502 }
      );
    }
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json(
      { success: false, error: "Could not reach balances service." },
      { status: 502 }
    );
  }
}
