"use client";

import { useState } from "react";
import { studioApi } from "@/lib/studio-api";
import { useStudio } from "./studio-provider";

export default function AccountMissions() {
  const { state, refresh } = useStudio();
  const [busy,setBusy]=useState("");
  const missions=state.personal?.missions||[];
  if(!state.me.authenticated||!missions.length)return null;
  return <section className="account-missions glass-panel">
    <div className="section-heading compact-heading"><div><span className="section-eyebrow">MISSÕES</span><h2>Ganhe XP participando do Studio K</h2></div></div>
    <div className="mission-grid">{missions.map(m=>{
      const pct=Math.max(0,Math.min(100,Math.round(((m.progress||0)/Math.max(1,m.target))*100)));
      return <article className={`mission-card ${m.claimed?"claimed":m.complete?"complete":""}`} key={m.id}>
        <div className="mission-head"><span>+{m.xp} XP</span>{m.claimed?<b>RESGATADA</b>:m.complete?<b>PRONTA</b>:<small>{m.progress||0}/{m.target}</small>}</div>
        <strong>{m.title}</strong><p>{m.description}</p>
        <div className="mission-progress"><i style={{width:`${pct}%`}}/></div>
        <button className="btn btn-outline compact" disabled={!m.complete||m.claimed||busy===m.id} onClick={async()=>{setBusy(m.id);try{await studioApi.claimMission(m.id);await refresh();}finally{setBusy("");}}}>{m.claimed?"Resgatada":m.complete?(busy===m.id?"Resgatando...":"Resgatar XP"):"Em progresso"}</button>
      </article>;
    })}</div>
  </section>;
}
