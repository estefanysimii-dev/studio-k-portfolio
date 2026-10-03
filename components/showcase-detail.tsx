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

const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

type Props =
  | { kind: "portfolio"; item: StudioItem }
  | { kind: "product"; item: StudioProduct };

export default function ShowcaseDetail(props: Props) {
  const { state } = useStudio();
  const item = props.item;
  const isProduct = props.kind === "product";
  const product = isProduct ? props.item : null;
  const memberDiscount = state.me.profile?.discountPercent || 0;
  const memberPrice = product && memberDiscount > 0
    ? Math.max(0, Math.floor(product.priceCents * (100 - memberDiscount) / 100))
    : product?.priceCents || 0;
  const [coupon, setCoupon] = useState("");
  const [checkout, setCheckout] = useState<StudioCheckout | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const createOrder = async () => {
    if (!product) return;
    setBusy(true);
    setError("");
    try {
      setCheckout(await studioApi.createOrder(product.id, coupon));
    } catch (err) {
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
                {state.me.authenticated && memberDiscount > 0 && product.priceCents > 0 ? (
                  <>
                    <span className="detail-price-original">{money.format(product.priceCents / 100)}</span>
                    <strong className="detail-price">{money.format(memberPrice / 100)}</strong>
                    <span className="detail-member-discount">Studio K ID · {memberDiscount}% OFF automático</span>
                  </>
                ) : (
                  <strong className="detail-price">{product.priceCents > 0 ? money.format(product.priceCents / 100) : "Sob consulta"}</strong>
                )}
              </div>

              {product.priceCents > 0 && product.botProductId ? (
                state.me.authenticated ? (
                  <>
                    <label className="detail-coupon">
                      <span>Cupom (opcional)</span>
                      <input value={coupon} onChange={(event) => setCoupon(event.target.value)} placeholder="STUDIOK" />
                    </label>
                    <button className="btn btn-primary" type="button" onClick={() => void createOrder()} disabled={busy}>
                      {busy ? "Criando pedido..." : "Comprar com Pix"} <Icon name="arrow" />
                    </button>
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

        <ModelStage modelUrl={item.modelUrl} posterUrl={item.coverUrl || item.gifUrl} title={item.name} />
      </section>

      <MediaGallery
        title={item.name}
        coverUrl={item.coverUrl}
        gifUrl={item.gifUrl}
        videoUrl={item.videoUrl}
        galleryUrls={item.galleryUrls}
      />

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
