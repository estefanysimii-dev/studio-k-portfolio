"use client";

import type { StudioIdConfig, StudioIdRankConfig, StudioMemberRarity } from "@/lib/studio-types";

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

const clampInt = (value: string, min = 0, max = 100000) =>
  Math.min(max, Math.max(min, Math.round(Number(value) || 0)));

export default function StudioIdSettings({ value, roles, onChange, onSave }: Props) {
  const patch = (next: Partial<StudioIdConfig>) => onChange({ ...value, ...next });
  const patchXp = (key: keyof StudioIdConfig["xp"], number: number) =>
    patch({ xp: { ...value.xp, [key]: number } });
  const patchThreshold = (key: keyof StudioIdConfig["thresholds"], number: number) =>
    patch({ thresholds: { ...value.thresholds, [key]: number } });

  const patchRank = (id: string, next: Partial<StudioIdRankConfig>) => {
    const ranks = value.ranks.map((rank) => rank.id === id ? { ...rank, ...next } : rank);
    const updated = ranks.find((rank) => rank.id === id);
    let thresholds = value.thresholds;
    if (updated && typeof next.minLevel === "number") {
      if (id === "creator") thresholds = { ...thresholds, creatorLevel: updated.minLevel };
      if (id === "insider") thresholds = { ...thresholds, insiderLevel: updated.minLevel };
      if (id === "icon") thresholds = { ...thresholds, iconLevel: updated.minLevel };
    }
    onChange({ ...value, ranks, thresholds });
  };

  const setRankRole = (rankId: string, roleId: string) =>
    patch({
      discordRankSync: {
        ...value.discordRankSync,
        roleIds: { ...value.discordRankSync.roleIds, [rankId]: roleId }
      }
    });

  return (
    <div className="studio-id-settings">
      <section className="control-form glass-panel">
        <div className="form-heading">
          <div>
            <span className="section-eyebrow">STUDIO K ID</span>
            <h2>Progressão do ecossistema</h2>
            <p>Controle XP, níveis, ranks, conquistas, perks e a integração opcional com cargos do Discord.</p>
          </div>
          <button className="btn btn-primary" type="button" onClick={onSave}>Salvar Studio K ID</button>
        </div>

        <div className="studio-id-control-switches">
          <label className="automation-toggle">
            <input type="checkbox" checked={value.enabled} onChange={(event) => patch({ enabled: event.target.checked })} />
            <span><strong>Sistema ativo</strong><small>Mantém progressão, rank e identidade digital ativos para os membros.</small></span>
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
                <small>{value.features[key] ? "Visível e calculado" : "Desativado"}</small>
              </span>
            </label>
          ))}
        </div>
      </section>

      <section className="control-form glass-panel">
        <div className="form-heading">
          <div><span className="section-eyebrow">XP + NÍVEIS</span><h2>Regras de progressão</h2></div>
        </div>
        <div className="form-grid two studio-id-xp-grid">
          <label>XP inicial
            <input type="number" min={0} value={value.xp.base} onChange={(e) => patchXp("base", clampInt(e.target.value))} />
          </label>
          <label>XP por estar no Discord
            <input type="number" min={0} value={value.xp.discordMember} onChange={(e) => patchXp("discordMember", clampInt(e.target.value))} />
          </label>
          <label>XP por compra concluída
            <input type="number" min={0} value={value.xp.purchase} onChange={(e) => patchXp("purchase", clampInt(e.target.value))} />
          </label>
          <label>XP por feedback
            <input type="number" min={0} value={value.xp.feedback} onChange={(e) => patchXp("feedback", clampInt(e.target.value))} />
          </label>
          <label>XP por favorito
            <input type="number" min={0} value={value.xp.favorite} onChange={(e) => patchXp("favorite", clampInt(e.target.value))} />
          </label>
          <label>XP por nível
            <input type="number" min={50} value={value.levelStep} onChange={(e) => patch({ levelStep: clampInt(e.target.value, 50) })} />
          </label>
          <label>Limite Early Member
            <input type="number" min={0} value={value.earlyMemberLimit} onChange={(e) => patch({ earlyMemberLimit: clampInt(e.target.value) })} />
            <small>IDs dentro desta sequência recebem o badge/título Early Member.</small>
          </label>
          <label>Padrão de cargos Supporter
            <input value={value.supporterRolePattern} onChange={(e) => patch({ supporterRolePattern: e.target.value })} placeholder="supporter|vip|premium|apoiador|cliente" />
            <small>Expressão usada para reconhecer cargos de apoiador pelo nome.</small>
          </label>
        </div>
      </section>

      <section className="control-form glass-panel">
        <div className="form-heading">
          <div>
            <span className="section-eyebrow">RANKS</span>
            <h2>Escada de identidade</h2>
            <p>O rank de maior nível já alcançado é aplicado automaticamente ao Studio K ID.</p>
          </div>
        </div>
        <div className="studio-id-rank-list">
          {value.ranks.map((rank) => (
            <article className={`studio-id-rank-editor rarity-${rank.rarity}`} key={rank.id}>
              <div className="studio-id-rank-preview">
                <i>{rank.icon || "•"}</i>
                <div><strong>{rank.label}</strong><span>LEVEL {rank.minLevel}+ · {rarityLabels[rank.rarity]}</span></div>
              </div>
              <div className="studio-id-rank-fields">
                <label>Nome
                  <input value={rank.label} onChange={(e) => patchRank(rank.id, { label: e.target.value })} />
                </label>
                <label>Ícone
                  <input maxLength={12} value={rank.icon} onChange={(e) => patchRank(rank.id, { icon: e.target.value })} />
                </label>
                <label>Nível mínimo
                  <input type="number" min={1} value={rank.minLevel} onChange={(e) => patchRank(rank.id, { minLevel: clampInt(e.target.value, 1, 1000) })} />
                </label>
                <label>Raridade
                  <select value={rank.rarity} onChange={(e) => patchRank(rank.id, { rarity: e.target.value as StudioMemberRarity })}>
                    {Object.entries(rarityLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
                  </select>
                </label>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="control-form glass-panel">
        <div className="form-heading">
          <div><span className="section-eyebrow">DESBLOQUEIOS</span><h2>Requisitos de conquistas e perks</h2></div>
        </div>
        <div className="form-grid two">
          <label>Compras para Collector
            <input type="number" min={1} value={value.thresholds.collectorPurchases} onChange={(e) => patchThreshold("collectorPurchases", clampInt(e.target.value, 1, 10000))} />
          </label>
          <label>Compras para Collector Frame
            <input type="number" min={1} value={value.thresholds.profileFramePurchases} onChange={(e) => patchThreshold("profileFramePurchases", clampInt(e.target.value, 1, 10000))} />
          </label>
          <label>Level da conquista de ascensão
            <input type="number" min={1} value={value.thresholds.levelFive} onChange={(e) => patchThreshold("levelFive", clampInt(e.target.value, 1, 1000))} />
          </label>
          <label>Level do Insider Mark
            <input type="number" min={1} value={value.thresholds.insiderLevel} onChange={(e) => patchThreshold("insiderLevel", clampInt(e.target.value, 1, 1000))} />
          </label>
          <label>Level do Icon Aura
            <input type="number" min={1} value={value.thresholds.iconLevel} onChange={(e) => patchThreshold("iconLevel", clampInt(e.target.value, 1, 1000))} />
          </label>
        </div>
      </section>

      <section className="control-form glass-panel">
        <div className="form-heading">
          <div>
            <span className="section-eyebrow">DISCORD</span>
            <h2>Sincronização de ranks com cargos</h2>
            <p>Quando ativada, o bot mantém somente o cargo correspondente ao rank atual entre os cargos configurados abaixo.</p>
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
            <small>Desativado por padrão. Ative somente depois de selecionar os cargos corretos.</small>
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
        {roles.length === 0 && <p className="muted">Nenhum cargo foi carregado. O bot precisa estar conectado ao Discord para listar os cargos.</p>}
      </section>
    </div>
  );
}
