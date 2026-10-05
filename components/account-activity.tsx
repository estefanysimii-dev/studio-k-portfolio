"use client";

import { useStudio } from "./studio-provider";

function detail(entry:{event:string;itemId:string;meta:Record<string,unknown>}){
  const meta=entry.meta||{};
  if(entry.event==="order_created"){
    return String(meta.productName||meta.title||entry.itemId||"Pedido Studio K");
  }
  if(entry.event==="mission_claim"){
    return String(meta.title||"Atividade Studio K");
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
          <span className="section-eyebrow">ATIVIDADE</span>
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
        )) : <p className="muted">Compras e atividades concluídas aparecerão aqui.</p>}
      </div>
    </section>
  );
}
