"use client";

import { useEffect, useRef, useState } from "react";
import { TELEPROMPTER_TICK_MS, scriptForTeam } from "@/lib/intro-script";
import { TeleprompterControlBar } from "@/components/TeleprompterControlBar";
import { TeleprompterHighlightedScript } from "@/components/TeleprompterHighlightedScript";
import { useMicLevel } from "@/hooks/useMicLevel";
import { useTeleprompterVoiceFollow } from "@/hooks/useTeleprompterVoiceFollow";
import {
  formatScriptForNaturalReading,
  scriptWords,
} from "@/lib/teleprompter-layout";
import { punctuationEaseMultiplier } from "@/lib/teleprompter-pace";
import { useStudio } from "@/lib/studio-context";

type WebcamTeleprompterOverlayProps = {
  /** Live camera is showing (preview or recording). */
  active: boolean;
  /** Recording in progress — auto-starts scroll. */
  recording: boolean;
};

/**
 * Top-of-preview teleprompter for webcam capture.
 * Uses the same control bar and reading window layout as Practice Here.
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
    teleprompterLineRoomy: lineRoomy,
    teleprompterPixelsPerTick: pixelsPerTick,
    setTeleprompterPixelsPerTick,
    setTeleprompterSpeedOverridden,
  } = useStudio();
  const scrollerRef = useRef<HTMLDivElement>(null);
  const pixelsPerTickRef = useRef(0);
  const scrollCarryRef = useRef(0);
  const scriptRef = useRef("");
  const [scrollHighlight, setScrollHighlight] = useState(0);

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
  scriptRef.current = script;

  const [enabled, setEnabled] = useState(true);
  const [scrolling, setScrolling] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const voiceFollow = useTeleprompterVoiceFollow(script, scrollerRef);
  const micLevel = useMicLevel(voiceFollow.listening);
  const highlightThrough = voiceFollow.listening
    ? voiceFollow.matchedWords
    : scrollHighlight;

  pixelsPerTickRef.current = pixelsPerTick;

  useEffect(() => {
    if (scrollerRef.current) scrollerRef.current.scrollTop = 0;
    scrollCarryRef.current = 0;
    setScrollHighlight(0);
  }, [fillKey, script]);

  // Auto-scroll with countdown when recording begins.
  useEffect(() => {
    if (!active || !enabled) {
      setScrolling(false);
      setCountdown(null);
      return;
    }
    if (!recording) {
      setScrolling(false);
      setCountdown(null);
      return;
    }
    setCountdown(3);
  }, [recording, active, enabled]);

  useEffect(() => {
    if (countdown === null) return;
    if (countdown <= 0) {
      setCountdown(null);
      setScrolling(true);
      return;
    }
    const t = window.setTimeout(
      () => setCountdown((c) => (c == null ? null : c - 1)),
      600,
    );
    return () => window.clearTimeout(t);
  }, [countdown]);

  // Timer scroll pauses while Follow My Voice is driving the scroll.
  useEffect(() => {
    if (voiceFollow.listening && scrolling) {
      setScrolling(false);
    }
  }, [voiceFollow.listening, scrolling]);

  useEffect(() => {
    if (!scrolling || !enabled || !active || voiceFollow.listening) {
      scrollCarryRef.current = 0;
      return;
    }
    const id = window.setInterval(() => {
      const el = scrollerRef.current;
      if (!el) return;
      if (el.scrollHeight <= el.clientHeight + 2) return;
      const maxScroll = el.scrollHeight - el.clientHeight;
      const ease = punctuationEaseMultiplier(
        scriptRef.current,
        el.scrollTop,
        maxScroll,
      );
      scrollCarryRef.current += pixelsPerTickRef.current * ease;
      const step = Math.floor(scrollCarryRef.current);
      if (step < 1) return;
      scrollCarryRef.current -= step;
      el.scrollTop += step;
      const words = scriptWords(scriptRef.current).length;
      if (words > 0 && maxScroll > 0) {
        setScrollHighlight(Math.round((el.scrollTop / maxScroll) * words));
      }
      if (el.scrollTop + el.clientHeight >= el.scrollHeight - 2) {
        setScrolling(false);
      }
    }, TELEPROMPTER_TICK_MS);
    return () => window.clearInterval(id);
  }, [scrolling, enabled, active, voiceFollow.listening]);

  if (!active) return null;

  const resetScroll = () => {
    if (scrollerRef.current) scrollerRef.current.scrollTop = 0;
    scrollCarryRef.current = 0;
    setScrolling(false);
    setCountdown(null);
    setScrollHighlight(0);
    voiceFollow.stop();
  };

  const toggleScrollWithCountdown = () => {
    if (countdown !== null) {
      setCountdown(null);
      return;
    }
    if (scrolling) {
      setScrolling(false);
      return;
    }
    if (scrollerRef.current) scrollerRef.current.scrollTop = 0;
    scrollCarryRef.current = 0;
    setScrollHighlight(0);
    setCountdown(3);
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
            <strong className="text-[var(--yellow)]">Step 1 — Follow My Voice:</strong>{" "}
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
            can scroll with you. Click <strong>Stop Recording</strong> under
            the preview when you finish.
          </p>
        )}

        <div className="relative h-44 overflow-hidden rounded-xl border border-white/30 bg-black/50 shadow-[0_8px_28px_rgba(0,0,0,0.4)] backdrop-blur-[2px] md:h-52">
          <div
            className="pointer-events-none absolute inset-x-2 top-[26%] z-20 h-0.5 bg-[var(--yellow)]/85"
            aria-hidden
          />
          {countdown !== null && countdown > 0 ? (
            <div
              className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center bg-black/50"
              aria-live="assertive"
            >
              <span className="text-5xl font-bold text-[var(--yellow)] md:text-6xl">
                {countdown}
              </span>
            </div>
          ) : null}
          <div
            ref={scrollerRef}
            className={`h-full overflow-y-auto px-3 pb-16 pt-3 text-center scrollbar-none ${
              !enabled ? "opacity-40" : ""
            }`}
            style={{ scrollbarWidth: "none" }}
            aria-live="polite"
          >
            {enabled ? (
              <TeleprompterHighlightedScript
                script={script}
                highlightThrough={highlightThrough}
                fontLarge={fontLarge}
                roomyLines={lineRoomy}
                className="drop-shadow-[0_1px_2px_rgba(0,0,0,0.85)]"
                emptyLabel="Add your script above in the teleprompter."
              />
            ) : (
              <p className="mx-auto max-w-[28ch] text-center text-[1.15rem] font-semibold text-white/70">
                Teleprompter off — tap On below to show your script.
              </p>
            )}
            <div className="h-24" aria-hidden />
          </div>
        </div>
      </div>

      <div className="pointer-events-auto absolute inset-x-0 bottom-0 z-30">
        <TeleprompterControlBar
          enabled={enabled}
          onToggleEnabled={() => {
            setEnabled((v) => !v);
            setScrolling(false);
            setCountdown(null);
            voiceFollow.stop();
          }}
          scrolling={scrolling}
          countdownActive={countdown !== null}
          onToggleScroll={toggleScrollWithCountdown}
          onReset={resetScroll}
          pixelsPerTick={pixelsPerTick}
          onSpeedChange={(next) => {
            setTeleprompterPixelsPerTick(next);
            setTeleprompterSpeedOverridden(true);
          }}
          voiceFollow={{
            listening: voiceFollow.listening,
            supported: voiceFollow.supported,
            step: recording ? undefined : 1,
            onToggle: () => {
              setScrolling(false);
              setCountdown(null);
              voiceFollow.toggle();
            },
          }}
          extras={
            voiceFollow.listening || voiceFollow.status ? (
              <div className="space-y-1.5">
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
            ) : null
          }
        />
      </div>
    </div>
  );
}
