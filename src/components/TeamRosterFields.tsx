"use client";

import { Users } from "lucide-react";
import { HelpTip } from "@/components/HelpTip";
import { useStudio } from "@/lib/studio-context";

type TeamRosterFieldsProps = {
  /** Compact copy for Step 1 before recording. */
  variant?: "setup" | "review";
};

/**
 * Name + job title for each teammate slot.
 * Used early in Step 1 so the teleprompter can speak real names;
 * values carry into Step 2 where photos are added.
 */
export function TeamRosterFields({ variant = "setup" }: TeamRosterFieldsProps) {
  const { photos, teamMemberCount, updatePhotoMeta, reorderTeamSlots } =
    useStudio();

  if (teamMemberCount === 0) return null;

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
              {variant === "setup" ? "Teammate names & titles" : "Your team"}
            </h3>
            <p className="mt-0.5 max-w-2xl text-[13px] font-medium text-[var(--muted)]">
              {variant === "setup"
                ? "Enter each person in the order you’ll introduce them. These names fill into the teleprompter script — you’ll add photos in Step 2."
                : "Names and titles from Step 1. Add a headshot for each person below."}
            </p>
          </div>
        </div>
        <HelpTip title="Teammate order">
          <p>
            Slot 1 is introduced first. Use ↑ ↓ later in Step 2 if you need to
            reorder after photos are in.
          </p>
          <p>
            Job titles appear in the script after each name (for example,
            “This is Jared, Total Truck Care.”).
          </p>
        </HelpTip>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {photos.map((photo, index) => (
          <div
            key={photo.id}
            className="space-y-2 rounded-[var(--radius-md)] border border-[var(--ink)] bg-[var(--panel-soft)] p-3"
          >
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
              <span className="field-label">Job title</span>
              <input
                value={photo.title}
                onChange={(e) =>
                  updatePhotoMeta(photo.id, { title: e.target.value })
                }
                className="field-input"
                placeholder="Example: Total Truck Care"
                autoComplete="off"
              />
            </label>
          </div>
        ))}
      </div>
    </section>
  );
}
