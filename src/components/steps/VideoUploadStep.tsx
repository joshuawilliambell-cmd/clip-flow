"use client";

import { useRef, useState } from "react";
import {
  Film,
  FolderOpen,
  ImagePlus,
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
    addPhotosFromFiles,
    replaceTeamPhotosFromFiles,
    updatePhotoMeta,
    autoArrange,
    resetTimeline,
  } = useStudio();
  const inputRef = useRef<HTMLInputElement>(null);
  const bulkRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [loadingSample, setLoadingSample] = useState(false);
  const [loadingSampleTeam, setLoadingSampleTeam] = useState(false);

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

  const handleBulkPhotos = async (files: FileList | null) => {
    if (!files?.length) return;
    setError(null);
    try {
      await addPhotosFromFiles(files);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed. Please try again.");
    }
  };

  const loadSample = async () => {
    setLoadingSample(true);
    setError(null);
    try {
      let res = await fetch("/samples/sample-intro.webm");
      let fileName = "sample-intro.webm";
      let mime = "video/webm";
      if (!res.ok) {
        res = await fetch("/samples/sample-intro.mp4");
        fileName = "sample-intro.mp4";
        mime = "video/mp4";
      }
      if (!res.ok) throw new Error("Sample video is missing.");
      const blob = await res.blob();
      const file = new File([blob], fileName, { type: mime });
      await setVideoFromFile(file);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load the sample.");
    } finally {
      setLoadingSample(false);
    }
  };

  const loadSampleTeam = async () => {
    setLoadingSampleTeam(true);
    setError(null);
    try {
      const samples = [
        {
          path: "/samples/team-jared.jpg",
          name: "Jared",
          title: "Total Truck Care Account Manager",
        },
        {
          path: "/samples/team-bailey.jpg",
          name: "Bailey",
          title: "Area Account Manager",
        },
        {
          path: "/samples/team-teresa.jpg",
          name: "Teresa",
          title: "Fleet Account Specialist",
        },
        {
          path: "/samples/team-jared.jpg",
          name: "Alex",
          title: "Account Manager",
        },
      ].slice(0, teamMemberCount);
      const files: File[] = [];
      for (const sample of samples) {
        const res = await fetch(sample.path);
        if (!res.ok) throw new Error("Sample photos are missing.");
        const blob = await res.blob();
        files.push(
          new File([blob], `${sample.name.toLowerCase()}.jpg`, {
            type: "image/jpeg",
          }),
        );
      }
      const arranged = await replaceTeamPhotosFromFiles(files);
      for (const sample of samples) {
        const match = arranged.find(
          (p) => p.name.toLowerCase() === sample.name.toLowerCase(),
        );
        if (match) {
          updatePhotoMeta(match.id, {
            name: sample.name,
            title: sample.title,
          });
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load samples.");
    } finally {
      setLoadingSampleTeam(false);
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
          <p>2. Fill in customer name and your name for the teleprompter.</p>
          <p>3. Record or upload your talking video, then trim and time photos.</p>
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
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => void loadSampleTeam()}
              className="btn-yellow"
            >
              {loadingSampleTeam ? "Loading…" : "Load practice team"}
            </button>
            <button
              type="button"
              onClick={() => bulkRef.current?.click()}
              className="btn-secondary"
            >
              <ImagePlus className="h-5 w-5" /> Fill empty photo slots
            </button>
            <HelpTip title="Practice team">
              <p>
                Loads sample headshots and names so you can try the teleprompter
                and timeline without your own photos yet.
              </p>
            </HelpTip>
          </div>
          <input
            ref={bulkRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
            multiple
            className="hidden"
            onChange={(e) => {
              void handleBulkPhotos(e.target.files);
              e.currentTarget.value = "";
            }}
          />
          <TeamRosterFields variant="setup" />
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

          <div className="section-card flex flex-wrap items-center justify-between gap-3 bg-[var(--yellow)] px-4 py-3">
            <p className="text-[14px] font-semibold text-[var(--ink)]">
              Just exploring? Load a practice clip to try the rest of the flow.
            </p>
            <button
              type="button"
              id="try-practice-video"
              data-testid="try-practice-video"
              disabled={loadingSample}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                void loadSample();
              }}
              className="btn-primary"
            >
              <Film className="h-5 w-5" />
              {loadingSample ? "Loading…" : "Try a practice video"}
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
