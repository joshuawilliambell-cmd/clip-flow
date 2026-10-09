"use client";

import { useEffect, useRef, useState } from "react";
import { Pause, Play, RotateCcw, ScrollText } from "lucide-react";
import { HelpTip } from "@/components/HelpTip";
import {
  INTRO_SCRIPTS,
  TELEPROMPTER_SPEEDS,
  scriptForTeamCount,
  type TeleprompterSpeedId,
} from "@/lib/intro-script";
import { useStudio } from "@/lib/studio-context";
import { TEAM_MEMBER_COUNT_OPTIONS, type TeamMemberCount } from "@/lib/template";
import { clsx } from "clsx";

type TeleprompterProps = {
  /** When true, auto-scroll can run (usually while recording). */
  recording: boolean;
  className?: string;
};

export function Teleprompter({ recording, className }: TeleprompterProps) {
  const { teamMemberCount, setTeamMemberCount } = useStudio();
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [script, setScript] = useState(() => scriptForTeamCount(teamMemberCount));
  const [edited, setEdited] = useState(false);
  const [speedId, setSpeedId] = useState<TeleprompterSpeedId>("medium");
  const [scrolling, setScrolling] = useState(false);
  const [fontLarge, setFontLarge] = useState(true);

  // Keep script matched to team size unless the user customized it.
  useEffect(() => {
    if (edited) return;
    setScript(scriptForTeamCount(teamMemberCount));
    if (scrollerRef.current) scrollerRef.current.scrollTop = 0;
  }, [teamMemberCount, edited]);

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

  const loadOfficialScript = (count: TeamMemberCount) => {
    setTeamMemberCount(count);
    setScript(scriptForTeamCount(count));
    setEdited(false);
    resetScroll();
  };

  return (
    <div
      className={clsx(
        "flex h-full min-h-[16rem] flex-col section-card bg-[var(--olive)] text-white",
        className,
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-2 border-b border-white/20 px-4 py-3">
        <div className="flex items-center gap-2">
          <ScrollText className="h-5 w-5 text-[var(--yellow)]" aria-hidden />
          <div>
            <p className="text-lg font-semibold">Teleprompter</p>
            <p className="text-sm font-semibold text-white/80">
              Script: {INTRO_SCRIPTS[teamMemberCount].title}
            </p>
          </div>
        </div>
        <HelpTip title="How the teleprompter works">
          <p>
            The script matches how many teammates you chose (0–4). Replace the
            bracketed names before you record.
          </p>
          <p>
            Cue lines like <strong>[Show first photo]</strong> tell you when a
            team photo should appear on the timeline.
          </p>
          <p>
            When you start recording, the words scroll so you can read near the
            camera. Change speed anytime.
          </p>
        </HelpTip>
      </div>

      {!recording ? (
        <div className="space-y-3 border-b border-white/15 px-4 py-3">
          <p className="text-sm font-bold text-[var(--yellow)]">
            Choose a script (by team size)
          </p>
          <div className="flex flex-wrap gap-2">
            {TEAM_MEMBER_COUNT_OPTIONS.map((count) => (
              <button
                key={count}
                type="button"
                onClick={() => loadOfficialScript(count)}
                className={clsx(
                  "rounded-xl border-2 px-3 py-2 text-sm font-bold",
                  teamMemberCount === count && !edited
                    ? "border-[var(--yellow)] bg-[var(--yellow)] text-[var(--ink)]"
                    : "border-white/40 text-white hover:border-[var(--yellow)]",
                )}
              >
                {count === 0 ? "Just me" : `${count}`}
              </button>
            ))}
          </div>

          <label className="block">
            <span className="mb-1 block text-sm font-semibold text-[var(--yellow)]">
              Your script (edit names before you record)
            </span>
            <textarea
              value={script}
              onChange={(e) => {
                setScript(e.target.value);
                setEdited(true);
              }}
              rows={6}
              className="w-full resize-y rounded-xl border-2 border-white/30 bg-white/10 px-3 py-2 text-base font-semibold leading-relaxed text-white placeholder:text-white/50 focus:border-[var(--yellow)] focus:outline-none"
              placeholder="Type what you want to say…"
            />
          </label>
          <button
            type="button"
            className="text-sm font-bold text-[var(--yellow)] underline"
            onClick={() => loadOfficialScript(teamMemberCount)}
          >
            Reset to official {INTRO_SCRIPTS[teamMemberCount].title} script
          </button>
        </div>
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
