"use client";

import type { StudioIdConfig } from "@/lib/studio-types";

type Props = {
  value: StudioIdConfig;
  onChange: (next: StudioIdConfig) => void;
  onSave: () => void;
};

const clampInt = (value: string, min = 0, max = 100000) =>
  Math.min(max, Math.max(min, Math.round(Number(value) || 0)));

export default function StudioIdSettings({ value, onChange, onSave }: Props) {
  const patch = (next: Partial<StudioIdConfig>) => onChange({ ...value, ...next });
  const patchThreshold = (collectorPurchases: number) =>
    patch({ thresholds: { ...value.thresholds, collectorPurchases } });

  return (
    <div className="studio-id-settings">
      <section className="control-form glass-panel">
        <div className="form-heading">
          <div>
            <span className="section-eyebrow">STUDIO K ID</span>
            <h2>Identidade da conta</h2>
            <p>O Studio K ID agora funciona como identificador do membro, sem XP, níveis, ranks, badges, conquistas ou perks.</p>
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
            <span className="section-eyebrow">TÍTULOS</span>
            <h2>Regras temporárias dos títulos</h2>
            <p>Estas opções permanecem somente porque os títulos ainda serão revisados em uma etapa separada.</p>
          </div>
        </div>

        <div className="form-grid two">
          <label>Limite Early Member
            <input
              type="number"
              min={0}
              value={value.earlyMemberLimit}
              onChange={(e) => patch({ earlyMemberLimit: clampInt(e.target.value) })}
            />
            <small>Define até qual sequência do Studio K ID o título Early Member pode ser liberado.</small>
          </label>

          <label>Padrão de cargos Supporter
            <input
              value={value.supporterRolePattern}
              onChange={(e) => patch({ supporterRolePattern: e.target.value })}
              placeholder="supporter|vip|premium|apoiador|cliente"
            />
            <small>Usado apenas para reconhecer o título Supporter enquanto títulos permanecerem ativos.</small>
          </label>

          <label>Compras para Collector
            <input
              type="number"
              min={1}
              value={value.thresholds.collectorPurchases}
              onChange={(e) => patchThreshold(clampInt(e.target.value, 1, 10000))}
            />
            <small>Quantidade de compras necessária para o título Collector.</small>
          </label>
        </div>
      </section>
    </div>
  );
}
