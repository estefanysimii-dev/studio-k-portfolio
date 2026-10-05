"use client";

import type { StudioIdConfig, StudioRoleTitleConfig } from "@/lib/studio-types";

type Props = {
  value: StudioIdConfig;
  roles: { id: string; name: string }[];
  onChange: (next: StudioIdConfig) => void;
  onSave: () => void;
};

const nextTitleId = (titles: StudioRoleTitleConfig[]) => {
  const used = new Set(titles.map((title) => title.id));
  let index = titles.length + 1;
  let id = `title-${index}`;
  while (used.has(id)) {
    index += 1;
    id = `title-${index}`;
  }
  return id;
};

export default function StudioIdSettings({ value, roles, onChange, onSave }: Props) {
  const patch = (next: Partial<StudioIdConfig>) => onChange({ ...value, ...next });

  const patchTitle = (id: string, next: Partial<StudioRoleTitleConfig>) => {
    patch({
      titles: value.titles.map((title) => title.id === id ? { ...title, ...next } : title)
    });
  };

  const addTitle = () => {
    const availableRole = roles.find((role) => !value.titles.some((title) => title.roleId === role.id));
    if (!availableRole || value.titles.length >= 40) return;
    const next: StudioRoleTitleConfig = {
      id: nextTitleId(value.titles),
      label: availableRole.name,
      description: `Título concedido pelo cargo ${availableRole.name} no Discord.`,
      roleId: availableRole.id,
      enabled: true
    };
    patch({ titles: [...value.titles, next] });
  };

  const removeTitle = (id: string) => {
    const title = value.titles.find((item) => item.id === id);
    if (!title) return;
    if (!window.confirm(`Remover o título “${title.label}”?`)) return;
    patch({ titles: value.titles.filter((item) => item.id !== id) });
  };

  const moveTitle = (id: string, direction: -1 | 1) => {
    const index = value.titles.findIndex((item) => item.id === id);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= value.titles.length) return;
    const next = [...value.titles];
    const [item] = next.splice(index, 1);
    next.splice(target, 0, item);
    patch({ titles: next });
  };

  const roleName = (roleId: string) => roles.find((role) => role.id === roleId)?.name || "Cargo não encontrado";

  return (
    <div className="studio-id-settings">
      <section className="control-form glass-panel">
        <div className="form-heading">
          <div>
            <span className="section-eyebrow">STUDIO K ID</span>
            <h2>Identidade da conta</h2>
            <p>O Studio K ID identifica a conta. Os títulos são puramente visuais e vêm exclusivamente dos cargos do Discord.</p>
          </div>
          <button className="btn btn-primary" type="button" onClick={onSave}>Salvar Studio K ID</button>
        </div>

        <label className="automation-toggle">
          <input type="checkbox" checked={value.enabled} onChange={(event) => patch({ enabled: event.target.checked })} />
          <span>
            <strong>Identidade ativa</strong>
            <small>Mantém o Studio K ID e os recursos de conta disponíveis.</small>
          </span>
        </label>
      </section>

      <section className="control-form glass-panel">
        <div className="form-heading">
          <div>
            <span className="section-eyebrow">TÍTULO PADRÃO</span>
            <h2>Perfil sem cargo vinculado</h2>
            <p>Este título aparece quando o membro não possui nenhum dos cargos configurados abaixo ou quando o título escolhido deixa de estar disponível.</p>
          </div>
        </div>

        <div className="form-grid two">
          <label>Nome do título
            <input
              value={value.defaultTitle.label}
              onChange={(e) => patch({ defaultTitle: { ...value.defaultTitle, label: e.target.value } })}
              placeholder="Studio K Member"
            />
          </label>
          <label>Descrição
            <input
              value={value.defaultTitle.description}
              onChange={(e) => patch({ defaultTitle: { ...value.defaultTitle, description: e.target.value } })}
              placeholder="Título padrão do perfil Studio K."
            />
          </label>
        </div>
      </section>

      <section className="control-form glass-panel">
        <div className="form-heading">
          <div>
            <span className="section-eyebrow">TÍTULOS + DISCORD</span>
            <h2>Títulos por cargo</h2>
            <p>Associe um título a um cargo real do Discord. O membro só poderá usar o título enquanto possuir esse cargo.</p>
          </div>
          <button
            className="btn btn-primary compact"
            type="button"
            onClick={addTitle}
            disabled={!roles.length || value.titles.length >= 40 || roles.every((role) => value.titles.some((title) => title.roleId === role.id))}
          >
            + Adicionar título
          </button>
        </div>

        {!roles.length && (
          <div className="control-notice">
            Conecte o bot ao Discord para carregar os cargos disponíveis.
          </div>
        )}

        <div className="studio-title-role-list">
          {value.titles.map((title, index) => (
            <article className={`studio-title-role-row ${title.enabled ? "" : "is-disabled"}`.trim()} key={title.id}>
              <div className="studio-title-role-preview">
                <span>{title.label || "Título sem nome"}</span>
                <small>{roleName(title.roleId)}</small>
              </div>

              <div className="studio-title-role-fields">
                <label>Título
                  <input value={title.label} onChange={(e) => patchTitle(title.id, { label: e.target.value })} />
                </label>
                <label>Cargo do Discord
                  <select value={title.roleId} onChange={(e) => patchTitle(title.id, { roleId: e.target.value })}>
                    {!roles.some((role) => role.id === title.roleId) && (
                      <option value={title.roleId}>{roleName(title.roleId)}</option>
                    )}
                    {roles.map((role) => (
                      <option
                        value={role.id}
                        key={role.id}
                        disabled={value.titles.some((item) => item.id !== title.id && item.roleId === role.id)}
                      >
                        {role.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="studio-title-role-description">Descrição
                  <input value={title.description} onChange={(e) => patchTitle(title.id, { description: e.target.value })} />
                </label>
              </div>

              <div className="studio-title-role-actions">
                <label className="studio-title-enabled-toggle">
                  <input type="checkbox" checked={title.enabled} onChange={(e) => patchTitle(title.id, { enabled: e.target.checked })} />
                  <span>{title.enabled ? "Ativo" : "Desativado"}</span>
                </label>
                <div className="studio-title-order-buttons">
                  <button type="button" onClick={() => moveTitle(title.id, -1)} disabled={index === 0} title="Subir">↑</button>
                  <button type="button" onClick={() => moveTitle(title.id, 1)} disabled={index === value.titles.length - 1} title="Descer">↓</button>
                </div>
                <button type="button" className="studio-title-remove" onClick={() => removeTitle(title.id)}>Apagar</button>
              </div>
            </article>
          ))}

          {!value.titles.length && (
            <div className="studio-title-role-empty">
              <strong>Nenhum título por cargo configurado.</strong>
              <span>Adicione um título e associe-o ao cargo correspondente no Discord.</span>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
