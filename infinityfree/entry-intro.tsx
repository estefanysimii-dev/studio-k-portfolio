"use client";

import { useEffect, useState } from "react";
import "./entry-intro.css";

type Phase = "locked" | "leaving" | "gone";

export default function EntryIntro() {
  const [phase, setPhase] = useState<Phase>("locked");

  useEffect(() => {
    document.documentElement.classList.add("studio-entry-locked");
    return () => document.documentElement.classList.remove("studio-entry-locked");
  }, []);

  useEffect(() => {
    if (phase !== "leaving") return;
    document.documentElement.classList.remove("studio-entry-locked");
    const timer = window.setTimeout(() => setPhase("gone"), 1000);
    return () => window.clearTimeout(timer);
  }, [phase]);

  if (phase === "gone") return null;

  const enter = () => {
    if (phase === "locked") setPhase("leaving");
  };

  return (
    <div
      className={`studio-entry studio-entry-${phase}`}
      role="button"
      tabIndex={0}
      aria-label="Clique para entrar no Studio K"
      onClick={enter}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          enter();
        }
      }}
    >
      <div className="studio-entry-bg" aria-hidden="true" />
      <div className="studio-entry-stars" aria-hidden="true" />

      <div className="studio-entry-stage" aria-hidden="true">
        <div className="studio-entry-art studio-entry-logo">
          <span className="studio-entry-aura" />
          <img src="/studio-assets/studio-k-logo.webp" alt="" draggable={false} />
        </div>

        <div className="studio-entry-infinity">
          <span className="studio-entry-core" />
          <svg viewBox="0 0 420 210" focusable="false">
            <path
              className="studio-entry-inf-glow"
              d="M34 105C70 26 145 26 210 105C275 184 350 184 386 105C350 26 275 26 210 105C145 184 70 184 34 105Z"
            />
            <path
              className="studio-entry-inf-line"
              d="M34 105C70 26 145 26 210 105C275 184 350 184 386 105C350 26 275 26 210 105C145 184 70 184 34 105Z"
            />
            <path
              className="studio-entry-inf-runner"
              d="M34 105C70 26 145 26 210 105C275 184 350 184 386 105C350 26 275 26 210 105C145 184 70 184 34 105Z"
            />
          </svg>
        </div>

        <div className="studio-entry-art studio-entry-kiki">
          <span className="studio-entry-aura" />
          <img src="/studio-assets/studio-k-mascot.webp" alt="" draggable={false} />
        </div>
      </div>

      <div className="studio-entry-copy">
        <span>STUDIO K</span>
        <strong>Clique para entrar</strong>
        <small>Experiência interativa · FiveM Design</small>
      </div>
    </div>
  );
}
