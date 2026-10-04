"use client";

import { useStudio } from "./studio-provider";

function detail(entry:{event:string;itemId:string;meta:Record<string,unknown>}){
  const meta=entry.meta||{};
  if(entry.event==="order_created"){
    return String(meta.productName||meta.title||entry.itemId||"Pedido Studio K");
  }
  if(entry.event==="mission_claim"){
    const xp=Number(meta.xp||0);
    return `${String(meta.title||"Missão Studio K")}${xp ? ` · +${xp} XP` : ""}`;
  }
  if(entry.event==="xp_gain"){
    const xp=Number(meta.xp||0);
    return `${xp ? `+${xp} XP · ` : ""}${String(meta.title||meta.source||"Progressão Studio K")}`;
  }
  if(entry.event==="achievement_unlock"){
    return String(meta.title||"Nova conquista");
  }
  return entry.itemId||"Studio K";
}

export default function AccountActivity() {
  const { state } = useStudio();
  const history = state.personal?.activityHistory || [];
  if (!state.me.authenticated) return null;

  return (
    <section className="account-activity glass-panel">
      <div className="section-heading compact-heading">
        <div>
          <span className="section-eyebrow">PROGRESSÃO</span>
          <h2>Histórico recente</h2>
        </div>
      </div>

      <div className="account-activity-list">
        {history.length ? history.map((entry, index) => (
          <article className={`activity-${entry.event}`} key={`${entry.created}-${entry.event}-${index}`}>
            <i />
            <div>
              <strong>{entry.label}</strong>
              <span>{detail(entry)}</span>
              <small>{new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(entry.created))}</small>
            </div>
          </article>
        )) : <p className="muted">Compras, XP, missões concluídas e novas conquistas aparecerão aqui.</p>}
      </div>
    </section>
  );
}
