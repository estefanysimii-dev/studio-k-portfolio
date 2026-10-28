import type { StudioTranscriptMessage } from "@/lib/studio-types";
import UserAvatar from "./user-avatar";

const safeUrl=(value:string)=>{try{const url=new URL(value);return url.protocol==="https:"?url.href:"";}catch{return "";}};
export default function TicketTranscript({messages}:{messages:StudioTranscriptMessage[]}){
  return <section className="ticket-transcript-chat" aria-label="Histórico da conversa">
    {messages.map((message,index)=><article className={message.customer?"customer":"staff"} key={message.id||index}>
      <UserAvatar src={message.avatar} name={message.name} imageClassName="transcript-avatar" fallbackClassName="transcript-avatar ticket-avatar-fallback"/>
      <div className="transcript-bubble">
        <header><strong>{message.name}</strong><span className="transcript-role">{message.role?.name||(message.legacy?"Cargo não registrado":message.bot?"Sistema":"Membro")}</span><span>{message.bot?"Bot":message.customer?"Cliente":message.legacy?"Registro antigo":"Equipe"}{message.viaSite?" · pelo site":""}</span></header>
        <div className="transcript-identity">{message.username&&<span>@{message.username}</span>}{message.authorId&&<span>ID Discord: {message.authorId}</span>}{message.created&&!Number.isNaN(Date.parse(message.created))&&<time dateTime={message.created}>{new Intl.DateTimeFormat("pt-BR",{dateStyle:"short",timeStyle:"short"}).format(new Date(message.created))}</time>}</div>
        <p>{message.content}</p>
        {message.embeds?.map((embed,i)=><blockquote key={i}><strong>{embed.title}</strong><p>{embed.description}</p>{embed.fields.map((field,j)=><div key={j}><b>{field.name}</b><p>{field.value}</p></div>)}</blockquote>)}
        {message.attachments?.map((attachment,i)=>safeUrl(attachment.url)?<a href={safeUrl(attachment.url)} target="_blank" rel="noopener noreferrer" key={i}>{attachment.name}</a>:<span key={i}>{attachment.name}</span>)}
      </div>
    </article>)}
    <small>Os cargos são registrados no encerramento. Históricos antigos podem não conter essa informação.</small>
  </section>;
}
