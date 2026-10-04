"use client";

import { ChangeEvent, useState } from "react";
import ModelStage from "@/components/model-stage";
import { studioApi } from "@/lib/studio-api";

type Props = {
  onUse?: (url: string, sourceName: string) => void;
  onChanged?: () => void | Promise<void>;
};

type PairStats = {
  drawables: number;
  drawableName: string;
  lod: string;
  meshes: number;
  vertices: number;
  triangles: number;
  textures: number;
  materials: number;
};

type UploadedAsset = {
  id?: string;
  error?: string;
};

const prettyBytes = (value: number) => {
  if (!value) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.min(units.length - 1, Math.floor(Math.log(value) / Math.log(1024)));
  return `${(value / Math.pow(1024, i)).toFixed(i ? 1 : 0)} ${units[i]}`;
};

async function uploadPrivate(file: File) {
  const ticket = await studioApi.uploadTicket(file.name, false);
  const target = new URL(ticket.uploadUrl);
  target.searchParams.set("name", file.name);
  const response = await fetch(target, {
    method: "PUT",
    headers: { "Content-Type": file.type || "application/octet-stream" },
    body: file
  });
  const result = await response.json().catch(() => ({})) as UploadedAsset;
  if (!response.ok || !result.id) throw new Error(result.error || `Falha ao enviar ${file.name}.`);
  return result.id;
}

export default function FiveMConverter({ onUse, onChanged }: Props) {
  const [ydd, setYdd] = useState<File | null>(null);
  const [ytd, setYtd] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("Aguardando YDD + YTD");
  const [error, setError] = useState("");
  const [resultUrl, setResultUrl] = useState("");
  const [stats, setStats] = useState<PairStats | null>(null);

  const choose = (kind: "ydd" | "ytd", event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    event.target.value = "";
    if (!file) return;
    const ext = file.name.toLowerCase().split(".").pop();
    if (ext !== kind) {
      setError(`Selecione um arquivo .${kind.toUpperCase()} válido.`);
      return;
    }
    if (kind === "ydd") setYdd(file); else setYtd(file);
    setResultUrl("");
    setStats(null);
    setError("");
    setStatus("Par FiveM pronto para processamento");
  };

  const convert = async () => {
    if (!ydd || !ytd) {
      setError("Adicione o arquivo .YDD e o .YTD da mesma peça.");
      return;
    }

    setBusy(true);
    setError("");
    setResultUrl("");
    setStats(null);
    try {
      setStatus("Enviando YDD e YTD como fontes privadas...");
      const [yddAssetId, ytdAssetId] = await Promise.all([uploadPrivate(ydd), uploadPrivate(ytd)]);
      setStatus("Lendo geometria, UV, materiais e texturas do FiveM...");
      const result = await studioApi.processFiveMPreview(yddAssetId, ytdAssetId);
      setResultUrl(result.publicUrl);
      setStats(result.stats);
      setStatus("Prévia FiveM pronta");
      await onChanged?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível processar o par YDD/YTD.");
      setStatus("Falha no processamento");
    } finally {
      setBusy(false);
    }
  };

  const baseYdd = ydd?.name.replace(/\.ydd$/i, "").toLowerCase() || "";
  const baseYtd = ytd?.name.replace(/\.ytd$/i, "").toLowerCase() || "";
  const namesDiffer = Boolean(baseYdd && baseYtd && baseYdd !== baseYtd);

  return (
    <div className="converter-layout">
      <section className="converter-panel glass-panel">
        <div className="form-heading">
          <div>
            <span className="section-eyebrow">FIVEM · YDD + YTD</span>
            <h2>Viewer nativo Studio K</h2>
          </div>
          <span className={`converter-status ${busy ? "working" : ""}`}>{status}</span>
        </div>

        <p className="converter-note">
          Use o YDD da malha e o YTD das texturas. Os dois arquivos ficam privados; o site publica somente uma prévia GLB derivada para o viewer.
        </p>

        <div className="converter-file-list">
          <div className="converter-file">
            <span className="asset-icon">YDD</span>
            <div>
              <strong>{ydd?.name || "Malha FiveM (.ydd)"}</strong>
              <small>{ydd ? prettyBytes(ydd.size) : "Obrigatório"}</small>
            </div>
            <label className="btn btn-outline compact file-button">
              {ydd ? "Trocar" : "Escolher"}
              <input type="file" accept=".ydd" disabled={busy} onChange={(event) => choose("ydd", event)} />
            </label>
          </div>

          <div className="converter-file">
            <span className="asset-icon">YTD</span>
            <div>
              <strong>{ytd?.name || "Texturas FiveM (.ytd)"}</strong>
              <small>{ytd ? prettyBytes(ytd.size) : "Obrigatório"}</small>
            </div>
            <label className="btn btn-outline compact file-button">
              {ytd ? "Trocar" : "Escolher"}
              <input type="file" accept=".ytd" disabled={busy} onChange={(event) => choose("ytd", event)} />
            </label>
          </div>
        </div>

        {namesDiffer && (
          <div className="control-notice error">
            Os nomes-base do YDD e YTD são diferentes. A prévia pode funcionar, mas para uma correspondência mais fiel prefira arquivos da mesma peça.
          </div>
        )}
        {error && <div className="control-notice error">{error}</div>}

        <button className="btn btn-primary converter-run" type="button" disabled={busy || !ydd || !ytd} onClick={() => void convert()}>
          {busy ? "Processando FiveM..." : "Gerar prévia 3D do YDD + YTD"}
        </button>
      </section>

      <section className="converter-result glass-panel">
        <span className="section-eyebrow">RESULTADO</span>
        <h2>{resultUrl ? "Prévia 3D pronta" : "O resultado aparecerá aqui"}</h2>

        <ModelStage modelUrl={resultUrl} title={ydd?.name || "FiveM YDD/YTD"} compact />

        {stats && (
          <div className="converter-stats">
            <div><span>Drawable</span><strong>{stats.drawableName || "—"}</strong></div>
            <div><span>LOD</span><strong>{stats.lod.toUpperCase()}</strong></div>
            <div><span>Malhas</span><strong>{stats.meshes}</strong></div>
            <div><span>Vértices</span><strong>{stats.vertices.toLocaleString("pt-BR")}</strong></div>
            <div><span>Triângulos</span><strong>{stats.triangles.toLocaleString("pt-BR")}</strong></div>
            <div><span>Texturas</span><strong>{stats.textures}</strong></div>
          </div>
        )}

        {resultUrl && (
          <div className="converter-link-box">
            <label>Prévia pública gerada</label>
            <input readOnly value={resultUrl} onFocus={(event) => event.currentTarget.select()} />
            {onUse && (
              <button className="btn btn-primary" type="button" onClick={() => onUse(resultUrl, ydd?.name || "modelo.ydd")}>
                Usar no cadastro
              </button>
            )}
          </div>
        )}

        <p className="converter-note">
          O navegador não renderiza YDD/YTD diretamente. A conversão preserva a geometria, UV e textura difusa da peça e adapta o resultado para o viewer web.
        </p>
      </section>
    </div>
  );
}
