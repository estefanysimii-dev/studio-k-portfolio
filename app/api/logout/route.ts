import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const origin = new URL(process.env.STUDIO_PUBLIC_URL || 'https://studiokatelier.infinityfreeapp.com').origin;
  if (request.headers.get('origin') !== origin) return NextResponse.json({ error: 'Origem não autorizada.' }, { status: 403 });
  const token = request.cookies.get('studio_web_token')?.value;
  if (token) {
    try {
      const upstream = await fetch(new URL('/api/portfolio/logout', process.env.STUDIO_BACKEND_URL || 'https://studiokbot.up.railway.app'), {
        method: 'POST', headers: { Authorization: `Bearer ${token}`, Origin: origin }, cache: 'no-store', signal: AbortSignal.timeout(12000)
      });
      if (!upstream.ok) throw new Error('logout failed');
    } catch { return NextResponse.json({ error: 'Não foi possível encerrar a sessão no servidor. Tente novamente.' }, { status: 502 }); }
  }
  const response = NextResponse.json({ ok: true });
  response.cookies.set("studio_web_token", "", {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0
  });
  return response;
}
