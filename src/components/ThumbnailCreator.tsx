"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Clapperboard,
  Download,
  GripVertical,
  ImagePlus,
  Trash2,
  Wand2,
} from "lucide-react";
import { v4 as uuid } from "uuid";
import { HelpTip } from "@/components/HelpTip";
import { PhotoFrameEditor } from "@/components/PhotoFrameEditor";
import { TeamSizePicker } from "@/components/TeamSizePicker";
import {
  exportTeamThumbnailPng,
  renderTeamThumbnail,
} from "@/lib/render-thumbnail";
import { useStudio } from "@/lib/studio-context";
import {
  THUMBNAIL_TEMPLATE,
  defaultPhotoFit,
  type ThumbnailMember,
} from "@/lib/thumbnail-template";
import {
  clearThumbnailMembers,
  emptyThumbnailMembers,
} from "@/lib/thumbnail-members";

const SLOT_DRAG_TYPE = "application/x-loves-thumb-slot";

export function ThumbnailCreator({
  onAddedToVideo,
}: {
  onAddedToVideo?: () => void;
} = {}) {
  const {
    teamMemberCount,
    setTeamMemberCount,
    setIntroThumbnail,
    clearIntroThumbnail,
    introThumbnailEnabled,
    introThumbnailUrl,
    thumbnailMembers: members,
    setThumbnailMembers: setMembers,
  } = useStudio();

  // Thumbnails need at least one card — bump "Just me" up to 1.
  useEffect(() => {
    if (teamMemberCount === 0) setTeamMemberCount(1);
  }, [teamMemberCount, setTeamMemberCount]);

  const slotCount = Math.max(1, teamMemberCount) as 1 | 2 | 3 | 4;

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [dragFromIndex, setDragFromIndex] = useState<number | null>(null);
  const [dropTargetIndex, setDropTargetIndex] = useState<number | null>(null);
  const fileRefs = useRef<Array<HTMLInputElement | null>>([]);

  const filledCount = useMemo(
    () => members.filter((m) => m.photoUrl || m.name.trim() || m.title.trim()).length,
    [members],
  );

  useEffect(() => {
    let cancelled = false;
    const timer = window.setTimeout(() => {
      void (async () => {
        try {
          const canvas = await renderTeamThumbnail(members);
          if (cancelled) return;
          const url = canvas.toDataURL("image/png");
          setPreviewUrl(url);
        } catch (e) {
          if (!cancelled) {
            setError(
              e instanceof Error ? e.message : "Could not update thumbnail preview.",
            );
          }
        }
      })();
    }, 200);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [members]);

  const updateMember = (id: string, patch: Partial<ThumbnailMember>) => {
    setMembers((prev) => prev.map((m) => (m.id === id ? { ...m, ...patch } : m)));
  };

  const clearSlotDrag = () => {
    setDragFromIndex(null);
    setDropTargetIndex(null);
  };

  const reorderMembers = (fromIndex: number, toIndex: number) => {
    if (
      fromIndex === toIndex ||
      fromIndex < 0 ||
      toIndex < 0 ||
      fromIndex >= members.length ||
      toIndex >= members.length
    ) {
      return;
    }
    setMembers((prev) => {
      const next = [...prev];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next;
    });
  };

  const onPickPhoto = async (id: string, file: File | undefined) => {
    if (!file) return;
    setError(null);
    setStatus(null);
    if (
      !/^image\/(jpeg|png|webp)$/i.test(file.type) &&
      !/\.(jpe?g|png|webp)$/i.test(file.name)
    ) {
      setError("Please upload a JPG, PNG, or WebP headshot.");
      return;
    }
    const url = URL.createObjectURL(file);
    setMembers((prev) =>
      prev.map((m) => {
        if (m.id !== id) return m;
        if (m.photoUrl) URL.revokeObjectURL(m.photoUrl);
        const guessed = file.name.replace(/\.[^.]+$/, "").replace(/[-_]/g, " ");
        return {
          ...m,
          photoUrl: url,
          name: m.name || guessed,
          photoFit: defaultPhotoFit(),
        };
      }),
    );
  };

  const clearPhoto = (id: string) => {
    setMembers((prev) =>
      prev.map((m) => {
        if (m.id !== id) return m;
        if (m.photoUrl) URL.revokeObjectURL(m.photoUrl);
        return { ...m, photoUrl: null, photoFit: defaultPhotoFit() };
      }),
    );
  };

  const loadPractice = async () => {
    setBusy(true);
    setError(null);
    setStatus(null);
    try {
      const samples = [
        { path: "/samples/team-jared.jpg", name: "Jared Thueson", title: "Total Truck Care" },
        {
          path: "/samples/team-bailey.jpg",
          name: "Bailey Ledbetter",
          title: "Area Account Manager",
        },
        { path: "/samples/team-jared.jpg", name: "Josh Bell", title: "Regional Account Manager" },
        {
          path: "/samples/team-teresa.jpg",
          name: "Teresa Walker",
          title: "Fleet Account Specialist",
        },
      ].slice(0, slotCount);
      const next: ThumbnailMember[] = [];
      for (const sample of samples) {
        const res = await fetch(sample.path);
        if (!res.ok) throw new Error("Practice photos are missing.");
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        next.push({
          id: uuid(),
          photoUrl: url,
          name: sample.name,
          title: sample.title,
          photoFit: defaultPhotoFit(),
        });
      }
      setMembers((prev) => {
        prev.forEach((m) => {
          if (m.photoUrl) URL.revokeObjectURL(m.photoUrl);
        });
        return next;
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load practice team.");
    } finally {
      setBusy(false);
    }
  };

  const hasContent = () =>
    members.some((m) => m.photoUrl || m.name.trim() || m.title.trim());

  const download = async () => {
    setBusy(true);
    setError(null);
    setStatus(null);
    try {
      if (!hasContent()) {
        throw new Error("Add at least one teammate photo or name first.");
      }
      const blob = await exportTeamThumbnailPng(members);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "loves-team-thumbnail.png";
      a.click();
      URL.revokeObjectURL(url);
      setStatus("PNG downloaded. You can also add it to the start of your video.");
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
        throw new Error("Add at least one teammate photo or name first.");
      }
      const blob = await exportTeamThumbnailPng(members);
      const url = URL.createObjectURL(blob);
      setIntroThumbnail(url, true);
      setStatus(
        `Added to your intro video. It will show for ${THUMBNAIL_TEMPLATE.introDurationSeconds} second at the very start, then disappear. Open Team intro video → Step 3 to turn it on or off.`,
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
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="max-w-3xl">
          <h2 className="font-display text-4xl tracking-wide text-[var(--ink)] md:text-5xl">
            Create a Love&apos;s Team thumbnail
          </h2>
          <p className="mt-3 text-lg text-[var(--muted)] md:text-xl">
            Build a Love&apos;s red, yellow, and orange team image for{" "}
            {slotCount} people, then optionally place it at the very start of
            your intro video for one quick second.
          </p>
        </div>
        <HelpTip title="Thumbnail help" size="lg">
          <p>
            <strong>Why make a thumbnail?</strong> Customers see a clear
            &quot;Love&apos;s Team&quot; card the moment they press play — then
            it vanishes after one second so your talking video takes over.
          </p>
          <p>
            <strong>Where it goes:</strong> Optional opening frame of your Allego
            intro video (first {THUMBNAIL_TEMPLATE.introDurationSeconds} second
            only). You can also download a PNG for Allego or email.
          </p>
          <p>
            <strong>How:</strong> Pick team size (1–4) → add headshots →
            drag/zoom faces → type names → preview → Add to video or Download PNG.
          </p>
        </HelpTip>
      </div>

      <TeamSizePicker compact />

      {/* Purpose */}
      <section className="rounded-2xl border-2 border-[var(--ink)] bg-[var(--panel-soft)] p-4 md:p-5">
        <h3 className="text-2xl font-bold text-[var(--ink)]">
          Why this thumbnail matters
        </h3>
        <ul className="mt-3 list-disc space-y-2 pl-6 text-lg text-[var(--ink)]">
          <li>
            It introduces your team visually before you start speaking — helpful
            in Allego digital sales rooms.
          </li>
          <li>
            In the video, it appears at the <strong>very beginning</strong> for{" "}
            <strong>only {THUMBNAIL_TEMPLATE.introDurationSeconds} second</strong>,
            then disappears so customers get into your intro quickly.
          </li>
          <li>
            Using a thumbnail is <strong>optional</strong>. Skip it anytime if
            you only want the talking video.
          </li>
        </ul>
      </section>

      {/* How to */}
      <section className="rounded-2xl border-2 border-[var(--ink)] bg-white p-4 md:p-5">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <h3 className="text-2xl font-bold text-[var(--ink)]">
            How to use this tool
          </h3>
          <HelpTip title="Step-by-step">
            <p>Follow the numbered steps on this page. Tap any yellow ? for more help.</p>
          </HelpTip>
        </div>
        <ol className="mt-3 list-decimal space-y-2 pl-6 text-lg text-[var(--ink)]">
          <li>
            Tap <strong>Add headshot</strong> on each teammate card (1–4 people).
          </li>
          <li>
            <strong>Drag</strong> the grip (or use ↑ ↓) to set left-to-right
            order on the thumbnail.
          </li>
          <li>
            <strong>Drag</strong> the photo to center the face. Use the{" "}
            <strong>Size</strong> slider if the face is too small or too large.
          </li>
          <li>
            Type each person&apos;s <strong>Name</strong> and{" "}
            <strong>Job title</strong>.
          </li>
          <li>
            Check the <strong>live preview</strong> on the right / below.
          </li>
          <li>
            Tap <strong>Add to start of video</strong> (shows for 1 second when
            someone presses play) and/or <strong>Download PNG</strong>.
          </li>
        </ol>
      </section>

      <div className="how-banner">
        Tip: Use clear, well-lit head-and-shoulders photos. Drag the grip to
        reorder people, then drag and zoom until faces sit nicely in the tall
        portrait frames.
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => void loadPractice()}
          disabled={busy}
          className="btn-yellow"
        >
          <Wand2 className="h-5 w-5" />
          {busy ? "Loading…" : "Load practice team"}
        </button>
        <button
          type="button"
          onClick={() => {
            setMembers((prev) => {
              clearThumbnailMembers(prev);
              return emptyThumbnailMembers(slotCount);
            });
            setStatus(null);
          }}
          className="btn-secondary"
        >
          Clear all
        </button>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {members.map((member, index) => {
          const isDragging = dragFromIndex === index;
          const isDropTarget =
            dropTargetIndex === index &&
            dragFromIndex !== null &&
            dragFromIndex !== index;
          return (
          <article
            key={member.id}
            onDragOver={(e) => {
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
              if (!e.dataTransfer.types.includes(SLOT_DRAG_TYPE)) return;
              e.preventDefault();
              const raw = e.dataTransfer.getData(SLOT_DRAG_TYPE);
              const from = Number.parseInt(raw, 10);
              if (!Number.isNaN(from)) {
                reorderMembers(from, index);
              }
              clearSlotDrag();
            }}
            className={`rounded-2xl border-2 bg-white p-4 transition ${
              isDragging
                ? "border-[var(--primary)] opacity-60"
                : isDropTarget
                  ? "border-[var(--primary)] bg-[var(--yellow)]/30 ring-2 ring-[var(--primary)]"
                  : "border-[var(--ink)]"
            }`}
          >
            <div className="mb-3 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  draggable
                  aria-label={`Drag to reorder teammate ${index + 1}`}
                  title="Drag to reorder"
                  onDragStart={(e) => {
                    e.dataTransfer.setData(SLOT_DRAG_TYPE, String(index));
                    e.dataTransfer.effectAllowed = "move";
                    setDragFromIndex(index);
                  }}
                  onDragEnd={clearSlotDrag}
                  className="flex h-10 w-10 cursor-grab items-center justify-center rounded-lg border-2 border-[var(--ink)] bg-[var(--panel-soft)] text-[var(--ink)] active:cursor-grabbing"
                >
                  <GripVertical className="h-5 w-5" />
                </button>
                <div className="flex flex-col gap-1">
                  <button
                    type="button"
                    aria-label={`Move teammate ${index + 1} up`}
                    disabled={index === 0}
                    onClick={() => reorderMembers(index, index - 1)}
                    className="flex h-8 w-9 items-center justify-center rounded-md border-2 border-[var(--ink)] bg-white text-[var(--ink)] disabled:cursor-not-allowed disabled:opacity-35"
                  >
                    <ChevronUp className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    aria-label={`Move teammate ${index + 1} down`}
                    disabled={index >= members.length - 1}
                    onClick={() => reorderMembers(index, index + 1)}
                    className="flex h-8 w-9 items-center justify-center rounded-md border-2 border-[var(--ink)] bg-white text-[var(--ink)] disabled:cursor-not-allowed disabled:opacity-35"
                  >
                    <ChevronDown className="h-4 w-4" />
                  </button>
                </div>
                <p className="text-lg font-bold text-[var(--ink)]">
                  Teammate {index + 1}
                </p>
              </div>
              <HelpTip title={`Teammate ${index + 1}`}>
                <p>Upload a headshot, then drag and zoom so the face fills the tall frame.</p>
                <p>Drag the grip or use ↑ ↓ to change left-to-right order.</p>
                <p>Leave a card empty if you have fewer than four people.</p>
              </HelpTip>
            </div>

            <div className="grid gap-4 sm:grid-cols-[auto_1fr]">
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => fileRefs.current[index]?.click()}
                  className="relative flex h-28 w-full items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-[var(--ink)] bg-[#eef1f6] sm:w-40"
                >
                  {member.photoUrl ? (
                    <span className="text-sm font-semibold text-[var(--ink)]">
                      Change photo
                    </span>
                  ) : (
                    <span className="flex flex-col items-center gap-2 px-2 text-center text-sm font-semibold text-[var(--ink)]">
                      <ImagePlus className="h-6 w-6 text-[var(--primary)]" />
                      Add headshot
                    </span>
                  )}
                </button>
                <input
                  ref={(el) => {
                    fileRefs.current[index] = el;
                  }}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
                  className="hidden"
                  onChange={(e) => {
                    void onPickPhoto(member.id, e.target.files?.[0]);
                    e.currentTarget.value = "";
                  }}
                />

                {member.photoUrl ? (
                  <PhotoFrameEditor
                    photoUrl={member.photoUrl}
                    fit={member.photoFit}
                    onChange={(photoFit) => updateMember(member.id, { photoFit })}
                  />
                ) : null}
              </div>

              <div className="min-w-0 space-y-3">
                <label className="block">
                  <span className="field-label">Name</span>
                  <input
                    className="field-input"
                    value={member.name}
                    placeholder="Example: Jared Thueson"
                    onChange={(e) =>
                      updateMember(member.id, { name: e.target.value })
                    }
                  />
                </label>
                <label className="block">
                  <span className="field-label">Job title</span>
                  <input
                    className="field-input"
                    value={member.title}
                    placeholder="Example: Total Truck Care"
                    onChange={(e) =>
                      updateMember(member.id, { title: e.target.value })
                    }
                  />
                </label>
                {member.photoUrl ? (
                  <button
                    type="button"
                    onClick={() => clearPhoto(member.id)}
                    className="inline-flex items-center gap-2 text-base font-semibold text-[var(--primary)]"
                  >
                    <Trash2 className="h-4 w-4" /> Remove photo
                  </button>
                ) : null}
              </div>
            </div>
          </article>
          );
        })}
      </div>

      <section className="rounded-2xl border-2 border-[var(--ink)] bg-white p-4 md:p-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-2xl font-bold text-[var(--ink)]">
              Live thumbnail preview
            </h3>
            <p className="text-base text-[var(--muted)]">
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
            intro video. You can turn that off in Step 3.
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

        <p className="mt-4 text-base text-[var(--muted)] md:text-lg">
          <strong>Add to start of video</strong> places this image as an optional
          opening card ({THUMBNAIL_TEMPLATE.introDurationSeconds}s).{" "}
          <strong>Download PNG</strong> saves a still image for Allego or email.
        </p>
      </section>
    </div>
  );
}
