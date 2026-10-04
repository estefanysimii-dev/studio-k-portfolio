import Icon from "./icons";
import { externalLinkProps } from "@/lib/links";
import FavoriteButton from "./favorite-button";
import ModelStage from "./model-stage";

type Props = {
  eyebrow: string;
  title: string;
  copy: string;
  meta?: string;
  coverUrl?: string;
  modelUrl?: string;
  href?: string;
  favoriteKind?: "items" | "products";
  favoriteId?: string;
};

export default function ShowcaseCard({ eyebrow, title, copy, meta, coverUrl, modelUrl, href = "/portfolio", favoriteKind, favoriteId }: Props) {
  return (
    <article className="showcase-card glass-panel">
      <div className="showcase-visual">
        {coverUrl ? (
          <img src={coverUrl} alt={title} loading="lazy" />
        ) : modelUrl ? (
          <ModelStage modelUrl={modelUrl} title={title} compact previewOnly />
        ) : (
          <div className="showcase-orb"><Icon name="spark" /></div>
        )}
        {modelUrl && <span className="media-badge">360°</span>}
        {favoriteKind && favoriteId && <FavoriteButton kind={favoriteKind} itemId={favoriteId} className="favorite-card-button" />}
      </div>
      <div className="showcase-copy">
        <span className="section-eyebrow">{eyebrow}</span>
        <h3>{title}</h3>
        <p>{copy}</p>
        {meta && <span className="meta-line">{meta}</span>}
        <a className="text-action" href={href} {...externalLinkProps(href)}>
          Ver projeto <Icon name="arrow" />
        </a>
      </div>
    </article>
  );
}
