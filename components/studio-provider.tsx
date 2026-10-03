"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { studioApi } from "@/lib/studio-api";
import type { StudioPublicState } from "@/lib/studio-types";

const fallback: StudioPublicState = {
  site: {
    brandName: "Studio K",
    brandTagline: "KINETIC LOOM",
    logoUrl: "",
    homeBackgroundUrl: "",
    controlBackgroundUrl: "",
    heroEyebrow: "DESIGN 3D · FIVEM · MODA DIGITAL",
    heroTitle: "DESIGN ALÉM",
    heroAccent: "DA TEXTURA.",
    heroSubtitle: "Roupas, texturas e experiências visuais criadas para transformar personagens e projetos no GTA V / FiveM.",
    primaryCtaLabel: "Explorar Portfólio",
    secondaryCtaLabel: "Entrar no Discord",
    discordInviteUrl: "",
    adminRoleIds: []
  },
  items: [],
  products: [],
  feedbacks: [],
  me: { authenticated: false, canControl: false }
};

type StudioContextValue = {
  state: StudioPublicState;
  loading: boolean;
  error: string;
  refresh: () => Promise<void>;
};

const StudioContext = createContext<StudioContextValue>({
  state: fallback,
  loading: true,
  error: "",
  refresh: async () => {}
});

export function StudioProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<StudioPublicState>(fallback);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    try {
      setError("");
      const next = await studioApi.publicState();
      setState(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível carregar os dados do Studio K.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  const value = useMemo(() => ({ state, loading, error, refresh }), [state, loading, error, refresh]);

  return <StudioContext.Provider value={value}>{children}</StudioContext.Provider>;
}

export function useStudio() {
  return useContext(StudioContext);
}
