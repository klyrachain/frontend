import { NextResponse } from "next/server";
import { getCoreBaseUrl } from "@/lib/server-core-base";

export async function GET(request: Request) {
  const core = getCoreBaseUrl();
  if (!core) {
    return NextResponse.json(
      {
        success: false,
        error: "Set NEXT_PUBLIC_CORE_URL (or CORE_URL) for countries proxy.",
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
          "Set CORE_API_KEY on the server to proxy countries (never expose in the browser).",
        code: "CORE_API_KEY_MISSING",
      },
      { status: 503 }
    );
  }

  const url = new URL(request.url);
  const supported = url.searchParams.get("supported")?.trim();
  const supportedQuery =
    supported === "fonbnk" || supported === "paystack" || supported === "any"
      ? `supported=${supported}`
      : "supported=paystack";

  try {
    const res = await fetch(`${core}/api/countries?${supportedQuery}`, {
      method: "GET",
      headers: {
        "x-api-key": apiKey,
      },
      cache: "no-store",
      signal: AbortSignal.timeout(20_000),
    });
    const payload: unknown = await res.json().catch(() => ({}));
    return NextResponse.json(payload, { status: res.status });
  } catch {
    return NextResponse.json(
      { success: false, error: "Could not reach Core countries endpoint." },
      { status: 502 }
    );
  }
}
