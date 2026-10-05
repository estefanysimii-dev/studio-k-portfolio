"use client";

import type {
  StudioIdBadgeCondition,
  StudioIdBadgeConfig,
  StudioIdConfig,
  StudioIdRankConfig,
  StudioMemberRarity
} from "@/lib/studio-types";

type Props = {
  value: StudioIdConfig;
  roles: { id: string; name: string }[];
  onChange: (next: StudioIdConfig) => void;
  onSave: () => void;
};

const rarityLabels: Record<StudioMemberRarity, string> = {
  common: "Comum",
  rare: "Raro",
  epic: "Épico",
  legendary: "Lendário"
};

const badgeConditionLabels: Record<Exclude<StudioIdBadgeCondition, "level">, string> = {
  always: "Sempre",
  "early-member": "Entre os primeiros IDs",
  "discord-member": "Membro do Discord",
  supporter: "Cargo Supporter/VIP",
  purchases: "Quantidade de compras",
  "neon-lover": "Compra Neon/emissiva",
  feedbacks: "Quantidade de feedbacks",
  favorites: "Quantidade de favoritos"
};

const badgeConditionUsesValue = (condition: StudioIdBadgeCondition) =>
  ["early-member", "purchases", "feedbacks", "favorites"].includes(condition);

const clampInt = (value: string, min = 0, max = 100000) =>
  Math.min(max, Math.max(min, Math.round(Number(value) || 0)));

const rankId = (ranks: StudioIdRankConfig[]) => {
  const taken = new Set(ranks.map((rank) => rank.id));
  let index = ranks.length + 1;
  let id = `rank-${index}`;
  while (taken.has(id)) {
    index += 1;
    id = `rank-${index}`;
  }
  return id;
};

const badgeId = (badges: StudioIdBadgeConfig[]) => {
  const taken = new Set(badges.map((badge) => badge.id));
  let index = badges.length + 1;
  let id = `badge-${index}`;
  while (taken.has(id)) {
    index += 1;
    id = `badge-${index}`;
  }
  return id;
};

const nextLegacyRankOrder = (ranks: StudioIdRankConfig[]) =>
  Math.max(1, ...ranks.map((rank) => Number(rank.minLevel || 1))) + 1;

export default function StudioIdSettings({ value, roles, onChange, onSave }: Props) {
  const badges = (value.badges || []).filter((badge) => badge.condition !== "level");
  const patch = (next: Partial<StudioIdConfig>) => onChange({ ...value, ...next });
  const patchThreshold = (key: "collectorPurchases" | "profileFramePurchases", number: number) =>
    patch({ thresholds: { ...value.thresholds, [key]: number } });

  const patchRank = (id: string, next: Partial<StudioIdRankConfig>) => {
    onChange({
      ...value,
      ranks: value.ranks.map((rank) => rank.id === id ? { ...rank, ...next } : rank)
    });
  };

  const addRank = () => {
    if (value.ranks.length >= 12) return;
    const id = rankId(value.ranks);
    const next: StudioIdRankConfig = {
      id,
      label: "Novo Rank",
      icon: "✦",
      rarity: "common",
      minLevel: nextLegacyRankOrder(value.ranks)
    };
    onChange({
      ...value,
      ranks: [...value.ranks, next],
      discordRankSync: {
        ...value.discordRankSync,
        roleIds: { ...value.discordRankSync.roleIds, [id]: "" }
      }
    });
  };

  const removeRank = (id: string) => {
    if (value.ranks.length <= 1) return;
    const rank = value.ranks.find((item) => item.id === id);
    if (!rank) return;
    if (!window.confirm(`Remover o rank “${rank.label}”?`)) return;
    const roleIds = { ...value.discordRankSync.roleIds };
    delete roleIds[id];
    onChange({
      ...value,
      ranks: value.ranks.filter((item) => item.id !== id),
      discordRankSync: { ...value.discordRankSync, roleIds }
    });
  };

  const patchBadge = (id: string, next: Partial<StudioIdBadgeConfig>) => {
    onChange({
      ...value,
      badges: (value.badges || []).map((badge) => badge.id === id ? { ...badge, ...next } : badge)
    });
  };

  const addBadge = () => {
    if (badges.length >= 24) return;
    const id = badgeId(value.badges || []);
    const next: StudioIdBadgeConfig = {
      id,
      label: "Novo Badge",
      icon: "✦",
      rarity: "common",
      description: "Novo badge do Studio K.",
      condition: "always",
      value: 1,
      enabled: true
    };
    onChange({ ...value, badges: [...(value.badges || []), next] });
  };

  const removeBadge = (id: string) => {
    const badge = badges.find((item) => item.id === id);
    if (!badge) return;
    if (!window.confirm(`Remover o badge “${badge.label}”?`)) return;
    onChange({ ...value, badges: (value.badges || []).filter((item) => item.id !== id) });
  };

  const moveBadge = (id: string, direction: -1 | 1) => {
    const all = value.badges || [];
    const index = all.findIndex((badge) => badge.id === id);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= all.length) return;
    const nextBadges = [...all];
    const [badge] = nextBadges.splice(index, 1);
    nextBadges.splice(target, 0, badge);
    onChange({ ...value, badges: nextBadges });
  };

  const setRankRole = (id: string, roleId: string) =>
    patch({
      discordRankSync: {
        ...value.discordRankSync,
        roleIds: { ...value.discordRankSync.roleIds, [id]: roleId }
      }
    });

  return (
    <div className="studio-id-settings">
      <section className="control-form glass-panel">
        <div className="form-heading">
          <div>
            <span className="section-eyebrow">STUDIO K ID</span>
            <h2>Identidade do membro</h2>
            <p>XP e níveis foram desativados. Nesta etapa permanecem apenas os recursos de identidade que ainda serão revisados separadamente.</p>
          </div>
          <button className="btn btn-primary" type="button" onClick={onSave}>Salvar Studio K ID</button>
        </div>

        <div className="studio-id-control-switches">
          <label className="automation-toggle">
            <input type="checkbox" checked={value.enabled} onChange={(event) => patch({ enabled: event.target.checked })} />
            <span><strong>Identidade ativa</strong><small>Mantém o Studio K ID e os recursos de perfil ativos.</small></span>
          </label>
          {(["badges", "achievements", "perks"] as const).map((key) => (
            <label className="automation-toggle compact-toggle" key={key}>
              <input
                type="checkbox"
                checked={value.features[key]}
                onChange={(event) => patch({ features: { ...value.features, [key]: event.target.checked } })}
              />
              <span>
                <strong>{key === "badges" ? "Badges" : key === "achievements" ? "Conquistas" : "Perks"}</strong>
                <small>{value.features[key] ? "Ativo" : "Desativado"}</small>
              </span>
            </label>
          ))}
        </div>

        <div className="form-grid two" style={{ marginTop: 18 }}>
          <label>Limite Early Member
            <input type="number" min={0} value={value.earlyMemberLimit} onChange={(e) => patch({ earlyMemberLimit: clampInt(e.target.value) })} />
            <small>IDs dentro desta sequência podem receber a identificação Early Member.</small>
          </label>
          <label>Padrão de cargos Supporter
            <input value={value.supporterRolePattern} onChange={(e) => patch({ supporterRolePattern: e.target.value })} placeholder="supporter|vip|premium|apoiador|cliente" />
            <small>Expressão usada para reconhecer cargos de apoiador pelo nome.</small>
          </label>
        </div>
      </section>

      <section className="control-form glass-panel">
        <div className="form-heading studio-id-rank-heading">
          <div>
            <span className="section-eyebrow">RANKS</span>
            <h2>Ranks legados</h2>
            <p>Os ranks não evoluem mais por atividade. Eles permanecem temporariamente preservados até a próxima etapa da limpeza.</p>
          </div>
          <button className="btn btn-primary compact" type="button" onClick={addRank} disabled={value.ranks.length >= 12}>
            + Adicionar rank
          </button>
        </div>

        <div className="studio-id-rank-list">
          {value.ranks.map((rank) => (
            <article className={`studio-id-rank-editor rarity-${rank.rarity}`} key={rank.id}>
              <div className="studio-id-rank-preview">
                <i>{rank.icon || "•"}</i>
                <div>
                  <strong>{rank.label || "Rank sem nome"}</strong>
                  <span>{rarityLabels[rank.rarity]}</span>
                  <small>ID interno: {rank.id}</small>
                </div>
              </div>
              <div className="studio-id-rank-editor-main">
                <div className="studio-id-rank-fields">
                  <label>Nome
                    <input value={rank.label} onChange={(e) => patchRank(rank.id, { label: e.target.value })} />
                  </label>
                  <label>Ícone
                    <input maxLength={12} value={rank.icon} onChange={(e) => patchRank(rank.id, { icon: e.target.value })} />
                  </label>
                  <label>Raridade
                    <select value={rank.rarity} onChange={(e) => patchRank(rank.id, { rarity: e.target.value as StudioMemberRarity })}>
                      {Object.entries(rarityLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
                    </select>
                  </label>
                </div>
                <div className="studio-id-rank-actions">
                  <button type="button" className="rank-action-remove" onClick={() => removeRank(rank.id)} disabled={value.ranks.length <= 1}>
                    Remover
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="control-form glass-panel">
        <div className="form-heading studio-id-badge-heading">
          <div>
            <span className="section-eyebrow">BADGES</span>
            <h2>Badges do Studio K ID</h2>
            <p>Badges ligados à antiga progressão foram desativados. Os demais continuam preservados até a etapa específica de badges.</p>
          </div>
          <button className="btn btn-primary compact" type="button" onClick={addBadge} disabled={badges.length >= 24}>
            + Adicionar badge
          </button>
        </div>

        <div className="studio-id-badge-list">
          {badges.map((badge, index) => (
            <article className={`studio-id-badge-editor rarity-${badge.rarity} ${badge.enabled ? "" : "is-disabled"}`.trim()} key={badge.id}>
              <div className="studio-id-badge-preview">
                <i>{badge.icon || "✦"}</i>
                <div>
                  <strong>{badge.label || "Badge sem nome"}</strong>
                  <span>{rarityLabels[badge.rarity]} · {badge.enabled ? "Ativo" : "Desativado"}</span>
                  <small>{badgeConditionLabels[badge.condition as Exclude<StudioIdBadgeCondition, "level">] || "Regra preservada"}</small>
                </div>
              </div>
              <div className="studio-id-badge-editor-main">
                <div className="studio-id-badge-fields">
                  <label>Nome
                    <input value={badge.label} onChange={(e) => patchBadge(badge.id, { label: e.target.value })} />
                  </label>
                  <label>Ícone
                    <input maxLength={12} value={badge.icon} onChange={(e) => patchBadge(badge.id, { icon: e.target.value })} />
                  </label>
                  <label>Raridade
                    <select value={badge.rarity} onChange={(e) => patchBadge(badge.id, { rarity: e.target.value as StudioMemberRarity })}>
                      {Object.entries(rarityLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
                    </select>
                  </label>
                  <label>Desbloqueio
                    <select value={badge.condition} onChange={(e) => patchBadge(badge.id, { condition: e.target.value as StudioIdBadgeCondition })}>
                      {Object.entries(badgeConditionLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
                    </select>
                  </label>
                  <label>Valor
                    <input
                      type="number"
                      min={0}
                      disabled={!badgeConditionUsesValue(badge.condition)}
                      value={badge.value}
                      onChange={(e) => patchBadge(badge.id, { value: clampInt(e.target.value, 0, 1000000) })}
                    />
                  </label>
                  <label className="studio-id-badge-description">Descrição
                    <input value={badge.description} onChange={(e) => patchBadge(badge.id, { description: e.target.value })} />
                  </label>
                </div>

                <div className="studio-id-badge-actions">
                  <label className="badge-enabled-toggle">
                    <input type="checkbox" checked={badge.enabled} onChange={(e) => patchBadge(badge.id, { enabled: e.target.checked })} />
                    <span>{badge.enabled ? "Ativo" : "Desativado"}</span>
                  </label>
                  <div className="badge-order-buttons">
                    <button type="button" onClick={() => moveBadge(badge.id, -1)} disabled={index === 0} title="Subir badge">↑</button>
                    <button type="button" onClick={() => moveBadge(badge.id, 1)} disabled={index === badges.length - 1} title="Descer badge">↓</button>
                  </div>
                  <button type="button" className="rank-action-remove" onClick={() => removeBadge(badge.id)}>Remover</button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="control-form glass-panel">
        <div className="form-heading">
          <div><span className="section-eyebrow">DESBLOQUEIOS</span><h2>Requisitos ainda ativos</h2></div>
        </div>
        <div className="form-grid two">
          <label>Compras para Collector
            <input type="number" min={1} value={value.thresholds.collectorPurchases} onChange={(e) => patchThreshold("collectorPurchases", clampInt(e.target.value, 1, 10000))} />
          </label>
          <label>Compras para Collector Frame
            <input type="number" min={1} value={value.thresholds.profileFramePurchases} onChange={(e) => patchThreshold("profileFramePurchases", clampInt(e.target.value, 1, 10000))} />
          </label>
        </div>
      </section>

      <section className="control-form glass-panel">
        <div className="form-heading">
          <div>
            <span className="section-eyebrow">DISCORD</span>
            <h2>Sincronização de ranks com cargos</h2>
            <p>Este recurso fica preservado temporariamente junto aos ranks e será revisado na próxima etapa.</p>
          </div>
        </div>
        <label className="automation-toggle">
          <input
            type="checkbox"
            checked={value.discordRankSync.enabled}
            onChange={(event) => patch({ discordRankSync: { ...value.discordRankSync, enabled: event.target.checked } })}
          />
          <span>
            <strong>Sincronizar cargos automaticamente</strong>
            <small>Desativado por padrão.</small>
          </span>
        </label>
        <div className="form-grid two studio-id-role-grid">
          {value.ranks.map((rank) => (
            <label key={rank.id}>{rank.label}
              <select value={value.discordRankSync.roleIds[rank.id] || ""} onChange={(e) => setRankRole(rank.id, e.target.value)}>
                <option value="">Sem cargo automático</option>
                {roles.map((role) => <option value={role.id} key={role.id}>{role.name}</option>)}
              </select>
            </label>
          ))}
        </div>
      </section>
    </div>
  );
}
