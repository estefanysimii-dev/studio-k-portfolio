"use client";

import { useEffect, useMemo, useState } from "react";
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
  const config = normalizeAssistantConfig(state.site.assistant);
  const messages = useMemo(() => {
    const configured = config.campaigns.filter((campaign) => campaign.active);
    return [...configured, ...BUILT_IN_TIPS].map(buildAssistantMessage);
  }, [config.campaigns]);

  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);

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
