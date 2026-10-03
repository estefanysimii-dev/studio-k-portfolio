"use client";
import { useEffect, useState } from 'react';
import type { RadioConfig } from '@/lib/studio-types';

export const radioDefaults: RadioConfig = { enabled: false, name: 'Rádio Studio K', source: 'spotify', spotifyUrl: '', streamUrl: '', tracks: [], epochMs: 0, position: 'right', compact: true, showInControl: false, autoplay: false, defaultVolume: 0.5, analyze: false };

export default function RadioSettings({ value, onChange }: { value?: RadioConfig; onChange: (value: RadioConfig) => void }) {
  const radio = { ...radioDefaults, ...value };
  const [tracks, setTracks] = useState(JSON.stringify(radio.tracks, null, 2));
  const [error, setError] = useState('');
  const serialized = JSON.stringify(value?.tracks || []);
  useEffect(() => { setTracks(JSON.stringify(JSON.parse(serialized), null, 2)); setError(''); }, [serialized]);
  const change = (patch: Partial<RadioConfig>) => onChange({ ...radio, ...patch });
  return <fieldset className="radio-settings">
    <legend>Rádio Studio K</legend>
    <div className="form-grid two">
      <label className="check-row"><input type="checkbox" checked={radio.enabled} onChange={e => change({ enabled: e.target.checked })} />Ativar rádio</label>
      <label>Nome exibido<input required maxLength={80} value={radio.name} onChange={e => change({ name: e.target.value })} /></label>
      <label>Fonte<select value={radio.source} onChange={e => change({ source: e.target.value as RadioConfig['source'] })}><option value="spotify">Spotify Embed</option><option value="schedule">Programação de áudio próprio</option><option value="hls">Transmissão HLS ao vivo</option></select></label>
      <label>Link da playlist Spotify<input type="url" required={radio.enabled && radio.source === 'spotify'} value={radio.spotifyUrl} onChange={e => change({ spotifyUrl: e.target.value })} placeholder="https://open.spotify.com/playlist/..." /></label>
      {radio.source === 'spotify' && <p className="span-2">Spotify Embed não garante sincronização de músicas e não expõe volume pela API. O visual acompanha apenas o estado de reprodução. Para rádio sincronizada e volume, selecione áudio próprio ou HLS.</p>}
      {radio.source === 'hls' && <label className="span-2">URL do HLS (HTTPS ou caminho no site)<input required={radio.enabled} value={radio.streamUrl} onChange={e => change({ streamUrl: e.target.value })} placeholder="https://audio.seudominio.com/live.m3u8" /><small>A fonte deve ser uma transmissão ao vivo. Playlist e segmentos precisam permitir CORS para o site.</small></label>}
      {radio.source === 'schedule' && <label className="span-2">Programação em ordem (JSON)<textarea rows={8} value={tracks} placeholder={'[{"title":"Faixa 1","url":"https://audio.seudominio.com/faixa.mp3","duration":180}]'} onChange={e => {
        setTracks(e.target.value);
        try {
          const next: unknown = JSON.parse(e.target.value);
          if (!Array.isArray(next)) throw new Error();
          change({ tracks: next }); setError(''); e.target.setCustomValidity('');
        } catch { setError('Insira uma lista JSON válida antes de salvar.'); e.target.setCustomValidity('Insira uma lista JSON válida.'); }
      }} /><small>Duração em segundos, igual à duração real de cada arquivo. A sequência se repete. Alterar a fonte ou a programação cria um novo horário-base no servidor.</small>{error && <span role="alert">{error}</span>}</label>}
      <label>Posição<select value={radio.position} onChange={e => change({ position: e.target.value as 'left' | 'right' })}><option value="right">Inferior direita</option><option value="left">Inferior esquerda</option></select></label>
      <label>Volume inicial<input type="range" min="0" max="1" step="0.01" value={radio.defaultVolume} onChange={e => change({ defaultVolume: Number(e.target.value) })} disabled={radio.source === 'spotify'} /></label>
      <label className="check-row"><input type="checkbox" checked={radio.compact} onChange={e => change({ compact: e.target.checked })} />Começar recolhida</label>
      <label className="check-row"><input type="checkbox" checked={radio.showInControl} onChange={e => change({ showInControl: e.target.checked })} />Mostrar também na Central</label>
      <label className="check-row"><input type="checkbox" checked={radio.autoplay} onChange={e => change({ autoplay: e.target.checked })} />Tentar iniciar automaticamente (sujeito ao navegador)</label>
      <label className="check-row"><input type="checkbox" disabled={radio.source === 'spotify'} checked={radio.analyze} onChange={e => change({ analyze: e.target.checked })} />Analisar graves/agudos reais no áudio próprio</label>
      {radio.source !== 'spotify' && <small className="span-2">Use áudio que você tem autorização para transmitir. A análise exige CORS e começa após interação do visitante. Se a fonte não permitir CORS, desative a análise. As faixas são próprias; o link do Spotify não é convertido em áudio.</small>}
    </div>
  </fieldset>;
}
