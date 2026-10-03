"use client";

import { useEffect, useRef, useState } from "react";
import Icon from "./icons";

type Props = {
  modelUrl?: string;
  posterUrl?: string;
  title?: string;
  compact?: boolean;
};

type ModelViewerElement = HTMLElement & {
  cameraOrbit?: string;
  cameraTarget?: string;
  variantName?: string | null;
  availableVariants?: string[];
};

export default function ModelStage({ modelUrl = "", posterUrl = "", title = "Modelo Studio K", compact = false }: Props) {
  const wrapper = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<ModelViewerElement | null>(null);
  const [ready, setReady] = useState(false);
  const [autoRotate, setAutoRotate] = useState(true);
  const [zoom, setZoom] = useState(105);
  const [variants, setVariants] = useState<string[]>([]);
  const [variant, setVariant] = useState("");

  useEffect(() => {
    let active = true;
    setReady(false);
    setVariants([]);
    setVariant("");
    setZoom(105);

    if (!modelUrl) return;

    const connectViewer = async () => {
      if (typeof window === "undefined" || !window.customElements) return;
      try {
        await window.customElements.whenDefined("model-viewer");
        if (!active) return;
        const viewer = viewerRef.current;
        const syncVariants = () => {
          const available = Array.from(viewer?.availableVariants || []);
          setVariants(available);
          if (available.length && !available.includes(variant)) setVariant("");
        };
        viewer?.addEventListener("load", syncVariants);
        setReady(true);
        syncVariants();
        return () => viewer?.removeEventListener("load", syncVariants);
      } catch {
        if (active) setReady(false);
      }
    };

    let cleanup: (() => void) | undefined;
    void connectViewer().then((fn) => { cleanup = fn; });
    return () => {
      active = false;
      cleanup?.();
    };
  }, [modelUrl]);

  const setOrbitZoom = (next: number) => {
    const value = Math.max(55, Math.min(180, next));
    setZoom(value);
    if (viewerRef.current) viewerRef.current.cameraOrbit = `auto auto ${value}%`;
  };

  const reset = () => {
    setZoom(105);
    setVariant("");
    setAutoRotate(true);
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

  const autoProps = autoRotate ? { "auto-rotate": "" } : {};

  return (
    <div ref={wrapper} className={`model-stage glass-panel ${compact ? "model-stage-compact" : ""}`}>
      <div className="model-orbit orbit-a" />
      <div className="model-orbit orbit-b" />
      <div className="model-halo" />

      {modelUrl && ready ? (
        <model-viewer
          ref={(node) => { viewerRef.current = node as ModelViewerElement | null; }}
          src={modelUrl}
          poster={posterUrl || undefined}
          alt={title}
          camera-controls=""
          {...autoProps}
          rotation-per-second="18deg"
          shadow-intensity="1"
          exposure="1.05"
          interaction-prompt="auto"
          loading={compact ? "lazy" : "eager"}
        />
      ) : posterUrl ? (
        <img className="model-poster" src={posterUrl} alt={title} />
      ) : (
        <div className="model-placeholder">
          <Icon name="cube" />
          <small>GLB / GLTF</small>
        </div>
      )}

      <div className="model-controls">
        <button type="button" onClick={() => setOrbitZoom(zoom + 15)} aria-label="Diminuir zoom">−</button>
        <button type="button" onClick={() => setOrbitZoom(zoom - 15)} aria-label="Aumentar zoom">+</button>
        <button type="button" onClick={() => setAutoRotate((value) => !value)}>{autoRotate ? "Pausar" : "Auto 360°"}</button>
        <button type="button" onClick={reset}>Reset</button>
        <button type="button" onClick={fullscreen}>Tela cheia</button>
      </div>

      {variants.length > 0 && (
        <label className="model-variant-picker">
          <span>Variante</span>
          <select value={variant} onChange={(event) => chooseVariant(event.target.value)}>
            <option value="">Padrão</option>
            {variants.map((name) => <option value={name} key={name}>{name}</option>)}
          </select>
        </label>
      )}

      <div className="model-hint">
        {modelUrl ? "Arraste para girar · scroll/pinch para zoom" : "Viewer 3D pronto para receber um GLB/GLTF"}
      </div>
    </div>
  );
}
