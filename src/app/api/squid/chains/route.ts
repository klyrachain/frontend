import { NextResponse } from "next/server";

const SQUID_BASE_URL =
  process.env.NEXT_PUBLIC_SQUID_API_BASE_URL ??
  "https://backend-m7eg-mevsyou.vercel.app";

export async function GET() {
  try {
    const res = await fetch(`${SQUID_BASE_URL}/api/squid/chains`, {
      headers: { Accept: "application/json" },
      next: { revalidate: 300 },
    });
    if (!res.ok) {
      return NextResponse.json(
        { error: "Chains fetch failed", status: res.status },
        { status: res.status }
      );
    }
    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    console.error("Squid chains proxy error:", err);
    return NextResponse.json(
      { error: "Chains fetch error" },
      { status: 502 }
    );
  }
}
