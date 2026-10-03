import { NextRequest, NextResponse } from "next/server";

const BACKEND = process.env.STUDIO_BACKEND_URL || "https://studiokbot.up.railway.app";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("t") || "";
  if (!token) return NextResponse.redirect(new URL("/account?oauth=missing", req.url));

  const exchange = new URL("/api/portfolio/oauth/exchange", BACKEND);
  exchange.searchParams.set("t", token);

  const upstream = await fetch(exchange, { cache: "no-store" });
  const data = await upstream.json().catch(() => ({}));

  if (!upstream.ok || !data.sessionToken) {
    return NextResponse.redirect(new URL("/account?oauth=failed", req.url));
  }

  const next = typeof data.next === "string" && data.next.startsWith("/") && !data.next.startsWith("//")
    ? data.next
    : "/account";

  const response = NextResponse.redirect(new URL(next, req.url));
  response.cookies.set("studio_web_token", data.sessionToken, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30
  });
  return response;
}
