"use client";

import { clsx } from "clsx";
import { PanelLeft, PanelRight } from "lucide-react";
import { HelpTip } from "@/components/HelpTip";
import { useStudio } from "@/lib/studio-context";
import type { PipSide } from "@/lib/template";

const OPTIONS: Array<{ id: PipSide; label: string; hint: string }> = [
  {
    id: "left",
    label: "Left side",
    hint: "Photo in the top-left corner (like the example)",
  },
  {
    id: "right",
    label: "Right side",
    hint: "Photo in the top-right corner with the same padding",
  },
];

export function PipSidePicker() {
  const { pipSide, setPipSide } = useStudio();

  return (
    <section className="rounded-2xl border-2 border-[var(--ink)] bg-white p-4 md:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-2xl font-bold text-[var(--ink)]">
            Where should team photos appear?
          </h3>
          <p className="mt-1 text-lg text-[var(--muted)]">
            Photos stay portrait-shaped with automatic padding. The video is
            always 16:9. You only choose left or right.
          </p>
        </div>
        <HelpTip title="Photo placement" size="lg">
          <p>
            Every teammate photo uses the same portrait frame near the top
            corner — with space from the edge so it never touches the border.
          </p>
          <p>
            Choose <strong>Left side</strong> or <strong>Right side</strong>.
            Pick the side that keeps your face clear in the main video.
          </p>
          <p>
            You do not resize or drag the photo. Size and padding are fixed for
            a professional look.
          </p>
        </HelpTip>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {OPTIONS.map((option) => {
          const selected = pipSide === option.id;
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => setPipSide(option.id)}
              className={clsx(
                "flex min-h-[6.5rem] items-center gap-3 rounded-2xl border-2 px-4 py-4 text-left transition focus-visible:outline focus-visible:outline-4 focus-visible:outline-[var(--yellow)]",
                selected
                  ? "border-[var(--ink)] bg-[var(--yellow)]"
                  : "border-[var(--border-strong)] bg-[var(--panel-soft)] hover:border-[var(--ink)]",
              )}
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--primary)] text-white">
                {option.id === "left" ? (
                  <PanelLeft className="h-6 w-6" />
                ) : (
                  <PanelRight className="h-6 w-6" />
                )}
              </span>
              <span>
                <span className="block text-xl font-bold text-[var(--ink)]">
                  {option.label}
                  {selected ? " ✓" : ""}
                </span>
                <span className="mt-1 block text-base text-[var(--muted)]">
                  {option.hint}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      {/* Simple visual diagram */}
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {OPTIONS.map((option) => (
          <div
            key={`preview-${option.id}`}
            className={clsx(
              "relative aspect-video overflow-hidden rounded-xl border-2",
              pipSide === option.id
                ? "border-[var(--primary)]"
                : "border-[var(--border)]",
            )}
            aria-hidden
          >
            <div className="absolute inset-0 bg-gradient-to-br from-[#334155] to-[#0f172a]" />
            <div
              className="absolute rounded-md border-2 border-white bg-[#cbd5e1]"
              style={{
                top: "6%",
                [option.id === "left" ? "left" : "right"]: "5%",
                width: "15.2%",
                height: "36%",
              }}
            />
            <p className="absolute bottom-2 left-0 right-0 text-center text-sm font-semibold text-white">
              16:9 video · portrait photo · {option.label.toLowerCase()}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
