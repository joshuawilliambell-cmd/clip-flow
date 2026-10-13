"use client";

import { ScrollText } from "lucide-react";
import { HelpTip } from "@/components/HelpTip";
import {
  SCRIPT_TOPIC_DROPDOWN_OPTIONS,
  getScriptTopic,
  type ScriptTopicId,
} from "@/lib/script-topics";
import { useStudio } from "@/lib/studio-context";

/** Dropdown to pick Team Intro or a product/service script. */
export function ScriptTopicPicker() {
  const { scriptTopic, setScriptTopic } = useStudio();
  const selected = getScriptTopic(scriptTopic);

  return (
    <section className="section-card bg-white p-4 md:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--primary)] text-white">
            <ScrollText className="h-5 w-5" />
          </span>
          <div>
            <h3 className="text-lg font-semibold tracking-tight text-[var(--ink)] md:text-xl">
              Choose Your Script
            </h3>
            <p className="mt-0.5 text-[14px] font-medium text-[var(--muted)]">
              Team Intro first, then product scripts A–Z. Corner photos follow
              the cues in the script you pick.
            </p>
          </div>
        </div>
        <HelpTip title="Choose your script" size="lg">
          <p>
            <strong>Team Intro</strong> is the Fleet Hub welcome where you
            introduce teammates with their photos.
          </p>
          <p>
            Product scripts (LEX, Connect, Truck Care, and more) load a plain
            language talking track and show Love&apos;s website screenshots as
            corner photos when each topic is named — same idea as teammate
            names cueing teammate photos.
          </p>
        </HelpTip>
      </div>

      <label className="mt-4 block">
        <span className="field-label">Script</span>
        <select
          className="field-input mt-1"
          value={scriptTopic}
          onChange={(e) => setScriptTopic(e.target.value as ScriptTopicId)}
          aria-label="Choose your script"
        >
          {SCRIPT_TOPIC_DROPDOWN_OPTIONS.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      <p className="mt-2 text-[13px] font-medium text-[var(--muted)]">
        {selected.description}
      </p>
    </section>
  );
}
