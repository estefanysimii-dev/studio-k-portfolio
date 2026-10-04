"use client";

import { DragEvent, ChangeEvent, useEffect, useMemo, useState } from "react";
import { studioApi } from "@/lib/studio-api";
import { useStudio } from "./studio-provider";

const ALLOWED = new Set(["png","webp","jpeg","jpg","gif","mp4"]);
const MAX_BYTES = 80 * 1024 * 1024;
const ext = (name:string) => name.toLowerCase().split(".").pop() || "";

async function uploadCommunityMedia(file:File){
  const ticket = await studioApi.memberUploadTicket(file.name);
  const target = new URL(ticket.uploadUrl);
  target.searchParams.set("name", file.name);
  const response = await fetch(target,{
    method:"PUT",
    headers:{"Content-Type":file.type || "application/octet-stream"},
    body:file
  });
  const result = await response.json().catch(()=>({})) as {publicUrl?:string;error?:string};
  if(!response.ok || !result.publicUrl) throw new Error(result.error || "Não foi possível enviar o arquivo.");
  return result.publicUrl;
}

export default function AccountCommunity(){
  const {state,refresh}=useStudio();
  const [name,setName]=useState(state.me.user?.name||"");
  const [caption,setCaption]=useState("");
  const [mediaUrl,setMediaUrl]=useState("");
  const [fileName,setFileName]=useState("");
  const [fileType,setFileType]=useState("");
  const [fileSize,setFileSize]=useState(0);
  const [selected,setSelected]=useState<string[]>([]);
  const [notice,setNotice]=useState("");
  const [error,setError]=useState("");
  const [busy,setBusy]=useState(false);
  const [dragging,setDragging]=useState(false);
  const [ranking,setRanking]=useState(state.personal?.leaderboardOptIn === true);

  useEffect(() => setRanking(state.personal?.leaderboardOptIn === true), [state.personal?.leaderboardOptIn]);
  useEffect(()=>()=>{if(mediaUrl.startsWith("blob:"))URL.revokeObjectURL(mediaUrl);},[mediaUrl]);

  const isVideo=useMemo(()=>fileType==="video/mp4" || fileName.toLowerCase().endsWith(".mp4"),[fileType,fileName]);

  const chooseFile=async(file?:File)=>{
    if(!file)return;
    setNotice("");setError("");
    const extension=ext(file.name);
    if(!ALLOWED.has(extension)){setError("Formato inválido. Use PNG, WebP, JPEG, JPG, GIF ou MP4.");return;}
    if(file.size>MAX_BYTES){setError("O arquivo ultrapassa o limite de 80 MB.");return;}
    if(mediaUrl.startsWith("blob:"))URL.revokeObjectURL(mediaUrl);
    setFileName(file.name);setFileType(file.type);setFileSize(file.size);
    setMediaUrl(URL.createObjectURL(file));
  };

  const onInput=(e:ChangeEvent<HTMLInputElement>)=>{void chooseFile(e.target.files?.[0]);e.target.value="";};
  const onDrop=(e:DragEvent<HTMLLabelElement>)=>{e.preventDefault();setDragging(false);void chooseFile(e.dataTransfer.files?.[0]);};

  if(!state.me.authenticated)return null;
  return <section className="account-community glass-panel">
    <div className="section-heading compact-heading">
      <div><span className="section-eyebrow">COMUNIDADE</span><h2>Participar do Studio K</h2></div>
      <a className="btn btn-outline compact" href="/community">Abrir comunidade</a>
    </div>

    <div className="account-community-grid">
      <div>
        <strong>Enviar mídia para a galeria</strong>
        <p>Envie sua imagem, GIF ou vídeo diretamente. A equipe aprova na Central antes de aparecer publicamente.</p>

        <label>Nome<input value={name} onChange={e=>setName(e.target.value)}/></label>

        <label
          className={`community-dropzone ${dragging?"dragging":""}`}
          onDragOver={e=>{e.preventDefault();setDragging(true);}}
          onDragLeave={()=>setDragging(false)}
          onDrop={onDrop}
        >
          <input className="community-file-input" type="file" accept=".png,.webp,.jpeg,.jpg,.gif,.mp4" onChange={onInput}/>
          <div className="community-drop-icon">＋</div>
          <strong>{fileName ? "Trocar arquivo" : "Arraste seu arquivo aqui"}</strong>
          <span>{fileName ? fileName : "ou clique para selecionar · PNG, WebP, JPEG, JPG, GIF ou MP4"}</span>
          {fileName && <small>{(fileSize/1024/1024).toFixed(fileSize>1024*1024?1:2)} MB</small>}
        </label>

        {mediaUrl && <div className="community-media-preview">
          {isVideo ? <video src={mediaUrl} controls preload="metadata"/> : <img src={mediaUrl} alt="Pré-visualização do envio"/>}
          <button type="button" onClick={()=>{if(mediaUrl.startsWith("blob:"))URL.revokeObjectURL(mediaUrl);setMediaUrl("");setFileName("");setFileType("");setFileSize(0);}}>Remover</button>
        </div>}

        <label>Legenda<textarea rows={3} value={caption} onChange={e=>setCaption(e.target.value)}/></label>

        <div className="community-product-picks">{state.products.slice(0,20).map(product=><label key={product.id}><input type="checkbox" checked={selected.includes(product.id)} onChange={e=>setSelected(e.target.checked?[...selected,product.id]:selected.filter(id=>id!==product.id))}/>{product.name}</label>)}</div>

        <button className="btn btn-primary compact" disabled={!name.trim()||!fileName||busy} onClick={async()=>{
          setBusy(true);setError("");setNotice("");
          try{
            const input=document.querySelector<HTMLInputElement>(".community-file-input");
            const file=input?.files?.[0];
            let sourceFile=file;
            if(!sourceFile && mediaUrl.startsWith("blob:")){
              const blob=await fetch(mediaUrl).then(r=>r.blob());
              sourceFile=new File([blob],fileName,{type:fileType||blob.type});
            }
            if(!sourceFile)throw new Error("Selecione um arquivo antes de enviar.");
            const uploaded=await uploadCommunityMedia(sourceFile);
            await studioApi.submitGallery({name,caption,imageUrl:uploaded,productIds:selected});
            if(mediaUrl.startsWith("blob:"))URL.revokeObjectURL(mediaUrl);
            setCaption("");setMediaUrl("");setFileName("");setFileType("");setFileSize(0);setSelected([]);
            setNotice("Enviado para aprovação.");
            await refresh();
          }catch(err){setError(err instanceof Error?err.message:"Não foi possível enviar.");}
          finally{setBusy(false);}
        }}>{busy?"Enviando...":"Enviar para aprovação"}</button>

        {notice&&<small className="community-submit-notice success">{notice}</small>}
        {error&&<small className="community-submit-notice error">{error}</small>}
      </div>

      <div>
        <strong>Ranking da comunidade</strong>
        <p>Participação opcional. Seu ID completo não é exposto publicamente.</p>
        <label className="ranking-optin"><input type="checkbox" checked={ranking} onChange={async e=>{setRanking(e.target.checked);await studioApi.setLeaderboardOptIn(e.target.checked);await refresh();}}/><span>Quero aparecer no ranking quando ele estiver ativado pela equipe.</span></label>
      </div>
    </div>
  </section>;
}
