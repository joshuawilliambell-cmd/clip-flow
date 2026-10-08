"use client";

import { useRef, useState } from "react";
import { ImagePlus, Trash2, Wand2, RotateCcw } from "lucide-react";
import { useStudio } from "@/lib/studio-context";
import { VIDEO_TEMPLATE } from "@/lib/template";
import { VideoPreview } from "@/components/VideoPreview";
import { Timeline } from "@/components/timeline/Timeline";
import { HelpTip } from "@/components/HelpTip";
import { PipSidePicker } from "@/components/PipSidePicker";
import { TeamSizePicker } from "@/components/TeamSizePicker";
import { filledTeamPhotos } from "@/lib/team-slots";

export function TeamPhotosStep() {
  const {
    photos,
    video,
    teamMemberCount,
    addPhotosFromFiles,
    setPhotoOnSlot,
    replaceTeamPhotosFromFiles,
    updatePhotoMeta,
    clearPhotoSlot,
    autoArrange,
    resetTimeline,
    setStep,
  } = useStudio();
  const fileRefs = useRef<Array<HTMLInputElement | null>>([]);
  const bulkRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [loadingSample, setLoadingSample] = useState(false);

  const filledCount = filledTeamPhotos(photos).length;

  const handleFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    setError(null);
    try {
      await addPhotosFromFiles(files);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed. Please try again.");
    }
  };

  const handleSlotFile = async (id: string, file: File | undefined) => {
    if (!file) return;
    setError(null);
    try {
      await setPhotoOnSlot(id, file);
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
            You chose {teamMemberCount} teammate
            {teamMemberCount === 1 ? "" : "s"}. Add a photo and name in each
            slot ({filledCount} of {teamMemberCount} filled).
          </p>
        </div>
        <HelpTip title="What do I do on this page?" size="lg">
          <p>
            <strong>1.</strong> Confirm how many people (1–4) at the top if you
            need to change it.
          </p>
          <p>
            <strong>2.</strong> Tap each slot and add a portrait headshot.
          </p>
          <p>
            <strong>3.</strong> Type Name and Job title for each person.
          </p>
          <p>
            <strong>4.</strong> Each photo starts at{" "}
            {VIDEO_TEMPLATE.defaultPhotoDurationSeconds} seconds on the
            timeline — drag the ends to change length.
          </p>
        </HelpTip>
      </div>

      <TeamSizePicker />

      <div className="how-banner">
        Each team photo starts at {VIDEO_TEMPLATE.defaultPhotoDurationSeconds}{" "}
        seconds. Drag the ends of a colored bar on the timeline to make it
        shorter or longer.
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
          disabled={filledCount === 0}
          className="btn-secondary"
        >
          <Wand2 className="h-5 w-5" /> Auto Arrange Photos
        </button>
        <HelpTip title="Auto Arrange Photos">
          <p>
            This lines up your filled photos one after another, each lasting{" "}
            {VIDEO_TEMPLATE.defaultPhotoDurationSeconds} seconds by default.
          </p>
        </HelpTip>
        <button
          type="button"
          onClick={resetTimeline}
          disabled={filledCount === 0}
          className="btn-secondary"
        >
          <RotateCcw className="h-5 w-5" /> Reset Timeline
        </button>
        <button
          type="button"
          onClick={() => void loadSampleTeam()}
          className="btn-yellow"
        >
          {loadingSample ? "Loading…" : "Load practice team"}
        </button>
        <button
          type="button"
          onClick={() => bulkRef.current?.click()}
          className="btn-secondary"
        >
          <ImagePlus className="h-5 w-5" /> Fill empty slots
        </button>
      </div>
      <input
        ref={bulkRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
        multiple
        className="hidden"
        onChange={(e) => {
          void handleFiles(e.target.files);
          e.currentTarget.value = "";
        }}
      />

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
        className={`rounded-2xl border-2 border-dashed px-4 py-3 text-center text-base ${
          dragging
            ? "border-[var(--primary)] bg-[var(--yellow)]/40"
            : "border-[var(--border)] bg-[var(--panel-soft)]"
        }`}
      >
        Tip: drag several photos onto this page to fill empty slots in order.
      </div>

      {error ? (
        <p className="rounded-xl border-2 border-[var(--primary)] bg-red-50 px-4 py-3 text-lg font-medium text-[var(--primary-dark)]">
          {error}
        </p>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        {photos.map((photo, index) => (
          <article
            key={photo.id}
            className="flex gap-3 rounded-2xl border-2 border-[var(--ink)] bg-white p-4"
          >
            <button
              type="button"
              onClick={() => fileRefs.current[index]?.click()}
              className="relative h-28 w-24 shrink-0 overflow-hidden rounded-xl border-2 border-[var(--ink)] bg-[#eef1f6]"
            >
              {photo.url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={photo.url}
                  alt={photo.name || `Teammate ${index + 1}`}
                  className="h-full w-full object-cover object-[center_28%]"
                />
              ) : (
                <span className="flex h-full flex-col items-center justify-center gap-1 px-1 text-center text-xs font-semibold text-[var(--ink)]">
                  <ImagePlus className="h-5 w-5 text-[var(--primary)]" />
                  Add photo
                </span>
              )}
            </button>
            <input
              ref={(el) => {
                fileRefs.current[index] = el;
              }}
              type="file"
              accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
              className="hidden"
              onChange={(e) => {
                void handleSlotFile(photo.id, e.target.files?.[0]);
                e.currentTarget.value = "";
              }}
            />

            <div className="min-w-0 flex-1 space-y-3">
              <p className="text-sm font-bold uppercase tracking-wide text-[var(--muted)]">
                Teammate {index + 1} of {teamMemberCount}
              </p>
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
              {photo.url ? (
                <button
                  type="button"
                  onClick={() => clearPhotoSlot(photo.id)}
                  className="inline-flex items-center gap-2 text-base font-semibold text-[var(--primary)]"
                >
                  <Trash2 className="h-4 w-4" /> Clear photo
                </button>
              ) : null}
            </div>
          </article>
        ))}
      </div>

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
