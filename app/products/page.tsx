"use client";

import { useEffect, useMemo, useState } from "react";
import StudioShell from "@/components/studio-shell";
import Icon from "@/components/icons";
import { useStudio } from "@/components/studio-provider";
import FavoriteButton from "@/components/favorite-button";
import { studioApi } from "@/lib/studio-api";

const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export default function ProductsPage() {
  const { state } = useStudio();
  const [search, setSearch] = useState("");
  const now = Date.now();
  const activeDrops = (state.drops || []).filter((drop) =>
    drop.published !== false &&
    Date.parse(drop.startsAt) <= now &&
    Date.parse(drop.endsAt) > now
  );

  const visibleProducts = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return state.products;
    return state.products.filter((product) =>
      [product.name, product.description, product.category, ...(product.tags || [])]
        .join(" ")
        .toLowerCase()
        .includes(query)
    );
  }, [search, state.products]);

  useEffect(() => {
    const query = search.trim();
    if (query.length < 2) return;
    const timer = window.setTimeout(() => {
      let sessionId = `search-${Date.now()}`;
      try { sessionId = localStorage.getItem("studio-k-visitor-id") || sessionId; } catch {}
      void studioApi.track({
        sessionId,
        event: "search",
        itemKind: "page",
        path: "/products",
        meta: { query: query.slice(0, 80), results: visibleProducts.length }
      });
    }, 600);
    return () => window.clearTimeout(timer);
  }, [search, visibleProducts.length]);

  return (
    <StudioShell eyebrow="PRODUTOS" title="Studio K Store">
      <div className="section-heading">
        <div>
          <span className="section-eyebrow">CATÁLOGO STUDIO K</span>
          <h1 className="page-title">Produtos</h1>
          <p className="page-subtitle">Produtos com preço, galeria multimídia, vídeo, GIF e visualização 3D quando disponível.</p>
        </div>
      </div>

      <div className="catalog-search glass-panel">
        <label>
          <span>Buscar no Studio K</span>
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Nome, categoria, tag ou estilo..."
          />
        </label>
        <small>{visibleProducts.length} produto{visibleProducts.length === 1 ? "" : "s"} encontrado{visibleProducts.length === 1 ? "" : "s"}</small>
      </div>

      <div className="product-grid">
        {visibleProducts.length ? visibleProducts.map((product) => (
          <article className="product-card glass-panel" key={product.id}>
            <a className="product-thumb" href={`/products/${product.id}`}>
              {product.coverUrl || product.gifUrl
                ? <img src={product.coverUrl || product.gifUrl} alt={product.name} loading="lazy" />
                : <Icon name="cube" />}
              <div className="media-badges">
                {product.modelUrl && <span className="media-badge">3D</span>}
                {product.videoUrl && <span className="media-badge secondary">VÍDEO</span>}
                {product.gifUrl && <span className="media-badge secondary">GIF</span>}
              </div>
            </a>
            <FavoriteButton kind="products" itemId={product.id} className="favorite-card-button" />
            <span className="meta-line">{product.category || "STUDIO K"}</span>
            <h3><a href={`/products/${product.id}`}>{product.name}</a></h3>
            <p className="product-description">{product.description}</p>
            {(() => {
              const drop = activeDrops.find((entry) => entry.productId === product.id);
              const dropPrice = drop && drop.discountPercent > 0
                ? Math.max(0, Math.floor(product.priceCents * (100 - drop.discountPercent) / 100))
                : product.priceCents;
              return (
                <div className="product-price-stack">
                  {drop && drop.discountPercent > 0 && <span className="product-drop-badge">DROP · {drop.discountPercent}% OFF</span>}
                  {drop && drop.discountPercent > 0 && <small>{money.format(product.priceCents / 100)}</small>}
                  <strong>{product.priceCents > 0 ? money.format(dropPrice / 100) : "Sob consulta"}</strong>
                </div>
              );
            })()}
            <a className="btn btn-primary" href={`/products/${product.id}`}>
              Ver produto <Icon name="arrow" />
            </a>
          </article>
        )) : (
          <div className="empty-state glass-panel">
            <strong>{search.trim() ? "Nenhum produto combina com essa busca." : "Catálogo sendo preparado."}</strong>
            <span>{search.trim() ? "Tente outro nome, categoria ou tag." : "Os produtos cadastrados pela Central de Controle aparecerão aqui automaticamente."}</span>
          </div>
        )}
      </div>
    </StudioShell>
  );
}
