import type { StudioPublicState } from "@/lib/studio-types";

export const STUDIO_BACKEND_URL = process.env.STUDIO_BACKEND_URL || "https://studiokbot.up.railway.app";
export const STUDIO_PUBLIC_URL = process.env.STUDIO_PUBLIC_URL || "https://studiokoficial.netlify.app";

export async function fetchStudioPublicState(): Promise<StudioPublicState> {
  const response = await fetch(`${STUDIO_BACKEND_URL}/api/portfolio/public-state`, { cache: "no-store" });
  if (!response.ok) throw new Error("Não foi possível carregar o Studio K.");
  return response.json() as Promise<StudioPublicState>;
}

export function absoluteStudioUrl(value?: string) {
  const raw = String(value || "").trim();
  if (!raw) return STUDIO_PUBLIC_URL;
  try {
    return new URL(raw, STUDIO_PUBLIC_URL).toString();
  } catch {
    return STUDIO_PUBLIC_URL;
  }
}
