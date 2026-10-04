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
  const [category, setCategory] = useState("Todos");
  const [gender, setGender] = useState("Todos");
  const [collectionId, setCollectionId] = useState("");
  const [onlyNeon, setOnlyNeon] = useState(false);
  const [onlyAvailable, setOnlyAvailable] = useState(false);
  const [sort, setSort] = useState("relevance");
  const now = Date.now();
  const activeDrops = (state.drops || []).filter((drop) =>
    drop.published !== false &&
    Date.parse(drop.startsAt) <= now &&
    Date.parse(drop.endsAt) > now
  );

  const categories = useMemo(() => ["Todos", ...Array.from(new Set(state.products.map((product) => product.category).filter(Boolean)))], [state.products]);
  const collections = state.commerce?.collections || [];
  const recommendationScores = new Map((state.personal?.recommendations || []).map((entry) => [entry.productId, entry.score]));

  const visibleProducts = useMemo(() => {
    const query = search.trim().toLowerCase();
    const selectedCollection = collections.find((entry) => entry.id === collectionId);
    const filtered = state.products.filter((product) => {
      if (query && ![product.name, product.description, product.category, ...(product.tags || [])].join(" ").toLowerCase().includes(query)) return false;
      if (category !== "Todos" && product.category !== category) return false;
      if (gender !== "Todos" && (product.gender || "unisex") !== gender) return false;
      if (onlyNeon && !product.neon && !(product.tags || []).some((tag) => /neon|emissiv/i.test(tag))) return false;
      if (onlyAvailable && product.available === false) return false;
      if (selectedCollection && !selectedCollection.productIds.includes(product.id)) return false;
      return true;
    });
    return [...filtered].sort((a, b) => {
      if (sort === "price-asc") return a.priceCents - b.priceCents;
      if (sort === "price-desc") return b.priceCents - a.priceCents;
      if (sort === "newest") return Date.parse(b.created || b.updated || "") - Date.parse(a.created || a.updated || "");
      if (sort === "best-selling") return Number(b.soldCount || 0) - Number(a.soldCount || 0);
      if (sort === "popular") return (recommendationScores.get(b.id) || 0) - (recommendationScores.get(a.id) || 0);
      return 0;
    });
  }, [search, state.products, category, gender, onlyNeon, onlyAvailable, collectionId, collections, sort, recommendationScores]);

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

      <div className="catalog-filters glass-panel">
        <label>Categoria
          <select value={category} onChange={(event) => setCategory(event.target.value)}>
            {categories.map((entry) => <option value={entry} key={entry}>{entry}</option>)}
          </select>
        </label>
        <label>Modelo
          <select value={gender} onChange={(event) => setGender(event.target.value)}>
            <option value="Todos">Todos</option>
            <option value="feminino">Feminino</option>
            <option value="masculino">Masculino</option>
            <option value="unisex">Unissex</option>
          </select>
        </label>
        <label>Coleção
          <select value={collectionId} onChange={(event) => setCollectionId(event.target.value)}>
            <option value="">Todas</option>
            {collections.map((entry) => <option value={entry.id} key={entry.id}>{entry.name}</option>)}
          </select>
        </label>
        <label>Ordenar
          <select value={sort} onChange={(event) => setSort(event.target.value)}>
            <option value="relevance">Relevância</option>
            <option value="popular">Popularidade</option>
            <option value="newest">Novidades</option>
            <option value="best-selling">Mais vendidos</option>
            <option value="price-asc">Menor preço</option>
            <option value="price-desc">Maior preço</option>
          </select>
        </label>
        <label className="catalog-filter-check"><input type="checkbox" checked={onlyNeon} onChange={(event) => setOnlyNeon(event.target.checked)} /> Neon / emissivo</label>
        <label className="catalog-filter-check"><input type="checkbox" checked={onlyAvailable} onChange={(event) => setOnlyAvailable(event.target.checked)} /> Disponível agora</label>
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
                  {product.stockMode && product.stockMode !== "unlimited" && (
                    <span className={`product-stock-badge ${product.available === false ? "sold-out" : ""}`}>
                      {product.available === false ? "ESGOTADO" : product.remaining != null ? `${product.remaining} restante(s)` : product.limitedLabel || "LIMITADO"}
                    </span>
                  )}
                  {drop && drop.discountPercent > 0 && <span className="product-drop-badge">DROP · {drop.discountPercent}% OFF</span>}
                  {drop && drop.discountPercent > 0 && <small>{money.format(product.priceCents / 100)}</small>}
                  <strong>{product.priceCents > 0 ? money.format(dropPrice / 100) : "Sob consulta"}</strong>
                </div>
              );
            })()}
            <div className="product-card-actions">
              <a className="btn btn-primary" href={`/products/${product.id}`}>
                Ver produto <Icon name="arrow" />
              </a>
              <a className="btn btn-outline compact" href={`/compare?a=${product.id}`}>Comparar</a>
            </div>
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
