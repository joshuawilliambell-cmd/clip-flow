"use client";

import { useEffect, useRef, useState } from "react";
import { Pause, Play, RotateCcw } from "lucide-react";
import {
  TELEPROMPTER_SPEED_MAX,
  TELEPROMPTER_SPEED_MIN,
  TELEPROMPTER_SPEED_STEP,
  TELEPROMPTER_TICK_MS,
  clampTeleprompterSpeed,
  scriptForTeam,
} from "@/lib/intro-script";
import { useStudio } from "@/lib/studio-context";
import { clsx } from "clsx";

type WebcamTeleprompterOverlayProps = {
  /** Live camera is showing (preview or recording). */
  active: boolean;
  /** Recording in progress — auto-starts scroll. */
  recording: boolean;
};

/**
 * Top-of-preview teleprompter for webcam capture.
 * Script sits near the top of the frame so eyes stay toward the webcam
 * (usually above the monitor) instead of the screen center. Overlay is
 * DOM-only and is never burned into MediaRecorder.
 * Scroll speed matches the Script teleprompter practice area.
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
    teleprompterPixelsPerTick: pixelsPerTick,
    setTeleprompterPixelsPerTick,
    setTeleprompterSpeedOverridden,
  } = useStudio();
  const scrollerRef = useRef<HTMLDivElement>(null);
  const pixelsPerTickRef = useRef(0);
  const scrollCarryRef = useRef(0);

  const script = scriptForTeam(teamMemberCount, {
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

  const [enabled, setEnabled] = useState(true);
  const [scrolling, setScrolling] = useState(false);

  pixelsPerTickRef.current = pixelsPerTick;

  // Reset scroll position when the official script text changes.
  useEffect(() => {
    if (scrolling) return;
    if (scrollerRef.current) scrollerRef.current.scrollTop = 0;
    scrollCarryRef.current = 0;
  }, [script, scrolling]);

  // Auto-scroll shortly after recording begins.
  useEffect(() => {
    if (!active || !enabled) {
      setScrolling(false);
      return;
    }
    if (!recording) {
      setScrolling(false);
      return;
    }
    const delay = window.setTimeout(() => setScrolling(true), 600);
    return () => window.clearTimeout(delay);
  }, [recording, active, enabled]);

  // Accumulate sub-pixel scroll so slow speeds still move.
  useEffect(() => {
    if (!scrolling || !enabled || !active) {
      scrollCarryRef.current = 0;
      return;
    }
    const id = window.setInterval(() => {
      const el = scrollerRef.current;
      if (!el) return;
      if (el.scrollHeight <= el.clientHeight + 2) return;
      scrollCarryRef.current += pixelsPerTickRef.current;
      const step = Math.floor(scrollCarryRef.current);
      if (step < 1) return;
      scrollCarryRef.current -= step;
      el.scrollTop += step;
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
  };

  return (
    <div className="pointer-events-none absolute inset-0 z-10 flex flex-col">
      {/* Soften lower half so the top reading band draws the eye upward */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[45%] bg-gradient-to-t from-black/50 to-transparent"
        aria-hidden
      />

      {/* Top reading band — near the webcam lens */}
      <div className="relative z-20 mx-auto flex w-full max-w-4xl flex-col px-2 pt-2 md:px-4 md:pt-3">
        {!recording ? (
          <p className="mb-1.5 rounded-md border border-[var(--yellow)]/60 bg-black/65 px-2.5 py-1.5 text-center text-[11px] font-semibold leading-snug text-white md:text-[12px]">
            Scroll speed matches Script teleprompter practice above. Do 1–2
            practice takes if you still need to tweak Speed.
          </p>
        ) : null}

        <div className="relative h-36 overflow-hidden rounded-xl border border-white/30 bg-black/45 shadow-[0_8px_28px_rgba(0,0,0,0.4)] backdrop-blur-[2px] md:h-44">
          {/* Reading guide near the top of the band (eye line → webcam) */}
          <div
            className="pointer-events-none absolute inset-x-3 top-[28%] z-20 h-0.5 bg-[var(--yellow)]/85"
            aria-hidden
          />
          <div
            ref={scrollerRef}
            className={clsx(
              "h-full overflow-y-auto px-3 pb-16 pt-3 text-center scrollbar-none md:px-5 md:pt-4",
              !enabled && "opacity-40",
            )}
            style={{ scrollbarWidth: "none" }}
            aria-live="polite"
          >
            <p className="whitespace-pre-wrap text-[1.25rem] font-semibold leading-snug tracking-wide text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.85)] md:text-[1.5rem] md:leading-relaxed">
              {enabled
                ? script.trim() || "Add your script above in the teleprompter."
                : "Teleprompter off — tap On below to show your script."}
            </p>
            <div className="h-24" aria-hidden />
          </div>
        </div>
      </div>

      {/* Controls stay at the bottom so they do not pull eyes from the lens */}
      <div className="pointer-events-auto absolute inset-x-0 bottom-0 z-30 flex flex-wrap items-center justify-center gap-2 bg-gradient-to-t from-black/75 via-black/45 to-transparent px-3 pb-3 pt-10">
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          onClick={() => {
            setEnabled((v) => !v);
            setScrolling(false);
          }}
          className={clsx(
            "rounded-full border px-3 py-1.5 text-[12px] font-bold uppercase tracking-wide",
            enabled
              ? "border-[var(--yellow)] bg-[var(--yellow)] text-[var(--ink)]"
              : "border-white/40 bg-black/50 text-white",
          )}
        >
          {enabled ? "Prompter on" : "Prompter off"}
        </button>

        <button
          type="button"
          disabled={!enabled}
          onClick={() => setScrolling((v) => !v)}
          className="inline-flex items-center gap-1 rounded-full border border-white/40 bg-black/50 px-3 py-1.5 text-[12px] font-bold text-white disabled:opacity-40"
        >
          {scrolling ? (
            <>
              <Pause className="h-3.5 w-3.5" /> Pause
            </>
          ) : (
            <>
              <Play className="h-3.5 w-3.5" /> Scroll
            </>
          )}
        </button>

        <button
          type="button"
          disabled={!enabled}
          onClick={resetScroll}
          className="inline-flex items-center gap-1 rounded-full border border-white/40 bg-black/50 px-3 py-1.5 text-[12px] font-bold text-white disabled:opacity-40"
        >
          <RotateCcw className="h-3.5 w-3.5" /> Top
        </button>

        <label className="flex min-w-[10rem] max-w-[14rem] flex-1 items-center gap-2 rounded-full border border-white/40 bg-black/50 px-3 py-1 text-white">
          <span className="shrink-0 text-[11px] font-bold uppercase tracking-wide text-white/80">
            Speed
          </span>
          <input
            type="range"
            min={TELEPROMPTER_SPEED_MIN}
            max={TELEPROMPTER_SPEED_MAX}
            step={TELEPROMPTER_SPEED_STEP}
            value={pixelsPerTick}
            disabled={!enabled}
            onChange={(e) => {
              setTeleprompterPixelsPerTick(
                clampTeleprompterSpeed(Number(e.target.value)),
              );
              setTeleprompterSpeedOverridden(true);
            }}
            aria-label="Webcam teleprompter scroll speed"
            className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-white/30 accent-[var(--yellow)] disabled:opacity-40"
          />
        </label>
      </div>
    </div>
  );
}
