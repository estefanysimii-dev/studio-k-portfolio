"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { studioApi } from "@/lib/studio-api";

function visitorId() {
  try {
    const key = "studio-k-visitor-id";
    const saved = localStorage.getItem(key);
    if (saved) return saved;
    const value = typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `visitor-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
    localStorage.setItem(key, value);
    return value;
  } catch {
    return `session-${Date.now()}`;
  }
}

function sourceMeta() {
  let referrerHost = "";
  try {
    if (document.referrer) referrerHost = new URL(document.referrer).hostname.replace(/^www\./, "");
  } catch {}
  const params = new URLSearchParams(window.location.search);
  const source = params.get("utm_source") || referrerHost || "Direto";
  return {
    source: source.slice(0, 80),
    referrerHost: referrerHost.slice(0, 80),
    device: window.innerWidth <= 720 ? "mobile" : window.innerWidth <= 1100 ? "tablet" : "desktop"
  };
}

export default function BehaviorTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname || pathname.startsWith("/control")) return;
    const sessionId = visitorId();
    const started = performance.now();
    let maxScrollDepth = 0;
    let sentLeave = false;
    const product = pathname.match(/^\/products\/([^/]+)$/);
    const portfolio = pathname.match(/^\/portfolio\/([^/]+)$/);
    let itemKind: "product" | "portfolio" | "page" = "page";
    let itemId = "";

    if (product) {
      itemKind = "product";
      itemId = product[1];
      try { itemId = decodeURIComponent(itemId); } catch {}
    } else if (portfolio) {
      itemKind = "portfolio";
      itemId = portfolio[1];
      try { itemId = decodeURIComponent(itemId); } catch {}
    }

    void studioApi.track({
      sessionId,
      event: "page_view",
      itemKind: "page",
      path: pathname,
      meta: sourceMeta()
    });

    if (itemKind === "product") {
      void studioApi.track({ sessionId, event: "product_view", itemKind, itemId, path: pathname });
      try {
        const key = "studio-k-product-view-memory";
        const memory = JSON.parse(localStorage.getItem(key) || "{}") as Record<string, { count?: number; lastViewedAt?: number }>;
        const current = memory[itemId] || {};
        const count = Math.min(999, Number(current.count || 0) + 1);
        memory[itemId] = { count, lastViewedAt: Date.now() };
        localStorage.setItem(key, JSON.stringify(memory));
        window.dispatchEvent(new CustomEvent("studio-k-product-viewed", { detail: { itemId, count } }));
      } catch {}
    } else if (itemKind === "portfolio") {
      void studioApi.track({ sessionId, event: "portfolio_view", itemKind, itemId, path: pathname });
    }

    const updateScroll = () => {
      const scrollable = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      maxScrollDepth = Math.max(maxScrollDepth, Math.min(100, Math.round(window.scrollY / scrollable * 100)));
    };
    window.addEventListener("scroll", updateScroll, { passive: true });
    updateScroll();

    const sendLeave = () => {
      if (sentLeave) return;
      sentLeave = true;
      updateScroll();
      const durationSec = Math.max(0, Math.round((performance.now() - started) / 1000));
      void studioApi.track({
        sessionId,
        event: "page_leave",
        itemKind,
        itemId,
        path: pathname,
        meta: { durationSec, scrollDepth: maxScrollDepth }
      });
      if (itemKind === "product" && itemId) {
        void studioApi.track({
          sessionId,
          event: "product_dwell",
          itemKind: "product",
          itemId,
          path: pathname,
          meta: { durationSec }
        });
      }
    };

    window.addEventListener("pagehide", sendLeave);
    return () => {
      window.removeEventListener("scroll", updateScroll);
      window.removeEventListener("pagehide", sendLeave);
      sendLeave();
    };
  }, [pathname]);

  useEffect(() => {
    if (!pathname || pathname.startsWith("/control")) return;
    const handleClick = (event: MouseEvent) => {
      const target = event.target instanceof Element ? event.target.closest("a,button") : null;
      if (!target) return;
      const label = (target.textContent || target.getAttribute("aria-label") || "").replace(/\s+/g, " ").trim().slice(0, 100);
      const href = target instanceof HTMLAnchorElement ? target.getAttribute("href") || "" : "";
      if (!label && !href) return;
      const xPct = window.innerWidth ? Math.max(0, Math.min(100, event.clientX / window.innerWidth * 100)) : 0;
      const yPct = window.innerHeight ? Math.max(0, Math.min(100, event.clientY / window.innerHeight * 100)) : 0;
      void studioApi.track({
        sessionId: visitorId(),
        event: "click",
        itemKind: "page",
        path: pathname,
        meta: {
          label,
          href: href.slice(0, 180),
          xPct: Math.round(xPct * 10) / 10,
          yPct: Math.round(yPct * 10) / 10,
          viewportWidth: window.innerWidth,
          viewportHeight: window.innerHeight
        }
      });
    };
    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, [pathname]);

  return null;
}
