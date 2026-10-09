"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, Circle, Square, Trash2, Check } from "lucide-react";
import { HelpTip } from "@/components/HelpTip";
import { WebcamTeleprompterOverlay } from "@/components/WebcamTeleprompterOverlay";
import { formatClock } from "@/lib/timeline";

type WebcamRecorderProps = {
  onCaptured: (file: File) => Promise<void> | void;
  onError?: (message: string) => void;
  disabled?: boolean;
};

type Phase = "idle" | "preview" | "recording" | "review";

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

export function WebcamRecorder({
  onCaptured,
  onError,
  disabled,
}: WebcamRecorderProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);

  const [phase, setPhase] = useState<Phase>("idle");
  const [seconds, setSeconds] = useState(0);
  const [reviewUrl, setReviewUrl] = useState<string | null>(null);
  const [reviewBlob, setReviewBlob] = useState<Blob | null>(null);
  const [mimeType, setMimeType] = useState("video/webm");
  const [busy, setBusy] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

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

  const resetReview = useCallback(() => {
    if (reviewUrl) URL.revokeObjectURL(reviewUrl);
    setReviewUrl(null);
    setReviewBlob(null);
  }, [reviewUrl]);

  const attachLivePreview = useCallback(async (stream: MediaStream) => {
    const el = videoRef.current;
    if (!el) return;
    if (el.srcObject !== stream) {
      el.srcObject = stream;
    }
    el.muted = true;
    el.playsInline = true;
    await el.play().catch(() => undefined);
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
  useEffect(() => {
    if (phase !== "preview" && phase !== "recording") return;
    const stream = streamRef.current;
    if (!stream) return;
    void attachLivePreview(stream);
  }, [phase, attachLivePreview]);

  const reportError = (message: string) => {
    setLocalError(message);
    onError?.(message);
  };

  const startCamera = async () => {
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
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: {
          facingMode: "user",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });
      streamRef.current = stream;
      resetReview();
      setPhase("preview");
      setSeconds(0);
      // Attach after phase change so the video element is mounted.
      requestAnimationFrame(() => {
        void attachLivePreview(stream);
      });
    } catch (e) {
      const name = e instanceof DOMException ? e.name : "";
      if (name === "NotAllowedError" || name === "PermissionDeniedError") {
        reportError(
          "Camera or microphone permission was blocked. Allow access in your browser settings, then try again — or upload a video file instead.",
        );
      } else if (name === "NotFoundError") {
        reportError(
          "No camera or microphone was found. Plug one in, or upload a video file from a folder.",
        );
      } else {
        reportError(
          "Could not start the webcam. Check that no other app is using it, or upload a video file instead.",
        );
      }
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
      clearTimer();
    };
    recorder.onstop = () => {
      clearTimer();
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
    clearTimer();
    timerRef.current = window.setInterval(() => {
      setSeconds((s) => s + 1);
    }, 1000);
  };

  const stopRecording = () => {
    const recorder = recorderRef.current;
    if (recorder && recorder.state !== "inactive") {
      recorder.stop();
    }
  };

  const retake = async () => {
    resetReview();
    setSeconds(0);
    await startCamera();
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
      await onCaptured(file);
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

  const live = phase === "preview" || phase === "recording";

  return (
    <div className="section-card bg-white p-4 md:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Camera className="h-6 w-6 text-[var(--primary)]" aria-hidden />
            <h3 className="text-lg font-semibold tracking-tight text-[var(--ink)]">
              Record with webcam
            </h3>
          </div>
          <p className="mt-0.5 text-[13px] font-medium text-[var(--muted)]">
            Optional — script scrolls at the top of your live preview so you
            look toward the webcam (not saved into the video)
          </p>
        </div>
        <HelpTip title="Webcam recording" size="lg">
          <p>
            Tap <strong>Start webcam</strong>. Allow camera and microphone when
            the browser asks.
          </p>
          <p>
            Your Fleet Hub script appears as a{" "}
            <strong>top teleprompter</strong> over the live preview so your eyes
            stay near the webcam at the top of the monitor. Do one or two
            practice recordings and adjust Speed until the scroll matches how
            you talk, then record your real take. Pause or turn the prompter
            off anytime. The text is preview-only and will not appear in the
            saved clip.
          </p>
          <p>
            Prefer a phone on a tripod? Use the larger teleprompter above on
            this computer screen, record on your phone, then upload the clip.
          </p>
          <p>
            Tap <strong>Stop</strong>, review the clip, then{" "}
            <strong>Use this recording</strong>.
          </p>
        </HelpTip>
      </div>

      {phase === "idle" ? (
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            disabled={disabled}
            onClick={() => void startCamera()}
            className="btn-primary"
          >
            <Camera className="h-5 w-5" />
            Start webcam
          </button>
        </div>
      ) : null}

      {live ? (
        <div className="mt-4 space-y-4">
          <div className="how-banner">
            <strong>Practice first:</strong> record one or two short practice
            takes and adjust the teleprompter Speed slider until it matches how
            fast you talk. Then do your real take. Script text is preview-only
            and is not saved into the video.
          </div>

          <div className="space-y-3">
            <div className="relative overflow-hidden section-card bg-black">
              <video
                ref={videoRef}
                muted
                playsInline
                autoPlay
                className="aspect-video w-full object-cover scale-x-[-1]"
              />
              <WebcamTeleprompterOverlay
                active={live}
                recording={phase === "recording"}
              />
              {phase === "recording" ? (
                <div className="absolute right-3 top-3 z-30 flex items-center gap-2 rounded-[var(--radius-sm)] bg-[var(--primary)] px-3 py-1.5 text-sm font-bold uppercase tracking-wide text-white">
                  <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-white" />
                  Live · Rec {formatClock(seconds)}
                </div>
              ) : (
                <div className="absolute right-3 top-3 z-30 rounded-full bg-black/70 px-3 py-1.5 text-sm font-bold text-white">
                  Live preview — not recording yet
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {phase === "preview" ? (
                <>
                  <button
                    type="button"
                    onClick={startRecording}
                    className="btn-primary"
                  >
                    <Circle className="h-5 w-5 fill-current" />
                    Start recording
                  </button>
                  <button
                    type="button"
                    onClick={closeCamera}
                    className="btn-secondary"
                  >
                    Cancel webcam
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={stopRecording}
                    className="btn-primary"
                  >
                    <Square className="h-5 w-5 fill-current" />
                    Stop recording
                  </button>
                  <span className="rounded-xl border-2 border-[var(--ink)] bg-[var(--primary)] px-3 py-2 text-lg font-bold text-white">
                    Recording… {formatClock(seconds)}
                  </span>
                </>
              )}
            </div>
            <p className="text-base text-[var(--muted)]">
              About 60 seconds is preferred, but you can go longer. Frame
              yourself, check the first lines of the script, then record —
              scroll starts automatically. Trim on the timeline after you save.
            </p>
          </div>
        </div>
      ) : null}

      {phase === "review" && reviewUrl ? (
        <div className="mt-4 space-y-4">
          <p className="text-lg font-bold text-[var(--ink)]">
            Review your recording ({formatClock(seconds)})
          </p>
          <div className="overflow-hidden section-card bg-black">
            <video
              src={reviewUrl}
              controls
              playsInline
              className="aspect-video w-full"
            />
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              disabled={busy}
              onClick={() => void useRecording()}
              className="btn-primary"
            >
              <Check className="h-5 w-5" />
              {busy ? "Saving…" : "Use this recording"}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => void retake()}
              className="btn-secondary"
            >
              <Trash2 className="h-5 w-5" />
              Record again
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
              Cancel
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
