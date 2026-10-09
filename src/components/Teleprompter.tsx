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
  TELEPROMPTER_SPEEDS,
  idealPixelsPerTickForDistance,
  isScriptUploadFile,
  nearestSpeedForPixelsPerTick,
  pixelsPerTickForSpeed,
  scriptForTeam,
  suggestedSpeedForScript,
  type TeleprompterSpeedId,
} from "@/lib/intro-script";
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
  const { teamMemberCount, photos, customerName, speakerName } = useStudio();
  const scrollerRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const rosterKey = photos
    .map((p) => `${p.name}\0${p.title}\0${p.pronoun}\0${p.duties}`)
    .join("|");
  const rosterPeople = photos.map((p) => ({
    name: p.name,
    title: p.title,
    pronoun: p.pronoun,
    duties: p.duties,
  }));
  const officialScript = scriptForTeam(teamMemberCount, {
    customerName,
    speakerName,
    people: rosterPeople,
  });

  const [enabled, setEnabled] = useState(true);
  const [source, setSource] = useState<ScriptSource>("official");
  const [script, setScript] = useState(() => officialScript);
  const [customScript, setCustomScript] = useState("");
  const [uploadName, setUploadName] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [speedId, setSpeedId] = useState<TeleprompterSpeedId>(() =>
    suggestedSpeedForScript(officialScript),
  );
  const [speedOverridden, setSpeedOverridden] = useState(false);
  const [scrolling, setScrolling] = useState(false);
  const [fontLarge, setFontLarge] = useState(true);

  // Official script tracks team size and roster names/titles.
  useEffect(() => {
    if (source !== "official") return;
    setScript(officialScript);
    if (scrollerRef.current) scrollerRef.current.scrollTop = 0;
  }, [teamMemberCount, source, rosterKey, customerName, speakerName, officialScript]);

  const displayScript =
    source === "official" ? script : customScript.trim() || script;

  // Default scroll speed ~60s for the active script (unless user overrode).
  useEffect(() => {
    if (speedOverridden) return;
    const suggested = suggestedSpeedForScript(displayScript, fontLarge);
    setSpeedId(suggested);

    // Refine from real layout once the scroller has overflow.
    const id = window.requestAnimationFrame(() => {
      const el = scrollerRef.current;
      if (!el || speedOverridden) return;
      const distance = el.scrollHeight - el.clientHeight;
      if (distance <= 2) return;
      setSpeedId(
        nearestSpeedForPixelsPerTick(
          idealPixelsPerTickForDistance(distance, TARGET_INTRO_SECONDS),
        ),
      );
    });
    return () => window.cancelAnimationFrame(id);
  }, [displayScript, fontLarge, teamMemberCount, source, speedOverridden]);

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

  useEffect(() => {
    if (!scrolling || !enabled) return;
    const speed = pixelsPerTickForSpeed(speedId);
    const id = window.setInterval(() => {
      const el = scrollerRef.current;
      if (!el) return;
      if (el.scrollHeight <= el.clientHeight + 2) return;
      el.scrollTop += speed;
      if (el.scrollTop + el.clientHeight >= el.scrollHeight - 2) {
        setScrolling(false);
      }
    }, 40);
    return () => window.clearInterval(id);
  }, [scrolling, speedId, enabled]);

  const resetScroll = () => {
    if (scrollerRef.current) scrollerRef.current.scrollTop = 0;
    setScrolling(false);
  };

  const useOfficial = () => {
    setSource("official");
    setScript(officialScript);
    setUploadError(null);
    setSpeedOverridden(false);
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
      setSpeedOverridden(false);
      resetScroll();
    } catch {
      setUploadError("Could not read that file.");
    }
  };

  const selectSpeed = (id: TeleprompterSpeedId) => {
    setSpeedId(id);
    setSpeedOverridden(true);
  };

  const restorePacedSpeed = () => {
    setSpeedOverridden(false);
  };

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
              Teleprompter
            </p>
            <p className="text-[12px] font-medium text-white/75">
              {enabled
                ? source === "official"
                  ? `Official · ${INTRO_SCRIPTS[teamMemberCount].title}`
                  : uploadName
                    ? `Custom · ${uploadName}`
                    : "Custom script"
                : "Off"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <HelpTip title="Teleprompter">
            <p>
              <strong>On/Off</strong> shows or hides the scrolling script.
            </p>
            <p>
              Use the <strong>official</strong> Fleet Hub script for your team
              size — names, pronouns, titles, and duties from above are filled
              in — or{" "}
              <strong>upload / paste</strong> your own.
            </p>
            <p>
              Default <strong>scroll speed</strong> is paced for about{" "}
              {TARGET_INTRO_SECONDS} seconds for your script — change it anytime.
            </p>
            <p>
              Phone on a tripod? Leave this panel on your computer screen behind
              the phone and tap Scroll when you start talking.
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
            Teleprompter is off. Flip the switch to show your script while
            recording.
          </p>
        </div>
      ) : (
        <>
          {!recording ? (
            <div className="space-y-3 border-b border-white/15 px-4 py-3">
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
                  Official script
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
                  My script
                </button>
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="inline-flex items-center gap-1.5 rounded-[var(--radius-sm)] border border-white/35 px-3 py-1.5 text-[13px] font-semibold text-white hover:border-[var(--yellow)]"
                >
                  <FileUp className="h-3.5 w-3.5" />
                  Upload .txt
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

              {source === "official" ? (
                <p className="text-[12px] font-medium text-white/70">
                  Matches your team size ({INTRO_SCRIPTS[teamMemberCount].title}
                  ) with names from your roster. Edit the text if needed — that
                  switches to My script.
                </p>
              ) : (
                <p className="text-[12px] font-medium text-white/70">
                  Paste below or upload a .txt / .md file.
                  {uploadName ? ` Loaded: ${uploadName}` : ""}
                </p>
              )}

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
                      setSpeedOverridden(false);
                    } else {
                      setCustomScript(value);
                      setSpeedOverridden(false);
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
                  Back to official {INTRO_SCRIPTS[teamMemberCount].title} script
                </button>
              ) : null}

              {uploadError ? (
                <p className="text-[13px] font-semibold text-[var(--yellow)]">
                  {uploadError}
                </p>
              ) : null}
            </div>
          ) : null}

          <div
            ref={scrollerRef}
            className={clsx(
              "min-h-0 flex-1 overflow-y-auto px-5 py-6 text-center leading-snug",
              fontLarge ? "text-2xl md:text-3xl" : "text-xl md:text-2xl",
            )}
            aria-live="polite"
          >
            <div className="mx-auto max-w-xl whitespace-pre-wrap font-semibold tracking-wide">
              {displayScript.trim() ||
                "Add a script above, then start recording."}
            </div>
            <div className="h-40" aria-hidden />
          </div>

          <div className="space-y-2 border-t border-white/20 px-3 py-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-white/70">
                Scroll speed
              </span>
              <div className="flex flex-wrap gap-1">
                {TELEPROMPTER_SPEEDS.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => selectSpeed(s.id)}
                    className={clsx(
                      "rounded-[var(--radius-sm)] border px-2.5 py-1 text-[12px] font-semibold",
                      speedId === s.id
                        ? "border-[var(--yellow)] bg-[var(--yellow)] text-[var(--ink)]"
                        : "border-white/35 text-white",
                    )}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
            <p className="text-[11px] font-medium text-white/65">
              {speedOverridden
                ? "Custom speed — you chose this."
                : `Default paced for ~${TARGET_INTRO_SECONDS}s with this script.`}
              {speedOverridden ? (
                <>
                  {" "}
                  <button
                    type="button"
                    onClick={restorePacedSpeed}
                    className="font-semibold text-[var(--yellow)] underline"
                  >
                    Use ~{TARGET_INTRO_SECONDS}s pace
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
                    <Pause className="h-3.5 w-3.5" /> Pause
                  </>
                ) : (
                  <>
                    <Play className="h-3.5 w-3.5 fill-current" /> Scroll
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={resetScroll}
                className="inline-flex items-center gap-1 rounded-[var(--radius-sm)] border border-white/40 px-3 py-1.5 text-[13px] font-semibold text-white"
              >
                <RotateCcw className="h-3.5 w-3.5" /> Top
              </button>
              <button
                type="button"
                onClick={() => setFontLarge((v) => !v)}
                className="ml-auto rounded-[var(--radius-sm)] border border-white/35 px-2.5 py-1.5 text-[12px] font-semibold text-white"
              >
                {fontLarge ? "Smaller text" : "Bigger text"}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
