"use client";

import { useMemo, useState } from "react";
import StudioShell from "@/components/studio-shell";
import ShowcaseCard from "@/components/showcase-card";
import ModelStage from "@/components/model-stage";
import Icon from "@/components/icons";
import { useStudio } from "@/components/studio-provider";
import type { StudioItem } from "@/lib/studio-types";

export default function PortfolioPage() {
  const { state } = useStudio();
  const [filter, setFilter] = useState("Todos");
  const [selected, setSelected] = useState<StudioItem | null>(null);

  const categories = useMemo(() => {
    const found = Array.from(new Set(state.items.map((item) => item.category).filter(Boolean)));
    return ["Todos", ...found];
  }, [state.items]);

  const visible = filter === "Todos"
    ? state.items
    : state.items.filter((item) => item.category === filter || item.tags?.includes(filter));

  return (
    <StudioShell eyebrow="PORTFÓLIO" title="Arquivo Studio K">
      <div className="section-heading">
        <div>
          <span className="section-eyebrow">SEM PREÇOS · APENAS EXPOSIÇÃO</span>
          <h1 className="page-title">Portfólio</h1>
          <p className="page-subtitle">Projetos, roupas, materiais e experiências 3D publicados pela Central de Controle.</p>
        </div>
      </div>

      <div className="filter-row">
        {categories.map((category) => (
          <button
            type="button"
            className={filter === category ? "filter-chip active" : "filter-chip"}
            key={category}
            onClick={() => setFilter(category)}
          >
            {category}
          </button>
        ))}
      </div>

      {selected && (
        <section className="project-focus glass-panel">
          <div>
            <span className="section-eyebrow">{selected.category}</span>
            <h2>{selected.name}</h2>
            <p>{selected.description}</p>
            <div className="tag-row">{selected.tags?.map((tag) => <span key={tag}>{tag}</span>)}</div>
            <div className="hero-actions">
              <a className="btn btn-primary compact" href={`/portfolio/${selected.id}`}>Abrir projeto <Icon name="arrow" /></a>
              <button type="button" className="btn btn-outline compact" onClick={() => setSelected(null)}>Fechar prévia</button>
            </div>
          </div>
          <ModelStage modelUrl={selected.modelUrl} posterUrl={selected.coverUrl || selected.gifUrl} title={selected.name} compact />
        </section>
      )}

      <div className="showcase-grid">
        {visible.length ? visible.map((item) => (
          <div key={item.id} onClick={() => setSelected(item)} role="button" tabIndex={0} onKeyDown={(event) => { if (event.key === "Enter") setSelected(item); }}>
            <ShowcaseCard
              eyebrow={item.category || "STUDIO K"}
              title={item.name}
              copy={item.description}
              meta={(item.tags || []).join(" · ")}
              coverUrl={item.coverUrl || item.gifUrl}
              modelUrl={item.modelUrl}
              href={`/portfolio/${item.id}`}
              favoriteKind="items"
              favoriteId={item.id}
            />
          </div>
        )) : (
          <div className="empty-state glass-panel">
            <strong>Nenhum projeto publicado nesta categoria.</strong>
            <span>Novos trabalhos aparecerão aqui assim que forem publicados pela Central.</span>
          </div>
        )}
      </div>
    </StudioShell>
  );
}
