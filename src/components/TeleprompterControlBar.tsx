"use client";

import { Mic, RotateCcw } from "lucide-react";
import { ControlTip } from "@/components/ControlTip";
import { StepCircle } from "@/components/PanelStep";
import { useIsMobile } from "@/hooks/useIsMobile";
import { clsx } from "clsx";

export type VoiceFollowControls = {
  listening: boolean;
  supported: boolean;
  onToggle: () => void;
  /** Circled step number (webcam / phone recording order). */
  step?: number;
};

type TeleprompterControlBarProps = {
  onReset: () => void;
  /** Follow My Voice — the only scroll mode. */
  voiceFollow: VoiceFollowControls;
  /** Practice-only extras under the shared bar (line spacing, text size). */
  extras?: React.ReactNode;
  /**
   * Which device path this bar is for.
   * - webcam: computer webcam instructions
   * - phone: phone browser / phone mic instructions
   * - auto: pick from screen size
   */
  device?: "webcam" | "phone" | "auto";
};

/**
 * Shared control strip for Practice Here and the webcam overlay.
 * Follow My Voice is the only way the script moves.
 */
export function TeleprompterControlBar({
  onReset,
  voiceFollow,
  extras,
  device = "auto",
}: TeleprompterControlBarProps) {
  const isMobile = useIsMobile();
  const onPhone =
    device === "phone" || (device === "auto" && isMobile === true);

  const stepTip = onPhone
    ? `Step ${voiceFollow.step}: turn this on first. Your phone listens while you read. The script scrolls as you talk — you do not chase moving text. Allow the mic, read out loud at a normal pace, then tap Start Recording for the real take.`
    : `Step ${voiceFollow.step}: turn this on first. Your computer webcam setup listens while you read. The script scrolls as you talk — you do not chase moving text. Allow the mic, read out loud at a normal pace, then go to Step 2 (Start Recording) for the real take. Chrome or Edge on your computer works best.`;

  const defaultTip = onPhone
    ? voiceFollow.supported
      ? "Turns on voice listening on your phone. Allow the microphone, then read the script out loud. The words move as you speak."
      : "Voice follow needs a browser that can listen (Safari on iPhone, or Chrome on Android)."
    : voiceFollow.supported
      ? "Turns on voice listening through your computer microphone. Allow the mic, then read the script out loud. The words move as you speak — like a TV teleprompter. Chrome or Edge on your computer works best."
      : "This needs Chrome or Edge on your computer so it can listen while you read.";

  return (
    <div className="space-y-2 border-t border-white/20 bg-black/35 px-3 py-3 max-md:space-y-1 max-md:border-0 max-md:bg-transparent max-md:px-0 max-md:py-1">
      <div className="flex flex-wrap items-center justify-center gap-2">
        <ControlTip tip={voiceFollow.step ? stepTip : defaultTip}>
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
