"use client";

import { useEffect,useState } from "react";
import { studioApi } from "@/lib/studio-api";
import type { StudioTicket, StudioTicketMessage } from "@/lib/studio-types";

const statusLabel:Record<string,string>={open:"Aberto",closed:"Finalizado"};
const stateLabel:Record<string,string>={waiting_staff:"Aguardando equipe",in_progress:"Em atendimento",waiting_customer:"Aguardando você",escalated:"Escalado",closed:"Finalizado"};

export default function AccountTickets(){
  const [tickets,setTickets]=useState<StudioTicket[]>([]);
  const [selected,setSelected]=useState("");
  const [messages,setMessages]=useState<StudioTicketMessage[]>([]);
  const [reply,setReply]=useState("");
  const [transcript,setTranscript]=useState("");
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState("");

  const load=async()=>{try{const r=await studioApi.myTickets();setTickets(r.tickets);}catch{}};
  const loadMessages=async(id:string)=>{setSelected(id);setTranscript("");setError("");try{const r=await studioApi.ticketMessages(id);setMessages(r.messages);}catch(err){setMessages([]);setError(err instanceof Error?err.message:"Não foi possível carregar as mensagens.");}};
  useEffect(()=>{void load();},[]);

  const current=tickets.find(t=>t.id===selected);
  return <section className="account-tickets glass-panel">
    <div className="section-heading compact-heading"><div><span className="section-eyebrow">ATENDIMENTOS</span><h2>Central de tickets</h2></div><button className="btn btn-outline compact" onClick={()=>void load()}>Atualizar</button></div>
    <div className="ticket-account-layout">
      <div className="ticket-account-list">{tickets.length?tickets.map(ticket=><button key={ticket.id} type="button" className={selected===ticket.id?"active":""} onClick={()=>void loadMessages(ticket.id)}>
        <div><strong>{ticket.category}</strong><span>#{ticket.id.slice(0,8)}</span></div>
        <small>{statusLabel[ticket.status]||ticket.status} · {stateLabel[ticket.state]||ticket.state}</small>
        <em>{new Intl.DateTimeFormat("pt-BR",{dateStyle:"short",timeStyle:"short"}).format(new Date(ticket.updated))}</em>
      </button>):<p className="muted">Nenhum atendimento vinculado à sua conta.</p>}</div>
      <div className="ticket-account-thread">
        {current?<><div className="ticket-thread-head"><div><strong>{current.category}</strong><span>{stateLabel[current.state]||current.state} · prioridade {current.priority}{current.claimedName ? ` · responsável: ${current.claimedName}` : ""}</span></div>{current.transcriptAvailable&&<button className="btn btn-outline compact" type="button" onClick={async()=>{try{const result=await studioApi.ticketTranscript(current.id);setTranscript(result.transcript);}catch(err){setError(err instanceof Error?err.message:"Não foi possível abrir o transcript.");}}}>Ver transcript</button>}</div>
        <div className="ticket-message-list">{messages.length?messages.map(message=><article className={message.customer?"mine":""} key={message.id}>{message.avatar&&<img src={message.avatar} alt=""/>}<div><strong>{message.author}</strong><p>{message.content}</p>{message.attachments.map(a=><a href={a.url} target="_blank" rel="noreferrer" key={a.url}>{a.name}</a>)}<small>{new Intl.DateTimeFormat("pt-BR",{dateStyle:"short",timeStyle:"short"}).format(new Date(message.created))}</small></div></article>):<p className="muted">{current.status==="open"?"Nenhuma mensagem carregada.":"Ticket finalizado."}</p>}</div>
        {transcript&&<div className="ticket-transcript"><div><strong>Transcript completo</strong><button type="button" onClick={()=>setTranscript("")}>Fechar</button></div><pre>{transcript}</pre></div>}
        {current.status==="open"&&<form className="ticket-reply" onSubmit={async e=>{e.preventDefault();if(!reply.trim())return;setBusy(true);setError("");try{await studioApi.replyTicket(current.id,reply);setReply("");await loadMessages(current.id);await load();}catch(err){setError(err instanceof Error?err.message:"Não foi possível responder.");}finally{setBusy(false);}}}><textarea rows={3} value={reply} onChange={e=>setReply(e.target.value)} placeholder="Escreva sua resposta para a equipe..."/><button className="btn btn-primary compact" disabled={busy}>{busy?"Enviando...":"Enviar resposta"}</button></form>}</>:<div className="ticket-thread-empty">Selecione um atendimento para abrir a conversa.</div>}
        {error&&<div className="control-notice error">{error}</div>}
      </div>
    </div>
  </section>;
}
