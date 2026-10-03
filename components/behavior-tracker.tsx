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

export default function BehaviorTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname || pathname.startsWith("/control")) return;
    const sessionId = visitorId();
    const product = pathname.match(/^\/products\/([^/]+)$/);
    const portfolio = pathname.match(/^\/portfolio\/([^/]+)$/);

    void studioApi.track({
      sessionId,
      event: "page_view",
      itemKind: "page",
      path: pathname
    });

    if (product) {
      let itemId = product[1];
      try { itemId = decodeURIComponent(itemId); } catch {}
      void studioApi.track({
        sessionId,
        event: "product_view",
        itemKind: "product",
        itemId,
        path: pathname
      });
    } else if (portfolio) {
      let itemId = portfolio[1];
      try { itemId = decodeURIComponent(itemId); } catch {}
      void studioApi.track({
        sessionId,
        event: "portfolio_view",
        itemKind: "portfolio",
        itemId,
        path: pathname
      });
    }
  }, [pathname]);

  return null;
}
