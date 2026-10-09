"use client";

import { useEffect, useRef, useState } from "react";
import {
  FileUp,
  Pause,
  Play,
  RotateCcw,
  ScrollText,
} from "lucide-react";
import { HelpTip } from "@/components/HelpTip";
import {
  INTRO_SCRIPTS,
  TARGET_INTRO_SECONDS,
  TELEPROMPTER_SPEED_MAX,
  TELEPROMPTER_SPEED_MIN,
  TELEPROMPTER_TICK_MS,
  clampTeleprompterSpeed,
  estimatedScrollSeconds,
  idealPixelsPerTickForDistance,
  isScriptUploadFile,
  scriptForTeam,
  suggestedPixelsPerTickForScript,
} from "@/lib/intro-script";
import { TeleprompterSpeedSlider } from "@/components/TeleprompterSpeedSlider";
import { PanelSteps } from "@/components/PanelStep";
import { useTeleprompterVoiceFollow } from "@/hooks/useTeleprompterVoiceFollow";
import {
  TELEPROMPTER_COLUMN_CLASS,
  TELEPROMPTER_TEXT_CLASS_COMPACT,
  TELEPROMPTER_TEXT_CLASS_LARGE,
  formatScriptForNaturalReading,
} from "@/lib/teleprompter-layout";
import {
  estimateWpm,
  punctuationEaseMultiplier,
} from "@/lib/teleprompter-pace";
import { useStudio } from "@/lib/studio-context";
import { clsx } from "clsx";
import { formatClock } from "@/lib/timeline";

type ScriptSource = "official" | "custom";

type TeleprompterProps = {
  /** When true, auto-scroll can start (usually while recording). */
  recording?: boolean;
  className?: string;
};

export function Teleprompter({
  recording = false,
  className,
}: TeleprompterProps) {
  const {
    teamMemberCount,
    photos,
    customerName,
    speakerName,
    speakerTitle,
    speakerDuties,
    teleprompterPixelsPerTick: pixelsPerTick,
    teleprompterSpeedOverridden: speedOverridden,
    setTeleprompterPixelsPerTick,
    setTeleprompterSpeedOverridden,
    setActiveTeleprompterScript,
    teleprompterFontLarge: fontLarge,
    setTeleprompterFontLarge: setFontLarge,
  } = useStudio();
  const scrollerRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const speedOverriddenRef = useRef(false);
  const pixelsPerTickRef = useRef(0);
  const scrollCarryRef = useRef(0);

  const rosterKey = photos
    .map((p) => `${p.name}\0${p.title}\0${p.pronoun}\0${p.duties}`)
    .join("|");
  const speakerKey = `${speakerName}\0${speakerTitle}\0${speakerDuties}`;
  const rosterPeople = photos.map((p) => ({
    name: p.name,
    title: p.title,
    pronoun: p.pronoun,
    duties: p.duties,
  }));
  const officialScript = scriptForTeam(teamMemberCount, {
    customerName,
    speakerName,
    speakerTitle,
    speakerDuties,
    people: rosterPeople,
  });

  const [enabled, setEnabled] = useState(true);
  const [source, setSource] = useState<ScriptSource>("official");
  const [script, setScript] = useState(() => officialScript);
  const [customScript, setCustomScript] = useState("");
  const [uploadName, setUploadName] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [scrolling, setScrolling] = useState(false);
  const [scrollDistancePx, setScrollDistancePx] = useState(0);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  speedOverriddenRef.current = speedOverridden;
  pixelsPerTickRef.current = pixelsPerTick;
  const practiceScriptRef = useRef("");

  // Official script tracks team size and roster names/titles.
  // Depend on content keys (not a fresh string each render) so Pause / re-renders
  // do not jump the script to the top or thrash auto speed.
  useEffect(() => {
    if (source !== "official") return;
    setScript(officialScript);
    if (scrollerRef.current) scrollerRef.current.scrollTop = 0;
    scrollCarryRef.current = 0;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- keyed by roster/speaker content
  }, [teamMemberCount, source, rosterKey, speakerKey, customerName]);

  const displayScript =
    source === "official" ? script : customScript.trim() || script;
  const practiceScript = formatScriptForNaturalReading(displayScript);
  practiceScriptRef.current = practiceScript;

  const voiceFollow = useTeleprompterVoiceFollow(practiceScript, scrollerRef);

  // Keep webcam overlay on the same script text (including edits).
  useEffect(() => {
    setActiveTeleprompterScript(displayScript);
  }, [displayScript, setActiveTeleprompterScript]);

  // Default scroll speed ~60s for the active script (unless user overrode).
  // Never re-apply the default while the user has chosen a custom speed — Pause
  // must not change the slider.
  useEffect(() => {
    if (speedOverriddenRef.current) return;
    setTeleprompterPixelsPerTick(
      suggestedPixelsPerTickForScript(practiceScript, fontLarge),
    );

    // Refine from real layout once the scroller has overflow.
    const id = window.requestAnimationFrame(() => {
      const el = scrollerRef.current;
      // Read the ref so a mid-flight slider change is not overwritten.
      if (!el || speedOverriddenRef.current) return;
      const distance = el.scrollHeight - el.clientHeight;
      setScrollDistancePx(Math.max(0, distance));
      if (distance <= 2) return;
      setTeleprompterPixelsPerTick(
        idealPixelsPerTickForDistance(distance, TARGET_INTRO_SECONDS),
      );
    });
    return () => window.cancelAnimationFrame(id);
  }, [
    practiceScript,
    fontLarge,
    teamMemberCount,
    source,
    // Re-run only when leaving custom mode (restore paced), not on Pause.
    speedOverridden,
    setTeleprompterPixelsPerTick,
  ]);

  // Keep estimated duration in sync with layout even after the user overrides speed.
  useEffect(() => {
    const id = window.requestAnimationFrame(() => {
      const el = scrollerRef.current;
      if (!el) return;
      setScrollDistancePx(Math.max(0, el.scrollHeight - el.clientHeight));
    });
    return () => window.cancelAnimationFrame(id);
  }, [practiceScript, fontLarge, enabled]);

  // Auto-start scroll when recording begins; allow manual scroll while preparing.
  useEffect(() => {
    if (!enabled) {
      setScrolling(false);
      return;
    }
    if (!recording) return;
    const delay = window.setTimeout(() => setScrolling(true), 800);
    return () => window.clearTimeout(delay);
  }, [recording, enabled]);

  // Timer scroll pauses while Follow My Voice is driving the scroll.
  useEffect(() => {
    if (voiceFollow.listening && scrolling) {
      setScrolling(false);
    }
  }, [voiceFollow.listening, scrolling]);

  // 3-2-1 countdown before auto-scroll (BIGVU-style start cue).
  useEffect(() => {
    if (countdown === null) return;
    if (countdown <= 0) {
      setCountdown(null);
      setElapsedSeconds(0);
      setScrolling(true);
      return;
    }
    const t = window.setTimeout(() => setCountdown((c) => (c == null ? null : c - 1)), 700);
    return () => window.clearTimeout(t);
  }, [countdown]);

  // Elapsed practice time while scrolling.
  useEffect(() => {
    if (!scrolling) return;
    const started = performance.now() - elapsedSeconds * 1000;
    const id = window.setInterval(() => {
      setElapsedSeconds(Math.max(0, (performance.now() - started) / 1000));
    }, 250);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- freeze start offset when scroll begins
  }, [scrolling]);

  // Accumulate sub-pixel scroll — browsers often truncate scrollTop fractions,
  // which made slow slider speeds appear stuck until reset to a faster default.
  // Ease near punctuation so delivery can breathe (PromptSmart-style pacing).
  useEffect(() => {
    if (!scrolling || !enabled || voiceFollow.listening) {
      scrollCarryRef.current = 0;
      return;
    }
    const id = window.setInterval(() => {
      const el = scrollerRef.current;
      if (!el) return;
      if (el.scrollHeight <= el.clientHeight + 2) return;
      const maxScroll = el.scrollHeight - el.clientHeight;
      const ease = punctuationEaseMultiplier(
        practiceScriptRef.current,
        el.scrollTop,
        maxScroll,
      );
      scrollCarryRef.current += pixelsPerTickRef.current * ease;
      const step = Math.floor(scrollCarryRef.current);
      if (step < 1) return;
      scrollCarryRef.current -= step;
      el.scrollTop += step;
      if (el.scrollTop + el.clientHeight >= el.scrollHeight - 2) {
        setScrolling(false);
      }
    }, TELEPROMPTER_TICK_MS);
    return () => window.clearInterval(id);
  }, [scrolling, enabled, voiceFollow.listening]);

  const resetScroll = () => {
    if (scrollerRef.current) scrollerRef.current.scrollTop = 0;
    setScrolling(false);
    setCountdown(null);
    setElapsedSeconds(0);
    voiceFollow.stop();
  };

  const toggleScrollWithCountdown = () => {
    voiceFollow.stop();
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
    setElapsedSeconds(0);
    setCountdown(3);
  };

  // Space = play/pause with countdown; R / Home = back to top (common prompter shortcuts).
  useEffect(() => {
    if (!enabled || recording) return;
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "TEXTAREA" ||
          target.tagName === "INPUT" ||
          target.isContentEditable)
      ) {
        return;
      }
      if (e.code === "Space") {
        e.preventDefault();
        toggleScrollWithCountdown();
      } else if (e.key === "Home" || e.key.toLowerCase() === "r") {
        e.preventDefault();
        resetScroll();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, recording, scrolling, countdown, voiceFollow.listening]);

  const useOfficial = () => {
    setSource("official");
    setScript(officialScript);
    setUploadError(null);
    setTeleprompterSpeedOverridden(false);
    resetScroll();
  };

  const useCustom = () => {
    setSource("custom");
    if (!customScript.trim()) {
      setCustomScript(officialScript);
    }
    setUploadError(null);
    resetScroll();
  };

  const onUploadScript = async (file: File | undefined) => {
    if (!file) return;
    setUploadError(null);
    if (!isScriptUploadFile(file)) {
      setUploadError("Upload a .txt or .md script file.");
      return;
    }
    if (file.size > 500_000) {
      setUploadError("Script file is too large (max 500 KB).");
      return;
    }
    try {
      const text = await file.text();
      const cleaned = text.replace(/\r\n/g, "\n").trim();
      if (!cleaned) {
        setUploadError("That file was empty.");
        return;
      }
      setCustomScript(cleaned);
      setScript(cleaned);
      setSource("custom");
      setUploadName(file.name);
      setTeleprompterSpeedOverridden(false);
      resetScroll();
    } catch {
      setUploadError("Could not read that file.");
    }
  };

  const onSpeedSlider = (value: number) => {
    setTeleprompterPixelsPerTick(clampTeleprompterSpeed(value));
    setTeleprompterSpeedOverridden(true);
  };

  const restorePacedSpeed = () => {
    setTeleprompterSpeedOverridden(false);
  };

  const paceSeconds = estimatedScrollSeconds(scrollDistancePx, pixelsPerTick);
  const speedPercent = Math.round(
    ((pixelsPerTick - TELEPROMPTER_SPEED_MIN) /
      (TELEPROMPTER_SPEED_MAX - TELEPROMPTER_SPEED_MIN)) *
      100,
  );
  const scrolledFraction =
    scrollDistancePx > 0 && scrollerRef.current
      ? Math.min(1, scrollerRef.current.scrollTop / scrollDistancePx)
      : scrolling
        ? Math.min(1, elapsedSeconds / Math.max(paceSeconds, 1))
        : 0;
  const remainingSeconds = Math.max(0, paceSeconds - elapsedSeconds);
  const liveWpm = estimateWpm(practiceScript, scrolledFraction, elapsedSeconds);

  return (
    <div
      className={clsx(
        "flex h-full min-h-[22rem] max-h-[36rem] flex-col overflow-hidden rounded-[var(--radius-md)] border border-[var(--ink)] bg-[var(--olive)] text-white",
        className,
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/20 px-4 py-3">
        <div className="flex items-center gap-2">
          <ScrollText className="h-5 w-5 text-[var(--yellow)]" aria-hidden />
          <div>
            <p className="text-[15px] font-semibold tracking-tight">
              Script Teleprompter
            </p>
            <p className="text-[12px] font-medium text-white/75">
              {enabled
                ? source === "official"
                  ? `Official · ${INTRO_SCRIPTS[teamMemberCount].title}`
                  : uploadName
                    ? `Custom · ${uploadName}`
                    : "Custom Script"
                : "Off"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <HelpTip title="Script Teleprompter">
            <p>
              Practice reading here before you record. The speed you set also
              applies to the webcam teleprompter.
            </p>
          </HelpTip>

          <button
            type="button"
            role="switch"
            aria-checked={enabled}
            aria-label={enabled ? "Turn teleprompter off" : "Turn teleprompter on"}
            onClick={() => {
              setEnabled((v) => !v);
              setScrolling(false);
            }}
            className={clsx(
              "relative inline-flex h-8 w-14 shrink-0 items-center rounded-full border transition",
              enabled
                ? "border-[var(--yellow)] bg-[var(--yellow)]"
                : "border-white/40 bg-white/15",
            )}
          >
            <span
              className={clsx(
                "absolute top-0.5 h-6 w-6 rounded-full bg-[var(--ink)] shadow transition",
                enabled ? "left-7" : "left-0.5",
              )}
            />
            <span className="sr-only">{enabled ? "On" : "Off"}</span>
          </button>
          <span className="text-[12px] font-semibold uppercase tracking-[0.1em] text-white/90">
            {enabled ? "On" : "Off"}
          </span>
        </div>
      </div>

      {!enabled ? (
        <div className="flex flex-1 items-center justify-center px-6 py-10 text-center">
          <p className="max-w-sm text-[15px] font-medium text-white/75">
            Teleprompter is off. Flip the switch to show your script.
          </p>
        </div>
      ) : (
        <>
          {!recording ? (
            <div className="space-y-3 border-b border-white/15 px-4 py-3">
              <p className="rounded-md border border-[var(--yellow)]/50 bg-black/30 px-3 py-2 text-[12px] font-medium leading-snug text-white/90">
                <strong className="text-[var(--yellow)]">Disclaimer:</strong>{" "}
                This script was built automatically from the blanks you filled
                in. You can edit it, remove parts, or replace it with your own
                script.
              </p>

              <PanelSteps
                className="rounded-md bg-black/25 px-3 py-2 text-white [&_strong]:text-[var(--yellow)]"
                steps={[
                  <>
                    Review or edit the script in the box below (or click{" "}
                    <strong>My Script</strong> / <strong>Upload .txt</strong>).
                  </>,
                  <>
                    Under Practice Here, click <strong>Play / Scroll</strong>{" "}
                    for a steady pace, or <strong>Follow My Voice</strong> so
                    it scrolls as you speak (Chrome/Edge).
                  </>,
                  <>
                    If fixed scroll feels too fast, finish the pass first, then
                    move the speed slider. Do not change speed mid-script.
                    Practice a few times before you record.
                  </>,
                ]}
              />

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={useOfficial}
                  className={clsx(
                    "rounded-[var(--radius-sm)] border px-3 py-1.5 text-[13px] font-semibold",
                    source === "official"
                      ? "border-[var(--yellow)] bg-[var(--yellow)] text-[var(--ink)]"
                      : "border-white/35 text-white hover:border-[var(--yellow)]",
                  )}
                >
                  Click Here for Official Script
                </button>
                <button
                  type="button"
                  onClick={useCustom}
                  className={clsx(
                    "rounded-[var(--radius-sm)] border px-3 py-1.5 text-[13px] font-semibold",
                    source === "custom"
                      ? "border-[var(--yellow)] bg-[var(--yellow)] text-[var(--ink)]"
                      : "border-white/35 text-white hover:border-[var(--yellow)]",
                  )}
                >
                  Click Here for My Script
                </button>
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="inline-flex items-center gap-1.5 rounded-[var(--radius-sm)] border border-white/35 px-3 py-1.5 text-[13px] font-semibold text-white hover:border-[var(--yellow)]"
                >
                  <FileUp className="h-3.5 w-3.5" />
                  Click Here to Upload .txt
                </button>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".txt,.md,.text,text/plain,text/markdown"
                  className="hidden"
                  onChange={(e) => {
                    void onUploadScript(e.target.files?.[0]);
                    e.currentTarget.value = "";
                  }}
                />
              </div>

              <p className="text-[12px] font-semibold text-[var(--yellow)]">
                Edit Script Here
              </p>
              <p className="text-[12px] font-medium text-white/70">
                You can change any wording in this box. Edits become your custom
                script.
              </p>

              <label className="block">
                <span className="sr-only">Script text</span>
                <textarea
                  value={source === "official" ? script : customScript}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (source === "official") {
                      setScript(value);
                      setCustomScript(value);
                      setSource("custom");
                      setUploadName(null);
                      setTeleprompterSpeedOverridden(false);
                    } else {
                      setCustomScript(value);
                      setTeleprompterSpeedOverridden(false);
                    }
                  }}
                  rows={5}
                  className="w-full resize-y rounded-[var(--radius-md)] border border-white/30 bg-white/10 px-3 py-2 text-[14px] font-medium leading-relaxed text-white placeholder:text-white/45 focus:border-[var(--yellow)] focus:outline-none"
                  placeholder="Type or paste your script…"
                />
              </label>

              {source === "custom" ? (
                <button
                  type="button"
                  className="text-[12px] font-semibold text-[var(--yellow)] underline"
                  onClick={useOfficial}
                >
                  Click Here for Official{" "}
                  {INTRO_SCRIPTS[teamMemberCount].title} Script
                </button>
              ) : null}

              {uploadError ? (
                <p className="text-[13px] font-semibold text-[var(--yellow)]">
                  {uploadError}
                </p>
              ) : null}
            </div>
          ) : null}

          <div className="border-b border-white/15 px-4 py-2">
            <p className="text-[15px] font-bold tracking-tight text-[var(--yellow)]">
              Practice Here
            </p>
            <p className="mt-1 text-[12px] font-medium leading-snug text-white/80">
              This is the scrolling teleprompter practice area. The column width
              and text size match the webcam teleprompter, so the speed you
              practice is the same when you record. Click{" "}
              <strong className="text-white">Play / Scroll</strong> and try to
              read at that speed out loud. If it feels too fast, finish the
              full pass, then slow the slider — do not adjust midway. Practice
              several times before you record a real video.
            </p>
            <p className="mt-1.5 text-[12px] font-medium leading-snug text-white/70">
              Scroll speed is set for about a {TARGET_INTRO_SECONDS}-second
              video. If you slow it down, your finished video will usually be
              longer than {TARGET_INTRO_SECONDS} seconds. Play starts with a
              3-2-1 countdown. Keyboard:{" "}
              <strong className="text-white">Space</strong> play/pause,{" "}
              <strong className="text-white">R</strong> or Home back to top.
              Optional: <strong className="text-white">Follow My Voice</strong>{" "}
              uses your mic (Chrome/Edge) and scrolls as you speak. Tip: spell
              out numbers in the script (&quot;sixty&quot; not &quot;60&quot;)
              for better voice matching.
            </p>
          </div>

          <div className="relative min-h-0 flex-1">
            <div
              className="pointer-events-none absolute inset-x-0 top-[28%] z-10 h-0.5 bg-[var(--yellow)]/85"
              aria-hidden
            />
            {countdown !== null && countdown > 0 ? (
              <div
                className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center bg-black/55"
                aria-live="assertive"
              >
                <span className="font-display text-7xl font-bold text-[var(--yellow)] drop-shadow-lg md:text-8xl">
                  {countdown}
                </span>
              </div>
            ) : null}
            <div
              ref={scrollerRef}
              className="h-full min-h-[12rem] overflow-y-auto px-5 py-6 text-center"
              aria-live="polite"
            >
              <div
                className={clsx(
                  "mx-auto whitespace-pre-wrap text-white",
                  TELEPROMPTER_COLUMN_CLASS,
                  fontLarge
                    ? TELEPROMPTER_TEXT_CLASS_LARGE
                    : TELEPROMPTER_TEXT_CLASS_COMPACT,
                )}
              >
                {practiceScript.trim() ||
                  "Add a script above, then click Play / Scroll to practice."}
              </div>
              <div className="h-40" aria-hidden />
            </div>
          </div>

          <div className="space-y-2 border-t border-white/20 px-3 py-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-white/70">
                Scroll Speed
              </span>
              <span className="text-[12px] font-semibold text-[var(--yellow)]">
                ~{paceSeconds}s · {speedPercent}%
                {scrolling || elapsedSeconds > 0
                  ? ` · ${formatClock(elapsedSeconds)} elapsed · ~${formatClock(remainingSeconds)} left`
                  : ""}
                {liveWpm > 0 ? ` · ~${liveWpm} wpm` : ""}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="shrink-0 text-[12px] font-semibold text-white/80">
                Slower
              </span>
              <TeleprompterSpeedSlider
                value={pixelsPerTick}
                onChange={onSpeedSlider}
                aria-label="Teleprompter scroll speed"
              />
              <span className="shrink-0 text-[12px] font-semibold text-white/80">
                Faster
              </span>
            </div>
            <p className="text-[11px] font-medium text-white/65">
              {speedOverridden
                ? "Custom speed — drag the slider after a full practice pass."
                : `Auto-paced for about ${TARGET_INTRO_SECONDS} seconds.`}
              {speedOverridden ? (
                <>
                  {" "}
                  <button
                    type="button"
                    onClick={restorePacedSpeed}
                    className="font-semibold text-[var(--yellow)] underline"
                  >
                    Click Here to Reset to ~{TARGET_INTRO_SECONDS}s Pace
                  </button>
                </>
              ) : null}
            </p>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={toggleScrollWithCountdown}
                className="inline-flex items-center gap-1 rounded-[var(--radius-sm)] border border-[var(--yellow)] bg-[var(--yellow)] px-3 py-1.5 text-[13px] font-semibold text-[var(--ink)]"
              >
                {scrolling || countdown !== null ? (
                  <>
                    <Pause className="h-3.5 w-3.5" /> Click Here to Pause
                  </>
                ) : (
                  <>
                    <Play className="h-3.5 w-3.5 fill-current" /> Click Here to
                    Play / Scroll
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  setScrolling(false);
                  voiceFollow.toggle();
                }}
                className={clsx(
                  "inline-flex items-center gap-1 rounded-[var(--radius-sm)] border px-3 py-1.5 text-[13px] font-semibold",
                  voiceFollow.listening
                    ? "border-[var(--yellow)] bg-[var(--yellow)] text-[var(--ink)]"
                    : "border-white/40 text-white",
                )}
                title={
                  voiceFollow.supported
                    ? "Scroll as you speak (Chrome/Edge)"
                    : "Needs Chrome or Edge speech recognition"
                }
              >
                {voiceFollow.listening
                  ? "Click Here to Stop Voice Follow"
                  : "Click Here to Follow My Voice"}
              </button>
              <button
                type="button"
                onClick={resetScroll}
                className="inline-flex items-center gap-1 rounded-[var(--radius-sm)] border border-white/40 px-3 py-1.5 text-[13px] font-semibold text-white"
              >
                <RotateCcw className="h-3.5 w-3.5" /> Click Here for Top
              </button>
              <button
                type="button"
                onClick={() => setFontLarge(!fontLarge)}
                className="ml-auto rounded-[var(--radius-sm)] border border-white/35 px-2.5 py-1.5 text-[12px] font-semibold text-white"
              >
                {fontLarge
                  ? "Click Here for Smaller Text"
                  : "Click Here for Bigger Text"}
              </button>
            </div>
            {voiceFollow.status ? (
              <p className="text-[11px] font-medium text-[var(--yellow)]">
                {voiceFollow.status}
                {voiceFollow.listening && voiceFollow.totalWords > 0
                  ? ` · ${voiceFollow.matchedWords}/${voiceFollow.totalWords} words`
                  : ""}
              </p>
            ) : null}
          </div>
        </>
      )}
    </div>
  );
}
