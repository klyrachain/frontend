import { NextResponse } from "next/server";
import { BACKEND_API_CONFIGURE_HINT, getBackendBaseUrl } from "@/lib/server-backend-base";
import { toPayerQuoteData } from "@/lib/public-quote-response";

export async function POST(request: Request) {
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

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid JSON body." },
      { status: 400 }
    );
  }

  try {
    const res = await fetch(`${backend}/api/klyra/quotes`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
      signal: AbortSignal.timeout(25_000),
    });
    const payload: unknown = await res.json().catch(() => ({}));

    if (
      res.ok &&
      payload &&
      typeof payload === "object" &&
      (payload as { success?: boolean }).success === true &&
      "data" in (payload as object)
    ) {
      const p = payload as { success: true; data: unknown };
      return NextResponse.json(
        { success: true, data: toPayerQuoteData(p.data) },
        { status: res.status }
      );
    }

    return NextResponse.json(payload, { status: res.status });
  } catch {
    return NextResponse.json(
      { success: false, error: "Could not reach the Morapay API for quote." },
      { status: 502 }
    );
  }
}
