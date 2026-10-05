"use client";

import { useEffect, useMemo, useState } from "react";
import type { StudioSite } from "@/lib/studio-types";

type Props = {
  site: StudioSite;
};

const DEFAULT_BANNER = "/studio-assets/studio-k-banner-hq.webp";
const DEFAULT_BANNER_MOBILE = "/studio-assets/studio-k-banner.webp";
const ROTATION_MS = 5000;

export default function HomeBannerCarousel({ site }: Props) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  const slides = useMemo(() => {
    const configured = (site.homeBannerSlides || [])
      .filter((slide) => slide?.imageUrl?.trim())
      .map((slide) => ({
        id: slide.id,
        imageUrl: slide.imageUrl.trim(),
        alt: slide.alt?.trim() || "Studio K · estúdio de criação 3D",
        builtin: false
      }));

    if (configured.length) return configured;

    const customBanner = site.homeBackgroundUrl && !site.homeBackgroundUrl.startsWith("/media/")
      ? site.homeBackgroundUrl
      : "";

    return [{
      id: "studio-default",
      imageUrl: customBanner || DEFAULT_BANNER,
      alt: "Studio K · estúdio de criação 3D",
      builtin: !customBanner
    }];
  }, [site.homeBackgroundUrl, site.homeBannerSlides]);

  useEffect(() => {
    if (active < slides.length) return;
    setActive(0);
  }, [active, slides.length]);

  useEffect(() => {
    if (slides.length < 2 || paused) return;
    const timer = window.setTimeout(() => {
      setActive((current) => (current + 1) % slides.length);
    }, ROTATION_MS);
    return () => window.clearTimeout(timer);
  }, [active, paused, slides.length]);

  useEffect(() => {
    if (slides.length < 2 || typeof window === "undefined") return;
    const next = slides[(active + 1) % slides.length];
    if (!next?.imageUrl) return;
    const image = new Image();
    image.decoding = "async";
    image.src = next.imageUrl;
  }, [active, slides]);

  const current = slides[active] || slides[0];

  return (
    <section
      className="home-banner home-banner-carousel glass-panel"
      aria-label="Studio K"
      aria-roledescription="carousel"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      <div className="home-banner-slides" aria-live="polite">
        {slides.map((slide, index) => (
          <div
            className={index === active ? "home-banner-slide active" : "home-banner-slide"}
            key={slide.id}
            aria-hidden={index !== active}
          >
            {slide.builtin ? (
              <picture>
                <source media="(max-width: 600px)" srcSet={DEFAULT_BANNER_MOBILE} />
                <img
                  className="home-banner-image"
                  src={slide.imageUrl}
                  alt={index === active ? slide.alt : ""}
                  width={1622}
                  height={970}
                  fetchPriority={index === 0 ? "high" : "auto"}
                  loading={index === 0 ? "eager" : "lazy"}
                  decoding="async"
                />
              </picture>
            ) : (
              <img
                className="home-banner-image"
                src={slide.imageUrl}
                alt={index === active ? slide.alt : ""}
                fetchPriority={index === 0 ? "high" : "auto"}
                loading={index === 0 ? "eager" : "lazy"}
                decoding="async"
              />
            )}
          </div>
        ))}
      </div>

      <div className="home-banner-shade" />
      <div className="home-banner-copy">
        <span>STUDIO K · FIVEM DESIGN</span>
        <strong>{site.brandTagline || "Sua identidade. Sua cidade."}</strong>
      </div>

      {slides.length > 1 && (
        <div className="home-banner-dots" role="tablist" aria-label="Escolher banner">
          {slides.map((slide, index) => (
            <button
              type="button"
              key={slide.id}
              className={index === active ? "active" : ""}
              role="tab"
              aria-selected={index === active}
              aria-label={`Mostrar banner ${index + 1} de ${slides.length}`}
              onClick={() => setActive(index)}
            >
              <span />
            </button>
          ))}
        </div>
      )}

      {slides.length > 1 && (
        <div className="home-banner-progress" aria-hidden="true">
          <span key={`${active}-${paused ? "paused" : "running"}`} className={paused ? "paused" : ""} />
        </div>
      )}

      <span className="sr-only">
        Banner {active + 1} de {slides.length}: {current?.alt}
      </span>
    </section>
  );
}
