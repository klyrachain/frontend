import { NextResponse } from "next/server";
import { BACKEND_API_CONFIGURE_HINT, getBackendBaseUrl } from "@/lib/server-backend-base";

export async function GET(request: Request) {
  const backend = getBackendBaseUrl();
  if (!backend) {
    return NextResponse.json(
      { success: false, error: BACKEND_API_CONFIGURE_HINT, code: "BACKEND_NOT_CONFIGURED" },
      { status: 503 }
    );
  }
  const url = new URL(request.url);
  const qs = url.searchParams.toString();
  const path = qs ? `paystack/banks?${qs}` : "paystack/banks";
  try {
    const res = await fetch(`${backend}/api/klyra/relay/${path}`, {
      method: "GET",
      headers: { Accept: "application/json" },
      cache: "no-store",
      signal: AbortSignal.timeout(30_000),
    });
    const payload: unknown = await res.json().catch(() => ({}));
    return NextResponse.json(payload, { status: res.status });
  } catch {
    return NextResponse.json(
      { success: false, error: "Could not reach the Morapay API for Paystack banks." },
      { status: 502 }
    );
  }
}
