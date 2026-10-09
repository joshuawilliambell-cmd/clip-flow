"use client";

import { HelpTip } from "@/components/HelpTip";

/**
 * Compact purpose line — details live in the help tip.
 */
export function PurposeGuide() {
  return (
    <section
      aria-labelledby="purpose-heading"
      className="studio-panel mb-5 flex flex-wrap items-center justify-between gap-3 px-4 py-3 md:px-5"
    >
      <div className="min-w-0 max-w-3xl">
        <h2
          id="purpose-heading"
          className="font-display text-lg tracking-tight text-[var(--ink)] md:text-xl"
        >
          ~60s preferred Allego intro (longer OK)
        </h2>
        <p className="mt-0.5 text-[14px] font-medium text-[var(--muted)]">
          Record yourself, add teammate photos, export an MP4 for your sales
          room.
        </p>
      </div>
      <HelpTip title="Why this matters" size="lg">
        <p>
          Customers trust people they recognize. This short video puts faces
          and names with your team.
        </p>
        <p>
          After you finish, upload the MP4 to Allego and place it in a digital
          sales room.
        </p>
        <p>
          About 60 seconds is preferred (longer is fine). Introduce one teammate
          at a time while their photo is on screen.
        </p>
      </HelpTip>
    </section>
  );
}
