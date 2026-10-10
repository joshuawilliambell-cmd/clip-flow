"use client";

import { Mic, RotateCcw } from "lucide-react";
import { ControlTip } from "@/components/ControlTip";
import { StepCircle } from "@/components/PanelStep";
import { clsx } from "clsx";

export type VoiceFollowControls = {
  listening: boolean;
  supported: boolean;
  onToggle: () => void;
  /** Circled step number (webcam recording order). */
  step?: number;
};

type TeleprompterControlBarProps = {
  onReset: () => void;
  /** Follow My Voice — the only scroll mode. */
  voiceFollow: VoiceFollowControls;
  /** Practice-only extras under the shared bar (line spacing, text size). */
  extras?: React.ReactNode;
};

/**
 * Shared control strip for Practice Here and the webcam overlay.
 * Follow My Voice is the only way the script moves.
 */
export function TeleprompterControlBar({
  onReset,
  voiceFollow,
  extras,
}: TeleprompterControlBarProps) {
  return (
    <div className="space-y-2 border-t border-white/20 bg-black/35 px-3 py-3">
      <div className="flex flex-wrap items-center justify-center gap-2">
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
                "border-[var(--yellow)] bg-[var(--yellow)] text-[var(--ink)]",
                !voiceFollow.listening && "ring-2 ring-[var(--yellow)]/40",
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

        <ControlTip tip="Sends the script back to the very first line so you can start over.">
          <button
            type="button"
            onClick={onReset}
            className="inline-flex items-center gap-1 rounded-full border border-white/40 bg-black/50 px-3 py-1.5 text-[12px] font-bold text-white"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Click Here for Top
          </button>
        </ControlTip>
      </div>
      {extras}
    </div>
  );
}
