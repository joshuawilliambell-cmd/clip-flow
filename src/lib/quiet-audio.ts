/**
 * Bed-music helper that stays quiet on iOS/iPadOS.
 *
 * Safari ignores HTMLMediaElement.volume (always full level). MediaElementSource
 * also fails silently on some iPhone paths and then falls back to that full
 * blast. Decode into Web Audio and fader with a GainNode instead.
 */

export type QuietAudio = {
  setVolume: (volume: number) => void;
  play: () => Promise<void>;
  pause: () => void;
  dispose: () => void;
};

function clamp01(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.min(1, Math.max(0, n));
}

function getAudioContextCtor(): typeof AudioContext | null {
  if (typeof window === "undefined") return null;
  return (
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext ||
    null
  );
}

export function createQuietAudio(
  src: string,
  initialVolume: number,
  options?: { loop?: boolean; onEnded?: () => void },
): QuietAudio {
  const loop = options?.loop ?? true;
  const onEnded = options?.onEnded;

  let volume = clamp01(initialVolume);
  let ctx: AudioContext | null = null;
  let gain: GainNode | null = null;
  let buffer: AudioBuffer | null = null;
  let source: AudioBufferSourceNode | null = null;
  let loadPromise: Promise<void> | null = null;
  let disposed = false;
  let playing = false;
  /** Seconds into the buffer when the current source started. */
  let offsetSeconds = 0;
  /** AudioContext time when the current source started. */
  let startedAtCtx = 0;

  const applyGain = () => {
    if (gain) {
      // setValueAtTime avoids glitches; keep extremely quiet beds audible only as ambience.
      gain.gain.setValueAtTime(volume, ctx?.currentTime ?? 0);
    }
  };

  const stopSource = () => {
    if (!source) return;
    try {
      source.onended = null;
      source.stop();
    } catch {
      /* already stopped */
    }
    try {
      source.disconnect();
    } catch {
      /* ignore */
    }
    source = null;
  };

  const ensureGraph = async () => {
    if (disposed) return;
    if (buffer && ctx && gain) {
      if (ctx.state === "suspended") {
        await ctx.resume().catch(() => undefined);
      }
      return;
    }
    if (loadPromise) {
      await loadPromise;
      return;
    }

    loadPromise = (async () => {
      const Ctor = getAudioContextCtor();
      if (!Ctor) {
        throw new Error("Web Audio is not available in this browser.");
      }
      ctx = new Ctor();
      gain = ctx.createGain();
      gain.gain.value = volume;
      gain.connect(ctx.destination);

      const res = await fetch(src, { credentials: "same-origin" });
      if (!res.ok) {
        throw new Error(`Could not load music (${res.status}).`);
      }
      const raw = await res.arrayBuffer();
      // Safari requires a copy — decodeAudioData may detach the buffer.
      const copy = raw.slice(0);
      buffer = await ctx.decodeAudioData(copy);
      if (ctx.state === "suspended") {
        await ctx.resume().catch(() => undefined);
      }
    })();

    try {
      await loadPromise;
    } catch (e) {
      loadPromise = null;
      throw e;
    }
  };

  return {
    setVolume(next) {
      volume = clamp01(next);
      applyGain();
    },

    async play() {
      if (disposed) return;
      await ensureGraph();
      if (!ctx || !gain || !buffer || disposed) return;

      if (ctx.state === "suspended") {
        await ctx.resume().catch(() => undefined);
      }
      applyGain();

      if (playing && source) return;

      stopSource();
      const node = ctx.createBufferSource();
      node.buffer = buffer;
      node.loop = loop;
      node.connect(gain);
      const startAt = Math.max(0, offsetSeconds % Math.max(buffer.duration, 0.001));
      node.start(0, startAt);
      startedAtCtx = ctx.currentTime;
      source = node;
      playing = true;

      node.onended = () => {
        if (source !== node) return;
        playing = false;
        source = null;
        offsetSeconds = 0;
        onEnded?.();
      };
    },

    pause() {
      if (!playing || !ctx || !buffer) {
        stopSource();
        playing = false;
        return;
      }
      const elapsed = Math.max(0, ctx.currentTime - startedAtCtx);
      offsetSeconds = (offsetSeconds + elapsed) % Math.max(buffer.duration, 0.001);
      stopSource();
      playing = false;
    },

    dispose() {
      disposed = true;
      playing = false;
      stopSource();
      offsetSeconds = 0;
      buffer = null;
      loadPromise = null;
      if (gain) {
        try {
          gain.disconnect();
        } catch {
          /* ignore */
        }
      }
      gain = null;
      if (ctx) {
        void ctx.close().catch(() => undefined);
      }
      ctx = null;
    },
  };
}
