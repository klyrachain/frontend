import { NextResponse } from "next/server";
import { getBackendBaseUrl } from "@/lib/server-backend-base";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
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
  const { id } = await ctx.params;
  const enc = encodeURIComponent(id.trim());
  try {
    const res = await fetch(`${BACKEND_BASE}/api/klyra/transactions/${enc}`, {
      cache: "no-store",
      headers: { Accept: "application/json" },
    });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json(
      { success: false, error: "Transaction fetch request failed" },
      { status: 502 }
    );
  }
}
