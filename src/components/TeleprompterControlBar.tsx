"use client";

import { Pause, Play, RotateCcw } from "lucide-react";
import { TeleprompterSpeedSlider } from "@/components/TeleprompterSpeedSlider";
import { clsx } from "clsx";

type TeleprompterControlBarProps = {
  enabled: boolean;
  onToggleEnabled: () => void;
  scrolling: boolean;
  countdownActive: boolean;
  onToggleScroll: () => void;
  onReset: () => void;
  pixelsPerTick: number;
  onSpeedChange: (value: number) => void;
  /** Practice-only extras under the shared bar. */
  extras?: React.ReactNode;
};

/**
 * Shared control strip for Practice Here and the webcam overlay so
 * practice feels identical to the recording teleprompter.
 */
export function TeleprompterControlBar({
  enabled,
  onToggleEnabled,
  scrolling,
  countdownActive,
  onToggleScroll,
  onReset,
  pixelsPerTick,
  onSpeedChange,
  extras,
}: TeleprompterControlBarProps) {
  return (
    <div className="space-y-2 border-t border-white/20 bg-black/35 px-3 py-3">
      <div className="flex flex-wrap items-center justify-center gap-2">
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          onClick={onToggleEnabled}
          className={clsx(
            "rounded-full border px-3 py-1.5 text-[12px] font-bold uppercase tracking-wide",
            enabled
              ? "border-[var(--yellow)] bg-[var(--yellow)] text-[var(--ink)]"
              : "border-white/40 bg-black/50 text-white",
          )}
        >
          {enabled ? "Click Here — Prompter On" : "Click Here — Prompter Off"}
        </button>

        <button
          type="button"
          disabled={!enabled}
          onClick={onToggleScroll}
          className="inline-flex items-center gap-1 rounded-full border border-[var(--yellow)] bg-[var(--yellow)] px-3 py-1.5 text-[12px] font-bold text-[var(--ink)] disabled:opacity-40"
        >
          {scrolling || countdownActive ? (
            <>
              <Pause className="h-3.5 w-3.5" /> Click Here to Pause
            </>
          ) : (
            <>
              <Play className="h-3.5 w-3.5 fill-current" /> Click Here to Play /
              Scroll
            </>
          )}
        </button>

        <button
          type="button"
          disabled={!enabled}
          onClick={onReset}
          className="inline-flex items-center gap-1 rounded-full border border-white/40 bg-black/50 px-3 py-1.5 text-[12px] font-bold text-white disabled:opacity-40"
        >
          <RotateCcw className="h-3.5 w-3.5" /> Click Here for Top
        </button>

        <div className="flex min-w-[12rem] max-w-[18rem] flex-1 items-center gap-2 rounded-full border border-white/40 bg-black/50 px-3 py-1.5 text-white">
          <span className="shrink-0 text-[11px] font-bold uppercase tracking-wide text-white/80">
            Speed
          </span>
          <TeleprompterSpeedSlider
            value={pixelsPerTick}
            disabled={!enabled}
            variant="overlay"
            aria-label="Teleprompter scroll speed"
            onChange={onSpeedChange}
          />
        </div>
      </div>
      {extras}
    </div>
  );
}
