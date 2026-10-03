import Icon from "./icons";

type Props = {
  eyebrow: string;
  title: string;
  copy: string;
  meta?: string;
  coverUrl?: string;
  modelUrl?: string;
  href?: string;
};

export default function ShowcaseCard({ eyebrow, title, copy, meta, coverUrl, modelUrl, href = "/portfolio" }: Props) {
  return (
    <article className="showcase-card glass-panel">
      <div className="showcase-visual">
        {coverUrl ? (
          <img src={coverUrl} alt={title} loading="lazy" />
        ) : (
          <div className="showcase-orb"><Icon name="spark" /></div>
        )}
        {modelUrl && <span className="media-badge">360°</span>}
      </div>
      <div className="showcase-copy">
        <span className="section-eyebrow">{eyebrow}</span>
        <h3>{title}</h3>
        <p>{copy}</p>
        {meta && <span className="meta-line">{meta}</span>}
        <a className="text-action" href={href}>
          Ver projeto <Icon name="arrow" />
        </a>
      </div>
    </article>
  );
}
