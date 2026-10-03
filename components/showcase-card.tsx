import Icon from "./icons";

type Props = {
  eyebrow: string;
  title: string;
  copy: string;
  meta?: string;
};

export default function ShowcaseCard({ eyebrow, title, copy, meta }: Props) {
  return (
    <article className="showcase-card glass-panel">
      <div className="showcase-visual">
        <div className="showcase-orb"><Icon name="spark" /></div>
      </div>
      <div className="showcase-copy">
        <span className="section-eyebrow">{eyebrow}</span>
        <h3>{title}</h3>
        <p>{copy}</p>
        {meta && <span className="meta-line">{meta}</span>}
        <button className="text-action">
          Ver projeto <Icon name="arrow" />
        </button>
      </div>
    </article>
  );
}
