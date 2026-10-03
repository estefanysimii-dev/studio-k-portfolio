"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { useStudio } from "./studio-provider";
import { buildAssistantMessage, normalizeAssistantConfig } from "@/lib/studio-assistant";

const BUILT_IN_TIPS = [
  {
    id: "built-in-cute-1",
    type: "cute" as const,
    title: "Kiki passando rapidinho 💜",
    text: "Já deu uma olhadinha nas novidades? Sempre tem algum detalhe novo aparecendo por aqui.",
    ctaLabel: "Ver novidades",
    href: "/portfolio",
    priceCents: 0,
    oldPriceCents: 0,
    active: true
  },
  {
    id: "built-in-motivation-1",
    type: "motivation" as const,
    title: "Um recadinho ✨",
    text: "Não precisa criar tudo de uma vez. Um detalhe bem feito por vez já transforma o projeto inteiro.",
    ctaLabel: "",
    href: "",
    priceCents: 0,
    oldPriceCents: 0,
    active: true
  },
  {
    id: "built-in-cute-2",
    type: "cute" as const,
    title: "Ei, você! 👀",
    text: "Se alguma peça chamou sua atenção, abre o projeto e olha os detalhes de pertinho. Eu deixo.",
    ctaLabel: "Explorar",
    href: "/portfolio",
    priceCents: 0,
    oldPriceCents: 0,
    active: true
  }
];

export default function StudioAssistant() {
  const { state } = useStudio();
  const pathname = usePathname();
  const config = normalizeAssistantConfig(state.site.assistant);
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);
  const [dwellReady, setDwellReady] = useState(false);

  useEffect(() => {
    setDwellReady(false);
    if (!/^\/products\/[^/]+$/.test(pathname)) return;
    const timer = window.setTimeout(() => setDwellReady(true), 7000);
    return () => window.clearTimeout(timer);
  }, [pathname]);

  const messages = useMemo(() => {
    const configured = config.campaigns.filter((campaign) => campaign.active);
    const contextual = [];
    const now = Date.now();
    const activeDrop = (state.drops || []).find((drop) =>
      drop.published !== false &&
      Date.parse(drop.startsAt) <= now &&
      Date.parse(drop.endsAt) > now
    );
    if (activeDrop) {
      const dropProduct = state.products.find((entry) => entry.id === activeDrop.productId);
      contextual.push({
        id: `context-drop-${activeDrop.id}`,
        type: "promotion" as const,
        title: `${activeDrop.title} está AO VIVO ✨`,
        text: activeDrop.description || (dropProduct ? `${dropProduct.name} entrou no drop do Studio K.` : "Tem promoção rolando agora no Studio K."),
        ctaLabel: dropProduct ? "Ver o drop" : "Ver produtos",
        href: dropProduct ? `/products/${dropProduct.id}` : "/products",
        priceCents: dropProduct
          ? Math.max(0, Math.floor(dropProduct.priceCents * (100 - Number(activeDrop.discountPercent || 0)) / 100))
          : 0,
        oldPriceCents: dropProduct?.priceCents || 0,
        active: true
      });
    }
    const productMatch = pathname.match(/^\/products\/([^/]+)$/);
    const portfolioMatch = pathname.match(/^\/portfolio\/([^/]+)$/);

    if (productMatch) {
      const product = state.products.find((entry) => entry.id === decodeURIComponent(productMatch[1]));
      if (product) {
        if (dwellReady) {
          contextual.push({
            id: `context-look-${product.id}`,
            type: "cute" as const,
            title: `${product.name} chamou sua atenção? 👀`,
            text: "Hmmm... você está olhando bastante esse. Dá uma olhadinha nos detalhes, materiais e visualização 3D antes de decidir. 💜",
            ctaLabel: "",
            href: "",
            priceCents: 0,
            oldPriceCents: 0,
            active: true
          });
        }

        const promo = configured.find((campaign) =>
          campaign.type === "promotion" &&
          (!campaign.href || campaign.href.includes(product.id) || campaign.title.toLowerCase().includes(product.name.toLowerCase()))
        );
        if (promo) contextual.push({ ...promo, id: `context-promo-${promo.id}` });

        const purchased = state.me.profile?.purchasedProductIds || [];
        const related = state.products.find((entry) =>
          purchased.includes(entry.id) &&
          entry.id !== product.id &&
          (
            (entry.category && product.category && entry.category === product.category) ||
            entry.tags?.some((tag) => product.tags?.includes(tag))
          )
        );
        if (related) {
          contextual.push({
            id: `context-related-${product.id}`,
            type: "cute" as const,
            title: "Eu reconheci seu estilo ✨",
            text: `Esse combina MUITO com ${related.name}, que já faz parte da sua biblioteca Studio K.`,
            ctaLabel: "Ver minha conta",
            href: "/account",
            priceCents: 0,
            oldPriceCents: 0,
            active: true
          });
        }
      }
    } else if (portfolioMatch) {
      const item = state.items.find((entry) => entry.id === decodeURIComponent(portfolioMatch[1]));
      if (item) contextual.push({
        id: `context-portfolio-${item.id}`,
        type: "cute" as const,
        title: "Olha esses detalhes ✨",
        text: `Esse é o projeto ${item.name}. Se tiver modelo 3D, gira ele e olha o acabamento de todos os lados.`,
        ctaLabel: "",
        href: "",
        priceCents: 0,
        oldPriceCents: 0,
        active: true
      });
    } else if (pathname === "/products") {
      contextual.push({
        id: "context-products",
        type: "bestseller" as const,
        title: "Procurando alguma coisa específica?",
        text: "Vai explorando com calma. Eu apareço quando encontrar promoção, novidade ou algum queridinho do Studio K. 👀",
        ctaLabel: "",
        href: "",
        priceCents: 0,
        oldPriceCents: 0,
        active: true
      });
    } else if (pathname === "/account" && state.me.authenticated) {
      contextual.push({
        id: "context-account",
        type: "cute" as const,
        title: `${state.me.profile?.studioId || "Seu Studio K ID"} ficou lindo 💜`,
        text: `Você está no level ${state.me.profile?.level || 1}. Favoritos, compras e feedbacks ajudam seu perfil a evoluir.`,
        ctaLabel: "",
        href: "",
        priceCents: 0,
        oldPriceCents: 0,
        active: true
      });
    }

    return [...contextual, ...configured, ...BUILT_IN_TIPS].map(buildAssistantMessage);
  }, [config.campaigns, dwellReady, index, pathname, state.drops, state.items, state.me.authenticated, state.me.profile, state.products]);

  const intervalMs = Math.max(5000, Number(config.intervalSeconds || 5) * 1000);
  const current = messages[index % Math.max(messages.length, 1)];

  useEffect(() => {
    if (!config.enabled || messages.length === 0) return;
    const hideAt = window.setTimeout(() => setVisible(false), Math.max(1000, intervalMs - 450));
    const nextAt = window.setTimeout(() => {
      setIndex((value) => (value + 1) % messages.length);
      setVisible(true);
    }, intervalMs);
    return () => {
      window.clearTimeout(hideAt);
      window.clearTimeout(nextAt);
    };
  }, [config.enabled, index, intervalMs, messages.length]);

  useEffect(() => {
    if (index >= messages.length) setIndex(0);
  }, [index, messages.length]);

  if (!config.enabled || !current) return null;

  const external = /^https?:\/\//i.test(current.href);

  return (
    <aside className="studio-assistant" aria-label="Assistente do Studio K">
      <div className={`assistant-bubble ${visible ? "is-visible" : "is-hidden"}`}>
        <div className="assistant-bubble-head">
          <span className={`assistant-type assistant-type-${current.type}`}>Kiki · Studio K</span>
          <button type="button" aria-label="Fechar dica" onClick={() => setVisible(false)}>×</button>
        </div>
        <strong>{current.title}</strong>
        <p>{current.message}</p>
        {current.href && current.ctaLabel && (
          <a
            className="assistant-cta"
            href={current.href}
            {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
          >
            {current.ctaLabel}
            <span aria-hidden="true">→</span>
          </a>
        )}
      </div>

      <button
        type="button"
        className="assistant-character"
        aria-label={visible ? "Ocultar fala da Kiki" : "Mostrar fala da Kiki"}
        onClick={() => setVisible((value) => !value)}
      >
        <span className="assistant-character-glow" aria-hidden="true" />
        <img src={config.imageUrl || "/studio-assets/studio-k-mascot.webp"} alt="Kiki, assistente do Studio K" />
      </button>
    </aside>
  );
}
