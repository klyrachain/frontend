import { NextRequest, NextResponse } from "next/server";
import { getBackendBaseUrl } from "@/lib/server-backend-base";
import { toPayerQuoteData } from "@/lib/public-quote-response";

export async function POST(request: NextRequest) {
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

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const url = `${BACKEND_BASE}/api/klyra/quotes`;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(body),
    });
    const data: unknown = await res.json().catch(() => ({}));
    if (!res.ok) {
      return NextResponse.json(
        data &&
          typeof data === "object" &&
          "error" in data &&
          typeof (data as { error: string }).error === "string"
          ? { success: false, error: (data as { error: string }).error }
          : { error: "Quote request failed" },
        { status: res.status >= 400 ? res.status : 502 }
      );
    }
    if (
      data &&
      typeof data === "object" &&
      (data as { success?: boolean }).success === true &&
      "data" in data
    ) {
      const d = data as { success: true; data: unknown };
      return NextResponse.json(
        { success: true, data: toPayerQuoteData(d.data) },
        { status: res.status }
      );
    }
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    console.error("Morapay quotes proxy error:", err);
    return NextResponse.json(
      { success: false, error: "Quote request failed" },
      { status: 502 }
    );
  }
}
