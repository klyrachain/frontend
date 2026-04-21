import { NextResponse } from "next/server";
import { BACKEND_API_CONFIGURE_HINT, getBackendBaseUrl } from "@/lib/server-backend-base";

type Ctx = { params: Promise<{ token: string }> };

export async function GET(_req: Request, ctx: Ctx) {
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
  const { token } = await ctx.params;
  const enc = encodeURIComponent(token.trim());
  try {
    const res = await fetch(`${backend}/api/klyra/claims/unlocked/${enc}`, {
      cache: "no-store",
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(15_000),
    });
    const body: unknown = await res.json().catch(() => ({}));
    return NextResponse.json(body, { status: res.status });
  } catch {
    return NextResponse.json({ success: false, error: "Could not reach the Morapay API." }, { status: 502 });
  }
}
