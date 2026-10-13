"use client";

import { ImageIcon } from "lucide-react";
import { HelpTip } from "@/components/HelpTip";
import { getScriptTopic } from "@/lib/script-topics";
import { useStudio } from "@/lib/studio-context";

/** Shows the auto-loaded product PIP screenshots for the selected script. */
export function ProductPipPreview() {
  const { scriptTopic, photos } = useStudio();
  const topic = getScriptTopic(scriptTopic);
  if (topic.isTeamIntro) return null;

  const filled = photos.filter((p) => p.url);

  return (
    <section className="section-card bg-white p-4 md:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--primary)] text-white">
            <ImageIcon className="h-5 w-5" />
          </span>
          <div>
            <h3 className="text-lg font-semibold tracking-tight text-[var(--ink)] md:text-xl">
              Topic Photos (PIP)
            </h3>
            <p className="mt-0.5 text-[14px] font-medium text-[var(--muted)]">
              These screenshots appear in the corner when you say each cue in
              the script — like teammate names cue teammate photos.
            </p>
          </div>
        </div>
        <HelpTip title="Topic photos">
          <p>
            Each image is timed to a phrase in the official script. You can
            still move the bars on the Step 2 timeline if the timing looks off.
          </p>
        </HelpTip>
      </div>

      <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filled.map((photo) => (
          <li
            key={photo.id}
            className="overflow-hidden rounded-[var(--radius-md)] border border-[var(--ink)] bg-[var(--panel-soft)]"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photo.url ?? ""}
              alt={photo.title || photo.name}
              className="aspect-video w-full object-cover object-top"
            />
            <div className="border-t border-[var(--border)] px-3 py-2">
              <p className="text-[13px] font-bold text-[var(--ink)]">
                {photo.title || photo.name}
              </p>
              <p className="text-[12px] font-medium text-[var(--muted)]">
                Cue: “{photo.name}”
              </p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
