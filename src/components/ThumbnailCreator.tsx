"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Clapperboard,
  Download,
  GripVertical,
  RotateCcw,
} from "lucide-react";
import { HelpTip } from "@/components/HelpTip";
import { PhotoFrameEditor } from "@/components/PhotoFrameEditor";
import {
  exportTeamThumbnailPng,
  renderTeamThumbnail,
} from "@/lib/render-thumbnail";
import { useStudio } from "@/lib/studio-context";
import {
  SPEAKER_THUMBNAIL_ID,
  THUMBNAIL_TEMPLATE,
  defaultPhotoFit,
  type ThumbnailMember,
} from "@/lib/thumbnail-template";

const SLOT_DRAG_TYPE = "application/x-loves-thumb-slot";

export function ThumbnailCreator({
  onAddedToVideo,
}: {
  onAddedToVideo?: () => void;
} = {}) {
  const {
    teamMemberCount,
    photos: rosterPhotos,
    reorderTeamSlots,
    speakerName,
    speakerTitle,
    speakerPhotoUrl,
    setIntroThumbnail,
    clearIntroThumbnail,
    introThumbnailEnabled,
    introThumbnailUrl,
    thumbnailMembers: members,
    setThumbnailMembers: setMembers,
  } = useStudio();

  const slotCount = Math.min(
    THUMBNAIL_TEMPLATE.maxMembers,
    1 + teamMemberCount,
  );
  const rosterKey = rosterPhotos
    .map((p) => `${p.id}\0${p.url ?? ""}\0${p.name}\0${p.title}`)
    .join("|");
  const speakerKey = `${speakerPhotoUrl ?? ""}\0${speakerName}\0${speakerTitle}`;

  // Speaker first (featured), then roster teammates by id. Speaker is never a
  // script teammate line — only appears on the thumbnail + opening self-intro.
  useEffect(() => {
    setMembers((prev) => {
      const fitById = new Map(prev.map((m) => [m.id, m.photoFit]));
      const speaker: ThumbnailMember = {
        id: SPEAKER_THUMBNAIL_ID,
        photoUrl: speakerPhotoUrl,
        name: speakerName,
        title: speakerTitle,
        photoFit: fitById.get(SPEAKER_THUMBNAIL_ID) ?? defaultPhotoFit(),
      };
      const teammates = rosterPhotos.map(
        (photo) =>
          ({
            id: photo.id,
            photoUrl: photo.url,
            name: photo.name,
            title: photo.title,
            photoFit: fitById.get(photo.id) ?? defaultPhotoFit(),
          }) satisfies ThumbnailMember,
      );
      return [speaker, ...teammates];
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- sync on roster/speaker keys
  }, [rosterKey, speakerKey, setMembers]);

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [dragFromIndex, setDragFromIndex] = useState<number | null>(null);
  const [dropTargetIndex, setDropTargetIndex] = useState<number | null>(null);

  const filledCount = useMemo(
    () =>
      members.filter((m) => m.photoUrl || m.name.trim() || m.title.trim())
        .length,
    [members],
  );

  const membersKey = members
    .map(
      (m) =>
        `${m.id}\0${m.photoUrl ?? ""}\0${m.name}\0${m.title}\0${m.photoFit.scale}\0${m.photoFit.focusX}\0${m.photoFit.focusY}`,
    )
    .join("|");

  useEffect(() => {
    let cancelled = false;
    const timer = window.setTimeout(() => {
      void (async () => {
        try {
          const canvas = await renderTeamThumbnail(members);
          if (cancelled) return;
          setPreviewUrl(canvas.toDataURL("image/png"));
          setError(null);
        } catch (e) {
          if (!cancelled) {
            setError(
              e instanceof Error
                ? e.message
                : "Could not update thumbnail preview.",
            );
          }
        }
      })();
    }, 200);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [membersKey]);

  const updateFit = (id: string, photoFit: ThumbnailMember["photoFit"]) => {
    setMembers((prev) =>
      prev.map((m) => (m.id === id ? { ...m, photoFit } : m)),
    );
  };

  const clearSlotDrag = () => {
    setDragFromIndex(null);
    setDropTargetIndex(null);
  };

  /**
   * Reorder teammate cards only (indices 1+). Speaker stays featured first and
   * is never moved into the script teammate roster.
   */
  const reorderMembers = (fromIndex: number, toIndex: number) => {
    if (fromIndex === 0 || toIndex === 0) return;
    reorderTeamSlots(fromIndex - 1, toIndex - 1);
  };

  const resetFraming = () => {
    setMembers((prev) =>
      prev.map((m) => ({ ...m, photoFit: defaultPhotoFit() })),
    );
    setStatus("Face framing reset. Drag and zoom again if needed.");
    setError(null);
  };

  const hasContent = () =>
    members.some((m) => m.photoUrl || m.name.trim() || m.title.trim());

  const download = async () => {
    setBusy(true);
    setError(null);
    setStatus(null);
    try {
      if (!hasContent()) {
        throw new Error(
          "Add your photo and name above, and teammate photos if you have them.",
        );
      }
      const blob = await exportTeamThumbnailPng(members);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "loves-team-thumbnail.png";
      a.click();
      URL.revokeObjectURL(url);
      setStatus(
        "PNG downloaded. You can also add it to the start of your video.",
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not download thumbnail.");
    } finally {
      setBusy(false);
    }
  };

  const addToVideo = async () => {
    setBusy(true);
    setError(null);
    setStatus(null);
    try {
      if (!hasContent()) {
        throw new Error(
          "Add your photo and name above, and teammate photos if you have them.",
        );
      }
      const blob = await exportTeamThumbnailPng(members);
      const url = URL.createObjectURL(blob);
      setIntroThumbnail(url, true);
      setStatus(
        `Added as a ${THUMBNAIL_TEMPLATE.introDurationSeconds}-second opener at the start of your video. You can turn it on or off in Step 2.`,
      );
      onAddedToVideo?.();
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Could not add thumbnail to the video.",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="section-card space-y-4 bg-white p-4 md:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="max-w-3xl">
          <h3 className="text-lg font-semibold tracking-tight text-[var(--ink)]">
            Love&apos;s Team thumbnail
          </h3>
          <p className="mt-0.5 max-w-2xl text-[13px] font-medium text-[var(--muted)]">
            Optional · you first, then teammates ·{" "}
            {THUMBNAIL_TEMPLATE.introDurationSeconds}s video opener or download
            PNG. Your card uses Your introduction above — not a script teammate
            line.
          </p>
        </div>
        <HelpTip title="Thumbnail help" size="lg">
          <p>
            The first card is <strong>you</strong> (featured photo, name, and
            title from Your introduction). Extra cards come from{" "}
            <strong>Your teammates</strong>.
          </p>
          <p>
            You are only introduced once in the script opening — the thumbnail
            can still show your photo with the team.
          </p>
          <p>
            Optional Allego opener: shows for{" "}
            {THUMBNAIL_TEMPLATE.introDurationSeconds}s then your talking video
            continues.
          </p>
        </HelpTip>
      </div>

      {filledCount === 0 ? (
        <div className="how-banner">
          Add your name, title, and featured photo in{" "}
          <strong>Your introduction</strong>
          {teamMemberCount > 0 ? (
            <>
              {" "}
              and teammates in <strong>Your teammates</strong>
            </>
          ) : null}{" "}
          — they show up here for framing.
        </div>
      ) : (
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={resetFraming}
            disabled={busy}
            className="btn-secondary"
          >
            <RotateCcw className="h-5 w-5" />
            Reset face framing
          </button>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        {members.map((member, index) => {
          const isSpeaker = member.id === SPEAKER_THUMBNAIL_ID;
          const isDragging = dragFromIndex === index;
          const isDropTarget =
            dropTargetIndex === index &&
            dragFromIndex !== null &&
            dragFromIndex !== index &&
            !isSpeaker;
          const label =
            member.name.trim() ||
            (isSpeaker ? "You (featured)" : `Teammate ${index}`);
          return (
            <article
              key={member.id}
              onDragOver={(e) => {
                if (isSpeaker) return;
                if (!e.dataTransfer.types.includes(SLOT_DRAG_TYPE)) return;
                e.preventDefault();
                e.dataTransfer.dropEffect = "move";
                setDropTargetIndex(index);
              }}
              onDragLeave={(e) => {
                if (e.currentTarget.contains(e.relatedTarget as Node)) return;
                setDropTargetIndex((current) =>
                  current === index ? null : current,
                );
              }}
              onDrop={(e) => {
                if (isSpeaker) return;
                if (!e.dataTransfer.types.includes(SLOT_DRAG_TYPE)) return;
                e.preventDefault();
                const raw = e.dataTransfer.getData(SLOT_DRAG_TYPE);
                const from = Number.parseInt(raw, 10);
                if (!Number.isNaN(from)) {
                  reorderMembers(from, index);
                }
                clearSlotDrag();
              }}
              className={`rounded-[var(--radius-md)] border bg-[var(--panel-soft)] p-4 transition ${
                isDragging
                  ? "border-[var(--primary)] opacity-60"
                  : isDropTarget
                    ? "border-[var(--primary)] bg-[var(--yellow)]/30 ring-2 ring-[var(--primary)]"
                    : isSpeaker
                      ? "border-[var(--primary)]"
                      : "border-[var(--ink)]"
              }`}
            >
              <div className="mb-3 flex items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2">
                  {isSpeaker ? (
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border-2 border-[var(--primary)] bg-[var(--yellow)] text-[11px] font-bold text-[var(--ink)]">
                      You
                    </div>
                  ) : (
                    <>
                      <button
                        type="button"
                        draggable
                        aria-label={`Drag to reorder ${label}`}
                        title="Drag to reorder"
                        onDragStart={(e) => {
                          e.dataTransfer.setData(SLOT_DRAG_TYPE, String(index));
                          e.dataTransfer.effectAllowed = "move";
                          setDragFromIndex(index);
                        }}
                        onDragEnd={clearSlotDrag}
                        className="flex h-10 w-10 shrink-0 cursor-grab items-center justify-center rounded-lg border-2 border-[var(--ink)] bg-white text-[var(--ink)] active:cursor-grabbing"
                      >
                        <GripVertical className="h-5 w-5" />
                      </button>
                      <div className="flex flex-col gap-1">
                        <button
                          type="button"
                          aria-label={`Move ${label} up`}
                          disabled={index <= 1}
                          onClick={() => reorderMembers(index, index - 1)}
                          className="flex h-8 w-9 items-center justify-center rounded-md border-2 border-[var(--ink)] bg-white text-[var(--ink)] disabled:cursor-not-allowed disabled:opacity-35"
                        >
                          <ChevronUp className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          aria-label={`Move ${label} down`}
                          disabled={index >= members.length - 1}
                          onClick={() => reorderMembers(index, index + 1)}
                          className="flex h-8 w-9 items-center justify-center rounded-md border-2 border-[var(--ink)] bg-white text-[var(--ink)] disabled:cursor-not-allowed disabled:opacity-35"
                        >
                          <ChevronDown className="h-4 w-4" />
                        </button>
                      </div>
                    </>
                  )}
                  <div className="min-w-0">
                    <p className="truncate text-[15px] font-bold text-[var(--ink)]">
                      {label}
                    </p>
                    <p className="truncate text-[13px] font-medium text-[var(--muted)]">
                      {member.title.trim() ||
                        (isSpeaker
                          ? "Job title from Your introduction"
                          : "Job title from Your teammates")}
                    </p>
                  </div>
                </div>
                <HelpTip title={label}>
                  {isSpeaker ? (
                    <>
                      <p>
                        Your featured card for the thumbnail. Name, title, and
                        photo come from Your introduction.
                      </p>
                      <p>
                        This does not add a second intro line in the script —
                        you already introduce yourself at the start.
                      </p>
                    </>
                  ) : (
                    <>
                      <p>
                        Name and title come from Your teammates. Drag or zoom
                        the face so it fills the tall frame.
                      </p>
                      <p>
                        Use the grip or ↑ ↓ for left-to-right thumbnail order.
                      </p>
                    </>
                  )}
                </HelpTip>
              </div>

              {member.photoUrl ? (
                <PhotoFrameEditor
                  photoUrl={member.photoUrl}
                  fit={member.photoFit}
                  onChange={(photoFit) => updateFit(member.id, photoFit)}
                />
              ) : (
                <div className="rounded-xl border-2 border-dashed border-[var(--ink)] bg-white px-3 py-6 text-center text-[14px] font-medium text-[var(--muted)]">
                  {isSpeaker ? (
                    <>
                      Add your featured photo in{" "}
                      <strong className="text-[var(--ink)]">
                        Your introduction
                      </strong>{" "}
                      above.
                    </>
                  ) : (
                    <>
                      Add a headshot for this person in{" "}
                      <strong className="text-[var(--ink)]">
                        Your teammates
                      </strong>{" "}
                      above.
                    </>
                  )}
                </div>
              )}
            </article>
          );
        })}
      </div>

      <div className="rounded-[var(--radius-md)] border border-[var(--hairline)] bg-[var(--panel-soft)] p-4 md:p-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h4 className="text-lg font-bold text-[var(--ink)]">
              Live thumbnail preview
            </h4>
            <p className="text-[13px] font-medium text-[var(--muted)]">
              Love&apos;s red / yellow / orange frame · {filledCount || 0} of{" "}
              {slotCount} people · {THUMBNAIL_TEMPLATE.width}×
              {THUMBNAIL_TEMPLATE.height}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={() => void addToVideo()}
              className="btn-primary"
            >
              <Clapperboard className="h-5 w-5" />
              {busy ? "Working…" : "Add to start of video"}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => void download()}
              className="btn-secondary"
            >
              <Download className="h-5 w-5" />
              Download PNG
            </button>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border-2 border-[var(--ink)] bg-[#f4f5f7]">
          {previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={previewUrl}
              alt="Love's Team thumbnail preview"
              className="w-full"
            />
          ) : (
            <div className="flex aspect-video items-center justify-center text-lg text-[var(--muted)]">
              Preview will appear here
            </div>
          )}
        </div>

        {introThumbnailUrl && introThumbnailEnabled ? (
          <p className="mt-4 rounded-xl border-2 border-[var(--ink)] bg-[var(--yellow)] px-4 py-3 text-lg font-medium text-[var(--ink)]">
            This thumbnail is set to play for{" "}
            {THUMBNAIL_TEMPLATE.introDurationSeconds} second at the start of your
            intro video. You can turn that off in Step 2.
            <button
              type="button"
              className="ml-2 underline"
              onClick={() => {
                clearIntroThumbnail();
                setStatus("Opening thumbnail removed from the video.");
              }}
            >
              Remove from video
            </button>
          </p>
        ) : null}

        {status ? (
          <p className="mt-4 rounded-xl border-2 border-[var(--ink)] bg-[#e8f5e9] px-4 py-3 text-lg font-medium text-[var(--ink)]">
            {status}
          </p>
        ) : null}

        {error ? (
          <p className="mt-4 rounded-xl border-2 border-[var(--primary)] bg-red-50 px-4 py-3 text-lg font-medium text-[var(--primary-dark)]">
            {error}
          </p>
        ) : null}

        <p className="mt-4 text-[13px] font-medium text-[var(--muted)] md:text-[14px]">
          <strong>Add to start of video</strong> places this image as an optional
          opening card ({THUMBNAIL_TEMPLATE.introDurationSeconds}s).{" "}
          <strong>Download PNG</strong> saves a still image for Allego or email.
        </p>
      </div>
    </section>
  );
}
