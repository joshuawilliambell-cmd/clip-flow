"use client";

import { useRef, useState } from "react";
import { Upload, Film, FolderOpen } from "lucide-react";
import { useStudio } from "@/lib/studio-context";
import { VideoPreview } from "@/components/VideoPreview";
import { Timeline } from "@/components/timeline/Timeline";
import { HelpTip } from "@/components/HelpTip";
import { RecordingGuide } from "@/components/RecordingGuide";
import { TeamSizePicker } from "@/components/TeamSizePicker";
import { WebcamRecorder } from "@/components/WebcamRecorder";

export function VideoUploadStep() {
  const { video, setVideoFromFile, clearVideo, setStep, teamMemberCount } =
    useStudio();
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [loadingSample, setLoadingSample] = useState(false);

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

  const loadSample = async () => {
    setLoadingSample(true);
    setError(null);
    try {
      // Prefer WebM for broad browser support in automation / locked-down Chromium;
      // fall back to MP4 for environments that only have that file.
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

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="max-w-3xl">
          <h2 className="font-display text-4xl tracking-wide text-[var(--ink)] md:text-5xl">
            Step 1: Add your video
          </h2>
          <p className="mt-3 text-lg text-[var(--muted)] md:text-xl">
            Choose a video from a folder on your computer, or record a new one
            with this computer’s webcam. Then trim it to about 60 seconds.
          </p>
        </div>
        <HelpTip title="What do I do on this page?" size="lg">
          <p>
            <strong>1.</strong> First choose how many teammates you will
            introduce (1–4). That sets up the photo slots and thumbnail.
          </p>
          <p>
            <strong>Option A:</strong> Tap Choose video from folder and pick an
            MP4, MOV, or WebM file you already recorded.
          </p>
          <p>
            <strong>Option B:</strong> Tap Start webcam to record with this
            computer’s camera and microphone.
          </p>
          <p>Watch the preview, then trim with the red timeline handles.</p>
          <p>When it looks right, tap Continue to Team Photos.</p>
        </HelpTip>
      </div>

      <TeamSizePicker />

      <div className="how-banner">
        {teamMemberCount === 0
          ? "You selected Just me — no teammate photo overlays. The teleprompter will use the no-intro Fleet Hub script."
          : `You selected ${teamMemberCount} teammate${teamMemberCount === 1 ? "" : "s"}. The matching Fleet Hub script loads in the webcam teleprompter.`}{" "}
        Next, add your talking video — upload, record, or try a practice video.
      </div>

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
            className={`flex min-h-[220px] w-full flex-col items-center justify-center rounded-3xl border-4 border-dashed px-6 py-10 transition ${
              dragging
                ? "border-[var(--primary)] bg-[var(--yellow)]/40"
                : "border-[var(--ink)] bg-[var(--panel-soft)]"
            }`}
          >
            <div className="mb-2 flex items-center gap-2">
              <FolderOpen className="h-7 w-7 text-[var(--primary)]" />
              <p className="text-center text-2xl font-bold text-[var(--ink)] md:text-3xl">
                Option A: Upload from a folder
              </p>
              <HelpTip title="Upload from a folder">
                <p>
                  Tap <strong>Choose video from folder</strong>. Your computer’s
                  file window opens.
                </p>
                <p>
                  Find the video on your hard drive, Downloads folder, Desktop,
                  USB drive, or cloud-synced folder.
                </p>
                <p>Select an MP4, MOV, or WebM file, then Open.</p>
                <p>
                  On a computer you can also drag a file from a folder and drop
                  it onto this box.
                </p>
              </HelpTip>
            </div>
            <p className="mb-6 max-w-xl text-center text-lg text-[var(--muted)]">
              Use a video you already recorded on this computer, phone, or
              camera (then copied here). MP4, MOV, or WebM · up to about 4 GB.
            </p>
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="btn-primary"
              data-testid="choose-video-folder"
            >
              <Upload className="h-6 w-6" />
              Choose video from folder
            </button>
          </div>

          <div className="rounded-3xl border-2 border-[var(--ink)] bg-[var(--yellow)] px-6 py-5 text-center">
            <p className="text-xl font-bold text-[var(--ink)]">
              Just exploring? Load a practice video
            </p>
            <p className="mt-1 text-lg text-[var(--ink)]/80">
              No file picker — this loads a built-in sample so you can try Steps
              2 and 3 right away.
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
              className="btn-primary mt-4"
            >
              <Film className="h-6 w-6" />
              {loadingSample ? "Loading practice video…" : "Try a practice video"}
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
          <div className="flex flex-wrap items-center gap-3 rounded-2xl border-2 border-[var(--ink)] bg-[var(--panel-soft)] px-4 py-4">
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
                <strong>Record with webcam</strong> clears this clip so you can
                record a new one.
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
          <p className="text-base text-[var(--muted)]">
            Want to record a new webcam clip instead? Tap Remove, then use
            Option B: Record with webcam.
          </p>
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

      <VideoPreview />
      <Timeline />

      <div className="flex flex-wrap items-center justify-end gap-3 border-t-2 border-[var(--border)] pt-4">
        <HelpTip title="Ready for the next step?">
          <p>
            After your video is added and trimmed, tap Continue to Team Photos.
          </p>
          <p>You can always come back to this step later.</p>
        </HelpTip>
        <button
          type="button"
          disabled={!video}
          onClick={() => setStep(2)}
          className="btn-primary min-w-[14rem]"
        >
          Continue to Team Photos
        </button>
      </div>
    </div>
  );
}
