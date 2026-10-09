"use client";

import { useRef, useState } from "react";
import { ImagePlus, PenLine, Trash2 } from "lucide-react";
import { HelpTip } from "@/components/HelpTip";
import { JobTitleField } from "@/components/JobTitleField";
import { defaultDutiesForTitle } from "@/lib/job-titles";
import { useStudio } from "@/lib/studio-context";

/** Fill-in blanks for teleprompter placeholders like [Customer Name]. */
export function ScriptFillIns() {
  const {
    customerName,
    setCustomerName,
    speakerName,
    setSpeakerName,
    speakerTitle,
    setSpeakerTitle,
    speakerDuties,
    setSpeakerDuties,
    speakerPhotoUrl,
    setSpeakerPhotoFromFile,
    clearSpeakerPhoto,
  } = useStudio();
  const photoRef = useRef<HTMLInputElement>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [photoBusy, setPhotoBusy] = useState(false);

  const handleSpeakerTitle = (title: string) => {
    const suggested = defaultDutiesForTitle(title);
    const priorDefault = defaultDutiesForTitle(speakerTitle);
    const dutiesStillDefault =
      !speakerDuties.trim() || speakerDuties.trim() === priorDefault;
    setSpeakerTitle(title);
    if (dutiesStillDefault && suggested) {
      setSpeakerDuties(suggested);
    }
  };

  const handlePhoto = async (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    setPhotoBusy(true);
    setPhotoError(null);
    try {
      await setSpeakerPhotoFromFile(file);
    } catch (e) {
      setPhotoError(
        e instanceof Error ? e.message : "Could not use that photo.",
      );
    } finally {
      setPhotoBusy(false);
      if (photoRef.current) photoRef.current.value = "";
    }
  };

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
              Your introduction
            </h3>
            <p className="mt-0.5 max-w-2xl text-[13px] font-medium text-[var(--muted)]">
              Fills the opening of the teleprompter script — you introduce
              yourself here. Teammates are introduced separately below.
            </p>
          </div>
        </div>
        <HelpTip title="Your introduction">
          <p>
            <strong>Customer name</strong> fills every “[Customer Name]” in the
            script.
          </p>
          <p>
            <strong>Your name, title, and duties</strong> fill the opening
            self-intro only — you are not listed again as a teammate in the
            script.
          </p>
          <p>
            <strong>Featured photo</strong> is optional for the Love&apos;s Team
            thumbnail opener. It does not add you to the teammate photo
            overlays.
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

      <div className="grid gap-3 md:grid-cols-2">
        <div>
          <JobTitleField
            id="speaker-job-title"
            value={speakerTitle}
            onChange={handleSpeakerTitle}
          />
        </div>
        <label className="block">
          <span className="field-label">Your job duties (for script)</span>
          <input
            value={speakerDuties}
            onChange={(e) => setSpeakerDuties(e.target.value)}
            className="field-input"
            placeholder="Example: fuel programs, pricing, and fleet support"
            autoComplete="off"
          />
        </label>
      </div>

      <div className="rounded-[var(--radius-md)] border border-[var(--hairline)] bg-[var(--panel-soft)] p-3 md:p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[15px] font-bold text-[var(--ink)]">
              Featured photo for thumbnail
            </p>
            <p className="mt-0.5 text-[13px] font-medium text-[var(--muted)]">
              Optional · appears on the team thumbnail with your name and title
              — not as a script teammate line
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={photoBusy}
              onClick={() => photoRef.current?.click()}
              className="btn-secondary"
            >
              <ImagePlus className="h-5 w-5" />
              {photoBusy
                ? "Adding…"
                : speakerPhotoUrl
                  ? "Replace photo"
                  : "Add photo"}
            </button>
            {speakerPhotoUrl ? (
              <button
                type="button"
                onClick={clearSpeakerPhoto}
                className="btn-secondary text-[var(--primary)]"
              >
                <Trash2 className="h-5 w-5" />
                Remove
              </button>
            ) : null}
          </div>
        </div>
        <input
          ref={photoRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
          className="hidden"
          onChange={(e) => void handlePhoto(e.target.files)}
        />
        {speakerPhotoUrl ? (
          <div className="mt-3 flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={speakerPhotoUrl}
              alt=""
              className="h-20 w-16 rounded-lg border-2 border-[var(--ink)] object-cover"
            />
            <p className="text-[13px] font-medium text-[var(--muted)]">
              Frame this face in the thumbnail section below.
            </p>
          </div>
        ) : null}
        {photoError ? (
          <p className="mt-3 text-[14px] font-medium text-[var(--primary-dark)]">
            {photoError}
          </p>
        ) : null}
      </div>
    </section>
  );
}
