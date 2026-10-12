"use client";

import { clsx } from "clsx";
import { PanelLeft, PanelRight } from "lucide-react";
import { HelpTip } from "@/components/HelpTip";
import { PanelSteps } from "@/components/PanelStep";
import { TeamPhotoSilhouette } from "@/components/TeamPhotoSilhouette";
import { useStudio } from "@/lib/studio-context";
import { getPipLayout, type PipSide } from "@/lib/template";
import { frameAspectClass } from "@/lib/orientation-ui";

const OPTIONS: Array<{ id: PipSide; label: string; hint: string }> = [
  {
    id: "left",
    label: "Left Side",
    hint: "Small photo in the top-left corner",
  },
  {
    id: "right",
    label: "Right Side",
    hint: "Small photo in the top-right corner",
  },
];

export function PipSidePicker() {
  const { pipSide, setPipSide, videoOrientation, video } = useStudio();
  const formatLabel =
    videoOrientation === "portrait" ? "portrait (4:3)" : "landscape (16:9)";
  const sourceSize =
    video && video.width > 0 && video.height > 0
      ? { width: video.width, height: video.height }
      : null;

  return (
    <section className="section-card bg-white p-4 md:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold tracking-tight text-[var(--ink)]">
            Photo Corner Placement
          </h3>
          <p className="mt-0.5 text-[13px] font-medium text-[var(--muted)]">
            Sized for your {formatLabel} video
          </p>
        </div>
        <HelpTip title="Photo Corner Placement" size="lg">
          <p>
            When you introduce a teammate, a small photo of them can appear in
            one top corner of the video. Pick left or right so it does not cover
            your face.
          </p>
          <p>
            The photo box size follows your Video Format choice (landscape or
            portrait) so it stays proportional on either canvas.
          </p>
        </HelpTip>
      </div>

      <PanelSteps
        className="mt-3"
        steps={[
          <>
            Choose whether each teammate&apos;s small photo shows on the{" "}
            <strong>left</strong> or <strong>right</strong> side of the video.
          </>,
          <>
            Pick the side that keeps your face clear in the main video.
          </>,
          <>
            You do not resize or drag the photo frame — only left or right. Size
            follows your {formatLabel} format.
          </>,
        ]}
      />

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {OPTIONS.map((option) => {
          const selected = pipSide === option.id;
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => setPipSide(option.id)}
              className={clsx(
                "flex min-h-[6.5rem] items-center gap-3 rounded-[var(--radius-md)] border px-4 py-4 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--olive)]",
                selected
                  ? "border-[var(--ink)] bg-[var(--yellow)]"
                  : "border-[var(--border-strong)] bg-[var(--panel-soft)] hover:border-[var(--ink)]",
              )}
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--primary)] text-white">
                {option.id === "left" ? (
                  <PanelLeft className="h-6 w-6" />
                ) : (
                  <PanelRight className="h-6 w-6" />
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

      <div
        className={clsx(
          "mt-4 grid gap-3",
          videoOrientation === "portrait"
            ? "justify-items-center md:grid-cols-2"
            : "md:grid-cols-2",
        )}
      >
        {OPTIONS.map((option) => {
          const layout = getPipLayout(option.id, videoOrientation, sourceSize);
          return (
            <div
              key={`preview-${option.id}`}
              className={clsx(
                "relative overflow-hidden rounded-xl border-2",
                frameAspectClass(videoOrientation, "picker"),
                pipSide === option.id
                  ? "border-[var(--primary)]"
                  : "border-[var(--border)]",
              )}
              aria-hidden
            >
              <div className="absolute inset-0 bg-gradient-to-br from-[#334155] to-[#0f172a]" />
              <div
                className="absolute overflow-hidden rounded-md border-2 border-white bg-[#cbd5e1] shadow-md"
                style={{
                  top: `${layout.yPercent}%`,
                  left: `${layout.xPercent}%`,
                  width: `${layout.widthPercent}%`,
                  height: `${layout.heightPercent}%`,
                }}
              >
                <TeamPhotoSilhouette />
              </div>
              <p
                className="absolute truncate rounded-sm bg-black/75 px-1 py-0.5 text-center text-[9px] font-semibold leading-tight text-white md:text-[10px]"
                style={{
                  top: `calc(${layout.yPercent}% + ${layout.heightPercent}% + 4px)`,
                  left: `${layout.xPercent}%`,
                  width: `${layout.widthPercent}%`,
                }}
              >
                Job Title
              </p>
              <p className="absolute bottom-2 left-0 right-0 text-center text-sm font-semibold text-white">
                Example · {option.label.toLowerCase()}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
