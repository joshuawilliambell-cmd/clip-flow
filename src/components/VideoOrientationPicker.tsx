"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { clsx } from "clsx";
import { Camera, Monitor, Smartphone, VideoOff } from "lucide-react";
import { HelpTip } from "@/components/HelpTip";
import { PanelSteps } from "@/components/PanelStep";
import { STUDIO_CAMERA_CLAIMED } from "@/lib/camera-events";
import { useStudio } from "@/lib/studio-context";
import {
  PIP_BY_ORIENTATION,
  type VideoOrientation,
} from "@/lib/template";

const OPTIONS: Array<{
  id: VideoOrientation;
  label: string;
  hint: string;
  ratio: string;
}> = [
  {
    id: "landscape",
    label: "Landscape",
    hint: "Wide 16:9 — best for desktop and most video players",
    ratio: "16:9",
  },
  {
    id: "portrait",
    label: "Portrait",
    hint: "Upright 4:3 — classic portrait frame for phone and webcam",
    ratio: "4:3",
  },
];

export function VideoOrientationPicker({
  compact = false,
}: {
  /** Shorter copy for Step 2 (format still applies to preview, PIP, export). */
  compact?: boolean;
} = {}) {
  const { videoOrientation, setVideoOrientation, video } = useStudio();
  const streamRef = useRef<MediaStream | null>(null);
  const landscapeVideoRef = useRef<HTMLVideoElement>(null);
  const portraitVideoRef = useRef<HTMLVideoElement>(null);
  const [livePreview, setLivePreview] = useState(false);
  const [previewBusy, setPreviewBusy] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

  const stopLivePreview = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (landscapeVideoRef.current) landscapeVideoRef.current.srcObject = null;
    if (portraitVideoRef.current) portraitVideoRef.current.srcObject = null;
    setLivePreview(false);
  }, []);

  const attachStream = useCallback((stream: MediaStream) => {
    for (const el of [landscapeVideoRef.current, portraitVideoRef.current]) {
      if (!el) continue;
      el.srcObject = stream;
      el.muted = true;
      void el.play().catch(() => undefined);
    }
  }, []);

  const startLivePreview = useCallback(async () => {
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setPreviewError(
        "This browser cannot show a live camera preview. You can still pick a format and record below.",
      );
      return;
    }
    setPreviewBusy(true);
    setPreviewError(null);
    try {
      stopLivePreview();
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          facingMode: { ideal: "user" },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });
      streamRef.current = stream;
      setLivePreview(true);
      // Videos mount after livePreview flips true.
      requestAnimationFrame(() => attachStream(stream));
    } catch (e) {
      const name = e instanceof DOMException ? e.name : "";
      if (name === "NotAllowedError" || name === "PermissionDeniedError") {
        setPreviewError(
          "Camera permission was blocked. Allow the camera, then try again — or just pick a format and record below.",
        );
      } else if (name === "NotFoundError" || name === "DevicesNotFoundError") {
        setPreviewError(
          "No camera was found. Plug one in, or pick a format and upload a video instead.",
        );
      } else {
        setPreviewError(
          "Could not open the camera for a live preview. You can still pick a format and record below.",
        );
      }
      setLivePreview(false);
    } finally {
      setPreviewBusy(false);
    }
  }, [attachStream, stopLivePreview]);

  useEffect(() => {
    if (!livePreview || !streamRef.current) return;
    attachStream(streamRef.current);
  }, [attachStream, livePreview]);

  useEffect(() => {
    const onClaimed = () => stopLivePreview();
    window.addEventListener(STUDIO_CAMERA_CLAIMED, onClaimed);
    return () => {
      window.removeEventListener(STUDIO_CAMERA_CLAIMED, onClaimed);
      stopLivePreview();
    };
  }, [stopLivePreview]);

  return (
    <section className="section-card bg-white p-4 md:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold tracking-tight text-[var(--ink)]">
            Video Format
          </h3>
          <p className="mt-0.5 text-[13px] font-medium text-[var(--muted)]">
            {compact
              ? "Applies to preview, corner photos, and the exported MP4"
              : "Choose before you record — preview, corner photos, and export all match"}
          </p>
        </div>
        <HelpTip title="Video Format" size="lg">
          <p>
            <strong>Landscape</strong> is wide 16:9.{" "}
            <strong>Portrait</strong> is upright 4:3.
          </p>
          <p>
            On desktop and phone, the webcam preview, Step 2 preview, teammate
            corner photos, and exported MP4 all use this shape.
          </p>
          <p>
            Use <strong>Live camera preview</strong> to see yourself in both
            frames before you record.
          </p>
        </HelpTip>
      </div>

      {!compact ? (
        <PanelSteps
          className="mt-3"
          steps={[
            <>
              Pick <strong>Landscape 16:9</strong> or{" "}
              <strong>Portrait 4:3</strong> for the finished video.
            </>,
            <>
              Optional: tap <strong>Live camera preview</strong> to see yourself
              in both shapes (gray box = where a teammate photo will sit).
            </>,
            <>
              Record or upload in that same shape (webcam preview matches it on
              desktop and phone).
            </>,
          ]}
        />
      ) : null}

      <div className={clsx("grid gap-3 md:grid-cols-2", compact ? "mt-3" : "mt-4")}>
        {OPTIONS.map((option) => {
          const selected = videoOrientation === option.id;
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => setVideoOrientation(option.id)}
              className={clsx(
                "flex min-h-[6.5rem] items-center gap-3 rounded-[var(--radius-md)] border px-4 py-4 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--olive)]",
                selected
                  ? "border-[var(--ink)] bg-[var(--yellow)]"
                  : "border-[var(--border-strong)] bg-[var(--panel-soft)] hover:border-[var(--ink)]",
              )}
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--primary)] text-white">
                {option.id === "landscape" ? (
                  <Monitor className="h-6 w-6" />
                ) : (
                  <Smartphone className="h-6 w-6" />
                )}
              </span>
              <span>
                <span className="block text-xl font-bold text-[var(--ink)]">
                  Click Here for {option.label}
                  {selected ? " ✓" : ""}
                </span>
                <span className="mt-1 block text-base text-[var(--muted)]">
                  {option.hint}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      {!compact ? (
        <>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {livePreview ? (
              <button
                type="button"
                onClick={stopLivePreview}
                className="btn-secondary"
              >
                <VideoOff className="h-5 w-5" />
                Click Here to Stop Live Preview
              </button>
            ) : (
              <button
                type="button"
                disabled={previewBusy}
                onClick={() => void startLivePreview()}
                className="btn-secondary"
              >
                <Camera className="h-5 w-5" />
                {previewBusy
                  ? "Opening camera…"
                  : "Click Here for Live Camera Preview"}
              </button>
            )}
            <p className="text-[13px] font-medium text-[var(--muted)]">
              See yourself in landscape and portrait before you record. Gray box
              = teammate photo spot.
            </p>
          </div>
          {previewError ? (
            <p className="mt-2 text-[13px] font-medium text-[var(--primary)]" role="alert">
              {previewError}
            </p>
          ) : null}

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {OPTIONS.map((option) => {
              const pip = PIP_BY_ORIENTATION[option.id];
              const videoRef =
                option.id === "landscape"
                  ? landscapeVideoRef
                  : portraitVideoRef;
              return (
                <div
                  key={`preview-${option.id}`}
                  className={clsx(
                    "relative mx-auto w-full overflow-hidden rounded-xl border-2",
                    option.id === "landscape"
                      ? "aspect-video"
                      : "aspect-[3/4] max-w-[12rem]",
                    videoOrientation === option.id
                      ? "border-[var(--primary)]"
                      : "border-[var(--border)]",
                  )}
                >
                  {livePreview ? (
                    <video
                      ref={videoRef}
                      className="absolute inset-0 h-full w-full object-cover scale-x-[-1]"
                      autoPlay
                      playsInline
                      muted
                      aria-label={`Live ${option.label} camera preview`}
                    />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-[#334155] to-[#0f172a]" />
                  )}
                  <div
                    className="absolute overflow-hidden rounded-md border-2 border-white bg-[#cbd5e1]/80 shadow-md"
                    style={{
                      top: `${pip.paddingTopPercent}%`,
                      left: `${pip.paddingSidePercent}%`,
                      width: `${pip.widthPercent}%`,
                      height: `${pip.heightPercent}%`,
                    }}
                    aria-hidden
                  />
                  <p className="absolute bottom-2 left-0 right-0 text-center text-sm font-semibold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.85)]">
                    {option.ratio} ·{" "}
                    {livePreview ? "live preview · PIP" : "example PIP"}
                  </p>
                </div>
              );
            })}
          </div>
        </>
      ) : null}

      {video ? (
        <p className="mt-3 text-[13px] font-medium text-[var(--muted)]">
          You already have a video loaded. If it was shot in a different shape,
          the preview may letterbox or crop — re-record or upload a matching{" "}
          {videoOrientation === "portrait" ? "portrait" : "landscape"} file for
          the cleanest result.
        </p>
      ) : null}
    </section>
  );
}
