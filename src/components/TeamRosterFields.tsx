"use client";

import { useRef, useState } from "react";
import { ImagePlus, Replace, Trash2, Users } from "lucide-react";
import { HelpTip } from "@/components/HelpTip";
import { JobTitleField } from "@/components/JobTitleField";
import { PronounField } from "@/components/PronounField";
import { defaultDutiesForTitle } from "@/lib/job-titles";
import { useStudio } from "@/lib/studio-context";

type TeamRosterFieldsProps = {
  /** Compact copy for Step 1 before recording. */
  variant?: "setup" | "review";
};

/**
 * Photo + name + job title for each teammate slot.
 * Used early in Step 1 so the teleprompter can speak real names;
 * photos and titles carry into Step 2 for PIP placement and timing.
 */
export function TeamRosterFields({ variant = "setup" }: TeamRosterFieldsProps) {
  const {
    photos,
    teamMemberCount,
    updatePhotoMeta,
    reorderTeamSlots,
    setPhotoOnSlot,
    assignPhotosFromIndex,
    clearPhotoSlot,
  } = useStudio();
  const multiRef = useRef<HTMLInputElement>(null);
  const fileRefs = useRef<Array<HTMLInputElement | null>>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (teamMemberCount === 0) return null;

  const handleMultiFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    setBusy(true);
    setError(null);
    try {
      await assignPhotosFromIndex(0, files);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const handleSlotFiles = async (
    startIndex: number,
    slotId: string,
    files: FileList | null,
  ) => {
    if (!files?.length) return;
    setBusy(true);
    setError(null);
    try {
      if (files.length === 1) {
        await setPhotoOnSlot(slotId, files[0]);
      } else {
        await assignPhotosFromIndex(startIndex, files);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const emptySlots = photos.filter((p) => !p.url).length;

  return (
    <section className="section-card space-y-4 bg-white p-4 md:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-2">
          <Users
            className="mt-0.5 h-5 w-5 shrink-0 text-[var(--primary)]"
            aria-hidden
          />
          <div>
            <h3 className="text-lg font-semibold tracking-tight text-[var(--ink)]">
              {variant === "setup" ? "Your teammates" : "Your team"}
            </h3>
            <p className="mt-0.5 max-w-2xl text-[13px] font-medium text-[var(--muted)]">
              {variant === "setup"
                ? "These people get PIP photo overlays in the video and “This is…” lines in the script. You (the speaker) are not listed here — your photo is thumbnail-only in Your introduction."
                : "Replace or remove teammate photos here, then set corner and timing below. You are not a PIP overlay."}
            </p>
          </div>
        </div>
        <HelpTip title="Teammate photos">
          <p>
            These slots are for <strong>other teammates</strong> who appear as
            picture-in-picture during the video. Your own featured photo stays
            on the thumbnail only.
          </p>
          <p>
            Tap <strong>Replace photo</strong> (or the thumbnail) to pick a new
            headshot. Tap <strong>Remove</strong> to clear that slot.
          </p>
          {variant === "setup" ? (
            <>
              <p>
                Tap <strong>Select multiple photos</strong> and choose several
                headshots (Ctrl/Cmd+click or Shift+click). They fill Teammate 1,
                2, 3… in the order you selected.
              </p>
              <p>
                You can also open one box and pick multiple files — they fill
                that box and the ones after it.
              </p>
            </>
          ) : null}
          <p>Slot 1 is introduced first. Use ↑ ↓ to change order.</p>
        </HelpTip>
      </div>

      {variant === "setup" ? (
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => multiRef.current?.click()}
            className="btn-yellow"
          >
            <ImagePlus className="h-5 w-5" />
            {busy
              ? "Adding photos…"
              : `Select multiple photos (${teamMemberCount} slots)`}
          </button>
          <p className="text-[13px] font-medium text-[var(--muted)]">
            {emptySlots === 0
              ? "All boxes have photos — selecting again replaces them in order."
              : `${emptySlots} empty · pick up to ${teamMemberCount} images`}
          </p>
          <input
            ref={multiRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
            multiple
            className="hidden"
            onChange={(e) => {
              void handleMultiFiles(e.target.files);
              e.currentTarget.value = "";
            }}
          />
        </div>
      ) : null}

      {error ? (
        <p className="rounded-[var(--radius-sm)] border border-[var(--primary)] bg-red-50 px-3 py-2 text-[14px] font-medium text-[var(--primary-dark)]">
          {error}
        </p>
      ) : null}

      <div className="grid gap-3 md:grid-cols-2">
        {photos.map((photo, index) => (
          <div
            key={photo.id}
            className="flex gap-3 rounded-[var(--radius-md)] border border-[var(--ink)] bg-[var(--panel-soft)] p-3"
          >
            <div className="flex w-[5.75rem] shrink-0 flex-col items-stretch gap-1.5">
              <button
                type="button"
                disabled={busy}
                onClick={() => fileRefs.current[index]?.click()}
                aria-label={
                  photo.url
                    ? `Replace photo for teammate ${index + 1}`
                    : `Add photo for teammate ${index + 1}`
                }
                className="relative h-24 w-full overflow-hidden rounded-xl border-2 border-[var(--ink)] bg-white disabled:opacity-60"
              >
                {photo.url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={photo.url}
                    alt={photo.name || `Teammate ${index + 1}`}
                    className="h-full w-full object-cover object-[center_28%]"
                  />
                ) : (
                  <span className="flex h-full flex-col items-center justify-center gap-1 px-1 text-center text-[11px] font-semibold text-[var(--ink)]">
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
                multiple
                className="hidden"
                onChange={(e) => {
                  void handleSlotFiles(index, photo.id, e.target.files);
                  e.currentTarget.value = "";
                }}
              />
              {photo.url ? (
                <>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => fileRefs.current[index]?.click()}
                    className="inline-flex items-center justify-center gap-1 rounded-md border-2 border-[var(--ink)] bg-white px-1.5 py-1.5 text-[11px] font-bold text-[var(--ink)] hover:bg-[var(--yellow)] disabled:opacity-50"
                  >
                    <Replace className="h-3.5 w-3.5 shrink-0" />
                    Replace photo
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => clearPhotoSlot(photo.id)}
                    className="inline-flex items-center justify-center gap-1 rounded-md border-2 border-[var(--primary)] bg-white px-1.5 py-1.5 text-[11px] font-bold text-[var(--primary)] hover:bg-red-50 disabled:opacity-50"
                  >
                    <Trash2 className="h-3.5 w-3.5 shrink-0" />
                    Remove
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => fileRefs.current[index]?.click()}
                  className="inline-flex items-center justify-center gap-1 rounded-md border-2 border-[var(--ink)] bg-[var(--yellow)] px-1.5 py-1.5 text-[11px] font-bold text-[var(--ink)] disabled:opacity-50"
                >
                  <ImagePlus className="h-3.5 w-3.5 shrink-0" />
                  Add photo
                </button>
              )}
            </div>

            <div className="min-w-0 flex-1 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <p className="text-[12px] font-bold uppercase tracking-wide text-[var(--muted)]">
                  Teammate {index + 1}
                </p>
                <div className="flex gap-1">
                  <button
                    type="button"
                    aria-label={`Move teammate ${index + 1} up`}
                    disabled={index === 0 || busy}
                    onClick={() => reorderTeamSlots(index, index - 1)}
                    className="rounded border border-[var(--ink)] bg-white px-2 py-0.5 text-[12px] font-semibold disabled:opacity-35"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    aria-label={`Move teammate ${index + 1} down`}
                    disabled={index >= photos.length - 1 || busy}
                    onClick={() => reorderTeamSlots(index, index + 1)}
                    className="rounded border border-[var(--ink)] bg-white px-2 py-0.5 text-[12px] font-semibold disabled:opacity-35"
                  >
                    ↓
                  </button>
                </div>
              </div>

              <label className="block">
                <span className="field-label">Name</span>
                <input
                  value={photo.name}
                  onChange={(e) =>
                    updatePhotoMeta(photo.id, { name: e.target.value })
                  }
                  className="field-input"
                  placeholder="Example: Jared"
                  autoComplete="off"
                />
              </label>

              <PronounField
                id={`pronoun-${photo.id}`}
                value={photo.pronoun}
                onChange={(pronoun) => updatePhotoMeta(photo.id, { pronoun })}
              />

              <JobTitleField
                id={`job-title-${photo.id}`}
                value={photo.title}
                onChange={(title) => {
                  const suggested = defaultDutiesForTitle(title);
                  const priorDefault = defaultDutiesForTitle(photo.title);
                  const dutiesStillDefault =
                    !photo.duties.trim() || photo.duties.trim() === priorDefault;
                  updatePhotoMeta(photo.id, {
                    title,
                    ...(dutiesStillDefault && suggested
                      ? { duties: suggested }
                      : {}),
                  });
                }}
              />

              <label className="block">
                <span className="field-label">Job duties (for script)</span>
                <input
                  value={photo.duties}
                  onChange={(e) =>
                    updatePhotoMeta(photo.id, { duties: e.target.value })
                  }
                  className="field-input"
                  placeholder="Example: maintenance, repairs, and uptime"
                  autoComplete="off"
                />
              </label>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
