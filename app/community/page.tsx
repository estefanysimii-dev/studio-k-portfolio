"use client";

import StudioShell from "@/components/studio-shell";
import { useStudio } from "@/components/studio-provider";

export default function CommunityPage() {
  const { state } = useStudio();
  const commerce = state.commerce;
  const gallery = commerce?.gallery || [];
  const lookbooks = commerce?.lookbooks || [];
  const activity = commerce?.activity || [];
  const ranking = Array.isArray(commerce?.leaderboard) ? commerce?.leaderboard : [];

  return (
    <StudioShell eyebrow="COMUNIDADE" title="Studio K Community">
      <div className="section-heading"><div><span className="section-eyebrow">COMUNIDADE STUDIO K</span><h1 className="page-title">Inspiração, looks e atividade.</h1></div></div>

      {!!lookbooks.length && <section className="section-block">
        <div className="section-heading compact-heading"><div><span className="section-eyebrow">LOOKBOOK</span><h2>Combinações Studio K</h2></div></div>
        <div className="lookbook-grid">
          {lookbooks.map((lookbook) => (
            <article className="lookbook-card glass-panel" key={lookbook.id}>
              {lookbook.coverUrl ? <img src={lookbook.coverUrl} alt="" /> : <div className="lookbook-placeholder">SK</div>}
              <div><strong>{lookbook.name}</strong><p>{lookbook.description}</p><div>{lookbook.productIds.map((id) => { const p=state.products.find(x=>x.id===id); return p ? <a key={id} href={`/products/${id}`}>{p.name}</a> : null; })}</div></div>
            </article>
          ))}
        </div>
      </section>}

      <section className="community-columns">
        <div className="glass-panel community-gallery">
          <div className="section-heading compact-heading"><div><span className="section-eyebrow">GALERIA</span><h2>Na comunidade</h2></div></div>
          <div className="community-gallery-grid">
            {gallery.length ? gallery.map((item) => (
              <article key={item.id}>
                <img src={item.imageUrl} alt="" loading="lazy" />
                <div><strong>{item.name}</strong><p>{item.caption}</p></div>
              </article>
            )) : <p className="muted">Ainda não há imagens aprovadas.</p>}
          </div>
        </div>

        <div className="glass-panel activity-feed">
          <div className="section-heading compact-heading"><div><span className="section-eyebrow">AO VIVO</span><h2>Atividade</h2></div></div>
          {activity.map((item) => <a href={item.href} key={item.id}><i /><div><strong>{item.title}</strong><span>{item.text}</span></div></a>)}
        </div>
      </section>

      {!!ranking.length && <section className="glass-panel community-ranking">
        <div className="section-heading compact-heading"><div><span className="section-eyebrow">RANKING OPCIONAL</span><h2>Studio K Community</h2></div></div>
        {ranking.map((entry, index) => <div key={entry.userId}><b>{index + 1}</b><span>{entry.studioId || "Studio K Member"}</span><strong>{entry.score} XP</strong></div>)}
        <p className="muted">Somente membros que optaram por aparecer entram neste ranking.</p>
      </section>}
    </StudioShell>
  );
}
