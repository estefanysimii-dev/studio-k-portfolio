"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { studioApi } from "@/lib/studio-api";
import type { StudioPublicState } from "@/lib/studio-types";
import { DEFAULT_DISCORD_INVITE } from "@/lib/links";

// Normalize display labels only. URLs, identifiers and stored backend data stay intact.
const cryptoLabelFields = new Set([
  "brandName", "brandTagline", "heroEyebrow", "heroTitle", "heroAccent", "heroDescription",
  "memberBenefitTitle", "memberBenefitDescription", "name", "title", "description",
  "text", "alt", "label", "category", "categories", "ctaLabel", "defaultTitle"
]);
function cryptoDisplayLabels<T>(value: T, field = ""): T {
  if (typeof value === "string") {
    if (field === "logoUrl" && value === "/studio-assets/studio-k-logo.webp") {
      return "/studio-assets/crypto-logo.png" as T;
    }
    if (field === "imageUrl") {
      const artwork: Record<string, string> = {
        "/portfolio-assets/adafc2fc-bae9-4637-b5c5-6070dee17479.png": "/studio-assets/crypto-banner.svg?v=20261011-2",
        "/portfolio-assets/99c32eeb-f2c3-47c7-b076-c3b57ea7b001.png": "/studio-assets/crypto-banner-secondary.svg?v=20261011-2"
      };
      if (artwork[value]) return artwork[value] as T;
    }
    return (cryptoLabelFields.has(field) ? value.replace(/studio\s*k/gi, "Crypto") : value) as T;
  }
  if (Array.isArray(value)) return value.map((entry) => cryptoDisplayLabels(entry, field)) as T;
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, entry]) =>
      [key, cryptoDisplayLabels(entry, key)]
    )) as T;
  }
  return value;
}

const fallback: StudioPublicState = {
  site: {
    brandName: "Crypto",
    brandTagline: "SUA IDENTIDADE. SUA CIDADE.",
    logoUrl: "/studio-assets/crypto-logo.png",
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
    memberBenefitDescription: "Conecte sua conta do Discord para acessar vantagens, novidades e condições especiais do Crypto.",
    assistant: {
      enabled: true,
      intervalSeconds: 5,
      imageUrl: "/studio-assets/studio-k-mascot.webp",
      campaigns: [
        {
          id: "welcome",
          type: "cute",
          title: "Oi, eu sou a Kiki 🤍",
          text: "Vou ficar por aqui te mostrando coisinhas legais do Crypto.",
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
        setState(cryptoDisplayLabels(next));
        lastSuccessAt.current = Date.now();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Não foi possível carregar os dados do Crypto.");
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
