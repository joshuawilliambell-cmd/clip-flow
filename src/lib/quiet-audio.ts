/**
 * Bed-music + talking-video helpers that honor volume on iOS/iPadOS.
 *
 * Safari ignores HTMLMediaElement.volume (always full device level).
 * Decode into Web Audio and fader with a GainNode instead of trusting
 * element.volume or MediaElementSource (both have failed on iPhone paths).
 */

export type QuietAudio = {
  setVolume: (volume: number) => void;
  play: () => Promise<void>;
  pause: () => void;
  dispose: () => void;
};

/**
 * Decoded voice bed for a talking-video preview. Picture stays on <video>
 * (muted); audible voice is this GainNode-controlled buffer.
 */
export type QuietVideoVoice = {
  setVolume: (volume: number) => void;
  /** Resolves true when audio decoded; false if decode failed. */
  ready: Promise<boolean>;
  playFrom: (offsetSeconds: number) => Promise<void>;
  /** Restart from offset if already playing and drifted / scrubbed. */
  syncTo: (offsetSeconds: number) => void;
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

async function decodeToGraph(
  src: string,
  volume: number,
): Promise<{
  ctx: AudioContext;
  gain: GainNode;
  buffer: AudioBuffer;
}> {
  const Ctor = getAudioContextCtor();
  if (!Ctor) {
    throw new Error("Web Audio is not available in this browser.");
  }
  const ctx = new Ctor();
  const gain = ctx.createGain();
  gain.gain.value = volume;
  gain.connect(ctx.destination);

  const res = await fetch(src, { credentials: "same-origin" });
  if (!res.ok) {
    throw new Error(`Could not load audio (${res.status}).`);
  }
  const raw = await res.arrayBuffer();
  // Safari requires a copy — decodeAudioData may detach the buffer.
  const copy = raw.slice(0);
  const buffer = await ctx.decodeAudioData(copy);
  if (ctx.state === "suspended") {
    await ctx.resume().catch(() => undefined);
  }
  return { ctx, gain, buffer };
}

/** Talking-video voice: decode file audio, mute <video>, fader via GainNode. */
export function createQuietVideoVoice(
  src: string,
  initialVolume: number,
): QuietVideoVoice {
  let volume = clamp01(initialVolume);
  let ctx: AudioContext | null = null;
  let gain: GainNode | null = null;
  let buffer: AudioBuffer | null = null;
  let source: AudioBufferSourceNode | null = null;
  let disposed = false;
  let playing = false;
  let offsetSeconds = 0;
  let startedAtCtx = 0;
  let decodedOk = false;

  const applyGain = () => {
    if (gain && ctx) {
      gain.gain.setValueAtTime(volume, ctx.currentTime);
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

  const ready = (async () => {
    try {
      const graph = await decodeToGraph(src, volume);
      if (disposed) {
        try {
          graph.gain.disconnect();
        } catch {
          /* ignore */
        }
        void graph.ctx.close().catch(() => undefined);
        return false;
      }
      ctx = graph.ctx;
      gain = graph.gain;
      buffer = graph.buffer;
      decodedOk = true;
      applyGain();
      return true;
    } catch {
      decodedOk = false;
      return false;
    }
  })();

  const startAt = async (offset: number) => {
    if (disposed) return;
    await ready;
    if (!decodedOk || !ctx || !gain || !buffer || disposed) return;

    if (ctx.state === "suspended") {
      await ctx.resume().catch(() => undefined);
    }
    applyGain();
    stopSource();

    const dur = Math.max(buffer.duration, 0.001);
    const start = Math.max(0, Math.min(dur - 0.01, offset));
    const node = ctx.createBufferSource();
    node.buffer = buffer;
    node.loop = false;
    node.connect(gain);
    node.start(0, start);
    offsetSeconds = start;
    startedAtCtx = ctx.currentTime;
    source = node;
    playing = true;

    node.onended = () => {
      if (source !== node) return;
      playing = false;
      source = null;
    };
  };

  return {
    ready,

    setVolume(next) {
      volume = clamp01(next);
      applyGain();
    },

    async playFrom(offset) {
      await startAt(offset);
    },

    syncTo(offset) {
      if (!playing || !ctx || !buffer) return;
      const elapsed = Math.max(0, ctx.currentTime - startedAtCtx);
      const current = offsetSeconds + elapsed;
      if (Math.abs(current - offset) < 0.35) return;
      void startAt(offset);
    },

    pause() {
      if (playing && ctx && buffer) {
        const elapsed = Math.max(0, ctx.currentTime - startedAtCtx);
        offsetSeconds = offsetSeconds + elapsed;
      }
      stopSource();
      playing = false;
    },

    dispose() {
      disposed = true;
      playing = false;
      stopSource();
      buffer = null;
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
      const graph = await decodeToGraph(src, volume);
      ctx = graph.ctx;
      gain = graph.gain;
      buffer = graph.buffer;
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
