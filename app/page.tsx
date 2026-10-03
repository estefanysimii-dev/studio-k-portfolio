"use client";

import { useMemo, useState } from "react";
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
  const [feedbackFilter, setFeedbackFilter] = useState(0);
  const feedbacks = state.feedbacks || [];
  const validFeedbacks = useMemo(
    () => feedbacks.filter((feedback) => Number(feedback.rating) >= 1 && Number(feedback.rating) <= 5),
    [feedbacks]
  );
  const feedbackAverage = useMemo(
    () => validFeedbacks.length
      ? validFeedbacks.reduce((sum, feedback) => sum + Number(feedback.rating || 0), 0) / validFeedbacks.length
      : 0,
    [validFeedbacks]
  );
  const feedbackCounts = useMemo(() => {
    const counts = [0, 0, 0, 0, 0, 0];
    for (const feedback of validFeedbacks) {
      const rating = Math.max(1, Math.min(5, Math.round(Number(feedback.rating) || 0)));
      counts[rating] += 1;
    }
    return counts;
  }, [validFeedbacks]);
  const visibleFeedbacks = useMemo(
    () => feedbackFilter === 0
      ? validFeedbacks
      : validFeedbacks.filter((feedback) => Math.round(Number(feedback.rating)) === feedbackFilter),
    [feedbackFilter, validFeedbacks]
  );
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

        </div>

        <ModelStage
          modelUrl={featured?.modelUrl}
          compareModelUrl={featured?.compareModelUrl}
          hotspots={featured?.viewerHotspots}
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
              favoriteKind="items"
              favoriteId={item.id}
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

      <section className="ticket-home-cta">
        <span className="section-eyebrow">ATENDIMENTO STUDIO K</span>
        <h2>Se interessou? Abra um ticket!</h2>
        <a
          className="btn btn-primary ticket-home-button"
          href="https://discord.gg/YPShX4FQCE"
          target="_blank"
          rel="noopener noreferrer"
        >
          Abrir Ticket <Icon name="arrow" />
        </a>
      </section>

      <section className="feedback-section section-block" aria-labelledby="feedback-title">
        <div className="feedback-heading">
          <div>
            <span className="section-eyebrow">AVALIAÇÕES DA COMUNIDADE</span>
            <h2 id="feedback-title">
              Feedbacks do Studio K
              <span className="feedback-average">
                <b>★</b> {feedbackAverage.toFixed(1)}/5
              </span>
            </h2>
            <p>{validFeedbacks.length} {validFeedbacks.length === 1 ? "avaliação publicada" : "avaliações publicadas"} pelo bot do Studio K.</p>
          </div>

          <div className="feedback-filters" role="group" aria-label="Filtrar feedbacks por estrelas">
            <button type="button" className={feedbackFilter === 0 ? "active" : ""} onClick={() => setFeedbackFilter(0)}>
              Todos <span>{validFeedbacks.length}</span>
            </button>
            {[5, 4, 3, 2, 1].map((rating) => (
              <button
                type="button"
                key={rating}
                className={feedbackFilter === rating ? "active" : ""}
                onClick={() => setFeedbackFilter(rating)}
              >
                {rating}★ <span>{feedbackCounts[rating]}</span>
              </button>
            ))}
          </div>
        </div>

        {visibleFeedbacks.length ? (
          <div className="feedback-grid">
            {visibleFeedbacks.map((feedback) => {
              const score = Math.max(1, Math.min(5, Math.round(Number(feedback.rating) || 0)));
              const submitted = feedback.submittedAt ? new Date(feedback.submittedAt) : null;
              const dateLabel = submitted && !Number.isNaN(submitted.getTime())
                ? new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium" }).format(submitted)
                : "";
              return (
                <article className="feedback-card glass-panel" key={feedback.id}>
                  <div className="feedback-card-head">
                    {feedback.avatar ? (
                      <img className="feedback-avatar" src={feedback.avatar} alt="" loading="lazy" />
                    ) : (
                      <div className="feedback-avatar feedback-avatar-fallback" aria-hidden="true">SK</div>
                    )}
                    <div className="feedback-person">
                      <strong>{feedback.name || "Cliente Studio K"}</strong>
                      <span>{feedback.source || "Feedback"}{feedback.reference ? ` · ${feedback.reference}` : ""}</span>
                    </div>
                    <span className="feedback-stars" aria-label={`${score} de 5 estrelas`}>
                      {Array.from({ length: 5 }, (_, index) => (
                        <span key={index} className={index < score ? "filled" : ""} aria-hidden="true">★</span>
                      ))}
                    </span>
                  </div>
                  <p className={feedback.comment ? "" : "feedback-no-comment"}>
                    {feedback.comment || "Avaliação enviada sem comentário."}
                  </p>
                  <footer>
                    <span>{dateLabel}</span>
                    <span>{score}/5</span>
                  </footer>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="feedback-empty glass-panel">
            {feedbackFilter
              ? `Nenhum feedback com ${feedbackFilter} estrela${feedbackFilter === 1 ? "" : "s"}.`
              : "Ainda não há feedbacks publicados pelo bot."}
          </div>
        )}
      </section>

    </StudioShell>
  );
}
