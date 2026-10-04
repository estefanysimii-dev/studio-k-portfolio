"use client";

import { useMemo, useState } from "react";
import type { StudioAnalytics } from "@/lib/studio-types";

const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const number = new Intl.NumberFormat("pt-BR");
const duration = (seconds: number) => seconds < 60 ? `${seconds}s` : `${Math.floor(seconds / 60)}m ${seconds % 60}s`;

function RankedList({ title, subtitle, rows }: { title: string; subtitle: string; rows: { label: string; value: number }[] }) {
  return (
    <div className="analytics-ranked-panel">
      <div className="analytics-subhead"><strong>{title}</strong><span>{subtitle}</span></div>
      {rows.length ? rows.slice(0, 8).map((row, index) => (
        <div className="analytics-ranked-row" key={row.label}>
          <b>{String(index + 1).padStart(2, "0")}</b>
          <span title={row.label}>{row.label}</span>
          <strong>{number.format(row.value)}</strong>
        </div>
      )) : <p className="muted">Ainda não há dados suficientes.</p>}
    </div>
  );
}

export default function AnalyticsDashboard({ data }: { data?: StudioAnalytics }) {
  const paths = useMemo(() => Array.from(new Set((data?.clickPoints || []).map((point) => point.path))), [data?.clickPoints]);
  const [heatmapPath, setHeatmapPath] = useState("");
  const selectedPath = heatmapPath || paths[0] || "";
  const heatmapPoints = (data?.clickPoints || []).filter((point) => !selectedPath || point.path === selectedPath);
  if (!data) {
    return (
      <section className="analytics-dashboard glass-panel">
        <span className="section-eyebrow">COMPORTAMENTO</span>
        <h2>Analytics Studio K</h2>
        <p className="muted">Os dados começarão a aparecer conforme as pessoas navegarem pelo site.</p>
      </section>
    );
  }

  const maxDaily = Math.max(1, ...data.daily.map((day) => day.pageViews));
  const funnel = [
    { label: "Visualizações de produtos", value: data.productViews, base: data.productViews || 1 },
    { label: "Inícios de compra", value: data.checkoutStarts, base: data.productViews || 1 },
    { label: "Pedidos criados", value: data.ordersCreated, base: data.productViews || 1 },
    { label: "Pedidos pagos", value: data.paidOrders, base: data.productViews || 1 }
  ];

  return (
    <section className="analytics-dashboard glass-panel">
      <div className="analytics-head">
        <div>
          <span className="section-eyebrow">COMPORTAMENTO 2.0 · ÚLTIMOS {data.days} DIAS</span>
          <h2>O que as pessoas realmente fazem no Studio K</h2>
          <p>Origem, permanência, buscas, cliques, scroll, conversão e pontos de saída em um único painel.</p>
        </div>
        <div className="analytics-revenue">
          <small>Receita confirmada</small>
          <strong>{money.format(data.revenue / 100)}</strong>
        </div>
      </div>

      <div className="analytics-metrics analytics-metrics-extended">
        <article><span>Visitas</span><strong>{number.format(data.pageViews)}</strong><small>{number.format(data.uniqueVisitors)} visitantes únicos</small></article>
        <article><span>Retornaram</span><strong>{number.format(data.returningVisitors)}</strong><small>voltaram em outro dia</small></article>
        <article><span>Tempo médio</span><strong>{duration(data.avgPageSeconds)}</strong><small>por página registrada</small></article>
        <article><span>Scroll médio</span><strong>{data.avgScrollDepth}%</strong><small>profundidade da página</small></article>
        <article><span>Produtos vistos</span><strong>{number.format(data.productViews)}</strong><small>{data.viewToOrder}% viraram pedido</small></article>
        <article><span>Favoritados</span><strong>{number.format(data.favoriteAdds)}</strong><small>ações de favorito</small></article>
        <article><span>Conversão</span><strong>{data.checkoutConversion}%</strong><small>início de compra → pago</small></article>
        <article><span>Erros checkout</span><strong>{number.format(data.checkoutErrors)}</strong><small>{number.format(data.checkoutStarts)} compras iniciadas</small></article>
      </div>

      <div className="analytics-panels">
        <div className="analytics-funnel">
          <div className="analytics-subhead"><strong>Funil de compra</strong><span>{data.checkoutAbandonment}% de abandono</span></div>
          {funnel.map((item, index) => {
            const width = index === 0 ? 100 : Math.max(4, Math.min(100, item.value / item.base * 100));
            return (
              <div className="analytics-funnel-row" key={item.label}>
                <div><span>{item.label}</span><strong>{number.format(item.value)}</strong></div>
                <div className="analytics-funnel-bar"><i style={{ width: `${width}%` }} /></div>
              </div>
            );
          })}
        </div>

        <div className="analytics-top-products">
          <div className="analytics-subhead"><strong>Produtos mais observados</strong><span>Views · Tempo · Favoritos · Pedidos</span></div>
          {data.topProducts.length ? data.topProducts.slice(0, 8).map((product, index) => (
            <div className="analytics-product-row" key={product.id}>
              <b>{String(index + 1).padStart(2, "0")}</b>
              <div>
                <strong>{product.name}</strong>
                <span>{product.views} views · média {duration(product.avgDwellSeconds)} · {product.favorites} favoritos · {product.checkouts} checkouts</span>
              </div>
              <em>{product.orders}</em>
            </div>
          )) : <p className="muted">Ainda não há visualizações de produtos suficientes.</p>}
        </div>
      </div>

      <div className="analytics-ranked-grid">
        <RankedList title="Origens" subtitle="de onde chegaram" rows={data.topSources || []} />
        <RankedList title="Buscas" subtitle={data.searches + " buscas"} rows={data.topSearches || []} />
        <RankedList title="Cliques" subtitle={data.clicks + " interações"} rows={data.topClicks || []} />
        <RankedList title="Páginas de saída" subtitle="onde encerraram" rows={data.exitPages || []} />
      </div>

      <div className="analytics-heatmap">
        <div className="analytics-subhead">
          <strong>Mapa de cliques</strong>
          <label>
            <span>Página</span>
            <select value={selectedPath} onChange={(event) => setHeatmapPath(event.target.value)}>
              {paths.map((path) => <option value={path} key={path}>{path}</option>)}
            </select>
          </label>
        </div>
        <div className="click-heatmap-canvas">
          <div className="heatmap-browser-bar"><i /><i /><i /><span>{selectedPath || "Sem dados"}</span></div>
          <div className="heatmap-surface">
            {heatmapPoints.slice(0, 400).map((point, index) => (
              <i
                key={`${point.created}-${index}`}
                className="heatmap-point"
                style={{ left: `${point.x}%`, top: `${point.y}%` }}
                title={point.label}
              />
            ))}
            {!heatmapPoints.length && <span className="heatmap-empty">Os cliques começarão a aparecer aqui conforme o site for usado.</span>}
          </div>
        </div>
        <small className="analytics-heatmap-note">As posições são normalizadas pelo tamanho da tela do visitante e não registram conteúdo digitado.</small>
      </div>

      <div className="analytics-daily">
        <div className="analytics-subhead"><strong>Tráfego diário</strong><span>Visualizações de página</span></div>
        <div className="analytics-chart" aria-label="Visualizações por dia">
          {data.daily.slice(-14).map((day) => (
            <div className="analytics-day" key={day.day} title={day.day + ": " + day.pageViews + " visualizações"}>
              <div className="analytics-day-bar"><i style={{ height: `${Math.max(5, day.pageViews / maxDaily * 100)}%` }} /></div>
              <small>{day.day.slice(5).replace("-", "/")}</small>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
