"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  Camera,
  Circle,
  Pause,
  Play,
  Square,
  SwitchCamera,
  Trash2,
  Check,
  X,
} from "lucide-react";
import { clsx } from "clsx";
import { HelpTip } from "@/components/HelpTip";
import { PanelSteps, StepCircle } from "@/components/PanelStep";
import { WebcamTeleprompterOverlay } from "@/components/WebcamTeleprompterOverlay";
import { useIsLandscape, useIsMobile } from "@/hooks/useIsMobile";
import { useVisualViewport } from "@/hooks/useVisualViewport";
import { useStudio } from "@/lib/studio-context";
import {
  frameAspectClass,
  orientationLabel,
} from "@/lib/orientation-ui";
import { formatClock } from "@/lib/timeline";

type WebcamRecorderProps = {
  onCaptured: (
    file: File,
    options?: { durationHintSeconds?: number },
  ) => Promise<void> | void;
  onError?: (message: string) => void;
  disabled?: boolean;
};

type Phase = "idle" | "preview" | "recording" | "review";
type FacingMode = "user" | "environment";

function pickRecorderMimeType(): string {
  const candidates = [
    "video/webm;codecs=vp9,opus",
    "video/webm;codecs=vp8,opus",
    "video/webm",
    "video/mp4;codecs=h264,aac",
    "video/mp4",
  ];
  if (typeof MediaRecorder === "undefined") return "";
  for (const type of candidates) {
    if (MediaRecorder.isTypeSupported(type)) return type;
  }
  return "";
}

function extensionForMime(mime: string): string {
  if (mime.includes("mp4")) return "mp4";
  return "webm";
}

function sizeConstraints(wantLandscape: boolean): MediaTrackConstraints {
  return {
    width: { ideal: wantLandscape ? 1280 : 720 },
    height: { ideal: wantLandscape ? 720 : 1280 },
    aspectRatio: { ideal: wantLandscape ? 16 / 9 : 9 / 16 },
  };
}

/**
 * Open camera preferring selfie (`user`) or rear (`environment`).
 * Request facingMode first (exact → ideal), then apply size — combining
 * strict resolution with facingMode often makes phones pick the main camera.
 */
async function openCameraStream(
  facing: FacingMode,
  wantLandscape: boolean,
): Promise<MediaStream> {
  const size = sizeConstraints(wantLandscape);

  const tryGet = (video: MediaTrackConstraints) =>
    navigator.mediaDevices.getUserMedia({ audio: true, video });

  try {
    const stream = await tryGet({ facingMode: { exact: facing }, ...size });
    return stream;
  } catch {
    /* fall through */
  }

  try {
    const stream = await tryGet({ facingMode: { ideal: facing }, ...size });
    return stream;
  } catch {
    /* fall through */
  }

  // Facing only, then nudge size — most reliable selfie path on iOS/Android.
  const stream = await tryGet({ facingMode: { ideal: facing } });
  const track = stream.getVideoTracks()[0];
  if (track) {
    await track.applyConstraints(size).catch(() => undefined);
  }
  return stream;
}

export function WebcamRecorder({
  onCaptured,
  onError,
  disabled,
}: WebcamRecorderProps) {
  const { videoOrientation } = useStudio();
  const wantLandscape = videoOrientation === "landscape";
  const isMobile = useIsMobile();
  const isLandscape = useIsLandscape();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const recordingStartedAtRef = useRef<number | null>(null);
  const recordedDurationRef = useRef(0);
  const pausedAccumMsRef = useRef(0);
  const pauseStartedAtRef = useRef<number | null>(null);

  const [phase, setPhase] = useState<Phase>("idle");
  const [seconds, setSeconds] = useState(0);
  const [reviewUrl, setReviewUrl] = useState<string | null>(null);
  const [reviewBlob, setReviewBlob] = useState<Blob | null>(null);
  const [mimeType, setMimeType] = useState("video/webm");
  const [busy, setBusy] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<FacingMode>("user");
  const [recordingPaused, setRecordingPaused] = useState(false);
  const [switchingCamera, setSwitchingCamera] = useState(false);
  const [portalReady, setPortalReady] = useState(false);

  useEffect(() => {
    setPortalReady(true);
  }, []);

  const stopTracks = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startElapsedTimer = useCallback(() => {
    clearTimer();
    timerRef.current = window.setInterval(() => {
      if (!recordingStartedAtRef.current) return;
      const pauseExtra =
        pausedAccumMsRef.current +
        (pauseStartedAtRef.current
          ? performance.now() - pauseStartedAtRef.current
          : 0);
      const elapsed = Math.max(
        0,
        (performance.now() - recordingStartedAtRef.current - pauseExtra) / 1000,
      );
      setSeconds(Math.floor(elapsed));
    }, 250);
  }, [clearTimer]);

  const resetReview = useCallback(() => {
    if (reviewUrl) URL.revokeObjectURL(reviewUrl);
    setReviewUrl(null);
    setReviewBlob(null);
  }, [reviewUrl]);

  const attachLivePreview = useCallback(async (stream: MediaStream) => {
    const el = videoRef.current;
    if (!el) return;
    el.setAttribute("playsinline", "true");
    el.setAttribute("webkit-playsinline", "true");
    el.muted = true;
    el.defaultMuted = true;
    el.playsInline = true;
    if (el.srcObject !== stream) {
      el.srcObject = stream;
    }
    // iOS often needs play() after metadata is ready.
    const tryPlay = () => el.play().catch(() => undefined);
    await tryPlay();
    el.onloadedmetadata = () => {
      void tryPlay();
    };
  }, []);

  const closeCamera = useCallback(() => {
    clearTimer();
    if (recorderRef.current && recorderRef.current.state !== "inactive") {
      try {
        recorderRef.current.stop();
      } catch {
        /* ignore */
      }
    }
    recorderRef.current = null;
    stopTracks();
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setPhase("idle");
    setSeconds(0);
    setRecordingPaused(false);
    pausedAccumMsRef.current = 0;
    pauseStartedAtRef.current = null;
    recordingStartedAtRef.current = null;
  }, [clearTimer, stopTracks]);

  useEffect(() => {
    return () => {
      clearTimer();
      stopTracks();
      if (reviewUrl) URL.revokeObjectURL(reviewUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep the live preview attached whenever we are in preview or recording.
  // Re-run when mobile/desktop layout swaps so the remounted <video> gets the stream.
  useEffect(() => {
    if (phase !== "preview" && phase !== "recording") return;
    const stream = streamRef.current;
    if (!stream) return;
    void attachLivePreview(stream);
  }, [phase, attachLivePreview, isMobile]);

  const live = phase === "preview" || phase === "recording";

  // When Video Format changes during live preview, retarget size (keep facing).
  useEffect(() => {
    if (phase !== "preview") return;
    const stream = streamRef.current;
    const track = stream?.getVideoTracks()[0];
    if (!track) return;
    void track
      .applyConstraints({
        ...sizeConstraints(wantLandscape),
        facingMode: { ideal: facingMode },
      })
      .catch(() => undefined);
  }, [wantLandscape, phase, facingMode]);

  const mobileStudio = isMobile === true;
  const viewport = useVisualViewport(live && mobileStudio);
  /** Phone orientation does not match the chosen video format. */
  const mobileOrientationMismatch =
    mobileStudio &&
    isLandscape !== null &&
    wantLandscape !== isLandscape;

  // Mobile fullscreen selfie studio — lock page scroll while active.
  useEffect(() => {
    if (!live || !mobileStudio) return;
    const prevOverflow = document.body.style.overflow;
    const prevPosition = document.body.style.position;
    const prevTop = document.body.style.top;
    const prevWidth = document.body.style.width;
    const scrollY = window.scrollY;
    document.body.style.overflow = "hidden";
    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = "100%";
    return () => {
      document.body.style.overflow = prevOverflow;
      document.body.style.position = prevPosition;
      document.body.style.top = prevTop;
      document.body.style.width = prevWidth;
      window.scrollTo(0, scrollY);
    };
  }, [live, mobileStudio]);

  const reportError = (message: string) => {
    setLocalError(message);
    onError?.(message);
  };

  const startCamera = async (facing: FacingMode = facingMode) => {
    setLocalError(null);
    if (!navigator.mediaDevices?.getUserMedia) {
      reportError(
        "This browser cannot use the webcam here. Please upload a video file instead, or try Chrome or Edge on a computer.",
      );
      return;
    }

    const mime = pickRecorderMimeType();
    if (!mime && typeof MediaRecorder === "undefined") {
      reportError(
        "Recording is not supported in this browser. Please upload a video file from a folder instead.",
      );
      return;
    }
    setMimeType(mime || "video/webm");

    try {
      stopTracks();
      const stream = await openCameraStream(facing, wantLandscape);
      streamRef.current = stream;
      setFacingMode(facing);
      resetReview();
      setPhase("preview");
      setSeconds(0);
      setRecordingPaused(false);
      // Attach after phase change so the video element is mounted.
      requestAnimationFrame(() => {
        void attachLivePreview(stream);
      });
    } catch (e) {
      const name = e instanceof DOMException ? e.name : "";
      if (name === "NotAllowedError" || name === "PermissionDeniedError") {
        reportError(
          "Camera or microphone permission was blocked. Allow access in Chrome or Edge, then try again — or upload a video file instead.",
        );
      } else if (name === "NotFoundError" || name === "DevicesNotFoundError") {
        reportError(
          "No camera or microphone was found. Plug one in, open this site in a normal browser tab, or upload a video file from a folder.",
        );
      } else if (name === "NotReadableError" || name === "TrackStartError") {
        reportError(
          "Camera or microphone is busy in another app. Close that app and try again, or upload a video file instead.",
        );
      } else if (name === "OverconstrainedError") {
        reportError(
          "Could not open the selfie camera on this device. Try Switch Camera, or upload a video file instead.",
        );
      } else {
        reportError(
          "Could not start the webcam here. Open the site in Chrome or Edge, or upload a video file instead.",
        );
      }
    }
  };

  const switchCamera = async () => {
    if (phase === "recording") {
      reportError("Stop or pause recording before switching cameras.");
      return;
    }
    const next: FacingMode = facingMode === "user" ? "environment" : "user";
    setSwitchingCamera(true);
    setLocalError(null);
    try {
      await startCamera(next);
    } finally {
      setSwitchingCamera(false);
    }
  };

  const startRecording = () => {
    setLocalError(null);
    const stream = streamRef.current;
    if (!stream) {
      reportError("Camera is not ready yet. Tap Start webcam again.");
      return;
    }

    // Keep showing the live camera while MediaRecorder captures the same stream.
    void attachLivePreview(stream);

    chunksRef.current = [];
    const options = mimeType ? { mimeType } : undefined;
    let recorder: MediaRecorder;
    try {
      recorder = options
        ? new MediaRecorder(stream, options)
        : new MediaRecorder(stream);
    } catch {
      reportError(
        "Could not start recording in this browser. Please upload a video file instead.",
      );
      return;
    }

    recorderRef.current = recorder;
    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunksRef.current.push(event.data);
    };
    recorder.onerror = () => {
      reportError("Recording failed. Please try again or upload a file.");
      setPhase("preview");
      setRecordingPaused(false);
      clearTimer();
    };
    recorder.onstop = () => {
      clearTimer();
      const pauseExtra =
        pausedAccumMsRef.current +
        (pauseStartedAtRef.current
          ? performance.now() - pauseStartedAtRef.current
          : 0);
      const elapsedMs = recordingStartedAtRef.current
        ? performance.now() - recordingStartedAtRef.current - pauseExtra
        : seconds * 1000;
      recordedDurationRef.current = Math.max(1, elapsedMs / 1000);
      recordingStartedAtRef.current = null;
      pauseStartedAtRef.current = null;
      pausedAccumMsRef.current = 0;
      setRecordingPaused(false);
      const blob = new Blob(chunksRef.current, {
        type: recorder.mimeType || mimeType || "video/webm",
      });
      chunksRef.current = [];
      if (blob.size < 1000) {
        reportError("Recording was empty. Please try recording again.");
        setPhase("preview");
        void attachLivePreview(stream);
        return;
      }
      const url = URL.createObjectURL(blob);
      if (reviewUrl) URL.revokeObjectURL(reviewUrl);
      setReviewUrl(url);
      setReviewBlob(blob);
      setPhase("review");
      stopTracks();
      if (videoRef.current) videoRef.current.srcObject = null;
    };

    recorder.start(250);
    setPhase("recording");
    setSeconds(0);
    setRecordingPaused(false);
    recordedDurationRef.current = 0;
    pausedAccumMsRef.current = 0;
    pauseStartedAtRef.current = null;
    recordingStartedAtRef.current = performance.now();
    startElapsedTimer();
  };

  const pauseRecording = () => {
    const recorder = recorderRef.current;
    if (!recorder || recorder.state !== "recording") return;
    try {
      recorder.pause();
      pauseStartedAtRef.current = performance.now();
      clearTimer();
      setRecordingPaused(true);
    } catch {
      reportError("Pause is not supported in this browser. Use Stop instead.");
    }
  };

  const resumeRecording = () => {
    const recorder = recorderRef.current;
    if (!recorder || recorder.state !== "paused") return;
    try {
      if (pauseStartedAtRef.current !== null) {
        pausedAccumMsRef.current +=
          performance.now() - pauseStartedAtRef.current;
        pauseStartedAtRef.current = null;
      }
      recorder.resume();
      setRecordingPaused(false);
      startElapsedTimer();
    } catch {
      reportError("Could not resume recording. Tap Stop, then record again.");
    }
  };

  const stopRecording = () => {
    const recorder = recorderRef.current;
    if (recorder && recorder.state !== "inactive") {
      try {
        if (recorder.state === "paused") {
          // Some browsers need resume before stop to flush data.
          recorder.resume();
        }
      } catch {
        /* ignore */
      }
      recorder.stop();
    }
  };

  const retake = async () => {
    resetReview();
    setSeconds(0);
    await startCamera(facingMode);
  };

  const useRecording = async () => {
    if (!reviewBlob) return;
    setBusy(true);
    setLocalError(null);
    try {
      const ext = extensionForMime(reviewBlob.type || mimeType);
      const file = new File(
        [reviewBlob],
        `webcam-intro-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-")}.${ext}`,
        { type: reviewBlob.type || mimeType || "video/webm" },
      );
      // MediaRecorder WebM often under-reports duration — pass measured length.
      await onCaptured(file, {
        durationHintSeconds: Math.max(
          1,
          recordedDurationRef.current,
          seconds,
        ),
      });
      resetReview();
      setPhase("idle");
      setSeconds(0);
    } catch (e) {
      reportError(
        e instanceof Error ? e.message : "Could not use that recording.",
      );
    } finally {
      setBusy(false);
    }
  };

  const mirrorPreview = facingMode === "user";

  const cameraChrome = (
    <>
      {phase === "recording" ? (
        <div className="absolute left-3 top-3 z-30 flex items-center gap-2 rounded-[var(--radius-sm)] bg-[var(--primary)] px-3 py-1.5 text-sm font-bold uppercase tracking-wide text-white">
          <span
            className={clsx(
              "h-2.5 w-2.5 rounded-full bg-white",
              !recordingPaused && "animate-pulse",
            )}
          />
          {recordingPaused ? "Paused" : "Rec"} · {formatClock(seconds)}
        </div>
      ) : (
        <div className="absolute left-3 top-3 z-30 rounded-full bg-black/70 px-3 py-1.5 text-sm font-bold text-white">
          {facingMode === "user" ? "Selfie" : "Rear"} ·{" "}
          {orientationLabel(videoOrientation)}
        </div>
      )}

      {/* Always-visible camera controls on the preview (esp. mobile). */}
      <div className="absolute right-3 top-3 z-40 flex flex-col gap-2">
        <button
          type="button"
          disabled={switchingCamera || phase === "recording"}
          onClick={() => void switchCamera()}
          className="inline-flex min-h-11 min-w-11 items-center justify-center gap-1.5 rounded-full border-2 border-white/80 bg-black/75 px-3 py-2 text-sm font-bold text-white shadow-lg disabled:opacity-40"
          aria-label={
            facingMode === "user"
              ? "Switch to rear camera"
              : "Switch to selfie camera"
          }
        >
          <SwitchCamera className="h-5 w-5" />
          <span className="hidden sm:inline">
            {switchingCamera ? "…" : "Flip"}
          </span>
        </button>
      </div>

      {mobileOrientationMismatch ? (
        <div className="absolute inset-x-2 bottom-2 z-30 rounded-md border border-[var(--yellow)]/70 bg-black/80 px-2 py-1.5 text-center text-[11px] font-semibold leading-snug text-white">
          {wantLandscape ? (
            <>
              Turn your phone{" "}
              <strong className="text-[var(--yellow)]">sideways</strong>{" "}
              (landscape) — matches your Video Format.
            </>
          ) : (
            <>
              Hold your phone{" "}
              <strong className="text-[var(--yellow)]">upright</strong>{" "}
              (portrait) — matches your Video Format.
            </>
          )}
        </div>
      ) : null}
    </>
  );

  return (
    <div className="section-card bg-white p-4 md:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Camera className="h-6 w-6 text-[var(--primary)]" aria-hidden />
            <h3 className="text-lg font-semibold tracking-tight text-[var(--ink)]">
              Record With Webcam
            </h3>
          </div>
        </div>
        <HelpTip title="Record With Webcam" size="lg">
          <p>
            <strong>Best way to record:</strong> use this webcam with the
            on-screen teleprompter. The script stays near your camera so you can
            look natural while you read.
          </p>
          <p>
            Starts on the <strong>selfie (front) camera</strong>. Tap{" "}
            <strong>Flip</strong> to switch to the rear camera.
          </p>
          <p>
            <strong>Follow My Voice</strong> listens as you speak and scrolls the
            script for you. Step 1 turns that on; Step 2 starts the real
            recording. While recording you can Pause or Stop.
          </p>
          <p>
            Script text is only for you while you talk — it is not saved into
            the video file.
          </p>
        </HelpTip>
      </div>

      <div className="how-banner mt-4">
        <strong>Recommended:</strong> record here with the webcam and
        teleprompter. It is the easiest way to read your script and look at the
        camera at the same time. Uses the selfie camera first — tap Flip to
        switch.
      </div>

      <PanelSteps
        className="mt-4"
        steps={[
          <>
            Place this window at the <strong>top of your monitor</strong>, near
            the webcam. Scoot back — frame from about your waist to the top of
            your head. Preview shape is{" "}
            <strong>{orientationLabel(videoOrientation)}</strong> (from Video
            Format above).
          </>,
          <>
            Click <strong>Start Webcam</strong> and allow camera and microphone
            when asked. Selfie camera opens by default — use <strong>Flip</strong>{" "}
            to switch.
          </>,
          <>
            <strong>Step 1 — Follow My Voice:</strong> the computer listens and
            scrolls the script as you read. Then{" "}
            <strong>Step 2 — Start Recording</strong>. Pause or Stop anytime.
          </>,
        ]}
      />

      {phase === "idle" ? (
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            disabled={disabled}
            onClick={() => void startCamera("user")}
            className="btn-primary"
          >
            <Camera className="h-5 w-5" />
            Click Here to Start Webcam
          </button>
        </div>
      ) : null}

      {live ? (
        <div className="mt-4 space-y-4">
          {/* Desktop-only coaching (mobile uses the fullscreen studio). */}
          {!mobileStudio ? (
            phase === "preview" ? (
              <div className="how-banner space-y-2">
                <p>
                  <strong>How Follow My Voice works here:</strong> click it and
                  allow the mic. Read the script out loud — the words scroll as
                  you talk, so you can look near the camera instead of down at a
                  paper. Do these in order:
                </p>
                <PanelSteps
                  steps={[
                    <>
                      On the teleprompter, click{" "}
                      <strong>Follow My Voice</strong> (circled{" "}
                      <strong>1</strong>). Allow the mic, then start reading out
                      loud at a normal pace.
                    </>,
                    <>
                      When you are ready for the real take, click{" "}
                      <strong>Start Recording</strong> below (circled{" "}
                      <strong>2</strong>). Keep reading the same way. The script
                      text is not saved into the video.
                    </>,
                  ]}
                />
              </div>
            ) : (
              <div className="how-banner">
                <strong>
                  {recordingPaused ? "Recording paused." : "You are recording."}
                </strong>{" "}
                Keep reading out loud with Follow My Voice so the script stays
                with you. Use <strong>Pause</strong> or{" "}
                <strong>Stop Recording</strong> when you need to. Script text is
                not saved into the video.
              </div>
            )
          ) : (
            <p className="text-[14px] font-medium text-[var(--muted)]">
              Camera is open fullscreen on your phone. Flip camera, Follow My
              Voice, then Start / Pause / Stop at the bottom.
            </p>
          )}

          {/* Spacer so the page does not collapse while the portaled studio is open. */}
          {mobileStudio ? <div className="h-[70vh]" aria-hidden /> : null}

          {/*
            Mobile studio is portaled to document.body and sized to the visual
            viewport. Otherwise iOS Safari traps position:fixed inside
            overflow-x-hidden ancestors and only a black middle band shows.
          */}
          {mobileStudio && portalReady
            ? createPortal(
                <div
                  role="dialog"
                  aria-modal="true"
                  aria-label="Webcam recorder"
                  className="fixed z-[9999] grid grid-rows-[minmax(7.5rem,28%)_minmax(0,1fr)_auto] bg-black text-white"
                  style={{
                    top: viewport.top,
                    left: viewport.left,
                    width: viewport.width,
                    height: viewport.height,
                  }}
                >
                  <div className="min-h-0 overflow-hidden border-b border-white/20 bg-black">
                    <WebcamTeleprompterOverlay
                      active={live}
                      recording={phase === "recording"}
                      forceMobile
                    />
                  </div>

                  <div className="relative min-h-[40%] bg-black">
                    <video
                      ref={videoRef}
                      muted
                      playsInline
                      autoPlay
                      className={clsx(
                        "absolute inset-0 h-full w-full object-cover bg-black",
                        mirrorPreview && "scale-x-[-1]",
                      )}
                    />
                    {cameraChrome}
                    {mobileOrientationMismatch ? null : (
                      <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/50 to-transparent px-3 pb-3 pt-8 text-center text-[12px] font-semibold text-white/90">
                        {facingMode === "user" ? "Selfie camera" : "Rear camera"}{" "}
                        · {orientationLabel(videoOrientation)}
                      </div>
                    )}
                  </div>

                  <div className="shrink-0 space-y-2 border-t border-white/30 bg-black px-3 py-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
                    {phase === "preview" ? (
                      <div className="flex flex-col gap-2">
                        <div className="grid grid-cols-[4.5rem_1fr_4.5rem] items-center gap-2">
                          <button
                            type="button"
                            disabled={switchingCamera}
                            onClick={() => void switchCamera()}
                            className="inline-flex min-h-12 flex-col items-center justify-center rounded-xl border-2 border-white/60 bg-white/15 px-1 text-[11px] font-bold text-white"
                          >
                            <SwitchCamera className="h-5 w-5" />
                            Flip
                          </button>
                          <button
                            type="button"
                            onClick={startRecording}
                            className="btn-primary min-h-12 w-full"
                          >
                            <Circle className="h-5 w-5 fill-current" />
                            Start Recording
                          </button>
                          <button
                            type="button"
                            onClick={closeCamera}
                            className="inline-flex min-h-12 flex-col items-center justify-center rounded-xl border-2 border-white/60 bg-white/15 px-1 text-[11px] font-bold text-white"
                            aria-label="Cancel webcam"
                          >
                            <X className="h-5 w-5" />
                            Close
                          </button>
                        </div>
                        <p className="text-center text-[12px] font-semibold text-white/85">
                          Selfie by default · Flip for rear camera
                        </p>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-2">
                        <div className="grid grid-cols-2 gap-2">
                          {recordingPaused ? (
                            <button
                              type="button"
                              onClick={resumeRecording}
                              className="btn-yellow min-h-12 w-full"
                            >
                              <Play className="h-5 w-5 fill-current" />
                              Resume
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={pauseRecording}
                              className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-[var(--radius-md)] border-2 border-white/60 bg-white/15 px-4 text-[15px] font-semibold text-white"
                            >
                              <Pause className="h-5 w-5" />
                              Pause
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={stopRecording}
                            className="btn-primary min-h-12 w-full"
                          >
                            <Square className="h-5 w-5 fill-current" />
                            Stop
                          </button>
                        </div>
                        <p className="text-center text-[14px] font-bold text-white">
                          {recordingPaused ? "Paused" : "Recording"}…{" "}
                          {formatClock(seconds)}
                        </p>
                      </div>
                    )}
                  </div>
                </div>,
                document.body,
              )
            : null}

          {!mobileStudio ? (
            <div className="space-y-3">
              <div className="relative overflow-hidden section-card bg-black">
                <div
                  className={clsx(
                    "relative overflow-hidden bg-black",
                    frameAspectClass(videoOrientation, "webcam"),
                  )}
                >
                  <video
                    ref={videoRef}
                    muted
                    playsInline
                    autoPlay
                    className={clsx(
                      "h-full w-full object-cover",
                      mirrorPreview && "scale-x-[-1]",
                    )}
                  />
                  <WebcamTeleprompterOverlay
                    active={live}
                    recording={phase === "recording"}
                  />
                  {cameraChrome}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {phase === "preview" ? (
                  <>
                    <span className="inline-flex items-center gap-2">
                      <StepCircle n={2} label="Step 2" />
                      <button
                        type="button"
                        onClick={startRecording}
                        className="btn-primary"
                      >
                        <Circle className="h-5 w-5 fill-current" />
                        Step 2 — Click Here to Start Recording
                      </button>
                    </span>
                    <button
                      type="button"
                      disabled={switchingCamera}
                      onClick={() => void switchCamera()}
                      className="btn-secondary"
                    >
                      <SwitchCamera className="h-5 w-5" />
                      {switchingCamera
                        ? "Switching…"
                        : facingMode === "user"
                          ? "Flip to Rear Camera"
                          : "Flip to Selfie Camera"}
                    </button>
                    <button
                      type="button"
                      onClick={closeCamera}
                      className="btn-secondary"
                    >
                      Click Here to Cancel Webcam
                    </button>
                  </>
                ) : (
                  <>
                    {recordingPaused ? (
                      <button
                        type="button"
                        onClick={resumeRecording}
                        className="btn-yellow"
                      >
                        <Play className="h-5 w-5 fill-current" />
                        Resume Recording
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={pauseRecording}
                        className="btn-secondary"
                      >
                        <Pause className="h-5 w-5" />
                        Pause Recording
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={stopRecording}
                      className="btn-primary"
                    >
                      <Square className="h-5 w-5 fill-current" />
                      Click Here to Stop Recording
                    </button>
                    <span className="rounded-xl border-2 border-[var(--ink)] bg-[var(--primary)] px-3 py-2 text-lg font-bold text-white">
                      {recordingPaused ? "Paused" : "Recording"}…{" "}
                      {formatClock(seconds)}
                    </span>
                  </>
                )}
              </div>
              <p className="text-base text-[var(--muted)]">
                About 60 seconds is preferred; 2+ minutes is fine. Trim on the
                timeline after you save.
              </p>
            </div>
          ) : null}
        </div>
      ) : null}

      {phase === "review" && reviewUrl ? (
        <div className="mt-4 space-y-4">
          <div className="how-banner">
            <strong>Next:</strong> Watch your take. If it looks good, click{" "}
            <strong>Use This Recording</strong>. Want another try? Click{" "}
            <strong>Record Again</strong>.
          </div>
          <div>
            <p className="text-lg font-bold text-[var(--ink)]">
              Review Your Recording ({formatClock(seconds)})
            </p>
          </div>
          <div className="overflow-hidden section-card bg-black">
            <video
              src={reviewUrl}
              controls
              playsInline
              className={clsx(
                frameAspectClass(videoOrientation, "review"),
                "object-contain",
              )}
            />
          </div>
          <div className="flex flex-wrap items-center gap-3 rounded-[var(--radius-md)] border-2 border-[var(--ink)] bg-[var(--yellow)]/40 p-3 md:p-4">
            <button
              type="button"
              disabled={busy}
              onClick={() => void useRecording()}
              className="btn-primary min-w-[14rem]"
            >
              <Check className="h-5 w-5" />
              {busy ? "Saving…" : "Click Here to Use This Recording"}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => void retake()}
              className="btn-secondary"
            >
              <Trash2 className="h-5 w-5" />
              Click Here to Record Again
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => {
                resetReview();
                closeCamera();
              }}
              className="btn-secondary"
            >
              Click Here to Cancel
            </button>
          </div>
        </div>
      ) : null}

      {localError ? (
        <p className="mt-4 rounded-xl border-2 border-[var(--primary)] bg-red-50 px-4 py-3 text-lg font-medium text-[var(--primary-dark)]">
          {localError}
        </p>
      ) : null}
    </div>
  );
}
