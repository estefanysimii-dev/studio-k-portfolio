"use client";
import RadioSettings from '@/components/radio-settings';
import AssistantSettings from '@/components/assistant-settings';
import DropSettings from '@/components/drop-settings';
import AnalyticsDashboard from '@/components/analytics-dashboard';
import StudioIdSettings from '@/components/studio-id-settings';
import FeedbackSettings from '@/components/feedback-settings';
import CommerceControl from '@/components/commerce-control';

import { FormEvent, useEffect, useMemo, useState } from "react";
import StudioShell from "@/components/studio-shell";
import ModelStage from "@/components/model-stage";
import ObjConverter from "@/components/obj-converter";
import MediaField from "@/components/media-field";
import { studioApi } from "@/lib/studio-api";
import { useStudio } from "@/components/studio-provider";
import type { StudioAsset, StudioControlState, StudioIdConfig, StudioItem, StudioProduct, StudioSite } from "@/lib/studio-types";

type Tab = "overview" | "site" | "studioId" | "assistant" | "drops" | "feedbacks" | "commerce" | "portfolio" | "products" | "media" | "converter" | "integrations";

type ItemDraft = {
  name: string;
  description: string;
  category: string;
  tags: string;
  coverUrl: string;
  modelUrl: string;
  compareModelUrl: string;
  viewerHotspots: string;
  viewerVariants: string;
  videoUrl: string;
  gifUrl: string;
  galleryUrls: string;
  featured: boolean;
  published: boolean;
};

type ProductDraft = ItemDraft & {
  price: string;
  botProductId: string;
  gender: "unisex" | "feminino" | "masculino";
  neon: boolean;
  stockMode: "unlimited" | "digital" | "limited" | "slots" | "numbered";
  stockLimit: number;
  limitedLabel: string;
};

const emptyProject: ItemDraft = {
  name: "",
  description: "",
  category: "Studio K",
  tags: "",
  coverUrl: "",
  modelUrl: "",
  compareModelUrl: "",
  viewerHotspots: "",
  viewerVariants: "",
  videoUrl: "",
  gifUrl: "",
  galleryUrls: "",
  featured: false,
  published: true
};

const emptyProduct: ProductDraft = {
  ...emptyProject,
  price: "",
  botProductId: "",
  gender: "unisex",
  neon: false,
  stockMode: "unlimited",
  stockLimit: 0,
  limitedLabel: ""
};

const list = (value: string) => value.split(/[\n,]/).map((entry) => entry.trim()).filter(Boolean);
const hotspotText = (spots: StudioItem["viewerHotspots"] = []) =>
  spots.map((spot) => `${spot.label} | ${spot.position} | ${spot.normal || "0 1 0"}`).join("\n");
const parseHotspots = (value: string) =>
  value.split("\n").map((line, index) => {
    const [label = "", position = "", normal = "0 1 0"] = line.split("|").map((part) => part.trim());
    if (!label || !position) return null;
    return {
      id: `hotspot-${index + 1}-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 36) || "detail"}`,
      label,
      position,
      normal: normal || "0 1 0"
    };
  }).filter((spot): spot is NonNullable<typeof spot> => Boolean(spot));

const variantText = (variants: StudioItem["viewerVariants"] = []) =>
  variants.map((variant) => `${variant.label} | ${variant.colorHex || ""} | ${variant.modelUrl} | ${variant.posterUrl || ""}`).join("\n");
const parseViewerVariants = (value: string) =>
  value.split("\n").map((line, index) => {
    const [label = "", colorHex = "", modelUrl = "", posterUrl = ""] = line.split("|").map((part) => part.trim());
    if (!label || !modelUrl) return null;
    const normalizedColor = /^#[0-9a-f]{6}$/i.test(colorHex) ? colorHex : "";
    return {
      id: `variant-${index + 1}-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 36) || "style"}`,
      label,
      colorHex: normalizedColor,
      modelUrl,
      posterUrl
    };
  }).filter((variant): variant is NonNullable<typeof variant> => Boolean(variant));

function itemDraft(item: StudioItem): ItemDraft {
  return {
    name: item.name,
    description: item.description || "",
    category: item.category || "Studio K",
    tags: (item.tags || []).join(", "),
    coverUrl: item.coverUrl || "",
    modelUrl: item.modelUrl || "",
    compareModelUrl: item.compareModelUrl || "",
    viewerHotspots: hotspotText(item.viewerHotspots || []),
    viewerVariants: variantText(item.viewerVariants || []),
    videoUrl: item.videoUrl || "",
    gifUrl: item.gifUrl || "",
    galleryUrls: (item.galleryUrls || []).join("\n"),
    featured: !!item.featured,
    published: !!item.published
  };
}

function itemPayload(item: StudioItem) {
  return {
    name: item.name,
    description: item.description || "",
    category: item.category || "Studio K",
    tags: item.tags || [],
    coverUrl: item.coverUrl || "",
    modelUrl: item.modelUrl || "",
    compareModelUrl: item.compareModelUrl || "",
    viewerHotspots: item.viewerHotspots || [],
    viewerVariants: item.viewerVariants || [],
    videoUrl: item.videoUrl || "",
    gifUrl: item.gifUrl || "",
    galleryUrls: item.galleryUrls || [],
    featured: !!item.featured,
    published: !!item.published
  };
}

function draftPayload(item: ItemDraft) {
  return {
    name: item.name,
    description: item.description || "",
    category: item.category || "Studio K",
    tags: list(item.tags),
    coverUrl: item.coverUrl || "",
    modelUrl: item.modelUrl || "",
    compareModelUrl: item.compareModelUrl || "",
    viewerHotspots: parseHotspots(item.viewerHotspots),
    viewerVariants: parseViewerVariants(item.viewerVariants),
    videoUrl: item.videoUrl || "",
    gifUrl: item.gifUrl || "",
    galleryUrls: list(item.galleryUrls),
    featured: !!item.featured,
    published: !!item.published
  };
}

function productPayload(item: StudioProduct) {
  return {
    ...itemPayload(item),
    priceCents: Number(item.priceCents || 0),
    botProductId: item.botProductId || "",
    gender: item.gender || "unisex",
    neon: !!item.neon,
    stockMode: item.stockMode || "unlimited",
    stockLimit: Number(item.stockLimit || 0),
    limitedLabel: item.limitedLabel || ""
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
  const [studioIdDraft, setStudioIdDraft] = useState<StudioIdConfig | null>(null);
  const [project, setProject] = useState<ItemDraft>(emptyProject);
  const [product, setProduct] = useState<ProductDraft>(emptyProduct);
  const [editingProjectId, setEditingProjectId] = useState("");
  const [editingProductId, setEditingProductId] = useState("");
  const [uploading, setUploading] = useState(false);
  const [isPublicUpload, setIsPublicUpload] = useState(true);
  const [converterTarget, setConverterTarget] = useState<"project" | "product">("project");
  const [announceChannelId, setAnnounceChannelId] = useState("");
  const { state: publicState, refresh: refreshPublic } = useStudio();

  const refresh = async () => {
    try {
      setError("");
      const next = await studioApi.controlState();
      setState(next);
      setSiteDraft(next.site);
      setStudioIdDraft(next.studioIdConfig || null);
      const channels = next.discord?.channels || [];
      setAnnounceChannelId((current) => {
        if (current && channels.some((channel) => channel.id === current)) return current;
        const preferred = next.site.defaultAnnouncementChannelId;
        if (preferred && channels.some((channel) => channel.id === preferred)) return preferred;
        return channels[0]?.id || "";
      });
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
    ["Drops ativos", String((state?.drops || []).filter((drop) => drop.status === "active").length)],
    ["Bot", state?.discord?.botConnected ? "Online" : "Offline"]
  ], [state]);

  const saveSite = async (event: FormEvent) => {
    event.preventDefault();
    if (!siteDraft) return;
    try {
      await studioApi.saveSite(siteDraft);
      flash("Configurações do site salvas.");
      await Promise.all([refresh(), refreshPublic()]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar.");
    }
  };

  const saveStudioIdSettings = async () => {
    if (!studioIdDraft) return;
    try {
      setError("");
      const saved = await studioApi.saveStudioIdConfig(studioIdDraft);
      setStudioIdDraft(saved);
      flash("Configurações do Studio K ID salvas.");
      await Promise.all([refresh(), refreshPublic()]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível salvar o Studio K ID.");
    }
  };

  const saveAssistantSettings = async () => {
    if (!siteDraft) return;
    try {
      setError("");
      await studioApi.saveSite(siteDraft);
      flash("Assistente Kiki atualizada.");
      await Promise.all([refresh(), refreshPublic()]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível salvar a assistente.");
    }
  };

  const saveAnnouncementSettings = async () => {
    if (!siteDraft) return;
    if (siteDraft.autoAnnounceProducts && !siteDraft.defaultAnnouncementChannelId) {
      setError("Selecione um canal padrão antes de ativar anúncios automáticos.");
      return;
    }
    try {
      setError("");
      await studioApi.saveSite(siteDraft);
      setAnnounceChannelId(siteDraft.defaultAnnouncementChannelId || announceChannelId);
      flash(siteDraft.autoAnnounceProducts
        ? "Automação salva. Novos produtos publicados serão anunciados automaticamente."
        : "Canal padrão de anúncios salvo.");
      await Promise.all([refresh(), refreshPublic()]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível salvar a automação de anúncios.");
    }
  };

  const saveProject = async (event: FormEvent) => {
    event.preventDefault();
    try {
      const body = draftPayload(project);
      if (editingProjectId) {
        await studioApi.updateItem(editingProjectId, body);
        flash("Projeto atualizado.");
      } else {
        await studioApi.createItem(body);
        flash("Projeto publicado no portfólio.");
      }
      setProject(emptyProject);
      setEditingProjectId("");
      await Promise.all([refresh(), refreshPublic()]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar projeto.");
    }
  };

  const saveProduct = async (event: FormEvent) => {
    event.preventDefault();
    try {
      const normalized = product.price.replace(",", ".").trim();
      const body = {
        ...draftPayload(product),
        priceCents: normalized ? Math.round(Number(normalized) * 100) : 0,
        botProductId: product.botProductId || "",
        gender: product.gender,
        neon: product.neon,
        stockMode: product.stockMode,
        stockLimit: product.stockLimit,
        limitedLabel: product.limitedLabel
      };
      const result = editingProductId
        ? await studioApi.updateProduct(editingProductId, body)
        : await studioApi.createProduct(body);

      if (result._announcement?.attempted) {
        flash(result._announcement.ok
          ? `${editingProductId ? "Produto atualizado" : "Produto publicado"} e anunciado automaticamente no Discord.`
          : `Produto salvo, mas o anúncio automático falhou: ${result._announcement.error || "verifique o canal e as permissões do bot."}`);
      } else {
        flash(editingProductId ? "Produto atualizado." : "Produto publicado na loja.");
      }
      setProduct(emptyProduct);
      setEditingProductId("");
      await Promise.all([refresh(), refreshPublic()]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar produto.");
    }
  };

  const editProject = (item: StudioItem) => {
    setProject(itemDraft(item));
    setEditingProjectId(item.id);
    setTab("portfolio");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const editProduct = (item: StudioProduct) => {
    setProduct({
      ...itemDraft(item),
      price: (Number(item.priceCents || 0) / 100).toFixed(2).replace(".", ","),
      botProductId: item.botProductId || "",
      gender: item.gender || "unisex",
      neon: !!item.neon,
      stockMode: item.stockMode || "unlimited",
      stockLimit: Number(item.stockLimit || 0),
      limitedLabel: item.limitedLabel || ""
    });
    setEditingProductId(item.id);
    setTab("products");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const toggleItem = async (item: StudioItem) => {
    await studioApi.updateItem(item.id, { ...itemPayload(item), published: !item.published });
    await Promise.all([refresh(), refreshPublic()]);
  };

  const toggleProduct = async (item: StudioProduct) => {
    try {
      setError("");
      const result = await studioApi.updateProduct(item.id, { ...productPayload(item), published: !item.published });
      if (!item.published && result._announcement?.attempted) {
        flash(result._announcement.ok
          ? "Produto publicado e anunciado automaticamente no Discord."
          : `Produto publicado, mas o anúncio automático falhou: ${result._announcement.error || "verifique as configurações."}`);
      } else {
        flash(item.published ? "Produto ocultado." : "Produto publicado.");
      }
      await Promise.all([refresh(), refreshPublic()]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível alterar a publicação do produto.");
    }
  };

  const removeItem = async (id: string) => {
    if (!window.confirm("Excluir este projeto?")) return;
    await studioApi.deleteItem(id);
    await Promise.all([refresh(), refreshPublic()]);
  };

  const removeProduct = async (id: string) => {
    if (!window.confirm("Excluir este produto?")) return;
    await studioApi.deleteProduct(id);
    await Promise.all([refresh(), refreshPublic()]);
  };

  const syncBot = async (id: string) => {
    try {
      await studioApi.syncBotProduct(id);
      flash("Produto sincronizado com o bot.");
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao sincronizar.");
    }
  };

  const announce = async (id: string) => {
    if (!announceChannelId) {
      setError("Selecione um canal do Discord para publicar.");
      return;
    }
    try {
      await studioApi.announceProduct(id, announceChannelId);
      flash("Produto publicado no Discord.");
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao anunciar.");
    }
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
      const result = await response.json().catch(() => ({})) as { id?: string; visibility?: string; error?: string };
      if (!response.ok) throw new Error(result.error || "Falha no upload.");
      flash(result.visibility === "public" ? "Mídia publicada com sucesso." : "Arquivo-fonte salvo como privado.");
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha no upload.");
    } finally {
      setUploading(false);
    }
  };

  const processAsset = async (asset: StudioAsset) => {
    try {
      const result = await studioApi.processAsset(asset.id);
      flash(result.kind === "model" ? "GLB gerado e publicado." : "Preview do PSD gerado.");
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao processar arquivo.");
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
    const connected = publicState.me.authenticated;
    return (
      <StudioShell eyebrow="CENTRAL" title="Acesso Staff" variant="control">
        <section className="control-gate glass-panel">
          <span className="section-eyebrow">ÁREA EXCLUSIVA DA STAFF</span>
          <h1>{connected ? "Acesso não autorizado" : "Central de Controle"}</h1>
          <p>
            {connected
              ? "Sua conta está conectada, mas não possui um dos cargos de Staff configurados no servidor do Discord do Studio K."
              : "Conecte sua conta do Discord. O acesso será liberado somente se você possuir um dos cargos de Staff configurados no servidor."}
          </p>
          <div className="hero-actions">
            {connected
              ? <a className="btn btn-primary" href="/account">Voltar para Minha Conta</a>
              : <a className="btn btn-primary" href="/api/oauth/start?next=/control">Conectar com Discord</a>}
            <a className="btn btn-outline" href="/">Voltar ao site</a>
          </div>
          {error && <small className="staff-gate-error">{error}</small>}
        </section>
      </StudioShell>
    );
  }

  const sourceAsset = (asset: StudioAsset) => ["blend", "obj", "fbx", "psd"].includes(asset.ext.toLowerCase());

  return (
    <StudioShell eyebrow="CENTRAL" title="Controle Studio K" variant="control">
      <div className="control-hero">
        <div>
          <span className="section-eyebrow">ADMINISTRAÇÃO EM TEMPO REAL</span>
          <h1 className="page-title">Central de Controle</h1>
          <p className="page-subtitle">Site público, catálogo, mídia, 3D, Discord e bot administrados no mesmo lugar.</p>
        </div>
        <div className="control-user glass-panel">
          <span>Conectado como</span>
          <strong>{state.user?.name || "Administrador Studio K"}</strong>
          <a
            className="control-panel-switch"
            href="https://studio-k-wmrj.netlify.app/"
            target="_blank"
            rel="noopener noreferrer"
          >
            <span>
              <b>Painel do Bot</b>
              <small>Abrir central do bot</small>
            </span>
            <i aria-hidden="true">↗</i>
          </a>
        </div>
      </div>

      {notice && <div className="control-notice success">{notice}</div>}
      {error && <div className="control-notice error">{error}</div>}

      <nav className="control-tabs" aria-label="Seções da Central">
        {[
          ["overview", "Visão geral"],
          ["site", "Site"],
          ["studioId", "Studio K ID"],
          ["assistant", "Assistente"],
          ["drops", "Drops"],
          ["feedbacks", "Feedbacks"],
          ["commerce", "Commerce Hub"],
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
              <p>Projetos e produtos cadastrados aqui alimentam o site público. BLEND/FBX/OBJ podem virar GLB e PSD pode gerar preview sem expor o arquivo-fonte.</p>
            </section>
            <section className="glass-panel admin-card">
              <span className="section-eyebrow">STATUS</span>
              <h2>{state.discord?.botConnected ? "Bot conectado" : "Bot desconectado"}</h2>
              <p>OAuth: {state.discord?.oauthConfigured ? "configurado" : "pendente"} · Conteúdo público sincronizado pela API Studio K.</p>
            </section>
          </div>
          <AnalyticsDashboard data={state.analytics} />
        </>
      )}

      {tab === "site" && siteDraft && (
        <form className="control-form glass-panel" onSubmit={saveSite}>
          <div className="form-heading">
            <div><span className="section-eyebrow">IDENTIDADE + HOME</span><h2>Configurações do site</h2></div>
            <button className="btn btn-primary" type="submit">Salvar alterações</button>
          </div>
          <div className="form-grid two">
            <label>Nome da marca<input value={siteDraft.brandName} onChange={(e) => setSiteDraft({ ...siteDraft, brandName: e.target.value })} /></label>
            <label>Tagline<input value={siteDraft.brandTagline} onChange={(e) => setSiteDraft({ ...siteDraft, brandTagline: e.target.value })} /></label>
            <label>Eyebrow do Hero<input value={siteDraft.heroEyebrow} onChange={(e) => setSiteDraft({ ...siteDraft, heroEyebrow: e.target.value })} /></label>
            <label>Título principal<input value={siteDraft.heroTitle} onChange={(e) => setSiteDraft({ ...siteDraft, heroTitle: e.target.value })} /></label>
            <label>Destaque do título<input value={siteDraft.heroAccent} onChange={(e) => setSiteDraft({ ...siteDraft, heroAccent: e.target.value })} /></label>
            <label>Botão principal<input value={siteDraft.primaryCtaLabel} onChange={(e) => setSiteDraft({ ...siteDraft, primaryCtaLabel: e.target.value })} /></label>
            <label>Botão Discord<input value={siteDraft.secondaryCtaLabel} onChange={(e) => setSiteDraft({ ...siteDraft, secondaryCtaLabel: e.target.value })} /></label>
            <label className="span-2">Descrição do Hero<textarea rows={4} value={siteDraft.heroSubtitle} onChange={(e) => setSiteDraft({ ...siteDraft, heroSubtitle: e.target.value })} /></label>
            <label>Logo URL<input value={siteDraft.logoUrl} onChange={(e) => setSiteDraft({ ...siteDraft, logoUrl: e.target.value })} /></label>
            <label>Background Home<input value={siteDraft.homeBackgroundUrl} onChange={(e) => setSiteDraft({ ...siteDraft, homeBackgroundUrl: e.target.value })} /></label>
            <label>Background Central<input value={siteDraft.controlBackgroundUrl} onChange={(e) => setSiteDraft({ ...siteDraft, controlBackgroundUrl: e.target.value })} /></label>
            <label>Convite Discord<input value={siteDraft.discordInviteUrl} onChange={(e) => setSiteDraft({ ...siteDraft, discordInviteUrl: e.target.value })} placeholder="https://discord.gg/..." /></label>

            <div className="span-2 member-access-settings">
              <div className="member-access-settings-head">
                <span className="section-eyebrow">ACESSO DE MEMBRO · DISCORD</span>
                <strong>Benefícios exibidos no card do Discord</strong>
                <small>Promoções e novidades são puxadas automaticamente das campanhas ativas da aba Assistente.</small>
              </div>
              <div className="member-access-settings-grid">
                <label>Desconto de membro (%)
                  <input
                    type="number"
                    min={0}
                    max={100}
                    step={1}
                    value={siteDraft.memberDiscountPercent}
                    onChange={(e) => setSiteDraft({ ...siteDraft, memberDiscountPercent: Math.min(100, Math.max(0, Number(e.target.value) || 0)) })}
                  />
                </label>
                <label>Benefício em destaque
                  <input
                    value={siteDraft.memberBenefitTitle}
                    onChange={(e) => setSiteDraft({ ...siteDraft, memberBenefitTitle: e.target.value })}
                    placeholder="Ex.: Drops e condições exclusivas"
                  />
                </label>
                <label className="span-2">Descrição do benefício
                  <textarea
                    rows={3}
                    value={siteDraft.memberBenefitDescription}
                    onChange={(e) => setSiteDraft({ ...siteDraft, memberBenefitDescription: e.target.value })}
                    placeholder="Explique de forma curta o que a pessoa libera ao conectar a conta."
                  />
                </label>
              </div>
            </div>
          </div>
          <RadioSettings value={siteDraft.radio} onChange={radio => setSiteDraft({ ...siteDraft, radio })} />
        </form>
      )}

      {tab === "studioId" && studioIdDraft && (
        <StudioIdSettings
          value={studioIdDraft}
          roles={state.discord?.roles || []}
          onChange={setStudioIdDraft}
          onSave={() => void saveStudioIdSettings()}
        />
      )}

      {tab === "assistant" && siteDraft && (
        <AssistantSettings
          value={siteDraft.assistant}
          onChange={(assistant) => setSiteDraft({ ...siteDraft, assistant })}
          onSave={() => void saveAssistantSettings()}
        />
      )}

      {tab === "drops" && (
        <DropSettings
          drops={state.drops || []}
          products={state.products || []}
          channels={state.discord?.channels || []}
          onChanged={async () => { await Promise.all([refresh(), refreshPublic()]); }}
          onNotice={flash}
          onError={setError}
        />
      )}

      {tab === "feedbacks" && (
        <FeedbackSettings
          feedbacks={state.feedbacks || []}
          onSaved={async () => {
            flash("Organização dos feedbacks salva.");
            await Promise.all([refresh(), refreshPublic()]);
          }}
        />
      )}

      {tab === "commerce" && state.commerce && (
        <CommerceControl
          commerce={state.commerce}
          products={state.products}
          items={state.items}
          roles={state.discord?.roles || []}
          versions={state.versions || []}
          onChanged={async () => { await Promise.all([refresh(), refreshPublic()]); }}
          onNotice={flash}
          onError={setError}
        />
      )}

      {tab === "portfolio" && (
        <div className="control-split">
          <form className="control-form glass-panel" onSubmit={saveProject}>
            <div className="form-heading">
              <div><span className="section-eyebrow">{editingProjectId ? "EDITAR PROJETO" : "NOVO PROJETO"}</span><h2>{editingProjectId ? "Atualizar portfólio" : "Publicar no portfólio"}</h2></div>
              {editingProjectId && <button type="button" className="btn btn-outline compact" onClick={() => { setProject(emptyProject); setEditingProjectId(""); }}>Cancelar edição</button>}
            </div>
            <div className="form-grid">
              <label>Nome<input required value={project.name} onChange={(e) => setProject({ ...project, name: e.target.value })} /></label>
              <label>Categoria<input value={project.category} onChange={(e) => setProject({ ...project, category: e.target.value })} /></label>
              <label>Tags<input value={project.tags} onChange={(e) => setProject({ ...project, tags: e.target.value })} placeholder="FiveM, Feminino, Neon" /></label>
              <MediaField label="Capa / imagem / PSD" kind="image" value={project.coverUrl} onChange={(value) => setProject({ ...project, coverUrl: value })} />
              <MediaField label="Modelo 3D" kind="model" value={project.modelUrl} onChange={(value) => setProject({ ...project, modelUrl: value })} onConvertObj={() => { setConverterTarget("project"); setTab("converter"); }} />
              <MediaField label="Modelo Antes / Comparação" kind="model" value={project.compareModelUrl} onChange={(value) => setProject({ ...project, compareModelUrl: value })} />
              <label className="span-2">Hotspots 3D
                <textarea rows={3} value={project.viewerHotspots} onChange={(e) => setProject({ ...project, viewerHotspots: e.target.value })} placeholder={"Nome do detalhe | x y z | nx ny nz\nEx.: Manga emissiva | 0.12 0.84 0.05 | 0 1 0"} />
                <small>Um hotspot por linha. A posição e normal usam as coordenadas do GLB.</small>
              </label>
              <label className="span-2">Cores / variantes 3D
                <textarea rows={4} value={project.viewerVariants} onChange={(e) => setProject({ ...project, viewerVariants: e.target.value })} placeholder={"Nome | #RRGGBB | URL do GLB | URL da capa (opcional)\nEx.: Roxo | #8B2CFF | /portfolio-assets/modelo-roxo.glb | /portfolio-assets/roxo.webp"} />
                <small>Uma variante por linha. Cada opção pode usar um GLB próprio, sem depender das variantes internas do arquivo.</small>
              </label>
              <MediaField label="Vídeo" kind="video" value={project.videoUrl} onChange={(value) => setProject({ ...project, videoUrl: value })} />
              <MediaField label="GIF" kind="image" value={project.gifUrl} onChange={(value) => setProject({ ...project, gifUrl: value })} />
              <label className="span-2">Galeria adicional<textarea rows={3} value={project.galleryUrls} onChange={(e) => setProject({ ...project, galleryUrls: e.target.value })} placeholder="Uma URL por linha ou separada por vírgula" /></label>
              <label className="span-2">Descrição<textarea required rows={4} value={project.description} onChange={(e) => setProject({ ...project, description: e.target.value })} /></label>
              <div className="check-row span-2">
                <label><input type="checkbox" checked={project.featured} onChange={(e) => setProject({ ...project, featured: e.target.checked })} /> Destaque da Home</label>
                <label><input type="checkbox" checked={project.published} onChange={(e) => setProject({ ...project, published: e.target.checked })} /> Publicado</label>
              </div>
            </div>
            <button className="btn btn-primary" type="submit">{editingProjectId ? "Salvar projeto" : "Publicar projeto"}</button>
          </form>

          <section className="control-list glass-panel">
            <div className="form-heading"><div><span className="section-eyebrow">ARQUIVO</span><h2>Projetos cadastrados</h2></div></div>
            {state.items.length ? state.items.map((item) => (
              <div className="control-row" key={item.id}>
                <div>{item.coverUrl ? <img src={item.coverUrl} alt="" /> : <span className="row-placeholder">3D</span>}</div>
                <div className="control-row-copy"><strong>{item.name}</strong><span>{item.category} · {item.published ? "Publicado" : "Oculto"}</span></div>
                <div className="control-row-actions">
                  <button type="button" onClick={() => editProject(item)}>Editar</button>
                  <button type="button" onClick={() => void toggleItem(item)}>{item.published ? "Ocultar" : "Publicar"}</button>
                  <a href={`/portfolio/${item.id}`} target="_blank" rel="noreferrer">Abrir</a>
                  <button type="button" className="danger" onClick={() => void removeItem(item.id)}>Excluir</button>
                </div>
              </div>
            )) : <p className="muted">Nenhum projeto cadastrado.</p>}
          </section>
        </div>
      )}

      {tab === "products" && (
        <div className="control-split">
          <form className="control-form glass-panel" onSubmit={saveProduct}>
            <div className="form-heading">
              <div><span className="section-eyebrow">{editingProductId ? "EDITAR PRODUTO" : "NOVO PRODUTO"}</span><h2>{editingProductId ? "Atualizar loja" : "Publicar na loja"}</h2></div>
              {editingProductId && <button type="button" className="btn btn-outline compact" onClick={() => { setProduct(emptyProduct); setEditingProductId(""); }}>Cancelar edição</button>}
            </div>
            <div className="form-grid">
              <label>Nome<input required value={product.name} onChange={(e) => setProduct({ ...product, name: e.target.value })} /></label>
              <label>Preço em R$<input value={product.price} onChange={(e) => setProduct({ ...product, price: e.target.value })} placeholder="49,90" /></label>
              <label>Categoria<input value={product.category} onChange={(e) => setProduct({ ...product, category: e.target.value })} /></label>
              <label>Tags<input value={product.tags} onChange={(e) => setProduct({ ...product, tags: e.target.value })} /></label>
              <label>Modelo / público
                <select value={product.gender} onChange={(e) => setProduct({ ...product, gender: e.target.value as ProductDraft["gender"] })}>
                  <option value="unisex">Unissex</option><option value="feminino">Feminino</option><option value="masculino">Masculino</option>
                </select>
              </label>
              <label>Disponibilidade
                <select value={product.stockMode} onChange={(e) => setProduct({ ...product, stockMode: e.target.value as ProductDraft["stockMode"] })}>
                  <option value="unlimited">Ilimitado</option><option value="digital">Estoque digital do bot</option><option value="limited">Quantidade limitada</option><option value="slots">Vagas de encomenda</option><option value="numbered">Edição numerada</option>
                </select>
              </label>
              {product.stockMode !== "unlimited" && product.stockMode !== "digital" && <label>Limite total<input type="number" min={0} value={product.stockLimit} onChange={(e) => setProduct({ ...product, stockLimit: Number(e.target.value) || 0 })} /></label>}
              <label>Rótulo de edição<input value={product.limitedLabel} onChange={(e) => setProduct({ ...product, limitedLabel: e.target.value })} placeholder="Ex.: Edição Halloween 2026" /></label>
              <MediaField label="Capa / imagem / PSD" kind="image" value={product.coverUrl} onChange={(value) => setProduct({ ...product, coverUrl: value })} />
              <MediaField label="Modelo 3D" kind="model" value={product.modelUrl} onChange={(value) => setProduct({ ...product, modelUrl: value })} onConvertObj={() => { setConverterTarget("product"); setTab("converter"); }} />
              <MediaField label="Modelo Antes / Comparação" kind="model" value={product.compareModelUrl} onChange={(value) => setProduct({ ...product, compareModelUrl: value })} />
              <label className="span-2">Hotspots 3D
                <textarea rows={3} value={product.viewerHotspots} onChange={(e) => setProduct({ ...product, viewerHotspots: e.target.value })} placeholder={"Nome do detalhe | x y z | nx ny nz\nEx.: Material neon | 0.15 0.90 0.04 | 0 1 0"} />
                <small>Variantes de material/cor incorporadas no GLB aparecem automaticamente no viewer.</small>
              </label>
              <label className="span-2">Cores / variantes 3D
                <textarea rows={4} value={product.viewerVariants} onChange={(e) => setProduct({ ...product, viewerVariants: e.target.value })} placeholder={"Nome | #RRGGBB | URL do GLB | URL da capa (opcional)\nEx.: Preto | #121212 | /portfolio-assets/produto-preto.glb | /portfolio-assets/preto.webp"} />
                <small>Essas opções aparecem como swatches no viewer. Variantes internas do GLB continuam funcionando em paralelo.</small>
              </label>
              <MediaField label="Vídeo" kind="video" value={product.videoUrl} onChange={(value) => setProduct({ ...product, videoUrl: value })} />
              <MediaField label="GIF" kind="image" value={product.gifUrl} onChange={(value) => setProduct({ ...product, gifUrl: value })} />
              <label>ID do produto no bot<input value={product.botProductId} onChange={(e) => setProduct({ ...product, botProductId: e.target.value })} placeholder="Gerado ao sincronizar" /></label>
              <label className="span-2">Galeria adicional<textarea rows={3} value={product.galleryUrls} onChange={(e) => setProduct({ ...product, galleryUrls: e.target.value })} /></label>
              <label className="span-2">Descrição<textarea required rows={4} value={product.description} onChange={(e) => setProduct({ ...product, description: e.target.value })} /></label>
              <div className="check-row span-2">
                <label><input type="checkbox" checked={product.featured} onChange={(e) => setProduct({ ...product, featured: e.target.checked })} /> Destaque</label>
                <label><input type="checkbox" checked={product.published} onChange={(e) => setProduct({ ...product, published: e.target.checked })} /> Publicado</label>
                <label><input type="checkbox" checked={product.neon} onChange={(e) => setProduct({ ...product, neon: e.target.checked })} /> Neon / emissivo</label>
              </div>
            </div>
            <button className="btn btn-primary" type="submit">{editingProductId ? "Salvar produto" : "Publicar produto"}</button>
          </form>

          <section className="control-list glass-panel">
            <div className="form-heading">
              <div><span className="section-eyebrow">CATÁLOGO + DISCORD</span><h2>Produtos cadastrados</h2></div>
            </div>
            <div className="announcement-automation">
              <div className="announcement-automation-head">
                <div>
                  <span className="section-eyebrow">AUTOMAÇÃO DE ANÚNCIOS</span>
                  <strong>Canal padrão da loja</strong>
                </div>
                <span className={state.discord?.botConnected ? "automation-status online" : "automation-status offline"}>
                  {state.discord?.botConnected ? "Bot online" : "Bot offline"}
                </span>
              </div>

              <label className="channel-picker">Canal padrão
                <select
                  value={siteDraft?.defaultAnnouncementChannelId || ""}
                  onChange={(e) => {
                    const channelId = e.target.value;
                    setSiteDraft((current) => current ? { ...current, defaultAnnouncementChannelId: channelId } : current);
                    if (channelId) setAnnounceChannelId(channelId);
                  }}
                >
                  <option value="">Selecione um canal</option>
                  {(state.discord?.channels || []).map((channel) => <option key={channel.id} value={channel.id}>#{channel.name}</option>)}
                </select>
              </label>

              <label className="automation-toggle">
                <input
                  type="checkbox"
                  checked={!!siteDraft?.autoAnnounceProducts}
                  disabled={!siteDraft?.defaultAnnouncementChannelId}
                  onChange={(e) => setSiteDraft((current) => current ? { ...current, autoAnnounceProducts: e.target.checked } : current)}
                />
                <span>
                  <strong>Anunciar automaticamente ao publicar</strong>
                  <small>Ao criar um produto já publicado, ou transformar um produto oculto em publicado, o bot sincroniza o produto e envia o anúncio no canal padrão.</small>
                </span>
              </label>

              <button className="btn btn-outline compact automation-save" type="button" onClick={() => void saveAnnouncementSettings()}>
                Salvar automação
              </button>

              {(state.discord?.channels || []).length === 0 && (
                <div className="channel-empty">
                  Nenhum canal compatível encontrado. O bot precisa estar no servidor e ter <strong>Ver canal</strong>, <strong>Enviar mensagens</strong> e <strong>Inserir links</strong> em um canal de texto ou anúncios.
                </div>
              )}
            </div>

            <label className="channel-picker manual-announcement-channel">Canal para anúncio manual
              <select value={announceChannelId} onChange={(e) => setAnnounceChannelId(e.target.value)}>
                <option value="">Selecione um canal</option>
                {(state.discord?.channels || []).map((channel) => <option key={channel.id} value={channel.id}>#{channel.name}</option>)}
              </select>
              <small>Usado apenas quando você clicar em “Anunciar”. O canal padrão acima continua salvo para automações.</small>
            </label>
            {state.products.length ? state.products.map((item) => (
              <div className="control-row product-control-row" key={item.id}>
                <div>{item.coverUrl ? <img src={item.coverUrl} alt="" /> : <span className="row-placeholder">SK</span>}</div>
                <div className="control-row-copy">
                  <strong>{item.name}</strong>
                  <span>{item.published ? "Publicado" : "Oculto"} · R$ {(item.priceCents / 100).toFixed(2).replace(".", ",")} · {item.botProductId ? "Bot sincronizado" : "Bot pendente"}</span>
                </div>
                <div className="control-row-actions">
                  <button type="button" onClick={() => editProduct(item)}>Editar</button>
                  <button type="button" onClick={() => void syncBot(item.id)}>Sincronizar bot</button>
                  <button type="button" onClick={() => void announce(item.id)} disabled={!announceChannelId}>Anunciar</button>
                  <button type="button" onClick={() => void toggleProduct(item)}>{item.published ? "Ocultar" : "Publicar"}</button>
                  <a href={`/products/${item.id}`} target="_blank" rel="noreferrer">Abrir</a>
                  <button type="button" className="danger" onClick={() => void removeProduct(item.id)}>Excluir</button>
                </div>
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
            <p>PNG, JPEG, WebP, GIF, MP4, WebM, GLB e GLTF podem ser públicos. BLEND, OBJ, FBX e PSD ficam privados; a Central pode gerar GLB/preview público sem expor o original.</p>
            <div className="upload-actions">
              <label className="btn btn-primary file-button">
                {uploading ? "Enviando..." : "Selecionar arquivo"}
                <input disabled={uploading} type="file" onChange={(e) => void upload(e.target.files?.[0])} />
              </label>
              <label className="public-toggle"><input type="checkbox" checked={isPublicUpload} onChange={(e) => setIsPublicUpload(e.target.checked)} /> Publicar quando o formato permitir</label>
            </div>
          </section>

          <div className="asset-grid">
            {(state.assets || []).map((asset) => (
              <article className="asset-card glass-panel" key={asset.id}>
                <div className="asset-icon">{asset.ext.toUpperCase()}</div>
                <strong>{asset.originalName}</strong>
                <span>{asset.visibility === "public" ? "Público" : "Privado"} · {bytes(asset.size)}{asset.generated ? " · Gerado" : ""}</span>
                {asset.publicUrl && <code>{asset.publicUrl}</code>}
                {sourceAsset(asset) && <button className="btn btn-outline compact asset-process" type="button" onClick={() => void processAsset(asset)}>{asset.ext === "psd" ? "Gerar preview" : "Converter para GLB"}</button>}
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
              flash("GLB inserido automaticamente no produto.");
            } else {
              setProject((current) => ({ ...current, modelUrl: url }));
              setTab("portfolio");
              flash("GLB inserido automaticamente no projeto.");
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
            <p>Produtos podem ser sincronizados com a loja do bot e publicados em um canal do Discord diretamente pela Central.</p>
          </section>
          <section className="integration-card glass-panel">
            <span className="section-eyebrow">PROCESSAMENTO 3D</span>
            <h2>BLEND · FBX · OBJ → GLB</h2>
            <p>Arquivos-fonte ficam privados no backend. O navegador recebe somente a versão GLB preparada para o viewer 360°.</p>
            <ModelStage compact />
          </section>
          <section className="integration-card glass-panel">
            <span className="section-eyebrow">PSD</span>
            <h2>Preview automático</h2>
            <p>O PSD original permanece privado e uma imagem de preview é gerada para exibição pública.</p>
          </section>
          <section className="integration-card glass-panel disabled-integration">
            <span className="section-eyebrow">CLOTH TOOL STUDIO K</span>
            <h2>Reservado para a última etapa</h2>
            <p>A integração direta com o aplicativo continua isolada até o restante do ecossistema estar validado em produção.</p>
          </section>
        </div>
      )}
    </StudioShell>
  );
}
