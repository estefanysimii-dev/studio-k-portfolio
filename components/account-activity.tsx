"use client";

import { useStudio } from "./studio-provider";

export default function AccountActivity() {
  const { state } = useStudio();
  const history = state.personal?.activityHistory || [];
  if (!state.me.authenticated) return null;

  return (
    <section className="account-activity glass-panel">
      <div className="section-heading compact-heading">
        <div>
          <span className="section-eyebrow">ATIVIDADE</span>
          <h2>Histórico recente</h2>
        </div>
      </div>

      <div className="account-activity-list">
        {history.length ? history.map((entry, index) => (
          <article key={`${entry.created}-${entry.event}-${index}`}>
            <i />
            <div>
              <strong>{entry.label}</strong>
              <span>
                {entry.itemId ? `${entry.itemKind || "item"} · ${entry.itemId}` : entry.path || "Studio K"}
              </span>
              <small>{new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(entry.created))}</small>
            </div>
          </article>
        )) : <p className="muted">Sua atividade recente aparecerá aqui conforme você usar o Studio K.</p>}
      </div>
    </section>
  );
}
