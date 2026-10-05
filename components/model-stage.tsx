"use client";

import { useEffect, useRef, useState } from "react";
import Icon from "./icons";
import type { StudioViewerHotspot, StudioViewerVariant } from "@/lib/studio-types";

const MODEL_VIEWER_SRC = "https://unpkg.com/@google/model-viewer@4.1.0/dist/model-viewer.min.js";
let modelViewerPromise: Promise<void> | null = null;

function ensureModelViewer() {
  if (typeof window === "undefined" || !window.customElements) return Promise.resolve();
  if (window.customElements.get("model-viewer")) return Promise.resolve();
  if (modelViewerPromise) return modelViewerPromise;

  modelViewerPromise = new Promise<void>((resolve, reject) => {
    const finish = () => {
      window.customElements.whenDefined("model-viewer").then(() => resolve()).catch(reject);
    };

    let script = document.querySelector<HTMLScriptElement>('script[data-studio-model-viewer="true"]');
    if (!script) {
      script = document.createElement("script");
      script.type = "module";
      script.src = MODEL_VIEWER_SRC;
      script.dataset.studioModelViewer = "true";
      document.head.appendChild(script);
    }

    if (window.customElements.get("model-viewer")) {
      resolve();
      return;
    }

    script.addEventListener("load", finish, { once: true });
    script.addEventListener("error", () => {
      modelViewerPromise = null;
      reject(new Error("Não foi possível carregar o viewer 3D."));
    }, { once: true });
  });

  return modelViewerPromise;
}

type Props = {
  modelUrl?: string;
  compareModelUrl?: string;
  hotspots?: StudioViewerHotspot[];
  viewerVariants?: StudioViewerVariant[];
  posterUrl?: string;
  title?: string;
  compact?: boolean;
  previewOnly?: boolean;
  hideControls?: boolean;
};

type LightingMode = "studio" | "day" | "night";

type ModelViewerElement = HTMLElement & {
  cameraOrbit?: string;
  cameraTarget?: string;
  variantName?: string | null;
  availableVariants?: string[];
};

export default function ModelStage({
  modelUrl = "",
  compareModelUrl = "",
  hotspots = [],
  viewerVariants = [],
  posterUrl = "",
  title = "Modelo Studio K",
  compact = false,
  previewOnly = false,
  hideControls = false
}: Props) {
  const wrapper = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<ModelViewerElement | null>(null);
  const [viewerRequested, setViewerRequested] = useState(false);
  const [ready, setReady] = useState(false);
  const [autoRotate, setAutoRotate] = useState(true);
  const [zoom, setZoom] = useState(105);
  const [variants, setVariants] = useState<string[]>([]);
  const [variant, setVariant] = useState("");
  const [catalogVariant, setCatalogVariant] = useState("");
  const [lighting, setLighting] = useState<LightingMode>("studio");
  const [compare, setCompare] = useState(false);

  const activeCatalogVariant = viewerVariants.find((item) => item.id === catalogVariant);
  const activeModelUrl = compare && compareModelUrl ? compareModelUrl : (activeCatalogVariant?.modelUrl || modelUrl);
  const activePosterUrl = compare ? posterUrl : (activeCatalogVariant?.posterUrl || posterUrl);
  const exposure = lighting === "day" ? "1.32" : lighting === "night" ? "0.58" : "1.05";
  const shadow = lighting === "night" ? "0.35" : lighting === "day" ? "0.82" : "1";

  useEffect(() => {
    setReady(false);
    setVariants([]);
    setVariant("");
    setZoom(105);
  }, [activeModelUrl]);

  useEffect(() => {
    setViewerRequested(false);
    if (!activeModelUrl || typeof window === "undefined") return;

    const node = wrapper.current;
    let entered = !document.documentElement.classList.contains("studio-entry-locked");
    let nearby = false;

    const requestViewer = () => {
      if (entered && nearby) setViewerRequested(true);
    };
    const onEntered = () => {
      entered = true;
      requestViewer();
    };

    window.addEventListener("studio-k-entered", onEntered, { once: true });

    let observer: IntersectionObserver | null = null;
    if (node && "IntersectionObserver" in window) {
      observer = new IntersectionObserver((entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        nearby = true;
        observer?.disconnect();
        requestViewer();
      }, { rootMargin: "420px 0px" });
      observer.observe(node);
    } else {
      nearby = true;
      requestViewer();
    }

    return () => {
      observer?.disconnect();
      window.removeEventListener("studio-k-entered", onEntered);
    };
  }, [activeModelUrl]);

  useEffect(() => {
    if (!activeModelUrl || !viewerRequested) return;
    let active = true;

    const connectViewer = async () => {
      try {
        await ensureModelViewer();
        if (active) setReady(true);
      } catch {
        if (active) setReady(false);
      }
    };

    void connectViewer();
    return () => { active = false; };
  }, [activeModelUrl, viewerRequested]);

  useEffect(() => {
    if (!ready) return;
    const viewer = viewerRef.current;
    if (!viewer) return;

    const syncVariants = () => {
      const available = Array.from(viewer.availableVariants || []);
      setVariants(available);
      setVariant((current) => available.length && !available.includes(current) ? "" : current);
    };

    viewer.addEventListener("load", syncVariants);
    syncVariants();
    return () => viewer.removeEventListener("load", syncVariants);
  }, [activeModelUrl, ready]);

  useEffect(() => {
    if (!compareModelUrl && compare) setCompare(false);
  }, [compare, compareModelUrl]);

  const setOrbitZoom = (next: number) => {
    const value = Math.max(55, Math.min(180, next));
    setZoom(value);
    if (viewerRef.current) viewerRef.current.cameraOrbit = `auto auto ${value}%`;
  };

  const reset = () => {
    setZoom(105);
    setVariant("");
    setCatalogVariant("");
    setAutoRotate(true);
    setLighting("studio");
    const viewer = viewerRef.current;
    if (!viewer) return;
    viewer.cameraOrbit = "0deg 75deg 105%";
    viewer.cameraTarget = "auto auto auto";
    viewer.variantName = null;
  };

  const fullscreen = async () => {
    if (!wrapper.current) return;
    if (!document.fullscreenElement) await wrapper.current.requestFullscreen?.();
    else await document.exitFullscreen?.();
  };

  const chooseVariant = (name: string) => {
    setVariant(name);
    if (viewerRef.current) viewerRef.current.variantName = name || null;
  };

  const cycleLighting = () => {
    setLighting((value) => value === "studio" ? "day" : value === "day" ? "night" : "studio");
  };

  const lightingLabel = lighting === "studio" ? "Luz Studio" : lighting === "day" ? "Luz Dia" : "Luz Noite";
  const autoProps = autoRotate ? { "auto-rotate": "" } : {};

  return (
    <div
      ref={wrapper}
      className={`model-stage glass-panel model-lighting-${lighting} ${compact ? "model-stage-compact" : ""} ${previewOnly ? "model-stage-preview" : ""}`}
    >
      <div className="model-orbit orbit-a" />
      <div className="model-orbit orbit-b" />
      <div className="model-halo" />

      {activeModelUrl && ready ? (
        <model-viewer
          ref={(node) => { viewerRef.current = node as ModelViewerElement | null; }}
          src={activeModelUrl}
          poster={activePosterUrl || undefined}
          alt={compare ? `${title} · antes` : title}
          {...(!previewOnly ? { "camera-controls": "" } : {})}
          {...autoProps}
          rotation-per-second="18deg"
          shadow-intensity={shadow}
          exposure={exposure}
          environment-image="neutral"
          interaction-prompt="auto"
          loading={compact || previewOnly ? "lazy" : "eager"}
        >
          {!previewOnly && !compare && hotspots.map((spot, index) => (
            <button
              type="button"
              key={spot.id || index}
              className="model-hotspot"
              slot={`hotspot-${index + 1}`}
              data-position={spot.position}
              data-normal={spot.normal || "0 1 0"}
              aria-label={spot.label}
            >
              <i aria-hidden="true" />
              <span>{spot.label}</span>
            </button>
          ))}
        </model-viewer>
      ) : activePosterUrl ? (
        <img
          className="model-poster"
          src={activePosterUrl}
          alt={title}
          loading={compact || previewOnly ? "lazy" : "eager"}
          decoding="async"
        />
      ) : (
        <div className="model-placeholder">
          <Icon name="cube" />
          <small>GLB / GLTF</small>
        </div>
      )}

      {!compact && !previewOnly && (
        <div className="model-viewer-mode">
          <span>{compare ? "ANTES" : "STUDIO K"}</span>
          {hotspots.length > 0 && !compare && <small>{hotspots.length} hotspot{hotspots.length === 1 ? "" : "s"}</small>}
        </div>
      )}

      {!previewOnly && !hideControls && <div className="model-controls">
        <button type="button" onClick={() => setOrbitZoom(zoom + 15)} aria-label="Diminuir zoom">−</button>
        <button type="button" onClick={() => setOrbitZoom(zoom - 15)} aria-label="Aumentar zoom">+</button>
        <button type="button" onClick={() => setAutoRotate((value) => !value)}>{autoRotate ? "Pausar" : "Auto 360°"}</button>
        {!compact && <button type="button" onClick={cycleLighting}>{lightingLabel}</button>}
        {compareModelUrl && !compact && (
          <button type="button" className={compare ? "active" : ""} onClick={() => setCompare((value) => !value)}>
            {compare ? "Ver depois" : "Antes / Depois"}
          </button>
        )}
        <button type="button" onClick={reset}>Reset</button>
        <button type="button" onClick={fullscreen}>Tela cheia</button>
      </div>}

      {!previewOnly && viewerVariants.length > 0 && !compare && (
        <div className="model-catalog-variants" aria-label="Cores e variantes disponíveis">
          <span>CORES / VERSÕES</span>
          <div>
            <button
              type="button"
              className={!catalogVariant ? "active" : ""}
              onClick={() => setCatalogVariant("")}
              aria-label="Modelo padrão"
              title="Padrão"
            >
              <i className="variant-default" />
              <small>Padrão</small>
            </button>
            {viewerVariants.map((item) => (
              <button
                type="button"
                key={item.id}
                className={catalogVariant === item.id ? "active" : ""}
                onClick={() => setCatalogVariant(item.id)}
                aria-label={item.label}
                title={item.label}
              >
                <i style={item.colorHex ? { backgroundColor: item.colorHex } : undefined} />
                <small>{item.label}</small>
              </button>
            ))}
          </div>
        </div>
      )}

      {!previewOnly && variants.length > 0 && (
        <label className="model-variant-picker">
          <span>Material interno</span>
          <select value={variant} onChange={(event) => chooseVariant(event.target.value)}>
            <option value="">Padrão</option>
            {variants.map((name) => <option value={name} key={name}>{name}</option>)}
          </select>
        </label>
      )}

      {!previewOnly && (
        <div className="model-hint">
          {activeModelUrl
            ? "Arraste para girar · scroll/pinch para zoom"
            : "Viewer 3D pronto para receber um GLB/GLTF"}
        </div>
      )}
    </div>
  );
}
