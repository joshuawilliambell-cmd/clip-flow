"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { FileUp, ScrollText } from "lucide-react";
import { HelpTip } from "@/components/HelpTip";
import { TeleprompterControlBar } from "@/components/TeleprompterControlBar";
import { TeleprompterHighlightedScript } from "@/components/TeleprompterHighlightedScript";
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
import { PanelSteps } from "@/components/PanelStep";
import { useMicLevel } from "@/hooks/useMicLevel";
import { useTeleprompterVoiceFollow } from "@/hooks/useTeleprompterVoiceFollow";
import { formatScriptForNaturalReading, scriptWords } from "@/lib/teleprompter-layout";
import {
  estimateWpm,
  punctuationEaseMultiplier,
} from "@/lib/teleprompter-pace";
import {
  findScriptCues,
  wordIndexToScrollFraction,
} from "@/lib/teleprompter-script-view";
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
    teleprompterLineRoomy: lineRoomy,
    setTeleprompterLineRoomy: setLineRoomy,
  } = useStudio();
  const scrollerRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const speedOverriddenRef = useRef(false);
  const pixelsPerTickRef = useRef(0);
  const scrollCarryRef = useRef(0);
  const loopPracticeRef = useRef(false);

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
  const [loopPractice, setLoopPractice] = useState(false);
  const [scrollHighlight, setScrollHighlight] = useState(0);

  speedOverriddenRef.current = speedOverridden;
  pixelsPerTickRef.current = pixelsPerTick;
  loopPracticeRef.current = loopPractice;
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
  const micLevel = useMicLevel(voiceFollow.listening);
  const totalPracticeWords = scriptWords(practiceScript).length;
  const highlightThrough = voiceFollow.listening
    ? voiceFollow.matchedWords
    : scrollHighlight;

  const cues = useMemo(
    () =>
      findScriptCues(
        practiceScript,
        photos.map((p) => p.name).filter((n) => n.trim().length >= 2),
      ),
    [practiceScript, photos],
  );

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
      const words = scriptWords(practiceScriptRef.current).length;
      if (words > 0 && maxScroll > 0) {
        setScrollHighlight(
          Math.round((el.scrollTop / maxScroll) * words),
        );
      }
      if (el.scrollTop + el.clientHeight >= el.scrollHeight - 2) {
        if (loopPracticeRef.current) {
          el.scrollTop = 0;
          scrollCarryRef.current = 0;
          setScrollHighlight(0);
          setElapsedSeconds(0);
        } else {
          setScrolling(false);
        }
      }
    }, TELEPROMPTER_TICK_MS);
    return () => window.clearInterval(id);
  }, [scrolling, enabled, voiceFollow.listening]);

  const resetScroll = () => {
    if (scrollerRef.current) scrollerRef.current.scrollTop = 0;
    setScrolling(false);
    setCountdown(null);
    setElapsedSeconds(0);
    setScrollHighlight(0);
    voiceFollow.stop();
  };

  const jumpToCue = (wordIndex: number) => {
    const el = scrollerRef.current;
    if (!el) return;
    const maxScroll = el.scrollHeight - el.clientHeight;
    const fraction = wordIndexToScrollFraction(wordIndex, totalPracticeWords);
    el.scrollTop = fraction * Math.max(0, maxScroll);
    setScrollHighlight(wordIndex);
    setScrolling(false);
    setCountdown(null);
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
        "flex flex-col rounded-[var(--radius-md)] border border-[var(--ink)] bg-[var(--olive)] text-white",
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
              {" · "}
              Same controls as the webcam teleprompter
            </p>
          </div>
        </div>
        <HelpTip title="Script Teleprompter">
          <p>
            Practice Here uses the same Play / Scroll, Top, Speed, and On/Off
            controls as when you record with the webcam — so your practice pace
            matches the real take.
          </p>
        </HelpTip>
      </div>

      {!enabled ? (
        <div className="px-6 py-10 text-center">
          <p className="mb-4 text-[15px] font-medium text-white/75">
            Teleprompter is off. Turn it on with the control below to practice.
          </p>
          <TeleprompterControlBar
            enabled={false}
            onToggleEnabled={() => setEnabled(true)}
            scrolling={false}
            countdownActive={false}
            onToggleScroll={() => undefined}
            onReset={() => undefined}
            pixelsPerTick={pixelsPerTick}
            onSpeedChange={onSpeedSlider}
          />
        </div>
      ) : (
        <>
          {/* Practice stage first — fixed reading window + always-visible controls */}
          <div className="border-b border-white/15 px-4 py-3">
            <p className="text-[15px] font-bold tracking-tight text-[var(--yellow)]">
              Practice Here
            </p>
            <p className="mt-1 text-[12px] font-medium leading-snug text-white/80">
              Same width, speed, and controls as the webcam teleprompter. Click{" "}
              <strong className="text-white">Play / Scroll</strong> (3-2-1
              countdown), read out loud, then adjust Speed only after a full
              pass. Keyboard: Space play/pause · R / Home for top.
            </p>
            <p className="mt-1 text-[12px] font-semibold text-[var(--yellow)]">
              ~{paceSeconds}s · {speedPercent}%
              {scrolling || elapsedSeconds > 0
                ? ` · ${formatClock(elapsedSeconds)} elapsed · ~${formatClock(remainingSeconds)} left`
                : ""}
              {liveWpm > 0 ? ` · ~${liveWpm} wpm` : ""}
              {speedOverridden
                ? " · custom speed"
                : ` · auto-paced ~${TARGET_INTRO_SECONDS}s`}
              {speedOverridden ? (
                <>
                  {" "}
                  <button
                    type="button"
                    onClick={restorePacedSpeed}
                    className="underline"
                  >
                    Reset Pace
                  </button>
                </>
              ) : null}
            </p>
          </div>

          <div className="relative mx-auto w-full max-w-[min(100%,36rem)] px-3 pt-2">
            <div className="relative h-52 overflow-hidden rounded-xl border border-white/30 bg-black/50 shadow-[0_8px_28px_rgba(0,0,0,0.4)] md:h-60">
              <div
                className="pointer-events-none absolute inset-x-2 top-[26%] z-20 h-0.5 bg-[var(--yellow)]/85"
                aria-hidden
              />
              {countdown !== null && countdown > 0 ? (
                <div
                  className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center bg-black/55"
                  aria-live="assertive"
                >
                  <span className="font-display text-6xl font-bold text-[var(--yellow)] md:text-7xl">
                    {countdown}
                  </span>
                </div>
              ) : null}
              <div
                ref={scrollerRef}
                className="h-full overflow-y-auto px-3 pb-16 pt-3 text-center scrollbar-none"
                style={{ scrollbarWidth: "none" }}
                aria-live="polite"
              >
                <TeleprompterHighlightedScript
                  script={practiceScript}
                  highlightThrough={highlightThrough}
                  fontLarge={fontLarge}
                  roomyLines={lineRoomy}
                />
                <div className="h-24" aria-hidden />
              </div>
            </div>
          </div>

          {cues.length > 1 ? (
            <div className="flex flex-wrap gap-1.5 px-3 pt-2">
              <span className="w-full text-[10px] font-semibold uppercase tracking-wide text-white/60">
                Jump To Cue
              </span>
              {cues.map((cue) => (
                <button
                  key={`${cue.label}-${cue.wordIndex}`}
                  type="button"
                  onClick={() => jumpToCue(cue.wordIndex)}
                  className="rounded-md border border-white/30 bg-black/30 px-2 py-1 text-[11px] font-semibold text-white hover:border-[var(--yellow)]"
                >
                  Click Here · {cue.label}
                </button>
              ))}
            </div>
          ) : null}

          <TeleprompterControlBar
            enabled={enabled}
            onToggleEnabled={() => {
              setEnabled((v) => !v);
              setScrolling(false);
              voiceFollow.stop();
            }}
            scrolling={scrolling}
            countdownActive={countdown !== null}
            onToggleScroll={toggleScrollWithCountdown}
            onReset={resetScroll}
            pixelsPerTick={pixelsPerTick}
            onSpeedChange={onSpeedSlider}
            extras={
              <div className="space-y-2">
                <div className="flex flex-wrap items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setScrolling(false);
                      voiceFollow.toggle();
                    }}
                    className={clsx(
                      "rounded-full border px-3 py-1.5 text-[12px] font-bold",
                      voiceFollow.listening
                        ? "border-[var(--yellow)] bg-[var(--yellow)] text-[var(--ink)]"
                        : "border-white/40 bg-black/50 text-white",
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
                    onClick={() => setLoopPractice((v) => !v)}
                    className={clsx(
                      "rounded-full border px-3 py-1.5 text-[12px] font-bold",
                      loopPractice
                        ? "border-[var(--yellow)] bg-[var(--yellow)] text-[var(--ink)]"
                        : "border-white/40 bg-black/50 text-white",
                    )}
                  >
                    {loopPractice
                      ? "Click Here — Loop On"
                      : "Click Here — Loop Off"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setLineRoomy(!lineRoomy)}
                    className="rounded-full border border-white/40 bg-black/50 px-3 py-1.5 text-[12px] font-bold text-white"
                  >
                    {lineRoomy
                      ? "Click Here for Tighter Lines"
                      : "Click Here for Roomy Lines"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setFontLarge(!fontLarge)}
                    className="rounded-full border border-white/40 bg-black/50 px-3 py-1.5 text-[12px] font-bold text-white"
                  >
                    {fontLarge
                      ? "Click Here for Smaller Text"
                      : "Click Here for Bigger Text"}
                  </button>
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

          {/* Script editing below practice — does not hide the controls */}
          {!recording ? (
            <div className="space-y-3 border-t border-white/15 px-4 py-3">
              <p className="rounded-md border border-[var(--yellow)]/50 bg-black/30 px-3 py-2 text-[12px] font-medium leading-snug text-white/90">
                <strong className="text-[var(--yellow)]">Disclaimer:</strong>{" "}
                This script was built automatically from the blanks you filled
                in. You can edit it, remove parts, or replace it with your own
                script.
              </p>

              <PanelSteps
                tone="dark"
                className="rounded-md bg-black/25 px-3 py-2 [&_strong]:text-[var(--yellow)]"
                steps={[
                  <>
                    Use the <strong>Play / Scroll</strong>, <strong>Top</strong>,
                    and <strong>Speed</strong> controls above (same as webcam).
                  </>,
                  <>
                    Optional: edit the script below, or click{" "}
                    <strong>Follow My Voice</strong> (Chrome/Edge).
                  </>,
                  <>
                    Practice a few full passes before you record. Do not change
                    speed mid-script.
                  </>,
                ]}
              />

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={useOfficial}
                  className={clsx(
                    "rounded-full border px-3 py-1.5 text-[12px] font-bold",
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
                    "rounded-full border px-3 py-1.5 text-[12px] font-bold",
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
                  className="inline-flex items-center gap-1.5 rounded-full border border-white/35 px-3 py-1.5 text-[12px] font-bold text-white hover:border-[var(--yellow)]"
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
                script and also show on the webcam teleprompter.
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
                  rows={4}
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
        </>
      )}
    </div>
  );
}
