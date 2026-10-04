"use client";

import { useEffect, useMemo, useState } from "react";
import { studioApi } from "@/lib/studio-api";
import type { StudioFeedback } from "@/lib/studio-types";

type Props = {
  feedbacks: StudioFeedback[];
  onSaved?: () => void | Promise<void>;
};

const dateLabel = (value: string) => {
  if (!value) return "Data não disponível";
  try {
    return new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium" }).format(new Date(value));
  } catch {
    return value;
  }
};

export default function FeedbackSettings({ feedbacks, onSaved }: Props) {
  const [items, setItems] = useState<StudioFeedback[]>(feedbacks);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setItems(feedbacks);
    setDirty(false);
  }, [feedbacks]);

  const visibleCount = useMemo(() => items.filter((item) => item.visible !== false).length, [items]);
  const hiddenCount = items.length - visibleCount;

  const mark = (next: StudioFeedback[]) => {
    setItems(next.map((item, index) => ({ ...item, order: index })));
    setDirty(true);
  };

  const toggle = (id: string) => {
    mark(items.map((item) => item.id === id ? { ...item, visible: item.visible === false } : item));
  };

  const move = (id: string, targetIndex: number) => {
    const index = items.findIndex((item) => item.id === id);
    if (index < 0) return;
    const bounded = Math.max(0, Math.min(items.length - 1, targetIndex));
    if (bounded === index) return;
    const next = [...items];
    const [item] = next.splice(index, 1);
    next.splice(bounded, 0, item);
    mark(next);
  };

  const showAll = () => mark(items.map((item) => ({ ...item, visible: true })));
  const hideAll = () => {
    if (!items.length) return;
    if (!window.confirm("Ocultar todos os feedbacks da página pública? Eles continuarão salvos na Central.")) return;
    mark(items.map((item) => ({ ...item, visible: false })));
  };

  const resetDateOrder = () => {
    mark([...items].sort((a, b) => Date.parse(b.submittedAt || "") - Date.parse(a.submittedAt || "")));
  };

  const save = async () => {
    setSaving(true);
    setError("");
    try {
      const result = await studioApi.saveFeedbackModeration({
        order: items.map((item) => item.id),
        hidden: items.filter((item) => item.visible === false).map((item) => item.id)
      });
      setItems(result.feedbacks);
      setDirty(false);
      await onSaved?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível salvar a organização dos feedbacks.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="feedback-control control-form glass-panel">
      <div className="form-heading feedback-manager-heading">
        <div>
          <span className="section-eyebrow">FEEDBACKS</span>
          <h2>Organização e visibilidade</h2>
          <p className="feedback-manager-subtitle">
            Escolha quais avaliações aparecem no site e controle a ordem em que elas são exibidas.
          </p>
        </div>

        <div className="feedback-manager-stats" aria-label="Resumo dos feedbacks">
          <div><strong>{visibleCount}</strong><span>Visíveis</span></div>
          <div><strong>{hiddenCount}</strong><span>Ocultos</span></div>
          <div><strong>{items.length}</strong><span>Total</span></div>
        </div>
      </div>

      <div className="feedback-manager-toolbar">
        <div className="feedback-manager-toolbar-group">
          <button className="btn btn-outline compact" type="button" onClick={showAll} disabled={!hiddenCount}>Mostrar todos</button>
          <button className="btn btn-outline compact" type="button" onClick={hideAll} disabled={!visibleCount}>Ocultar todos</button>
          <button className="btn btn-outline compact" type="button" onClick={resetDateOrder} disabled={items.length < 2}>Mais recentes primeiro</button>
        </div>

        <button
          type="button"
          className="btn btn-primary compact feedback-save-button"
          onClick={() => void save()}
          disabled={saving || !dirty}
        >
          {saving ? "Salvando..." : dirty ? "Salvar organização" : "Organização salva"}
        </button>
      </div>

      {error && <div className="control-notice error">{error}</div>}

      <div className="feedback-manager-list">
        {items.length ? items.map((feedback, index) => {
          const score = Math.max(1, Math.min(5, Math.round(Number(feedback.rating) || 0)));
          const visible = feedback.visible !== false;
          return (
            <article className={`control-row feedback-manager-row ${visible ? "" : "is-hidden"}`.trim()} key={feedback.id}>
              <div className="feedback-manager-avatar">
                {feedback.avatar ? (
                  <img
                    src={feedback.avatar}
                    alt=""
                    loading="lazy"
                    width={46}
                    height={46}
                    style={{ width: 46, height: 46, objectFit: "cover", borderRadius: 10 }}
                  />
                ) : (
                  <span className="row-placeholder">SK</span>
                )}
              </div>

              <div className="control-row-copy feedback-manager-copy">
                <div className="feedback-manager-name-line">
                  <strong>{feedback.name || "Cliente Studio K"}</strong>
                  <span className={`feedback-manager-status ${visible ? "visible" : "hidden"}`}>
                    {visible ? "Visível" : "Oculto"}
                  </span>
                </div>

                <span className="feedback-manager-meta">
                  #{String(index + 1).padStart(2, "0")} · {feedback.source || "Feedback"}
                  {feedback.reference ? ` · ${feedback.reference}` : ""}
                  {" · "}{dateLabel(feedback.submittedAt)}
                </span>

                <div className="feedback-manager-rating">
                  <span aria-label={`${score} de 5 estrelas`}>{"★".repeat(score)}{"☆".repeat(5 - score)}</span>
                  <small>{score}/5</small>
                </div>

                <p>{feedback.comment || "Avaliação enviada sem comentário."}</p>
              </div>

              <button
                type="button"
                className={`feedback-visibility-button ${visible ? "visible" : "hidden"}`}
                onClick={() => toggle(feedback.id)}
              >
                {visible ? "Ocultar" : "Mostrar"}
              </button>

              <div className="control-row-actions feedback-manager-order-actions" aria-label="Ordenar feedback">
                <button type="button" onClick={() => move(feedback.id, 0)} disabled={index === 0} title="Mover para o topo" aria-label="Mover para o topo">↑↑</button>
                <button type="button" onClick={() => move(feedback.id, index - 1)} disabled={index === 0} title="Subir" aria-label="Subir">↑</button>
                <button type="button" onClick={() => move(feedback.id, index + 1)} disabled={index === items.length - 1} title="Descer" aria-label="Descer">↓</button>
                <button type="button" onClick={() => move(feedback.id, items.length - 1)} disabled={index === items.length - 1} title="Mover para o fim" aria-label="Mover para o fim">↓↓</button>
              </div>
            </article>
          );
        }) : (
          <div className="feedback-manager-empty">
            <strong>Nenhum feedback enviado ainda.</strong>
            <span>As avaliações submetidas pelo fluxo do bot aparecerão aqui automaticamente.</span>
          </div>
        )}
      </div>

      <div className="feedback-manager-foot">
        <strong>Ocultar não exclui o feedback.</strong>
        <span>A média e os filtros da página pública consideram somente os feedbacks visíveis.</span>
      </div>
    </section>
  );
}
