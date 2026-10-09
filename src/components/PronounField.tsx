"use client";

import { clsx } from "clsx";
import type { TeamPhotoPronoun } from "@/lib/types";

const OPTIONS: Array<{ value: Exclude<TeamPhotoPronoun, "">; label: string }> =
  [
    { value: "he", label: "he" },
    { value: "she", label: "she" },
  ];

type PronounFieldProps = {
  value: TeamPhotoPronoun;
  onChange: (pronoun: TeamPhotoPronoun) => void;
  id?: string;
};

/** he / she picker for the teleprompter script. */
export function PronounField({ value, onChange, id }: PronounFieldProps) {
  return (
    <div className="block">
      <span className="field-label" id={id ? `${id}-label` : undefined}>
        Pronoun (for script)
      </span>
      <div
        role="group"
        aria-labelledby={id ? `${id}-label` : undefined}
        className="grid grid-cols-2 gap-1.5"
      >
        {OPTIONS.map((option) => {
          const selected = value === option.value;
          return (
            <button
              key={option.value}
              type="button"
              id={id && selected ? id : undefined}
              aria-pressed={selected}
              onClick={() =>
                onChange(selected ? "" : option.value)
              }
              className={clsx(
                "min-h-[2.65rem] rounded-[var(--radius-md)] border px-2 py-2 text-[15px] font-semibold capitalize transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--olive)]",
                selected
                  ? "border-[var(--ink)] bg-[var(--yellow)] text-[var(--ink)]"
                  : "border-[var(--ink)] bg-white text-[var(--ink)] hover:bg-[var(--panel-soft)]",
              )}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
