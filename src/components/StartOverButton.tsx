"use client";

import { useState } from "react";
import { RotateCcw } from "lucide-react";
import { useStudio } from "@/lib/studio-context";

export function StartOverButton() {
  const { resetProject, video, photos, introThumbnailUrl } = useStudio();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const hasWork =
    Boolean(video) ||
    photos.some((p) => p.url || p.name.trim() || p.title.trim()) ||
    Boolean(introThumbnailUrl);

  const askStartOver = () => {
    if (!hasWork) {
      resetProject();
      return;
    }
    setConfirmOpen(true);
  };

  const confirmStartOver = () => {
    resetProject();
    setConfirmOpen(false);
  };

  return (
    <>
      <button
        type="button"
        onClick={askStartOver}
        className="inline-flex items-center gap-2 rounded-xl border-2 border-white/40 bg-white/10 px-3 py-2 text-sm font-bold uppercase tracking-wide text-white transition hover:bg-white/20"
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
        >
          <div className="w-full max-w-md rounded-2xl border-2 border-[var(--ink)] bg-white p-5 shadow-xl">
            <h2
              id="start-over-title"
              className="text-2xl font-bold text-[var(--ink)]"
            >
              Start over?
            </h2>
            <p className="mt-3 text-lg text-[var(--muted)]">
              This clears your video, team photos, timeline, music settings, and
              thumbnail from this project. You cannot undo this.
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
