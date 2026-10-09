"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import {
  CUSTOM_JOB_TITLE_VALUE,
  PRESET_JOB_TITLES,
  isPresetJobTitle,
} from "@/lib/job-titles";
import { clsx } from "clsx";

type JobTitleFieldProps = {
  value: string;
  onChange: (title: string) => void;
  id?: string;
};

/** Preset job-title dropdown with Other → free text. */
export function JobTitleField({ value, onChange, id }: JobTitleFieldProps) {
  const autoId = useId();
  const fieldId = id ?? autoId;
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [forceCustom, setForceCustom] = useState(false);

  const isCustom = forceCustom || (!!value && !isPresetJobTitle(value));
  const displayLabel = isCustom
    ? value.trim()
      ? value
      : "Other (type your own)"
    : value && isPresetJobTitle(value)
      ? value
      : "Select a job title";

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const pick = (next: string) => {
    if (next === CUSTOM_JOB_TITLE_VALUE) {
      setForceCustom(true);
      if (isPresetJobTitle(value)) onChange("");
      setOpen(false);
      return;
    }
    setForceCustom(false);
    onChange(next);
    setOpen(false);
  };

  return (
    <div className="space-y-2" ref={rootRef}>
      <div className="relative block">
        <span className="field-label" id={`${fieldId}-label`}>
          Job title
        </span>
        <button
          type="button"
          id={fieldId}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-labelledby={`${fieldId}-label`}
          onClick={() => setOpen((v) => !v)}
          className={clsx(
            "field-input flex w-full items-center justify-between gap-2 text-left",
            !value && !isCustom && "text-[var(--muted)]",
          )}
        >
          <span className="min-w-0 truncate">{displayLabel}</span>
          <ChevronDown
            className={clsx(
              "h-4 w-4 shrink-0 text-[var(--ink)] transition",
              open && "rotate-180",
            )}
            aria-hidden
          />
        </button>

        {open ? (
          <ul
            role="listbox"
            aria-labelledby={`${fieldId}-label`}
            className="absolute left-0 right-0 top-full z-50 mt-1 max-h-64 overflow-y-auto rounded-[var(--radius-md)] border-2 border-[var(--ink)] bg-white py-1 shadow-xl"
          >
            {PRESET_JOB_TITLES.map((title) => {
              const selected = !isCustom && value === title;
              return (
                <li key={title} role="option" aria-selected={selected}>
                  <button
                    type="button"
                    className={clsx(
                      "flex w-full items-center justify-between gap-2 px-3.5 py-2.5 text-left text-[15px] font-medium",
                      selected
                        ? "bg-[var(--yellow)] text-[var(--ink)]"
                        : "text-[var(--ink)] hover:bg-[var(--panel-soft)]",
                    )}
                    onClick={() => pick(title)}
                  >
                    <span>{title}</span>
                    {selected ? (
                      <Check className="h-4 w-4 shrink-0" aria-hidden />
                    ) : null}
                  </button>
                </li>
              );
            })}
            <li role="option" aria-selected={isCustom}>
              <button
                type="button"
                className={clsx(
                  "flex w-full items-center justify-between gap-2 border-t border-[var(--border)] px-3.5 py-2.5 text-left text-[15px] font-medium",
                  isCustom
                    ? "bg-[var(--yellow)] text-[var(--ink)]"
                    : "text-[var(--ink)] hover:bg-[var(--panel-soft)]",
                )}
                onClick={() => pick(CUSTOM_JOB_TITLE_VALUE)}
              >
                <span>Other (type your own)</span>
                {isCustom ? (
                  <Check className="h-4 w-4 shrink-0" aria-hidden />
                ) : null}
              </button>
            </li>
          </ul>
        ) : null}
      </div>

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
