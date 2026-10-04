"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { useStudio } from "./studio-provider";

export default function CommerceBanners() {
  const { state } = useStudio();
  const pathname = usePathname();
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("studio-k-dismissed-banners") || "[]") as string[];
      setDismissed(new Set(Array.isArray(saved) ? saved : []));
    } catch {
      setDismissed(new Set());
    }
  }, []);

  const pagePlacement = pathname === "/" ? "home" : pathname.startsWith("/products") ? "products" : pathname.startsWith("/portfolio") ? "portfolio" : "";
  const banners = state.commerce?.banners || [];
  const pageMatches = (pages: string[] = []) => pages.some((rule) => rule === "*" || (rule.endsWith("*") ? pathname.startsWith(rule.slice(0, -1)) : pathname === rule));
  const inline = useMemo(
    () => banners.filter((banner) => banner.placement === "all" || banner.placement === pagePlacement || (banner.placement === "specific" && pageMatches(banner.pages || []))),
    [banners, pagePlacement, pathname]
  );
  const popup = banners.find((banner) => banner.placement === "popup" && !dismissed.has(banner.id));

  const dismiss = (id: string) => {
    const next = new Set(dismissed);
    next.add(id);
    setDismissed(next);
    try { localStorage.setItem("studio-k-dismissed-banners", JSON.stringify([...next])); } catch {}
  };

  return (
    <>
      {!!inline.length && (
        <div className="commerce-banner-stack">
          {inline.slice(0, 3).map((banner) => (
            <a className="commerce-banner" href={banner.href || "#"} key={banner.id}>
              {banner.imageUrl && <img src={banner.imageUrl} alt="" />}
              <div>
                <strong>{banner.title}</strong>
                {banner.text && <span>{banner.text}</span>}
              </div>
              {banner.href && <b>Ver agora →</b>}
            </a>
          ))}
        </div>
      )}

      {popup && (
        <div className="commerce-popup-backdrop" role="dialog" aria-modal="true" aria-label={popup.title}>
          <article className="commerce-popup glass-panel">
            <button type="button" className="commerce-popup-close" onClick={() => dismiss(popup.id)} aria-label="Fechar">×</button>
            {popup.imageUrl && <img src={popup.imageUrl} alt="" />}
            <span className="section-eyebrow">STUDIO K</span>
            <strong>{popup.title}</strong>
            {popup.text && <p>{popup.text}</p>}
            {popup.href && <a className="btn btn-primary" href={popup.href} onClick={() => dismiss(popup.id)}>Ver agora</a>}
          </article>
        </div>
      )}
    </>
  );
}
