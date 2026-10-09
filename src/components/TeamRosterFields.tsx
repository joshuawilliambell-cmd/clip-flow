"use client";

import { useRef, useState } from "react";
import { ImagePlus, Trash2, Users } from "lucide-react";
import { HelpTip } from "@/components/HelpTip";
import { JobTitleField } from "@/components/JobTitleField";
import { defaultDutiesForTitle } from "@/lib/job-titles";
import { useStudio } from "@/lib/studio-context";
import type { TeamPhotoPronoun } from "@/lib/types";

type TeamRosterFieldsProps = {
  /** Compact copy for Step 1 before recording. */
  variant?: "setup" | "review";
};

/**
 * Photo + name + job title for each teammate slot.
 * Used early in Step 1 so the teleprompter can speak real names;
 * photos and titles carry into Step 2 for PIP timing.
 */
export function TeamRosterFields({ variant = "setup" }: TeamRosterFieldsProps) {
  const {
    photos,
    teamMemberCount,
    updatePhotoMeta,
    reorderTeamSlots,
    setPhotoOnSlot,
    clearPhotoSlot,
  } = useStudio();
  const fileRefs = useRef<Array<HTMLInputElement | null>>([]);
  const [error, setError] = useState<string | null>(null);

  if (teamMemberCount === 0) return null;

  const handleSlotFile = async (id: string, file: File | undefined) => {
    if (!file) return;
    setError(null);
    try {
      await setPhotoOnSlot(id, file);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed. Please try again.");
    }
  };

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
                ? "Add a photo, name, pronoun, job title, and short duties for each person in the order you’ll introduce them — they fill the teleprompter script."
                : "Review photos, names, and titles. Adjust PIP timing on the timeline below."}
            </p>
          </div>
        </div>
        <HelpTip title="Teammate order">
          <p>Slot 1 is introduced first. Use ↑ ↓ to change order.</p>
          <p>
            Pick a job title from the list, or choose <strong>Other</strong> to
            type a custom title. Duties default from the title — edit them to
            match how you want to introduce that person.
          </p>
          <p>
            Example: “This is Jared, and he is a Total Truck Care Account
            Manager, and he can help you with things like maintenance and
            repairs…”
          </p>
        </HelpTip>
      </div>

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
            <div className="flex shrink-0 flex-col items-center gap-2">
              <button
                type="button"
                onClick={() => fileRefs.current[index]?.click()}
                className="relative h-24 w-20 overflow-hidden rounded-xl border-2 border-[var(--ink)] bg-white"
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
                className="hidden"
                onChange={(e) => {
                  void handleSlotFile(photo.id, e.target.files?.[0]);
                  e.currentTarget.value = "";
                }}
              />
              {photo.url ? (
                <button
                  type="button"
                  onClick={() => clearPhotoSlot(photo.id)}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-[var(--primary)]"
                >
                  <Trash2 className="h-3 w-3" /> Clear
                </button>
              ) : null}
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
                    disabled={index === 0}
                    onClick={() => reorderTeamSlots(index, index - 1)}
                    className="rounded border border-[var(--ink)] bg-white px-2 py-0.5 text-[12px] font-semibold disabled:opacity-35"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    aria-label={`Move teammate ${index + 1} down`}
                    disabled={index >= photos.length - 1}
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

              <label className="block">
                <span className="field-label">Pronoun</span>
                <select
                  value={photo.pronoun}
                  onChange={(e) =>
                    updatePhotoMeta(photo.id, {
                      pronoun: e.target.value as TeamPhotoPronoun,
                    })
                  }
                  className="field-input"
                >
                  <option value="">Select…</option>
                  <option value="he">he</option>
                  <option value="she">she</option>
                  <option value="they">they</option>
                </select>
              </label>

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
