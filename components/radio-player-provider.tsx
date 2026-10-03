"use client";

import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useStudio } from "./studio-provider";
import { studioApi } from "@/lib/studio-api";
import { scheduledPosition } from "@/lib/radio-clock";
import type Hls from "hls.js";

type RadioPlayerContextValue = {
  playing: boolean;
  ready: boolean;
  volume: number;
  message: string;
  trackTitle: string;
  spectrum: boolean;
  play: () => void;
  pause: () => void;
  live: () => void;
  setVolume: (value: number) => void;
};

const noop = () => {};

const RadioPlayerContext = createContext<RadioPlayerContextValue>({
  playing: false,
  ready: false,
  volume: 0.5,
  message: "Iniciar rádio",
  trackTitle: "",
  spectrum: false,
  play: noop,
  pause: noop,
  live: noop,
  setVolume: noop
});

export function RadioPlayerProvider({ children }: { children: React.ReactNode }) {
  const { state } = useStudio();
  const radio = state.site.radio;
  const configKey = JSON.stringify(radio);
  const host = useRef<HTMLDivElement>(null);
  const actions = useRef({ play: noop, pause: noop, live: noop, volume: (_value: number) => {} });

  const [playing, setPlaying] = useState(false);
  const [ready, setReady] = useState(false);
  const [volume, setVolumeState] = useState(0.5);
  const [message, setMessage] = useState("Iniciar rádio");
  const [trackTitle, setTrackTitle] = useState("");
  const [spectrum, setSpectrum] = useState(false);

  useEffect(() => {
    if (!radio?.enabled || radio.source === "spotify") {
      setPlaying(false);
      setReady(false);
      setMessage("Rádio indisponível");
      return;
    }

    const currentRadio = radio;
    let active = true;
    let wanted = false;
    let audio: HTMLAudioElement | undefined;
    let hls: Hls | undefined;
    let context: AudioContext | undefined;
    let analyser: AnalyserNode | undefined;
    let frame = 0;
    let attempt = 0;
    let clock: { now: number; at: number } | undefined;
    let selected = -1;
    let syncing = false;
    const timers: number[] = [];

    const safeRead = (key: string) => {
      try { return localStorage.getItem(key); } catch { return null; }
    };
    const safeWrite = (key: string, value: string) => {
      try { localStorage.setItem(key, value); } catch {}
    };

    const saved = Number(safeRead("studio-radio-volume") ?? currentRadio.defaultVolume);
    const initialVolume = Number.isFinite(saved) ? Math.max(0, Math.min(1, saved)) : currentRadio.defaultVolume;

    setReady(false);
    setPlaying(false);
    setSpectrum(false);
    setTrackTitle("");
    setMessage("Iniciar rádio");
    setVolumeState(initialVolume);

    async function updateClock() {
      if (syncing) return;
      syncing = true;
      const start = performance.now();
      try {
        const snapshot = await studioApi.radio();
        const end = performance.now();
        if (active) clock = { now: snapshot.serverNowMs + (end - start) / 2, at: end };
      } catch {
        if (active && !clock) setMessage("Sem conexão com a rádio. Tente novamente.");
      } finally {
        syncing = false;
      }
    }

    const now = () => clock ? clock.now + performance.now() - clock.at : null;

    function align(force = false) {
      if (!audio) return;
      if (currentRadio.source === "schedule") {
        const time = now();
        if (time === null) return;
        const target = scheduledPosition(currentRadio, time);
        if (!target) return;

        if (selected !== target.index) {
          selected = target.index;
          audio.src = currentRadio.tracks[selected].url;
          audio.load();
          setTrackTitle(currentRadio.tracks[selected].title);
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
        if (error instanceof DOMException && error.name === "AbortError") return;
        setPlaying(false);
        setMessage(
          error instanceof DOMException && error.name === "NotAllowedError"
            ? "Clique para iniciar a rádio ao vivo"
            : "Áudio indisponível. Tente novamente."
        );
      }
    }

    function setSpectrumVars(bass: number, treble: number) {
      document.documentElement.style.setProperty("--studio-radio-bass", bass.toFixed(4));
      document.documentElement.style.setProperty("--studio-radio-treble", treble.toFixed(4));
    }

    function analyze() {
      if (!audio || !currentRadio.analyze) return;
      if (context && analyser) {
        if (context.state === "suspended") void context.resume().catch(() => {});
        return;
      }

      try {
        context = new AudioContext();
        const node = context.createMediaElementSource(audio);
        analyser = context.createAnalyser();
        analyser.fftSize = 2048;
        analyser.smoothingTimeConstant = 0.68;
        analyser.minDecibels = -92;
        analyser.maxDecibels = -12;
        node.connect(analyser);
        analyser.connect(context.destination);

        const bins = new Uint8Array(analyser.frequencyBinCount);
        const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
        const clamp01 = (value: number) => Math.max(0, Math.min(1, value));

        const draw = () => {
          if (!active || !analyser || !context) return;
          analyser.getByteFrequencyData(bins);

          const energy = (low: number, high: number) => {
            const hzPerBin = context!.sampleRate / analyser!.fftSize;
            const start = Math.max(0, Math.floor(low / hzPerBin));
            const end = Math.min(bins.length, Math.ceil(high / hzPerBin));
            let sum = 0;
            for (let i = start; i < end; i++) sum += bins[i];
            return sum / Math.max(1, end - start) / 255;
          };

          if (!reduceMotion.matches) {
            const paused = audio!.paused || context.state !== "running";
            const rawBass = paused ? 0 : energy(35, 240);
            const rawTreble = paused ? 0 : energy(2200, 11000);
            const bass = clamp01((rawBass - 0.035) * 3.6);
            const treble = clamp01((rawTreble - 0.018) * 4.4);
            setSpectrumVars(bass, treble);
          }

          frame = requestAnimationFrame(draw);
        };

        setSpectrum(true);
        void context.resume().catch(() => {});
        draw();
      } catch {
        setSpectrum(false);
      }
    }

    const resumeSpectrum = () => {
      if (!active || !currentRadio.analyze || !audio) return;
      analyze();
      if (context?.state === "suspended") void context.resume().catch(() => {});
    };

    actions.current = {
      play: () => {
        wanted = true;
        if (!audio) return;
        if (!clock && currentRadio.source === "schedule") {
          setMessage("Sincronizando… Clique em iniciar novamente.");
          void updateClock();
          return;
        }
        analyze();
        void context?.resume();
        align(true);
        void playAudio();
      },
      pause: () => {
        wanted = false;
        ++attempt;
        audio?.pause();
        setMessage("Pausada · retomar ao vivo");
      },
      live: () => {
        if (!audio) return;
        wanted = true;
        analyze();
        void context?.resume();
        align(true);
        void playAudio();
      },
      volume: (value) => {
        if (audio) audio.volume = value;
        safeWrite("studio-radio-volume", String(value));
      }
    };

    const visible = () => {
      if (document.visibilityState !== "visible") return;
      void updateClock().then(() => {
        if (active && wanted) {
          align(true);
          void playAudio();
        }
      });
    };

    document.addEventListener("visibilitychange", visible);
    window.addEventListener("pageshow", visible);
    document.addEventListener("pointerdown", resumeSpectrum, { passive: true });
    document.addEventListener("keydown", resumeSpectrum);

    audio = new Audio();
    host.current?.replaceChildren(audio);
    if (currentRadio.analyze) audio.crossOrigin = "anonymous";
    audio.preload = "metadata";
    audio.volume = initialVolume;

    audio.onplaying = () => {
      if (!active) return;
      setPlaying(true);
      setMessage("Ao vivo");
      resumeSpectrum();
    };
    audio.onpause = () => {
      if (active) setPlaying(false);
    };
    audio.onwaiting = () => {
      if (active) {
        setPlaying(false);
        setMessage("Carregando transmissão…");
      }
    };
    audio.onerror = () => {
      if (active) {
        setPlaying(false);
        setMessage("Fonte indisponível. Verifique o áudio e o CORS na Central.");
      }
    };
    audio.onloadedmetadata = () => align(true);
    audio.onended = () => {
      if (wanted) {
        align(true);
        void playAudio();
      }
    };

    void updateClock().then(() => {
      if (!active) return;
      if (currentRadio.source === "schedule") {
        align(true);
        setReady(Boolean(clock));
        if (currentRadio.autoplay && clock) {
          wanted = true;
          void playAudio();
        }
      }
    });

    if (currentRadio.source === "hls") {
      const initialize = () => {
        if (!active) return;
        setReady(true);
        if (currentRadio.autoplay) {
          wanted = true;
          void playAudio();
        }
      };

      if (audio.canPlayType("application/vnd.apple.mpegurl")) {
        audio.src = currentRadio.streamUrl;
        initialize();
      } else {
        void import("hls.js").then(({ default: HLS }) => {
          if (!active || !audio) return;
          if (!HLS.isSupported()) {
            setMessage("Este navegador não suporta esta transmissão.");
            return;
          }
          hls = new HLS({ lowLatencyMode: true });
          hls.on(HLS.Events.MANIFEST_PARSED, initialize);
          hls.on(HLS.Events.ERROR, (_event, data) => {
            if (active && data.fatal) {
              setPlaying(false);
              setMessage("Transmissão indisponível. Verifique a fonte na Central.");
            }
          });
          hls.loadSource(currentRadio.streamUrl);
          hls.attachMedia(audio);
        }).catch(() => {
          if (active) setMessage("Não foi possível carregar a transmissão.");
        });
      }
    }

    timers.push(window.setInterval(() => {
      if (wanted && currentRadio.source === "schedule") align();
    }, 1000));
    timers.push(window.setInterval(() => {
      if (wanted && currentRadio.source === "hls") align();
    }, 15000));
    timers.push(window.setInterval(() => {
      void updateClock().then(() => {
        if (active && currentRadio.source === "schedule") {
          setReady(Boolean(clock));
          if (wanted) align();
        }
      });
    }, 30000));

    return () => {
      active = false;
      wanted = false;
      ++attempt;
      actions.current = { play: noop, pause: noop, live: noop, volume: () => {} };
      timers.forEach(clearInterval);
      cancelAnimationFrame(frame);
      document.removeEventListener("visibilitychange", visible);
      window.removeEventListener("pageshow", visible);
      document.removeEventListener("pointerdown", resumeSpectrum);
      document.removeEventListener("keydown", resumeSpectrum);
      hls?.destroy();

      if (audio) {
        audio.onplaying = null;
        audio.onpause = null;
        audio.onwaiting = null;
        audio.onerror = null;
        audio.onloadedmetadata = null;
        audio.onended = null;
        audio.pause();
        audio.removeAttribute("src");
        audio.load();
      }

      void context?.close();
      document.documentElement.style.removeProperty("--studio-radio-bass");
      document.documentElement.style.removeProperty("--studio-radio-treble");
    };
    // The player only restarts when the saved radio configuration changes.
    // Internal route navigation does not change configKey, so playback stays continuous.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [configKey]);

  const value = useMemo<RadioPlayerContextValue>(() => ({
    playing,
    ready,
    volume,
    message,
    trackTitle,
    spectrum,
    play: () => actions.current.play(),
    pause: () => actions.current.pause(),
    live: () => actions.current.live(),
    setVolume: (value: number) => {
      const normalized = Math.max(0, Math.min(1, value));
      setVolumeState(normalized);
      actions.current.volume(normalized);
    }
  }), [playing, ready, volume, message, trackTitle, spectrum]);

  return (
    <RadioPlayerContext.Provider value={value}>
      {children}
      <div ref={host} hidden aria-hidden="true" />
    </RadioPlayerContext.Provider>
  );
}

export function useRadioPlayer() {
  return useContext(RadioPlayerContext);
}
