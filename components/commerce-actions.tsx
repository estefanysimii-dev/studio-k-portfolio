"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { studioApi } from "@/lib/studio-api";
import { useStudio } from "./studio-provider";

export default function CommerceActions() {
  const { state, refresh } = useStudio();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<{ kind: string; id: string; title: string; subtitle: string; href: string }[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);

  const notifications = state.personal?.notifications || [];
  const unread = notifications.filter((item) => !item.read).length;
  const cartCount = (state.personal?.cart || []).reduce((sum, item) => sum + item.quantity, 0);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      return;
    }
    const timer = window.setTimeout(async () => {
      try {
        const next = await studioApi.search(q);
        setResults(next.results);
        setSearchOpen(true);
      } catch {
        setResults([]);
      }
    }, 220);
    return () => window.clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (wrap.current && !wrap.current.contains(event.target as Node)) {
        setSearchOpen(false);
        setNotificationsOpen(false);
      }
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const grouped = useMemo(() => {
    const map = new Map<string, typeof results>();
    for (const result of results) {
      const current = map.get(result.kind) || [];
      current.push(result);
      map.set(result.kind, current);
    }
    return [...map.entries()];
  }, [results]);

  const markRead = async (id: string) => {
    try {
      await studioApi.markNotification(id, true);
      await refresh();
    } catch {}
  };

  return (
    <div className="commerce-actions" ref={wrap}>
      <div className="global-search">
        <button type="button" className="top-icon-button search-trigger" onClick={() => setSearchOpen((value) => !value)} aria-label="Buscar">
          ⌕
        </button>
        <div className={`global-search-panel ${searchOpen ? "open" : ""}`}>
          <div className="global-search-input">
            <span>⌕</span>
            <input
              autoFocus={searchOpen}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar produtos, projetos e coleções..."
            />
            {query && <button type="button" onClick={() => setQuery("")}>×</button>}
          </div>
          {query.trim().length < 2 ? (
            <p className="global-search-hint">Digite pelo menos 2 caracteres.</p>
          ) : grouped.length ? (
            <div className="global-search-results">
              {grouped.map(([kind, entries]) => (
                <section key={kind}>
                  <span>{kind === "product" ? "PRODUTOS" : kind === "portfolio" ? "PORTFÓLIO" : kind === "collection" ? "COLEÇÕES" : kind === "category" ? "CATEGORIAS" : kind === "tag" ? "TAGS" : "STUDIO K"}</span>
                  {entries.map((entry) => (
                    <Link key={`${entry.kind}-${entry.id}`} href={entry.href} onClick={() => setSearchOpen(false)}>
                      <strong>{entry.title}</strong>
                      <small>{entry.subtitle}</small>
                    </Link>
                  ))}
                </section>
              ))}
            </div>
          ) : <p className="global-search-hint">Nenhum resultado encontrado.</p>}
        </div>
      </div>

      {state.me.authenticated && (
        <>
          <div className="notification-menu">
            <button
              type="button"
              className="top-icon-button"
              onClick={() => setNotificationsOpen((value) => !value)}
              aria-label="Notificações"
            >
              ♢
              {unread > 0 && <b>{unread > 9 ? "9+" : unread}</b>}
            </button>
            <div className={`notification-panel ${notificationsOpen ? "open" : ""}`}>
              <div className="notification-head">
                <div><strong>Notificações</strong><span>{unread} não lida{unread === 1 ? "" : "s"}</span></div>
                {unread > 0 && <button type="button" onClick={async () => { await studioApi.readAllNotifications(); await refresh(); }}>Marcar todas</button>}
              </div>
              <div className="notification-list">
                {notifications.length ? notifications.slice(0, 20).map((item) => (
                  <Link
                    key={item.id}
                    href={item.href || "/account"}
                    className={item.read ? "" : "unread"}
                    onClick={() => { void markRead(item.id); setNotificationsOpen(false); }}
                  >
                    <i />
                    <div><strong>{item.title}</strong><p>{item.text}</p><small>{new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(item.created))}</small></div>
                  </Link>
                )) : <p className="notification-empty">Nenhuma notificação por enquanto.</p>}
              </div>
            </div>
          </div>

          <Link href="/cart" className="top-icon-button cart-trigger" aria-label="Carrinho">
            ◇
            {cartCount > 0 && <b>{cartCount > 9 ? "9+" : cartCount}</b>}
          </Link>
        </>
      )}
    </div>
  );
}
