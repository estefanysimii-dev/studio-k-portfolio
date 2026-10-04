"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import StudioShell from "@/components/studio-shell";
import ModelStage from "@/components/model-stage";
import { useStudio } from "@/components/studio-provider";
import { studioApi } from "@/lib/studio-api";

const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export default function ComparePage() {
  const { state } = useStudio();
  const params = useSearchParams();
  const [leftId,setLeftId]=useState(params.get("a")||"");
  const [rightId,setRightId]=useState(params.get("b")||"");
  const left=state.products.find(p=>p.id===leftId);
  const right=state.products.find(p=>p.id===rightId);

  useEffect(()=>{
    if(!leftId||!rightId||leftId===rightId)return;
    let sessionId=`compare-${Date.now()}`;try{sessionId=localStorage.getItem("studio-k-visitor-id")||sessionId}catch{}
    void studioApi.track({sessionId,event:"compare_open",itemKind:"page",path:"/compare",meta:{left:leftId,right:rightId}});
  },[leftId,rightId]);

  const rows=useMemo(()=>[
    ["Preço",left?.priceCents?money.format(left.priceCents/100):"—",right?.priceCents?money.format(right.priceCents/100):"—"],
    ["Categoria",left?.category||"—",right?.category||"—"],
    ["Modelo",left?.gender||"unisex",right?.gender||"unisex"],
    ["Neon / emissivo",left?.neon?"Sim":"Não",right?.neon?"Sim":"Não"],
    ["Variantes 3D",String(left?.viewerVariants?.length||0),String(right?.viewerVariants?.length||0)],
    ["Hotspots",String(left?.viewerHotspots?.length||0),String(right?.viewerHotspots?.length||0)],
    ["Disponibilidade",left?.available===false?"Esgotado":left?.remaining!=null?`${left.remaining} restante(s)`:"Disponível",right?.available===false?"Esgotado":right?.remaining!=null?`${right.remaining} restante(s)`:"Disponível"]
  ],[left,right]);

  return <StudioShell eyebrow="COMPARADOR" title="Comparar produtos">
    <div className="section-heading"><div><span className="section-eyebrow">STUDIO K LAB</span><h1 className="page-title">Comparador visual</h1><p className="page-subtitle">Escolha duas peças para analisar lado a lado em 3D e comparar seus atributos.</p></div></div>
    <div className="compare-selectors glass-panel">
      <label>Produto A<select value={leftId} onChange={e=>setLeftId(e.target.value)}><option value="">Selecione</option>{state.products.map(p=><option key={p.id} value={p.id} disabled={p.id===rightId}>{p.name}</option>)}</select></label>
      <span>VS</span>
      <label>Produto B<select value={rightId} onChange={e=>setRightId(e.target.value)}><option value="">Selecione</option>{state.products.map(p=><option key={p.id} value={p.id} disabled={p.id===leftId}>{p.name}</option>)}</select></label>
    </div>
    {left&&right?<><section className="compare-viewers">
      <div><h2>{left.name}</h2><ModelStage modelUrl={left.modelUrl} compareModelUrl={left.compareModelUrl} hotspots={left.viewerHotspots} viewerVariants={left.viewerVariants} posterUrl={left.coverUrl||left.gifUrl} title={left.name}/></div>
      <div><h2>{right.name}</h2><ModelStage modelUrl={right.modelUrl} compareModelUrl={right.compareModelUrl} hotspots={right.viewerHotspots} viewerVariants={right.viewerVariants} posterUrl={right.coverUrl||right.gifUrl} title={right.name}/></div>
    </section>
    <section className="compare-table glass-panel">{rows.map(([label,a,b])=><div key={label}><strong>{label}</strong><span>{a}</span><span>{b}</span></div>)}</section></>:<div className="empty-state glass-panel"><strong>Selecione dois produtos.</strong><span>Os dois viewers aparecerão aqui para comparação.</span></div>}
  </StudioShell>;
}
