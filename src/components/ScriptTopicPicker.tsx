"use client";

import { clsx } from "clsx";
import { ScrollText } from "lucide-react";
import { HelpTip } from "@/components/HelpTip";
import { SCRIPT_TOPIC_OPTIONS, type ScriptTopic } from "@/lib/intro-script";
import { useStudio } from "@/lib/studio-context";

/** Choose which official teleprompter script to present. */
export function ScriptTopicPicker() {
  const { scriptTopic, setScriptTopic } = useStudio();

  return (
    <section className="section-card bg-white p-4 md:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--primary)] text-white">
            <ScrollText className="h-5 w-5" />
          </span>
          <div>
            <h3 className="text-lg font-semibold tracking-tight text-[var(--ink)] md:text-xl">
              What Are You Presenting?
            </h3>
            <p className="mt-0.5 text-[14px] font-medium text-[var(--muted)]">
              Pick the official script that matches your customer video.
            </p>
          </div>
        </div>
        <HelpTip title="Script topic" size="lg">
          <p>
            <strong>Fleet Hub Welcome</strong> introduces you and your teammates
            inside the customer&apos;s Fleet Hub.
          </p>
          <p>
            <strong>Love&apos;s Express Billing</strong> explains the fuel card
            program in plain language a rep can present to a customer.
          </p>
          <p>
            Your name blanks and teammate lines still fill in either script. You
            can edit wording anytime in the teleprompter.
          </p>
        </HelpTip>
      </div>

      <div
        className="mt-4 flex flex-wrap gap-2"
        role="radiogroup"
        aria-label="Official script topic"
      >
        {SCRIPT_TOPIC_OPTIONS.map((option) => {
          const selected = scriptTopic === option.id;
          return (
            <button
              key={option.id}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => setScriptTopic(option.id as ScriptTopic)}
              className={clsx(
                "max-w-full rounded-full border px-4 py-2 text-left text-[13px] font-bold transition",
                selected
                  ? "border-[var(--ink)] bg-[var(--yellow)] text-[var(--ink)]"
                  : "border-[var(--ink)] bg-white text-[var(--ink)] hover:bg-[var(--panel-soft)]",
              )}
            >
              <span className="block">{option.label}</span>
              <span className="mt-0.5 block text-[11px] font-medium opacity-80">
                {option.description}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
