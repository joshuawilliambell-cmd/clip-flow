"use client";

import { useEffect, useRef, useState } from "react";
import { TELEPROMPTER_TICK_MS, scriptForTeam } from "@/lib/intro-script";
import { TeleprompterControlBar } from "@/components/TeleprompterControlBar";
import { TeleprompterHighlightedScript } from "@/components/TeleprompterHighlightedScript";
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

  useEffect(() => {
    if (!scrolling || !enabled || !active) {
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
  }, [scrolling, enabled, active]);

  if (!active) return null;

  const resetScroll = () => {
    if (scrollerRef.current) scrollerRef.current.scrollTop = 0;
    scrollCarryRef.current = 0;
    setScrolling(false);
    setCountdown(null);
    setScrollHighlight(0);
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
            Same controls as Practice Here. Keep this text near the top of your
            monitor, close to the webcam. Scoot back so we see from about your
            waist to the top of your head.
          </p>
        ) : null}

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
                highlightThrough={scrollHighlight}
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
        />
      </div>
    </div>
  );
}
