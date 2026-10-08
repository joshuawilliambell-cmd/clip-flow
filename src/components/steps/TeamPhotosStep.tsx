"use client";

import { useRef, useState } from "react";
import { ImagePlus, Trash2, Wand2, RotateCcw } from "lucide-react";
import { useStudio } from "@/lib/studio-context";
import { VIDEO_TEMPLATE } from "@/lib/template";
import { VideoPreview } from "@/components/VideoPreview";
import { Timeline } from "@/components/timeline/Timeline";
import { HelpTip } from "@/components/HelpTip";
import { PipSidePicker } from "@/components/PipSidePicker";

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
  const [loadingSample, setLoadingSample] = useState(false);

  const handleFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    setError(null);
    try {
      await addPhotosFromFiles(files);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed. Please try again.");
    }
  };

  const loadSampleTeam = async () => {
    setLoadingSample(true);
    setError(null);
    try {
      const samples = [
        {
          path: "/samples/team-jared.jpg",
          name: "Jared",
          title: "Total Truck Care",
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
      ];
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
      const arranged = await addPhotosFromFiles(files);
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
      setLoadingSample(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="max-w-3xl">
          <h2 className="font-display text-4xl tracking-wide text-[var(--ink)] md:text-5xl">
            Step 2: Add your team
          </h2>
          <p className="mt-3 text-lg text-[var(--muted)] md:text-xl">
            Add photos, type each person’s name and job title, then drag the
            colored bars to choose when each photo appears.
          </p>
        </div>
        <HelpTip title="What do I do on this page?" size="lg">
          <p>
            <strong>1.</strong> Tap Choose photos and pick upright (portrait)
            headshots — JPG, PNG, or WebP.
          </p>
          <p>
            <strong>2.</strong> Fill in Name and Job title for each person.
          </p>
          <p>
            <strong>3.</strong> Choose Left side or Right side for where photos
            appear (with padding, like the example).
          </p>
          <p>
            <strong>4.</strong> On Track 2 of the timeline, each photo starts at{" "}
            {VIDEO_TEMPLATE.defaultPhotoDurationSeconds} seconds. Drag the bar
            to change when it shows; drag the ends to make it shorter or longer.
          </p>
          <p>
            Photos stay portrait on a 16:9 video. You do <strong>not</strong>{" "}
            resize or drag them on the picture — that is done for you.
          </p>
        </HelpTip>
      </div>

      <div className="how-banner">
        Each team photo starts at {VIDEO_TEMPLATE.defaultPhotoDurationSeconds}{" "}
        seconds — long enough for a short intro. Drag the ends of a colored bar
        on the timeline to make it shorter or longer.
      </div>

      {!video ? (
        <p className="rounded-xl border-2 border-[var(--ink)] bg-[var(--yellow)] px-4 py-3 text-lg font-medium text-[var(--ink)]">
          Please go back to Step 1 and add your video first.
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={autoArrange}
          disabled={photos.length === 0}
          className="btn-secondary"
        >
          <Wand2 className="h-5 w-5" /> Auto Arrange Photos
        </button>
        <HelpTip title="Auto Arrange Photos">
          <p>
            This lines up your photos one after another, each lasting{" "}
            {VIDEO_TEMPLATE.defaultPhotoDurationSeconds} seconds by default,
            starting a few seconds into the video.
          </p>
          <p>
            After arranging, drag the ends of any photo bar to shorten or
            lengthen that person&apos;s time on screen.
          </p>
          <p>Use it if the timing got messy and you want a clean starting point.</p>
        </HelpTip>
        <button
          type="button"
          onClick={resetTimeline}
          disabled={photos.length === 0}
          className="btn-secondary"
        >
          <RotateCcw className="h-5 w-5" /> Reset Timeline
        </button>
        <HelpTip title="Reset Timeline">
          <p>This puts the photo timing back to the last automatic arrangement.</p>
          <p>Your names and titles stay the same.</p>
        </HelpTip>
      </div>

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
        className={`flex w-full flex-wrap items-center justify-center gap-4 rounded-3xl border-4 border-dashed px-4 py-10 transition ${
          dragging
            ? "border-[var(--primary)] bg-[var(--yellow)]/40"
            : "border-[var(--ink)] bg-[var(--panel-soft)]"
        }`}
      >
        <div className="flex items-center gap-3">
          <ImagePlus className="h-8 w-8 text-[var(--primary)]" />
          <div>
            <p className="text-xl font-bold text-[var(--ink)]">
              Add team photos here
            </p>
            <p className="text-base text-[var(--muted)]">
              JPG, PNG, or WebP · up to {VIDEO_TEMPLATE.maxPhotos} photos ·{" "}
              {photos.length} added
            </p>
          </div>
          <HelpTip title="How to add photos">
            <p>Tap Choose photos and select one or more pictures.</p>
            <p>You can add several photos at once.</p>
            <p>On a computer, you can also drag photos onto this box.</p>
          </HelpTip>
        </div>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="btn-primary"
        >
          Choose photos
        </button>
        <button
          type="button"
          onClick={() => void loadSampleTeam()}
          className="btn-yellow"
        >
          {loadingSample ? "Loading…" : "Load practice team"}
        </button>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
        multiple
        className="hidden"
        onChange={(e) => void handleFiles(e.target.files)}
      />

      {error ? (
        <p className="rounded-xl border-2 border-[var(--primary)] bg-red-50 px-4 py-3 text-lg font-medium text-[var(--primary-dark)]">
          {error}
        </p>
      ) : null}

      {photos.length > 0 ? (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <h3 className="text-2xl font-bold text-[var(--ink)]">
              Names and job titles
            </h3>
            <HelpTip title="Names and job titles">
              <p>Type the person’s name and job title in the boxes.</p>
              <p>
                This text appears under their photo in the finished video
                automatically.
              </p>
              <p>Department is optional.</p>
            </HelpTip>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {photos.map((photo) => (
              <article
                key={photo.id}
                className="flex gap-3 rounded-2xl border-2 border-[var(--ink)] bg-white p-4"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo.url}
                  alt={photo.name}
                  className="h-28 w-24 shrink-0 rounded-xl object-cover object-[center_28%] border-2 border-[var(--ink)]"
                />
                <div className="min-w-0 flex-1 space-y-3">
                  <label className="block">
                    <span className="field-label">Name</span>
                    <input
                      value={photo.name}
                      onChange={(e) =>
                        updatePhotoMeta(photo.id, { name: e.target.value })
                      }
                      className="field-input"
                      placeholder="Example: Jared"
                    />
                  </label>
                  <label className="block">
                    <span className="field-label">Job title</span>
                    <input
                      value={photo.title}
                      onChange={(e) =>
                        updatePhotoMeta(photo.id, { title: e.target.value })
                      }
                      className="field-input"
                      placeholder="Example: Total Truck Care"
                    />
                  </label>
                  <label className="block">
                    <span className="field-label">Department (optional)</span>
                    <input
                      value={photo.department}
                      onChange={(e) =>
                        updatePhotoMeta(photo.id, {
                          department: e.target.value,
                        })
                      }
                      className="field-input"
                      placeholder="Example: Enterprise Sales"
                    />
                  </label>
                </div>
                <button
                  type="button"
                  onClick={() => removePhoto(photo.id)}
                  className="self-start rounded-xl border-2 border-[var(--ink)] p-3 text-[var(--ink)] hover:bg-red-50 hover:text-[var(--primary)]"
                  aria-label={`Remove ${photo.name}`}
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </article>
            ))}
          </div>
        </div>
      ) : null}

      <PipSidePicker />
      <VideoPreview compact />
      <Timeline />

      <div className="flex flex-wrap justify-between gap-3 border-t-2 border-[var(--border)] pt-4">
        <button type="button" onClick={() => setStep(1)} className="btn-secondary">
          Back
        </button>
        <div className="flex items-center gap-2">
          <HelpTip title="Ready for the last step?">
            <p>
              When your photos and names look good, tap Continue to Finish &
              Download.
            </p>
          </HelpTip>
          <button
            type="button"
            disabled={!video}
            onClick={() => setStep(3)}
            className="btn-primary min-w-[12rem]"
          >
            Continue to Finish
          </button>
        </div>
      </div>
    </div>
  );
}
