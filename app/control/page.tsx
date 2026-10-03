"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import StudioShell from "@/components/studio-shell";
import ModelStage from "@/components/model-stage";
import ObjConverter from "@/components/obj-converter";
import MediaField from "@/components/media-field";
import { studioApi } from "@/lib/studio-api";
import type { StudioAsset, StudioControlState, StudioItem, StudioProduct, StudioSite } from "@/lib/studio-types";

type Tab = "overview" | "site" | "portfolio" | "products" | "media" | "converter" | "integrations";

const emptyProject = {
  name: "",
  description: "",
  category: "Studio K",
  tags: "",
  coverUrl: "",
  modelUrl: "",
  videoUrl: "",
  gifUrl: "",
  featured: false,
  published: true
};

const emptyProduct = {
  ...emptyProject,
  price: "",
  botProductId: ""
};

function itemPayload(item: StudioItem) {
  return {
    name: item.name,
    description: item.description || "",
    category: item.category || "Studio K",
    tags: item.tags || [],
    coverUrl: item.coverUrl || "",
    modelUrl: item.modelUrl || "",
    videoUrl: item.videoUrl || "",
    gifUrl: item.gifUrl || "",
    galleryUrls: item.galleryUrls || [],
    featured: !!item.featured,
    published: !!item.published
  };
}

function productPayload(item: StudioProduct) {
  return {
    ...itemPayload(item),
    priceCents: Number(item.priceCents || 0),
    botProductId: item.botProductId || ""
  };
}

const bytes = (value: number) => {
  if (!value) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.min(units.length - 1, Math.floor(Math.log(value) / Math.log(1024)));
  return `${(value / Math.pow(1024, i)).toFixed(i ? 1 : 0)} ${units[i]}`;
};

export default function ControlPage() {
  const [state, setState] = useState<StudioControlState | null>(null);
  const [tab, setTab] = useState<Tab>("overview");
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [siteDraft, setSiteDraft] = useState<StudioSite | null>(null);
  const [adminRoles, setAdminRoles] = useState("");
  const [project, setProject] = useState(emptyProject);
  const [product, setProduct] = useState(emptyProduct);
  const [uploading, setUploading] = useState(false);
  const [isPublicUpload, setIsPublicUpload] = useState(true);
  const [converterTarget, setConverterTarget] = useState<"project" | "product">("project");

  const refresh = async () => {
    try {
      setError("");
      const next = await studioApi.controlState();
      setState(next);
      setSiteDraft(next.site);
      setAdminRoles((next.site.adminRoleIds || []).join(", "));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível abrir a Central.");
      setState(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void refresh(); }, []);

  const flash = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 3500);
  };

  const metrics = useMemo(() => [
    ["Projetos", String(state?.items?.length || 0)],
    ["Produtos", String(state?.products?.length || 0)],
    ["Mídias", String(state?.assets?.length || 0)],
    ["Bot", state?.discord?.botConnected ? "Online" : "Offline"]
  ], [state]);

  const saveSite = async (event: FormEvent) => {
    event.preventDefault();
    if (!siteDraft) return;
    try {
      const roles = adminRoles.split(",").map((x) => x.trim()).filter(Boolean);
      await studioApi.saveSite({ ...siteDraft, adminRoleIds: roles });
      flash("Configurações do site salvas.");
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar.");
    }
  };

  const createProject = async (event: FormEvent) => {
    event.preventDefault();
    try {
      await studioApi.createItem({
        ...project,
        tags: project.tags.split(",").map((x) => x.trim()).filter(Boolean),
        galleryUrls: []
      });
      setProject(emptyProject);
      flash("Projeto publicado no catálogo.");
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao criar projeto.");
    }
  };

  const createProduct = async (event: FormEvent) => {
    event.preventDefault();
    try {
      const normalized = product.price.replace(",", ".").trim();
      await studioApi.createProduct({
        ...product,
        tags: product.tags.split(",").map((x) => x.trim()).filter(Boolean),
        galleryUrls: [],
        priceCents: normalized ? Math.round(Number(normalized) * 100) : 0
      });
      setProduct(emptyProduct);
      flash("Produto publicado na loja.");
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao criar produto.");
    }
  };

  const toggleItem = async (item: StudioItem) => {
    await studioApi.updateItem(item.id, { ...itemPayload(item), published: !item.published });
    await refresh();
  };

  const toggleProduct = async (item: StudioProduct) => {
    await studioApi.updateProduct(item.id, { ...productPayload(item), published: !item.published });
    await refresh();
  };

  const removeItem = async (id: string) => {
    if (!window.confirm("Excluir este projeto?")) return;
    await studioApi.deleteItem(id);
    await refresh();
  };

  const removeProduct = async (id: string) => {
    if (!window.confirm("Excluir este produto?")) return;
    await studioApi.deleteProduct(id);
    await refresh();
  };

  const upload = async (file?: File | null) => {
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const ticket = await studioApi.uploadTicket(file.name, isPublicUpload);
      const target = new URL(ticket.uploadUrl);
      target.searchParams.set("name", file.name);
      const response = await fetch(target, {
        method: "PUT",
        headers: { "Content-Type": file.type || "application/octet-stream" },
        body: file
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "Falha no upload.");
      flash(result.visibility === "public" ? "Mídia publicada com sucesso." : "Arquivo-fonte salvo como privado.");
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha no upload.");
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <StudioShell eyebrow="CENTRAL" title="Controle Studio K" variant="control">
        <div className="control-loading glass-panel">Sincronizando Central de Controle...</div>
      </StudioShell>
    );
  }

  if (!state) {
    return (
      <StudioShell eyebrow="CENTRAL" title="Acesso administrativo" variant="control">
        <section className="control-gate glass-panel">
          <span className="section-eyebrow">ACESSO PROTEGIDO</span>
          <h1>Central de Controle</h1>
          <p>{error || "Conecte uma conta Discord com permissão administrativa para continuar."}</p>
          <a className="btn btn-primary" href="/api/oauth/start?next=/control">Conectar com Discord</a>
        </section>
      </StudioShell>
    );
  }

  return (
    <StudioShell eyebrow="CENTRAL" title="Controle Studio K" variant="control">
      <div className="control-hero">
        <div>
          <span className="section-eyebrow">ADMINISTRAÇÃO EM TEMPO REAL</span>
          <h1 className="page-title">Central de Controle</h1>
          <p className="page-subtitle">Site público, catálogo, mídia, 3D e integrações administrados no mesmo lugar.</p>
        </div>
        <div className="control-user glass-panel">
          <span>Conectado como</span>
          <strong>{state.user?.name || "Administrador Studio K"}</strong>
        </div>
      </div>

      {notice && <div className="control-notice success">{notice}</div>}
      {error && <div className="control-notice error">{error}</div>}

      <nav className="control-tabs" aria-label="Seções da Central">
        {[
          ["overview", "Visão geral"],
          ["site", "Site"],
          ["portfolio", "Portfólio"],
          ["products", "Produtos"],
          ["media", "Mídia"],
          ["converter", "Conversor 3D"],
          ["integrations", "Integrações"]
        ].map(([key, label]) => (
          <button type="button" key={key} className={tab === key ? "active" : ""} onClick={() => setTab(key as Tab)}>
            {label}
          </button>
        ))}
      </nav>

      {tab === "overview" && (
        <>
          <div className="dashboard-grid">
            {metrics.map(([label, value]) => (
              <article className="metric-card glass-panel" key={label}>
                <span>{label}</span>
                <strong>{value}</strong>
              </article>
            ))}
          </div>
          <div className="admin-grid">
            <section className="glass-panel admin-card">
              <span className="section-eyebrow">PUBLICAÇÃO</span>
              <h2>Fluxo unificado</h2>
              <p>Projetos e produtos cadastrados aqui passam a alimentar as páginas públicas. GLB/GLTF abrem no viewer 360° e arquivos OBJ podem ser convertidos automaticamente pelo Conversor 3D.</p>
            </section>
            <section className="glass-panel admin-card">
              <span className="section-eyebrow">STATUS</span>
              <h2>{state.discord?.botConnected ? "Bot conectado" : "Bot desconectado"}</h2>
              <p>OAuth: {state.discord?.oauthConfigured ? "configurado" : "pendente"} · Conteúdo: sincronizado pela API Studio K.</p>
            </section>
          </div>
        </>
      )}

      {tab === "site" && siteDraft && (
        <form className="control-form glass-panel" onSubmit={saveSite}>
          <div className="form-heading">
            <div>
              <span className="section-eyebrow">IDENTIDADE + HOME</span>
              <h2>Configurações do site</h2>
            </div>
            <button className="btn btn-primary" type="submit">Salvar alterações</button>
          </div>

          <div className="form-grid two">
            <label>Nome da marca<input value={siteDraft.brandName} onChange={(e) => setSiteDraft({ ...siteDraft, brandName: e.target.value })} /></label>
            <label>Tagline<input value={siteDraft.brandTagline} onChange={(e) => setSiteDraft({ ...siteDraft, brandTagline: e.target.value })} /></label>
            <label>Eyebrow do Hero<input value={siteDraft.heroEyebrow} onChange={(e) => setSiteDraft({ ...siteDraft, heroEyebrow: e.target.value })} /></label>
            <label>Título principal<input value={siteDraft.heroTitle} onChange={(e) => setSiteDraft({ ...siteDraft, heroTitle: e.target.value })} /></label>
            <label>Destaque do título<input value={siteDraft.heroAccent} onChange={(e) => setSiteDraft({ ...siteDraft, heroAccent: e.target.value })} /></label>
            <label>Botão principal<input value={siteDraft.primaryCtaLabel} onChange={(e) => setSiteDraft({ ...siteDraft, primaryCtaLabel: e.target.value })} /></label>
            <label className="span-2">Descrição do Hero<textarea rows={4} value={siteDraft.heroSubtitle} onChange={(e) => setSiteDraft({ ...siteDraft, heroSubtitle: e.target.value })} /></label>
            <label>Logo URL<input value={siteDraft.logoUrl} onChange={(e) => setSiteDraft({ ...siteDraft, logoUrl: e.target.value })} placeholder="/portfolio-assets/..." /></label>
            <label>Background Home<input value={siteDraft.homeBackgroundUrl} onChange={(e) => setSiteDraft({ ...siteDraft, homeBackgroundUrl: e.target.value })} /></label>
            <label>Background Central<input value={siteDraft.controlBackgroundUrl} onChange={(e) => setSiteDraft({ ...siteDraft, controlBackgroundUrl: e.target.value })} /></label>
            <label>Convite Discord<input value={siteDraft.discordInviteUrl} onChange={(e) => setSiteDraft({ ...siteDraft, discordInviteUrl: e.target.value })} placeholder="https://discord.gg/..." /></label>
            <label className="span-2">IDs dos cargos administrativos<input value={adminRoles} onChange={(e) => setAdminRoles(e.target.value)} placeholder="123..., 456..." /><small>Separe por vírgulas. Administradores/Manage Server também são reconhecidos automaticamente.</small></label>
          </div>
        </form>
      )}

      {tab === "portfolio" && (
        <div className="control-split">
          <form className="control-form glass-panel" onSubmit={createProject}>
            <div className="form-heading"><div><span className="section-eyebrow">NOVO PROJETO</span><h2>Publicar no portfólio</h2></div></div>
            <div className="form-grid">
              <label>Nome<input required value={project.name} onChange={(e) => setProject({ ...project, name: e.target.value })} /></label>
              <label>Categoria<input value={project.category} onChange={(e) => setProject({ ...project, category: e.target.value })} /></label>
              <label>Tags<input value={project.tags} onChange={(e) => setProject({ ...project, tags: e.target.value })} placeholder="FiveM, Feminino, Neon" /></label>
              <MediaField
                label="Capa / imagem"
                kind="image"
                value={project.coverUrl}
                onChange={(value) => setProject({ ...project, coverUrl: value })}
              />
              <MediaField
                label="Modelo 3D"
                kind="model"
                value={project.modelUrl}
                onChange={(value) => setProject({ ...project, modelUrl: value })}
                onConvertObj={() => {
                  setConverterTarget("project");
                  setTab("converter");
                }}
              />
              <MediaField
                label="Vídeo"
                kind="video"
                value={project.videoUrl}
                onChange={(value) => setProject({ ...project, videoUrl: value })}
              />
              <label className="span-2">Descrição<textarea required rows={4} value={project.description} onChange={(e) => setProject({ ...project, description: e.target.value })} /></label>
              <div className="check-row span-2">
                <label><input type="checkbox" checked={project.featured} onChange={(e) => setProject({ ...project, featured: e.target.checked })} /> Destaque da Home</label>
                <label><input type="checkbox" checked={project.published} onChange={(e) => setProject({ ...project, published: e.target.checked })} /> Publicado</label>
              </div>
            </div>
            <button className="btn btn-primary" type="submit">Publicar projeto</button>
          </form>

          <section className="control-list glass-panel">
            <div className="form-heading"><div><span className="section-eyebrow">ARQUIVO</span><h2>Projetos cadastrados</h2></div></div>
            {state.items.length ? state.items.map((item) => (
              <div className="control-row" key={item.id}>
                <div>{item.coverUrl ? <img src={item.coverUrl} alt="" /> : <span className="row-placeholder">3D</span>}</div>
                <div className="control-row-copy"><strong>{item.name}</strong><span>{item.category} · {item.published ? "Publicado" : "Oculto"}</span></div>
                <button type="button" onClick={() => void toggleItem(item)}>{item.published ? "Ocultar" : "Publicar"}</button>
                <button type="button" className="danger" onClick={() => void removeItem(item.id)}>Excluir</button>
              </div>
            )) : <p className="muted">Nenhum projeto cadastrado.</p>}
          </section>
        </div>
      )}

      {tab === "products" && (
        <div className="control-split">
          <form className="control-form glass-panel" onSubmit={createProduct}>
            <div className="form-heading"><div><span className="section-eyebrow">NOVO PRODUTO</span><h2>Publicar na loja</h2></div></div>
            <div className="form-grid">
              <label>Nome<input required value={product.name} onChange={(e) => setProduct({ ...product, name: e.target.value })} /></label>
              <label>Preço em R$<input value={product.price} onChange={(e) => setProduct({ ...product, price: e.target.value })} placeholder="49,90" /></label>
              <label>Categoria<input value={product.category} onChange={(e) => setProduct({ ...product, category: e.target.value })} /></label>
              <label>Tags<input value={product.tags} onChange={(e) => setProduct({ ...product, tags: e.target.value })} /></label>
              <MediaField
                label="Capa / imagem"
                kind="image"
                value={product.coverUrl}
                onChange={(value) => setProduct({ ...product, coverUrl: value })}
              />
              <MediaField
                label="Modelo 3D"
                kind="model"
                value={product.modelUrl}
                onChange={(value) => setProduct({ ...product, modelUrl: value })}
                onConvertObj={() => {
                  setConverterTarget("product");
                  setTab("converter");
                }}
              />
              <MediaField
                label="Vídeo"
                kind="video"
                value={product.videoUrl}
                onChange={(value) => setProduct({ ...product, videoUrl: value })}
              />
              <label>ID do produto no bot<input value={product.botProductId} onChange={(e) => setProduct({ ...product, botProductId: e.target.value })} /></label>
              <label className="span-2">Descrição<textarea required rows={4} value={product.description} onChange={(e) => setProduct({ ...product, description: e.target.value })} /></label>
            </div>
            <button className="btn btn-primary" type="submit">Publicar produto</button>
          </form>

          <section className="control-list glass-panel">
            <div className="form-heading"><div><span className="section-eyebrow">CATÁLOGO</span><h2>Produtos cadastrados</h2></div></div>
            {state.products.length ? state.products.map((item) => (
              <div className="control-row" key={item.id}>
                <div>{item.coverUrl ? <img src={item.coverUrl} alt="" /> : <span className="row-placeholder">SK</span>}</div>
                <div className="control-row-copy"><strong>{item.name}</strong><span>{item.published ? "Publicado" : "Oculto"} · R$ {(item.priceCents / 100).toFixed(2).replace(".", ",")}</span></div>
                <button type="button" onClick={() => void toggleProduct(item)}>{item.published ? "Ocultar" : "Publicar"}</button>
                <button type="button" className="danger" onClick={() => void removeProduct(item.id)}>Excluir</button>
              </div>
            )) : <p className="muted">Nenhum produto cadastrado.</p>}
          </section>
        </div>
      )}

      {tab === "media" && (
        <>
          <section className="upload-zone glass-panel">
            <span className="section-eyebrow">BIBLIOTECA</span>
            <h2>Mídia e arquivos-fonte</h2>
            <p>PNG, JPEG, WebP, GIF, MP4, WebM, GLB e GLTF podem ser públicos. BLEND, OBJ, FBX e PSD são guardados como fonte privada. OBJ pode ser convertido para GLB na aba Conversor 3D.</p>
            <div className="upload-actions">
              <label className="btn btn-primary file-button">
                {uploading ? "Enviando..." : "Selecionar arquivo"}
                <input disabled={uploading} type="file" onChange={(e) => void upload(e.target.files?.[0])} />
              </label>
              <label className="public-toggle"><input type="checkbox" checked={isPublicUpload} onChange={(e) => setIsPublicUpload(e.target.checked)} /> Publicar quando o formato permitir</label>
            </div>
          </section>

          <div className="asset-grid">
            {(state.assets || []).map((asset: StudioAsset) => (
              <article className="asset-card glass-panel" key={asset.id}>
                <div className="asset-icon">{asset.ext.toUpperCase()}</div>
                <strong>{asset.originalName}</strong>
                <span>{asset.visibility === "public" ? "Público" : "Privado"} · {bytes(asset.size)}</span>
                {asset.publicUrl && <code>{asset.publicUrl}</code>}
              </article>
            ))}
          </div>
        </>
      )}

      {tab === "converter" && (
        <ObjConverter
          onChanged={refresh}
          onUse={(url) => {
            if (converterTarget === "product") {
              setProduct((current) => ({ ...current, modelUrl: url }));
              setTab("products");
              flash("GLB inserido automaticamente no novo produto.");
            } else {
              setProject((current) => ({ ...current, modelUrl: url }));
              setTab("portfolio");
              flash("GLB inserido automaticamente no novo projeto.");
            }
          }}
        />
      )}

      {tab === "integrations" && (
        <div className="integration-grid">
          <section className="integration-card glass-panel">
            <span className="section-eyebrow">DISCORD OAUTH2</span>
            <h2>{state.discord?.oauthConfigured ? "Configurado" : "Pendente"}</h2>
            <p>Login do site e autorização da Central usam o mesmo Discord User ID reconhecido pelo bot.</p>
          </section>
          <section className="integration-card glass-panel">
            <span className="section-eyebrow">BOT STUDIO K</span>
            <h2>{state.discord?.botConnected ? "Online" : "Offline"}</h2>
            <p>A Central consulta os cargos do servidor para liberar administradores e integra produtos pelo ID do bot.</p>
          </section>
          <section className="integration-card glass-panel">
            <span className="section-eyebrow">VIEWER 3D</span>
            <h2>GLB / GLTF</h2>
            <p>O site já aceita rotação 360°, zoom, auto-rotação, reset e tela cheia para modelos publicados.</p>
            <ModelStage compact />
          </section>
          <section className="integration-card glass-panel disabled-integration">
            <span className="section-eyebrow">CLOTH TOOL STUDIO K</span>
            <h2>Reservado para a última etapa</h2>
            <p>A integração com o aplicativo permanece isolada até site, Central, mídia, OAuth e bot estarem estabilizados.</p>
          </section>
        </div>
      )}
    </StudioShell>
  );
}
