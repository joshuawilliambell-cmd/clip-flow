/**
 * Bed-music helper that stays quiet on iOS/iPadOS.
 *
 * Safari (and iOS Chrome) ignore HTMLMediaElement.volume — it always plays at
 * full level. Route through a Web Audio GainNode when that happens.
 */

export type QuietAudio = {
  element: HTMLAudioElement;
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

/** True when the browser refuses to honor element.volume (typical on iOS). */
export function mediaVolumeIsLocked(el: HTMLMediaElement): boolean {
  const prev = el.volume;
  try {
    el.volume = 0.37;
    const locked = Math.abs(el.volume - 0.37) > 0.02;
    el.volume = prev;
    return locked;
  } catch {
    el.volume = prev;
    return true;
  }
}

export function createQuietAudio(
  src: string,
  initialVolume: number,
  options?: { loop?: boolean },
): QuietAudio {
  const element = new Audio(src);
  element.preload = "auto";
  element.loop = options?.loop ?? true;
  // Same-origin music; helps MediaElementSource on stricter browsers.
  try {
    element.crossOrigin = "anonymous";
  } catch {
    /* ignore */
  }

  let volume = clamp01(initialVolume);
  element.volume = volume;

  let ctx: AudioContext | null = null;
  let gain: GainNode | null = null;
  let graphReady = false;
  let graphFailed = false;

  const applyVolume = () => {
    if (gain) {
      // Gain is the real fader when the graph is connected.
      gain.gain.value = volume;
      // Keep element at unity so we do not double-attenuate on desktop.
      try {
        element.volume = 1;
      } catch {
        /* ignore */
      }
      return;
    }
    try {
      element.volume = volume;
    } catch {
      /* ignore */
    }
  };

  const ensureGraph = async () => {
    if (graphReady || graphFailed) {
      if (ctx?.state === "suspended") {
        await ctx.resume().catch(() => undefined);
      }
      return;
    }

    // Only build a graph when element.volume is ignored (iOS) or we already
    // know we need reliable attenuation.
    const needsGain = mediaVolumeIsLocked(element);
    if (!needsGain) {
      applyVolume();
      return;
    }

    const Ctor = getAudioContextCtor();
    if (!Ctor) {
      graphFailed = true;
      applyVolume();
      return;
    }

    try {
      ctx = new Ctor();
      const source = ctx.createMediaElementSource(element);
      gain = ctx.createGain();
      gain.gain.value = volume;
      source.connect(gain);
      gain.connect(ctx.destination);
      graphReady = true;
      applyVolume();
      if (ctx.state === "suspended") {
        await ctx.resume().catch(() => undefined);
      }
    } catch {
      graphFailed = true;
      gain = null;
      ctx = null;
      applyVolume();
    }
  };

  applyVolume();

  return {
    element,
    setVolume(next) {
      volume = clamp01(next);
      applyVolume();
    },
    async play() {
      await ensureGraph();
      applyVolume();
      await element.play();
    },
    pause() {
      element.pause();
    },
    dispose() {
      element.pause();
      try {
        element.removeAttribute("src");
        element.load();
      } catch {
        /* ignore */
      }
      if (ctx) {
        void ctx.close().catch(() => undefined);
      }
      ctx = null;
      gain = null;
      graphReady = false;
    },
  };
}
