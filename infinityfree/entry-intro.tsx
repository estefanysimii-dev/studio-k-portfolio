"use client";

import { useEffect, useLayoutEffect, useState } from "react";
import "./entry-intro.css";

type Phase = "locked" | "leaving" | "gone";

export default function EntryIntro() {
  const [phase, setPhase] = useState<Phase>("locked");

  useLayoutEffect(() => {
    document.documentElement.classList.add("studio-entry-locked");
    return () => document.documentElement.classList.remove("studio-entry-locked");
  }, []);

  useEffect(() => {
    if (phase !== "leaving") return;
    document.documentElement.classList.remove("studio-entry-locked");
    const timer = window.setTimeout(() => setPhase("gone"), 900);
    return () => window.clearTimeout(timer);
  }, [phase]);

  if (phase === "gone") return null;

  const enter = () => {
    if (phase !== "locked") return;
    window.dispatchEvent(new Event("studio-k-entered"));
    setPhase("leaving");
  };


  return (
    <div
      className={`studio-entry studio-entry-${phase}`}
      role="button"
      tabIndex={0}
      aria-label="Clique para entrar no STUDIO K - CREATIVE LAB"
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
        <div className="studio-entry-content">
          <div className="studio-entry-infinity">
            <span className="studio-entry-infinity-halo" />
            <img className="crypto-entry-logo" src="/studio-assets/crypto-logo.png" alt="" />
          </div>
          <span className="studio-entry-caption">click to open</span>
        </div>
      </div>
    </div>
  );
}
