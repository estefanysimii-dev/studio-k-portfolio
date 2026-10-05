"use client";

import { useEffect, useMemo, useState } from "react";
import { studioApi } from "@/lib/studio-api";
import { useStudio } from "./studio-provider";
import type { StudioProduct, StudioRecommendation } from "@/lib/studio-types";

const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export default function ProductRecommendations({ productId, title = "Você também pode gostar" }: { productId: string; title?: string }) {
  const { state } = useStudio();
  const [items, setItems] = useState<StudioRecommendation[]>([]);

  useEffect(() => {
    void studioApi.recommendations(productId).then((result) => setItems(result.recommendations)).catch(() => setItems([]));
  }, [productId]);

  const products = useMemo(
    () => items.map((entry) => ({ entry, product: state.products.find((product) => product.id === entry.productId) })).filter((x): x is { entry: StudioRecommendation; product: StudioProduct } => Boolean(x.product)),
    [items, state.products]
  );

  if (!products.length) return null;

  return (
    <section className="recommendation-section">
      <div className="section-heading compact-heading">
        <div>
          <span className="section-eyebrow">RECOMENDADO PARA VOCÊ</span>
          <h2>{title}</h2>
        </div>
      </div>
      <div className="recommendation-grid">
        {products.slice(0, 4).map(({ entry, product }) => (
          <a className="recommendation-card glass-panel" href={`/products/${product.id}`} key={product.id}>
            <div className="recommendation-thumb">
              {product.coverUrl || product.gifUrl ? <img src={product.coverUrl || product.gifUrl} alt="" loading="lazy" decoding="async" /> : <span>SK</span>}
            </div>
            <div>
              <span>{entry.reason}</span>
              <strong>{product.name}</strong>
              <small>{product.priceCents > 0 ? money.format(product.priceCents / 100) : "Sob consulta"}</small>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}
