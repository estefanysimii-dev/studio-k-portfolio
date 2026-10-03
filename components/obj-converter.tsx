"use client";

import { DragEvent, useMemo, useRef, useState } from "react";
import ModelStage from "@/components/model-stage";
import { studioApi } from "@/lib/studio-api";

type Props = {
  onUse?: (url: string, sourceName: string) => void;
  onChanged?: () => void | Promise<void>;
};

type ConvertStats = {
  vertices: number;
  triangles: number;
  meshes: number;
  materials: number;
  inputBytes: number;
  outputBytes: number;
};

type UploadResult = {
  publicUrl?: string;
  visibility?: "public" | "private";
  originalName?: string;
};

const allowed = new Set(["obj", "mtl", "png", "jpg", "jpeg", "webp"]);

const extension = (name: string) => name.toLowerCase().split(".").pop() || "";
const basename = (name: string) => name.replace(/\.[^.]+$/, "");
const prettyBytes = (value: number) => {
  if (!value) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.min(units.length - 1, Math.floor(Math.log(value) / Math.log(1024)));
  return `${(value / Math.pow(1024, i)).toFixed(i ? 1 : 0)} ${units[i]}`;
};

async function uploadAsset(file: Blob, name: string, isPublic: boolean) {
  const ticket = await studioApi.uploadTicket(name, isPublic);
  const target = new URL(ticket.uploadUrl);
  target.searchParams.set("name", name);

  const response = await fetch(target, {
    method: "PUT",
    headers: { "Content-Type": file.type || "application/octet-stream" },
    body: file
  });

  const result = await response.json().catch(() => ({})) as UploadResult & { error?: string };
  if (!response.ok) throw new Error(result.error || `Falha ao enviar ${name}.`);
  return result;
}

export default function ObjConverter({ onUse, onChanged }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [dragging, setDragging] = useState(false);
  const [status, setStatus] = useState("Aguardando arquivos");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [resultUrl, setResultUrl] = useState("");
  const [resultName, setResultName] = useState("");
  const [stats, setStats] = useState<ConvertStats | null>(null);
  const [copied, setCopied] = useState(false);

  const objFile = useMemo(() => files.find((file) => extension(file.name) === "obj"), [files]);
  const mtlFile = useMemo(() => files.find((file) => extension(file.name) === "mtl"), [files]);
  const textureFiles = useMemo(
    () => files.filter((file) => ["png", "jpg", "jpeg", "webp"].includes(extension(file.name))),
    [files]
  );

  const ingest = (incoming: File[]) => {
    const filtered = incoming.filter((file) => allowed.has(extension(file.name)));
    const byName = new Map<string, File>();
    [...files, ...filtered].forEach((file) => byName.set(file.name.toLowerCase(), file));
    setFiles([...byName.values()]);
    setResultUrl("");
    setResultName("");
    setStats(null);
    setError("");
    setStatus(filtered.length ? "Arquivos prontos para conversão" : "Nenhum arquivo compatível encontrado");
  };

  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragging(false);
    ingest(Array.from(event.dataTransfer.files));
  };

  const remove = (name: string) => {
    setFiles((current) => current.filter((file) => file.name !== name));
    setResultUrl("");
    setStats(null);
  };

  const convert = async () => {
    if (!objFile) {
      setError("Adicione um arquivo .OBJ antes de converter.");
      return;
    }

    setBusy(true);
    setError("");
    setResultUrl("");
    setCopied(false);
    setStatus("Carregando conversor 3D...");

    const objectUrls: string[] = [];

    try {
      const dynamicImport = new Function("specifier", "return import(specifier)") as (specifier: string) => Promise<any>;
      const [THREE, objModule, mtlModule, exporterModule] = await Promise.all([
        dynamicImport("three"),
        dynamicImport("three/addons/loaders/OBJLoader.js"),
        dynamicImport("three/addons/loaders/MTLLoader.js"),
        dynamicImport("three/addons/exporters/GLTFExporter.js")
      ]);

      setStatus("Lendo OBJ, materiais e texturas...");

      const resourceMap = new Map<string, string>();
      for (const file of files) {
        const url = URL.createObjectURL(file);
        objectUrls.push(url);
        resourceMap.set(file.name.toLowerCase(), url);
        resourceMap.set(file.name.toLowerCase().replaceAll("\\", "/").split("/").pop() || file.name.toLowerCase(), url);
      }

      const manager = new THREE.LoadingManager();
      manager.setURLModifier((requested: string) => {
        const normalized = decodeURIComponent(requested)
          .replace(/^\.\//, "")
          .replaceAll("\\", "/")
          .split("?")[0]
          .toLowerCase();
        const short = normalized.split("/").pop() || normalized;
        return resourceMap.get(normalized) || resourceMap.get(short) || requested;
      });

      const loader = new objModule.OBJLoader(manager);

      if (mtlFile) {
        const materials = new mtlModule.MTLLoader(manager).parse(await mtlFile.text(), "");
        materials.preload();
        loader.setMaterials(materials);

        if (textureFiles.length) {
          await new Promise<void>((resolve) => {
            const timer = window.setTimeout(resolve, 1800);
            manager.onLoad = () => {
              window.clearTimeout(timer);
              resolve();
            };
          });
        }
      }

      const object = loader.parse(await objFile.text());

      let vertices = 0;
      let triangles = 0;
      let meshes = 0;
      const materialIds = new Set<string>();

      object.traverse((child: any) => {
        if (!child?.isMesh || !child.geometry) return;
        meshes += 1;
        const positionCount = Number(child.geometry.attributes?.position?.count || 0);
        vertices += positionCount;
        triangles += child.geometry.index
          ? Math.floor(Number(child.geometry.index.count || 0) / 3)
          : Math.floor(positionCount / 3);

        const materials = Array.isArray(child.material) ? child.material : [child.material];
        materials.filter(Boolean).forEach((material: any) => materialIds.add(String(material.uuid || material.name || material.id)));
      });

      if (!meshes || !vertices) throw new Error("O OBJ não contém uma malha 3D válida.");

      setStatus("Convertendo para GLB...");
      const exporter = new exporterModule.GLTFExporter();
      const binary = await exporter.parseAsync(object, {
        binary: true,
        onlyVisible: true,
        trs: false,
        maxTextureSize: Infinity
      });

      if (!(binary instanceof ArrayBuffer)) throw new Error("O conversor não conseguiu gerar o GLB binário.");

      const glbName = `${basename(objFile.name)}.glb`;
      const glb = new Blob([binary], { type: "model/gltf-binary" });

      setStatus("Enviando GLB e gerando link...");
      const published = await uploadAsset(glb, glbName, true);
      if (!published.publicUrl) throw new Error("O GLB foi convertido, mas o link público não foi gerado.");

      setStatus("Arquivando o OBJ original de forma privada...");
      for (const source of files) {
        await uploadAsset(source, source.name, false);
      }

      setResultUrl(published.publicUrl);
      setResultName(glbName);
      setStats({
        vertices,
        triangles,
        meshes,
        materials: materialIds.size,
        inputBytes: files.reduce((sum, file) => sum + file.size, 0),
        outputBytes: glb.size
      });
      setStatus("Conversão concluída");
      await onChanged?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível converter o OBJ.");
      setStatus("Falha na conversão");
    } finally {
      objectUrls.forEach((url) => URL.revokeObjectURL(url));
      setBusy(false);
    }
  };

  const copyLink = async () => {
    if (!resultUrl) return;
    await navigator.clipboard.writeText(resultUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className="converter-layout">
      <section className="converter-panel glass-panel">
        <div className="form-heading">
          <div>
            <span className="section-eyebrow">OBJ → GLB</span>
            <h2>Conversor 3D Studio K</h2>
          </div>
          <span className={`converter-status ${busy ? "working" : ""}`}>{status}</span>
        </div>

        <div
          className={`converter-dropzone ${dragging ? "dragging" : ""}`}
          onDragOver={(event) => { event.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") inputRef.current?.click(); }}
        >
          <input
            ref={inputRef}
            type="file"
            multiple
            accept=".obj,.mtl,.png,.jpg,.jpeg,.webp"
            onChange={(event) => ingest(Array.from(event.target.files || []))}
          />
          <div className="converter-cube">3D</div>
          <strong>Arraste seu OBJ aqui</strong>
          <span>Você também pode soltar o .MTL e as texturas PNG/JPG/WebP junto.</span>
          <button type="button" className="btn btn-outline compact">Escolher arquivos</button>
        </div>

        <div className="converter-file-list">
          {files.length ? files.map((file) => (
            <div className="converter-file" key={file.name}>
              <span className="asset-icon">{extension(file.name).toUpperCase()}</span>
              <div>
                <strong>{file.name}</strong>
                <small>{prettyBytes(file.size)}</small>
              </div>
              <button type="button" onClick={() => remove(file.name)} disabled={busy}>Remover</button>
            </div>
          )) : <p className="muted">Nenhum arquivo adicionado.</p>}
        </div>

        <div className="converter-summary">
          <span className={objFile ? "ok" : ""}>{objFile ? "✓ OBJ detectado" : "OBJ obrigatório"}</span>
          <span className={mtlFile ? "ok" : ""}>{mtlFile ? "✓ MTL detectado" : "MTL opcional"}</span>
          <span className={textureFiles.length ? "ok" : ""}>{textureFiles.length ? `✓ ${textureFiles.length} textura(s)` : "Texturas opcionais"}</span>
        </div>

        {error && <div className="control-notice error">{error}</div>}

        <button className="btn btn-primary converter-run" type="button" disabled={busy || !objFile} onClick={() => void convert()}>
          {busy ? "Convertendo..." : "Converter, publicar e gerar link"}
        </button>

        <p className="converter-note">
          O OBJ, MTL e texturas originais são arquivados como fonte privada. O GLB gerado é publicado para o viewer do site.
        </p>
      </section>

      <section className="converter-result glass-panel">
        <span className="section-eyebrow">RESULTADO</span>
        <h2>{resultUrl ? "GLB pronto para uso" : "Prévia e link aparecerão aqui"}</h2>

        <ModelStage modelUrl={resultUrl} title={resultName || "Conversão OBJ"} compact />

        {stats && (
          <div className="converter-stats">
            <div><span>Malhas</span><strong>{stats.meshes}</strong></div>
            <div><span>Vértices</span><strong>{stats.vertices.toLocaleString("pt-BR")}</strong></div>
            <div><span>Triângulos</span><strong>{stats.triangles.toLocaleString("pt-BR")}</strong></div>
            <div><span>Materiais</span><strong>{stats.materials}</strong></div>
            <div><span>Entrada</span><strong>{prettyBytes(stats.inputBytes)}</strong></div>
            <div><span>GLB</span><strong>{prettyBytes(stats.outputBytes)}</strong></div>
          </div>
        )}

        {resultUrl && (
          <div className="converter-link-box">
            <label>Link gerado</label>
            <div>
              <input readOnly value={resultUrl} onFocus={(event) => event.currentTarget.select()} />
              <button className="btn btn-outline compact" type="button" onClick={() => void copyLink()}>
                {copied ? "Copiado!" : "Copiar"}
              </button>
            </div>
            {onUse && (
              <button
                className="btn btn-primary"
                type="button"
                onClick={() => onUse(resultUrl, objFile?.name || resultName)}
              >
                Usar no novo projeto
              </button>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
