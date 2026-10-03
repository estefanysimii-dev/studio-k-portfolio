"use client";

import StudioShell from "@/components/studio-shell";
import ModelStage from "@/components/model-stage";
import ShowcaseCard from "@/components/showcase-card";
import Icon from "@/components/icons";
import { useStudio } from "@/components/studio-provider";
import { externalLinkProps } from "@/lib/links";

export default function HomePage() {
  const { state } = useStudio();
  const { site, items } = state;
  const featured = items.find((item) => item.featured) || items[0];
  const selected = items.slice(0, 4);
  const banner = site.homeBackgroundUrl && !site.homeBackgroundUrl.startsWith("/media/")
    ? site.homeBackgroundUrl
    : "/studio-assets/studio-k-banner-hq.webp";

  return (
    <StudioShell eyebrow="STUDIO K" title="Showroom">
      <section className="home-banner glass-panel" aria-label="Studio K">
        <img className="home-banner-image" src={banner} alt="Studio K · estúdio de criação 3D" />
        <div className="home-banner-shade" />
        <div className="home-banner-copy">
          <span>STUDIO K · FIVEM DESIGN</span>
          <strong>{site.brandTagline || "Sua identidade. Sua cidade."}</strong>
        </div>
      </section>

      <section className="hero-grid">
        <div className="hero-copy">
          <span className="section-eyebrow">{site.heroEyebrow}</span>
          <h1>
            {site.heroTitle}
            <span>{site.heroAccent}</span>
          </h1>
          <p>{site.heroSubtitle}</p>

          <div className="hero-actions">
            <a className="btn btn-primary" href="/portfolio">
              {site.primaryCtaLabel || "Explorar Portfólio"} <Icon name="arrow" />
            </a>
            <a className="btn btn-outline" href={site.discordInviteUrl || "/discord"} {...externalLinkProps(site.discordInviteUrl || "/discord")}>
              {site.secondaryCtaLabel || "Entrar no Discord"}
            </a>
          </div>

          <div className="trust-row">
            <div><strong>360°</strong><span>Visualização 3D</span></div>
            <div><strong>GLB</strong><span>Viewer otimizado</span></div>
            <div><strong>SK</strong><span>Identidade Studio K</span></div>
          </div>
        </div>

        <ModelStage
          modelUrl={featured?.modelUrl}
          posterUrl={featured?.coverUrl || featured?.gifUrl}
          title={featured?.name || "Studio K"}
        />
      </section>

      <section className="section-block">
        <div className="section-heading">
          <div>
            <span className="section-eyebrow">TRABALHOS SELECIONADOS</span>
            <h2>Peças que definem o Studio K.</h2>
          </div>
          <a className="text-action" href="/portfolio">Ver todos <Icon name="arrow" /></a>
        </div>

        <div className="showcase-grid">
          {selected.length ? selected.map((item) => (
            <ShowcaseCard
              key={item.id}
              eyebrow={item.category || "STUDIO K"}
              title={item.name}
              copy={item.description}
              meta={(item.tags || []).join(" · ")}
              coverUrl={item.coverUrl || item.gifUrl}
              modelUrl={item.modelUrl}
              href={`/portfolio/${item.id}`}
            />
          )) : (
            <>
              <ShowcaseCard eyebrow="FIVEM · FEMININO" title="Polo + Manguito" copy="Construção, textura e acabamento com foco em leitura limpa no jogo e apresentação 3D." meta="3D · TEXTURA · CUSTOM CLOTHING" />
              <ShowcaseCard eyebrow="EMISSIVE · NIGHTWEAR" title="Neon Collection" copy="Materiais emissivos e contraste controlado para peças que ganham presença à noite." meta="EMISSIVE · MATERIALS · FIVEM" />
            </>
          )}
        </div>
      </section>

      <section className="cta-banner glass-panel">
        <div>
          <span className="section-eyebrow">COMUNIDADE STUDIO K</span>
          <h2>Entre no Discord e acompanhe drops, projetos e novidades.</h2>
        </div>
        <a className="btn btn-primary" href={site.discordInviteUrl || "/discord"} {...externalLinkProps(site.discordInviteUrl || "/discord")}>Entrar no Discord <Icon name="arrow" /></a>
      </section>
    </StudioShell>
  );
}
