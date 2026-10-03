"use client";

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useStudio } from './studio-provider';
import { studioApi } from '@/lib/studio-api';
import { scheduledPosition } from '@/lib/radio-clock';
import type Hls from 'hls.js';

export default function StudioRadio() {
  const { state } = useStudio();
  const pathname = usePathname();
  const radio = state.site.radio;
  const configKey = JSON.stringify(radio);
  const host = useRef<HTMLDivElement>(null);
  const panel = useRef<HTMLElement>(null);
  const actions = useRef({ play: () => {}, pause: () => {}, live: () => {}, volume: (_value: number) => {} });
  const [playing, setPlaying] = useState(false);
  const [ready, setReady] = useState(false);
  const [compact, setCompact] = useState(true);
  const [volume, setVolume] = useState(0.5);
  const [message, setMessage] = useState('Iniciar rádio');
  const [trackTitle, setTrackTitle] = useState('');
  const [spectrum, setSpectrum] = useState(false);

  useEffect(() => {
    if (!radio?.enabled || radio.source === 'spotify') return;
    let active = true, wanted = false;
    let audio: HTMLAudioElement | undefined, hls: Hls | undefined;
    let context: AudioContext | undefined, analyser: AnalyserNode | undefined, frame = 0, attempt = 0;
    let clock: { now: number; at: number } | undefined, selected = -1;
    let syncing = false;
    const timers: number[] = [];
    const safeRead = (key: string) => { try { return localStorage.getItem(key); } catch { return null; } };
    const safeWrite = (key: string, value: string) => { try { localStorage.setItem(key, value); } catch {} };
    const saved = Number(safeRead('studio-radio-volume') ?? radio.defaultVolume);
    const initialVolume = Number.isFinite(saved) ? Math.max(0, Math.min(1, saved)) : radio.defaultVolume;
    setReady(false); setPlaying(false); setSpectrum(false); setTrackTitle('');
    setMessage('Iniciar rádio'); setVolume(initialVolume);
    setCompact(safeRead('studio-radio-compact') ? safeRead('studio-radio-compact') === 'true' : radio.compact);

    async function updateClock() {
      if (syncing) return;
      syncing = true;
      const start = performance.now();
      try {
        const snapshot = await studioApi.radio();
        const end = performance.now();
        if (active) clock = { now: snapshot.serverNowMs + (end - start) / 2, at: end };
      } catch {
        if (active && !clock) setMessage('Sem conexão com a rádio. Tente novamente.');
      } finally { syncing = false; }
    }
    const now = () => clock ? clock.now + performance.now() - clock.at : null;
    function align(force = false) {
      if (!audio) return;
      if (radio!.source === 'schedule') {
        const time = now();
        if (time === null) return;
        const target = scheduledPosition(radio!, time);
        if (!target) return;
        if (selected !== target.index) {
          selected = target.index;
          audio.src = radio!.tracks[selected].url;
          audio.load();
          setTrackTitle(radio!.tracks[selected].title);
          if (wanted) void playAudio();
        }
        if (audio.readyState >= 1 && (force || Math.abs(audio.currentTime - target.seconds) > 2)) {
          try { audio.currentTime = target.seconds; } catch {}
        }
      } else if (audio.seekable.length) {
        const last = audio.seekable.length - 1;
        const live = hls?.liveSyncPosition ?? Math.max(audio.seekable.start(last), audio.seekable.end(last) - 3);
        if (force || Math.abs(audio.currentTime - live) > 3) audio.currentTime = live;
      }
    }
    async function playAudio() {
      if (!audio || !active || !wanted) return;
      const currentAttempt = ++attempt;
      try {
        await audio.play();
        if (active && wanted && currentAttempt === attempt) align(true);
      } catch (error) {
        if (!active || !wanted || currentAttempt !== attempt) return;
        if (error instanceof DOMException && error.name === 'AbortError') return;
        setPlaying(false);
        setMessage(error instanceof DOMException && error.name === 'NotAllowedError' ? 'Clique para iniciar a rádio ao vivo' : 'Áudio indisponível. Tente novamente.');
      }
    }
    function analyze() {
      if (!audio || !radio!.analyze || context) return;
      try {
        context = new AudioContext();
        const node = context.createMediaElementSource(audio);
        analyser = context.createAnalyser(); analyser.fftSize = 1024; analyser.smoothingTimeConstant = 0.75;
        node.connect(analyser); analyser.connect(context.destination);
        const bins = new Uint8Array(analyser.frequencyBinCount);
        const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
        const draw = () => {
          if (!active || !analyser || !context) return;
          analyser.getByteFrequencyData(bins);
          const energy = (low: number, high: number) => {
            const start = Math.floor(low / (context!.sampleRate / analyser!.fftSize));
            const end = Math.min(bins.length, Math.ceil(high / (context!.sampleRate / analyser!.fftSize)));
            let sum = 0; for (let i = start; i < end; i++) sum += bins[i];
            return sum / Math.max(1, end - start) / 255;
          };
          if (!reduceMotion.matches) {
            panel.current?.style.setProperty('--bass', String(audio!.paused ? 0 : energy(40, 250)));
            panel.current?.style.setProperty('--treble', String(audio!.paused ? 0 : energy(2000, 10000)));
          }
          frame = requestAnimationFrame(draw);
        };
        setSpectrum(true); draw();
      } catch { setSpectrum(false); }
    }

    actions.current = {
      play: () => {
        wanted = true;
        if (audio) {
          if (!clock && radio.source === 'schedule') { setMessage('Sincronizando… Clique em iniciar novamente.'); void updateClock(); return; }
          analyze(); void context?.resume(); align(true); void playAudio();
        }
      },
      pause: () => { wanted = false; ++attempt; audio?.pause(); setMessage('Pausada · retomar ao vivo'); },
      live: () => { if (audio) { wanted = true; analyze(); void context?.resume(); align(true); void playAudio(); } },
      volume: value => { if (audio) audio.volume = value; safeWrite('studio-radio-volume', String(value)); }
    };
    const visible = () => { if (document.visibilityState === 'visible') { void updateClock().then(() => { if (active && wanted) { align(true); void playAudio(); } }); } };
    document.addEventListener('visibilitychange', visible);
    window.addEventListener('pageshow', visible);

    {
      audio = new Audio();
      host.current?.replaceChildren(audio);
      if (radio.analyze) audio.crossOrigin = 'anonymous';
      audio.preload = 'metadata'; audio.volume = initialVolume;
      audio.onplaying = () => { if (active) { setPlaying(true); setMessage('Ao vivo'); } };
      audio.onpause = () => { if (active) setPlaying(false); };
      audio.onwaiting = () => { if (active) { setPlaying(false); setMessage('Carregando transmissão…'); } };
      audio.onerror = () => { if (active) { setPlaying(false); setMessage('Fonte indisponível. Verifique o áudio e o CORS na Central.'); } };
      audio.onloadedmetadata = () => { align(true); };
      audio.onended = () => { if (wanted) { align(true); void playAudio(); } };
      void updateClock().then(() => {
        if (!active) return;
        if (radio.source === 'schedule') {
          align(true); setReady(Boolean(clock));
          if (radio.autoplay && clock) { wanted = true; void playAudio(); }
        }
      });
      if (radio.source === 'hls') {
        const initialize = () => { if (active) { setReady(true); if (radio.autoplay) { wanted = true; void playAudio(); } } };
        if (audio.canPlayType('application/vnd.apple.mpegurl')) { audio.src = radio.streamUrl; initialize(); }
        else void import('hls.js').then(({ default: HLS }) => {
          if (!active || !audio) return;
          if (!HLS.isSupported()) { setMessage('Este navegador não suporta esta transmissão.'); return; }
          hls = new HLS({ lowLatencyMode: true });
          hls.on(HLS.Events.MANIFEST_PARSED, initialize);
          hls.on(HLS.Events.ERROR, (_event, data) => { if (active && data.fatal) { setPlaying(false); setMessage('Transmissão indisponível. Verifique a fonte na Central.'); } });
          hls.loadSource(radio.streamUrl); hls.attachMedia(audio);
        }).catch(() => { if (active) setMessage('Não foi possível carregar a transmissão.'); });
      }
      timers.push(window.setInterval(() => { if (wanted && radio.source === 'schedule') align(); }, 1000));
      timers.push(window.setInterval(() => { if (wanted && radio.source === 'hls') align(); }, 15000));
      timers.push(window.setInterval(() => { void updateClock().then(() => { if (active && radio.source === 'schedule') { setReady(Boolean(clock)); if (wanted) align(); } }); }, 30000));
    }
    return () => {
      active = false; wanted = false; ++attempt; actions.current = { play: () => {}, pause: () => {}, live: () => {}, volume: () => {} };
      timers.forEach(clearInterval); cancelAnimationFrame(frame);
      document.removeEventListener('visibilitychange', visible); window.removeEventListener('pageshow', visible);
      hls?.destroy();
      if (audio) { audio.onplaying = audio.onpause = audio.onwaiting = audio.onerror = audio.onloadedmetadata = audio.onended = null; audio.pause(); audio.removeAttribute('src'); audio.load(); }
      void context?.close(); panel.current?.style.removeProperty('--bass'); panel.current?.style.removeProperty('--treble');
    };
    // Keyed by saved settings, never by navigation or periodic public-state refresh.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [configKey]);

  if (!radio?.enabled || radio.source === 'spotify') return null;
  const hidden = pathname.startsWith('/control') && !radio.showInControl;
  return <aside ref={panel} hidden={hidden} className={`studio-radio radio-${radio.position} ${playing ? 'is-playing' : ''} ${spectrum ? 'has-spectrum' : ''}`} aria-label={radio.name}>
    <div className="radio-heading"><div><small>RÁDIO AO VIVO</small><strong>{radio.name}</strong></div>
      <button type="button" aria-expanded={!compact} aria-label={compact ? 'Expandir rádio' : 'Recolher rádio'} onClick={() => { setCompact(!compact); try { localStorage.setItem('studio-radio-compact', String(!compact)); } catch {} }}>{compact ? '+' : '−'}</button>
    </div>
    <div className="radio-controls">
      <button type="button" disabled={!ready} onClick={() => playing ? actions.current.pause() : actions.current.play()}>{playing ? 'Pausar' : 'Iniciar rádio'}</button>
      <button type="button" disabled={!ready} title="Retomar o ponto atual da programação" onClick={() => actions.current.live()}>Voltar ao vivo</button>
      <span className="radio-bars" aria-hidden="true">{[0, 1, 2, 3, 4].map(i => <i key={i} style={{ animationDelay: `${i * 0.13}s` }} />)}</span>
    </div>
    <p role="status">{message}{playing && trackTitle ? ` · ${trackTitle}` : ''}</p>
    <div hidden={compact}>
      <label>Volume <input type="range" min="0" max="1" step="0.01" value={volume} onChange={e => { const value = Number(e.target.value); setVolume(value); actions.current.volume(value); }} /></label>
      <small>{spectrum ? 'Graves e agudos medidos do áudio.' : 'Animação decorativa baseada na reprodução.'}</small>
    </div>
    <div ref={host} hidden />
  </aside>;
}
