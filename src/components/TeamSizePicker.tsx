"use client";

import { clsx } from "clsx";
import { Users } from "lucide-react";
import { HelpTip } from "@/components/HelpTip";
import { useStudio } from "@/lib/studio-context";
import {
  TEAM_MEMBER_COUNT_OPTIONS,
  type TeamMemberCount,
} from "@/lib/template";

const LABELS: Record<TeamMemberCount, string> = {
  0: "Just me",
  1: "1 person",
  2: "2 people",
  3: "3 people",
  4: "4 people",
};

type TeamSizePickerProps = {
  /** Slightly tighter copy when embedded inside thumbnail mode. */
  compact?: boolean;
};

export function TeamSizePicker({ compact }: TeamSizePickerProps) {
  const { teamMemberCount, setTeamMemberCount } = useStudio();
  const options = compact
    ? TEAM_MEMBER_COUNT_OPTIONS.filter((n) => n > 0)
    : TEAM_MEMBER_COUNT_OPTIONS;

  return (
    <section className="rounded-2xl border-2 border-[var(--ink)] bg-white p-4 md:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[var(--primary)] text-white">
            <Users className="h-6 w-6" />
          </span>
          <div>
            <h3 className="text-2xl font-extrabold text-[var(--ink)]">
              {compact
                ? "How many people on this thumbnail?"
                : "How many teammates will you introduce?"}
            </h3>
            <p className="mt-1 text-lg font-semibold text-[var(--muted)]">
              {compact
                ? "Pick 1–4. The Love’s Team template shows that many portrait cards."
                : "Pick 0–4. This sets photo slots, the thumbnail layout, and the teleprompter script."}
            </p>
          </div>
        </div>
        <HelpTip title="Team size" size="lg">
          <p>
            Choose how many teammates you will introduce (not counting yourself
            on camera).
          </p>
          <p>
            <strong>Just me (0)</strong> means no photo overlays — the
            teleprompter loads the Fleet Hub script with no introductions.
          </p>
          <p>
            For 1–4, the tool creates that many photo slots and loads the
            matching script for you to read while recording.
          </p>
        </HelpTip>
      </div>

      <div
        className={clsx(
          "mt-4 grid gap-3",
          compact ? "grid-cols-2 md:grid-cols-4" : "grid-cols-2 md:grid-cols-5",
        )}
      >
        {options.map((count) => {
          const selected = teamMemberCount === count;
          return (
            <button
              key={count}
              type="button"
              onClick={() => setTeamMemberCount(count)}
              className={clsx(
                "min-h-[5.5rem] rounded-2xl border-2 px-3 py-4 text-center transition focus-visible:outline focus-visible:outline-4 focus-visible:outline-[var(--olive)]",
                selected
                  ? "border-[var(--ink)] bg-[var(--yellow-bright)]"
                  : "border-[var(--border-strong)] bg-[var(--panel-soft)] hover:border-[var(--ink)]",
              )}
            >
              <span className="block text-4xl font-extrabold text-[var(--ink)]">
                {count}
              </span>
              <span className="mt-1 block text-base font-bold text-[var(--ink)]">
                {LABELS[count]}
                {selected ? " ✓" : ""}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
