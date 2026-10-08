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
        className="inline-flex items-center gap-2 rounded-xl border-2 border-[var(--ink)] bg-[var(--yellow)] px-3 py-2 text-sm font-extrabold uppercase tracking-wide text-[var(--ink)] shadow-sm transition hover:bg-[var(--yellow-bright)]"
        aria-haspopup="dialog"
      >
        <RotateCcw className="h-4 w-4" />
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
          <div className="w-full max-w-md rounded-2xl border-2 border-[var(--ink)] bg-white p-5 shadow-xl">
            <h2
              id="start-over-title"
              className="text-2xl font-bold text-[var(--ink)]"
            >
              Start over?
            </h2>
            <p className="mt-3 text-lg text-[var(--muted)]">
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
