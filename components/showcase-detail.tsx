"use client";

import { useState } from "react";
import StudioShell from "@/components/studio-shell";
import ModelStage from "@/components/model-stage";
import MediaGallery from "@/components/media-gallery";
import Icon from "@/components/icons";
import { studioApi } from "@/lib/studio-api";
import { useStudio } from "@/components/studio-provider";
import { externalLinkProps } from "@/lib/links";
import type { StudioCheckout, StudioItem, StudioProduct } from "@/lib/studio-types";
import FavoriteButton from "@/components/favorite-button";
import ProductRecommendations from "@/components/product-recommendations";

const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

type Props =
  | { kind: "portfolio"; item: StudioItem }
  | { kind: "product"; item: StudioProduct };

export default function ShowcaseDetail(props: Props) {
  const { state, refresh } = useStudio();
  const item = props.item;
  const isProduct = props.kind === "product";
  const product = isProduct ? props.item : null;
  const activeDrop = product
    ? (state.drops || []).find((drop) =>
        drop.productId === product.id &&
        drop.published !== false &&
        Date.parse(drop.startsAt) <= Date.now() &&
        Date.parse(drop.endsAt) > Date.now()
      )
    : undefined;
  const dropDiscount = Math.max(0, Number(activeDrop?.discountPercent || 0));
  const dropPrice = product && dropDiscount > 0
    ? Math.max(0, Math.floor(product.priceCents * (100 - dropDiscount) / 100))
    : product?.priceCents || 0;
  const memberDiscount = state.me.profile?.discountPercent || 0;
  const memberPrice = memberDiscount > 0
    ? Math.max(0, Math.floor(dropPrice * (100 - memberDiscount) / 100))
    : dropPrice;
  const [coupon, setCoupon] = useState("");
  const [checkout, setCheckout] = useState<StudioCheckout | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [cartAdded, setCartAdded] = useState(false);
  const [restockBusy, setRestockBusy] = useState(false);

  const addToCart = async () => {
    if (!product) return;
    if (!state.me.authenticated) {
      window.location.href = `/api/oauth/start?next=/products/${product.id}`;
      return;
    }
    setBusy(true);
    setError("");
    try {
      const current = state.personal?.cart || [];
      const existing = current.find((item) => item.productId === product.id);
      const next = existing
        ? current.map((item) => item.productId === product.id ? { ...item, quantity: Math.min(20, item.quantity + 1) } : item)
        : [...current, { productId: product.id, quantity: 1 }];
      await studioApi.saveCart(next);
      await refresh();
      setCartAdded(true);
      window.setTimeout(() => setCartAdded(false), 2200);
      window.location.hash = "";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível adicionar ao carrinho.");
    } finally {
      setBusy(false);
    }
  };

  const createOrder = async () => {
    if (!product) return;
    setBusy(true);
    setError("");
    try {
      let sessionId = `member-${state.me.user?.id || "studio-k"}`;
      try { sessionId = localStorage.getItem("studio-k-visitor-id") || sessionId; } catch {}
      void studioApi.track({
        sessionId,
        event: "checkout_start",
        itemKind: "product",
        itemId: product.id,
        path: `/products/${product.id}`,
        meta: { hasCoupon: Boolean(coupon.trim()), drop: Boolean(activeDrop) }
      });
      setCheckout(await studioApi.createOrder(product.id, coupon));
    } catch (err) {
      let sessionId = `member-${state.me.user?.id || "studio-k"}`;
      try { sessionId = localStorage.getItem("studio-k-visitor-id") || sessionId; } catch {}
      void studioApi.track({
        sessionId,
        event: "checkout_error",
        itemKind: "product",
        itemId: product.id,
        path: `/products/${product.id}`,
        meta: { hasCoupon: Boolean(coupon.trim()) }
      });
      setError(err instanceof Error ? err.message : "Não foi possível criar o pedido.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <StudioShell eyebrow={isProduct ? "PRODUTOS" : "PORTFÓLIO"} title={item.name}>
      <a className="detail-back" href={isProduct ? "/products" : "/portfolio"}>← Voltar</a>

      <section className="detail-hero">
        <div className="detail-copy">
          <span className="section-eyebrow">{item.category || "STUDIO K"}</span>
          <div className="detail-title-row">
            <h1>{item.name}</h1>
            <FavoriteButton kind={isProduct ? "products" : "items"} itemId={item.id} label />
          </div>
          <p>{item.description}</p>

          {!!item.tags?.length && (
            <div className="tag-row">{item.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>
          )}

          {isProduct && product && (
            <div className="detail-commerce glass-panel">
              <span className="section-eyebrow">STUDIO K STORE</span>
              <div className="detail-price-stack">
                {product.stockMode && product.stockMode !== "unlimited" && (
                  <span className={`product-availability ${product.available === false ? "sold-out" : ""}`}>
                    {product.available === false
                      ? "ESGOTADO"
                      : product.stockMode === "slots"
                        ? `${product.remaining ?? product.stockLimit ?? 0} vaga(s) disponível(is)`
                        : product.stockMode === "numbered"
                          ? `Edição limitada · ${product.remaining ?? product.stockLimit ?? 0} restante(s)`
                          : `${product.remaining ?? product.stockLimit ?? 0} unidade(s) disponível(is)`}
                  </span>
                )}
                {(dropDiscount > 0 || (state.me.authenticated && memberDiscount > 0)) && product.priceCents > 0 ? (
                  <>
                    <span className="detail-price-original">{money.format(product.priceCents / 100)}</span>
                    <strong className="detail-price">{money.format(memberPrice / 100)}</strong>
                    <div className="detail-discount-tags">
                      {dropDiscount > 0 && <span className="detail-drop-discount">DROP · {dropDiscount}% OFF</span>}
                      {state.me.authenticated && memberDiscount > 0 && <span className="detail-member-discount">Studio K ID · +{memberDiscount}% OFF</span>}
                    </div>
                  </>
                ) : (
                  <strong className="detail-price">{product.priceCents > 0 ? money.format(product.priceCents / 100) : "Sob consulta"}</strong>
                )}
                {activeDrop && <small className="detail-drop-expiry">Drop termina {new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(activeDrop.endsAt))}</small>}
              </div>

              {product.priceCents > 0 ? (
                state.me.authenticated ? (
                  <>
                    <label className="detail-coupon">
                      <span>Cupom (opcional)</span>
                      <input value={coupon} onChange={(event) => setCoupon(event.target.value)} placeholder="STUDIOK" />
                    </label>
                    <div className="detail-commerce-actions">
                      <button className="btn btn-primary" type="button" onClick={() => void createOrder()} disabled={busy || product.available === false}>
                        {busy ? "Criando pedido..." : product.available === false ? "Indisponível" : "Comprar com Pix"} <Icon name="arrow" />
                      </button>
                      <button className="btn btn-outline" type="button" onClick={() => void addToCart()} disabled={busy || product.available === false}>
                        {cartAdded ? "Adicionado ✓" : "Adicionar ao carrinho"}
                      </button>
                      {product.available === false && (
                        <button
                          className="btn btn-outline restock-button"
                          type="button"
                          disabled={restockBusy}
                          onClick={async () => {
                            const subscribed = (state.personal?.restockSubscriptions || []).includes(product.id);
                            setRestockBusy(true); setError("");
                            try {
                              await studioApi.setRestockSubscription(product.id, !subscribed);
                              await refresh();
                            } catch (err) {
                              setError(err instanceof Error ? err.message : "Não foi possível alterar o aviso de reposição.");
                            } finally { setRestockBusy(false); }
                          }}
                        >
                          {(state.personal?.restockSubscriptions || []).includes(product.id) ? "Aviso de reposição ativado ✓" : "Avise-me quando voltar"}
                        </button>
                      )}
                    </div>
                  </>
                ) : (
                  <a className="btn btn-primary" href={`/api/oauth/start?next=/products/${product.id}`}>
                    Conectar Discord para comprar <Icon name="arrow" />
                  </a>
                )
              ) : (
                <a className="btn btn-primary" href={state.site.discordInviteUrl || "/discord"} {...externalLinkProps(state.site.discordInviteUrl || "/discord")}>
                  Solicitar no Discord <Icon name="arrow" />
                </a>
              )}

              {error && <div className="control-notice error">{error}</div>}
              {checkout && (
                <div className="checkout-result">
                  <span>Pedido criado</span>
                  <strong>#{checkout.id.slice(0, 8)}</strong>
                  <p>Valor: {money.format(checkout.price / 100)}</p>
                  {checkout.payment.pixKey ? (
                    <>
                      <label>Chave Pix</label>
                      <code>{checkout.payment.pixKey}</code>
                      {checkout.payment.recipient && <p>Recebedor: {checkout.payment.recipient}</p>}
                      {checkout.payment.instructions && <p>{checkout.payment.instructions}</p>}
                    </>
                  ) : (
                    <p>O pagamento ainda precisa ser configurado pela equipe Studio K.</p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <ModelStage
          modelUrl={item.modelUrl}
          compareModelUrl={item.compareModelUrl}
          hotspots={item.viewerHotspots}
          viewerVariants={item.viewerVariants}
          viewerModes={item.viewerModes}
          outfitModelUrl={item.outfitModelUrl}
          outfitPosterUrl={item.outfitPosterUrl}
          viewerPieces={item.viewerPieces}
          posterUrl={item.coverUrl || item.gifUrl}
          title={item.name}
          hideControls={!isProduct}
        />
      </section>

      <MediaGallery
        title={item.name}
        coverUrl={item.coverUrl}
        gifUrl={item.gifUrl}
        videoUrl={item.videoUrl}
        galleryUrls={item.galleryUrls}
      />

      {isProduct && product && <ProductRecommendations productId={product.id} />}

      {!isProduct && (
        <section className="cta-banner glass-panel detail-cta">
          <div>
            <span className="section-eyebrow">STUDIO K · SHOWROOM</span>
            <h2>Este projeto faz parte do portfólio e não possui valor de venda.</h2>
          </div>
          <a className="btn btn-outline" href={state.site.discordInviteUrl || "/discord"} {...externalLinkProps(state.site.discordInviteUrl || "/discord")}>Conhecer o Discord</a>
        </section>
      )}
    </StudioShell>
  );
}
