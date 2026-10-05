"use client";

import { useMemo, useState } from "react";

type Props = {
  coverUrl?: string;
  gifUrl?: string;
  videoUrl?: string;
  galleryUrls?: string[];
  title: string;
};

type Media = { url: string; type: "image" | "video" };

const isVideo = (value: string) => /\.(mp4|webm)(\?|#|$)/i.test(value);

export default function MediaGallery({ coverUrl = "", gifUrl = "", videoUrl = "", galleryUrls = [], title }: Props) {
  const media = useMemo(() => {
    const entries: Media[] = [];
    const seen = new Set<string>();
    const add = (url: string, type?: "image" | "video") => {
      const value = String(url || "").trim();
      if (!value || seen.has(value)) return;
      seen.add(value);
      entries.push({ url: value, type: type || (isVideo(value) ? "video" : "image") });
    };
    add(coverUrl, "image");
    add(gifUrl, "image");
    add(videoUrl, "video");
    galleryUrls.forEach((url) => add(url));
    return entries;
  }, [coverUrl, gifUrl, videoUrl, galleryUrls]);

  const [active, setActive] = useState(0);
  if (!media.length) return null;
  const selected = media[Math.min(active, media.length - 1)];

  return (
    <section className="media-gallery glass-panel">
      <div className="media-gallery-main">
        {selected.type === "video"
          ? <video src={selected.url} controls playsInline preload="metadata" />
          : <img src={selected.url} alt={title} decoding="async" />}
      </div>
      {media.length > 1 && (
        <div className="media-gallery-strip" aria-label="Galeria de mídia">
          {media.map((item, index) => (
            <button
              type="button"
              key={item.url}
              className={index === active ? "active" : ""}
              onClick={() => setActive(index)}
              aria-label={`Abrir mídia ${index + 1}`}
            >
              {item.type === "video" ? <span>VÍDEO</span> : <img src={item.url} alt="" loading="lazy" decoding="async" />}
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
