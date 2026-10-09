"use client";

import { useRef, useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  GripVertical,
  ImagePlus,
  Trash2,
  Wand2,
  RotateCcw,
} from "lucide-react";
import { useStudio } from "@/lib/studio-context";
import { VIDEO_TEMPLATE } from "@/lib/template";
import { VideoPreview } from "@/components/VideoPreview";
import { Timeline } from "@/components/timeline/Timeline";
import { HelpTip } from "@/components/HelpTip";
import { PipSidePicker } from "@/components/PipSidePicker";
import { TeamSizePicker } from "@/components/TeamSizePicker";
import { filledTeamPhotos } from "@/lib/team-slots";

const SLOT_DRAG_TYPE = "application/x-loves-team-slot";

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
    reorderTeamSlots,
    autoArrange,
    resetTimeline,
    setStep,
  } = useStudio();
  const fileRefs = useRef<Array<HTMLInputElement | null>>([]);
  const bulkRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [loadingSample, setLoadingSample] = useState(false);
  const [dragFromIndex, setDragFromIndex] = useState<number | null>(null);
  const [dropTargetIndex, setDropTargetIndex] = useState<number | null>(null);

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

  const clearSlotDrag = () => {
    setDragFromIndex(null);
    setDropTargetIndex(null);
  };

  const moveSlot = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;
    reorderTeamSlots(fromIndex, toIndex);
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
          <h2 className="step-title">
            Step 2: Add your team
          </h2>
          <p className="mt-3 text-lg text-[var(--muted)] md:text-xl">
            {teamMemberCount === 0
              ? "You chose Just me — no teammate photos needed. Continue to the next step when your video looks good."
              : `You chose ${teamMemberCount} teammate${teamMemberCount === 1 ? "" : "s"}. Add a photo and name in each slot (${filledCount} of ${teamMemberCount} filled). Drag the grip to change who appears first.`}
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
            <strong>4.</strong> Drag the grip (or use ↑ ↓) to set the order they
            appear in the video.
          </p>
          <p>
            <strong>5.</strong> Each photo starts at{" "}
            {VIDEO_TEMPLATE.defaultPhotoDurationSeconds} seconds on the
            timeline — drag the ends to change length.
          </p>
        </HelpTip>
      </div>

      <TeamSizePicker />

      {teamMemberCount === 0 ? (
        <div className="how-banner">
          No teammate photo slots for this video. Your teleprompter script is
          the &quot;Just me&quot; Fleet Hub welcome. Tap Continue to next step when
          ready.
        </div>
      ) : (
        <div className="how-banner">
          Each team photo starts at {VIDEO_TEMPLATE.defaultPhotoDurationSeconds}{" "}
          seconds. Drag the grip on a card to reorder who shows first. Drag the
          ends of a colored bar on the timeline to change length.
        </div>
      )}

      {!video ? (
        <p className="rounded-xl border-2 border-[var(--ink)] bg-[var(--yellow)] px-4 py-3 text-lg font-medium text-[var(--ink)]">
          Please go back to Step 1 and add your video first.
        </p>
      ) : null}

      {teamMemberCount > 0 ? (
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
      ) : null}
      {teamMemberCount > 0 ? (
        <>
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
              if (e.dataTransfer.types.includes(SLOT_DRAG_TYPE)) return;
              e.preventDefault();
              setDragging(true);
            }}
            onDragOver={(e) => {
              if (e.dataTransfer.types.includes(SLOT_DRAG_TYPE)) return;
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              if (e.dataTransfer.types.includes(SLOT_DRAG_TYPE)) return;
              e.preventDefault();
              setDragging(false);
              void handleFiles(e.dataTransfer.files);
            }}
            className={`rounded-[var(--radius-md)] border border-dashed px-4 py-3 text-center text-base ${
              dragging
                ? "border-[var(--primary)] bg-[var(--yellow)]/40"
                : "border-[var(--border)] bg-[var(--panel-soft)]"
            }`}
          >
            Tip: drag several photos onto this page to fill empty slots in order.
            Drag the grip on a teammate card to change who appears first.
          </div>
        </>
      ) : null}

      {error ? (
        <p className="rounded-xl border-2 border-[var(--primary)] bg-red-50 px-4 py-3 text-lg font-medium text-[var(--primary-dark)]">
          {error}
        </p>
      ) : null}

      {teamMemberCount > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {photos.map((photo, index) => {
            const isDragging = dragFromIndex === index;
            const isDropTarget =
              dropTargetIndex === index &&
              dragFromIndex !== null &&
              dragFromIndex !== index;
            return (
              <article
                key={photo.id}
                onDragOver={(e) => {
                  if (!e.dataTransfer.types.includes(SLOT_DRAG_TYPE)) return;
                  e.preventDefault();
                  e.dataTransfer.dropEffect = "move";
                  setDropTargetIndex(index);
                }}
                onDragLeave={(e) => {
                  if (e.currentTarget.contains(e.relatedTarget as Node)) return;
                  setDropTargetIndex((current) =>
                    current === index ? null : current,
                  );
                }}
                onDrop={(e) => {
                  if (!e.dataTransfer.types.includes(SLOT_DRAG_TYPE)) return;
                  e.preventDefault();
                  const raw = e.dataTransfer.getData(SLOT_DRAG_TYPE);
                  const from = Number.parseInt(raw, 10);
                  if (!Number.isNaN(from)) {
                    moveSlot(from, index);
                  }
                  clearSlotDrag();
                }}
                className={`flex gap-3 rounded-[var(--radius-md)] border bg-white p-4 transition ${
                  isDragging
                    ? "border-[var(--primary)] opacity-60"
                    : isDropTarget
                      ? "border-[var(--primary)] bg-[var(--yellow)]/30 ring-2 ring-[var(--primary)]"
                      : "border-[var(--ink)]"
                }`}
              >
                <div className="flex shrink-0 flex-col items-center gap-1">
                  <button
                    type="button"
                    draggable
                    aria-label={`Drag to reorder teammate ${index + 1}`}
                    title="Drag to reorder"
                    onDragStart={(e) => {
                      e.dataTransfer.setData(SLOT_DRAG_TYPE, String(index));
                      e.dataTransfer.effectAllowed = "move";
                      setDragFromIndex(index);
                    }}
                    onDragEnd={clearSlotDrag}
                    className="flex h-10 w-10 cursor-grab items-center justify-center rounded-lg border-2 border-[var(--ink)] bg-[var(--panel-soft)] text-[var(--ink)] active:cursor-grabbing"
                  >
                    <GripVertical className="h-5 w-5" />
                  </button>
                  <button
                    type="button"
                    aria-label={`Move teammate ${index + 1} up`}
                    disabled={index === 0}
                    onClick={() => moveSlot(index, index - 1)}
                    className="flex h-9 w-10 items-center justify-center rounded-lg border-2 border-[var(--ink)] bg-white text-[var(--ink)] disabled:cursor-not-allowed disabled:opacity-35"
                  >
                    <ChevronUp className="h-5 w-5" />
                  </button>
                  <button
                    type="button"
                    aria-label={`Move teammate ${index + 1} down`}
                    disabled={index >= photos.length - 1}
                    onClick={() => moveSlot(index, index + 1)}
                    className="flex h-9 w-10 items-center justify-center rounded-lg border-2 border-[var(--ink)] bg-white text-[var(--ink)] disabled:cursor-not-allowed disabled:opacity-35"
                  >
                    <ChevronDown className="h-5 w-5" />
                  </button>
                </div>

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
            );
          })}
        </div>
      ) : null}

      {teamMemberCount > 0 ? <PipSidePicker /> : null}
      <VideoPreview compact />
      <Timeline />

      <div className="flex flex-wrap justify-between gap-3 border-t-2 border-[var(--border)] pt-4">
        <button type="button" onClick={() => setStep(1)} className="btn-secondary">
          Back
        </button>
        <div className="flex items-center gap-2">
          <HelpTip title="Ready for the next step?">
            <p>
              When your photos and names look good, tap Continue to next step
              for Finish & Download.
            </p>
          </HelpTip>
          <button
            type="button"
            disabled={!video}
            onClick={() => setStep(3)}
            className="btn-primary min-w-[12rem]"
          >
            Continue to next step
          </button>
        </div>
      </div>
    </div>
  );
}
