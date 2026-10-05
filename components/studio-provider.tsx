"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { studioApi } from "@/lib/studio-api";
import type { StudioPublicState } from "@/lib/studio-types";
import { DEFAULT_DISCORD_INVITE } from "@/lib/links";

const fallback: StudioPublicState = {
  site: {
    brandName: "Studio K",
    brandTagline: "SUA IDENTIDADE. SUA CIDADE.",
    logoUrl: "/studio-assets/studio-k-logo.webp",
    homeBackgroundUrl: "",
    controlBackgroundUrl: "",
    heroEyebrow: "DESIGN 3D · FIVEM · MODA DIGITAL",
    heroTitle: "DESIGN ALÉM",
    heroAccent: "DA TEXTURA.",
    heroSubtitle: "Roupas, texturas e experiências visuais criadas para transformar personagens e projetos no GTA V / FiveM.",
    primaryCtaLabel: "Explorar Portfólio",
    secondaryCtaLabel: "Entrar no Discord",
    discordInviteUrl: DEFAULT_DISCORD_INVITE,
    defaultAnnouncementChannelId: "",
    autoAnnounceProducts: false,
    adminRoleIds: [],
    memberDiscountPercent: 0,
    memberBenefitTitle: "Benefícios exclusivos para membros",
    memberBenefitDescription: "Conecte sua conta do Discord para acessar vantagens, novidades e condições especiais do Studio K.",
    assistant: {
      enabled: true,
      intervalSeconds: 5,
      imageUrl: "/studio-assets/studio-k-mascot.webp",
      campaigns: [
        {
          id: "welcome",
          type: "cute",
          title: "Oi, eu sou a Kiki 💜",
          text: "Vou ficar por aqui te mostrando coisinhas legais do Studio K.",
          ctaLabel: "",
          href: "",
          priceCents: 0,
          oldPriceCents: 0,
          active: true
        }
      ]
    }
  },
  status: {
    botOnline: false,
    storeOpen: true,
    ticketsOpen: true,
    openTickets: 0,
    pendingOrders: 0,
    updatedAt: ""
  },
  items: [],
  products: [],
  drops: [],
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
  const inFlight = useRef<Promise<void> | null>(null);
  const lastSuccessAt = useRef(0);

  const refresh = useCallback(() => {
    if (inFlight.current) return inFlight.current;

    const run = (async () => {
      try {
        setError("");
        const next = await studioApi.publicState();
        setState(next);
        lastSuccessAt.current = Date.now();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Não foi possível carregar os dados do Studio K.");
      } finally {
        setLoading(false);
      }
    })();

    inFlight.current = run;
    void run.finally(() => {
      if (inFlight.current === run) inFlight.current = null;
    });
    return run;
  }, []);

  useEffect(() => {
    void refresh();

    const refreshWhenUseful = (minimumAgeMs: number) => {
      if (document.visibilityState !== "visible") return;
      if (Date.now() - lastSuccessAt.current < minimumAgeMs) return;
      void refresh();
    };

    const timer = window.setInterval(() => refreshWhenUseful(55_000), 60_000);
    const syncWhenVisible = () => refreshWhenUseful(30_000);

    document.addEventListener("visibilitychange", syncWhenVisible);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", syncWhenVisible);
    };
  }, [refresh]);

  const value = useMemo(() => ({ state, loading, error, refresh }), [state, loading, error, refresh]);

  return <StudioContext.Provider value={value}>{children}</StudioContext.Provider>;
}

export function useStudio() {
  return useContext(StudioContext);
}
