"use client";

import { Mic, Pause, Play, RotateCcw } from "lucide-react";
import { ControlTip } from "@/components/ControlTip";
import { StepCircle } from "@/components/PanelStep";
import { TeleprompterSpeedSlider } from "@/components/TeleprompterSpeedSlider";
import { clsx } from "clsx";

export type VoiceFollowControls = {
  listening: boolean;
  supported: boolean;
  onToggle: () => void;
  /** Circled step number (webcam recording order). */
  step?: number;
};

type TeleprompterControlBarProps = {
  scrolling: boolean;
  countdownActive: boolean;
  onToggleScroll: () => void;
  onReset: () => void;
  pixelsPerTick: number;
  onSpeedChange: (value: number) => void;
  /** Primary practice path — shown first when provided. */
  voiceFollow?: VoiceFollowControls;
  /** Practice-only extras under the shared bar. */
  extras?: React.ReactNode;
};

/**
 * Shared control strip for Practice Here and the webcam overlay so
 * practice feels identical to the recording teleprompter.
 */
export function TeleprompterControlBar({
  scrolling,
  countdownActive,
  onToggleScroll,
  onReset,
  pixelsPerTick,
  onSpeedChange,
  voiceFollow,
  extras,
}: TeleprompterControlBarProps) {
  return (
    <div className="space-y-2 border-t border-white/20 bg-black/35 px-3 py-3">
      <div className="flex flex-wrap items-center justify-center gap-2">
        {voiceFollow ? (
          <ControlTip
            tip={
              voiceFollow.step
                ? `Step ${voiceFollow.step}: turn this on first. Your computer listens while you read. The script scrolls as you talk — you do not chase moving text. Allow the mic, read out loud at a normal pace, then go to Step 2 (Start Recording) for the real take. Chrome or Edge works best.`
                : voiceFollow.supported
                  ? "Turns on voice listening. Allow the microphone, then read the script out loud. The words move down the screen as you speak — like a TV teleprompter that follows you. Chrome or Edge on your computer works best."
                  : "This needs Chrome or Edge on your computer so it can listen while you read."
            }
          >
            <span className="inline-flex items-center gap-1.5">
              {voiceFollow.step ? (
                <StepCircle
                  n={voiceFollow.step}
                  tone="dark"
                  label={`Step ${voiceFollow.step}`}
                />
              ) : null}
              <button
                type="button"
                disabled={!voiceFollow.supported}
                onClick={voiceFollow.onToggle}
                className={clsx(
                  "inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-[12px] font-bold shadow-sm disabled:opacity-40",
                  voiceFollow.listening
                    ? "border-[var(--yellow)] bg-[var(--yellow)] text-[var(--ink)]"
                    : "border-[var(--yellow)] bg-[var(--yellow)] text-[var(--ink)] ring-2 ring-[var(--yellow)]/40",
                )}
              >
                <Mic className="h-3.5 w-3.5" aria-hidden />
                {voiceFollow.listening
                  ? "Click Here to Stop Voice Follow"
                  : voiceFollow.step
                    ? `Step ${voiceFollow.step} — Click Here to Follow My Voice`
                    : "Click Here to Follow My Voice"}
              </button>
            </span>
          </ControlTip>
        ) : null}

        <ControlTip tip="Backup option if you are not using Follow My Voice. Starts a 3-2-1 countdown, then moves the script at a steady speed. Click again to pause.">
          <button
            type="button"
            disabled={Boolean(voiceFollow?.listening)}
            onClick={onToggleScroll}
            className="inline-flex items-center gap-1 rounded-full border border-white/40 bg-black/50 px-3 py-1.5 text-[12px] font-bold text-white disabled:opacity-40"
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
        </ControlTip>

        <ControlTip tip="Sends the script back to the very first line so you can start over.">
          <button
            type="button"
            onClick={onReset}
            className="inline-flex items-center gap-1 rounded-full border border-white/40 bg-black/50 px-3 py-1.5 text-[12px] font-bold text-white"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Click Here for Top
          </button>
        </ControlTip>

        <ControlTip tip="How fast the script moves when you use Play / Scroll. This does not change Follow My Voice — that listens to you instead.">
          <div className="flex min-w-[12rem] max-w-[18rem] flex-1 items-center gap-2 rounded-full border border-white/40 bg-black/50 px-3 py-1.5 text-white">
            <span className="shrink-0 text-[11px] font-bold uppercase tracking-wide text-white/80">
              Speed
            </span>
            <TeleprompterSpeedSlider
              value={pixelsPerTick}
              disabled={Boolean(voiceFollow?.listening)}
              variant="overlay"
              aria-label="Teleprompter scroll speed"
              onChange={onSpeedChange}
            />
          </div>
        </ControlTip>
      </div>
      {extras}
    </div>
  );
}
