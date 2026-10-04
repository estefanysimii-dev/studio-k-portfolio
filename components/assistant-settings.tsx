"use client";

import type { AssistantCampaign, AssistantCampaignType, StudioAssistantConfig } from "@/lib/studio-types";
import { buildAssistantMessage, normalizeAssistantConfig } from "@/lib/studio-assistant";

type Props = {
  value?: StudioAssistantConfig;
  onChange: (next: StudioAssistantConfig) => void;
  onSave: () => void;
};

const labels: Record<AssistantCampaignType, string> = {
  promotion: "Promoção",
  combo: "Combo",
  news: "Novidade",
  bestseller: "Mais vendido",
  motivation: "Motivacional",
  cute: "Fofa / Conversa"
};

function newCampaign(): AssistantCampaign {
  return {
    id: typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `campaign-${Date.now()}`,
    type: "news",
    title: "",
    text: "",
    ctaLabel: "Ver agora",
    href: "/products",
    priceCents: 0,
    oldPriceCents: 0,
    active: true,
    priority: 100,
    startsAt: "",
    endsAt: "",
    pages: [],
    audience: "all",
    maxViews: 0
  };
}

function cents(value: string) {
  const normalized = value.replace(",", ".").trim();
  const amount = Number(normalized);
  return Number.isFinite(amount) ? Math.max(0, Math.round(amount * 100)) : 0;
}

function reais(value: number) {
  return value ? (value / 100).toFixed(2).replace(".", ",") : "";
}

const localValue = (iso?: string) => {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const toIso = (value: string) => value ? new Date(value).toISOString() : "";

export default function AssistantSettings({ value, onChange, onSave }: Props) {
  const config = normalizeAssistantConfig(value);

  const patch = (next: Partial<StudioAssistantConfig>) => onChange({ ...config, ...next });
  const patchCampaign = (id: string, next: Partial<AssistantCampaign>) => {
    patch({
      campaigns: config.campaigns.map((campaign) => campaign.id === id ? { ...campaign, ...next } : campaign)
    });
  };

  const removeCampaign = (id: string) => {
    patch({ campaigns: config.campaigns.filter((campaign) => campaign.id !== id) });
  };

  return (
    <div className="assistant-settings">
      <section className="control-form glass-panel assistant-settings-head">
        <div className="form-heading">
          <div>
            <span className="section-eyebrow">ASSISTENTE DO SITE</span>
            <h2>Kiki · Assistente Studio K</h2>
            <p>
              A Kiki conversa com quem estiver navegando e alterna as falas conforme o intervalo configurado abaixo.
              Promoções, combos, novidades e destaques geram frases automaticamente.
            </p>
          </div>
          <button className="btn btn-primary" type="button" onClick={onSave}>Salvar assistente</button>
        </div>

        <div className="assistant-settings-toggle">
          <label>
            <input
              type="checkbox"
              checked={config.enabled}
              onChange={(event) => patch({ enabled: event.target.checked })}
            />
            <span>
              <strong>Assistente ativa</strong>
              <small>Exibe a Kiki no canto inferior direito do site público.</small>
            </span>
          </label>

          <label className="assistant-image-field">
            Imagem da assistente
            <input
              value={config.imageUrl}
              onChange={(event) => patch({ imageUrl: event.target.value })}
              placeholder="/studio-assets/studio-k-mascot.webp"
            />
          </label>
        </div>

        <div className="assistant-timing">
          <div className="assistant-timing-copy">
            <span className="section-eyebrow">TEMPO DOS POP-UPS</span>
            <strong>Intervalo entre as falas</strong>
            <small>Defina de quanto em quanto tempo a Kiki troca de mensagem no site.</small>
          </div>

          <div className="assistant-timing-control">
            <input
              aria-label="Intervalo dos pop-ups em segundos"
              type="range"
              min={5}
              max={120}
              step={1}
              value={config.intervalSeconds}
              onChange={(event) => patch({ intervalSeconds: Number(event.target.value) })}
            />
            <label>
              <input
                type="number"
                min={5}
                max={120}
                step={1}
                value={config.intervalSeconds}
                onChange={(event) => {
                  const value = Math.min(120, Math.max(5, Number(event.target.value) || 5));
                  patch({ intervalSeconds: value });
                }}
              />
              <span>segundos</span>
            </label>
          </div>

          <div className="assistant-timing-presets" aria-label="Atalhos de tempo">
            {[5, 10, 15, 30, 60].map((seconds) => (
              <button
                type="button"
                key={seconds}
                className={config.intervalSeconds === seconds ? "active" : ""}
                onClick={() => patch({ intervalSeconds: seconds })}
              >
                {seconds}s
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="control-list glass-panel assistant-campaigns">
        <div className="form-heading">
          <div>
            <span className="section-eyebrow">FALAS AUTOMÁTICAS</span>
            <h2>Campanhas e dicas</h2>
            <p>Cadastre o fato; a assistente monta uma frase mais natural conforme o tipo selecionado.</p>
          </div>
          <button className="btn btn-outline compact" type="button" onClick={() => patch({ campaigns: [...config.campaigns, newCampaign()] })}>
            + Adicionar fala
          </button>
        </div>

        <div className="assistant-campaign-list">
          {config.campaigns.map((campaign, position) => {
            const preview = buildAssistantMessage(campaign);
            return (
              <article className="assistant-campaign-card" key={campaign.id}>
                <div className="assistant-campaign-top">
                  <div>
                    <span>Fala {position + 1}</span>
                    <strong>{labels[campaign.type]}</strong>
                  </div>
                  <div className="assistant-campaign-actions">
                    <label className="assistant-active-toggle">
                      <input
                        type="checkbox"
                        checked={campaign.active}
                        onChange={(event) => patchCampaign(campaign.id, { active: event.target.checked })}
                      />
                      Ativa
                    </label>
                    <button type="button" className="danger" onClick={() => removeCampaign(campaign.id)}>Excluir</button>
                  </div>
                </div>

                <div className="form-grid two assistant-campaign-grid">
                  <label>Tipo
                    <select
                      value={campaign.type}
                      onChange={(event) => patchCampaign(campaign.id, { type: event.target.value as AssistantCampaignType })}
                    >
                      {Object.entries(labels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
                    </select>
                  </label>
                  <label>Título / nome da oferta
                    <input
                      value={campaign.title}
                      onChange={(event) => patchCampaign(campaign.id, { title: event.target.value })}
                      placeholder="Ex.: Combo Neon + Polo"
                    />
                  </label>
                  <label>Preço / valor da oferta
                    <input
                      inputMode="decimal"
                      value={reais(campaign.priceCents)}
                      onChange={(event) => patchCampaign(campaign.id, { priceCents: cents(event.target.value) })}
                      placeholder="49,90"
                    />
                  </label>
                  <label>Preço anterior
                    <input
                      inputMode="decimal"
                      value={reais(campaign.oldPriceCents)}
                      onChange={(event) => patchCampaign(campaign.id, { oldPriceCents: cents(event.target.value) })}
                      placeholder="79,90"
                    />
                  </label>
                  <label className="span-2">Detalhes que a Kiki deve mencionar
                    <textarea
                      rows={3}
                      value={campaign.text}
                      onChange={(event) => patchCampaign(campaign.id, { text: event.target.value })}
                      placeholder="Ex.: Disponível só esta semana e inclui duas variações."
                    />
                  </label>
                  <label>Texto do botão
                    <input
                      value={campaign.ctaLabel}
                      onChange={(event) => patchCampaign(campaign.id, { ctaLabel: event.target.value })}
                      placeholder="Quero ver"
                    />
                  </label>
                  <label>Destino do botão
                    <input
                      value={campaign.href}
                      onChange={(event) => patchCampaign(campaign.id, { href: event.target.value })}
                      placeholder="/products ou link externo"
                    />
                  </label>
                  <label>Prioridade
                    <input
                      type="number"
                      min={0}
                      max={1000}
                      value={campaign.priority ?? 100}
                      onChange={(event) => patchCampaign(campaign.id, { priority: Math.max(0, Math.min(1000, Number(event.target.value) || 0)) })}
                    />
                    <small>Maior prioridade aparece antes.</small>
                  </label>
                  <label>Público
                    <select
                      value={campaign.audience || "all"}
                      onChange={(event) => patchCampaign(campaign.id, { audience: event.target.value as "all" | "guest" | "member" })}
                    >
                      <option value="all">Todos</option>
                      <option value="guest">Somente visitantes</option>
                      <option value="member">Somente membros conectados</option>
                    </select>
                  </label>
                  <label>Começa em
                    <input
                      type="datetime-local"
                      value={localValue(campaign.startsAt)}
                      onChange={(event) => patchCampaign(campaign.id, { startsAt: toIso(event.target.value) })}
                    />
                  </label>
                  <label>Termina em
                    <input
                      type="datetime-local"
                      value={localValue(campaign.endsAt)}
                      onChange={(event) => patchCampaign(campaign.id, { endsAt: toIso(event.target.value) })}
                    />
                  </label>
                  <label>Limite por visitante
                    <input
                      type="number"
                      min={0}
                      max={100000}
                      value={campaign.maxViews ?? 0}
                      onChange={(event) => patchCampaign(campaign.id, { maxViews: Math.max(0, Number(event.target.value) || 0) })}
                    />
                    <small>0 = sem limite.</small>
                  </label>
                  <label className="span-2">Páginas onde pode aparecer
                    <input
                      value={(campaign.pages || []).join(", ")}
                      onChange={(event) => patchCampaign(campaign.id, {
                        pages: event.target.value.split(",").map((entry) => entry.trim()).filter(Boolean)
                      })}
                      placeholder="/products, /products/*, /account"
                    />
                    <small>Deixe vazio para todo o site. Use * no final para aceitar páginas filhas.</small>
                  </label>
                </div>

                <div className="assistant-preview">
                  <span>Prévia gerada automaticamente</span>
                  <strong>{preview.title}</strong>
                  <p>{preview.message}</p>
                  {preview.ctaLabel && preview.href && <button type="button" tabIndex={-1}>{preview.ctaLabel} →</button>}
                </div>
              </article>
            );
          })}

          {config.campaigns.length === 0 && (
            <div className="assistant-empty">
              Nenhuma campanha cadastrada. A Kiki ainda usará as mensagens fofas e motivacionais padrão.
            </div>
          )}
        </div>

        <div className="assistant-settings-note">
          <strong>Importante:</strong> os valores desta aba aparecem nas falas da assistente. Para alterar o preço real de venda e checkout, mantenha o produto atualizado também na aba <b>Produtos</b>.
        </div>
      </section>
    </div>
  );
}
