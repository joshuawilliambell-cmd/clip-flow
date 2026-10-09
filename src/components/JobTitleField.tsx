"use client";

import { useState } from "react";
import {
  CUSTOM_JOB_TITLE_VALUE,
  PRESET_JOB_TITLES,
  isPresetJobTitle,
} from "@/lib/job-titles";

type JobTitleFieldProps = {
  value: string;
  onChange: (title: string) => void;
  id?: string;
};

/** Preset job-title dropdown with Other → free text. */
export function JobTitleField({ value, onChange, id }: JobTitleFieldProps) {
  const [forceCustom, setForceCustom] = useState(false);
  const isCustom =
    forceCustom || (!!value && !isPresetJobTitle(value));
  const selectValue = isCustom
    ? CUSTOM_JOB_TITLE_VALUE
    : value && isPresetJobTitle(value)
      ? value
      : "";

  return (
    <div className="space-y-2">
      <label className="block" htmlFor={id}>
        <span className="field-label">Job title</span>
        <select
          id={id}
          value={selectValue}
          onChange={(e) => {
            const next = e.target.value;
            if (next === CUSTOM_JOB_TITLE_VALUE) {
              setForceCustom(true);
              if (isPresetJobTitle(value)) onChange("");
              return;
            }
            setForceCustom(false);
            onChange(next);
          }}
          className="field-input"
        >
          <option value="" disabled>
            Select a job title
          </option>
          {PRESET_JOB_TITLES.map((title) => (
            <option key={title} value={title}>
              {title}
            </option>
          ))}
          <option value={CUSTOM_JOB_TITLE_VALUE}>Other (type your own)</option>
        </select>
      </label>
      {isCustom ? (
        <label className="block">
          <span className="field-label">Custom job title</span>
          <input
            value={isPresetJobTitle(value) ? "" : value}
            onChange={(e) => onChange(e.target.value)}
            className="field-input"
            placeholder="Type the job title"
            autoComplete="off"
          />
        </label>
      ) : null}
    </div>
  );
}
