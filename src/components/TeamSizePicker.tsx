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
  compact?: boolean;
};

export function TeamSizePicker({ compact }: TeamSizePickerProps) {
  const { teamMemberCount, setTeamMemberCount } = useStudio();
  const options = compact
    ? TEAM_MEMBER_COUNT_OPTIONS.filter((n) => n > 0)
    : TEAM_MEMBER_COUNT_OPTIONS;

  return (
    <section className="section-card bg-white p-4 md:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--primary)] text-white">
            <Users className="h-5 w-5" />
          </span>
          <div>
            <h3 className="text-lg font-semibold tracking-tight text-[var(--ink)] md:text-xl">
              {compact ? "People On Thumbnail" : "Teammates To Introduce"}
            </h3>
            <p className="mt-0.5 text-[14px] font-medium text-[var(--muted)]">
              {compact
                ? "Choose 1–4."
                : "Choose how many teammates you will introduce (not counting you)."}
            </p>
          </div>
        </div>
        <HelpTip title="Team size" size="lg">
          <p>
            <strong>Just me (0)</strong> — no photo overlays; you still
            introduce yourself in the script opening. Optional thumbnail can
            use your featured photo.
          </p>
          <p>
            For 1–4, teammate photo slots and “This is…” script lines update
            automatically. You are not counted as a teammate in the script.
          </p>
        </HelpTip>
      </div>

      <div
        className={clsx(
          "mt-3 grid gap-2.5",
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
                "min-h-[4.5rem] rounded-[var(--radius-md)] border px-3 py-3 text-center transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--olive)]",
                selected
                  ? "border-[var(--ink)] bg-[var(--yellow-bright)]"
                  : "border-[var(--hairline)] bg-[var(--panel-soft)] hover:border-[var(--ink)]",
              )}
            >
              <span className="block text-3xl font-semibold tabular-nums text-[var(--ink)]">
                {count}
              </span>
              <span className="mt-0.5 block text-[13px] font-semibold text-[var(--ink)]">
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
