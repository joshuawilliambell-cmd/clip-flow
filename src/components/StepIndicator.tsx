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
    label: "1. Add Your Video",
    hint: "Upload your talking video",
    tip: "Start here. Upload the video of you speaking, then shorten it if it is longer than about one minute.",
  },
  {
    id: 2,
    label: "2. Add Your Team",
    hint: "Add photos and names",
    tip: "Next, add photos of teammates. Type each person’s name and job title. Drag the colored bars to choose when each photo shows.",
  },
  {
    id: 3,
    label: "3. Finish & Download",
    hint: "Music and save as MP4",
    tip: "Last step. Pick a music track, set volumes, watch the preview, then tap Export to MP4 and download your finished video.",
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
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <h2 className="text-xl font-bold text-[var(--ink)] md:text-2xl">
          Follow these 3 steps
        </h2>
        <HelpTip title="How the steps work">
          <p>You only need to do three things, in order.</p>
          <p>Tap a step button to jump there. Yellow means the step you are on now.</p>
          <p>If you get stuck, tap any yellow ? for plain-language help.</p>
        </HelpTip>
      </div>
      <ol className="grid gap-3 md:grid-cols-3">
        {STEPS.map((item) => {
          const active = item.id === step;
          const done = item.id < step;
          return (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => onChange(item.id)}
                className={clsx(
                  "flex min-h-[5.5rem] w-full items-center gap-3 rounded-2xl border-2 px-4 py-4 text-left transition focus-visible:outline focus-visible:outline-4 focus-visible:outline-[var(--olive)]",
                  active &&
                    "border-[var(--ink)] bg-[var(--yellow-bright)] shadow-[0_6px_0_rgba(58,58,31,0.18)]",
                  !active && done && "border-[var(--primary)] bg-white",
                  !active && !done && "border-[var(--ink)] bg-white/90",
                )}
              >
                <span
                  className={clsx(
                    "flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-xl font-extrabold",
                    active && "bg-[var(--olive)] text-[var(--yellow)]",
                    done && !active && "bg-[var(--primary)] text-white",
                    !active && !done && "bg-black/10 text-[var(--ink)]",
                  )}
                >
                  {item.id}
                </span>
                <span className="min-w-0">
                  <span className="block text-lg font-bold leading-tight text-[var(--ink)] md:text-xl">
                    {item.label.replace(/^\d+\.\s*/, "")}
                  </span>
                  <span className="mt-1 block text-base text-[var(--muted)]">
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
