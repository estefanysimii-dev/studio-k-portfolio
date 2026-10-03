"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Icon from "./icons";

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
};

export default function StudioShell({ eyebrow, title, children }: Props) {
  const pathname = usePathname();

  return (
    <div className="studio-shell">
      <aside className="sidebar">
        <div className="brand-block">
          <div className="brand-mark">K</div>
          <div>
            <strong>STUDIO K</strong>
            <span>KINETIC LOOM</span>
          </div>
        </div>

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

        <Link href="/control" className={pathname.startsWith("/control") ? "control-link active" : "control-link"}>
          <Icon name="control" />
          <span>Central de Controle</span>
        </Link>

        <div className="sidebar-foot">
          <div className="mini-profile">
            <div className="avatar-placeholder">SK</div>
            <div>
              <strong>Visitante</strong>
              <span>Discord não conectado</span>
            </div>
          </div>
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
              Discord online
            </div>
            <a className="btn btn-outline compact" href="#" aria-label="Entrar no Discord">
              Entrar no Discord
              <Icon name="arrow" />
            </a>
          </div>
        </header>

        <section className="page-content">
          {children}
        </section>
      </main>
    </div>
  );
}
