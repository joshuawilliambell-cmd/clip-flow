"use client";

import { useRef, useState } from "react";
import { Upload, Film } from "lucide-react";
import { useStudio } from "@/lib/studio-context";
import { VideoPreview } from "@/components/VideoPreview";
import { Timeline } from "@/components/timeline/Timeline";

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
      setError(e instanceof Error ? e.message : "Upload failed.");
    }
  };

  const loadSample = async () => {
    setLoadingSample(true);
    setError(null);
    try {
      const res = await fetch("/samples/sample-intro.mp4");
      if (!res.ok) throw new Error("Sample video missing.");
      const blob = await res.blob();
      const file = new File([blob], "sample-intro.mp4", { type: "video/mp4" });
      await setVideoFromFile(file);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load sample.");
    } finally {
      setLoadingSample(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-3xl tracking-wide text-[var(--ink)] md:text-4xl">
          Add your introduction video
        </h2>
        <p className="mt-2 max-w-2xl text-[var(--muted)]">
          Drop in an MP4 or MOV. Trim to about 60 seconds using the handles on
          the timeline — no export settings to worry about.
        </p>
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
          className={`flex min-h-[240px] w-full flex-col items-center justify-center rounded-3xl border-2 border-dashed px-6 py-12 transition ${
            dragging
              ? "border-[var(--primary)] bg-[var(--primary)]/5"
              : "border-[var(--border-strong)] bg-white/70"
          }`}
        >
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex flex-col items-center"
          >
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--primary)] text-white shadow-lg">
              <Upload className="h-7 w-7" />
            </div>
            <p className="font-display text-2xl tracking-wide text-[var(--ink)]">
              Drag & drop your video here
            </p>
            <p className="mt-2 text-sm text-[var(--muted)]">
              MP4 or MOV · up to 500 MB · longer clips are OK (you can trim)
            </p>
          </button>
          <button
            type="button"
            onClick={() => void loadSample()}
            className="mt-5 rounded-xl bg-[var(--ink)] px-4 py-2 text-sm font-semibold text-white"
          >
            {loadingSample ? "Loading sample…" : "Try sample introduction video"}
          </button>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-[var(--border)] bg-white px-4 py-3">
          <Film className="h-5 w-5 text-[var(--primary)]" />
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold text-[var(--ink)]">
              {video.fileName}
            </p>
            <p className="text-xs text-[var(--muted)]">
              Source {video.durationSeconds.toFixed(1)}s · {video.width}×
              {video.height}
            </p>
          </div>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="rounded-lg border border-[var(--border-strong)] px-3 py-2 text-sm font-semibold"
          >
            Replace
          </button>
          <button
            type="button"
            onClick={clearVideo}
            className="rounded-lg px-3 py-2 text-sm font-semibold text-[var(--primary)]"
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
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <VideoPreview />
      <Timeline />

      <div className="flex justify-end">
        <button
          type="button"
          disabled={!video}
          onClick={() => setStep(2)}
          className="rounded-xl bg-[var(--ink)] px-6 py-3 text-sm font-semibold text-white disabled:opacity-40"
        >
          Continue to Team Photos
        </button>
      </div>
    </div>
  );
}
