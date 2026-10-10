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
import { MicrophoneTest } from "@/components/MicrophoneTest";
import { PanelSteps } from "@/components/PanelStep";
import { VideoOrientationPicker } from "@/components/VideoOrientationPicker";

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
  const [uploading, setUploading] = useState(false);

  const handleFiles = async (
    files: FileList | null,
    inputEl?: HTMLInputElement | null,
  ) => {
    const file = files?.[0];
    // Allow picking the same iPhone album clip again after a failed attempt.
    if (inputEl) inputEl.value = "";
    else if (inputRef.current) inputRef.current.value = "";
    if (!file) return;
    setError(null);
    setUploading(true);
    try {
      await setVideoFromFile(file);
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Could not add that video. Try again or use Record With Camera.",
      );
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="max-w-3xl">
          <h2 className="step-title">Step 1: Prepare Your Video</h2>
          <p className="mt-2 text-[15px] font-medium text-[var(--muted)]">
            Fill in a few blanks, add teammates if you want, then record or
            upload. Have headshots ready if you want corner photos or a team
            thumbnail. About 60 seconds is preferred; longer is fine.
          </p>
        </div>
        <HelpTip title="What Do I Do On This Page?" size="lg">
          <p>
            Work through each panel in order. Practice with{" "}
            <strong>Follow My Voice</strong>, then record with the{" "}
            <strong>camera and teleprompter</strong> — that is the easiest path.
          </p>
          <p>
            Want a team thumbnail or small photos in the corner of the video?
            You&apos;ll need a professional-looking headshot of each teammate,
            plus one of you for the thumbnail cover.
          </p>
          <p>
            When your roster and talking video are ready, save and move to the
            next step to trim, add music, and export.
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

      <MicrophoneTest />

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
              Use <strong>Follow My Voice</strong> to practice: the computer
              listens and scrolls the script as you read out loud. Then record
              with the camera using the same button.
            </p>
          </HelpTip>
        </div>
        <div className="how-banner">
          Practice with <strong>Follow My Voice</strong> here first. When you
          are ready, use <strong>Record With Camera</strong> below — camera +
          teleprompter works on a computer webcam or your phone.
        </div>
        <Teleprompter />
      </section>

      <RecordingGuide />

      <VideoOrientationPicker />

      {!video ? (
        <WebcamRecorder
          onCaptured={async (file, options) => {
            setError(null);
            await setVideoFromFile(file, options);
          }}
          onError={setError}
        />
      ) : null}

      {!video ? (
        <div className="flex items-center gap-3 px-1">
          <div className="h-0.5 flex-1 bg-[var(--ink)]" />
          <p className="text-lg font-bold text-[var(--ink)]">or</p>
          <div className="h-0.5 flex-1 bg-[var(--ink)]" />
        </div>
      ) : null}

      <section className="section-card space-y-3 bg-white p-4 md:p-5">
        <h3 className="text-lg font-semibold tracking-tight text-[var(--ink)]">
          {video ? "Your Talking Video" : "Upload A Saved Video (Optional)"}
        </h3>
        {!video ? (
          <div className="how-banner">
            Prefer to skip recording here? Choose a video from your phone photo
            album or computer — match the <strong>Video Format</strong> you
            picked (landscape or portrait). On iPhone, wait a moment after you
            pick the clip. Otherwise, use <strong>Record With Camera</strong>{" "}
            above.
          </div>
        ) : null}
        {!video ? (
          <PanelSteps
            steps={[
              <>
                Only use this if you already have a saved recording on this
                computer in the same shape as Video Format.
              </>,
              <>
                Otherwise go back up to <strong>Record With Camera</strong> —
                easiest with the teleprompter and Follow My Voice.
              </>,
            ]}
          />
        ) : null}

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
                Phone photo album or computer · MP4 / MOV
              </p>
              {/*
                iOS Safari often drops onChange when the file input is
                display:none and opened via .click(). Keep the input opacity-0
                over the label instead.
              */}
              <label
                className={`btn-primary relative inline-flex cursor-pointer overflow-hidden ${
                  uploading ? "pointer-events-none opacity-45" : ""
                }`}
                data-testid="choose-video-folder"
              >
                <Upload className="h-5 w-5" />
                {uploading
                  ? "Adding your video…"
                  : "Click Here to Choose Video From File"}
                <input
                  ref={inputRef}
                  type="file"
                  accept="video/mp4,video/quicktime,.mp4,.mov,.m4v,video/*"
                  disabled={uploading}
                  className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                  onChange={(e) =>
                    void handleFiles(e.target.files, e.currentTarget)
                  }
                />
              </label>
              <p className="mt-3 max-w-md text-center text-[13px] font-semibold leading-snug text-[var(--ink)]">
                On iPhone: tap the video once, then tap the{" "}
                <strong>blue ✓ at the top right</strong> to add it (not only the
                checkmark on the thumbnail).
              </p>
              {uploading ? (
                <p className="mt-3 text-center text-[14px] font-semibold text-[var(--ink)]">
                  Loading from your album — this can take a few seconds on
                  iPhone…
                </p>
              ) : null}
              {error ? (
                <p className="mt-3 rounded-xl border-2 border-[var(--primary)] bg-red-50 px-4 py-3 text-base font-medium text-[var(--primary-dark)]">
                  {error}
                </p>
              ) : null}
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
              <label className="btn-secondary relative inline-flex cursor-pointer overflow-hidden">
                Click Here to Replace With Video From File
                <input
                  type="file"
                  accept="video/mp4,video/quicktime,.mp4,.mov,.m4v,video/*"
                  className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                  onChange={(e) =>
                    void handleFiles(e.target.files, e.currentTarget)
                  }
                />
              </label>
              <button
                type="button"
                onClick={clearVideo}
                className="btn-secondary text-[var(--primary)]"
              >
                Click Here to Remove
              </button>
            </div>
            <div className="how-banner">
              <strong>Next:</strong> save and move to the next step to trim the
              clip, place teammate photos, set music, and export your MP4.
            </div>
          </div>
        )}
      </section>

      {/* Errors while a video is already loaded (replace failed). Fresh-pick errors show in the upload box. */}
      {error && video ? (
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
          Click Here to Save Your Video and Move to the Next Step
        </button>
      </div>
    </div>
  );
}
