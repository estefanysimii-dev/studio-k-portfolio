"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useStudio } from "./studio-provider";
import { useRadioPlayer } from "./radio-player-provider";

export default function StudioRadio() {
  const { state } = useStudio();
  const pathname = usePathname();
  const radio = state.site.radio;
  const {
    playing,
    ready,
    volume,
    message,
    trackTitle,
    spectrum,
    play,
    pause,
    live,
    setVolume
  } = useRadioPlayer();

  const [compact, setCompact] = useState(true);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("studio-radio-compact");
      setCompact(saved ? saved === "true" : Boolean(radio?.compact));
    } catch {
      setCompact(Boolean(radio?.compact));
    }
  }, [radio?.compact]);

  if (!radio?.enabled || radio.source === "spotify") return null;

  const hidden = pathname.startsWith("/control") && !radio.showInControl;

  return (
    <aside
      hidden={hidden}
      className={`studio-radio radio-${radio.position} ${playing ? "is-playing" : ""} ${spectrum ? "has-spectrum" : ""}`}
      aria-label={radio.name}
    >
      <div className="radio-heading">
        <div>
          <small>RÁDIO AO VIVO</small>
          <strong>{radio.name}</strong>
        </div>
        <button
          type="button"
          aria-expanded={!compact}
          aria-label={compact ? "Expandir rádio" : "Recolher rádio"}
          onClick={() => {
            const next = !compact;
            setCompact(next);
            try { localStorage.setItem("studio-radio-compact", String(next)); } catch {}
          }}
        >
          {compact ? "+" : "−"}
        </button>
      </div>

      <div className="radio-controls">
        <button type="button" disabled={!ready} onClick={() => playing ? pause() : play()}>
          {playing ? "Pausar" : "Iniciar rádio"}
        </button>
        <button type="button" disabled={!ready} title="Retomar o ponto atual da programação" onClick={live}>
          Voltar ao vivo
        </button>
        <span className="radio-bars" aria-hidden="true">
          {[0, 1, 2, 3, 4].map((i) => <i key={i} style={{ animationDelay: `${i * 0.13}s` }} />)}
        </span>
      </div>

      <p role="status">
        {message}{playing && trackTitle ? ` · ${trackTitle}` : ""}
      </p>

      <div hidden={compact}>
        <label>
          Volume
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            onChange={(event) => setVolume(Number(event.target.value))}
          />
        </label>
        <small>{spectrum ? "Graves e agudos medidos do áudio." : "Animação decorativa baseada na reprodução."}</small>
      </div>
    </aside>
  );
}
