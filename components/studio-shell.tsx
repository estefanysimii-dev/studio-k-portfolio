"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import Icon from "./icons";
import { useStudio } from "./studio-provider";

const nav = [
  { href: "/", label: "Início", icon: "home" },
  { href: "/portfolio", label: "Portfólio", icon: "portfolio" },
  { href: "/products", label: "Produtos", icon: "products" },
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
  const { site, me } = state;

  const invite = site.discordInviteUrl || "/discord";
  const profileName = me.authenticated ? (me.user?.name || me.user?.username || "Conta conectada") : "Visitante";
  const profileSub = me.authenticated ? "Discord conectado" : "Discord não conectado";

  return (
    <div className={`studio-shell ${variant === "control" ? "control-shell" : ""}`}>
      <aside className="sidebar">
        <Link href="/" className="brand-block" aria-label="Studio K · Início">
          <BrandMark src={site.logoUrl} name={site.brandName || "Studio K"} />
          <div>
            <strong>{site.brandName || "STUDIO K"}</strong>
            <span>{site.brandTagline || "KINETIC LOOM"}</span>
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
              <img className="profile-avatar" src={me.user.avatar} alt="" />
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
            <div className="status-chip">
              <span className="status-dot" />
              Studio K online
            </div>
            <a className="btn btn-outline compact" href={invite}>
              Entrar no Discord
              <Icon name="arrow" />
            </a>
          </div>
        </header>

        <section className="page-content">{children}</section>
      </main>
    </div>
  );
}
