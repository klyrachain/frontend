import { NextResponse } from "next/server";
import { getCoreBaseUrl } from "@/lib/server-core-base";

export async function POST(request: Request) {
  const core = getCoreBaseUrl();
  if (!core) {
    return NextResponse.json(
      { success: false, error: "Core URL not configured." },
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
    const res = await fetch(`${core}/api/claims/verify-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
      signal: AbortSignal.timeout(20_000),
    });
    const payload: unknown = await res.json().catch(() => ({}));
    return NextResponse.json(payload, { status: res.status });
  } catch {
    return NextResponse.json({ success: false, error: "Could not reach Core." }, { status: 502 });
  }
}
