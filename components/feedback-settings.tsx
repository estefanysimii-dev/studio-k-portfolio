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
    const next = [...items].sort((a, b) => Date.parse(b.submittedAt || "") - Date.parse(a.submittedAt || ""));
    mark(next);
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
    <section className="feedback-control glass-panel">
      <div className="feedback-control-head">
        <div>
          <span className="section-eyebrow">FEEDBACKS</span>
          <h2>Organização e visibilidade</h2>
          <p>Escolha quais avaliações aparecem no site e controle a ordem em que elas são exibidas.</p>
        </div>

        <div className="feedback-control-summary">
          <span><b>{visibleCount}</b> visíveis</span>
          <span><b>{hiddenCount}</b> ocultos</span>
          <span><b>{items.length}</b> total</span>
        </div>
      </div>

      <div className="feedback-control-toolbar">
        <div>
          <button type="button" onClick={showAll} disabled={!hiddenCount}>Mostrar todos</button>
          <button type="button" onClick={hideAll} disabled={!visibleCount}>Ocultar todos</button>
          <button type="button" onClick={resetDateOrder} disabled={items.length < 2}>Mais recentes primeiro</button>
        </div>
        <button
          type="button"
          className="btn btn-primary compact"
          onClick={() => void save()}
          disabled={saving || !dirty}
        >
          {saving ? "Salvando..." : dirty ? "Salvar organização" : "Organização salva"}
        </button>
      </div>

      {error && <div className="control-notice error">{error}</div>}

      <div className="feedback-control-list">
        {items.length ? items.map((feedback, index) => {
          const score = Math.max(1, Math.min(5, Math.round(Number(feedback.rating) || 0)));
          const visible = feedback.visible !== false;
          return (
            <article className={`feedback-control-row ${visible ? "" : "is-hidden"}`.trim()} key={feedback.id}>
              <div className="feedback-control-position">{String(index + 1).padStart(2, "0")}</div>

              <div className="feedback-control-person">
                {feedback.avatar
                  ? <img src={feedback.avatar} alt="" loading="lazy" />
                  : <span>SK</span>}
                <div>
                  <strong>{feedback.name || "Cliente Studio K"}</strong>
                  <small>{feedback.source || "Feedback"}{feedback.reference ? ` · ${feedback.reference}` : ""}</small>
                </div>
              </div>

              <div className="feedback-control-content">
                <div className="feedback-control-rating" aria-label={`${score} de 5 estrelas`}>
                  <span>{"★".repeat(score)}{"☆".repeat(5 - score)}</span>
                  <small>{score}/5 · {dateLabel(feedback.submittedAt)}</small>
                </div>
                <p>{feedback.comment || "Avaliação enviada sem comentário."}</p>
              </div>

              <div className="feedback-control-actions">
                <button
                  type="button"
                  className={visible ? "visibility visible" : "visibility hidden"}
                  onClick={() => toggle(feedback.id)}
                >
                  {visible ? "Visível" : "Oculto"}
                </button>
                <div className="feedback-order-actions">
                  <button type="button" onClick={() => move(feedback.id, 0)} disabled={index === 0} title="Mover para o topo">↑↑</button>
                  <button type="button" onClick={() => move(feedback.id, index - 1)} disabled={index === 0} title="Subir">↑</button>
                  <button type="button" onClick={() => move(feedback.id, index + 1)} disabled={index === items.length - 1} title="Descer">↓</button>
                  <button type="button" onClick={() => move(feedback.id, items.length - 1)} disabled={index === items.length - 1} title="Mover para o fim">↓↓</button>
                </div>
              </div>
            </article>
          );
        }) : (
          <div className="feedback-control-empty">
            <strong>Nenhum feedback enviado ainda.</strong>
            <span>As avaliações submetidas pelo fluxo do bot aparecerão aqui automaticamente.</span>
          </div>
        )}
      </div>

      <div className="feedback-control-foot">
        <span>Ocultar não exclui o feedback.</span>
        <small>A média e os filtros da página pública consideram somente os feedbacks visíveis.</small>
      </div>
    </section>
  );
}
