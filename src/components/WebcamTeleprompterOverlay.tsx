"use client";

import { useEffect, useRef, useState } from "react";
import { scriptForTeam } from "@/lib/intro-script";
import { ControlTip } from "@/components/ControlTip";
import { TeleprompterControlBar } from "@/components/TeleprompterControlBar";
import { TeleprompterHighlightedScript } from "@/components/TeleprompterHighlightedScript";
import { useMicLevel } from "@/hooks/useMicLevel";
import { useTeleprompterVoiceFollow } from "@/hooks/useTeleprompterVoiceFollow";
import { formatScriptForNaturalReading } from "@/lib/teleprompter-layout";
import { useStudio } from "@/lib/studio-context";
import { clsx } from "clsx";

type WebcamTeleprompterOverlayProps = {
  /** Live camera is showing (preview or recording). */
  active: boolean;
  /** Recording in progress. */
  recording: boolean;
};

/**
 * Top-of-preview teleprompter for webcam capture.
 * Same controls as Practice Here: Follow My Voice only (no Play / Scroll).
 */
export function WebcamTeleprompterOverlay({
  active,
  recording,
}: WebcamTeleprompterOverlayProps) {
  const {
    teamMemberCount,
    photos,
    customerName,
    speakerName,
    speakerTitle,
    speakerDuties,
    activeTeleprompterScript,
    teleprompterFontLarge: fontLarge,
    setTeleprompterFontLarge: setFontLarge,
    teleprompterLineRoomy: lineRoomy,
    setTeleprompterLineRoomy: setLineRoomy,
  } = useStudio();
  const scrollerRef = useRef<HTMLDivElement>(null);

  const rosterKey = photos
    .map((p) => `${p.name}\0${p.title}\0${p.pronoun}\0${p.duties}`)
    .join("|");
  const fillKey = `${customerName}\0${speakerName}\0${speakerTitle}\0${speakerDuties}\0${rosterKey}\0${teamMemberCount}`;

  const fallbackScript = scriptForTeam(teamMemberCount, {
    customerName,
    speakerName,
    speakerTitle,
    speakerDuties,
    people: photos.map((p) => ({
      name: p.name,
      title: p.title,
      pronoun: p.pronoun,
      duties: p.duties,
    })),
  });

  const script = formatScriptForNaturalReading(
    activeTeleprompterScript.trim() || fallbackScript,
  );

  const voiceFollow = useTeleprompterVoiceFollow(script, scrollerRef);
  const micLevel = useMicLevel(voiceFollow.listening);
  const highlightThrough = voiceFollow.listening ? voiceFollow.matchedWords : 0;

  useEffect(() => {
    if (scrollerRef.current) scrollerRef.current.scrollTop = 0;
  }, [fillKey, script]);

  if (!active) return null;

  const resetScroll = () => {
    if (scrollerRef.current) scrollerRef.current.scrollTop = 0;
    voiceFollow.stop();
  };

  return (
    <div className="pointer-events-none absolute inset-0 z-10 flex flex-col">
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[45%] bg-gradient-to-t from-black/50 to-transparent"
        aria-hidden
      />

      <div className="relative z-20 mx-auto flex w-full max-w-[min(100%,36rem)] flex-col px-2 pt-2 md:pt-3">
        {!recording ? (
          <p className="mb-1.5 rounded-md border border-[var(--yellow)]/60 bg-black/65 px-2 py-1.5 text-center text-[10px] font-semibold leading-snug text-white md:text-[11px]">
            <strong className="text-[var(--yellow)]">
              Step 1 — Follow My Voice:
            </strong>{" "}
            click it, allow the mic, then read out loud. The script scrolls as
            you speak.{" "}
            <strong className="text-[var(--yellow)]">Step 2</strong> —{" "}
            <strong>Start Recording</strong> under the preview for the real
            take. Keep this text near the top of your monitor, by the webcam.
          </p>
        ) : (
          <p className="mb-1.5 rounded-md border border-[var(--yellow)]/60 bg-black/65 px-2 py-1.5 text-center text-[10px] font-semibold leading-snug text-white md:text-[11px]">
            Recording — keep reading out loud so{" "}
            <strong className="text-[var(--yellow)]">Follow My Voice</strong>{" "}
            can scroll with you. Click <strong>Stop Recording</strong> under the
            preview when you finish.
          </p>
        )}

        <div className="relative h-44 overflow-hidden rounded-xl border border-white/30 bg-black/50 shadow-[0_8px_28px_rgba(0,0,0,0.4)] backdrop-blur-[2px] md:h-52">
          <div
            className="pointer-events-none absolute inset-x-2 top-[26%] z-20 h-0.5 bg-[var(--yellow)]/85"
            aria-hidden
          />
          <div
            ref={scrollerRef}
            className="h-full overflow-y-auto px-3 pb-16 pt-3 text-center scrollbar-none"
            style={{ scrollbarWidth: "none" }}
            aria-live="polite"
          >
            <TeleprompterHighlightedScript
              script={script}
              highlightThrough={highlightThrough}
              fontLarge={fontLarge}
              roomyLines={lineRoomy}
              className="drop-shadow-[0_1px_2px_rgba(0,0,0,0.85)]"
              emptyLabel="Add your script above in the teleprompter."
            />
            <div className="h-24" aria-hidden />
          </div>
        </div>
      </div>

      <div className="pointer-events-auto absolute inset-x-0 bottom-0 z-30">
        <TeleprompterControlBar
          onReset={resetScroll}
          voiceFollow={{
            listening: voiceFollow.listening,
            supported: voiceFollow.supported,
            step: recording ? undefined : 1,
            onToggle: () => voiceFollow.toggle(),
          }}
          extras={
            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-center gap-2">
                <ControlTip tip="Adds more space between lines so your eyes can move down the page more easily.">
                  <button
                    type="button"
                    onClick={() => setLineRoomy(!lineRoomy)}
                    className="rounded-full border border-white/40 bg-black/50 px-3 py-1.5 text-[12px] font-bold text-white"
                  >
                    {lineRoomy
                      ? "Click Here for Tighter Lines"
                      : "Click Here for Roomy Lines"}
                  </button>
                </ControlTip>
                <ControlTip tip="Makes the words larger or smaller. Pick what is easiest to read on your screen.">
                  <button
                    type="button"
                    onClick={() => setFontLarge(!fontLarge)}
                    className={clsx(
                      "rounded-full border px-3 py-1.5 text-[12px] font-bold",
                      "border-white/40 bg-black/50 text-white",
                    )}
                  >
                    {fontLarge
                      ? "Click Here for Smaller Text"
                      : "Click Here for Bigger Text"}
                  </button>
                </ControlTip>
              </div>
              {voiceFollow.listening ? (
                <div className="flex items-center gap-2 px-1">
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-white/70">
                    Mic
                  </span>
                  <div
                    className="h-2 flex-1 overflow-hidden rounded-full bg-white/15"
                    role="meter"
                    aria-label="Microphone level"
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={Math.round(micLevel * 100)}
                  >
                    <div
                      className="h-full rounded-full bg-[var(--yellow)] transition-[width] duration-75"
                      style={{ width: `${Math.round(micLevel * 100)}%` }}
                    />
                  </div>
                </div>
              ) : null}
              {voiceFollow.status ? (
                <p className="text-center text-[11px] font-medium text-[var(--yellow)]">
                  {voiceFollow.status}
                  {voiceFollow.listening && voiceFollow.totalWords > 0
                    ? ` · ${voiceFollow.matchedWords}/${voiceFollow.totalWords} words`
                    : ""}
                </p>
              ) : null}
            </div>
          }
        />
      </div>
    </div>
  );
}
