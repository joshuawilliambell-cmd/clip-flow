"use client";

import { clsx } from "clsx";
import { Monitor, Smartphone } from "lucide-react";
import { HelpTip } from "@/components/HelpTip";
import { PanelSteps } from "@/components/PanelStep";
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
              Record or upload in that same shape (webcam preview matches it on
              desktop and phone).
            </>,
            <>
              Corner photo placement (left/right) uses the layout built for this
              format.
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
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {OPTIONS.map((option) => {
            const pip = PIP_BY_ORIENTATION[option.id];
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
                aria-hidden
              >
                <div className="absolute inset-0 bg-gradient-to-br from-[#334155] to-[#0f172a]" />
                <div
                  className="absolute overflow-hidden rounded-md border-2 border-white bg-[#cbd5e1] shadow-md"
                  style={{
                    top: `${pip.paddingTopPercent}%`,
                    left: `${pip.paddingSidePercent}%`,
                    width: `${pip.widthPercent}%`,
                    height: `${pip.heightPercent}%`,
                  }}
                />
                <p className="absolute bottom-2 left-0 right-0 text-center text-sm font-semibold text-white">
                  {option.ratio} · example PIP
                </p>
              </div>
            );
          })}
        </div>
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
