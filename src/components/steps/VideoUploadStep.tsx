"use client";

import { useRef, useState } from "react";
import {
  Film,
  FolderOpen,
  RotateCcw,
  Upload,
  Wand2,
} from "lucide-react";
import { useStudio } from "@/lib/studio-context";
import { VIDEO_TEMPLATE } from "@/lib/template";
import { VideoPreview } from "@/components/VideoPreview";
import { Timeline } from "@/components/timeline/Timeline";
import { HelpTip } from "@/components/HelpTip";
import { RecordingGuide } from "@/components/RecordingGuide";
import { TeamSizePicker } from "@/components/TeamSizePicker";
import { TeamRosterFields } from "@/components/TeamRosterFields";
import { ThumbnailCreator } from "@/components/ThumbnailCreator";
import { ScriptFillIns } from "@/components/ScriptFillIns";
import { WebcamRecorder } from "@/components/WebcamRecorder";
import { Teleprompter } from "@/components/Teleprompter";
import { PipSidePicker } from "@/components/PipSidePicker";
import { filledTeamPhotos } from "@/lib/team-slots";

export function VideoUploadStep() {
  const {
    video,
    setVideoFromFile,
    clearVideo,
    setStep,
    teamMemberCount,
    photos,
    autoArrange,
    resetTimeline,
  } = useStudio();
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  const filledCount = filledTeamPhotos(photos).length;

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
          <h2 className="step-title">Step 1: Prepare your video</h2>
          <p className="mt-2 text-[15px] font-medium text-[var(--muted)]">
            Build your team roster and script, record or upload, then set when
            photos appear — about 60 seconds.
          </p>
        </div>
        <HelpTip title="What do I do on this page?" size="lg">
          <p>1. Choose how many teammates and add photo, name, and title.</p>
          <p>2. Optional: build the Love&apos;s Team thumbnail opener.</p>
          <p>3. Fill in customer name and your name for the teleprompter.</p>
          <p>4. Record or upload your talking video, then trim and time photos.</p>
        </HelpTip>
      </div>

      {/* 1. Team size + roster */}
      <TeamSizePicker />

      {teamMemberCount === 0 ? (
        <div className="how-banner">
          Just me — no photo overlays. Matching Fleet Hub script in the
          teleprompter.
        </div>
      ) : (
        <>
          <TeamRosterFields variant="setup" />
          <ThumbnailCreator />
        </>
      )}

      {/* 2. Script fill-ins + teleprompter */}
      <ScriptFillIns />

      <section className="section-card space-y-3 bg-white p-4 md:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold tracking-tight text-[var(--ink)]">
              Script teleprompter
            </h3>
            <p className="mt-0.5 max-w-2xl text-[13px] font-medium text-[var(--muted)]">
              Works with webcam or a phone on a tripod — leave this scrolling on
              your computer screen behind the phone, then upload the recording.
            </p>
          </div>
          <HelpTip title="Phone on a tripod">
            <p>
              Set your phone on a desk tripod facing you. Keep this browser
              window on the computer behind the phone.
            </p>
            <p>
              Pick the official or uploaded script, set speed, tap{" "}
              <strong>Scroll</strong>, then record on your phone. Upload the
              file when you are done.
            </p>
          </HelpTip>
        </div>
        <Teleprompter />
      </section>

      {/* 3. Recording tips + capture */}
      <RecordingGuide />

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
                Upload video
              </p>
              <HelpTip title="Upload from a folder">
                <p>MP4, MOV, or WebM · up to about 4 GB.</p>
                <p>Tap the button or drag a file onto this box.</p>
              </HelpTip>
            </div>
            <p className="mb-4 max-w-md text-center text-[14px] font-medium text-[var(--muted)]">
              From this computer, phone, or camera · MP4 / MOV / WebM
            </p>
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="btn-primary"
              data-testid="choose-video-folder"
            >
              <Upload className="h-5 w-5" />
              Choose video from folder
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div className="h-0.5 flex-1 bg-[var(--ink)]" />
            <p className="text-lg font-bold text-[var(--ink)]">or</p>
            <div className="h-0.5 flex-1 bg-[var(--ink)]" />
          </div>

          <WebcamRecorder
            onCaptured={async (file) => {
              setError(null);
              await setVideoFromFile(file);
            }}
            onError={setError}
          />
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
            <HelpTip title="Change or remove this video">
              <p>
                <strong>Replace from folder</strong> picks a different saved
                file.
              </p>
              <p>
                <strong>Remove</strong> clears the video so you can start over.
              </p>
            </HelpTip>
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="btn-secondary"
            >
              Replace from folder
            </button>
            <button
              type="button"
              onClick={clearVideo}
              className="btn-secondary text-[var(--primary)]"
            >
              Remove
            </button>
          </div>
        </div>
      )}

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

      {/* 4. Preview, PIP side, and timing (from former Step 2) */}
      {teamMemberCount > 0 ? (
        <section className="space-y-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold tracking-tight text-[var(--ink)]">
                Photo overlays & timing
              </h3>
              <p className="mt-0.5 text-[13px] font-medium text-[var(--muted)]">
                {filledCount} of {teamMemberCount} photos · choose corner, then
                drag timeline bars for when each face appears
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={autoArrange}
                disabled={filledCount === 0 || !video}
                className="btn-secondary"
              >
                <Wand2 className="h-5 w-5" /> Auto Arrange Photos
              </button>
              <button
                type="button"
                onClick={resetTimeline}
                disabled={filledCount === 0 || !video}
                className="btn-secondary"
              >
                <RotateCcw className="h-5 w-5" /> Reset Timeline
              </button>
              <HelpTip title="Photo timing">
                <p>
                  Photos default to{" "}
                  {VIDEO_TEMPLATE.defaultPhotoDurationSeconds}s each. Drag the
                  ends of a timeline bar to change length.
                </p>
                <p>
                  Auto Arrange lines them up one after another from the start of
                  your trim.
                </p>
              </HelpTip>
            </div>
          </div>
          <PipSidePicker />
        </section>
      ) : null}

      <VideoPreview />
      <Timeline />

      <div className="flex flex-wrap items-center justify-end gap-3 border-t-2 border-[var(--border)] pt-4">
        <HelpTip title="Ready for the next step?">
          <p>
            When your video, roster, and photo timing look good, continue to
            Finish & Download for music and MP4 export.
          </p>
        </HelpTip>
        <button
          type="button"
          disabled={!video}
          onClick={() => setStep(2)}
          className="btn-primary min-w-[14rem]"
        >
          Continue to Finish & Download
        </button>
      </div>
    </div>
  );
}
