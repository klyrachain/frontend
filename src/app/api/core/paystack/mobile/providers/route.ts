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
  if (!qs) {
    return NextResponse.json({ success: false, error: "Query string required." }, { status: 400 });
  }
  try {
    const res = await fetch(`${backend}/api/klyra/relay/paystack/mobile/providers?${qs}`, {
      method: "GET",
      headers: { Accept: "application/json" },
      cache: "no-store",
      signal: AbortSignal.timeout(30_000),
    });
    const payload: unknown = await res.json().catch(() => ({}));
    return NextResponse.json(payload, { status: res.status });
  } catch {
    return NextResponse.json(
      { success: false, error: "Could not load mobile money providers." },
      { status: 502 }
    );
  }
}
