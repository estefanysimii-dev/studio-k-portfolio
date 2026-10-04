"use client";

import { CSSProperties, KeyboardEvent, PointerEvent as ReactPointerEvent, useCallback, useEffect, useRef, useState } from "react";

type Metrics = {
  visible: boolean;
  top: number;
  height: number;
  maxScroll: number;
  currentScroll: number;
};

const TRACK_INSET = 10;
const MIN_THUMB = 54;

export default function StudioScrollbars() {
  const [metrics, setMetrics] = useState<Metrics>({ visible: false, top: TRACK_INSET, height: MIN_THUMB, maxScroll: 0, currentScroll: 0 });
  const frame = useRef<number | null>(null);

  const measure = useCallback(() => {
    if (typeof window === "undefined") return;

    const root = document.documentElement;
    const body = document.body;
    const viewport = window.innerHeight;
    const scrollHeight = Math.max(
      root.scrollHeight,
      body?.scrollHeight || 0,
      root.offsetHeight,
      body?.offsetHeight || 0
    );
    const maxScroll = Math.max(0, scrollHeight - viewport);
    const trackHeight = Math.max(0, viewport - TRACK_INSET * 2);
    const thumbHeight = Math.min(
      trackHeight,
      Math.max(MIN_THUMB, scrollHeight > 0 ? (viewport / scrollHeight) * trackHeight : trackHeight)
    );
    const travel = Math.max(0, trackHeight - thumbHeight);
    const progress = maxScroll > 0 ? Math.min(1, Math.max(0, window.scrollY / maxScroll)) : 0;

    setMetrics({
      visible: maxScroll > 2 && trackHeight > MIN_THUMB,
      top: TRACK_INSET + travel * progress,
      height: thumbHeight,
      maxScroll,
      currentScroll: Math.min(maxScroll, Math.max(0, window.scrollY))
    });
  }, []);

  const scheduleMeasure = useCallback(() => {
    if (frame.current !== null) cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => {
      frame.current = null;
      measure();
    });
  }, [measure]);

  useEffect(() => {
    scheduleMeasure();

    window.addEventListener("scroll", scheduleMeasure, { passive: true });
    window.addEventListener("resize", scheduleMeasure);

    const resizeObserver = new ResizeObserver(scheduleMeasure);
    resizeObserver.observe(document.documentElement);
    if (document.body) resizeObserver.observe(document.body);

    const mutationObserver = new MutationObserver(scheduleMeasure);
    if (document.body) {
      mutationObserver.observe(document.body, {
        childList: true,
        subtree: true,
        characterData: true
      });
    }

    return () => {
      window.removeEventListener("scroll", scheduleMeasure);
      window.removeEventListener("resize", scheduleMeasure);
      resizeObserver.disconnect();
      mutationObserver.disconnect();
      if (frame.current !== null) cancelAnimationFrame(frame.current);
    };
  }, [scheduleMeasure]);

  const scrollToTrackPoint = (clientY: number) => {
    const viewport = window.innerHeight;
    const trackHeight = Math.max(0, viewport - TRACK_INSET * 2);
    const travel = Math.max(1, trackHeight - metrics.height);
    const desiredThumbTop = Math.min(
      travel,
      Math.max(0, clientY - TRACK_INSET - metrics.height / 2)
    );
    window.scrollTo({ top: (desiredThumbTop / travel) * metrics.maxScroll, behavior: "smooth" });
  };

  const startDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();

    const startY = event.clientY;
    const startScroll = window.scrollY;
    const viewport = window.innerHeight;
    const trackHeight = Math.max(0, viewport - TRACK_INSET * 2);
    const travel = Math.max(1, trackHeight - metrics.height);
    const scrollPerPixel = metrics.maxScroll / travel;

    document.documentElement.classList.add("studio-scrollbar-dragging");

    const move = (moveEvent: globalThis.PointerEvent) => {
      const target = startScroll + (moveEvent.clientY - startY) * scrollPerPixel;
      window.scrollTo({ top: Math.min(metrics.maxScroll, Math.max(0, target)), behavior: "auto" });
    };

    const finish = () => {
      document.documentElement.classList.remove("studio-scrollbar-dragging");
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", finish);
      window.removeEventListener("pointercancel", finish);
    };

    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", finish, { once: true });
    window.addEventListener("pointercancel", finish, { once: true });
  };

  const handleKey = (event: KeyboardEvent<HTMLDivElement>) => {
    const page = Math.max(160, window.innerHeight * 0.78);
    let next: number | null = null;

    if (event.key === "ArrowDown") next = window.scrollY + 90;
    if (event.key === "ArrowUp") next = window.scrollY - 90;
    if (event.key === "PageDown") next = window.scrollY + page;
    if (event.key === "PageUp") next = window.scrollY - page;
    if (event.key === "Home") next = 0;
    if (event.key === "End") next = metrics.maxScroll;

    if (next !== null) {
      event.preventDefault();
      window.scrollTo({ top: Math.min(metrics.maxScroll, Math.max(0, next)), behavior: "smooth" });
    }
  };

  if (!metrics.visible) return null;

  const style = {
    "--studio-scroll-top": `${metrics.top}px`,
    "--studio-scroll-height": `${metrics.height}px`
  } as CSSProperties;

  const bar = (side: "left" | "right") => (
    <div
      className={`studio-scrollbar studio-scrollbar-${side}`}
      role="scrollbar"
      aria-label={`Rolagem da página — lado ${side === "left" ? "esquerdo" : "direito"}`}
      aria-orientation="vertical"
      aria-valuemin={0}
      aria-valuemax={Math.round(metrics.maxScroll)}
      aria-valuenow={Math.round(metrics.currentScroll)}
      tabIndex={0}
      style={style}
      onKeyDown={handleKey}
      onPointerDown={(event) => scrollToTrackPoint(event.clientY)}
    >
      <span className="studio-scrollbar-rail" aria-hidden="true" />
      <div className="studio-scrollbar-thumb" onPointerDown={startDrag} aria-hidden="true">
        <i />
      </div>
    </div>
  );

  return (
    <div className="studio-scrollbars" aria-label="Barras de rolagem Studio K">
      {bar("left")}
      {bar("right")}
    </div>
  );
}
