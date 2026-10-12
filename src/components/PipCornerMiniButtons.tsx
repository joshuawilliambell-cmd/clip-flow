"use client";

import { clsx } from "clsx";
import { useStudio } from "@/lib/studio-context";
import { getPipLayout, type PipSide } from "@/lib/template";

const OPTIONS: Array<{ id: PipSide; label: string }> = [
  { id: "left", label: "Move team member to left side" },
  { id: "right", label: "Move team member to right side" },
];

/**
 * Compact left/right PIP controls for the Fine-tune trim header —
 * miniature frame thumbnails stacked above the Cut End buttons.
 */
export function PipCornerMiniButtons() {
  const { pipSide, setPipSide, videoOrientation, video } = useStudio();
  const sourceSize =
    video && video.width > 0 && video.height > 0
      ? { width: video.width, height: video.height }
      : null;

  return (
    <div
      className="flex shrink-0 items-stretch justify-end gap-1"
      role="group"
      aria-label="Team photo corner placement"
    >
      {OPTIONS.map((option) => {
        const selected = pipSide === option.id;
        const layout = getPipLayout(option.id, videoOrientation, sourceSize);
        return (
          <button
            key={option.id}
            type="button"
            onClick={() => setPipSide(option.id)}
            aria-pressed={selected}
            title={option.label}
            className={clsx(
              "flex w-[5.75rem] flex-col gap-0.5 rounded-md border-2 px-1 py-1 text-left transition",
              selected
                ? "border-[var(--ink)] bg-[var(--yellow)]"
                : "border-[var(--border-strong)] bg-white hover:border-[var(--ink)]",
            )}
          >
            <div
              className={clsx(
                "relative mx-auto overflow-hidden rounded-sm border border-[var(--ink)]/30 bg-[#0f172a]",
                videoOrientation === "portrait"
                  ? "aspect-[3/4] h-10 w-auto"
                  : "aspect-video h-8 w-full",
              )}
              aria-hidden
            >
              <div
                className="absolute overflow-hidden rounded-[2px] border border-white bg-[#cbd5e1]"
                style={{
                  top: `${Math.max(4, layout.yPercent)}%`,
                  left: `${layout.xPercent}%`,
                  width: `${Math.max(layout.widthPercent, 24)}%`,
                  height: `${Math.max(layout.heightPercent, 30)}%`,
                }}
              />
            </div>
            <span className="text-center text-[9px] font-bold leading-tight text-[var(--ink)]">
              {option.label}
              {selected ? " ✓" : ""}
            </span>
          </button>
        );
      })}
    </div>
  );
}
