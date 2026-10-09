"use client";

import { HelpTip } from "@/components/HelpTip";

/**
 * Short purpose / how-this-fits-Allego guide for Love's employees.
 */
export function PurposeGuide() {
  return (
    <section
      aria-labelledby="purpose-heading"
      className="studio-panel mb-5 p-4 md:p-5"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="max-w-3xl">
          <h2
            id="purpose-heading"
            className="font-display text-2xl tracking-tight text-[var(--ink)] md:text-3xl"
          >
            Why we make this video
          </h2>
          <p className="mt-2 text-[15px] font-medium leading-relaxed text-[var(--muted)] md:text-[16px]">
            Create a short (~60 second) introduction so customers can meet you
            and your Love&apos;s team before a sales conversation.
          </p>
        </div>
        <HelpTip title="Why this matters" size="lg">
          <p>
            Customers trust people they recognize. This short video puts faces
            and names with your team.
          </p>
          <p>
            After you finish here, you upload the video to Allego and place it
            in a digital sales room you can share with customers.
          </p>
        </HelpTip>
      </div>

      <ol className="mt-4 grid gap-2.5 md:grid-cols-3">
        <li className="rounded-[var(--radius-md)] border border-[var(--hairline)] bg-[var(--panel-soft)] p-3.5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--primary)]">
            In this tool
          </p>
          <p className="mt-1.5 text-[14px] font-medium leading-snug text-[var(--ink)]">
            Record or upload yourself speaking. Add still photos of teammates
            with their names and titles. Keep it brief and clear.
          </p>
        </li>
        <li className="rounded-[var(--radius-md)] border border-[var(--hairline)] bg-[var(--panel-soft)] p-3.5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--primary)]">
            Then in Allego
          </p>
          <p className="mt-1.5 text-[14px] font-medium leading-snug text-[var(--ink)]">
            Download your MP4 and upload it to Allego. Use it in a digital sales
            room for your customer.
          </p>
        </li>
        <li className="rounded-[var(--radius-md)] border border-[var(--hairline)] bg-[var(--panel-soft)] p-3.5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--primary)]">
            Share with customers
          </p>
          <p className="mt-1.5 text-[14px] font-medium leading-snug text-[var(--ink)]">
            Send the Allego sales room link so customers can watch your team
            intro anytime.
          </p>
        </li>
      </ol>

      <div className="mt-4 rounded-[var(--radius-md)] border border-[var(--ink)] bg-white px-4 py-3.5">
        <p className="text-[14px] font-semibold tracking-tight text-[var(--ink)]">
          Simple recipe for a good video
        </p>
        <ul className="mt-2 space-y-1.5 text-[14px] leading-relaxed text-[var(--ink)]">
          <li>
            <strong>Aim for about 60 seconds.</strong> Say who you are, who is
            on the team, and how you help the customer.
          </li>
          <li>
            <strong>Show one teammate at a time</strong> with their photo, name,
            and job title on screen while you introduce them.
          </li>
          <li>
            <strong>Stay clear and natural.</strong> No fancy editing—this tool
            handles the look for you.
          </li>
          <li>
            <strong>Need recording help?</strong> In Step 1, tap your device
            (computer, iPhone, Android, or separate camera) for setup tips.
          </li>
        </ul>
      </div>
    </section>
  );
}
