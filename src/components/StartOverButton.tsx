"use client";

import { useState } from "react";
import { RotateCcw } from "lucide-react";
import { useStudio } from "@/lib/studio-context";

export function StartOverButton() {
  const {
    resetProject,
    video,
    photos,
    introThumbnailUrl,
    thumbnailMembers,
  } = useStudio();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const askStartOver = () => {
    setConfirmOpen(true);
  };

  const confirmStartOver = () => {
    resetProject();
    setConfirmOpen(false);
  };

  const hasWork =
    Boolean(video) ||
    photos.some((p) => p.url || p.name.trim() || p.title.trim()) ||
    Boolean(introThumbnailUrl) ||
    thumbnailMembers.some(
      (m) => m.photoUrl || m.name.trim() || m.title.trim(),
    );

  return (
    <>
      <button
        type="button"
        onClick={askStartOver}
        className="inline-flex items-center gap-1.5 rounded-[var(--radius-sm)] border border-[var(--ink)] bg-[var(--yellow)] px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--ink)] transition hover:bg-[var(--yellow-bright)]"
        aria-haspopup="dialog"
      >
        <RotateCcw className="h-3.5 w-3.5" />
        Start over
      </button>

      {confirmOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="start-over-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) setConfirmOpen(false);
          }}
        >
          <div className="w-full max-w-md rounded-[var(--radius-lg)] border border-[var(--ink)] bg-white p-5 shadow-[var(--elevate)]">
            <h2
              id="start-over-title"
              className="font-display text-xl font-semibold tracking-tight text-[var(--ink)]"
            >
              Start over?
            </h2>
            <p className="mt-2.5 text-[15px] font-medium text-[var(--muted)]">
              {hasWork
                ? "This clears your video, team photos, timeline, music settings, and thumbnail from this project. You cannot undo this."
                : "This resets the studio back to a blank project on Step 1."}
            </p>
            <div className="mt-5 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmOpen(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmStartOver}
                className="btn-primary"
              >
                Yes, clear project
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
