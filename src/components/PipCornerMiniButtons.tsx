"use client";

import { clsx } from "clsx";
import { useStudio } from "@/lib/studio-context";
import { getPipLayout, type PipSide } from "@/lib/template";

const OPTIONS: Array<{ id: PipSide; label: string }> = [
  { id: "left", label: "Move team member to left side" },
  { id: "right", label: "Move team member to right side" },
];

/**
 * Compact left/right PIP controls — short enough to sit in-line with
 * Fine-tune trim action buttons (Cut End, etc.).
 */
export function PipCornerMiniButtons() {
  const { pipSide, setPipSide, videoOrientation, video } = useStudio();
  const sourceSize =
    video && video.width > 0 && video.height > 0
      ? { width: video.width, height: video.height }
      : null;

  return (
    <div
      className="flex shrink-0 items-center gap-1"
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
              "inline-flex h-9 items-center gap-1.5 rounded-md border-2 px-1.5 py-1 text-left transition",
              selected
                ? "border-[var(--ink)] bg-[var(--yellow)]"
                : "border-[var(--border-strong)] bg-white hover:border-[var(--ink)]",
            )}
          >
            <span
              className={clsx(
                "relative shrink-0 overflow-hidden rounded-[2px] border border-[var(--ink)]/30 bg-[#0f172a]",
                videoOrientation === "portrait" ? "h-7 w-5" : "h-6 w-10",
              )}
              aria-hidden
            >
              <span
                className="absolute rounded-[1px] border border-white bg-[#cbd5e1]"
                style={{
                  top: `${Math.max(4, layout.yPercent)}%`,
                  left: `${layout.xPercent}%`,
                  width: `${Math.max(layout.widthPercent, 26)}%`,
                  height: `${Math.max(layout.heightPercent, 32)}%`,
                }}
              />
            </span>
            <span className="max-w-[5.5rem] text-[9px] font-bold leading-tight text-[var(--ink)]">
              {option.label}
              {selected ? " ✓" : ""}
            </span>
          </button>
        );
      })}
    </div>
  );
}
