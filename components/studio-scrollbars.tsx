"use client";

import {
  CSSProperties,
  KeyboardEvent,
  PointerEvent as ReactPointerEvent,
  WheelEvent as ReactWheelEvent,
  useCallback,
  useEffect,
  useRef,
  useState
} from "react";

type Metrics = {
  visible: boolean;
  top: number;
  height: number;
  maxScroll: number;
  currentScroll: number;
};

type ScrollSide = "left" | "right";
type ScrollTarget = Window | HTMLElement;

const TRACK_INSET = 10;
const MIN_THUMB = 54;
const emptyMetrics: Metrics = {
  visible: false,
  top: TRACK_INSET,
  height: MIN_THUMB,
  maxScroll: 0,
  currentScroll: 0
};

function metricsForWindow(): Metrics {
  const root = document.documentElement;
  const body = document.body;
  const viewport = window.innerHeight;
  const scrollHeight = Math.max(
    root.scrollHeight,
    body?.scrollHeight || 0,
    root.offsetHeight,
    body?.offsetHeight || 0
  );
  return makeMetrics(viewport, scrollHeight, window.scrollY);
}

function metricsForElement(element: HTMLElement): Metrics {
  return makeMetrics(element.clientHeight, element.scrollHeight, element.scrollTop);
}

function makeMetrics(viewport: number, scrollHeight: number, currentScroll: number): Metrics {
  const maxScroll = Math.max(0, scrollHeight - viewport);
  const trackHeight = Math.max(0, window.innerHeight - TRACK_INSET * 2);
  const ratio = scrollHeight > 0 ? Math.min(1, viewport / scrollHeight) : 1;
  const thumbHeight = Math.min(trackHeight, Math.max(MIN_THUMB, ratio * trackHeight));
  const travel = Math.max(0, trackHeight - thumbHeight);
  const safeCurrent = Math.min(maxScroll, Math.max(0, currentScroll));
  const progress = maxScroll > 0 ? safeCurrent / maxScroll : 0;

  return {
    visible: maxScroll > 2 && trackHeight > MIN_THUMB,
    top: TRACK_INSET + travel * progress,
    height: thumbHeight,
    maxScroll,
    currentScroll: safeCurrent
  };
}

export default function StudioScrollbars() {
  const [leftMetrics, setLeftMetrics] = useState<Metrics>(emptyMetrics);
  const [rightMetrics, setRightMetrics] = useState<Metrics>(emptyMetrics);
  const sidebarRef = useRef<HTMLElement | null>(null);
  const frame = useRef<number | null>(null);

  const sidebarTarget = useCallback(() => {
    const sidebar = document.querySelector<HTMLElement>(".sidebar");
    sidebarRef.current = sidebar;
    return sidebar;
  }, []);

  const measure = useCallback(() => {
    if (typeof window === "undefined") return;

    const page = metricsForWindow();
    const sidebar = sidebarTarget();
    const sidebarMetrics = sidebar ? metricsForElement(sidebar) : emptyMetrics;

    // On desktop, the left rail controls the fixed sidebar when it overflows.
    // If the sidebar does not overflow (e.g. mobile), the left rail mirrors page scrolling.
    setLeftMetrics(sidebarMetrics.visible ? sidebarMetrics : page);
    setRightMetrics(page);
  }, [sidebarTarget]);

  const scheduleMeasure = useCallback(() => {
    if (frame.current !== null) cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => {
      frame.current = null;
      measure();
    });
  }, [measure]);

  useEffect(() => {
    let observedSidebar: HTMLElement | null = null;

    const bindSidebar = () => {
      const next = document.querySelector<HTMLElement>(".sidebar");
      if (next === observedSidebar) return;
      observedSidebar?.removeEventListener("scroll", scheduleMeasure);
      observedSidebar = next;
      sidebarRef.current = next;
      observedSidebar?.addEventListener("scroll", scheduleMeasure, { passive: true });
    };

    const sync = () => {
      bindSidebar();
      scheduleMeasure();
    };

    sync();
    window.addEventListener("scroll", scheduleMeasure, { passive: true });
    window.addEventListener("resize", sync);

    const resizeObserver = new ResizeObserver(sync);
    resizeObserver.observe(document.documentElement);
    if (document.body) resizeObserver.observe(document.body);
    if (sidebarRef.current) resizeObserver.observe(sidebarRef.current);

    const mutationObserver = new MutationObserver(() => {
      const previous = observedSidebar;
      bindSidebar();
      if (observedSidebar && observedSidebar !== previous) {
        try { resizeObserver.observe(observedSidebar); } catch {}
        scheduleMeasure();
      }
    });

    const mutationRoot = document.getElementById("root") || document.body;
    if (mutationRoot) {
      mutationObserver.observe(mutationRoot, {
        childList: true,
        subtree: true
      });
    }

    return () => {
      window.removeEventListener("scroll", scheduleMeasure);
      window.removeEventListener("resize", sync);
      observedSidebar?.removeEventListener("scroll", scheduleMeasure);
      resizeObserver.disconnect();
      mutationObserver.disconnect();
      if (frame.current !== null) cancelAnimationFrame(frame.current);
    };
  }, [scheduleMeasure]);

  const targetFor = (side: ScrollSide): ScrollTarget => {
    if (side === "left") {
      const sidebar = sidebarRef.current;
      if (sidebar && sidebar.scrollHeight - sidebar.clientHeight > 2) return sidebar;
    }
    return window;
  };

  const currentFor = (target: ScrollTarget) =>
    target === window ? window.scrollY : (target as HTMLElement).scrollTop;

  const scrollTo = (target: ScrollTarget, top: number, behavior: ScrollBehavior = "auto") => {
    if (target === window) window.scrollTo({ top, behavior });
    else (target as HTMLElement).scrollTo({ top, behavior });
  };

  const metricsFor = (side: ScrollSide) => side === "left" ? leftMetrics : rightMetrics;

  const scrollToTrackPoint = (side: ScrollSide, clientY: number) => {
    const metrics = metricsFor(side);
    const target = targetFor(side);
    const trackHeight = Math.max(0, window.innerHeight - TRACK_INSET * 2);
    const travel = Math.max(1, trackHeight - metrics.height);
    const desiredThumbTop = Math.min(
      travel,
      Math.max(0, clientY - TRACK_INSET - metrics.height / 2)
    );
    scrollTo(target, (desiredThumbTop / travel) * metrics.maxScroll, "smooth");
  };

  const startDrag = (side: ScrollSide, event: ReactPointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();

    const metrics = metricsFor(side);
    const target = targetFor(side);
    const startY = event.clientY;
    const startScroll = currentFor(target);
    const trackHeight = Math.max(0, window.innerHeight - TRACK_INSET * 2);
    const travel = Math.max(1, trackHeight - metrics.height);
    const scrollPerPixel = metrics.maxScroll / travel;

    document.documentElement.classList.add("studio-scrollbar-dragging");

    const move = (moveEvent: globalThis.PointerEvent) => {
      const next = startScroll + (moveEvent.clientY - startY) * scrollPerPixel;
      scrollTo(target, Math.min(metrics.maxScroll, Math.max(0, next)), "auto");
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

  const handleKey = (side: ScrollSide, event: KeyboardEvent<HTMLDivElement>) => {
    const metrics = metricsFor(side);
    const target = targetFor(side);
    const current = currentFor(target);
    const page = Math.max(160, window.innerHeight * 0.78);
    let next: number | null = null;

    if (event.key === "ArrowDown") next = current + 90;
    if (event.key === "ArrowUp") next = current - 90;
    if (event.key === "PageDown") next = current + page;
    if (event.key === "PageUp") next = current - page;
    if (event.key === "Home") next = 0;
    if (event.key === "End") next = metrics.maxScroll;

    if (next !== null) {
      event.preventDefault();
      scrollTo(target, Math.min(metrics.maxScroll, Math.max(0, next)), "smooth");
    }
  };

  const handleWheel = (side: ScrollSide, event: ReactWheelEvent<HTMLDivElement>) => {
    const target = targetFor(side);
    if (side !== "left" || target === window) return;
    event.preventDefault();
    const metrics = metricsFor(side);
    const next = currentFor(target) + event.deltaY;
    scrollTo(target, Math.min(metrics.maxScroll, Math.max(0, next)), "auto");
  };

  const bar = (side: ScrollSide, metrics: Metrics) => {
    if (!metrics.visible) return null;

    const style = {
      "--studio-scroll-top": `${metrics.top}px`,
      "--studio-scroll-height": `${metrics.height}px`
    } as CSSProperties;

    const leftControlsSidebar =
      side === "left" &&
      !!sidebarRef.current &&
      sidebarRef.current.scrollHeight - sidebarRef.current.clientHeight > 2;

    return (
      <div
        className={`studio-scrollbar studio-scrollbar-${side} ${leftControlsSidebar ? "controls-sidebar" : "controls-page"}`}
        role="scrollbar"
        aria-label={
          leftControlsSidebar
            ? "Rolagem do menu lateral"
            : `Rolagem da página — lado ${side === "left" ? "esquerdo" : "direito"}`
        }
        aria-orientation="vertical"
        aria-valuemin={0}
        aria-valuemax={Math.round(metrics.maxScroll)}
        aria-valuenow={Math.round(metrics.currentScroll)}
        tabIndex={0}
        style={style}
        onKeyDown={(event) => handleKey(side, event)}
        onWheel={(event) => handleWheel(side, event)}
        onPointerDown={(event) => scrollToTrackPoint(side, event.clientY)}
      >
        <span className="studio-scrollbar-rail" aria-hidden="true" />
        <div
          className="studio-scrollbar-thumb"
          onPointerDown={(event) => startDrag(side, event)}
          aria-hidden="true"
        >
          <i />
        </div>
      </div>
    );
  };

  if (!leftMetrics.visible && !rightMetrics.visible) return null;

  return (
    <div className="studio-scrollbars" aria-label="Barras de rolagem Studio K">
      {bar("left", leftMetrics)}
      {bar("right", rightMetrics)}
    </div>
  );
}
