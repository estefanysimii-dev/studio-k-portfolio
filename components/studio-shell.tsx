"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CSSProperties, lazy, Suspense, useEffect, useState } from "react";
import Icon from "./icons";
import { useStudio } from "./studio-provider";
import { ThemeToggle } from './theme-provider';
import { discordAppInviteHref, discordInviteHref } from "@/lib/links";
import StudioRadio from "./studio-radio";
import BehaviorTracker from "./behavior-tracker";
import CommerceActions from "./commerce-actions";
import CommerceBanners from "./commerce-banners";

const StudioAssistant = lazy(() => import("./studio-assistant"));
const AccountTickets = lazy(() => import("./account-tickets"));

const nav = [
  { href: "/", label: "Início", icon: "home" },
  { href: "/portfolio", label: "Portfólio", icon: "portfolio" },
  { href: "/products", label: "Produtos", icon: "products" },
  { href: "/collections", label: "Coleções", icon: "portfolio" },
  { href: "/community", label: "Comunidade", icon: "account" },
  { href: "/discord", label: "Discord", icon: "discord" },
  { href: "/account", label: "Minha Conta", icon: "account" }
];

type Props = {
  eyebrow?: string;
  title?: string;
  children: React.ReactNode;
  variant?: "default" | "control";
};

function BrandMark({ src, name }: { src?: string; name: string }) {
  const [failed, setFailed] = useState(false);
  const usable = src && !src.startsWith("/media/") && !failed;

  return (
    <div className="brand-mark" aria-label={name}>
      {usable ? <img src={src} alt="" onError={() => setFailed(true)} /> : <span>K</span>}
    </div>
  );
}

export default function StudioShell({ eyebrow, title, children, variant = "default" }: Props) {
  const pathname = usePathname();
  const { state, loading } = useStudio();
  const { site, me, status } = state;
  const [enhancementsReady, setEnhancementsReady] = useState(false);

  useEffect(() => {
    let timer = 0;
    const activate = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => setEnhancementsReady(true), 320);
    };

    if (document.documentElement.classList.contains("studio-entry-locked")) {
      window.addEventListener("studio-k-entered", activate, { once: true });
    } else {
      activate();
    }

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("studio-k-entered", activate);
    };
  }, []);

  const invite = discordInviteHref(site.discordInviteUrl);
  const appInvite = discordAppInviteHref(invite);
  const logoSrc = site.logoUrl && !site.logoUrl.startsWith("/media/")
    ? site.logoUrl
    : "/studio-assets/studio-k-logo.webp";
  const tagline = !site.brandTagline || site.brandTagline === "KINETIC LOOM"
    ? "SUA IDENTIDADE. SUA CIDADE."
    : site.brandTagline;
  const configuredBg = variant === "control" ? site.controlBackgroundUrl : site.homeBackgroundUrl;
  const backgroundUrl = configuredBg &&
    !configuredBg.startsWith("/media/") &&
    configuredBg !== "/studio-assets/studio-k-banner-hq.webp"
    ? configuredBg
    : "/studio-assets/studio-k-banner.webp";
  const shellStyle = { "--studio-bg-image": `url("${backgroundUrl.replaceAll('"', "%22")}")` } as CSSProperties;
  const profileName = me.authenticated ? (me.user?.name || me.user?.username || "Conta conectada") : "Visitante";
  const profileSub = me.authenticated
    ? (me.profile?.equippedTitle?.label || "Studio K Member")
    : "Discord não conectado";

  return (
    <div className={`studio-shell ${variant === "control" ? "control-shell" : ""}`} style={shellStyle}>
      <aside className="sidebar">
        <Link href="/" className="brand-block" aria-label="Studio K · Início">
          <BrandMark src={logoSrc} name={site.brandName || "Studio K"} />
          <div>
            <strong>{site.brandName || "STUDIO K"}</strong>
            <span>{tagline}</span>
          </div>
        </Link>

        <nav className="side-nav" aria-label="Navegação principal">
          {nav.map((item) => {
            const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            return (
              <Link key={item.href} href={item.href} className={active ? "active" : ""}>
                <Icon name={item.icon} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="sidebar-live glass-panel" aria-label="Status ao vivo do Studio K">
          <div className="sidebar-live-head">
            <span>Status ao vivo</span>
            <i className={status.botOnline ? "live-pulse online" : "live-pulse offline"} />
          </div>
          <div className="sidebar-live-row">
            <span>Bot</span>
            <strong className={status.botOnline ? "online" : "offline"}>{status.botOnline ? "Online" : "Offline"}</strong>
          </div>
          <div className="sidebar-live-row">
            <span>Loja</span>
            <strong className={status.storeOpen ? "online" : "offline"}>{status.storeOpen ? "Online" : "Offline"}</strong>
          </div>
          <div className="sidebar-live-row">
            <span>Tickets</span>
            <strong className={status.ticketsOpen ? "online" : "offline"}>{status.ticketsOpen ? "Disponíveis" : "Fechados"}</strong>
          </div>
          <div className="sidebar-live-totals">
            <div><strong>{status.openTickets}</strong><span>Tickets abertos</span></div>
            <div><strong>{status.pendingOrders}</strong><span>Pedidos pendentes</span></div>
          </div>
        </div>

        <StudioRadio />

        <div className="sidebar-spacer" />

        {me.canControl && (
          <Link href="/control" className={pathname.startsWith("/control") ? "control-link active" : "control-link"}>
            <Icon name="control" />
            <span>Central de Controle</span>
            <i className="admin-dot" aria-label="Acesso Staff liberado" />
          </Link>
        )}

        <div className="sidebar-foot">
          <Link href="/account" className="mini-profile">
            {me.user?.avatar ? (
              <img className="profile-avatar" src={me.user.avatar} alt="" loading="lazy" decoding="async" />
            ) : (
              <div className="avatar-placeholder">{me.authenticated ? "SK" : "K"}</div>
            )}
            <div>
              <strong>{profileName}</strong>
              <span>{loading ? "Sincronizando..." : profileSub}</span>
            </div>
          </Link>
        </div>
      </aside>

      <main className="main-panel">
        <header className="topbar">
          <div>
            {eyebrow && <span className="top-eyebrow">{eyebrow}</span>}
            {title && <span className="top-title">{title}</span>}
          </div>

          <div className="top-actions">
            <CommerceActions />
            <ThemeToggle />
            <div className={`status-chip ${status.storeOpen ? "online" : "offline"}`} title="Sincronizado com o status configurado no bot">
              <span className="status-dot" />
              {status.storeOpen ? "Loja Online" : "Loja Offline"}
            </div>
            <a className="btn btn-outline compact" href={appInvite}>
              Entrar no Discord
              <Icon name="arrow" />
            </a>
          </div>
        </header>

        <section className="page-content"><CommerceBanners />{children}</section>
      </main>

      {variant !== "control" && enhancementsReady && (
        <Suspense fallback={null}>
          <StudioAssistant />
          <AccountTickets />
        </Suspense>
      )}
      <BehaviorTracker />
    </div>
  );
}
