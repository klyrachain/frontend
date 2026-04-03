import { NextResponse } from "next/server";
import { getCoreBaseUrl } from "@/lib/server-core-base";

export async function GET(req: Request) {
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
  const url = new URL(req.url);
  const paymentLinkId = url.searchParams.get("paymentLinkId")?.trim() ?? "";
  if (!paymentLinkId) {
    return NextResponse.json({ success: false, error: "paymentLinkId required." }, { status: 400 });
  }
  try {
    const res = await fetch(
      `${core}/api/public/gas-policy?paymentLinkId=${encodeURIComponent(paymentLinkId)}`,
      { cache: "no-store", signal: AbortSignal.timeout(15_000) }
    );
    const body: unknown = await res.json().catch(() => ({}));
    return NextResponse.json(body, { status: res.status });
  } catch {
    return NextResponse.json({ success: false, error: "Could not reach Core." }, { status: 502 });
  }
}
