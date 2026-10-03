"use client";

import StudioShell from "@/components/studio-shell";
import Icon from "@/components/icons";
import { useStudio } from "@/components/studio-provider";
import FavoriteButton from "@/components/favorite-button";

const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export default function ProductsPage() {
  const { state } = useStudio();
  const now = Date.now();
  const activeDrops = (state.drops || []).filter((drop) =>
    drop.published !== false &&
    Date.parse(drop.startsAt) <= now &&
    Date.parse(drop.endsAt) > now
  );

  return (
    <StudioShell eyebrow="PRODUTOS" title="Studio K Store">
      <div className="section-heading">
        <div>
          <span className="section-eyebrow">CATÁLOGO STUDIO K</span>
          <h1 className="page-title">Produtos</h1>
          <p className="page-subtitle">Produtos com preço, galeria multimídia, vídeo, GIF e visualização 3D quando disponível.</p>
        </div>
      </div>

      <div className="product-grid">
        {state.products.length ? state.products.map((product) => (
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
              <FavoriteButton kind="products" itemId={product.id} className="favorite-card-button" />
            </a>
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
            <strong>Catálogo sendo preparado.</strong>
            <span>Os produtos cadastrados pela Central de Controle aparecerão aqui automaticamente.</span>
          </div>
        )}
      </div>
    </StudioShell>
  );
}
