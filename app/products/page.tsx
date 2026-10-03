"use client";

import StudioShell from "@/components/studio-shell";
import Icon from "@/components/icons";
import ModelStage from "@/components/model-stage";
import { useStudio } from "@/components/studio-provider";

const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export default function ProductsPage() {
  const { state } = useStudio();

  return (
    <StudioShell eyebrow="PRODUTOS" title="Studio K Store">
      <div className="section-heading">
        <div>
          <span className="section-eyebrow">CATÁLOGO STUDIO K</span>
          <h1 className="page-title">Produtos</h1>
          <p className="page-subtitle">Imagem, vídeo, GIF e visualização 3D são carregados pela mesma Central que administra o portfólio.</p>
        </div>
      </div>

      <div className="product-grid">
        {state.products.length ? state.products.map((product) => (
          <article className="product-card glass-panel" key={product.id}>
            <div className="product-thumb">
              {product.coverUrl ? <img src={product.coverUrl} alt={product.name} loading="lazy" /> : <Icon name="cube" />}
              {product.modelUrl && <span className="media-badge">3D</span>}
            </div>
            <span className="meta-line">{product.category || "STUDIO K"}</span>
            <h3>{product.name}</h3>
            <p className="product-description">{product.description}</p>
            <strong>{product.priceCents > 0 ? money.format(product.priceCents / 100) : "Sob consulta"}</strong>
            {product.modelUrl && <ModelStage modelUrl={product.modelUrl} posterUrl={product.coverUrl} title={product.name} compact />}
            <a className="btn btn-primary" href={state.site.discordInviteUrl || "/discord"}>
              Solicitar no Discord <Icon name="arrow" />
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
