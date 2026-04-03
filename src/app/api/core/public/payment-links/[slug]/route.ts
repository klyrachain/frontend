import { NextResponse } from "next/server";
import { getCoreBaseUrl } from "@/lib/server-core-base";

type Ctx = { params: Promise<{ slug: string }> };

export async function GET(req: Request, ctx: Ctx) {
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
  const { slug } = await ctx.params;
  const enc = encodeURIComponent(slug);
  const url = new URL(req.url);
  const wallet = url.searchParams.get("wallet")?.trim() ?? "";
  const qs = wallet ? `?wallet=${encodeURIComponent(wallet)}` : "";
  try {
    const res = await fetch(`${core}/api/public/payment-links/${enc}${qs}`, {
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
    });
    const body: unknown = await res.json().catch(() => ({}));
    return NextResponse.json(body, { status: res.status });
  } catch {
    return NextResponse.json(
      { success: false, error: "Could not reach Core." },
      { status: 502 }
    );
  }
}
