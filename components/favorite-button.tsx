"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { studioApi } from "@/lib/studio-api";
import { useStudio } from "./studio-provider";

type Props = {
  kind: "items" | "products";
  itemId: string;
  label?: boolean;
  className?: string;
};

export default function FavoriteButton({ kind, itemId, label = false, className = "" }: Props) {
  const { state, refresh } = useStudio();
  const pathname = usePathname();
  const [busy, setBusy] = useState(false);
  const list = state.me.favorites?.[kind] || state.me.profile?.favorites?.[kind] || [];
  const favorite = list.includes(itemId);

  const toggle = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();

    if (!state.me.authenticated) {
      const next = pathname || "/";
      window.location.href = `/api/oauth/start?next=${encodeURIComponent(next)}`;
      return;
    }

    if (busy) return;
    setBusy(true);
    try {
      await studioApi.setFavorite(kind, itemId, !favorite);
      await refresh();
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      className={`favorite-button ${favorite ? "is-favorite" : ""} ${label ? "with-label" : ""} ${className}`.trim()}
      aria-label={favorite ? "Remover dos favoritos" : "Adicionar aos favoritos"}
      aria-pressed={favorite}
      disabled={busy}
      onClick={toggle}
      title={favorite ? "Remover dos favoritos" : "Adicionar aos favoritos"}
    >
      <span aria-hidden="true">{favorite ? "♥" : "♡"}</span>
      {label && <strong>{favorite ? "Favoritado" : "Favoritar"}</strong>}
    </button>
  );
}
