import { NextRequest, NextResponse } from "next/server";
import { getBackendBaseUrl } from "@/lib/server-backend-base";

/** Payload often exceeds Next.js Data Cache limit (~2MB); RTK caches on the client. */
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
  const qs = new URL(request.url).searchParams.toString();
  const url = `${BACKEND_BASE}/api/squid/tokens${qs ? `?${qs}` : ""}`;

  try {
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return NextResponse.json(
        data?.error ? { success: false, error: data.error } : { error: "Tokens fetch failed" },
        { status: res.status >= 400 ? res.status : 502 }
      );
    }
    return NextResponse.json(data);
  } catch (err) {
    console.error("Squid tokens proxy error:", err);
    return NextResponse.json(
      { success: false, error: "Tokens fetch error" },
      { status: 502 }
    );
  }
}
