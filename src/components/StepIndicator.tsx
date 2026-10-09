"use client";

import { clsx } from "clsx";
import type { StudioStep } from "@/lib/types";
import { HelpTip } from "@/components/HelpTip";

const STEPS: Array<{
  id: StudioStep;
  label: string;
  hint: string;
  tip: string;
}> = [
  {
    id: 1,
    label: "1. Prepare Your Video",
    hint: "Team, script, record or upload",
    tip: "Add teammates, fill the script, optionally build a thumbnail, then record or upload your talking video.",
  },
  {
    id: 2,
    label: "2. Finish & Download",
    hint: "Edit, music, and save as MP4",
    tip: "Trim the clip, place and time teammate photos, pick music, preview, then export and download your finished video.",
  },
];

export function StepIndicator({
  step,
  onChange,
}: {
  step: StudioStep;
  onChange: (step: StudioStep) => void;
}) {
  return (
    <div className="space-y-2.5">
      <div className="flex items-center gap-2">
        <h2 className="font-display text-lg font-semibold tracking-tight text-[var(--ink)] md:text-xl">
          Workflow
        </h2>
        <HelpTip title="How the steps work">
          <p>You only need to do two things, in order.</p>
          <p>
            Tap a step to jump there. Yellow means the step you are on now.
          </p>
          <p>If you get stuck, tap any ? for plain-language help.</p>
        </HelpTip>
      </div>
      <ol className="grid gap-2.5 md:grid-cols-2">
        {STEPS.map((item) => {
          const active = item.id === step;
          const done = item.id < step;
          return (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => onChange(item.id)}
                className={clsx(
                  "flex min-h-[4.75rem] w-full items-center gap-3 border px-3.5 py-3 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--olive)]",
                  "rounded-[var(--radius-md)]",
                  active && "border-[var(--ink)] bg-[var(--yellow-bright)]",
                  !active && done && "border-[var(--primary)] bg-white",
                  !active &&
                    !done &&
                    "border-[var(--hairline)] bg-white/95 hover:border-[var(--ink)]",
                )}
              >
                <span
                  className={clsx(
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-sm)] text-[15px] font-bold tabular-nums",
                    active && "bg-[var(--olive)] text-[var(--yellow)]",
                    done && !active && "bg-[var(--primary)] text-white",
                    !active && !done && "bg-[var(--panel-soft)] text-[var(--ink)]",
                  )}
                >
                  {item.id}
                </span>
                <span className="min-w-0">
                  <span className="block text-[15px] font-semibold leading-tight tracking-tight text-[var(--ink)] md:text-[16px]">
                    {item.label.replace(/^\d+\.\s*/, "")}
                  </span>
                  <span className="mt-0.5 block text-[13px] font-medium text-[var(--muted)]">
                    {item.hint}
                  </span>
                </span>
              </button>
              <p className="sr-only">{item.tip}</p>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
