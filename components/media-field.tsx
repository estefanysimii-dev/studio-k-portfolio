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
  onConvertFiveM?: () => void;
};

const accepts: Record<Kind, string> = {
  image: ".png,.jpg,.jpeg,.webp,.gif,.psd",
  model: ".glb,.gltf,.fbx,.blend",
  video: ".mp4,.webm"
};

const sourceFormats = new Set(["psd", "fbx", "blend"]);
const extension = (name: string) => name.toLowerCase().split(".").pop() || "";

async function uploadAsset(file: File, isPublic: boolean) {
  const ticket = await studioApi.uploadTicket(file.name, isPublic);
  const target = new URL(ticket.uploadUrl);
  target.searchParams.set("name", file.name);

  const response = await fetch(target, {
    method: "PUT",
    headers: { "Content-Type": file.type || "application/octet-stream" },
    body: file
  });

  const result = await response.json().catch(() => ({})) as {
    id?: string;
    publicUrl?: string;
    visibility?: "public" | "private";
    error?: string;
  };
  if (!response.ok || !result.id) throw new Error(result.error || "Não foi possível enviar o arquivo.");
  return result;
}

export default function MediaField({ label, kind, value, onChange, onConvertFiveM }: Props) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");

  const upload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    const ext = extension(file.name);
    setBusy(true);
    setError("");
    setStatus(sourceFormats.has(ext) ? "Enviando fonte privada..." : "Enviando mídia...");
    try {
      const source = await uploadAsset(file, !sourceFormats.has(ext));
      if (sourceFormats.has(ext)) {
        setStatus(ext === "psd" ? "Gerando preview..." : "Convertendo para GLB...");
        const processed = await studioApi.processAsset(source.id!);
        onChange(processed.publicUrl);
        setStatus(ext === "psd" ? "Preview gerado" : "GLB pronto");
      } else {
        if (!source.publicUrl) throw new Error("O arquivo foi enviado, mas não recebeu URL pública.");
        onChange(source.publicUrl);
        setStatus("Upload concluído");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha no upload.");
      setStatus("");
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
            {busy ? "Processando..." : "Upload"}
            <input type="file" accept={accepts[kind]} disabled={busy} onChange={(event) => void upload(event)} />
          </label>
          {kind === "model" && onConvertFiveM && (
            <button type="button" onClick={onConvertFiveM}>YDD + YTD</button>
          )}
        </div>
      </div>

      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={
          kind === "image"
            ? "PNG/JPG/WebP/GIF ou PSD (preview automático)"
            : kind === "model"
              ? "GLB/GLTF, FBX ou BLEND"
              : "MP4/WebM ou URL"
        }
      />

      {status && <small className="media-field-status">{status}</small>}
      {error && <small className="media-field-error">{error}</small>}

      {kind === "image" && value && (
        <div className="media-preview image-preview">
          <img src={value} alt="Pré-visualização" />
          <div>
            <strong>Prévia</strong>
            <span>Arquivos PSD permanecem privados; somente o preview gerado é publicado.</span>
          </div>
        </div>
      )}

      {kind === "model" && value && (
        <div className="media-preview model-preview">
          <div className="media-preview-title">
            <strong>Prévia 3D</strong>
            <span>BLEND/FBX são convertidos em GLB. Para arquivos nativos do FiveM, use YDD + YTD.</span>
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
