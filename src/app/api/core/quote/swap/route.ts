import { NextResponse } from "next/server";
import { getCoreBaseUrl } from "@/lib/server-core-base";
import { toPayerSwapQuoteData } from "@/lib/public-swap-quote-response";

export async function POST(request: Request) {
  const core = getCoreBaseUrl();
  if (!core) {
    return NextResponse.json(
      {
        success: false,
        error: "Set NEXT_PUBLIC_CORE_URL (or CORE_URL) for quote proxy.",
        code: "CORE_NOT_CONFIGURED",
      },
      { status: 503 }
    );
  }

  const apiKey = process.env.CORE_API_KEY?.trim();
  if (!apiKey) {
    return NextResponse.json(
      {
        success: false,
        error:
          "Set CORE_API_KEY on the server to proxy swap quotes (never expose in the browser).",
        code: "CORE_API_KEY_MISSING",
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
    const res = await fetch(`${core}/api/quote/swap`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
      },
      body: JSON.stringify(body),
      cache: "no-store",
      signal: AbortSignal.timeout(45_000),
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
        { success: true, data: toPayerSwapQuoteData(p.data) },
        { status: res.status }
      );
    }

    return NextResponse.json(payload, { status: res.status });
  } catch {
    return NextResponse.json(
      { success: false, error: "Could not reach Core for swap quote." },
      { status: 502 }
    );
  }
}
