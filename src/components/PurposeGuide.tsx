"use client";

import { HelpTip } from "@/components/HelpTip";

/**
 * Short purpose / how-this-fits-Allego guide for Love's employees.
 */
export function PurposeGuide() {
  return (
    <section
      aria-labelledby="purpose-heading"
      className="mb-6 rounded-3xl border-2 border-[var(--ink)] bg-[var(--yellow)] p-5 md:p-6"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="max-w-3xl">
          <h2
            id="purpose-heading"
            className="font-display text-3xl tracking-wide text-[var(--ink)] md:text-4xl"
          >
            Why we make this video
          </h2>
          <p className="mt-3 text-lg font-medium leading-relaxed text-[var(--ink)] md:text-xl">
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

      <ol className="mt-5 grid gap-3 md:grid-cols-3">
        <li className="rounded-2xl border-2 border-[var(--ink)] bg-white p-4">
          <p className="text-sm font-bold uppercase tracking-wide text-[var(--primary)]">
            In this tool
          </p>
          <p className="mt-2 text-lg font-medium leading-snug text-[var(--ink)]">
            Record or upload yourself speaking. Add still photos of teammates
            with their names and titles. Keep it brief and friendly.
          </p>
        </li>
        <li className="rounded-2xl border-2 border-[var(--ink)] bg-white p-4">
          <p className="text-sm font-bold uppercase tracking-wide text-[var(--primary)]">
            Then in Allego
          </p>
          <p className="mt-2 text-lg font-medium leading-snug text-[var(--ink)]">
            Download your MP4 and upload it to Allego. Use it in a digital sales
            room for your customer.
          </p>
        </li>
        <li className="rounded-2xl border-2 border-[var(--ink)] bg-white p-4">
          <p className="text-sm font-bold uppercase tracking-wide text-[var(--primary)]">
            Share with customers
          </p>
          <p className="mt-2 text-lg font-medium leading-snug text-[var(--ink)]">
            Send the Allego sales room link so customers can watch your team
            intro anytime.
          </p>
        </li>
      </ol>

      <div className="mt-5 rounded-2xl border-2 border-[var(--ink)] bg-white px-4 py-4">
        <p className="text-base font-bold text-[var(--ink)] md:text-lg">
          Simple recipe for a good video
        </p>
        <ul className="mt-2 space-y-2 text-base leading-relaxed text-[var(--ink)] md:text-lg">
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
        </ul>
      </div>
    </section>
  );
}
