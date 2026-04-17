import { NextResponse } from "next/server";
import { getCoreBaseUrl } from "@/lib/server-core-base";

const MISSING =
  "Set NEXT_PUBLIC_CORE_URL or CORE_URL to your Morapay Core API (contact form posts to Core).";

export async function POST(request: Request) {
  const core = getCoreBaseUrl();
  if (!core) {
    return NextResponse.json({ success: false, error: MISSING, code: "CORE_NOT_CONFIGURED" }, { status: 503 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON.", code: "BAD_REQUEST" }, { status: 400 });
  }

  const xf = request.headers.get("x-forwarded-for");
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };
  if (xf) headers["X-Forwarded-For"] = xf;

  try {
    const res = await fetch(`${core}/api/public/contact`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      cache: "no-store",
      signal: AbortSignal.timeout(30_000),
    });
    const payload: unknown = await res.json().catch(() => ({}));
    return NextResponse.json(payload, { status: res.status });
  } catch {
    return NextResponse.json(
      { success: false, error: "Could not reach the server. Try again later.", code: "UPSTREAM" },
      { status: 502 }
    );
  }
}
