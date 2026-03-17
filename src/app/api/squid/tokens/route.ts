import { NextRequest, NextResponse } from "next/server";

const BACKEND_BASE =
  process.env.BACKEND_API_URL ??
  process.env.NEXT_PUBLIC_SQUID_API_BASE_URL ??
  "https://backend-m7eg-mevsyou.vercel.app";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const testnet = searchParams.get("testnet");
  const all = searchParams.get("all");
  const query = new URLSearchParams();
  if (testnet) query.set("testnet", testnet);
  if (all) query.set("all", all);
  const qs = query.toString();
  const url = `${BACKEND_BASE}/api/squid/tokens${qs ? `?${qs}` : ""}`;

  try {
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      next: { revalidate: 300 },
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return NextResponse.json(
        data?.error ? { success: false, error: data.error } : { error: "Tokens fetch failed" },
        { status: res.status >= 400 ? res.status : 502 }
      );
    }
    return NextResponse.json(data);
  } catch (err) {
    console.error("Squid tokens proxy error:", err);
    return NextResponse.json(
      { success: false, error: "Tokens fetch error" },
      { status: 502 }
    );
  }
}
