"use client";

import { useParams } from "next/navigation";
import StudioShell from "@/components/studio-shell";
import { useStudio } from "@/components/studio-provider";

const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export default function CollectionDetailPage() {
  const { state } = useStudio();
  const params = useParams<{ slug: string }>();
  const collection = (state.commerce?.collections || []).find((entry) => entry.slug === params.slug);
  if (!collection) {
    return <StudioShell eyebrow="COLEÇÕES" title="Studio K"><div className="empty-state glass-panel"><strong>Coleção não encontrada.</strong><a href="/collections">Ver coleções</a></div></StudioShell>;
  }
  const products = state.products.filter((product) => collection.productIds.includes(product.id));
  const items = state.items.filter((item) => collection.itemIds.includes(item.id));
  return (
    <StudioShell eyebrow="COLEÇÕES" title={collection.name}>
      <section className="collection-hero glass-panel">
        {collection.coverUrl && <img src={collection.coverUrl} alt="" />}
        <div>
          <span className="section-eyebrow">STUDIO K COLLECTION</span>
          <h1>{collection.name}</h1>
          <p>{collection.description}</p>
          <small>{products.length} produtos · {items.length} projetos</small>
        </div>
      </section>

      {!!products.length && <section className="section-block">
        <div className="section-heading compact-heading"><div><span className="section-eyebrow">PRODUTOS</span><h2>Compre a coleção</h2></div></div>
        <div className="recommendation-grid">
          {products.map((product) => (
            <a className="recommendation-card glass-panel" href={`/products/${product.id}`} key={product.id}>
              <div className="recommendation-thumb">{product.coverUrl || product.gifUrl ? <img src={product.coverUrl || product.gifUrl} alt="" /> : <span>SK</span>}</div>
              <div><span>{product.category}</span><strong>{product.name}</strong><small>{product.priceCents ? money.format(product.priceCents / 100) : "Sob consulta"}</small></div>
            </a>
          ))}
        </div>
      </section>}

      {!!items.length && <section className="section-block">
        <div className="section-heading compact-heading"><div><span className="section-eyebrow">PORTFÓLIO</span><h2>Projetos relacionados</h2></div></div>
        <div className="recommendation-grid">
          {items.map((item) => (
            <a className="recommendation-card glass-panel" href={`/portfolio/${item.id}`} key={item.id}>
              <div className="recommendation-thumb">{item.coverUrl || item.gifUrl ? <img src={item.coverUrl || item.gifUrl} alt="" /> : <span>SK</span>}</div>
              <div><span>{item.category}</span><strong>{item.name}</strong><small>{(item.tags || []).join(" · ")}</small></div>
            </a>
          ))}
        </div>
      </section>}
    </StudioShell>
  );
}
