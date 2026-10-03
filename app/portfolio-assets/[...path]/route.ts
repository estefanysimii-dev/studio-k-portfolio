import { NextRequest, NextResponse } from "next/server";

const BACKEND = process.env.STUDIO_BACKEND_URL || "https://studiokbot.up.railway.app";

export async function GET(_req: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params;
  const target = new URL(`/portfolio-assets/${path.map(encodeURIComponent).join("/")}`, BACKEND);
  const upstream = await fetch(target, { cache: "force-cache" });
  if (!upstream.ok) return new NextResponse(null, { status: upstream.status });

  const headers = new Headers();
  const type = upstream.headers.get("content-type");
  if (type) headers.set("content-type", type);
  headers.set("cache-control", "public, max-age=3600");
  return new NextResponse(upstream.body, { status: 200, headers });
}
