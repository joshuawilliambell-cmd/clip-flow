"use client";

import { useEffect, useRef, useState } from "react";
import { FileUp, ScrollText } from "lucide-react";
import { ControlTip } from "@/components/ControlTip";
import { HelpTip } from "@/components/HelpTip";
import { TeleprompterControlBar } from "@/components/TeleprompterControlBar";
import { TeleprompterHighlightedScript } from "@/components/TeleprompterHighlightedScript";
import {
  INTRO_SCRIPTS,
  isScriptUploadFile,
  scriptForTeam,
} from "@/lib/intro-script";
import { PanelSteps } from "@/components/PanelStep";
import { useMicLevel } from "@/hooks/useMicLevel";
import { useTeleprompterVoiceFollow } from "@/hooks/useTeleprompterVoiceFollow";
import { formatScriptForNaturalReading } from "@/lib/teleprompter-layout";
import { useStudio } from "@/lib/studio-context";
import { clsx } from "clsx";

type ScriptSource = "official" | "custom";

type TeleprompterProps = {
  /** Kept for callers; recording uses the webcam overlay instead. */
  recording?: boolean;
  className?: string;
};

/**
 * Practice teleprompter — Follow My Voice only (matches webcam overlay).
 */
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
    setActiveTeleprompterScript,
    teleprompterFontLarge: fontLarge,
    setTeleprompterFontLarge: setFontLarge,
    teleprompterLineRoomy: lineRoomy,
    setTeleprompterLineRoomy: setLineRoomy,
  } = useStudio();
  const scrollerRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

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

  const [source, setSource] = useState<ScriptSource>("official");
  const [script, setScript] = useState(() => officialScript);
  const [customScript, setCustomScript] = useState("");
  const [uploadName, setUploadName] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  useEffect(() => {
    if (source !== "official") return;
    setScript(officialScript);
    if (scrollerRef.current) scrollerRef.current.scrollTop = 0;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- keyed by roster/speaker content
  }, [teamMemberCount, source, rosterKey, speakerKey, customerName]);

  const displayScript =
    source === "official" ? script : customScript.trim() || script;
  const practiceScript = formatScriptForNaturalReading(displayScript);

  const voiceFollow = useTeleprompterVoiceFollow(practiceScript, scrollerRef);
  const micLevel = useMicLevel(voiceFollow.listening);
  const highlightThrough = voiceFollow.listening ? voiceFollow.matchedWords : 0;

  useEffect(() => {
    setActiveTeleprompterScript(displayScript);
  }, [displayScript, setActiveTeleprompterScript]);

  const resetScroll = () => {
    if (scrollerRef.current) scrollerRef.current.scrollTop = 0;
    voiceFollow.stop();
  };

  useEffect(() => {
    if (recording) return;
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
      if (e.key === "Home" || e.key.toLowerCase() === "r") {
        e.preventDefault();
        resetScroll();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recording, voiceFollow.listening]);

  const useOfficial = () => {
    setSource("official");
    setScript(officialScript);
    setUploadError(null);
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
      resetScroll();
    } catch {
      setUploadError("Could not read that file.");
    }
  };

  return (
    <div
      className={clsx(
        "flex flex-col rounded-[var(--radius-md)] border border-[var(--ink)] bg-white text-[var(--ink)]",
        className,
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] bg-[var(--panel-soft)] px-4 py-3">
        <div className="flex items-center gap-2">
          <ScrollText className="h-5 w-5 text-[var(--primary)]" aria-hidden />
          <div>
            <p className="text-[15px] font-semibold tracking-tight text-[var(--ink)]">
              Script Teleprompter
            </p>
            <p className="text-[12px] font-medium text-[var(--muted)]">
              {source === "official"
                ? `Official · ${INTRO_SCRIPTS[teamMemberCount].title}`
                : uploadName
                  ? `Custom · ${uploadName}`
                  : "Custom Script"}
              {" · "}
              Same controls as the webcam teleprompter
            </p>
          </div>
        </div>
        <HelpTip title="Script Teleprompter">
          <p>
            <strong>Follow My Voice</strong> listens while you read. As you say
            each line out loud, the script scrolls for you — you do not need to
            chase moving text.
          </p>
          <p>
            Practice here first, then use the same button when you record with
            the webcam (recommended).
          </p>
        </HelpTip>
      </div>

      <div className="border-b border-[var(--border)] px-4 py-3">
        <p className="text-[15px] font-bold tracking-tight text-[var(--ink)]">
          Practice Here
        </p>
        <div className="mt-2 space-y-1.5 rounded-md border border-[var(--ink)] bg-[var(--panel-soft)] px-3 py-2.5 text-[12px] font-medium leading-snug text-[var(--ink)]">
          <p className="font-bold text-[var(--ink)]">
            What Follow My Voice does
          </p>
          <p className="text-[var(--muted)]">
            Your computer listens to you. As you read the script out loud, it
            moves the words down the screen for you — like a TV teleprompter
            that keeps up with your voice. You talk; it scrolls.
          </p>
          <p className="font-bold text-[var(--ink)]">How to use it</p>
          <ol className="list-decimal space-y-0.5 pl-4 text-[var(--muted)]">
            <li>
              Click <strong className="text-[var(--ink)]">Follow My Voice</strong>{" "}
              below and choose <strong className="text-[var(--ink)]">Allow</strong> for
              the microphone.
            </li>
            <li>
              Read the line at the yellow guide out loud, at a normal speaking
              pace.
            </li>
            <li>
              Watch the words highlight and the script move as it hears you.
              Keep reading until you finish.
            </li>
            <li>
              When you feel ready, go to{" "}
              <strong className="text-[var(--ink)]">Record With Camera</strong> and use
              Follow My Voice the same way for your real take.
            </li>
          </ol>
        </div>
      </div>

      <div className="relative mx-auto w-full max-w-[min(100%,36rem)] px-3 pt-3">
        {/* Reading window stays dark so the script is easy to follow. */}
        <div className="relative h-52 overflow-hidden rounded-xl border-2 border-[var(--ink)] bg-[#141414] shadow-sm md:h-60">
          <div
            className="pointer-events-none absolute inset-x-2 top-[26%] z-20 h-0.5 bg-[var(--yellow)]/85"
            aria-hidden
          />
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

      <TeleprompterControlBar
        tone="light"
        onReset={resetScroll}
        voiceFollow={{
          listening: voiceFollow.listening,
          supported: voiceFollow.supported,
          onToggle: () => voiceFollow.toggle(),
        }}
        extras={
          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-center gap-2">
              <ControlTip tip="Adds more space between lines so your eyes can move down the page more easily.">
                <button
                  type="button"
                  onClick={() => setLineRoomy(!lineRoomy)}
                  className="rounded-full border border-[var(--ink)] bg-white px-3 py-1.5 text-[12px] font-bold text-[var(--ink)] hover:bg-[var(--yellow)]"
                >
                  {lineRoomy
                    ? "Click Here for Tighter Lines"
                    : "Click Here for Roomy Lines"}
                </button>
              </ControlTip>
              <ControlTip tip="Makes the words larger or smaller. Pick what is easiest to read on your screen.">
                <button
                  type="button"
                  onClick={() => setFontLarge(!fontLarge)}
                  className="rounded-full border border-[var(--ink)] bg-white px-3 py-1.5 text-[12px] font-bold text-[var(--ink)] hover:bg-[var(--yellow)]"
                >
                  {fontLarge
                    ? "Click Here for Smaller Text"
                    : "Click Here for Bigger Text"}
                </button>
              </ControlTip>
            </div>
            {voiceFollow.listening ? (
              <div className="flex items-center gap-2 px-1">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-[var(--muted)]">
                  Mic
                </span>
                <div
                  className="h-2 flex-1 overflow-hidden rounded-full bg-[var(--ink)]/10"
                  role="meter"
                  aria-label="Microphone level"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={Math.round(micLevel * 100)}
                >
                  <div
                    className="h-full rounded-full bg-[var(--primary)] transition-[width] duration-75"
                    style={{ width: `${Math.round(micLevel * 100)}%` }}
                  />
                </div>
              </div>
            ) : null}
            {voiceFollow.status ? (
              <p className="text-center text-[11px] font-medium text-[var(--ink)]">
                {voiceFollow.status}
                {voiceFollow.listening && voiceFollow.totalWords > 0
                  ? ` · ${voiceFollow.matchedWords}/${voiceFollow.totalWords} words`
                  : ""}
              </p>
            ) : (
              <p className="text-center text-[11px] font-medium text-[var(--muted)]">
                Click Follow My Voice, allow the mic, then read out loud — the
                script will follow you.
              </p>
            )}
          </div>
        }
      />

      {!recording ? (
        <div className="space-y-3 border-t border-[var(--border)] px-4 py-3">
          <p className="rounded-md border border-[var(--ink)] bg-[var(--panel-soft)] px-3 py-2 text-[12px] font-medium leading-snug text-[var(--ink)]">
            <strong>Disclaimer:</strong> This script was built automatically
            from the blanks you filled in. You can edit it, remove parts, or
            replace it with your own script.
          </p>

          <PanelSteps
            tone="light"
            className="rounded-md border border-[var(--hairline)] bg-[var(--panel-soft)] px-3 py-2"
            steps={[
              <>
                Practice with <strong>Follow My Voice</strong> until the script
                feels natural (Chrome or Edge works best).
              </>,
              <>
                Then record with <strong>Record With Camera</strong> below
                (computer webcam or phone) — same Follow My Voice button.
              </>,
              <>
                Edit the script below anytime if you want different wording.
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
                  ? "border-[var(--ink)] bg-[var(--yellow)] text-[var(--ink)]"
                  : "border-[var(--ink)] bg-white text-[var(--ink)] hover:bg-[var(--panel-soft)]",
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
                  ? "border-[var(--ink)] bg-[var(--yellow)] text-[var(--ink)]"
                  : "border-[var(--ink)] bg-white text-[var(--ink)] hover:bg-[var(--panel-soft)]",
              )}
            >
              Click Here for My Script
            </button>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="inline-flex items-center gap-1.5 rounded-full border border-[var(--ink)] bg-white px-3 py-1.5 text-[12px] font-bold text-[var(--ink)] hover:bg-[var(--panel-soft)]"
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

          <p className="text-[12px] font-semibold text-[var(--ink)]">
            Edit Script Here
          </p>
          <p className="text-[12px] font-medium text-[var(--muted)]">
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
                } else {
                  setCustomScript(value);
                }
              }}
              rows={4}
              className="field-input min-h-[6rem] resize-y"
              placeholder="Type or paste your script…"
            />
          </label>

          {source === "custom" ? (
            <button
              type="button"
              className="text-[12px] font-semibold text-[var(--primary)] underline"
              onClick={useOfficial}
            >
              Click Here for Official {INTRO_SCRIPTS[teamMemberCount].title}{" "}
              Script
            </button>
          ) : null}

          {uploadError ? (
            <p className="text-[13px] font-semibold text-[var(--primary-dark)]">
              {uploadError}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
