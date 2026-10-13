"use client";

import { clsx } from "clsx";
import { useStudio } from "@/lib/studio-context";
import { getPipLayout, type PipSide } from "@/lib/template";

const OPTIONS: Array<{ id: PipSide; label: string; short: string }> = [
  {
    id: "left",
    label: "Move team member to left side",
    short: "Photo left",
  },
  {
    id: "right",
    label: "Move team member to right side",
    short: "Photo right",
  },
];

/**
 * Compact left/right PIP controls — same height as Fine-tune action buttons
 * so the whole toolbar stays on one row.
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
            aria-label={option.label}
            title={option.label}
            className={clsx(
              "inline-flex h-[34px] shrink-0 items-center gap-1.5 rounded-md border-2 px-2 text-[12px] font-bold leading-none transition",
              selected
                ? "border-[var(--ink)] bg-[var(--yellow)] text-[var(--ink)]"
                : "border-[var(--border-strong)] bg-white text-[var(--ink)] hover:border-[var(--ink)]",
            )}
          >
            <span
              className={clsx(
                "relative shrink-0 overflow-hidden rounded-[2px] border border-[var(--ink)]/30 bg-[#0f172a]",
                videoOrientation === "portrait" ? "h-5 w-4" : "h-4 w-7",
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
            <span>
              {option.short}
              {selected ? " ✓" : ""}
            </span>
          </button>
        );
      })}
    </div>
  );
}
