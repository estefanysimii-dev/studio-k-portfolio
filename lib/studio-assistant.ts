import type { AssistantCampaign, StudioAssistantConfig } from "./studio-types";

export const DEFAULT_ASSISTANT_CONFIG: StudioAssistantConfig = {
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
    },
    {
      id: "motivation",
      type: "motivation",
      title: "Um lembrete fofo ✨",
      text: "Seu projeto não precisa ficar perfeito de primeira. O importante é continuar criando.",
      ctaLabel: "",
      href: "",
      priceCents: 0,
      oldPriceCents: 0,
      active: true
    }
  ]
};

export function normalizeAssistantConfig(value?: StudioAssistantConfig): StudioAssistantConfig {
  return {
    ...DEFAULT_ASSISTANT_CONFIG,
    ...(value || {}),
    campaigns: Array.isArray(value?.campaigns) ? value!.campaigns : DEFAULT_ASSISTANT_CONFIG.campaigns
  };
}

export function money(cents: number) {
  if (!cents) return "";
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100);
}

export function buildAssistantMessage(campaign: AssistantCampaign) {
  const title = campaign.title.trim();
  const detail = campaign.text.trim();
  const price = money(campaign.priceCents);
  const oldPrice = money(campaign.oldPriceCents);
  const discount =
    campaign.oldPriceCents > campaign.priceCents && campaign.priceCents > 0
      ? Math.round((1 - campaign.priceCents / campaign.oldPriceCents) * 100)
      : 0;

  let message = detail;

  if (campaign.type === "promotion") {
    const value = price ? ` Agora por ${price}${oldPrice ? ` (antes ${oldPrice})` : ""}.` : "";
    const off = discount ? ` São ${discount}% OFF ✨` : "";
    message = `Pssiu... ${title || "tem promoção nova no Studio K"}! 💜${off}${value} ${detail}`.trim();
  } else if (campaign.type === "combo") {
    message = `Olha esse combo 👀 ${title || "tem combinação nova no Studio K"}${price ? ` por ${price}` : ""}! ${detail}`.trim();
  } else if (campaign.type === "news") {
    message = `Novidade fresquinha chegando ✨ ${title || "Tem coisa nova no Studio K"}! ${detail}`.trim();
  } else if (campaign.type === "bestseller") {
    message = `Esse aqui está fazendo sucesso por aqui 👀 ${title || "Um dos queridinhos do Studio K"}${price ? ` por ${price}` : ""}. ${detail}`.trim();
  } else if (campaign.type === "motivation") {
    message = detail || "Vai no seu ritmo. Toda criação começa com uma ideia pequena e um pouquinho de coragem. ✨";
  } else if (campaign.type === "cute") {
    message = detail || "Ei, só passando para dizer que seu personagem merece um look incrível hoje. 💜";
  }

  return {
    id: campaign.id,
    type: campaign.type,
    title: title || "Kiki do Studio K",
    message,
    ctaLabel: campaign.ctaLabel.trim(),
    href: campaign.href.trim()
  };
}
