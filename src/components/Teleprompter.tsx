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
import { useStudio } from "@/lib/studio-context";
import { clsx } from "clsx";

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
  const [fontLarge, setFontLarge] = useState(true);
  const [scrollDistancePx, setScrollDistancePx] = useState(0);

  speedOverriddenRef.current = speedOverridden;
  pixelsPerTickRef.current = pixelsPerTick;

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

  // Default scroll speed ~60s for the active script (unless user overrode).
  // Never re-apply the default while the user has chosen a custom speed — Pause
  // must not change the slider.
  useEffect(() => {
    if (speedOverriddenRef.current) return;
    setTeleprompterPixelsPerTick(
      suggestedPixelsPerTickForScript(displayScript, fontLarge),
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
    displayScript,
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
  }, [displayScript, fontLarge, enabled]);

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

  // Accumulate sub-pixel scroll — browsers often truncate scrollTop fractions,
  // which made slow slider speeds appear stuck until reset to a faster default.
  useEffect(() => {
    if (!scrolling || !enabled) {
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
  }, [scrolling, enabled]);

  const resetScroll = () => {
    if (scrollerRef.current) scrollerRef.current.scrollTop = 0;
    setScrolling(false);
  };

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
                    Click <strong>Play / Scroll</strong> under Practice Here
                    and read out loud at that speed.
                  </>,
                  <>
                    If it feels too fast, finish the pass first, then move the
                    speed slider. Do not change speed mid-script. Practice a few
                    times before you record.
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
              This is the scrolling teleprompter practice area. Click{" "}
              <strong className="text-white">Play / Scroll</strong> and try to
              read at that speed out loud. If it feels too fast, finish the
              full pass, then slow the slider — do not adjust midway. Practice
              several times before you record a real video.
            </p>
            <p className="mt-1.5 text-[12px] font-medium leading-snug text-white/70">
              Scroll speed is set for about a {TARGET_INTRO_SECONDS}-second
              video. If you slow it down, your finished video will usually be
              longer than {TARGET_INTRO_SECONDS} seconds.
            </p>
          </div>

          <div
            ref={scrollerRef}
            className={clsx(
              "min-h-0 flex-1 overflow-y-auto px-5 py-6 text-center leading-snug",
              fontLarge ? "text-2xl md:text-3xl" : "text-xl md:text-2xl",
            )}
            aria-live="polite"
          >
            <div className="mx-auto max-w-[28ch] whitespace-pre-wrap font-semibold tracking-wide">
              {displayScript.trim() ||
                "Add a script above, then click Play / Scroll to practice."}
            </div>
            <div className="h-40" aria-hidden />
          </div>

          <div className="space-y-2 border-t border-white/20 px-3 py-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-white/70">
                Scroll Speed
              </span>
              <span className="text-[12px] font-semibold text-[var(--yellow)]">
                ~{paceSeconds}s · {speedPercent}%
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
                onClick={() => setScrolling((v) => !v)}
                className="inline-flex items-center gap-1 rounded-[var(--radius-sm)] border border-[var(--yellow)] bg-[var(--yellow)] px-3 py-1.5 text-[13px] font-semibold text-[var(--ink)]"
              >
                {scrolling ? (
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
                onClick={resetScroll}
                className="inline-flex items-center gap-1 rounded-[var(--radius-sm)] border border-white/40 px-3 py-1.5 text-[13px] font-semibold text-white"
              >
                <RotateCcw className="h-3.5 w-3.5" /> Click Here for Top
              </button>
              <button
                type="button"
                onClick={() => setFontLarge((v) => !v)}
                className="ml-auto rounded-[var(--radius-sm)] border border-white/35 px-2.5 py-1.5 text-[12px] font-semibold text-white"
              >
                {fontLarge
                  ? "Click Here for Smaller Text"
                  : "Click Here for Bigger Text"}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
