"use client";

import { useRef, useState } from "react";
import { ImagePlus, Trash2, Wand2, RotateCcw } from "lucide-react";
import { useStudio } from "@/lib/studio-context";
import { VIDEO_TEMPLATE } from "@/lib/template";
import { VideoPreview } from "@/components/VideoPreview";
import { Timeline } from "@/components/timeline/Timeline";

export function TeamPhotosStep() {
  const {
    photos,
    video,
    addPhotosFromFiles,
    updatePhotoMeta,
    removePhoto,
    autoArrange,
    resetTimeline,
    setStep,
  } = useStudio();
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  const handleFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    setError(null);
    try {
      await addPhotosFromFiles(files);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-3xl tracking-wide text-[var(--ink)] md:text-4xl">
            Add your team
          </h2>
          <p className="mt-2 max-w-2xl text-[var(--muted)]">
            Upload photos and enter names and titles. Every photo uses the same
            picture-in-picture frame — just set when each person appears.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={autoArrange}
            disabled={photos.length === 0}
            className="inline-flex items-center gap-2 rounded-xl border border-[var(--border-strong)] bg-white px-4 py-2.5 text-sm font-semibold disabled:opacity-40"
          >
            <Wand2 className="h-4 w-4" /> Auto Arrange Photos
          </button>
          <button
            type="button"
            onClick={resetTimeline}
            disabled={photos.length === 0}
            className="inline-flex items-center gap-2 rounded-xl border border-[var(--border-strong)] bg-white px-4 py-2.5 text-sm font-semibold disabled:opacity-40"
          >
            <RotateCcw className="h-4 w-4" /> Reset Timeline
          </button>
        </div>
      </div>

      {!video ? (
        <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Start with Step 1 and upload your introduction video first.
        </p>
      ) : null}

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
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
        className={`flex w-full items-center justify-center gap-3 rounded-2xl border-2 border-dashed px-4 py-8 transition ${
          dragging
            ? "border-[var(--primary)] bg-[var(--primary)]/5"
            : "border-[var(--border-strong)] bg-white/70"
        }`}
      >
        <ImagePlus className="h-6 w-6 text-[var(--primary)]" />
        <div className="text-left">
          <p className="font-semibold text-[var(--ink)]">
            Drop team photos here
          </p>
          <p className="text-xs text-[var(--muted)]">
            JPG, PNG, or WebP · up to {VIDEO_TEMPLATE.maxPhotos} photos ·{" "}
            {photos.length} added
          </p>
        </div>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
        multiple
        className="hidden"
        onChange={(e) => void handleFiles(e.target.files)}
      />

      {error ? (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      {photos.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {photos.map((photo) => (
            <article
              key={photo.id}
              className="flex gap-3 rounded-2xl border border-[var(--border)] bg-white p-3"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photo.url}
                alt={photo.name}
                className="h-24 w-20 shrink-0 rounded-lg object-cover object-[center_28%]"
              />
              <div className="min-w-0 flex-1 space-y-2">
                <label className="block">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--muted)]">
                    Name
                  </span>
                  <input
                    value={photo.name}
                    onChange={(e) =>
                      updatePhotoMeta(photo.id, { name: e.target.value })
                    }
                    className="mt-0.5 w-full rounded-lg border border-[var(--border)] px-2.5 py-1.5 text-sm outline-none focus:border-[var(--primary)]"
                    placeholder="Jared"
                  />
                </label>
                <label className="block">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--muted)]">
                    Job title
                  </span>
                  <input
                    value={photo.title}
                    onChange={(e) =>
                      updatePhotoMeta(photo.id, { title: e.target.value })
                    }
                    className="mt-0.5 w-full rounded-lg border border-[var(--border)] px-2.5 py-1.5 text-sm outline-none focus:border-[var(--primary)]"
                    placeholder="Total Truck Care"
                  />
                </label>
                <label className="block">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--muted)]">
                    Department (optional)
                  </span>
                  <input
                    value={photo.department}
                    onChange={(e) =>
                      updatePhotoMeta(photo.id, {
                        department: e.target.value,
                      })
                    }
                    className="mt-0.5 w-full rounded-lg border border-[var(--border)] px-2.5 py-1.5 text-sm outline-none focus:border-[var(--primary)]"
                    placeholder="Enterprise Sales"
                  />
                </label>
              </div>
              <button
                type="button"
                onClick={() => removePhoto(photo.id)}
                className="self-start rounded-lg p-2 text-[var(--muted)] hover:bg-red-50 hover:text-[var(--primary)]"
                aria-label={`Remove ${photo.name}`}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </article>
          ))}
        </div>
      ) : null}

      <VideoPreview compact />
      <Timeline />

      <div className="flex flex-wrap justify-between gap-3">
        <button
          type="button"
          onClick={() => setStep(1)}
          className="rounded-xl border border-[var(--border-strong)] bg-white px-5 py-3 text-sm font-semibold"
        >
          Back
        </button>
        <button
          type="button"
          disabled={!video}
          onClick={() => setStep(3)}
          className="rounded-xl bg-[var(--ink)] px-6 py-3 text-sm font-semibold text-white disabled:opacity-40"
        >
          Continue to Preview
        </button>
      </div>
    </div>
  );
}
