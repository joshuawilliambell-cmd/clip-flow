"use client";

import {
  TELEPROMPTER_SPEED_MARKERS,
  TELEPROMPTER_SPEED_MAX,
  TELEPROMPTER_SPEED_MIN,
  TELEPROMPTER_SPEED_STEP,
  clampTeleprompterSpeed,
  teleprompterSpeedMarkerPercent,
} from "@/lib/intro-script";
import { clsx } from "clsx";

type TeleprompterSpeedSliderProps = {
  value: number;
  onChange: (pixelsPerTick: number) => void;
  disabled?: boolean;
  /** Compact styling for the webcam overlay. */
  variant?: "panel" | "overlay";
  "aria-label"?: string;
};

/** Shared speed range with marker dots users can aim for. */
export function TeleprompterSpeedSlider({
  value,
  onChange,
  disabled = false,
  variant = "panel",
  "aria-label": ariaLabel = "Teleprompter scroll speed",
}: TeleprompterSpeedSliderProps) {
  const overlay = variant === "overlay";

  return (
    <div className={clsx("relative w-full", disabled && "opacity-40")}>
      <div
        className="pointer-events-none absolute inset-x-0 top-1/2 z-0 -translate-y-1/2"
        aria-hidden
      >
        <div
          className={clsx(
            "absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full",
            overlay ? "bg-white/30" : "bg-white/25",
          )}
        />
        {TELEPROMPTER_SPEED_MARKERS.map((mark) => (
          <span
            key={mark}
            title={`Speed mark ${mark}`}
            className={clsx(
              "absolute top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2",
              overlay
                ? "border-[var(--yellow)] bg-[var(--ink)]"
                : "border-[var(--yellow)] bg-[var(--ink)]",
            )}
            style={{ left: `${teleprompterSpeedMarkerPercent(mark)}%` }}
          />
        ))}
      </div>
      <input
        type="range"
        min={TELEPROMPTER_SPEED_MIN}
        max={TELEPROMPTER_SPEED_MAX}
        step={TELEPROMPTER_SPEED_STEP}
        value={value}
        disabled={disabled}
        onChange={(e) =>
          onChange(clampTeleprompterSpeed(Number(e.target.value)))
        }
        aria-label={ariaLabel}
        className={clsx(
          "relative z-10 h-2 w-full cursor-pointer appearance-none bg-transparent accent-[var(--yellow)]",
          overlay ? "h-1.5" : "h-2",
        )}
      />
    </div>
  );
}
