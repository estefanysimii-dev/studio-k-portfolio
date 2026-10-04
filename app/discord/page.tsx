"use client";

import StudioShell from "@/components/studio-shell";
import Icon from "@/components/icons";
import { useStudio } from "@/components/studio-provider";
import { discordAppInviteHref, discordInviteHref } from "@/lib/links";

function money(cents: number) {
  if (!cents) return "";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL"
  }).format(cents / 100);
}

export default function DiscordPage() {
  const { state } = useStudio();
  const invite = discordInviteHref(state.site.discordInviteUrl);
  const appInvite = discordAppInviteHref(invite);
  const me = state.me;
  const assistantCampaigns = (state.site.assistant?.campaigns || []).filter((campaign) => campaign.active);
  const promotion = assistantCampaigns.find((campaign) => campaign.type === "promotion" || campaign.type === "combo");
  const news = assistantCampaigns.find((campaign) => campaign.type === "news");
  const latestProduct = state.products.find((product) => product.published);
  const latestProject = state.items.find((item) => item.published);
  const discount = Math.max(0, Number(state.site.memberDiscountPercent || 0));
  const benefitTitle = state.site.memberBenefitTitle || "Benefícios exclusivos para membros";
  const benefitDescription = state.site.memberBenefitDescription || "Conecte sua conta para liberar vantagens do Studio K.";
  const role = me.member?.roles?.find((item) => item.name && item.name !== "@everyone");
  const promoValue = promotion?.priceCents ? money(promotion.priceCents) : "";
  const newsTitle = news?.title || latestProduct?.name || latestProject?.name || "Novidades do Studio K";
  const newsHref = news?.href || (latestProduct ? `/products/${latestProduct.id}` : latestProject ? `/portfolio/${latestProject.id}` : "/portfolio");
  const activeBenefits = [
    discount > 0,
    Boolean(promotion),
    Boolean(benefitTitle),
    Boolean(newsTitle)
  ].filter(Boolean).length;

  return (
    <StudioShell eyebrow="DISCORD" title="Vínculo de conta">
      <section className="discord-hero">
        <div className="discord-copy">
          <span className="section-eyebrow">ECOSSISTEMA STUDIO K</span>
          <h1>DISCORD<br/><span>STUDIO K</span></h1>
          <p>
            Conecte seu Discord para acessar benefícios, promoções, novidades e vantagens de membro em todo o Studio K.
          </p>
          <div className="hero-actions">
            {!me.authenticated ? (
              <a className="btn btn-primary" href="/api/oauth/start?next=/discord">
                Conectar com Discord <Icon name="arrow" />
              </a>
            ) : (
              <a className="btn btn-primary" href="/account">
                Minha conta <Icon name="arrow" />
              </a>
            )}
            <a className="btn btn-outline" href={appInvite}>
              Entrar no servidor
            </a>
          </div>
        </div>

        <div className="oauth-card access-card glass-panel">
          {!me.authenticated ? (
            <>
              <div className="access-card-brand">
                <div className="oauth-icon"><img src="/studio-assets/studio-k-logo.webp" alt="Studio K" /></div>
                <div>
                  <span className="section-eyebrow">SEU ACESSO STUDIO K</span>
                  <span className="access-status">Conta não conectada</span>
                </div>
              </div>

              <h2>Conecte sua conta e libere seus benefícios</h2>
              <p>{benefitDescription}</p>

              <div className="access-benefits">
                <div className="access-benefit-row">
                  <span className="access-benefit-icon">%</span>
                  <div><small>Desconto de membro</small><strong>{discount > 0 ? `Até ${discount}% OFF` : "Vantagens exclusivas"}</strong></div>
                </div>

                <div className="access-benefit-row">
                  <span className="access-benefit-icon">✦</span>
                  <div>
                    <small>Promoção atual</small>
                    <strong>{promotion?.title || "Confira as ofertas do Studio K"}{promoValue ? ` · ${promoValue}` : ""}</strong>
                  </div>
                </div>

                <div className="access-benefit-row">
                  <span className="access-benefit-icon">◆</span>
                  <div><small>Benefício em destaque</small><strong>{benefitTitle}</strong></div>
                </div>

                <a className="access-benefit-row access-benefit-link" href={newsHref}>
                  <span className="access-benefit-icon">↗</span>
                  <div><small>Novidade</small><strong>{newsTitle}</strong></div>
                </a>

                <div className="access-benefit-row">
                  <span className="access-benefit-icon">#</span>
                  <div><small>Suporte</small><strong>{state.status.ticketsOpen ? "Tickets disponíveis" : "Tickets temporariamente fechados"}</strong></div>
                </div>
              </div>

              <a className="btn btn-primary access-connect" href="/api/oauth/start?next=/discord">
                Conectar com Discord <Icon name="arrow" />
              </a>
              <div className="access-security"><span>●</span> Conexão oficial pelo Discord. Sua senha nunca é compartilhada com o Studio K.</div>
            </>
          ) : (
            <>
              <div className="access-profile">
                {me.user?.avatar ? (
                  <img src={me.user.avatar} alt="" />
                ) : (
                  <div className="access-profile-fallback">{(me.user?.name || me.user?.username || "K").slice(0, 1).toUpperCase()}</div>
                )}
                <div>
                  <span className="section-eyebrow">SEU ACESSO STUDIO K</span>
                  <h2>Olá, {me.user?.name || me.user?.username || "membro"} 👋</h2>
                  <span className="access-connected"><i /> Discord conectado</span>
                </div>
              </div>

              <div className="access-member-badge">
                <span>{me.member?.inGuild ? "MEMBRO STUDIO K" : "CONTA STUDIO K"}</span>
                <strong>{role?.name || (me.member?.inGuild ? "Membro do servidor" : "Entre no servidor para liberar cargos")}</strong>
              </div>

              <div className="access-stats">
                <div>
                  <small>Seu desconto</small>
                  <strong>{discount > 0 ? `${discount}% OFF` : "—"}</strong>
                </div>
                <div>
                  <small>Benefícios ativos</small>
                  <strong>{activeBenefits}</strong>
                </div>
                <div>
                  <small>Tickets</small>
                  <strong>{state.status.ticketsOpen ? "Abertos" : "Fechados"}</strong>
                </div>
              </div>

              {promotion && (
                <div className="access-highlight">
                  <span>PROMOÇÃO PARA VOCÊ</span>
                  <strong>{promotion.title || "Oferta Studio K"}{promoValue ? ` · ${promoValue}` : ""}</strong>
                  {promotion.text && <p>{promotion.text}</p>}
                  {promotion.href && promotion.ctaLabel && <a href={promotion.href}>{promotion.ctaLabel} →</a>}
                </div>
              )}

              <div className="access-actions">
                <a className="btn btn-primary" href="/account">Ver meus benefícios</a>
                <a className="btn btn-outline" href={appInvite}>Abrir ticket</a>
              </div>
            </>
          )}
        </div>
      </section>
    </StudioShell>
  );
}
