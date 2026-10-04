"use client";

import { useMemo, useState } from "react";
import { studioApi } from "@/lib/studio-api";
import type {
  StudioBanner, StudioBundle, StudioCollection, StudioCommerceState, StudioGalleryItem,
  StudioItem, StudioLookbook, StudioMission, StudioProduct, StudioRoleBenefit, StudioSchedule
} from "@/lib/studio-types";

type Props = {
  commerce: StudioCommerceState;
  products: StudioProduct[];
  items: StudioItem[];
  roles: { id: string; name: string }[];
  versions?: { id: string; entityType: string; entityId: string; actor: string; action: string; created: string; before: unknown; after: unknown }[];
  onChanged: () => Promise<void> | void;
  onNotice?: (message: string) => void;
  onError?: (message: string) => void;
};

type Section = "bundles" | "collections" | "missions" | "benefits" | "banners" | "schedules" | "automation" | "gallery" | "lookbooks" | "history";

const emptyBundle = (): StudioBundle => ({ id:"",name:"",description:"",productIds:[],minItems:2,discountType:"percent",discountValue:10,tiers:[],giftProductId:"",active:true });
const emptyCollection = (): StudioCollection => ({ id:"",name:"",slug:"",description:"",coverUrl:"",productIds:[],itemIds:[],active:true,startsAt:"",endsAt:"" });
const emptyMission = (): StudioMission => ({ id:"",title:"",description:"",type:"favorite_products",target:1,targetId:"",xp:50,active:true,startsAt:"",endsAt:"" });
const emptyBenefit = (): StudioRoleBenefit => ({ id:"",roleId:"",label:"",discountPercent:10,stackWithCoupon:false,productIds:[],excludedProductIds:[],collectionIds:[],active:true });
const emptyBanner = (): StudioBanner => ({ id:"",title:"",text:"",imageUrl:"",href:"",placement:"all",pages:[],active:true,startsAt:"",endsAt:"" });
const emptySchedule = (): StudioSchedule => ({ id:"",kind:"product_publish",targetId:"",runAt:new Date(Date.now()+3600000).toISOString(),status:"scheduled",error:"" });
const emptyLookbook = (): StudioLookbook => ({ id:"",name:"",description:"",coverUrl:"",productIds:[],active:true });

const localValue = (iso?: string) => {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const pad=(n:number)=>String(n).padStart(2,"0");
  return `${date.getFullYear()}-${pad(date.getMonth()+1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};
const isoValue = (local: string) => local ? new Date(local).toISOString() : "";

function MultiProducts({ selected, products, onChange }: { selected:string[]; products:StudioProduct[]; onChange:(ids:string[])=>void }) {
  return <div className="commerce-check-grid">{products.map((p)=><label key={p.id}><input type="checkbox" checked={selected.includes(p.id)} onChange={(e)=>onChange(e.target.checked?[...selected,p.id]:selected.filter(id=>id!==p.id))}/><span>{p.name}</span></label>)}</div>;
}

export default function CommerceControl({ commerce, products, items, roles, versions=[], onChanged, onNotice, onError }: Props) {
  const [section,setSection]=useState<Section>("bundles");
  const [busy,setBusy]=useState(false);
  const [bundle,setBundle]=useState<StudioBundle>(emptyBundle);
  const [collection,setCollection]=useState<StudioCollection>(emptyCollection);
  const [mission,setMission]=useState<StudioMission>(emptyMission);
  const [benefit,setBenefit]=useState<StudioRoleBenefit>(emptyBenefit);
  const [banner,setBanner]=useState<StudioBanner>(emptyBanner);
  const [schedule,setSchedule]=useState<StudioSchedule>(emptySchedule);
  const [lookbook,setLookbook]=useState<StudioLookbook>(emptyLookbook);
  const [feedbackAutomation,setFeedbackAutomation]=useState(commerce.feedbackAutomation || { enabled:true,delayHours:24 });

  const save = async (kind:string, body:unknown, reset:()=>void) => {
    setBusy(true);
    try {
      await studioApi.saveCommerce(kind, body);
      reset();
      onNotice?.("Configuração salva.");
      await onChanged();
    } catch (err) {
      onError?.(err instanceof Error ? err.message : "Não foi possível salvar.");
    } finally { setBusy(false); }
  };
  const remove = async (kind:string,id:string) => {
    if (!window.confirm("Excluir este item?")) return;
    setBusy(true);
    try { await studioApi.deleteCommerce(kind,id); await onChanged(); onNotice?.("Item removido."); }
    catch(err){ onError?.(err instanceof Error?err.message:"Não foi possível excluir."); }
    finally{setBusy(false);}
  };
  const targetOptions = useMemo(() => ({
    product: products.map((p)=>({id:p.id,name:p.name})),
    collection: commerce.collections.map((x)=>({id:x.id,name:x.name})),
    banner: commerce.banners.map((x)=>({id:x.id,name:x.title}))
  }), [products,commerce.collections,commerce.banners]);

  return (
    <div className="commerce-control">
      <section className="control-form glass-panel">
        <div className="form-heading"><div><span className="section-eyebrow">COMMERCE HUB</span><h2>Loja, retenção e conteúdo</h2><p>Combos, coleções, missões, benefícios, banners, agendamentos, comunidade e histórico num único lugar.</p></div></div>
        <div className="commerce-tabs">
          {([
            ["bundles","Combos"],["collections","Coleções"],["missions","Missões"],["benefits","Benefícios Discord"],["banners","Banners"],
            ["schedules","Agendador"],["automation","Automação"],["gallery","Galeria"],["lookbooks","Lookbooks"],["history","Histórico"]
          ] as [Section,string][]).map(([key,label])=><button type="button" key={key} className={section===key?"active":""} onClick={()=>setSection(key)}>{label}</button>)}
        </div>
      </section>

      {section==="bundles" && <section className="control-form glass-panel commerce-editor">
        <div className="form-heading"><div><span className="section-eyebrow">COMBOS</span><h2>Combo Manager</h2><p>Crie desconto automático quando a combinação estiver no carrinho.</p></div></div>
        <div className="form-grid two">
          <label>Nome<input value={bundle.name} onChange={e=>setBundle({...bundle,name:e.target.value})}/></label>
          <label>Mínimo de itens<input type="number" min={2} value={bundle.minItems} onChange={e=>setBundle({...bundle,minItems:Number(e.target.value)||2})}/></label>
          <label>Tipo<select value={bundle.discountType} onChange={e=>setBundle({...bundle,discountType:e.target.value as "percent"|"fixed"})}><option value="percent">Percentual</option><option value="fixed">Valor fixo (centavos)</option></select></label>
          <label>Desconto<input type="number" min={0} value={bundle.discountValue} onChange={e=>setBundle({...bundle,discountValue:Number(e.target.value)||0})}/></label>
          <label className="span-2">Descrição<textarea rows={2} value={bundle.description} onChange={e=>setBundle({...bundle,description:e.target.value})}/></label>
          <label className="span-2">Faixas progressivas
            <textarea
              rows={4}
              value={(bundle.tiers || []).map((tier) => `${tier.minItems} | ${tier.discountType} | ${tier.discountValue}`).join("\n")}
              onChange={(e)=>setBundle({...bundle,tiers:e.target.value.split("\n").map((line)=>{
                const [minItemsRaw,typeRaw,valueRaw]=line.split("|").map(part=>part.trim());
                const minItems=Number(minItemsRaw),discountValue=Number(valueRaw);
                if(!Number.isFinite(minItems)||minItems<2||!Number.isFinite(discountValue))return null;
                return{minItems:Math.round(minItems),discountType:typeRaw==="fixed"?"fixed" as const:"percent" as const,discountValue:Math.max(0,Math.round(discountValue))};
              }).filter((tier):tier is NonNullable<typeof tier>=>Boolean(tier))})}
              placeholder={"2 | percent | 5\n3 | percent | 10\n4 | percent | 15"}
            />
            <small>Formato: quantidade | percent/fixed | valor. Se houver faixas, a melhor alcançada substitui o desconto simples.</small>
          </label>
          <label className="span-2">Produto grátis ao atingir o combo
            <select value={bundle.giftProductId || ""} onChange={(e)=>setBundle({...bundle,giftProductId:e.target.value})}>
              <option value="">Sem brinde automático</option>
              {products.map((product)=><option value={product.id} key={product.id}>{product.name}</option>)}
            </select>
            <small>Quando a meta mínima do combo for atingida, este produto entra no pedido com valor R$ 0,00.</small>
          </label>
        </div>
        <span className="section-eyebrow">PRODUTOS DO COMBO</span><MultiProducts selected={bundle.productIds} products={products} onChange={productIds=>setBundle({...bundle,productIds})}/>
        <button className="btn btn-primary" disabled={busy||bundle.productIds.length<2||!bundle.name} onClick={()=>void save("bundles",bundle,()=>setBundle(emptyBundle()))}>{bundle.id?"Salvar combo":"Criar combo"}</button>
        <div className="commerce-list">{commerce.bundles.map(x=><article key={x.id}><div><strong>{x.name}</strong><span>{x.productIds.length} produtos · {x.discountType==="percent"?x.discountValue+"%":(x.discountValue/100).toLocaleString("pt-BR",{style:"currency",currency:"BRL"})}</span></div><div><button onClick={()=>setBundle(x)}>Editar</button><button className="danger" onClick={()=>void remove("bundles",x.id)}>Excluir</button></div></article>)}</div>
      </section>}

      {section==="collections" && <section className="control-form glass-panel commerce-editor">
        <div className="form-heading"><div><span className="section-eyebrow">COLEÇÕES</span><h2>Collection Manager</h2></div></div>
        <div className="form-grid two">
          <label>Nome<input value={collection.name} onChange={e=>setCollection({...collection,name:e.target.value,slug:collection.id?collection.slug:e.target.value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"")})}/></label>
          <label>Slug<input value={collection.slug} onChange={e=>setCollection({...collection,slug:e.target.value.toLowerCase().replace(/[^a-z0-9-]/g,"")})}/></label>
          <label className="span-2">Descrição<textarea rows={3} value={collection.description} onChange={e=>setCollection({...collection,description:e.target.value})}/></label>
          <label className="span-2">Capa<input value={collection.coverUrl} onChange={e=>setCollection({...collection,coverUrl:e.target.value})}/></label>
          <label>Começa<input type="datetime-local" value={localValue(collection.startsAt)} onChange={e=>setCollection({...collection,startsAt:isoValue(e.target.value)})}/></label>
          <label>Termina<input type="datetime-local" value={localValue(collection.endsAt)} onChange={e=>setCollection({...collection,endsAt:isoValue(e.target.value)})}/></label>
        </div>
        <span className="section-eyebrow">PRODUTOS</span><MultiProducts selected={collection.productIds} products={products} onChange={productIds=>setCollection({...collection,productIds})}/>
        <div className="commerce-check-grid">{items.map(item=><label key={item.id}><input type="checkbox" checked={collection.itemIds.includes(item.id)} onChange={e=>setCollection({...collection,itemIds:e.target.checked?[...collection.itemIds,item.id]:collection.itemIds.filter(id=>id!==item.id)})}/><span>{item.name} · portfólio</span></label>)}</div>
        <button className="btn btn-primary" disabled={busy||!collection.name||!collection.slug} onClick={()=>void save("collections",collection,()=>setCollection(emptyCollection()))}>{collection.id?"Salvar coleção":"Criar coleção"}</button>
        <div className="commerce-list">{commerce.collections.map(x=><article key={x.id}><div><strong>{x.name}</strong><span>/{x.slug} · {x.productIds.length} produtos</span></div><div><a href={`/collections/${x.slug}`} target="_blank">Abrir</a><button onClick={()=>setCollection(x)}>Editar</button><button className="danger" onClick={()=>void remove("collections",x.id)}>Excluir</button></div></article>)}</div>
      </section>}

      {section==="missions" && <section className="control-form glass-panel commerce-editor">
        <div className="form-heading"><div><span className="section-eyebrow">MISSÕES</span><h2>Missões Studio K</h2></div></div>
        <div className="form-grid two">
          <label>Título<input value={mission.title} onChange={e=>setMission({...mission,title:e.target.value})}/></label>
          <label>Tipo<select value={mission.type} onChange={e=>setMission({...mission,type:e.target.value as StudioMission["type"]})}><option value="favorite_products">Favoritar produtos</option><option value="purchases">Compras</option><option value="feedbacks">Feedbacks</option><option value="join_discord">Entrar no Discord</option><option value="view_product">Ver produto</option><option value="visit_path">Visitar página</option></select></label>
          <label>Meta<input type="number" min={1} value={mission.target} onChange={e=>setMission({...mission,target:Number(e.target.value)||1})}/></label>
          <label>XP de recompensa<input type="number" min={0} value={mission.xp} onChange={e=>setMission({...mission,xp:Number(e.target.value)||0})}/></label>
          <label>Produto / caminho alvo<input value={mission.targetId} onChange={e=>setMission({...mission,targetId:e.target.value})} placeholder="/products ou ID do produto"/></label>
          <label className="span-2">Descrição<textarea rows={2} value={mission.description} onChange={e=>setMission({...mission,description:e.target.value})}/></label>
        </div>
        <button className="btn btn-primary" disabled={busy||!mission.title} onClick={()=>void save("missions",mission,()=>setMission(emptyMission()))}>{mission.id?"Salvar missão":"Criar missão"}</button>
        <div className="commerce-list">{commerce.missions.map(x=><article key={x.id}><div><strong>{x.title}</strong><span>{x.type} · meta {x.target} · +{x.xp} XP</span></div><div><button onClick={()=>setMission(x)}>Editar</button><button className="danger" onClick={()=>void remove("missions",x.id)}>Excluir</button></div></article>)}</div>
      </section>}

      {section==="benefits" && <section className="control-form glass-panel commerce-editor">
        <div className="form-heading"><div><span className="section-eyebrow">DISCORD</span><h2>Benefícios automáticos por cargo</h2></div></div>
        <div className="form-grid two">
          <label>Cargo<select value={benefit.roleId} onChange={e=>setBenefit({...benefit,roleId:e.target.value})}><option value="">Selecione</option>{roles.map(role=><option value={role.id} key={role.id}>{role.name}</option>)}</select></label>
          <label>Nome do benefício<input value={benefit.label} onChange={e=>setBenefit({...benefit,label:e.target.value})} placeholder="Supporter 15%"/></label>
          <label>Desconto (%)<input type="number" min={0} max={100} value={benefit.discountPercent} onChange={e=>setBenefit({...benefit,discountPercent:Number(e.target.value)||0})}/></label>
          <label className="check-field"><input type="checkbox" checked={benefit.stackWithCoupon} onChange={e=>setBenefit({...benefit,stackWithCoupon:e.target.checked})}/> Pode acumular com cupom</label>
        </div>
        <span className="section-eyebrow">APLICAR SOMENTE A PRODUTOS (VAZIO = QUALQUER PRODUTO)</span>
        <MultiProducts selected={benefit.productIds} products={products} onChange={productIds=>setBenefit({...benefit,productIds})}/>

        <span className="section-eyebrow">COLEÇÕES VÁLIDAS</span>
        <div className="commerce-check-grid">
          {commerce.collections.map((collection)=><label key={collection.id}><input type="checkbox" checked={benefit.collectionIds.includes(collection.id)} onChange={(e)=>setBenefit({...benefit,collectionIds:e.target.checked?[...benefit.collectionIds,collection.id]:benefit.collectionIds.filter(id=>id!==collection.id)})}/><span>{collection.name}</span></label>)}
          {!commerce.collections.length && <span className="muted">Crie uma coleção para restringir o benefício por coleção.</span>}
        </div>

        <span className="section-eyebrow">PRODUTOS EXCLUÍDOS</span>
        <MultiProducts selected={benefit.excludedProductIds || []} products={products} onChange={excludedProductIds=>setBenefit({...benefit,excludedProductIds})}/>

        <button className="btn btn-primary" disabled={busy||!benefit.roleId||!benefit.label} onClick={()=>void save("roleBenefits",benefit,()=>setBenefit(emptyBenefit()))}>{benefit.id?"Salvar benefício":"Criar benefício"}</button>
        <div className="commerce-list">{(commerce.roleBenefits||[]).map(x=><article key={x.id}><div><strong>{x.label}</strong><span>{x.discountPercent}% · {roles.find(r=>r.id===x.roleId)?.name||x.roleId}</span></div><div><button onClick={()=>setBenefit(x)}>Editar</button><button className="danger" onClick={()=>void remove("roleBenefits",x.id)}>Excluir</button></div></article>)}</div>
      </section>}

      {section==="banners" && <section className="control-form glass-panel commerce-editor">
        <div className="form-heading"><div><span className="section-eyebrow">BANNERS</span><h2>Banner Manager</h2></div></div>
        <div className="form-grid two">
          <label>Título<input value={banner.title} onChange={e=>setBanner({...banner,title:e.target.value})}/></label>
          <label>Local<select value={banner.placement} onChange={e=>setBanner({...banner,placement:e.target.value as StudioBanner["placement"]})}><option value="all">Site inteiro</option><option value="home">Home</option><option value="products">Produtos</option><option value="portfolio">Portfólio</option><option value="popup">Pop-up</option><option value="specific">Páginas específicas</option></select></label>
          <label className="span-2">Texto<textarea rows={2} value={banner.text} onChange={e=>setBanner({...banner,text:e.target.value})}/></label>
          <label>Imagem<input value={banner.imageUrl} onChange={e=>setBanner({...banner,imageUrl:e.target.value})}/></label>
          <label>Destino<input value={banner.href} onChange={e=>setBanner({...banner,href:e.target.value})}/></label>
          {banner.placement === "specific" && <label className="span-2">Páginas específicas
            <input value={(banner.pages || []).join(", ")} onChange={(e)=>setBanner({...banner,pages:e.target.value.split(",").map(item=>item.trim()).filter(Boolean)})} placeholder="/account, /products/*, /collections/neon"/>
            <small>Separe por vírgula. Use * no final para incluir páginas filhas.</small>
          </label>}
          <label>Começa<input type="datetime-local" value={localValue(banner.startsAt)} onChange={e=>setBanner({...banner,startsAt:isoValue(e.target.value)})}/></label>
          <label>Termina<input type="datetime-local" value={localValue(banner.endsAt)} onChange={e=>setBanner({...banner,endsAt:isoValue(e.target.value)})}/></label>
        </div>
        <button className="btn btn-primary" disabled={busy||!banner.title} onClick={()=>void save("banners",banner,()=>setBanner(emptyBanner()))}>{banner.id?"Salvar banner":"Criar banner"}</button>
        <div className="commerce-list">{commerce.banners.map(x=><article key={x.id}><div><strong>{x.title}</strong><span>{x.placement}</span></div><div><button onClick={()=>setBanner(x)}>Editar</button><button className="danger" onClick={()=>void remove("banners",x.id)}>Excluir</button></div></article>)}</div>
      </section>}

      {section==="schedules" && <section className="control-form glass-panel commerce-editor">
        <div className="form-heading"><div><span className="section-eyebrow">AGENDADOR UNIVERSAL</span><h2>Automatize publicações</h2></div></div>
        <div className="form-grid two">
          <label>Ação<select value={schedule.kind} onChange={e=>setSchedule({...schedule,kind:e.target.value as StudioSchedule["kind"],targetId:""})}><option value="product_publish">Publicar produto</option><option value="product_unpublish">Ocultar produto</option><option value="collection_activate">Ativar coleção</option><option value="collection_deactivate">Desativar coleção</option><option value="banner_activate">Ativar banner</option><option value="banner_deactivate">Desativar banner</option></select></label>
          <label>Executar em<input type="datetime-local" value={localValue(schedule.runAt)} onChange={e=>setSchedule({...schedule,runAt:isoValue(e.target.value)})}/></label>
          <label className="span-2">Alvo<select value={schedule.targetId} onChange={e=>setSchedule({...schedule,targetId:e.target.value})}><option value="">Selecione</option>{(schedule.kind.startsWith("product")?targetOptions.product:schedule.kind.startsWith("collection")?targetOptions.collection:targetOptions.banner).map(x=><option value={x.id} key={x.id}>{x.name}</option>)}</select></label>
        </div>
        <button className="btn btn-primary" disabled={busy||!schedule.targetId||!schedule.runAt} onClick={()=>void save("schedules",schedule,()=>setSchedule(emptySchedule()))}>Agendar</button>
        <div className="commerce-list">{(commerce.schedules||[]).map(x=><article key={x.id}><div><strong>{x.kind.replaceAll("_"," ")}</strong><span>{new Intl.DateTimeFormat("pt-BR",{dateStyle:"short",timeStyle:"short"}).format(new Date(x.runAt))} · {x.status}</span></div><div><button className="danger" onClick={()=>void remove("schedules",x.id)}>Excluir</button></div></article>)}</div>
      </section>}

      {section==="automation" && <section className="control-form glass-panel commerce-editor">
        <div className="form-heading">
          <div>
            <span className="section-eyebrow">AUTOMAÇÃO</span>
            <h2>Pós-compra e retenção</h2>
            <p>Defina quando o bot pede feedback depois de uma entrega digital.</p>
          </div>
        </div>
        <div className="form-grid two">
          <label className="check-field">
            <input type="checkbox" checked={feedbackAutomation.enabled} onChange={e=>setFeedbackAutomation({...feedbackAutomation,enabled:e.target.checked})}/>
            Solicitar feedback automaticamente
          </label>
          <label>Aguardar após a entrega (horas)
            <input type="number" min={0} max={720} value={feedbackAutomation.delayHours} onChange={e=>setFeedbackAutomation({...feedbackAutomation,delayHours:Math.max(0,Math.min(720,Number(e.target.value)||0))})}/>
            <small>0 = o botão de avaliação acompanha a entrega. Ex.: 24 = pedir no dia seguinte.</small>
          </label>
        </div>
        <button className="btn btn-primary" type="button" onClick={async()=>{try{const saved=await studioApi.saveFeedbackAutomation(feedbackAutomation);setFeedbackAutomation(saved);onNotice?.("Automação de feedback salva.");await onChanged();}catch(err){onError?.(err instanceof Error?err.message:"Não foi possível salvar.");}}}>Salvar automação</button>
      </section>}

      {section==="gallery" && <section className="control-form glass-panel commerce-editor">
        <div className="form-heading"><div><span className="section-eyebrow">GALERIA</span><h2>Aprovação da comunidade</h2></div></div>
        <div className="gallery-moderation-list">{commerce.gallery.length?commerce.gallery.map((x:StudioGalleryItem)=><article key={x.id}><img src={x.imageUrl} alt=""/><div><strong>{x.name}</strong><p>{x.caption}</p><span>{x.status}</span></div><div><button onClick={()=>void save("gallery",{...x,status:"approved"},()=>{})}>Aprovar</button><button onClick={()=>void save("gallery",{...x,status:"rejected"},()=>{})}>Rejeitar</button><button className="danger" onClick={()=>void remove("gallery",x.id)}>Excluir</button></div></article>):<p className="muted">Nenhum envio da comunidade.</p>}</div>
      </section>}

      {section==="lookbooks" && <section className="control-form glass-panel commerce-editor">
        <div className="form-heading"><div><span className="section-eyebrow">LOOKBOOK</span><h2>Montar combinações</h2></div></div>
        <div className="form-grid two"><label>Nome<input value={lookbook.name} onChange={e=>setLookbook({...lookbook,name:e.target.value})}/></label><label>Capa<input value={lookbook.coverUrl} onChange={e=>setLookbook({...lookbook,coverUrl:e.target.value})}/></label><label className="span-2">Descrição<textarea rows={2} value={lookbook.description} onChange={e=>setLookbook({...lookbook,description:e.target.value})}/></label></div>
        <MultiProducts selected={lookbook.productIds} products={products} onChange={productIds=>setLookbook({...lookbook,productIds})}/>
        <button className="btn btn-primary" disabled={busy||!lookbook.name||!lookbook.productIds.length} onClick={()=>void save("lookbooks",lookbook,()=>setLookbook(emptyLookbook()))}>{lookbook.id?"Salvar lookbook":"Criar lookbook"}</button>
        <div className="commerce-list">{commerce.lookbooks.map(x=><article key={x.id}><div><strong>{x.name}</strong><span>{x.productIds.length} peças</span></div><div><button onClick={()=>setLookbook(x)}>Editar</button><button className="danger" onClick={()=>void remove("lookbooks",x.id)}>Excluir</button></div></article>)}</div>
      </section>}

      {section==="history" && <section className="control-form glass-panel commerce-editor">
        <div className="form-heading"><div><span className="section-eyebrow">AUDITORIA + DESFAZER</span><h2>Histórico da Central</h2><p>Alterações comerciais geram versões restauráveis quando existe um estado anterior.</p></div><label className="check-field"><input type="checkbox" checked={!Array.isArray(commerce.leaderboard)&&commerce.leaderboard.enabled===true} onChange={async e=>{await studioApi.saveLeaderboardConfig(e.target.checked);await onChanged();}}/> Ranking público opt-in</label></div>
        <div className="version-list">{versions.length?versions.slice(0,100).map(v=><article key={v.id}>
          <div>
            <strong>{v.action} · {v.entityType}</strong>
            <span>{v.entityId.slice(0,10)} · {new Intl.DateTimeFormat("pt-BR",{dateStyle:"short",timeStyle:"short"}).format(new Date(v.created))}</span>
            <small>Responsável: {v.actor || "sistema"}</small>
            <details className="version-diff">
              <summary>Ver antes / depois</summary>
              <div>
                <section><b>ANTES</b><pre>{v.before ? JSON.stringify(v.before,null,2) : "Sem versão anterior"}</pre></section>
                <section><b>DEPOIS</b><pre>{v.after ? JSON.stringify(v.after,null,2) : "Item removido"}</pre></section>
              </div>
            </details>
          </div>
          <button disabled={!v.before} onClick={async()=>{try{await studioApi.restoreVersion(v.id);await onChanged();onNotice?.("Versão restaurada.");}catch(err){onError?.(err instanceof Error?err.message:"Não foi possível restaurar.");}}}>Restaurar</button>
        </article>):<p className="muted">O histórico começa a ser preenchido conforme você altera a Central.</p>}</div>
      </section>}
    </div>
  );
}
