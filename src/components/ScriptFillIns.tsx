"use client";

import { PenLine } from "lucide-react";
import { HelpTip } from "@/components/HelpTip";
import { useStudio } from "@/lib/studio-context";

/** Fill-in blanks for teleprompter placeholders like [Customer Name]. */
export function ScriptFillIns() {
  const { customerName, setCustomerName, speakerName, setSpeakerName } =
    useStudio();

  return (
    <section className="section-card space-y-4 bg-white p-4 md:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-2">
          <PenLine
            className="mt-0.5 h-5 w-5 shrink-0 text-[var(--primary)]"
            aria-hidden
          />
          <div>
            <h3 className="text-lg font-semibold tracking-tight text-[var(--ink)]">
              Script fill-ins
            </h3>
            <p className="mt-0.5 max-w-2xl text-[13px] font-medium text-[var(--muted)]">
              These replace the blanks in the official teleprompter script so
              you can read real names while recording.
            </p>
          </div>
        </div>
        <HelpTip title="Script fill-ins">
          <p>
            <strong>Customer name</strong> fills every “[Customer Name]” in the
            script.
          </p>
          <p>
            <strong>Your name</strong> fills every “[Your Name]” (you on
            camera).
          </p>
        </HelpTip>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <label className="block">
          <span className="field-label">Customer name</span>
          <input
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            className="field-input"
            placeholder="Example: Acme Logistics"
            autoComplete="off"
          />
        </label>
        <label className="block">
          <span className="field-label">Your name</span>
          <input
            value={speakerName}
            onChange={(e) => setSpeakerName(e.target.value)}
            className="field-input"
            placeholder="Example: Jordan Smith"
            autoComplete="name"
          />
        </label>
      </div>
    </section>
  );
}
