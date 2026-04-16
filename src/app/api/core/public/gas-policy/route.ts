import { NextResponse } from "next/server";
import { BACKEND_API_CONFIGURE_HINT, getBackendBaseUrl } from "@/lib/server-backend-base";

export async function GET(req: Request) {
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
  const url = new URL(req.url);
  const paymentLinkId = url.searchParams.get("paymentLinkId")?.trim() ?? "";
  if (!paymentLinkId) {
    return NextResponse.json({ success: false, error: "paymentLinkId required." }, { status: 400 });
  }
  try {
    const res = await fetch(
      `${backend}/api/klyra/public/gas-policy?paymentLinkId=${encodeURIComponent(paymentLinkId)}`,
      { cache: "no-store", headers: { Accept: "application/json" }, signal: AbortSignal.timeout(15_000) }
    );
    const body: unknown = await res.json().catch(() => ({}));
    return NextResponse.json(body, { status: res.status });
  } catch {
    return NextResponse.json({ success: false, error: "Could not reach the Morapay API." }, { status: 502 });
  }
}
