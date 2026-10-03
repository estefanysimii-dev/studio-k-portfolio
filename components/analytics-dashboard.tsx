"use client";

import type { StudioAnalytics } from "@/lib/studio-types";

const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const number = new Intl.NumberFormat("pt-BR");

export default function AnalyticsDashboard({ data }: { data?: StudioAnalytics }) {
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
          <span className="section-eyebrow">COMPORTAMENTO · ÚLTIMOS {data.days} DIAS</span>
          <h2>O que as pessoas fazem no Studio K</h2>
          <p>Visualizações, favoritos e conversão reunidos no mesmo funil.</p>
        </div>
        <div className="analytics-revenue">
          <small>Receita confirmada</small>
          <strong>{money.format(data.revenue / 100)}</strong>
        </div>
      </div>

      <div className="analytics-metrics">
        <article><span>Visitas</span><strong>{number.format(data.pageViews)}</strong><small>{number.format(data.uniqueVisitors)} visitantes únicos</small></article>
        <article><span>Produtos vistos</span><strong>{number.format(data.productViews)}</strong><small>{data.viewToOrder}% viraram pedido</small></article>
        <article><span>Favoritados</span><strong>{number.format(data.favoriteAdds)}</strong><small>ações de favorito</small></article>
        <article><span>Conversão</span><strong>{data.checkoutConversion}%</strong><small>início de compra → pago</small></article>
        <article><span>Abandono</span><strong>{data.checkoutAbandonment}%</strong><small>iniciou, mas não criou pedido</small></article>
        <article><span>Pedidos pagos</span><strong>{number.format(data.paidOrders)}</strong><small>{number.format(data.ordersCreated)} pedidos criados</small></article>
      </div>

      <div className="analytics-panels">
        <div className="analytics-funnel">
          <div className="analytics-subhead"><strong>Funil de compra</strong><span>30 dias</span></div>
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
          <div className="analytics-subhead"><strong>Produtos mais observados</strong><span>Views · Favoritos · Pedidos</span></div>
          {data.topProducts.length ? data.topProducts.slice(0, 8).map((product, index) => (
            <div className="analytics-product-row" key={product.id}>
              <b>{String(index + 1).padStart(2, "0")}</b>
              <div><strong>{product.name}</strong><span>{product.views} views · {product.favorites} favoritos · {product.checkouts} compras iniciadas</span></div>
              <em>{product.orders}</em>
            </div>
          )) : <p className="muted">Ainda não há visualizações de produtos suficientes.</p>}
        </div>
      </div>

      <div className="analytics-daily">
        <div className="analytics-subhead"><strong>Tráfego diário</strong><span>Visualizações de página</span></div>
        <div className="analytics-chart" aria-label="Visualizações por dia">
          {data.daily.slice(-14).map((day) => (
            <div className="analytics-day" key={day.day} title={`${day.day}: ${day.pageViews} visualizações`}>
              <div className="analytics-day-bar"><i style={{ height: `${Math.max(5, day.pageViews / maxDaily * 100)}%` }} /></div>
              <small>{day.day.slice(5).replace("-", "/")}</small>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
