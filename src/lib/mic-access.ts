/**
 * Helpers for browser microphone access.
 * Cursor’s in-app / cloud preview usually has no host mic — Chrome/Edge
 * on the user’s computer is required for Follow My Voice and webcam audio.
 */

export type MicProbeResult =
  | {
      ok: true;
      stream: MediaStream;
      deviceLabel: string;
      deviceCount: number;
    }
  | {
      ok: false;
      reason:
        | "unsupported"
        | "insecure"
        | "denied"
        | "not-found"
        | "busy"
        | "unknown";
      message: string;
    };

export function isLikelyEmbeddedPreview(): boolean {
  if (typeof window === "undefined") return false;
  // Cursor / VS Code simple browser and similar iframes.
  try {
    if (window.self !== window.top) return true;
  } catch {
    return true;
  }
  const ua = navigator.userAgent || "";
  return /Electron|Cursor/i.test(ua);
}

export function micDenialMessage(
  reason:
    | "unsupported"
    | "insecure"
    | "denied"
    | "not-found"
    | "busy"
    | "unknown",
): string {
  const embedded = isLikelyEmbeddedPreview();
  switch (reason) {
    case "unsupported":
      return "This browser cannot use a microphone. Open Chrome or Edge on your computer.";
    case "insecure":
      return "Microphone needs a secure page (https). Open https://clip-flow-green.vercel.app in Chrome or Edge.";
    case "denied":
      return embedded
        ? "Microphone permission was blocked. Cursor’s in-app preview usually cannot use your computer mic — open https://clip-flow-green.vercel.app in Chrome or Edge, click the lock icon, allow Microphone, then reload."
        : "Microphone permission was blocked. Click the lock icon in the address bar → Site settings → Microphone → Allow, then reload.";
    case "not-found":
      return embedded
        ? "No microphone found in this preview. Your mic works in system settings, but Cursor’s browser cannot hear it. Open https://clip-flow-green.vercel.app in Chrome or Edge on your computer."
        : "No microphone was found. Choose the correct input in system sound settings, then try again.";
    case "busy":
      return "Microphone is busy in another app. Close Zoom/Teams/Meet or other apps using the mic, then try again.";
    default:
      return embedded
        ? "Could not open the microphone here. Open the studio in Chrome or Edge on your computer (not Cursor’s preview)."
        : "Could not open the microphone. Check browser permissions and try again.";
  }
}

/** Request mic access and return a live stream (caller must stop tracks). */
export async function probeMicrophone(): Promise<MicProbeResult> {
  if (typeof window === "undefined" || !navigator.mediaDevices?.getUserMedia) {
    return {
      ok: false,
      reason: "unsupported",
      message: micDenialMessage("unsupported"),
    };
  }
  if (!window.isSecureContext) {
    return {
      ok: false,
      reason: "insecure",
      message: micDenialMessage("insecure"),
    };
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
      video: false,
    });
    let deviceCount = 0;
    let deviceLabel = "Microphone";
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const inputs = devices.filter((d) => d.kind === "audioinput");
      deviceCount = inputs.length;
      const trackLabel = stream.getAudioTracks()[0]?.label?.trim();
      deviceLabel = trackLabel || inputs[0]?.label || "Microphone";
    } catch {
      /* ignore */
    }
    return { ok: true, stream, deviceLabel, deviceCount };
  } catch (e) {
    const name = e instanceof DOMException ? e.name : "";
    if (name === "NotAllowedError" || name === "PermissionDeniedError") {
      return {
        ok: false,
        reason: "denied",
        message: micDenialMessage("denied"),
      };
    }
    if (name === "NotFoundError" || name === "DevicesNotFoundError") {
      return {
        ok: false,
        reason: "not-found",
        message: micDenialMessage("not-found"),
      };
    }
    if (name === "NotReadableError" || name === "TrackStartError") {
      return {
        ok: false,
        reason: "busy",
        message: micDenialMessage("busy"),
      };
    }
    return {
      ok: false,
      reason: "unknown",
      message: micDenialMessage("unknown"),
    };
  }
}

export async function resumeAudioContext(
  ctx: AudioContext,
): Promise<AudioContext> {
  if (ctx.state === "suspended") {
    try {
      await ctx.resume();
    } catch {
      /* ignore */
    }
  }
  return ctx;
}
