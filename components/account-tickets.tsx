"use client";

import { useEffect,useState } from "react";
import { studioApi } from "@/lib/studio-api";
import { useStudio } from "./studio-provider";
import type { StudioTicket, StudioTicketMessage } from "@/lib/studio-types";

const statusLabel:Record<string,string>={open:"Aberto",closed:"Finalizado"};
const stateLabel:Record<string,string>={waiting_staff:"Aguardando equipe",in_progress:"Em atendimento",waiting_customer:"Aguardando você",escalated:"Escalado",closed:"Finalizado"};

export default function AccountTickets(){
  const { state, refresh } = useStudio();
  const categories = state.personal?.ticketCategories || ["Suporte"];
  const [newCategory,setNewCategory]=useState(categories[0] || "Suporte");
  const [tickets,setTickets]=useState<StudioTicket[]>([]);
  const [selected,setSelected]=useState("");
  const [messages,setMessages]=useState<StudioTicketMessage[]>([]);
  const [reply,setReply]=useState("");
  const [transcript,setTranscript]=useState("");
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState("");
  const [open,setOpen]=useState(false);

  useEffect(() => {
    if (categories.length && !categories.includes(newCategory)) setNewCategory(categories[0]);
  }, [categories, newCategory]);

  const load=async()=>{try{const r=await studioApi.myTickets();setTickets(r.tickets);return r.tickets;}catch{return [];}};
  const loadMessages=async(id:string)=>{setSelected(id);setTranscript("");setError("");try{const r=await studioApi.ticketMessages(id);setMessages(r.messages);}catch(err){setMessages([]);setError(err instanceof Error?err.message:"Não foi possível carregar as mensagens.");}};
  useEffect(()=>{void load();},[]);

  if(!state.me.authenticated)return null;
  const current=tickets.find(t=>t.id===selected);
  const openCount=tickets.filter(t=>t.status==="open").length;

  return <>
    <button type="button" className="ticket-floating-launcher" onClick={async()=>{setOpen(v=>!v);if(!open)await load();}}>
      <span>Atendimento</span>
      <strong>{openCount ? `${openCount} aberto${openCount>1?"s":""}` : "Abrir ticket"}</strong>
    </button>

    {open&&<aside className="ticket-floating-panel glass-panel" aria-label="Atendimento Studio K">
      <div className="ticket-floating-head">
        <div>
          <span className="section-eyebrow">SUPORTE STUDIO K</span>
          <h2>Central de tickets</h2>
        </div>
        <button type="button" aria-label="Minimizar atendimento" onClick={()=>setOpen(false)}>—</button>
      </div>

      <div className="ticket-create-row">
        <select value={newCategory} onChange={e=>setNewCategory(e.target.value)}>
          {categories.map(category=><option value={category} key={category}>{category}</option>)}
        </select>
        <button className="btn btn-primary compact" disabled={busy} onClick={async()=>{
          setBusy(true);setError("");
          try{
            const created=await studioApi.createTicket(newCategory);
            const list=await load();
            await refresh();
            const id=created.ticket.id || list[0]?.id || "";
            if(id)await loadMessages(id);
          }catch(err){setError(err instanceof Error?err.message:"Não foi possível abrir o ticket.");}
          finally{setBusy(false);}
        }}>+ Abrir ticket</button>
      </div>

      <div className="ticket-floating-body">
        <div className="ticket-account-list">
          {tickets.length?tickets.map(ticket=><button key={ticket.id} type="button" className={selected===ticket.id?"active":""} onClick={()=>void loadMessages(ticket.id)}>
            <div><strong>{ticket.category}</strong><span>#{ticket.id.slice(0,8)}</span></div>
            <small>{statusLabel[ticket.status]||ticket.status} · {stateLabel[ticket.state]||ticket.state}</small>
            <em>{new Intl.DateTimeFormat("pt-BR",{dateStyle:"short",timeStyle:"short"}).format(new Date(ticket.updated))}</em>
          </button>):<p className="muted">Nenhum atendimento vinculado à sua conta.</p>}
        </div>

        <div className="ticket-account-thread">
          {current?<>
            <div className="ticket-thread-head">
              <div><strong>{current.category}</strong><span>{stateLabel[current.state]||current.state} · prioridade {current.priority}{current.claimedName ? ` · responsável: ${current.claimedName}` : ""}</span></div>
              {current.transcriptAvailable&&<button className="btn btn-outline compact" type="button" onClick={async()=>{try{const result=await studioApi.ticketTranscript(current.id);setTranscript(result.transcript);}catch(err){setError(err instanceof Error?err.message:"Não foi possível abrir o transcript.");}}}>Transcript</button>}
            </div>

            <div className="ticket-message-list">
              {messages.length?messages.map(message=><article className={message.customer?"mine":""} key={message.id}>
                {message.avatar&&<img src={message.avatar} alt=""/>}
                <div><strong>{message.author}</strong><p>{message.content}</p>{message.attachments.map(a=><a href={a.url} target="_blank" rel="noreferrer" key={a.url}>{a.name}</a>)}<small>{new Intl.DateTimeFormat("pt-BR",{dateStyle:"short",timeStyle:"short"}).format(new Date(message.created))}</small></div>
              </article>):<p className="muted">{current.status==="open"?"Nenhuma mensagem carregada.":"Ticket finalizado."}</p>}
            </div>

            {transcript&&<div className="ticket-transcript"><div><strong>Transcript completo</strong><button type="button" onClick={()=>setTranscript("")}>Fechar</button></div><pre>{transcript}</pre></div>}

            {current.status==="open"&&<form className="ticket-reply" onSubmit={async e=>{
              e.preventDefault();if(!reply.trim())return;setBusy(true);setError("");
              try{await studioApi.replyTicket(current.id,reply);setReply("");await loadMessages(current.id);await load();}
              catch(err){setError(err instanceof Error?err.message:"Não foi possível responder.");}
              finally{setBusy(false);}
            }}>
              <textarea rows={3} value={reply} onChange={e=>setReply(e.target.value)} placeholder="Escreva sua resposta para a equipe..."/>
              <button className="btn btn-primary compact" disabled={busy}>{busy?"Enviando...":"Enviar resposta"}</button>
            </form>}
          </>:<div className="ticket-thread-empty">Selecione um atendimento ou abra um novo ticket.</div>}
          {error&&<div className="control-notice error">{error}</div>}
        </div>
      </div>
    </aside>}
  </>;
}
