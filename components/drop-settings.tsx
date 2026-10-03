"use client";

import { FormEvent, useMemo, useState } from "react";
import { studioApi } from "@/lib/studio-api";
import type { StudioDrop, StudioProduct } from "@/lib/studio-types";

type Props = {
  drops: StudioDrop[];
  products: StudioProduct[];
  channels: { id: string; name: string; type?: number }[];
  onChanged: () => Promise<void> | void;
  onNotice?: (message: string) => void;
  onError?: (message: string) => void;
};

type Draft = {
  title: string;
  description: string;
  productId: string;
  discountPercent: number;
  startsAt: string;
  endsAt: string;
  channelId: string;
  announceDiscord: boolean;
  published: boolean;
};

const pad = (n: number) => String(n).padStart(2, "0");
const localValue = (date: Date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;

const makeDraft = (): Draft => {
  const start = new Date(Date.now() + 5 * 60_000);
  const end = new Date(start.getTime() + 24 * 60 * 60_000);
  return {
    title: "",
    description: "",
    productId: "",
    discountPercent: 0,
    startsAt: localValue(start),
    endsAt: localValue(end),
    channelId: "",
    announceDiscord: true,
    published: true
  };
};

const toDraft = (drop: StudioDrop): Draft => ({
  title: drop.title,
  description: drop.description || "",
  productId: drop.productId,
  discountPercent: Number(drop.discountPercent || 0),
  startsAt: localValue(new Date(drop.startsAt)),
  endsAt: localValue(new Date(drop.endsAt)),
  channelId: drop.channelId || "",
  announceDiscord: drop.announceDiscord !== false,
  published: drop.published !== false
});

const statusLabel: Record<string, string> = {
  active: "Ao vivo",
  scheduled: "Agendado",
  ended: "Encerrado",
  draft: "Rascunho"
};

export default function DropSettings({ drops, products, channels, onChanged, onNotice, onError }: Props) {
  const [draft, setDraft] = useState<Draft>(makeDraft);
  const [editingId, setEditingId] = useState("");
  const [busy, setBusy] = useState(false);

  const selectedProduct = useMemo(
    () => products.find((product) => product.id === draft.productId),
    [draft.productId, products]
  );

  const reset = () => {
    setDraft(makeDraft());
    setEditingId("");
  };

  const save = async (event: FormEvent) => {
    event.preventDefault();
    if (!draft.productId) {
      onError?.("Escolha o produto que participará do drop.");
      return;
    }

    const startsAt = new Date(draft.startsAt);
    const endsAt = new Date(draft.endsAt);
    if (!Number.isFinite(startsAt.getTime()) || !Number.isFinite(endsAt.getTime()) || endsAt <= startsAt) {
      onError?.("Defina um período válido para o drop.");
      return;
    }

    setBusy(true);
    try {
      const body = {
        ...draft,
        discountPercent: Math.min(100, Math.max(0, Number(draft.discountPercent || 0))),
        startsAt: startsAt.toISOString(),
        endsAt: endsAt.toISOString()
      };
      if (editingId) await studioApi.updateDrop(editingId, body);
      else await studioApi.createDrop(body);
      onNotice?.(editingId ? "Drop atualizado." : "Drop agendado.");
      reset();
      await onChanged();
    } catch (error) {
      onError?.(error instanceof Error ? error.message : "Não foi possível salvar o drop.");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: string) => {
    if (!window.confirm("Excluir este drop?")) return;
    setBusy(true);
    try {
      await studioApi.deleteDrop(id);
      if (editingId === id) reset();
      onNotice?.("Drop removido.");
      await onChanged();
    } catch (error) {
      onError?.(error instanceof Error ? error.message : "Não foi possível excluir o drop.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="drop-control-layout">
      <form className="control-form glass-panel" onSubmit={save}>
        <div className="form-heading">
          <div>
            <span className="section-eyebrow">DROPS + PROMOÇÕES</span>
            <h2>{editingId ? "Editar campanha" : "Agendar novo drop"}</h2>
            <p>Defina o período uma vez. Site, preço promocional, Kiki e anúncio do Discord acompanham automaticamente.</p>
          </div>
          {editingId && <button type="button" className="btn btn-outline compact" onClick={reset}>Cancelar edição</button>}
        </div>

        <div className="form-grid">
          <label>Título
            <input required value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} placeholder="Ex.: Drop Neon Weekend" />
          </label>
          <label>Produto
            <select required value={draft.productId} onChange={(event) => setDraft({ ...draft, productId: event.target.value })}>
              <option value="">Selecione um produto</option>
              {products.map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}
            </select>
          </label>
          <label>Desconto do drop (%)
            <input type="number" min={0} max={100} step={1} value={draft.discountPercent} onChange={(event) => setDraft({ ...draft, discountPercent: Number(event.target.value) || 0 })} />
          </label>
          <label>Canal do Discord
            <select value={draft.channelId} onChange={(event) => setDraft({ ...draft, channelId: event.target.value })}>
              <option value="">Sem anúncio no Discord</option>
              {channels.map((channel) => <option key={channel.id} value={channel.id}>#{channel.name}</option>)}
            </select>
          </label>
          <label>Começa em
            <input required type="datetime-local" value={draft.startsAt} onChange={(event) => setDraft({ ...draft, startsAt: event.target.value })} />
          </label>
          <label>Termina em
            <input required type="datetime-local" value={draft.endsAt} onChange={(event) => setDraft({ ...draft, endsAt: event.target.value })} />
          </label>
          <label className="span-2">Descrição
            <textarea rows={4} value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} placeholder="O que torna esse drop especial?" />
          </label>
          <div className="check-row span-2">
            <label><input type="checkbox" checked={draft.published} onChange={(event) => setDraft({ ...draft, published: event.target.checked })} /> Exibir no site</label>
            <label><input type="checkbox" checked={draft.announceDiscord} disabled={!draft.channelId} onChange={(event) => setDraft({ ...draft, announceDiscord: event.target.checked })} /> Anunciar automaticamente no início</label>
          </div>
        </div>

        {selectedProduct && (
          <div className="drop-preview-inline">
            <span>PRÉVIA DA OFERTA</span>
            <strong>{draft.title || selectedProduct.name}</strong>
            <small>{selectedProduct.name}{draft.discountPercent ? ` · ${draft.discountPercent}% OFF` : ""}</small>
          </div>
        )}

        <button className="btn btn-primary" type="submit" disabled={busy}>
          {busy ? "Salvando..." : editingId ? "Salvar alterações" : "Agendar drop"}
        </button>
      </form>

      <section className="control-list glass-panel">
        <div className="form-heading">
          <div>
            <span className="section-eyebrow">CRONOGRAMA</span>
            <h2>Campanhas programadas</h2>
          </div>
        </div>

        <div className="drop-list">
          {drops.length ? drops.map((drop) => {
            const product = products.find((item) => item.id === drop.productId);
            const status = drop.status || "scheduled";
            return (
              <article className={`drop-row drop-status-${status}`} key={drop.id}>
                <div className="drop-row-status"><i /><span>{statusLabel[status] || status}</span></div>
                <div className="drop-row-copy">
                  <strong>{drop.title}</strong>
                  <span>{product?.name || "Produto removido"} · {drop.discountPercent ? `${drop.discountPercent}% OFF` : "sem desconto"}</span>
                  <small>
                    {new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(drop.startsAt))}
                    {" → "}
                    {new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(drop.endsAt))}
                  </small>
                </div>
                <div className="control-row-actions">
                  <button type="button" onClick={() => { setEditingId(drop.id); setDraft(toDraft(drop)); window.scrollTo({ top: 0, behavior: "smooth" }); }}>Editar</button>
                  <button className="danger" type="button" onClick={() => void remove(drop.id)}>Excluir</button>
                </div>
              </article>
            );
          }) : <p className="muted">Nenhum drop programado ainda.</p>}
        </div>
      </section>
    </div>
  );
}
