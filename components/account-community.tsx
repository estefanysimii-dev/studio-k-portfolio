"use client";

import { useEffect, useState } from "react";
import { studioApi } from "@/lib/studio-api";
import { useStudio } from "./studio-provider";

export default function AccountCommunity(){
  const {state,refresh}=useStudio();
  const [name,setName]=useState(state.me.user?.name||"");
  const [caption,setCaption]=useState("");
  const [imageUrl,setImageUrl]=useState("");
  const [selected,setSelected]=useState<string[]>([]);
  const [notice,setNotice]=useState("");
  const [ranking,setRanking]=useState(state.personal?.leaderboardOptIn === true);
  useEffect(() => setRanking(state.personal?.leaderboardOptIn === true), [state.personal?.leaderboardOptIn]);
  if(!state.me.authenticated)return null;
  return <section className="account-community glass-panel">
    <div className="section-heading compact-heading"><div><span className="section-eyebrow">COMUNIDADE</span><h2>Participar do Studio K</h2></div><a className="btn btn-outline compact" href="/community">Abrir comunidade</a></div>
    <div className="account-community-grid">
      <div>
        <strong>Enviar screenshot para a galeria</strong>
        <p>Você envia, a equipe aprova na Central e só depois a imagem aparece publicamente.</p>
        <label>Nome<input value={name} onChange={e=>setName(e.target.value)}/></label>
        <label>URL da imagem<input value={imageUrl} onChange={e=>setImageUrl(e.target.value)} placeholder="https://..."/></label>
        <label>Legenda<textarea rows={2} value={caption} onChange={e=>setCaption(e.target.value)}/></label>
        <div className="community-product-picks">{state.products.slice(0,20).map(product=><label key={product.id}><input type="checkbox" checked={selected.includes(product.id)} onChange={e=>setSelected(e.target.checked?[...selected,product.id]:selected.filter(id=>id!==product.id))}/>{product.name}</label>)}</div>
        <button className="btn btn-primary compact" disabled={!name.trim()||!imageUrl.trim()} onClick={async()=>{try{await studioApi.submitGallery({name,caption,imageUrl,productIds:selected});setCaption("");setImageUrl("");setSelected([]);setNotice("Enviado para aprovação.");await refresh();}catch(err){setNotice(err instanceof Error?err.message:"Não foi possível enviar.");}}}>Enviar para aprovação</button>
        {notice&&<small>{notice}</small>}
      </div>
      <div>
        <strong>Ranking da comunidade</strong>
        <p>Participação opcional. Seu ID completo não é exposto publicamente.</p>
        <label className="ranking-optin"><input type="checkbox" checked={ranking} onChange={async e=>{setRanking(e.target.checked);await studioApi.setLeaderboardOptIn(e.target.checked);await refresh();}}/><span>Quero aparecer no ranking quando ele estiver ativado pela equipe.</span></label>
      </div>
    </div>
  </section>;
}
