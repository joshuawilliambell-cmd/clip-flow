"use client";

import { useRef, useState } from "react";
import { Film, FolderOpen, Upload } from "lucide-react";
import { useStudio } from "@/lib/studio-context";
import { HelpTip } from "@/components/HelpTip";
import { RecordingGuide } from "@/components/RecordingGuide";
import { TeamSizePicker } from "@/components/TeamSizePicker";
import { TeamRosterFields } from "@/components/TeamRosterFields";
import { ThumbnailCreator } from "@/components/ThumbnailCreator";
import { ScriptFillIns } from "@/components/ScriptFillIns";
import { WebcamRecorder } from "@/components/WebcamRecorder";
import { Teleprompter } from "@/components/Teleprompter";
import { PanelSteps } from "@/components/PanelStep";

export function VideoUploadStep() {
  const {
    video,
    setVideoFromFile,
    clearVideo,
    setStep,
    teamMemberCount,
  } = useStudio();
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  const handleFiles = async (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    setError(null);
    try {
      await setVideoFromFile(file);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed. Please try again.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="max-w-3xl">
          <h2 className="step-title">Step 1: Prepare Your Video</h2>
          <p className="mt-2 text-[15px] font-medium text-[var(--muted)]">
            Fill in the blanks as you go. Each blank builds your talking script.
            You can change any blank anytime. About 60 seconds is preferred;
            longer videos (2+ minutes) are fine.
          </p>
        </div>
        <HelpTip title="What Do I Do On This Page?" size="lg">
          <p>
            Work through each panel in order. Numbered steps inside every panel
            show what to click next.
          </p>
          <p>
            When your roster and talking video are ready, continue to Finish
            &amp; Download to trim, place photos, add music, and export.
          </p>
        </HelpTip>
      </div>

      <ScriptFillIns />

      <TeamSizePicker />

      {teamMemberCount === 0 ? (
        <div className="how-banner">
          Just me — no teammate corner photos. Your introduction fills the
          opening of the Fleet Hub script; the optional team thumbnail can still
          use your featured photo.
        </div>
      ) : (
        <TeamRosterFields variant="setup" />
      )}

      <ThumbnailCreator />

      <section className="section-card space-y-3 bg-white p-4 md:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold tracking-tight text-[var(--ink)]">
              Script Teleprompter Practice
            </h3>
          </div>
          <HelpTip title="Script Teleprompter Practice">
            <p>
              This script is built from the blanks you filled in. You can edit
              it, replace it, or upload your own.
            </p>
            <p>
              Practice here first. The speed you set also applies when you
              record with the webcam.
            </p>
          </HelpTip>
        </div>
        <Teleprompter />
      </section>

      <RecordingGuide />

      <section className="section-card space-y-3 bg-white p-4 md:p-5">
        <h3 className="text-lg font-semibold tracking-tight text-[var(--ink)]">
          Upload A Saved Video
        </h3>
        <PanelSteps
          steps={[
            <>
              If you already recorded a video on your computer, phone, or
              camera and saved the file, upload it here.
            </>,
            <>
              Otherwise, skip this box and continue to{" "}
              <strong>Record With Webcam</strong> below to record in this tool.
            </>,
          ]}
        />

        {!video ? (
          <div className="space-y-4">
            <div
              onDragEnter={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragging(false);
                void handleFiles(e.dataTransfer.files);
              }}
              className={`flex min-h-[160px] w-full flex-col items-center justify-center rounded-[var(--radius-lg)] border border-dashed px-6 py-8 transition ${
                dragging
                  ? "border-[var(--primary)] bg-[var(--yellow)]/40"
                  : "border-[var(--ink)] bg-[var(--panel-soft)]"
              }`}
            >
              <div className="mb-1 flex items-center gap-2">
                <FolderOpen className="h-5 w-5 text-[var(--primary)]" />
                <p className="text-center text-lg font-semibold tracking-tight text-[var(--ink)]">
                  Upload Video
                </p>
              </div>
              <p className="mb-4 max-w-md text-center text-[14px] font-medium text-[var(--muted)]">
                From this computer · MP4 / MOV / WebM
              </p>
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="btn-primary"
                data-testid="choose-video-folder"
              >
                <Upload className="h-5 w-5" />
                Click Here to Choose Video From File
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3 section-card bg-[var(--panel-soft)] px-4 py-4">
              <Film className="h-7 w-7 text-[var(--primary)]" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-lg font-bold text-[var(--ink)]">
                  {video.fileName}
                </p>
                <p className="text-base text-[var(--muted)]">
                  Length: {video.durationSeconds.toFixed(1)} seconds
                </p>
              </div>
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="btn-secondary"
              >
                Replace With Video From File
              </button>
              <button
                type="button"
                onClick={clearVideo}
                className="btn-secondary text-[var(--primary)]"
              >
                Remove
              </button>
            </div>
            <div className="how-banner">
              <strong>Next:</strong> continue to Finish &amp; Download to trim
              the clip, place teammate photos, set music, and export your MP4.
            </div>
          </div>
        )}
      </section>

      {!video ? (
        <>
          <div className="flex items-center gap-3 px-1">
            <div className="h-0.5 flex-1 bg-[var(--ink)]" />
            <p className="text-lg font-bold text-[var(--ink)]">or</p>
            <div className="h-0.5 flex-1 bg-[var(--ink)]" />
          </div>
          <WebcamRecorder
            onCaptured={async (file, options) => {
              setError(null);
              await setVideoFromFile(file, options);
            }}
            onError={setError}
          />
        </>
      ) : null}

      <input
        ref={inputRef}
        type="file"
        accept="video/mp4,video/quicktime,video/webm,.mp4,.mov,.webm"
        className="hidden"
        onChange={(e) => void handleFiles(e.target.files)}
      />

      {error ? (
        <p className="rounded-xl border-2 border-[var(--primary)] bg-red-50 px-4 py-3 text-lg font-medium text-[var(--primary-dark)]">
          {error}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center justify-end gap-3 border-t-2 border-[var(--border)] pt-4">
        <HelpTip title="Ready For The Next Step?">
          <p>
            When your roster and talking video are ready, continue to Finish
            &amp; Download to trim, time photos, add music, and export MP4.
          </p>
        </HelpTip>
        <button
          type="button"
          disabled={!video}
          onClick={() => setStep(2)}
          className="btn-primary min-w-[14rem]"
        >
          Click Here to Finish & Download
        </button>
      </div>
    </div>
  );
}
