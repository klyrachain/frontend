import { NextResponse } from "next/server";
import { BACKEND_API_CONFIGURE_HINT, getBackendBaseUrl } from "@/lib/server-backend-base";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: Request, ctx: Ctx) {
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
  const { id } = await ctx.params;
  const enc = encodeURIComponent(id.trim());
  const url = new URL(req.url);
  const wallet = url.searchParams.get("wallet")?.trim() ?? "";
  const qs = wallet ? `?wallet=${encodeURIComponent(wallet)}` : "";
  try {
    const res = await fetch(`${backend}/api/klyra/public/payment-links/by-id/${enc}${qs}`, {
      cache: "no-store",
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(15_000),
    });
    const body: unknown = await res.json().catch(() => ({}));
    return NextResponse.json(body, { status: res.status });
  } catch {
    return NextResponse.json(
      { success: false, error: "Could not reach the Morapay API." },
      { status: 502 }
    );
  }
}
