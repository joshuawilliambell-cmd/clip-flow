"use client";

import { useEffect, useRef, useState } from "react";
import { Pause, Play, RotateCcw, ScrollText } from "lucide-react";
import { HelpTip } from "@/components/HelpTip";
import {
  SAMPLE_INTRO_SCRIPT,
  TELEPROMPTER_SPEEDS,
  type TeleprompterSpeedId,
} from "@/lib/intro-script";
import { clsx } from "clsx";

type TeleprompterProps = {
  /** When true, auto-scroll can run (usually while recording). */
  recording: boolean;
  className?: string;
};

export function Teleprompter({ recording, className }: TeleprompterProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [script, setScript] = useState(SAMPLE_INTRO_SCRIPT);
  const [speedId, setSpeedId] = useState<TeleprompterSpeedId>("medium");
  const [scrolling, setScrolling] = useState(false);
  const [fontLarge, setFontLarge] = useState(true);

  // Auto-start scroll shortly after recording begins; pause when recording ends.
  useEffect(() => {
    if (!recording) {
      setScrolling(false);
      return;
    }
    const delay = window.setTimeout(() => setScrolling(true), 800);
    return () => window.clearTimeout(delay);
  }, [recording]);

  useEffect(() => {
    if (!scrolling) return;
    const speed =
      TELEPROMPTER_SPEEDS.find((s) => s.id === speedId)?.pixelsPerTick ?? 1.2;
    const id = window.setInterval(() => {
      const el = scrollerRef.current;
      if (!el) return;
      el.scrollTop += speed;
      if (el.scrollTop + el.clientHeight >= el.scrollHeight - 2) {
        setScrolling(false);
      }
    }, 40);
    return () => window.clearInterval(id);
  }, [scrolling, speedId]);

  const resetScroll = () => {
    if (scrollerRef.current) scrollerRef.current.scrollTop = 0;
    setScrolling(false);
  };

  return (
    <div
      className={clsx(
        "flex h-full min-h-[16rem] flex-col rounded-2xl border-2 border-[var(--ink)] bg-[#0B2C5C] text-white",
        className,
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-2 border-b border-white/20 px-4 py-3">
        <div className="flex items-center gap-2">
          <ScrollText className="h-5 w-5 text-[var(--yellow)]" aria-hidden />
          <div>
            <p className="text-lg font-bold">Teleprompter</p>
            <p className="text-sm text-white/80">
              Read this while you look near the camera
            </p>
          </div>
        </div>
        <HelpTip title="How the teleprompter works">
          <p>
            Type or paste your talking points. When you start recording, the
            words scroll slowly so you can read them.
          </p>
          <p>
            Place this panel near your webcam (usually at the top of your
            laptop) so your eyes stay close to the camera.
          </p>
          <p>
            Tap <strong>Slow / Medium / Fast</strong> if the scroll is too
            quick or too slow. You can also scroll with your finger or mouse.
          </p>
        </HelpTip>
      </div>

      {!recording ? (
        <label className="block border-b border-white/15 px-4 py-3">
          <span className="mb-1 block text-sm font-semibold text-[var(--yellow)]">
            Your script (edit before you record)
          </span>
          <textarea
            value={script}
            onChange={(e) => setScript(e.target.value)}
            rows={5}
            className="w-full resize-y rounded-xl border-2 border-white/30 bg-white/10 px-3 py-2 text-base leading-relaxed text-white placeholder:text-white/50 focus:border-[var(--yellow)] focus:outline-none"
            placeholder="Type what you want to say…"
          />
          <button
            type="button"
            className="mt-2 text-sm font-semibold text-[var(--yellow)] underline"
            onClick={() => {
              setScript(SAMPLE_INTRO_SCRIPT);
              resetScroll();
            }}
          >
            Load sample Love&apos;s intro script
          </button>
        </label>
      ) : null}

      <div
        ref={scrollerRef}
        className={clsx(
          "flex-1 overflow-y-auto px-5 py-6 text-center leading-snug",
          fontLarge ? "text-2xl md:text-3xl" : "text-xl md:text-2xl",
        )}
        aria-live="polite"
      >
        <div className="mx-auto max-w-xl whitespace-pre-wrap font-semibold tracking-wide">
          {script.trim() || "Add a script above, then start recording."}
        </div>
        {/* Extra space so last lines can scroll to center */}
        <div className="h-40" aria-hidden />
      </div>

      <div className="flex flex-wrap items-center gap-2 border-t border-white/20 px-3 py-3">
        <button
          type="button"
          onClick={() => setScrolling((v) => !v)}
          className="inline-flex items-center gap-1 rounded-xl border-2 border-white bg-[var(--yellow)] px-3 py-2 text-sm font-bold text-[var(--ink)]"
        >
          {scrolling ? (
            <>
              <Pause className="h-4 w-4" /> Pause scroll
            </>
          ) : (
            <>
              <Play className="h-4 w-4" /> Start scroll
            </>
          )}
        </button>
        <button
          type="button"
          onClick={resetScroll}
          className="inline-flex items-center gap-1 rounded-xl border-2 border-white/50 px-3 py-2 text-sm font-bold text-white"
        >
          <RotateCcw className="h-4 w-4" /> Back to top
        </button>
        <div className="flex flex-wrap gap-1">
          {TELEPROMPTER_SPEEDS.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setSpeedId(s.id)}
              className={clsx(
                "rounded-lg border-2 px-2.5 py-1.5 text-sm font-bold",
                speedId === s.id
                  ? "border-[var(--yellow)] bg-[var(--yellow)] text-[var(--ink)]"
                  : "border-white/40 text-white",
              )}
            >
              {s.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setFontLarge((v) => !v)}
          className="ml-auto rounded-lg border-2 border-white/40 px-2.5 py-1.5 text-sm font-bold text-white"
        >
          {fontLarge ? "Smaller text" : "Bigger text"}
        </button>
      </div>
    </div>
  );
}
