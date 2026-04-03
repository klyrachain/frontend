import { NextRequest, NextResponse } from "next/server";
import { getBackendBaseUrl } from "@/lib/server-backend-base";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const backendBase = getBackendBaseUrl();
  if (!backendBase) {
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
  const testnet = searchParams.get("testnet");
  if (chainId) query.set("chainId", chainId);
  if (tokenAddress) query.set("tokenAddress", tokenAddress);
  if (testnet) query.set("testnet", testnet);

  const url = `${backendBase}/api/balances/multicall?${query.toString()}`;
  try {
    const response = await fetch(url, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      return NextResponse.json(
        typeof data === "object" && data && "error" in data
          ? data
          : { success: false, error: "Multicall balances fetch failed" },
        { status: response.status >= 400 ? response.status : 502 }
      );
    }
    return NextResponse.json(data, { status: response.status });
  } catch {
    return NextResponse.json(
      { success: false, error: "Could not reach multicall balances service." },
      { status: 502 }
    );
  }
}
