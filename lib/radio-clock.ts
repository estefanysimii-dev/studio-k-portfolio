import type { RadioConfig } from './studio-types';

export function scheduledPosition(radio: RadioConfig, serverNowMs: number) {
  const total = radio.tracks.reduce((sum, track) => sum + track.duration, 0);
  if (!total) return null;
  let position = (((serverNowMs - radio.epochMs) / 1000) % total + total) % total;
  for (let index = 0; index < radio.tracks.length; index++) {
    if (position < radio.tracks[index].duration) return { index, seconds: position };
    position -= radio.tracks[index].duration;
  }
  return null;
}
