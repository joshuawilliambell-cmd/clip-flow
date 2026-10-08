"use client";

import { clsx } from "clsx";
import type { StudioStep } from "@/lib/types";

const STEPS: Array<{ id: StudioStep; label: string; hint: string }> = [
  { id: 1, label: "Add Your Video", hint: "Upload & trim" },
  { id: 2, label: "Add Your Team", hint: "Photos & timing" },
  { id: 3, label: "Preview & Download", hint: "Music & export" },
];

export function StepIndicator({
  step,
  onChange,
}: {
  step: StudioStep;
  onChange: (step: StudioStep) => void;
}) {
  return (
    <ol className="grid gap-2 md:grid-cols-3">
      {STEPS.map((item) => {
        const active = item.id === step;
        const done = item.id < step;
        return (
          <li key={item.id}>
            <button
              type="button"
              onClick={() => onChange(item.id)}
              className={clsx(
                "flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left transition",
                active &&
                  "border-[var(--primary)] bg-white shadow-[0_10px_30px_rgba(200,16,46,0.12)]",
                !active && done && "border-[var(--border)] bg-white/80",
                !active && !done && "border-transparent bg-white/40",
              )}
            >
              <span
                className={clsx(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold",
                  active && "bg-[var(--primary)] text-white",
                  done && !active && "bg-[var(--ink)] text-white",
                  !active && !done && "bg-black/10 text-[var(--muted)]",
                )}
              >
                {item.id}
              </span>
              <span>
                <span className="block font-display text-lg leading-none tracking-wide text-[var(--ink)]">
                  {item.label}
                </span>
                <span className="text-xs text-[var(--muted)]">{item.hint}</span>
              </span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}
