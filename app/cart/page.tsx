"use client";

import { useEffect, useMemo, useState } from "react";
import StudioShell from "@/components/studio-shell";
import { useStudio } from "@/components/studio-provider";
import { studioApi } from "@/lib/studio-api";
import type { StudioCartItem, StudioCartQuote } from "@/lib/studio-types";

const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export default function CartPage() {
  const { state, refresh } = useStudio();
  const [items, setItems] = useState<StudioCartItem[]>(state.personal?.cart || []);
  const [quote, setQuote] = useState<StudioCartQuote | null>(null);
  const [coupon, setCoupon] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [checkout, setCheckout] = useState<{ groupId: string; orderIds: string[]; total: number; payment: { pixKey: string; recipient: string; instructions: string } } | null>(null);

  useEffect(() => setItems(state.personal?.cart || []), [state.personal?.cart]);

  const products = useMemo(
    () => items.map((item) => ({ item, product: state.products.find((product) => product.id === item.productId) })).filter((entry) => entry.product),
    [items, state.products]
  );

  const sync = async (nextItems = items, nextCoupon = coupon) => {
    setBusy(true);
    setError("");
    try {
      const result = await studioApi.saveCart(nextItems, nextCoupon);
      setItems(result.cart);
      setQuote(result.quote);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível atualizar o carrinho.");
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    if (!state.me.authenticated) return;
    void studioApi.myCart().then((result) => {
      setItems(result.cart);
      setQuote(result.quote);
    }).catch(() => undefined);
  }, [state.me.authenticated]);

  const updateQuantity = (productId: string, quantity: number) => {
    const next = items
      .map((item) => item.productId === productId ? { ...item, quantity: Math.max(1, Math.min(20, quantity)) } : item);
    setItems(next);
    void sync(next);
  };

  const remove = (productId: string) => {
    const next = items.filter((item) => item.productId !== productId);
    setItems(next);
    void sync(next);
  };

  const checkoutCart = async () => {
    setBusy(true);
    setError("");
    try {
      const result = await studioApi.checkoutCart(coupon);
      setCheckout({ groupId: result.groupId, orderIds: result.orderIds, total: result.total, payment: result.payment });
      setItems([]);
      setQuote(result.quote);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível finalizar o carrinho.");
    } finally {
      setBusy(false);
    }
  };

  if (!state.me.authenticated) {
    return (
      <StudioShell eyebrow="CARRINHO" title="Studio K Store">
        <section className="account-login glass-panel">
          <span className="section-eyebrow">STUDIO K ID</span>
          <h1>Conecte sua conta para usar o carrinho.</h1>
          <p>O carrinho, combos e benefícios ficam ligados ao seu Studio K ID.</p>
          <a className="btn btn-primary" href="/api/oauth/start?next=/cart">Conectar Discord</a>
        </section>
      </StudioShell>
    );
  }

  return (
    <StudioShell eyebrow="CARRINHO" title="Minha sacola">
      <div className="section-heading">
        <div>
          <span className="section-eyebrow">STUDIO K STORE</span>
          <h1 className="page-title">Carrinho</h1>
          <p className="page-subtitle">Combos, benefícios do Discord e cupons são recalculados automaticamente.</p>
        </div>
      </div>

      <section className="cart-layout">
        <div className="cart-items glass-panel">
          {products.length ? products.map(({ item, product }) => product && (
            <article className="cart-row" key={item.productId}>
              <a href={`/products/${product.id}`} className="cart-thumb">
                {product.coverUrl || product.gifUrl ? <img src={product.coverUrl || product.gifUrl} alt="" /> : <span>SK</span>}
              </a>
              <div className="cart-copy">
                <span>{product.category || "Studio K"}</span>
                <strong>{product.name}</strong>
                <small>{money.format(product.priceCents / 100)} por unidade</small>
              </div>
              <div className="cart-quantity">
                <button type="button" onClick={() => updateQuantity(product.id, item.quantity - 1)} disabled={busy || item.quantity <= 1}>−</button>
                <input type="number" min={1} max={20} value={item.quantity} onChange={(event) => updateQuantity(product.id, Number(event.target.value) || 1)} />
                <button type="button" onClick={() => updateQuantity(product.id, item.quantity + 1)} disabled={busy || item.quantity >= 20}>+</button>
              </div>
              <strong className="cart-line-price">{money.format((product.priceCents * item.quantity) / 100)}</strong>
              <button type="button" className="cart-remove" onClick={() => remove(product.id)} disabled={busy}>Remover</button>
            </article>
          )) : (
            <div className="cart-empty">
              <strong>Seu carrinho está vazio.</strong>
              <span>Adicione produtos para montar sua compra ou aproveitar combos.</span>
              <a className="btn btn-primary compact" href="/products">Ver produtos</a>
            </div>
          )}
        </div>

        <aside className="cart-summary glass-panel">
          <span className="section-eyebrow">RESUMO</span>
          <h2>Fechar pedido</h2>

          <label className="detail-coupon">
            <span>Cupom</span>
            <div className="cart-coupon-row">
              <input value={coupon} onChange={(event) => setCoupon(event.target.value)} placeholder="STUDIOK" />
              <button className="btn btn-outline compact" type="button" onClick={() => void sync(items, coupon)} disabled={busy}>Aplicar</button>
            </div>
          </label>

          <div className="cart-summary-lines">
            <div><span>Subtotal</span><strong>{money.format((quote?.subtotal || 0) / 100)}</strong></div>
            {(quote?.items || []).some((line) => line.roleDiscount > 0) && (
              <div className="discount"><span>Benefício Discord</span><strong>Aplicado</strong></div>
            )}
            {(quote?.bundleDiscount || 0) > 0 && <div className="discount"><span>Combos</span><strong>− {money.format((quote?.bundleDiscount || 0) / 100)}</strong></div>}
            {(quote?.couponDiscount || 0) > 0 && <div className="discount"><span>Cupom</span><strong>− {money.format((quote?.couponDiscount || 0) / 100)}</strong></div>}
          </div>

          {!!quote?.appliedBundles.length && (
            <div className="cart-bundles">
              {quote.appliedBundles.map((bundle) => <span key={bundle.id}>✦ {bundle.name} · −{money.format(bundle.discount / 100)}</span>)}
            </div>
          )}

          <div className="cart-total"><span>Total</span><strong>{money.format((quote?.total || 0) / 100)}</strong></div>

          <button className="btn btn-primary" type="button" onClick={() => void checkoutCart()} disabled={busy || !items.length}>
            {busy ? "Processando..." : "Finalizar com Pix"}
          </button>
          {error && <div className="control-notice error">{error}</div>}

          {checkout && (
            <div className="checkout-result">
              <span>Pedido em grupo criado</span>
              <strong>#{checkout.groupId.slice(0, 8)}</strong>
              <p>{checkout.orderIds.length} item(ns) · {money.format(checkout.total / 100)}</p>
              {checkout.payment.pixKey && <><label>Chave Pix</label><code>{checkout.payment.pixKey}</code></>}
              {checkout.payment.recipient && <p>Recebedor: {checkout.payment.recipient}</p>}
              {checkout.payment.instructions && <p>{checkout.payment.instructions}</p>}
            </div>
          )}
        </aside>
      </section>
    </StudioShell>
  );
}
