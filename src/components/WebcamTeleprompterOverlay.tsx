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
  suggestedPixelsPerTickForScript,
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
 * Center-of-preview teleprompter for webcam capture.
 * Pattern matches Descript / Kommodo / Riverside: large centered script over
 * the live camera, auto-scroll when recording starts, overlay never burned
 * into MediaRecorder (DOM-only).
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
  const [pixelsPerTick, setPixelsPerTick] = useState(() =>
    suggestedPixelsPerTickForScript(script, true),
  );

  pixelsPerTickRef.current = pixelsPerTick;

  // Keep paced default when the official script changes (unless user is mid-scroll).
  useEffect(() => {
    if (scrolling) return;
    setPixelsPerTick(suggestedPixelsPerTickForScript(script, true));
    if (scrollerRef.current) scrollerRef.current.scrollTop = 0;
    scrollCarryRef.current = 0;
  }, [script, scrolling]);

  // Auto-scroll shortly after recording begins (Descript default).
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
      {/* Focus-mode gradients (Descript) — keep eyes near center / lens */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[28%] bg-gradient-to-b from-black/55 to-transparent"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[28%] bg-gradient-to-t from-black/55 to-transparent"
        aria-hidden
      />

      {/* Practice tip — visible while previewing, tucked away once recording */}
      {!recording ? (
        <div className="pointer-events-none absolute inset-x-0 top-0 z-30 flex justify-center px-3 pt-12 md:pt-14">
          <p className="max-w-xl rounded-lg border border-[var(--yellow)]/70 bg-black/70 px-3 py-2 text-center text-[12px] font-semibold leading-snug text-white shadow-lg md:text-[13px]">
            Tip: do 1–2 practice recordings and tweak Speed below until the
            scroll matches your pace before your final take.
          </p>
        </div>
      ) : null}

      {/* Center reading band */}
      <div className="relative mx-auto flex h-full w-full max-w-3xl flex-1 flex-col justify-center px-3 py-10 md:px-8">
        <div className="relative max-h-[52%] min-h-[9rem] overflow-hidden rounded-xl border border-white/25 bg-black/35 shadow-[0_8px_32px_rgba(0,0,0,0.35)] backdrop-blur-[2px]">
          {/* Center reading guide */}
          <div
            className="pointer-events-none absolute inset-x-4 top-1/2 z-20 h-0.5 -translate-y-1/2 bg-[var(--yellow)]/80"
            aria-hidden
          />
          <div
            ref={scrollerRef}
            className={clsx(
              "h-full overflow-y-auto px-4 py-[22%] text-center scrollbar-none",
              !enabled && "opacity-40",
            )}
            style={{ scrollbarWidth: "none" }}
            aria-live="polite"
          >
            <p className="whitespace-pre-wrap text-[1.35rem] font-semibold leading-snug tracking-wide text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] md:text-[1.65rem] md:leading-relaxed">
              {enabled
                ? script.trim() || "Add your script above in the teleprompter."
                : "Teleprompter off — tap On below to show your script."}
            </p>
            <div className="h-28" aria-hidden />
          </div>
        </div>
      </div>

      {/* Controls sit on the preview so eyes stay near the lens */}
      <div className="pointer-events-auto absolute inset-x-0 bottom-0 flex flex-wrap items-center justify-center gap-2 bg-gradient-to-t from-black/70 via-black/40 to-transparent px-3 pb-3 pt-8">
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
            onChange={(e) =>
              setPixelsPerTick(clampTeleprompterSpeed(Number(e.target.value)))
            }
            aria-label="Webcam teleprompter scroll speed"
            className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-white/30 accent-[var(--yellow)] disabled:opacity-40"
          />
        </label>
      </div>
    </div>
  );
}
