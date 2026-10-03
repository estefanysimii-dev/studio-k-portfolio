import { NextRequest, NextResponse } from "next/server";

const BACKEND = process.env.STUDIO_BACKEND_URL || "https://studiokbot.up.railway.app";

async function proxy(req: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params;
  const target = new URL(`/api/portfolio/${path.join("/")}`, BACKEND);
  req.nextUrl.searchParams.forEach((value, key) => target.searchParams.set(key, value));

  const token = req.cookies.get("studio_web_token")?.value;
  const headers = new Headers();
  const contentType = req.headers.get("content-type");
  if (contentType) headers.set("content-type", contentType);
  if (token) headers.set("authorization", `Bearer ${token}`);
  if (!["GET", "HEAD"].includes(req.method)) headers.set("origin", new URL(BACKEND).origin);

  const body = ["GET", "HEAD"].includes(req.method) ? undefined : await req.arrayBuffer();
  const upstream = await fetch(target, {
    method: req.method,
    headers,
    body,
    cache: "no-store",
    redirect: "manual"
  });

  const responseHeaders = new Headers();
  const upstreamType = upstream.headers.get("content-type");
  if (upstreamType) responseHeaders.set("content-type", upstreamType);
  responseHeaders.set("cache-control", "no-store");

  return new NextResponse(upstream.body, {
    status: upstream.status,
    headers: responseHeaders
  });
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const DELETE = proxy;
