import { NextResponse } from "next/server";
import { BACKEND_API_CONFIGURE_HINT, getBackendBaseUrl } from "@/lib/server-backend-base";

export async function POST(req: Request) {
  const backend = getBackendBaseUrl();
  if (!backend) {
    return NextResponse.json(
      {
        success: false,
        error: BACKEND_API_CONFIGURE_HINT,
        code: "BACKEND_NOT_CONFIGURED",
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
    const res = await fetch(`${backend}/api/klyra/public/gas-usage`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "X-Gas-Report-Token": token,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(20_000),
    });
    const out: unknown = await res.json().catch(() => ({}));
    return NextResponse.json(out, { status: res.status });
  } catch {
    return NextResponse.json({ success: false, error: "Could not reach the Morapay API." }, { status: 502 });
  }
}
