"use client";

import { useEffect } from "react";

export default function AmbientLight() {
  useEffect(() => {
    const root = document.documentElement;

    const onMove = (event: PointerEvent) => {
      root.style.setProperty("--cursor-x", `${event.clientX}px`);
      root.style.setProperty("--cursor-y", `${event.clientY}px`);
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  return <div className="ambient-light" aria-hidden="true" />;
}
