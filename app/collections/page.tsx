"use client";

import StudioShell from "@/components/studio-shell";
import { useStudio } from "@/components/studio-provider";

export default function CollectionsPage() {
  const { state } = useStudio();
  const collections = state.commerce?.collections || [];
  return (
    <StudioShell eyebrow="COLEÇÕES" title="Studio K Collections">
      <div className="section-heading">
        <div>
          <span className="section-eyebrow">CURADORIA STUDIO K</span>
          <h1 className="page-title">Coleções</h1>
          <p className="page-subtitle">Universos visuais que agrupam produtos e projetos do Studio K.</p>
        </div>
      </div>
      <div className="collection-grid">
        {collections.length ? collections.map((collection) => (
          <a className="collection-card glass-panel" href={`/collections/${collection.slug}`} key={collection.id}>
            <div className="collection-cover">
              {collection.coverUrl ? <img src={collection.coverUrl} alt="" loading="lazy" decoding="async" /> : <span>SK</span>}
            </div>
            <div>
              <span>{collection.productIds.length} produtos · {collection.itemIds.length} projetos</span>
              <strong>{collection.name}</strong>
              <p>{collection.description}</p>
            </div>
          </a>
        )) : <div className="empty-state glass-panel"><strong>Nenhuma coleção ativa.</strong><span>As coleções publicadas pela Central aparecerão aqui.</span></div>}
      </div>
    </StudioShell>
  );
}
