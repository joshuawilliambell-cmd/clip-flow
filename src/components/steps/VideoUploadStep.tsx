"use client";

import { useRef, useState } from "react";
import { Upload, Film } from "lucide-react";
import { useStudio } from "@/lib/studio-context";
import { VideoPreview } from "@/components/VideoPreview";
import { Timeline } from "@/components/timeline/Timeline";
import { HelpTip } from "@/components/HelpTip";

export function VideoUploadStep() {
  const { video, setVideoFromFile, clearVideo, setStep } = useStudio();
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
      const res = await fetch("/samples/sample-intro.mp4");
      if (!res.ok) throw new Error("Sample video is missing.");
      const blob = await res.blob();
      const file = new File([blob], "sample-intro.mp4", { type: "video/mp4" });
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
            Upload the video of you talking. Then use the red handles on the
            timeline to keep only the part you want (about 60 seconds).
          </p>
        </div>
        <HelpTip title="What do I do on this page?" size="lg">
          <p>
            <strong>1.</strong> Tap the big upload box and choose an MP4 or MOV
            file from your computer.
          </p>
          <p>
            <strong>2.</strong> Watch the preview. Tap the big Play button to
            listen.
          </p>
          <p>
            <strong>3.</strong> On the timeline, drag the red ends to cut extra
            time from the start or end.
          </p>
          <p>
            <strong>4.</strong> When it looks right, tap Continue to Team Photos.
          </p>
        </HelpTip>
      </div>

      <div className="how-banner">
        Tip: Prefer a practice run first? Tap “Try a practice video” below. You
        can replace it later with your real video.
      </div>

      {!video ? (
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
          className={`flex min-h-[260px] w-full flex-col items-center justify-center rounded-3xl border-4 border-dashed px-6 py-12 transition ${
            dragging
              ? "border-[var(--primary)] bg-[var(--yellow)]/40"
              : "border-[var(--ink)] bg-[var(--panel-soft)]"
          }`}
        >
          <div className="mb-2 flex items-center gap-2">
            <p className="text-center text-2xl font-bold text-[var(--ink)] md:text-3xl">
              Put your video here
            </p>
            <HelpTip title="How to upload a video">
              <p>Tap “Choose video file”, then pick one video from your device.</p>
              <p>Allowed types: MP4 or MOV.</p>
              <p>Longer videos are OK — you will trim them on the timeline.</p>
              <p>
                You can also drag a file from a folder and drop it onto this box
                (on a computer).
              </p>
            </HelpTip>
          </div>
          <p className="mb-6 max-w-lg text-center text-lg text-[var(--muted)]">
            MP4 or MOV files work best. Up to about 500 MB.
          </p>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="btn-primary"
          >
            <Upload className="h-6 w-6" />
            Choose video file
          </button>
          <button
            type="button"
            onClick={() => void loadSample()}
            className="btn-yellow mt-4"
          >
            {loadingSample ? "Loading practice video…" : "Try a practice video"}
          </button>
        </div>
      ) : (
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
              <strong>Replace</strong> lets you pick a different video file.
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
            Replace
          </button>
          <button
            type="button"
            onClick={clearVideo}
            className="btn-secondary text-[var(--primary)]"
          >
            Remove
          </button>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="video/mp4,video/quicktime,.mp4,.mov"
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
            After your video is uploaded and trimmed, tap Continue to Team
            Photos.
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
