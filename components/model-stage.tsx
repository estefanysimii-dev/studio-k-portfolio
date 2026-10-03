"use client";

import { useEffect, useRef, useState } from "react";
import Icon from "./icons";

type Props = {
  modelUrl?: string;
  posterUrl?: string;
  title?: string;
  compact?: boolean;
};

export default function ModelStage({ modelUrl = "", posterUrl = "", title = "Modelo Studio K", compact = false }: Props) {
  const wrapper = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    if (!modelUrl) return;
    import("@google/model-viewer")
      .then(() => { if (active) setReady(true); })
      .catch(() => { if (active) setReady(false); });
    return () => { active = false; };
  }, [modelUrl]);

  const reset = () => {
    const viewer = wrapper.current?.querySelector("model-viewer") as HTMLElement & {
      cameraOrbit?: string;
      cameraTarget?: string;
    } | null;
    if (!viewer) return;
    viewer.cameraOrbit = "0deg 75deg 105%";
    viewer.cameraTarget = "auto auto auto";
  };

  const fullscreen = async () => {
    if (!wrapper.current) return;
    if (!document.fullscreenElement) await wrapper.current.requestFullscreen?.();
    else await document.exitFullscreen?.();
  };

  return (
    <div ref={wrapper} className={`model-stage glass-panel ${compact ? "model-stage-compact" : ""}`}>
      <div className="model-orbit orbit-a" />
      <div className="model-orbit orbit-b" />
      <div className="model-halo" />

      {modelUrl && ready ? (
        <model-viewer
          src={modelUrl}
          poster={posterUrl || undefined}
          alt={title}
          camera-controls
          auto-rotate
          rotation-per-second="18deg"
          shadow-intensity="1"
          exposure="1.05"
          interaction-prompt="auto"
          loading="eager"
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
        <button type="button" onClick={reset}>Reset</button>
        <button type="button" onClick={fullscreen}>Tela cheia</button>
      </div>
      <div className="model-hint">
        {modelUrl ? "Arraste para girar · scroll para zoom" : "Viewer 3D pronto para receber um GLB/GLTF"}
      </div>
    </div>
  );
}
