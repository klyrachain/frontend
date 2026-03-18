import { NextRequest, NextResponse } from "next/server";

function backendOrigin(): string {
  const u =
    process.env.BUSINESS_API_URL ??
    process.env.NEXT_PUBLIC_BUSINESS_API_URL ??
    "http://localhost:4000";
  return u.replace(/\/+$/, "");
}

type RouteCtx = { params: Promise<{ segments?: string[] }> };

async function forwardToCoreApi(
  req: NextRequest,
  segments: string[],
  method: string
): Promise<NextResponse> {
  const sub = segments.filter(Boolean).join("/");
  const targetPath = sub
    ? `${backendOrigin()}/api/business-auth/${sub}`
    : `${backendOrigin()}/api/business-auth`;
  const targetUrl = new URL(targetPath);
  req.nextUrl.searchParams.forEach((value, key) => {
    targetUrl.searchParams.set(key, value);
  });

  const headers = new Headers();
  headers.set("Accept", "application/json");
  const contentType = req.headers.get("content-type");
  if (contentType) headers.set("Content-Type", contentType);
  const authorization = req.headers.get("authorization");
  if (authorization) headers.set("Authorization", authorization);

  const init: RequestInit = {
    method,
    headers,
    cache: "no-store",
  };

  if (method !== "GET" && method !== "HEAD") {
    const body = await req.text();
    if (body.length > 0) init.body = body;
  }

  let res: Response;
  try {
    res = await fetch(targetUrl.toString(), init);
  } catch {
    return NextResponse.json(
      {
        message:
          "Could not reach the core API. Start it on port 4000 or set BUSINESS_API_URL.",
      },
      { status: 502 }
    );
  }

  const text = await res.text();
  const out = new NextResponse(text, { status: res.status });
  const resCt = res.headers.get("content-type");
  if (resCt) out.headers.set("Content-Type", resCt);
  return out;
}

export async function GET(req: NextRequest, ctx: RouteCtx) {
  const { segments = [] } = await ctx.params;
  return forwardToCoreApi(req, segments, "GET");
}

export async function POST(req: NextRequest, ctx: RouteCtx) {
  const { segments = [] } = await ctx.params;
  return forwardToCoreApi(req, segments, "POST");
}
