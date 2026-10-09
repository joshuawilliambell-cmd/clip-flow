"use client";

import { clsx } from "clsx";
import { PanelLeft, PanelRight } from "lucide-react";
import { HelpTip } from "@/components/HelpTip";
import { PanelSteps } from "@/components/PanelStep";
import { useStudio } from "@/lib/studio-context";
import type { PipSide } from "@/lib/template";

const OPTIONS: Array<{ id: PipSide; label: string; hint: string }> = [
  {
    id: "left",
    label: "Left Side",
    hint: "Small photo in the top-left corner",
  },
  {
    id: "right",
    label: "Right Side",
    hint: "Small photo in the top-right corner",
  },
];

export function PipSidePicker() {
  const { pipSide, setPipSide } = useStudio();

  return (
    <section className="section-card bg-white p-4 md:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold tracking-tight text-[var(--ink)]">
            Photo Corner Placement
          </h3>
        </div>
        <HelpTip title="Photo Corner Placement" size="lg">
          <p>
            When you introduce a teammate, a small photo of them can appear in
            one top corner of the video. Pick left or right so it does not cover
            your face.
          </p>
        </HelpTip>
      </div>

      <PanelSteps
        className="mt-3"
        steps={[
          <>
            Choose whether each teammate&apos;s small photo shows on the{" "}
            <strong>left</strong> or <strong>right</strong> side of the video.
          </>,
          <>
            Pick the side that keeps your face clear in the main video.
          </>,
          <>
            You do not resize or drag the photo frame — only left or right.
          </>,
        ]}
      />

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {OPTIONS.map((option) => {
          const selected = pipSide === option.id;
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => setPipSide(option.id)}
              className={clsx(
                "flex min-h-[6.5rem] items-center gap-3 rounded-[var(--radius-md)] border px-4 py-4 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--olive)]",
                selected
                  ? "border-[var(--ink)] bg-[var(--yellow)]"
                  : "border-[var(--border-strong)] bg-[var(--panel-soft)] hover:border-[var(--ink)]",
              )}
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--primary)] text-white">
                {option.id === "left" ? (
                  <PanelLeft className="h-6 w-6" />
                ) : (
                  <PanelRight className="h-6 w-6" />
                )}
              </span>
              <span>
                <span className="block text-xl font-bold text-[var(--ink)]">
                  Click Here for {option.label}
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
              Example · {option.label.toLowerCase()}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
