import { NextResponse } from "next/server";
import { getCoreBaseUrl } from "@/lib/server-core-base";

export async function POST(req: Request) {
  const core = getCoreBaseUrl();
  if (!core) {
    return NextResponse.json(
      {
        success: false,
        error: "Set NEXT_PUBLIC_CORE_URL (or CORE_URL) for checkout proxies.",
        code: "CORE_NOT_CONFIGURED",
      },
      { status: 503 }
    );
  }
  const token = req.headers.get("x-gas-report-token")?.trim();
  if (!token) {
    return NextResponse.json({ success: false, error: "Missing X-Gas-Report-Token." }, { status: 401 });
  }
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON." }, { status: 400 });
  }
  try {
    const res = await fetch(`${core}/api/public/gas-usage`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Gas-Report-Token": token,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(20_000),
    });
    const out: unknown = await res.json().catch(() => ({}));
    return NextResponse.json(out, { status: res.status });
  } catch {
    return NextResponse.json({ success: false, error: "Could not reach Core." }, { status: 502 });
  }
}
