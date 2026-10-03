"use client";

import { ChangeEvent, useState } from "react";
import ModelStage from "@/components/model-stage";
import { studioApi } from "@/lib/studio-api";

type Kind = "image" | "model" | "video";

type Props = {
  label: string;
  kind: Kind;
  value: string;
  onChange: (value: string) => void;
  onConvertObj?: () => void;
};

const accepts: Record<Kind, string> = {
  image: ".png,.jpg,.jpeg,.webp,.gif",
  model: ".glb,.gltf",
  video: ".mp4,.webm"
};

async function uploadPublic(file: File) {
  const ticket = await studioApi.uploadTicket(file.name, true);
  const target = new URL(ticket.uploadUrl);
  target.searchParams.set("name", file.name);

  const response = await fetch(target, {
    method: "PUT",
    headers: { "Content-Type": file.type || "application/octet-stream" },
    body: file
  });

  const result = await response.json().catch(() => ({})) as { publicUrl?: string; error?: string };
  if (!response.ok || !result.publicUrl) {
    throw new Error(result.error || "Não foi possível publicar o arquivo.");
  }
  return result.publicUrl;
}

export default function MediaField({ label, kind, value, onChange, onConvertObj }: Props) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const upload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setBusy(true);
    setError("");
    try {
      const url = await uploadPublic(file);
      onChange(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha no upload.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="media-field">
      <div className="media-field-head">
        <span>{label}</span>
        <div className="media-field-actions">
          <label className="mini-upload">
            {busy ? "Enviando..." : "Fazer upload"}
            <input type="file" accept={accepts[kind]} disabled={busy} onChange={(event) => void upload(event)} />
          </label>
          {kind === "model" && onConvertObj && (
            <button type="button" onClick={onConvertObj}>Converter OBJ</button>
          )}
        </div>
      </div>

      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={
          kind === "image"
            ? "Envie uma capa ou cole a URL"
            : kind === "model"
              ? "Envie GLB/GLTF ou use o Conversor OBJ"
              : "Envie MP4/WebM ou cole a URL"
        }
      />

      {error && <small className="media-field-error">{error}</small>}

      {kind === "image" && value && (
        <div className="media-preview image-preview">
          <img src={value} alt="Pré-visualização da capa" />
          <div>
            <strong>Prévia da capa</strong>
            <span>Esta é a imagem que será usada no card do projeto.</span>
          </div>
        </div>
      )}

      {kind === "model" && value && (
        <div className="media-preview model-preview">
          <div className="media-preview-title">
            <strong>Prévia 3D antes de publicar</strong>
            <span>Gire e confira o modelo dentro da própria Central.</span>
          </div>
          <ModelStage modelUrl={value} compact />
        </div>
      )}

      {kind === "video" && value && (
        <div className="media-preview video-preview">
          <video src={value} controls preload="metadata" />
        </div>
      )}
    </div>
  );
}
