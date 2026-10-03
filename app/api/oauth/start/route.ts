import { NextRequest, NextResponse } from "next/server";

const BACKEND = process.env.STUDIO_BACKEND_URL || "https://studiokbot.up.railway.app";

export function GET(req: NextRequest) {
  const next = req.nextUrl.searchParams.get("next") || "/account";
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/account";
  const url = new URL("/api/portfolio/oauth/start", BACKEND);
  url.searchParams.set("next", safeNext);
  return NextResponse.redirect(url);
}
