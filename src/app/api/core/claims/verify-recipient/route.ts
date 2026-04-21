import { NextResponse } from "next/server";
import { BACKEND_API_CONFIGURE_HINT, getBackendBaseUrl } from "@/lib/server-backend-base";

export async function POST(request: Request) {
  const backend = getBackendBaseUrl();
  if (!backend) {
    return NextResponse.json(
      { success: false, error: BACKEND_API_CONFIGURE_HINT, code: "BACKEND_NOT_CONFIGURED" },
      { status: 503 }
    );
  }
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON." }, { status: 400 });
  }
  try {
    const res = await fetch(`${backend}/api/klyra/claims/verify-recipient`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
      signal: AbortSignal.timeout(20_000),
    });
    const payload: unknown = await res.json().catch(() => ({}));
    return NextResponse.json(payload, { status: res.status });
  } catch {
    return NextResponse.json({ success: false, error: "Could not reach the Morapay API." }, { status: 502 });
  }
}
