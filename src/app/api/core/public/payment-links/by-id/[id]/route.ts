import { NextResponse } from "next/server";
import { getCoreBaseUrl } from "@/lib/server-core-base";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
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
  const { id } = await ctx.params;
  const enc = encodeURIComponent(id.trim());
  try {
    const res = await fetch(`${core}/api/public/payment-links/by-id/${enc}`, {
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
